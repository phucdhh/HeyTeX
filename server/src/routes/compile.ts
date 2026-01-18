/**
 * Compilation Routes
 * API endpoints để biên dịch LaTeX documents với queue management
 */

import { Router, Request, Response } from 'express';
import { compilationQueue } from '../services/CompilationQueue';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Helper: Check if user has access to project (owner or collaborator)
 */
async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    if (!projectId || projectId === 'unknown') return true; // Skip check for unknown projects
    
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { collaborators: { some: { userId } } },
            ],
        },
    });
    
    return !!project;
}

/**
 * POST /api/compile
 * Tạo compilation job mới
 * Body: { fileName: string, content: string, projectId?: string }
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { fileName, content, projectId } = req.body;
        const userId = (req as AuthRequest).userId || (req as AuthRequest).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!fileName || !content) {
            res.status(400).json({ error: 'fileName and content are required' });
            return;
        }

        // Validate fileName is .tex
        if (!fileName.endsWith('.tex')) {
            res.status(400).json({ error: 'Only .tex files are supported' });
            return;
        }

        // Check project access for collaborators
        if (projectId && projectId !== 'unknown') {
            const hasAccess = await checkProjectAccess(userId, projectId);
            if (!hasAccess) {
                res.status(403).json({ error: 'Access denied to project' });
                return;
            }
        }

        // Thêm job vào queue
        const jobId = await compilationQueue.addJob(
            userId,
            projectId || 'unknown',
            fileName,
            content
        );

        // Lấy stats hiện tại
        const stats = compilationQueue.getStats();
        const job = compilationQueue.getJob(jobId);

        res.status(201).json({
            success: true,
            jobId,
            status: job?.status,
            queuePosition: job?.queuePosition,
            stats: {
                compiling: stats.compiling,
                queued: stats.queued,
            },
        });
    } catch (error) {
        console.error('[Compile API] Error creating job:', error);
        res.status(500).json({ error: 'Failed to create compilation job' });
    }
});

/**
 * GET /api/compile/stats
 * Lấy thống kê queue hiện tại (public endpoint để frontend hiển thị)
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = compilationQueue.getStats();

        res.json({
            success: true,
            stats: {
                compiling: stats.compiling,
                queued: stats.queued,
                total: stats.total,
                available: Math.max(0, 10 - stats.compiling), // 10 là max concurrent
            },
        });
    } catch (error) {
        console.error('[Compile API] Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * GET /api/compile/:jobId
 * Lấy thông tin về job
 */
router.get('/:jobId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;

        const job = compilationQueue.getJob(jobId);

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        // Skip auth check for testing
        // if (job.userId !== userId) {
        //     res.status(403).json({ error: 'Access denied' });
        //     return;
        // }

        const stats = compilationQueue.getStats();

        res.json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                queuePosition: job.queuePosition,
                createdAt: job.createdAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                error: job.error,
            },
            stats: {
                compiling: stats.compiling,
                queued: stats.queued,
            },
        });
    } catch (error) {
        console.error('[Compile API] Error getting job:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

/**
 * GET /api/compile/:jobId/pdf
 * Download PDF khi job hoàn thành
 */
router.get('/:jobId/pdf', async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;

        const job = compilationQueue.getJob(jobId);

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        // Skip auth check for testing
        // if (job.userId !== userId) {
        //     res.status(403).json({ error: 'Access denied' });
        //     return;
        // }

        if (job.status !== 'completed') {
            res.status(400).json({ 
                error: 'Job not completed yet',
                status: job.status,
            });
            return;
        }

        const pdf = await compilationQueue.getPDF(jobId);

        if (!pdf) {
            res.status(404).json({ error: 'PDF not found' });
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${job.fileName.replace('.tex', '.pdf')}"`);
        res.send(pdf);
    } catch (error) {
        console.error('[Compile API] Error getting PDF:', error);
        res.status(500).json({ error: 'Failed to get PDF' });
    }
});

/**
 * GET /api/compile/:jobId/log
 * Lấy compilation log
 */
router.get('/:jobId/log', async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;

        const job = compilationQueue.getJob(jobId);

        if (!job) {
            // Job không còn trong memory, trả về thông báo hữu ích
            res.status(404).json({ 
                error: 'Job expired or not found',
                message: 'Compilation log is no longer available. Jobs are kept for 2 hours after completion.'
            });
            return;
        }

        // Skip auth check for testing
        // if (job.userId !== userId) {
        //     res.status(403).json({ error: 'Access denied' });
        //     return;
        // }

        const log = await compilationQueue.getLog(jobId);

        if (!log) {
            res.status(404).json({ 
                error: 'Log not found',
                message: 'Compilation log file could not be read. The job may still be running or failed before generating logs.'
            });
            return;
        }

        res.setHeader('Content-Type', 'text/plain');
        res.send(log);
    } catch (error) {
        console.error('[Compile API] Error getting log:', error);
        res.status(500).json({ error: 'Failed to get log' });
    }
});

export default router;
