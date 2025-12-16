import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import { prisma } from '../lib/prisma';
import { config } from '../config/index';

// Store for Yjs documents
const docs = new Map<string, Y.Doc>();
const awarenessMap = new Map<string, awarenessProtocol.Awareness>();

// Message types
const messageSync = 0;
const messageAwareness = 1;

interface UserInfo {
    id: string;
    name: string;
    color: string;
}

function getRandomColor(): string {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getDoc(docName: string): Y.Doc {
    let doc = docs.get(docName);
    if (!doc) {
        doc = new Y.Doc();
        docs.set(docName, doc);

        // Set up persistence - save to DB periodically
        doc.on('update', async () => {
            try {
                // Debounce and save to database
                await saveDocToDatabase(docName, doc!);
            } catch (e) {
                console.error('Failed to save doc:', e);
            }
        });
    }
    return doc;
}

function getAwareness(docName: string, doc: Y.Doc): awarenessProtocol.Awareness {
    let awareness = awarenessMap.get(docName);
    if (!awareness) {
        awareness = new awarenessProtocol.Awareness(doc);
        awarenessMap.set(docName, awareness);
    }
    return awareness;
}

// Debounce save operations
const saveTimeouts = new Map<string, NodeJS.Timeout>();

async function saveDocToDatabase(docName: string, doc: Y.Doc): Promise<void> {
    // Clear existing timeout
    const existingTimeout = saveTimeouts.get(docName);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    // Set new timeout for debounced save
    saveTimeouts.set(docName, setTimeout(async () => {
        try {
            // docName format: "project:projectId:path"
            const parts = docName.split(':');
            if (parts.length < 3) return;

            const projectId = parts[1];
            const path = parts.slice(2).join(':');

            const text = doc.getText('content');
            const content = text.toString();

            await prisma.file.updateMany({
                where: { projectId, path },
                data: { content },
            });
        } catch (e) {
            console.error('Failed to persist doc:', e);
        }
    }, 2000)); // Save after 2 seconds of inactivity
}

async function loadDocFromDatabase(docName: string, doc: Y.Doc): Promise<void> {
    try {
        const parts = docName.split(':');
        if (parts.length < 3) return;

        const projectId = parts[1];
        const path = parts.slice(2).join(':');

        const file = await prisma.file.findUnique({
            where: { projectId_path: { projectId, path } },
        });

        if (file?.content) {
            const text = doc.getText('content');
            if (text.length === 0) {
                text.insert(0, file.content);
            }
        }
    } catch (e) {
        console.error('Failed to load doc from database:', e);
    }
}

export function setupCollaborationServer(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: config.cors.origin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/collab',
    });

    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        let currentDocName: string | null = null;
        let currentDoc: Y.Doc | null = null;
        let currentAwareness: awarenessProtocol.Awareness | null = null;
        let userInfo: UserInfo | null = null;

        socket.on('join-room', async (data: { docName: string; user: { id: string; name: string } }) => {
            const { docName, user } = data;

            // Leave previous room if any
            if (currentDocName) {
                socket.leave(currentDocName);
            }

            currentDocName = docName;
            currentDoc = getDoc(docName);
            currentAwareness = getAwareness(docName, currentDoc);
            userInfo = { ...user, color: getRandomColor() };

            // Load initial content from database if doc is empty
            if (currentDoc.getText('content').length === 0) {
                await loadDocFromDatabase(docName, currentDoc);
            }

            // Join the room
            socket.join(docName);

            // Set up awareness for this client
            const clientId = currentDoc.clientID;
            currentAwareness.setLocalStateField('user', userInfo);

            // Send sync step 1
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.writeSyncStep1(encoder, currentDoc);
            socket.emit('sync', encoding.toUint8Array(encoder));

            // Send current awareness state
            const awarenessEncoder = encoding.createEncoder();
            encoding.writeVarUint(awarenessEncoder, messageAwareness);
            encoding.writeVarUint8Array(
                awarenessEncoder,
                awarenessProtocol.encodeAwarenessUpdate(
                    currentAwareness,
                    Array.from(currentAwareness.getStates().keys())
                )
            );
            socket.emit('sync', encoding.toUint8Array(awarenessEncoder));

            console.log(`User ${user.name} joined room ${docName}`);
        });

        socket.on('sync', (message: Uint8Array) => {
            if (!currentDoc || !currentDocName || !currentAwareness) return;

            try {
                const decoder = decoding.createDecoder(message);
                const messageType = decoding.readVarUint(decoder);

                switch (messageType) {
                    case messageSync: {
                        const encoder = encoding.createEncoder();
                        encoding.writeVarUint(encoder, messageSync);
                        const syncMessageType = syncProtocol.readSyncMessage(
                            decoder,
                            encoder,
                            currentDoc,
                            null
                        );

                        if (syncMessageType !== 0) {
                            // Broadcast to all clients in room except sender
                            socket.to(currentDocName).emit('sync', encoding.toUint8Array(encoder));
                        }

                        // If this was sync step 1, we need to respond with step 2
                        if (encoding.length(encoder) > 1) {
                            socket.emit('sync', encoding.toUint8Array(encoder));
                        }
                        break;
                    }

                    case messageAwareness: {
                        const update = decoding.readVarUint8Array(decoder);
                        awarenessProtocol.applyAwarenessUpdate(
                            currentAwareness,
                            update,
                            socket
                        );

                        // Broadcast awareness to all clients in room
                        socket.to(currentDocName).emit('sync', message);
                        break;
                    }
                }
            } catch (e) {
                console.error('Error processing sync message:', e);
            }
        });

        socket.on('update', (update: Uint8Array) => {
            if (!currentDoc || !currentDocName) return;

            try {
                Y.applyUpdate(currentDoc, update);

                // Broadcast to all other clients in the room
                socket.to(currentDocName).emit('update', update);
            } catch (e) {
                console.error('Error applying update:', e);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            if (currentAwareness && currentDoc) {
                // Remove this client's awareness state
                awarenessProtocol.removeAwarenessStates(
                    currentAwareness,
                    [currentDoc.clientID],
                    null
                );
            }
        });
    });

    return io;
}
