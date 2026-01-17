import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config/index';
import { prisma } from './lib/prisma';
import { setupCollaborationServer } from './websocket/collab';

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

// Start server
httpServer.listen(config.port, () => {
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
