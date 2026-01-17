/**
 * UploadManager Service
 * Handles advanced file uploads similar to Overleaf CE
 * - Multiple file uploads
 * - Zip file extraction
 * - Folder structure preservation
 * - File validation & size limits
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import yauzl from 'yauzl';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';

const yauzlOpen = promisify(yauzl.open);

export interface UploadedFile {
    name: string;
    path: string;
    size: number;
    mimeType: string;
    content?: Buffer;
    isFolder?: boolean;
}

export interface UploadValidation {
    maxFileSize: number; // bytes
    maxTotalSize: number; // bytes
    maxFiles: number;
    allowedExtensions?: string[];
    blockedExtensions?: string[];
}

export interface ZipExtractionResult {
    files: UploadedFile[];
    totalSize: number;
    fileCount: number;
}

class UploadManager {
    // Default validation rules
    private readonly DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private readonly DEFAULT_MAX_TOTAL_SIZE = 300 * 1024 * 1024; // 300MB
    private readonly DEFAULT_MAX_FILES = 2000;
    
    // Blocked extensions for security
    private readonly BLOCKED_EXTENSIONS = [
        '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh',
        '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi'
    ];

    /**
     * Validate a single file before upload
     */
    validateFile(
        filename: string,
        fileSize: number,
        validation: Partial<UploadValidation> = {}
    ): { valid: boolean; error?: string } {
        const maxFileSize = validation.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
        const ext = path.extname(filename).toLowerCase();

        // Check file size
        if (fileSize > maxFileSize) {
            return {
                valid: false,
                error: `File "${filename}" exceeds maximum size of ${this.formatBytes(maxFileSize)}`
            };
        }

        // Check blocked extensions
        const blockedExts = validation.blockedExtensions || this.BLOCKED_EXTENSIONS;
        if (blockedExts.includes(ext)) {
            return {
                valid: false,
                error: `File type "${ext}" is not allowed for security reasons`
            };
        }

        // Check allowed extensions if specified
        if (validation.allowedExtensions && validation.allowedExtensions.length > 0) {
            if (!validation.allowedExtensions.includes(ext)) {
                return {
                    valid: false,
                    error: `File type "${ext}" is not in allowed types: ${validation.allowedExtensions.join(', ')}`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validate multiple files before batch upload
     */
    validateBatch(
        files: Array<{ name: string; size: number }>,
        validation: Partial<UploadValidation> = {}
    ): { valid: boolean; error?: string } {
        const maxFiles = validation.maxFiles || this.DEFAULT_MAX_FILES;
        const maxTotalSize = validation.maxTotalSize || this.DEFAULT_MAX_TOTAL_SIZE;

        // Check file count
        if (files.length > maxFiles) {
            return {
                valid: false,
                error: `Cannot upload more than ${maxFiles} files at once`
            };
        }

        // Check total size
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        if (totalSize > maxTotalSize) {
            return {
                valid: false,
                error: `Total upload size ${this.formatBytes(totalSize)} exceeds limit of ${this.formatBytes(maxTotalSize)}`
            };
        }

        // Validate each file
        for (const file of files) {
            const fileValidation = this.validateFile(file.name, file.size, validation);
            if (!fileValidation.valid) {
                return fileValidation;
            }
        }

        return { valid: true };
    }

    /**
     * Extract files from a zip archive
     */
    async extractZip(
        zipPath: string,
        validation: Partial<UploadValidation> = {}
    ): Promise<ZipExtractionResult> {
        const tempDir = path.join('/tmp', `heytex-upload-${uuidv4()}`);
        await fs.mkdir(tempDir, { recursive: true });

        try {
            const zipFile: yauzl.ZipFile = await new Promise((resolve, reject) => {
                yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
                    if (err) reject(err);
                    else resolve(zipfile!);
                });
            });

            const files: UploadedFile[] = [];
            let totalSize = 0;
            let fileCount = 0;

            const maxFiles = validation.maxFiles || this.DEFAULT_MAX_FILES;
            const maxTotalSize = validation.maxTotalSize || this.DEFAULT_MAX_TOTAL_SIZE;

            return await new Promise<ZipExtractionResult>((resolve, reject) => {
                zipFile.on('entry', (entry: yauzl.Entry) => {
                    const fileName = entry.fileName;

                    // Skip directories and hidden files
                    if (fileName.endsWith('/') || fileName.includes('/__MACOSX/') || fileName.startsWith('.')) {
                        zipFile.readEntry();
                        return;
                    }

                    // Validate file
                    const validation = this.validateFile(fileName, entry.uncompressedSize);
                    if (!validation.valid) {
                        reject(new Error(validation.error));
                        return;
                    }

                    fileCount++;
                    totalSize += entry.uncompressedSize;

                    // Check limits
                    if (fileCount > maxFiles) {
                        reject(new Error(`Zip contains too many files (max ${maxFiles})`));
                        return;
                    }

                    if (totalSize > maxTotalSize) {
                        reject(new Error(`Zip contents exceed maximum size`));
                        return;
                    }

                    // Extract file
                    zipFile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const filePath = path.join(tempDir, fileName);
                        const dir = path.dirname(filePath);

                        fs.mkdir(dir, { recursive: true })
                            .then(() => {
                                const writeStream = createWriteStream(filePath);
                                return pipeline(readStream!, writeStream);
                            })
                            .then(() => {
                                // Read file content
                                return fs.readFile(filePath);
                            })
                            .then((content) => {
                                const ext = path.extname(fileName);
                                const mimeType = this.getMimeType(ext);

                                files.push({
                                    name: path.basename(fileName),
                                    path: '/' + fileName,
                                    size: entry.uncompressedSize,
                                    mimeType,
                                    content
                                });

                                zipFile.readEntry();
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                });

                zipFile.on('end', () => {
                    if (fileCount === 0) {
                        reject(new Error('Zip file is empty or contains no valid files'));
                        return;
                    }
                    resolve({ files, totalSize, fileCount });
                });

                zipFile.on('error', (err) => {
                    reject(err);
                });

                zipFile.readEntry();
            });
        } finally {
            // Cleanup temp directory
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }

    /**
     * Get MIME type from file extension
     */
    private getMimeType(ext: string): string {
        const mimeTypes: Record<string, string> = {
            '.txt': 'text/plain',
            '.tex': 'text/x-tex',
            '.bib': 'text/x-bibtex',
            '.bbl': 'text/x-bibtex',
            '.aux': 'text/plain',
            '.toc': 'text/plain',
            '.log': 'text/plain',
            '.out': 'text/plain',
            '.sty': 'text/x-tex',
            '.cls': 'text/x-tex',
            '.md': 'text/markdown',
            '.json': 'application/json',
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.zip': 'application/zip',
            '.py': 'text/x-python',
            '.js': 'text/javascript',
            '.ts': 'text/typescript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.xml': 'application/xml',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
        };

        return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Sanitize file path to prevent directory traversal
     */
    sanitizePath(filePath: string): string {
        // Remove leading slashes and dots
        let sanitized = filePath.replace(/^[./\\]+/, '');
        
        // Remove any .. segments
        sanitized = sanitized.split('/').filter(segment => segment !== '..').join('/');
        
        // Ensure it starts with /
        return '/' + sanitized;
    }

    /**
     * Check if file path is safe (no directory traversal)
     */
    isPathSafe(filePath: string): boolean {
        const normalized = path.normalize(filePath);
        return !normalized.includes('..') && 
               !normalized.startsWith('/') && 
               !path.isAbsolute(normalized);
    }
}

export const uploadManager = new UploadManager();
