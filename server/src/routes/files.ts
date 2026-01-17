import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadFile, getFileUrl, deleteFile } from '../lib/minio';
import { config } from '../config/index';
import { fileStorage } from '../services/FileStorage';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Get all files for a project
router.get('/project/:projectId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const files = await prisma.file.findMany({
            where: { projectId },
            orderBy: [{ isFolder: 'desc' }, { name: 'asc' }],
        });

        res.json({ files });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get file binary content (for images, PDFs, etc.)
router.get('/:id/content', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        ownerId: true,
                        collaborators: { select: { userId: true } },
                    },
                },
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const hasAccess =
            file.project.ownerId === req.userId ||
            file.project.collaborators.some(c => c.userId === req.userId);

        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Try to read from local storage first
        try {
            const filePath = fileStorage.getFilePath(file.project.ownerId, file.projectId, file.path);
            const buffer = await fs.readFile(filePath);
            
            // Set appropriate content type
            res.contentType(file.mimeType || 'application/octet-stream');
            res.send(buffer);
            return;
        } catch (localError) {
            console.log('[Files] Local file not found, trying MinIO:', file.path);
        }

        // Fallback to MinIO for binary files
        if (!file.content && file.mimeType && !file.mimeType.startsWith('text/')) {
            const url = await getFileUrl(
                config.minio.bucketProjects,
                `${file.projectId}${file.path}`
            );
            res.redirect(url);
            return;
        }

        // For text files with content in DB
        if (file.content) {
            res.contentType(file.mimeType || 'text/plain');
            res.send(file.content);
            return;
        }

        res.status(404).json({ error: 'File content not found' });
    } catch (error) {
        console.error('Get file content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single file metadata
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        ownerId: true,
                        collaborators: { select: { userId: true } },
                    },
                },
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const hasAccess =
            file.project.ownerId === req.userId ||
            file.project.collaborators.some(c => c.userId === req.userId);

        if (!hasAccess) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // If it's a binary file stored in MinIO, get presigned URL
        if (!file.content && file.mimeType && !file.mimeType.startsWith('text/')) {
            const url = await getFileUrl(
                config.minio.bucketProjects,
                `${file.projectId}/${file.path}`
            );
            res.json({ file: { ...file, url } });
            return;
        }

        res.json({ file });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new file or folder
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, name, path, isFolder = false, content = '' } = req.body;

        if (!projectId || !name || !path) {
            res.status(400).json({ error: 'Project ID, name, and path are required' });
            return;
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const existingFile = await prisma.file.findUnique({
            where: { projectId_path: { projectId, path } },
        });

        if (existingFile) {
            res.status(400).json({ error: 'File already exists at this path' });
            return;
        }

        const file = await prisma.file.create({
            data: {
                name,
                path,
                isFolder,
                content: isFolder ? null : content,
                projectId,
            },
        });

        // Save to local file storage
        try {
            if (isFolder) {
                await fileStorage.createFolder(project.ownerId, projectId, path);
            } else {
                await fileStorage.saveFile(project.ownerId, projectId, path, content);
            }
        } catch (storageError) {
            console.error('[FileStorage] Failed to save file:', storageError);
            // Continue even if storage fails - database is source of truth
        }

        res.status(201).json({ file });
    } catch (error) {
        console.error('Create file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update file content
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { content, name } = req.body;

        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        ownerId: true,
                        collaborators: { select: { userId: true, role: true } },
                    },
                },
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const hasEditAccess =
            file.project.ownerId === req.userId ||
            file.project.collaborators.some(
                c => c.userId === req.userId && c.role !== 'VIEWER'
            );

        if (!hasEditAccess) {
            res.status(403).json({ error: 'No edit access' });
            return;
        }

        const updated = await prisma.file.update({
            where: { id },
            data: {
                ...(content !== undefined && { content }),
                ...(name && { name }),
            },
        });

        // Update local file storage
        try {
            if (content !== undefined && !file.isFolder) {
                await fileStorage.saveFile(file.project.ownerId, file.projectId, file.path, content);
            }
            if (name && name !== file.name) {
                // Handle rename - update path if needed
                const newPath = file.path.replace(file.name, name);
                if (newPath !== file.path) {
                    await fileStorage.renameFile(file.project.ownerId, file.projectId, file.path, newPath);
                }
            }
        } catch (storageError) {
            console.error('[FileStorage] Failed to update file:', storageError);
        }

        res.json({ file: updated });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete file
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        ownerId: true,
                        collaborators: { select: { userId: true, role: true } },
                    },
                },
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const hasEditAccess =
            file.project.ownerId === req.userId ||
            file.project.collaborators.some(
                c => c.userId === req.userId && c.role !== 'VIEWER'
            );

        if (!hasEditAccess) {
            res.status(403).json({ error: 'No edit access' });
            return;
        }

        // Delete from MinIO if it's a binary file
        if (!file.content && file.mimeType) {
            try {
                await deleteFile(
                    config.minio.bucketProjects,
                    `${file.projectId}/${file.path}`
                );
            } catch (e) {
                console.error('Failed to delete from MinIO:', e);
            }
        }

        await prisma.file.delete({ where: { id } });

        // Delete from local file storage
        try {
            if (file.isFolder) {
                await fileStorage.deleteFolder(file.project.ownerId, file.projectId, file.path);
            } else {
                await fileStorage.deleteFile(file.project.ownerId, file.projectId, file.path);
            }
        } catch (storageError) {
            console.error('[FileStorage] Failed to delete file:', storageError);
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload binary file
router.post('/upload', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, path, name, mimeType, data } = req.body;

        if (!projectId || !path || !name || !data) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Decode base64 data
        const buffer = Buffer.from(data, 'base64');

        // Upload to MinIO
        await uploadFile(
            config.minio.bucketProjects,
            `${projectId}/${path}`,
            buffer,
            mimeType || 'application/octet-stream'
        );

        // Create or update file record
        const file = await prisma.file.upsert({
            where: { projectId_path: { projectId, path } },
            create: {
                name,
                path,
                mimeType,
                size: buffer.length,
                projectId,
                isFolder: false,
            },
            update: {
                name,
                mimeType,
                size: buffer.length,
            },
        });

        // Save to local file storage
        try {
            await fileStorage.saveFile(project.ownerId, projectId, path, buffer);
        } catch (storageError) {
            console.error('[FileStorage] Failed to save uploaded file:', storageError);
        }

        res.status(201).json({ file });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
