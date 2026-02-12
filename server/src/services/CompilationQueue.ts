/**
 * CompilationQueue Service
 * Quản lý queue biên dịch LaTeX với giới hạn số lượng concurrent jobs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { fileStorage } from './FileStorage';
import { prisma } from '../lib/prisma';

const execAsync = promisify(exec);

export interface CompilationJob {
    id: string;
    userId: string;
    projectId: string;
    fileName: string;
    content: string;
    status: 'queued' | 'compiling' | 'completed' | 'failed';
    queuePosition?: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    pdfPath?: string;
    logPath?: string;
    error?: string;
}

export interface QueueStats {
    total: number;
    compiling: number;
    queued: number;
    completed: number;
    failed: number;
}

class CompilationQueue {
    private queue: CompilationJob[] = [];
    private activeJobs: Map<string, CompilationJob> = new Map();
    private completedJobs: Map<string, CompilationJob> = new Map();
    private projectLocks: Map<string, string> = new Map(); // projectId -> jobId đang compile
    private readonly maxConcurrent: number; // configurable via COMPILATION_MAX_CONCURRENT env var

    constructor() {
        // Configure max concurrent jobs from env or default to 10
        const envVal = process.env.COMPILATION_MAX_CONCURRENT || process.env.MAX_CONCURRENT;
        const parsed = envVal ? parseInt(envVal, 10) : NaN;
        this.maxConcurrent = !isNaN(parsed) && parsed > 0 ? parsed : 10;
        console.log(`[CompilationQueue] Initialized with max ${this.maxConcurrent} concurrent jobs`);
    }

    /**
     * Thêm job mới vào queue
     */
    public async addJob(
        userId: string,
        projectId: string,
        fileName: string,
        content: string
    ): Promise<string> {
        const jobId = uuidv4();
        const job: CompilationJob = {
            id: jobId,
            userId,
            projectId,
            fileName,
            content,
            status: 'queued',
            createdAt: new Date(),
        };

        this.queue.push(job);
        this.updateQueuePositions();

        // Bắt đầu xử lý queue
        this.processQueue();

        return jobId;
    }

    /**
     * Lấy thông tin job theo ID
     */
    public getJob(jobId: string): CompilationJob | undefined {
        // Tìm trong active jobs
        if (this.activeJobs.has(jobId)) {
            return this.activeJobs.get(jobId);
        }

        // Tìm trong completed jobs
        if (this.completedJobs.has(jobId)) {
            return this.completedJobs.get(jobId);
        }

        // Tìm trong queue
        return this.queue.find(job => job.id === jobId);
    }

    /**
     * Lấy thống kê queue
     */
    public getStats(): QueueStats {
        return {
            total: this.queue.length + this.activeJobs.size + this.completedJobs.size,
            compiling: this.activeJobs.size,
            queued: this.queue.length,
            completed: Array.from(this.completedJobs.values()).filter(j => j.status === 'completed').length,
            failed: Array.from(this.completedJobs.values()).filter(j => j.status === 'failed').length,
        };
    }

    /**
     * Cập nhật queue position cho các job đang chờ
     */
    private updateQueuePositions() {
        this.queue.forEach((job, index) => {
            job.queuePosition = index + 1;
        });
    }

    /**
     * Xử lý queue - chạy jobs nếu còn slot
     */
    private async processQueue() {
        // Nếu đã đầy concurrent jobs, không làm gì
        if (this.activeJobs.size >= this.maxConcurrent) {
            return;
        }

        // Lấy job đầu tiên trong queue mà project không đang compile
        let jobIndex = -1;
        for (let i = 0; i < this.queue.length; i++) {
            const job = this.queue[i];
            if (!this.projectLocks.has(job.projectId)) {
                jobIndex = i;
                break;
            }
        }

        if (jobIndex === -1) {
            // Không có job nào sẵn sàng (tất cả projects đang compile)
            return;
        }

        // Lấy job và lock project
        const job = this.queue.splice(jobIndex, 1)[0];
        this.projectLocks.set(job.projectId, job.id);

        // Chuyển sang trạng thái compiling
        job.status = 'compiling';
        job.startedAt = new Date();
        this.activeJobs.set(job.id, job);

        // Compile trong background
        this.compileJob(job).finally(() => {
            // Release lock
            this.projectLocks.delete(job.projectId);
            
            // Sau khi xong, tiếp tục xử lý queue
            this.processQueue();
        });

        // Cập nhật queue positions
        this.updateQueuePositions();

        // Tiếp tục xử lý nếu còn slot
        if (this.activeJobs.size < this.maxConcurrent) {
            this.processQueue();
        }
    }

    /**
     * Biên dịch LaTeX job
     */
    private async compileJob(job: CompilationJob): Promise<void> {
        try {
            // Get project owner ID for correct file path
            const project = await prisma.project.findUnique({
                where: { id: job.projectId },
                select: { ownerId: true },
            });

            if (!project) {
                throw new Error(`Project ${job.projectId} not found`);
            }

            // Use owner's directory, not collaborator's
            const projectFilesDir = fileStorage.getProjectFilesDir(project.ownerId, job.projectId);
            const texPath = path.join(projectFilesDir, job.fileName);

            // Ghi nội dung mới nhất của file .tex
            await fs.writeFile(texPath, job.content, 'utf-8');

            console.log(`[CompilationQueue] Compiling job ${job.id} in ${projectFilesDir}`);

            // Detect biblatex vs bibtex: 
            // 1. Check current file content
            // 2. Check if any .tex file in project uses biblatex
            // 3. Check for .bcf file (biblatex control file)
            let usesBiblatex = job.content.includes('\\usepackage') && 
                               (job.content.includes('biblatex') || job.content.includes('addbibresource'));
            
            // If not found in current file, check other .tex files in project
            if (!usesBiblatex) {
                try {
                    const files = await fs.readdir(projectFilesDir);
                    const texFiles = files.filter(f => f.endsWith('.tex'));
                    
                    for (const texFile of texFiles) {
                        const content = await fs.readFile(path.join(projectFilesDir, texFile), 'utf-8');
                        if (content.includes('\\usepackage') && 
                            (content.includes('biblatex') || content.includes('addbibresource'))) {
                            usesBiblatex = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.error('[CompilationQueue] Failed to scan .tex files for biblatex:', error);
                }
            }
            
            const bibCommand = usesBiblatex ? 'biber' : 'bibtex';
            
            // Biên dịch với xelatex + biber/bibtex
            // 1. xelatex lần 1: tạo .aux file (và .bcf file cho biblatex)
            // 2. biber/bibtex: xử lý .bib tạo .bbl file
            // 3. xelatex lần 2: đọc .bbl file
            // 4. xelatex lần 3: resolve cross-references
            const baseFileName = job.fileName.replace(/\.tex$/, '');
            const commands = [
                `cd "${projectFilesDir}" && xelatex -interaction=nonstopmode "${job.fileName}"`,
                `cd "${projectFilesDir}" && ${bibCommand} "${baseFileName}" || true`,  // || true để không fail nếu không có .bib
                `cd "${projectFilesDir}" && xelatex -interaction=nonstopmode "${job.fileName}"`,
                `cd "${projectFilesDir}" && xelatex -interaction=nonstopmode "${job.fileName}"`,
            ];

            for (const cmd of commands) {
                try {
                    const { stdout, stderr } = await execAsync(cmd, {
                        cwd: projectFilesDir,
                        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                    });

                    // Log output vào thư mục project
                    const logPath = path.join(projectFilesDir, 'compile.log');
                    await fs.appendFile(logPath, `\n=== Run ${commands.indexOf(cmd) + 1} ===\n`);
                    await fs.appendFile(logPath, stdout);
                    if (stderr) {
                        await fs.appendFile(logPath, '\n=== STDERR ===\n' + stderr);
                    }
                } catch (error: any) {
                    // XeLaTeX/BibTeX có thể return error code nhưng vẫn tạo output
                    // Tiếp tục để check PDF có tồn tại không
                    const logPath = path.join(projectFilesDir, 'compile.log');
                    await fs.appendFile(logPath, `\n=== Error in run ${commands.indexOf(cmd) + 1} ===\n`);
                    await fs.appendFile(logPath, error.stdout || '');
                    await fs.appendFile(logPath, error.stderr || '');
                }
            }

            // Parse compile log để tìm missing images và tạo placeholders
            try {
                const compileLogPath = path.join(projectFilesDir, 'compile.log');
                const logContent = await fs.readFile(compileLogPath, 'utf-8');
                const missingImages = this.extractMissingImages(logContent);
                
                if (missingImages.length > 0) {
                    console.log(`[CompilationQueue] Found ${missingImages.length} missing images, generating placeholders...`);
                    await this.generatePlaceholders(projectFilesDir, missingImages);
                }
            } catch (error) {
                console.error(`[CompilationQueue] Failed to generate placeholders:`, error);
            }

            // Kiểm tra PDF có được tạo không
            const pdfFileName = job.fileName.replace(/\.tex$/, '.pdf');
            const pdfPath = path.join(projectFilesDir, pdfFileName);
            const logPath = path.join(projectFilesDir, job.fileName.replace(/\.tex$/, '.log'));

            const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);

            // Validate PDF is not corrupted
            let pdfValid = false;
            if (pdfExists) {
                try {
                    const stats = await fs.stat(pdfPath);
                    // A valid PDF should be at least 2KB. Smaller files are likely corrupted/incomplete
                    pdfValid = stats.size > 2000;
                    
                    if (!pdfValid) {
                        console.warn(`[CompilationQueue] PDF file too small (${stats.size} bytes), likely corrupted`);
                    }
                } catch (error) {
                    console.error(`[CompilationQueue] Failed to stat PDF:`, error);
                }
            }

            // Also check compile log for fatal errors
            try {
                const compileLogPath = path.join(projectFilesDir, 'compile.log');
                const logContent = await fs.readFile(compileLogPath, 'utf-8');
                if (logContent.includes('No output PDF file written') || 
                    logContent.includes('fatal:') ||
                    logContent.includes('Emergency stop')) {
                    pdfValid = false;
                    console.warn(`[CompilationQueue] Compile log indicates fatal error`);
                }
            } catch (error) {
                // Compile log might not exist, continue
            }

            if (pdfExists && pdfValid) {
                job.status = 'completed';
                job.pdfPath = pdfPath;
                job.logPath = logPath;
                console.log(`[CompilationQueue] Job ${job.id} completed successfully`);
            } else {
                job.status = 'failed';
                job.error = pdfExists ? 'PDF generation failed with errors' : 'PDF was not generated';
                job.logPath = logPath;
                console.error(`[CompilationQueue] Job ${job.id} failed: ${job.error}`);
            }

        } catch (error: any) {
            job.status = 'failed';
            job.error = error.message || 'Unknown compilation error';
            console.error(`[CompilationQueue] Job ${job.id} failed:`, error);
        } finally {
            job.completedAt = new Date();

            // Chuyển từ active sang completed
            this.activeJobs.delete(job.id);
            this.completedJobs.set(job.id, job);

            // Cleanup sau 2 giờ (tăng từ 30 phút)
            setTimeout(() => {
                this.cleanupJob(job.id);
            }, 2 * 60 * 60 * 1000);
        }
    }

    /**
     * Cleanup job metadata (không xóa files vì chúng ở trong project directory)
     */
    private async cleanupJob(jobId: string) {
        try {
            // Chỉ xóa job khỏi memory, không xóa files
            this.completedJobs.delete(jobId);
            console.log(`[CompilationQueue] Cleaned up job ${jobId} from memory`);
        } catch (error) {
            console.error(`[CompilationQueue] Failed to cleanup job ${jobId}:`, error);
        }
    }

    /**
     * Lấy PDF content của job đã hoàn thành
     */
    public async getPDF(jobId: string): Promise<Buffer | null> {
        const job = this.completedJobs.get(jobId);
        if (!job || !job.pdfPath) {
            return null;
        }

        try {
            return await fs.readFile(job.pdfPath);
        } catch (error) {
            console.error(`[CompilationQueue] Failed to read PDF for job ${jobId}:`, error);
            return null;
        }
    }

    /**
     * Lấy log content của job
     */
    public async getLog(jobId: string): Promise<string | null> {
        const job = this.getJob(jobId);
        if (!job) {
            return null;
        }

        try {
            // Get project owner ID for correct file path
            const project = await prisma.project.findUnique({
                where: { id: job.projectId },
                select: { ownerId: true },
            });

            if (!project) {
                console.error(`[CompilationQueue] Project ${job.projectId} not found for log`);
                return null;
            }

            // Use owner's directory
            const projectFilesDir = fileStorage.getProjectFilesDir(project.ownerId, job.projectId);
            const compileLogPath = path.join(projectFilesDir, 'compile.log');
            
            try {
                // Try to read compile.log first (available during compilation)
                const compileLog = await fs.readFile(compileLogPath, 'utf-8');
                if (compileLog) {
                    return compileLog;
                }
            } catch (err) {
                // compile.log not available yet, try job.logPath
            }
            
            // Fallback to job.logPath (LaTeX .log file, only after completion)
            if (job.logPath) {
                return await fs.readFile(job.logPath, 'utf-8');
            }
            
            return null;
        } catch (error) {
            console.error(`[CompilationQueue] Failed to read log for job ${jobId}:`, error);
            return null;
        }
    }

    /**
     * Extract missing image filenames from LaTeX compile log
     */
    private extractMissingImages(logContent: string): string[] {
        const missingImages: string[] = [];
        // Pattern: "Unable to load picture or PDF file 'filename.pdf'"
        const regex = /Unable to load picture or PDF file '([^']+)'/g;
        let match;
        
        while ((match = regex.exec(logContent)) !== null) {
            const filename = match[1];
            if (!missingImages.includes(filename)) {
                missingImages.push(filename);
            }
        }
        
        return missingImages;
    }

    /**
     * Generate placeholder images for missing files
     */
    private async generatePlaceholders(projectDir: string, filenames: string[]): Promise<void> {
        for (const filename of filenames) {
            try {
                const imagePath = path.join(projectDir, filename);
                
                // Check if file already exists (might have been uploaded during compilation)
                const exists = await fs.access(imagePath).then(() => true).catch(() => false);
                if (exists) {
                    continue;
                }

                // Determine output format based on extension
                const ext = path.extname(filename).toLowerCase();
                const isPDF = ext === '.pdf';
                
                // Create placeholder with ImageMagick
                const baseFilename = path.basename(filename);
                const text = `Missing Image\\n${baseFilename}`;
                
                // Use convert (ImageMagick) to create placeholder
                const cmd = isPDF
                    ? `convert -size 600x400 -gravity center -background "#f0f0f0" -fill "#666666" -font "Helvetica" -pointsize 20 label:"${text}" "${imagePath}"`
                    : `convert -size 600x400 -gravity center -background "#f0f0f0" -fill "#666666" -font "Helvetica" -pointsize 20 label:"${text}" "${imagePath}"`;
                
                await execAsync(cmd, {
                    cwd: projectDir,
                    timeout: 5000,
                });
                
                console.log(`[CompilationQueue] Generated placeholder for ${filename}`);
            } catch (error) {
                console.error(`[CompilationQueue] Failed to generate placeholder for ${filename}:`, error);
            }
        }
    }
}

// Singleton instance
export const compilationQueue = new CompilationQueue();
