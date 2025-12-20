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
    private readonly maxConcurrent: number; // configurable via COMPILATION_MAX_CONCURRENT env var
    private readonly tempDir: string = path.join(os.tmpdir(), 'heytex-compile');

    constructor() {
        // Tạo temp directory nếu chưa tồn tại
        this.initTempDir();
        // Configure max concurrent jobs from env or default to 10
        const envVal = process.env.COMPILATION_MAX_CONCURRENT || process.env.MAX_CONCURRENT;
        const parsed = envVal ? parseInt(envVal, 10) : NaN;
        this.maxConcurrent = !isNaN(parsed) && parsed > 0 ? parsed : 10;
    }

    private async initTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create temp directory:', error);
        }
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

        // Lấy job đầu tiên trong queue
        const job = this.queue.shift();
        if (!job) {
            return;
        }

        // Chuyển sang trạng thái compiling
        job.status = 'compiling';
        job.startedAt = new Date();
        this.activeJobs.set(job.id, job);

        // Compile trong background
        this.compileJob(job).finally(() => {
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
        const workDir = path.join(this.tempDir, job.id);

        try {
            // Tạo thư mục làm việc
            await fs.mkdir(workDir, { recursive: true });

            // Ghi file .tex
            const texPath = path.join(workDir, job.fileName);
            await fs.writeFile(texPath, job.content, 'utf-8');

            console.log(`[CompilationQueue] Compiling job ${job.id} for user ${job.userId}`);

            // Biên dịch với xelatex (3 lần để resolve references)
            const commands = [
                `cd "${workDir}" && xelatex -interaction=nonstopmode -halt-on-error "${job.fileName}"`,
                `cd "${workDir}" && xelatex -interaction=nonstopmode -halt-on-error "${job.fileName}"`,
                `cd "${workDir}" && xelatex -interaction=nonstopmode -halt-on-error "${job.fileName}"`,
            ];

            for (const cmd of commands) {
                try {
                    const { stdout, stderr } = await execAsync(cmd, {
                        cwd: workDir,
                        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                    });

                    // Log output
                    const logPath = path.join(workDir, 'compile.log');
                    await fs.appendFile(logPath, `\n=== Run ${commands.indexOf(cmd) + 1} ===\n`);
                    await fs.appendFile(logPath, stdout);
                    if (stderr) {
                        await fs.appendFile(logPath, '\n=== STDERR ===\n' + stderr);
                    }
                } catch (error: any) {
                    // XeLaTeX có thể return error code nhưng vẫn tạo PDF
                    // Tiếp tục để check PDF có tồn tại không
                    const logPath = path.join(workDir, 'compile.log');
                    await fs.appendFile(logPath, `\n=== Error in run ${commands.indexOf(cmd) + 1} ===\n`);
                    await fs.appendFile(logPath, error.stdout || '');
                    await fs.appendFile(logPath, error.stderr || '');
                }
            }

            // Kiểm tra PDF có được tạo không
            const pdfFileName = job.fileName.replace(/\.tex$/, '.pdf');
            const pdfPath = path.join(workDir, pdfFileName);
            const logPath = path.join(workDir, job.fileName.replace(/\.tex$/, '.log'));

            const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);

            if (pdfExists) {
                job.status = 'completed';
                job.pdfPath = pdfPath;
                job.logPath = logPath;
                console.log(`[CompilationQueue] Job ${job.id} completed successfully`);
            } else {
                job.status = 'failed';
                job.error = 'PDF was not generated';
                job.logPath = logPath;
                console.error(`[CompilationQueue] Job ${job.id} failed: PDF not generated`);
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

            // Cleanup sau 30 phút
            setTimeout(() => {
                this.cleanupJob(job.id);
            }, 30 * 60 * 1000);
        }
    }

    /**
     * Cleanup job files
     */
    private async cleanupJob(jobId: string) {
        try {
            const workDir = path.join(this.tempDir, jobId);
            await fs.rm(workDir, { recursive: true, force: true });
            this.completedJobs.delete(jobId);
            console.log(`[CompilationQueue] Cleaned up job ${jobId}`);
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
        if (!job || !job.logPath) {
            return null;
        }

        try {
            return await fs.readFile(job.logPath, 'utf-8');
        } catch (error) {
            console.error(`[CompilationQueue] Failed to read log for job ${jobId}:`, error);
            return null;
        }
    }
}

// Singleton instance
export const compilationQueue = new CompilationQueue();
