import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Engine } from '@prisma/client';
import { fileStorage } from '../services/FileStorage';

const router = Router();

// Get all projects for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                _count: { select: { files: true, collaborators: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new project
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, engine = 'TYPST' } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Project name is required' });
            return;
        }

        // Check project count limit (50 projects per user)
        const projectCount = await prisma.project.count({
            where: { ownerId: req.userId! },
        });

        if (projectCount >= 50) {
            res.status(400).json({ 
                error: 'Đã đạt giới hạn 50 dự án. Vui lòng xóa một số dự án cũ trước khi tạo mới.' 
            });
            return;
        }

        // Check total storage limit (100MB)
        const userProjectsDir = fileStorage.getUserDir(req.userId!);
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync(`du -sk "${userProjectsDir}" 2>/dev/null || echo "0"`);
            const currentSizeKB = parseInt(stdout.split('\t')[0]) || 0;
            const currentSizeMB = currentSizeKB / 1024;

            if (currentSizeMB >= 100) {
                res.status(400).json({ 
                    error: `Đã đạt giới hạn dung lượng 100MB (hiện tại: ${currentSizeMB.toFixed(2)}MB). Vui lòng xóa một số dự án để giải phóng dung lượng.` 
                });
                return;
            }
        } catch (storageCheckError) {
            console.error('Failed to check storage size:', storageCheckError);
            // Continue if storage check fails
        }

        const mainFile = engine === 'LATEX' ? 'main.tex' : 'main.typ';
        const defaultContent = engine === 'LATEX'
            ? `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{${name}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Hello, World! This is your first LaTeX document.

\\end{document}`
            : `#set document(title: "${name}", author: "Your Name")
#set page(paper: "a4")
#set text(font: "New Computer Modern", size: 11pt)

= ${name}

== Introduction

Hello, World! This is your first Typst document.

#lorem(50)`;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                engine: engine as Engine,
                mainFile,
                ownerId: req.userId!,
                files: {
                    create: {
                        name: mainFile,
                        path: `/${mainFile}`,
                        content: defaultContent,
                        isFolder: false,
                    },
                },
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                files: true,
            },
        });

        // Create project directory structure
        try {
            await fileStorage.createProjectDir(req.userId!, project.id);
            // Save main file to disk
            await fileStorage.saveFile(req.userId!, project.id, `/${mainFile}`, defaultContent);
            console.log(`[FileStorage] Created project structure for ${req.userId}/${project.id}`);
        } catch (storageError) {
            console.error('[FileStorage] Failed to create project directory:', storageError);
            // Continue even if storage fails
        }

        res.status(201).json({ project });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single project
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: {
                id,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                files: { orderBy: [{ isFolder: 'desc' }, { name: 'asc' }] },
                collaborators: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update project
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, mainFile } = req.body;

        const project = await prisma.project.findFirst({
            where: { id, ownerId: req.userId },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or not authorized' });
            return;
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(mainFile && { mainFile }),
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
            },
        });

        res.json({ project: updated });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: { id, ownerId: req.userId },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or not authorized' });
            return;
        }

        await prisma.project.delete({ where: { id } });

        // Delete project directory from file storage
        try {
            await fileStorage.deleteProject(req.userId!, id);
            console.log(`[FileStorage] Deleted project ${req.userId}/${id}`);
        } catch (storageError) {
            console.error('[FileStorage] Failed to delete project directory:', storageError);
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add collaborator
router.post('/:id/collaborators', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { email, role = 'EDITOR' } = req.body;

        const project = await prisma.project.findFirst({
            where: { id, ownerId: req.userId },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or not authorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.id === req.userId) {
            res.status(400).json({ error: 'Cannot add yourself as collaborator' });
            return;
        }

        const collaborator = await prisma.projectCollaborator.create({
            data: {
                projectId: id,
                userId: user.id,
                role,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        res.status(201).json({ collaborator });
    } catch (error) {
        console.error('Add collaborator error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove collaborator from project
router.delete('/:id/collaborators/:userId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params;

        const project = await prisma.project.findFirst({
            where: { id, ownerId: req.userId },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found or not authorized' });
            return;
        }

        await prisma.projectCollaborator.deleteMany({
            where: {
                projectId: id,
                userId: userId,
            },
        });

        res.json({ message: 'Collaborator removed successfully' });
    } catch (error) {
        console.error('Remove collaborator error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get project statistics/info
router.get('/:id/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: {
                id,
                OR: [
                    { ownerId: req.userId },
                    { collaborators: { some: { userId: req.userId } } },
                ],
            },
            include: {
                files: true,
                owner: { select: { id: true, name: true, email: true } },
                _count: { select: { files: true, collaborators: true } },
            },
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Calculate file and folder counts
        const fileCount = project.files.filter(f => !f.isFolder).length;
        const folderCount = project.files.filter(f => f.isFolder).length;

        // Get project size from disk
        let sizeInBytes = 0;
        try {
            const projectDir = fileStorage.getProjectFilesDir(project.ownerId, project.id);
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync(`du -sk "${projectDir}" 2>/dev/null || echo "0"`);
            const sizeKB = parseInt(stdout.split('\t')[0]) || 0;
            sizeInBytes = sizeKB * 1024;
        } catch (e) {
            console.error('Failed to get project size:', e);
        }

        res.json({
            stats: {
                id: project.id,
                name: project.name,
                engine: project.engine,
                owner: project.owner,
                fileCount,
                folderCount,
                collaboratorCount: project._count.collaborators,
                sizeInBytes,
                sizeFormatted: formatBytes(sizeInBytes),
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
            },
        });
    } catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download project as ZIP
router.get('/:id/download/zip', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: {
                id,
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

        const projectDir = fileStorage.getProjectFilesDir(project.ownerId, project.id);
        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });

        res.attachment(`${project.name}.zip`);
        archive.pipe(res);

        archive.directory(projectDir, false);
        await archive.finalize();
    } catch (error) {
        console.error('Download ZIP error:', error);
        res.status(500).json({ error: 'Failed to create ZIP file' });
    }
});

// Download project PDF (latest compiled)
router.get('/:id/download/pdf', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            where: {
                id,
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

        const fs = require('fs');
        const path = require('path');
        const projectDir = fileStorage.getProjectFilesDir(project.ownerId, project.id);
        
        // Find main file PDF
        const mainFileBase = project.mainFile.replace(/\.(tex|typ)$/, '');
        const pdfPath = path.join(projectDir, `${mainFileBase}.pdf`);

        if (!fs.existsSync(pdfPath)) {
            res.status(404).json({ error: 'PDF not found. Please compile the project first.' });
            return;
        }

        res.download(pdfPath, `${project.name}.pdf`);
    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ error: 'Failed to download PDF' });
    }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default router;
