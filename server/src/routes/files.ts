import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadFile, getFileUrl, deleteFile, moveFile } from '../lib/minio';
import { config } from '../config/index';
import { fileStorage } from '../services/FileStorage';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Ensure a File.path always has a leading slash. Historically some code paths stored
// paths without one (e.g. "main.tex" instead of "/main.tex"), which is indistinguishable
// from the normalized form to a human but NOT to a `projectId_path` unique lookup - this
// caused duplicate rows (e.g. a compile-time sync creating a second "/main.tex" alongside
// the original "main.tex"). Always normalize at this trust boundary before touching the DB.
const normalizeFilePath = (p: string): string => (p.startsWith('/') ? p : `/${p}`);

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
        const { projectId, name, isFolder = false, content = '' } = req.body;
        const path = req.body.path ? normalizeFilePath(req.body.path) : req.body.path;

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

        const isRename = Boolean(name && name !== file.name);
        const newPath = isRename
            ? path.posix.join(path.posix.dirname(file.path), name)
            : file.path;

        const updated = await prisma.file.update({
            where: { id },
            data: {
                ...(content !== undefined && { content }),
                ...(name && { name }),
                ...(isRename && newPath !== file.path && { path: newPath }),
            },
        });

        // Update local file storage
        try {
            if (content !== undefined && !file.isFolder) {
                await fileStorage.saveFile(file.project.ownerId, file.projectId, file.path, content);
            }
            if (isRename && newPath !== file.path) {
                // Rename on local disk
                try {
                    await fileStorage.renameFile(file.project.ownerId, file.projectId, file.path, newPath);
                } catch (renameError) {
                    console.error('[FileStorage] Local rename failed, file may only exist in MinIO:', renameError);
                }

                // Rename the underlying object in MinIO for binary files (content stored in MinIO, not DB)
                if (!file.isFolder && file.content === null) {
                    try {
                        await moveFile(
                            config.minio.bucketProjects,
                            `${file.projectId}${file.path}`,
                            `${file.projectId}${newPath}`
                        );
                    } catch (minioError) {
                        console.error('[FileStorage] Failed to rename object in MinIO:', minioError);
                    }
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

// Batch delete files/folders (supports multi-select delete in the file explorer)
router.post('/batch-delete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ids } = req.body as { ids?: string[] };

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: 'No file ids provided' });
            return;
        }

        const requestedFiles = await prisma.file.findMany({
            where: { id: { in: ids } },
            include: {
                project: {
                    select: {
                        id: true,
                        ownerId: true,
                        collaborators: { select: { userId: true, role: true } },
                    },
                },
            },
        });

        if (requestedFiles.length === 0) {
            res.status(404).json({ error: 'No matching files found' });
            return;
        }

        // Verify edit access to every project referenced by the selection
        for (const file of requestedFiles) {
            const hasEditAccess =
                file.project.ownerId === req.userId ||
                file.project.collaborators.some(
                    c => c.userId === req.userId && c.role !== 'VIEWER'
                );
            if (!hasEditAccess) {
                res.status(403).json({ error: 'No edit access' });
                return;
            }
        }

        const projectId = requestedFiles[0].projectId;

        // Expand folders to include all descendant files/folders so nothing is left orphaned
        const allProjectFiles = await prisma.file.findMany({ where: { projectId } });
        const idsToDelete = new Set<string>();

        for (const file of requestedFiles) {
            idsToDelete.add(file.id);
            if (file.isFolder) {
                const prefix = file.path.endsWith('/') ? file.path : `${file.path}/`;
                for (const candidate of allProjectFiles) {
                    if (candidate.path.startsWith(prefix)) {
                        idsToDelete.add(candidate.id);
                    }
                }
            }
        }

        const filesToDelete = allProjectFiles.filter(f => idsToDelete.has(f.id));

        // Clean up MinIO/local storage for actual files (folders are removed recursively below)
        for (const file of filesToDelete) {
            if (file.isFolder) continue;
            if (!file.content && file.mimeType) {
                try {
                    await deleteFile(config.minio.bucketProjects, `${file.projectId}/${file.path}`);
                } catch (e) {
                    console.error('Failed to delete from MinIO:', e);
                }
            }
        }

        const ownerId = requestedFiles[0].project.ownerId;

        // Remove top-level selected folders from local disk recursively; plain files individually
        for (const file of requestedFiles) {
            try {
                if (file.isFolder) {
                    await fileStorage.deleteFolder(ownerId, projectId, file.path);
                } else {
                    await fileStorage.deleteFile(ownerId, projectId, file.path);
                }
            } catch (storageError) {
                console.error('[FileStorage] Failed to delete file:', storageError);
            }
        }

        await prisma.file.deleteMany({ where: { id: { in: Array.from(idsToDelete) } } });

        res.json({ deleted: idsToDelete.size });
    } catch (error) {
        console.error('Batch delete files error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload binary file
router.post('/upload', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, name, mimeType, data } = req.body;
        const path = req.body.path ? normalizeFilePath(req.body.path) : req.body.path;

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
