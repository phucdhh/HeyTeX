import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { fileStorage } from '../services/FileStorage';
import { prisma } from '../lib/prisma';

const router = Router();

// Get user storage statistics
router.get('/storage', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        // Get total storage size
        const totalSize = await fileStorage.getUserStorageSize(userId);

        // Get project count
        const projects = await prisma.project.findMany({
            where: { ownerId: userId },
            select: { id: true, name: true },
        });

        // Get individual project sizes
        const projectSizes = await Promise.all(
            projects.map(async (project) => ({
                projectId: project.id,
                projectName: project.name,
                size: await fileStorage.getProjectStorageSize(userId, project.id),
            }))
        );

        res.json({
            userId,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            projectCount: projects.length,
            projects: projectSizes,
        });
    } catch (error) {
        console.error('Get storage stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get project metadata
router.get('/project/:projectId/metadata', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const userId = req.userId!;

        // Verify user has access to project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                ],
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const metadata = await fileStorage.getProjectMetadata(project.ownerId, projectId);
        const size = await fileStorage.getProjectStorageSize(project.ownerId, projectId);

        res.json({
            projectId,
            metadata,
            size,
            sizeMB: (size / 1024 / 1024).toFixed(2),
        });
    } catch (error) {
        console.error('Get project metadata error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List all projects in user directory
router.get('/directory', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const projectIds = await fileStorage.getUserProjects(userId);

        // Get project details from database
        const projects = await prisma.project.findMany({
            where: {
                id: { in: projectIds },
                ownerId: userId,
            },
            select: {
                id: true,
                name: true,
                engine: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({ projects });
    } catch (error) {
        console.error('List user directory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
