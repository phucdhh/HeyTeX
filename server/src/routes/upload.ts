/**
 * Advanced Upload Routes
 * Similar to Overleaf CE upload functionality
 * - Multiple file uploads
 * - Zip file upload & extraction  
 * - Drag & drop support
 * - Progress tracking
 * - Conflict resolution
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { uploadManager } from '../services/UploadManager';
import { fileStorage } from '../services/FileStorage';
import { uploadFile as uploadToMinio, getFileUrl, minioClient } from '../lib/minio';
import { config } from '../config';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = '/tmp/heytex-uploads';
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 100, // Max 100 files at once
    },
    fileFilter: (req, file, cb) => {
        // Basic security check
        const ext = path.extname(file.originalname).toLowerCase();
        const blockedExts = ['.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh'];
        
        if (blockedExts.includes(ext)) {
            cb(new Error(`File type ${ext} is not allowed`));
            return;
        }
        
        cb(null, true);
    }
});

/**
 * GET /api/upload/test - Simple test endpoint
 */
router.get('/test', (req: Request, res: Response) => {
    res.json({ message: 'Upload routes working!' });
});

/**
 * POST /api/upload/files
 * Upload multiple files to a project
 */
router.post('/files', authMiddleware, upload.array('files', 100), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, targetPath = '/' } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        // Verify project access
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

        // Validate files
        const validation = uploadManager.validateBatch(
            files.map(f => ({ name: f.originalname, size: f.size }))
        );

        if (!validation.valid) {
            res.status(400).json({ error: validation.error });
            return;
        }

        const uploadedFiles = [];
        const errors = [];

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Get relative path from form data (for folder uploads)
                const relativePath = req.body.relativePath;
                const fileName = relativePath || file.originalname;
                const filePath = uploadManager.sanitizePath(path.join(targetPath, fileName));
                const buffer = await fs.readFile(file.path);
                const mimeType = uploadManager['getMimeType'](path.extname(fileName));

                // Create parent folders if needed
                const dirPath = path.dirname(filePath);
                if (dirPath !== '/' && dirPath !== '.') {
                    const folders = dirPath.split('/').filter(Boolean);
                    let currentPath = '/';
                    
                    for (const folderName of folders) {
                        currentPath = path.join(currentPath, folderName);
                        
                        // Check if folder exists
                        const existingFolder = await prisma.file.findUnique({
                            where: { projectId_path: { projectId, path: currentPath } }
                        });
                        
                        if (!existingFolder) {
                            // Create folder
                            await prisma.file.create({
                                data: {
                                    name: folderName,
                                    path: currentPath,
                                    mimeType: 'inode/directory',
                                    size: 0,
                                    content: null,
                                    projectId,
                                    isFolder: true,
                                },
                            });
                        }
                    }
                }

                // Check for conflicts
                const existing = await prisma.file.findUnique({
                    where: { projectId_path: { projectId, path: filePath } }
                });

                if (existing) {
                    errors.push({
                        file: fileName,
                        error: 'File already exists',
                        path: filePath
                    });
                    continue;
                }

                // Upload to MinIO for binary files
                if (!mimeType.startsWith('text/')) {
                    await uploadToMinio(
                        config.minio.bucketProjects,
                        `${projectId}${filePath}`,
                        buffer,
                        mimeType
                    );
                }

                // Create file record
                const dbFile = await prisma.file.create({
                    data: {
                        name: fileName,
                        path: filePath,
                        mimeType,
                        size: buffer.length,
                        content: mimeType.startsWith('text/') ? buffer.toString('utf-8') : null,
                        projectId,
                        isFolder: false,
                    },
                });

                // Save to local storage
                try {
                    await fileStorage.saveFile(project.ownerId, projectId, filePath, buffer);
                } catch (storageError) {
                    console.error('[Upload] Failed to save to local storage:', storageError);
                }

                uploadedFiles.push(dbFile);

                // Clean up temp file
                await fs.unlink(file.path).catch(() => {});

            } catch (error) {
                console.error(`Error uploading file ${file.originalname}:`, error);
                errors.push({
                    file: file.originalname,
                    error: error instanceof Error ? error.message : 'Upload failed'
                });
            }
        }

        res.json({
            success: true,
            uploaded: uploadedFiles.length,
            files: uploadedFiles,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Batch upload error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/upload/zip
 * Upload and extract a zip file
 */
router.post('/zip', authMiddleware, upload.single('zipfile'), async (req: AuthRequest, res: Response): Promise<void> => {
    let tempFile: string | undefined;
    
    try {
        const { projectId, targetPath = '/', extractToFolder = false } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'No zip file uploaded' });
            return;
        }

        tempFile = file.path;

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        // Verify project access
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

        // Extract zip file
        console.log('[Upload] Extracting zip file:', file.originalname);
        const extractionResult = await uploadManager.extractZip(file.path);

        console.log(`[Upload] Extracted ${extractionResult.fileCount} files, total size: ${extractionResult.totalSize} bytes`);

        const uploadedFiles = [];
        const errors = [];
        const conflicts = [];

        // Determine base path
        let basePath = targetPath;
        if (extractToFolder) {
            const folderName = path.basename(file.originalname, '.zip');
            basePath = uploadManager.sanitizePath(path.join(targetPath, folderName));
            
            // Create folder
            await prisma.file.create({
                data: {
                    name: folderName,
                    path: basePath,
                    isFolder: true,
                    projectId,
                }
            });
        }

        // Upload extracted files
        for (const extractedFile of extractionResult.files) {
            try {
                const filePath = uploadManager.sanitizePath(
                    extractToFolder 
                        ? path.join(basePath, extractedFile.name)
                        : extractedFile.path
                );

                // Check for conflicts
                const existing = await prisma.file.findUnique({
                    where: { projectId_path: { projectId, path: filePath } }
                });

                if (existing) {
                    conflicts.push({
                        file: extractedFile.name,
                        path: filePath
                    });
                    continue;
                }

                // Upload to MinIO for binary files
                if (!extractedFile.mimeType.startsWith('text/') && extractedFile.content) {
                    await uploadToMinio(
                        config.minio.bucketProjects,
                        `${projectId}${filePath}`,
                        extractedFile.content,
                        extractedFile.mimeType
                    );
                }

                // Create file record
                const dbFile = await prisma.file.create({
                    data: {
                        name: extractedFile.name,
                        path: filePath,
                        mimeType: extractedFile.mimeType,
                        size: extractedFile.size,
                        content: extractedFile.mimeType.startsWith('text/') && extractedFile.content
                            ? extractedFile.content.toString('utf-8')
                            : null,
                        projectId,
                        isFolder: false,
                    },
                });

                // Save to local storage
                if (extractedFile.content) {
                    try {
                        await fileStorage.saveFile(
                            project.ownerId,
                            projectId,
                            filePath,
                            extractedFile.content
                        );
                    } catch (storageError) {
                        console.error('[Upload] Failed to save to local storage:', storageError);
                    }
                }

                uploadedFiles.push(dbFile);

            } catch (error) {
                console.error(`Error uploading extracted file ${extractedFile.name}:`, error);
                errors.push({
                    file: extractedFile.name,
                    error: error instanceof Error ? error.message : 'Upload failed'
                });
            }
        }

        res.json({
            success: true,
            extractedFiles: extractionResult.fileCount,
            uploaded: uploadedFiles.length,
            files: uploadedFiles,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            errors: errors.length > 0 ? errors : undefined,
            totalSize: extractionResult.totalSize
        });

    } catch (error) {
        console.error('Zip upload error:', error);
        res.status(500).json({ 
            error: 'Failed to process zip file',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        // Clean up temp file
        if (tempFile) {
            await fs.unlink(tempFile).catch(() => {});
        }
    }
});

/**
 * POST /api/upload/validate
 * Validate files before upload (dry run)
 */
router.post('/validate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, files } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        if (!files || !Array.isArray(files)) {
            res.status(400).json({ error: 'Files array is required' });
            return;
        }

        // Verify project access
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

        // Validate batch
        const validation = uploadManager.validateBatch(files);

        if (!validation.valid) {
            res.status(400).json({ 
                valid: false,
                error: validation.error 
            });
            return;
        }

        // Check for conflicts
        const conflicts = [];
        for (const file of files) {
            const filePath = uploadManager.sanitizePath(file.path || '/' + file.name);
            const existing = await prisma.file.findUnique({
                where: { projectId_path: { projectId, path: filePath } }
            });

            if (existing) {
                conflicts.push({
                    file: file.name,
                    path: filePath,
                    existingId: existing.id
                });
            }
        }

        res.json({
            valid: true,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            totalSize: files.reduce((sum: number, f: any) => sum + f.size, 0)
        });

    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/upload/avatar
 * Upload user avatar image - saved to user's directory
 */
router.post('/avatar', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = req.file as Express.Multer.File;
        
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Validate file is an image
        if (!file.mimetype.startsWith('image/')) {
            await fs.unlink(file.path); // Clean up
            res.status(400).json({ error: 'File must be an image' });
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            await fs.unlink(file.path);
            res.status(400).json({ error: 'Image must be smaller than 2MB' });
            return;
        }

        // Save to user's directory: users/<userId>/avatar.jpg
        const userDir = path.join('/Users/mac/heytex/users', req.userId!);
        const avatarPath = path.join(userDir, 'avatar.jpg');
        
        try {
            // Ensure user directory exists
            await fs.mkdir(userDir, { recursive: true });
            
            // Copy file to user directory
            await fs.copyFile(file.path, avatarPath);
            
            // Clean up temp file
            await fs.unlink(file.path);
            
            // Return relative URL
            const url = `/api/users/${req.userId}/avatar.jpg`;
            
            res.json({ url });
        } catch (saveError) {
            console.error('Avatar save error:', saveError);
            // Clean up temp file
            await fs.unlink(file.path);
            res.status(500).json({ error: 'Failed to save avatar' });
        }

    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
