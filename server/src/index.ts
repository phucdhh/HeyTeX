import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config/index';
import { prisma } from './lib/prisma';
import { setupCollaborationServer } from './websocket/collab';
import { minioClient } from './lib/minio';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import fileRoutes from './routes/files';

const app = express();
const httpServer = createServer(app);

// Setup WebSocket collaboration server
const io = setupCollaborationServer(httpServer);

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle malformed JSON bodies gracefully (prevent crash)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err instanceof SyntaxError && 'body' in err) {
        console.warn('[Express] Invalid JSON received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    return next(err);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import texlyreRoutes from './routes/texlyre';
import compileRoutes from './routes/compile';
import storageRoutes from './routes/storage';
import uploadRoutes from './routes/upload';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/texlyre', texlyreRoutes);
app.use('/api/compile', compileRoutes);
app.use('/api/storage', storageRoutes);
console.log('[Routes] Mounting upload routes at /api/upload');
app.use('/api/upload', uploadRoutes);
console.log('[Routes] Upload routes mounted successfully');

// Serve user avatars
app.get('/api/users/:userId/avatar.jpg', async (req: express.Request, res: express.Response) => {
    try {
        const { userId } = req.params;
        const avatarPath = `/Users/mac/heytex/users/${userId}/avatar.jpg`;
        
        // Check if file exists
        const fs = await import('fs/promises');
        await fs.access(avatarPath);
        
        // Send file
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Type', 'image/jpeg');
        res.sendFile(avatarPath);
    } catch (error) {
        res.status(404).json({ error: 'Avatar not found' });
    }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// Global exception handlers to keep process alive and log errors for PM2
process.on('uncaughtException', (err) => {
    console.error('[Process] uncaughtException:', err);
    // don't exit immediately; PM2 will restart if needed
});

process.on('unhandledRejection', (reason) => {
    console.error('[Process] unhandledRejection:', reason);
});

// Initialize MinIO buckets
async function initializeMinIO() {
    const buckets = ['avatars', config.minio.bucketAssets, config.minio.bucketProjects];
    
    for (const bucket of buckets) {
        try {
            const exists = await minioClient.bucketExists(bucket);
            if (!exists) {
                await minioClient.makeBucket(bucket, '');
                console.log(`[MinIO] Created bucket: ${bucket}`);
            } else {
                console.log(`[MinIO] Bucket exists: ${bucket}`);
            }
        } catch (error) {
            console.error(`[MinIO] Error checking/creating bucket ${bucket}:`, error);
        }
    }
}

// Start server
httpServer.listen(config.port, async () => {
    // Initialize MinIO buckets
    await initializeMinIO();
    
    console.log(`
🚀 HeyTeX Server is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 HTTP:      http://localhost:${config.port}
🔌 WebSocket: ws://localhost:${config.port}/collab
🌍 CORS:      ${config.cors.origin}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export { app, httpServer, io };
