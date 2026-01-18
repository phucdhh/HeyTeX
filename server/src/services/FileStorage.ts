/**
 * FileStorage Service
 * Quản lý cấu trúc thư mục và files cho từng user
 * Structure: users/{userId}/{projectId}/files/...
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export class FileStorageService {
    private readonly baseDir: string;

    constructor(baseDir: string = path.join(process.cwd(), '../users')) {
        this.baseDir = baseDir;
        this.initBaseDir();
    }

    private async initBaseDir() {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
            console.log(`[FileStorage] Base directory initialized: ${this.baseDir}`);
        } catch (error) {
            console.error('[FileStorage] Failed to create base directory:', error);
        }
    }

    /**
     * Lấy đường dẫn thư mục của user
     */
    public getUserDir(userId: string): string {
        return path.join(this.baseDir, userId);
    }

    /**
     * Lấy đường dẫn thư mục của project
     */
    public getProjectDir(userId: string, projectId: string): string {
        return path.join(this.getUserDir(userId), projectId);
    }

    /**
     * Lấy đường dẫn thư mục files của project
     * Files are stored directly in project directory, not in a 'files' subdirectory
     */
    public getProjectFilesDir(userId: string, projectId: string): string {
        return this.getProjectDir(userId, projectId);
    }

    /**
     * Lấy đường dẫn file cụ thể
     */
    public getFilePath(userId: string, projectId: string, relativePath: string): string {
        // Remove leading slash if present
        const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
        return path.join(this.getProjectFilesDir(userId, projectId), cleanPath);
    }

    /**
     * Tạo thư mục user nếu chưa tồn tại
     */
    public async ensureUserDir(userId: string): Promise<void> {
        const userDir = this.getUserDir(userId);
        if (!existsSync(userDir)) {
            await fs.mkdir(userDir, { recursive: true });
            console.log(`[FileStorage] Created user directory: ${userId}`);
        }
    }

    /**
     * Tạo thư mục project
     */
    public async createProjectDir(userId: string, projectId: string): Promise<void> {
        await this.ensureUserDir(userId);
        
        const projectDir = this.getProjectDir(userId, projectId);
        const filesDir = this.getProjectFilesDir(userId, projectId);
        
        await fs.mkdir(projectDir, { recursive: true });
        await fs.mkdir(filesDir, { recursive: true });
        
        // Tạo file metadata.json để lưu thông tin project
        const metadataPath = path.join(projectDir, 'metadata.json');
        const metadata = {
            projectId,
            userId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        };
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`[FileStorage] Created project directory: ${userId}/${projectId}`);
    }

    /**
     * Lưu file content
     */
    public async saveFile(
        userId: string,
        projectId: string,
        relativePath: string,
        content: string | Buffer
    ): Promise<void> {
        const filePath = this.getFilePath(userId, projectId, relativePath);
        const fileDir = path.dirname(filePath);
        
        // Tạo thư mục cha nếu chưa tồn tại
        await fs.mkdir(fileDir, { recursive: true });
        
        // Lưu file
        await fs.writeFile(filePath, content, 'utf-8');
        
        // Update last modified trong metadata
        await this.updateProjectMetadata(userId, projectId);
    }

    /**
     * Đọc file content
     */
    public async readFile(
        userId: string,
        projectId: string,
        relativePath: string
    ): Promise<string> {
        const filePath = this.getFilePath(userId, projectId, relativePath);
        return await fs.readFile(filePath, 'utf-8');
    }

    /**
     * Xóa file
     */
    public async deleteFile(
        userId: string,
        projectId: string,
        relativePath: string
    ): Promise<void> {
        const filePath = this.getFilePath(userId, projectId, relativePath);
        await fs.unlink(filePath);
        await this.updateProjectMetadata(userId, projectId);
    }

    /**
     * Tạo thư mục
     */
    public async createFolder(
        userId: string,
        projectId: string,
        relativePath: string
    ): Promise<void> {
        const folderPath = this.getFilePath(userId, projectId, relativePath);
        await fs.mkdir(folderPath, { recursive: true });
        await this.updateProjectMetadata(userId, projectId);
    }

    /**
     * Xóa thư mục
     */
    public async deleteFolder(
        userId: string,
        projectId: string,
        relativePath: string
    ): Promise<void> {
        const folderPath = this.getFilePath(userId, projectId, relativePath);
        await fs.rm(folderPath, { recursive: true, force: true });
        await this.updateProjectMetadata(userId, projectId);
    }

    /**
     * Xóa toàn bộ project
     */
    public async deleteProject(userId: string, projectId: string): Promise<void> {
        const projectDir = this.getProjectDir(userId, projectId);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(`[FileStorage] Deleted project: ${userId}/${projectId}`);
    }

    /**
     * Lấy danh sách files trong thư mục
     */
    public async listFiles(
        userId: string,
        projectId: string,
        relativePath: string = ''
    ): Promise<string[]> {
        const dirPath = relativePath
            ? this.getFilePath(userId, projectId, relativePath)
            : this.getProjectFilesDir(userId, projectId);
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return entries.map(entry => entry.name);
        } catch (error) {
            return [];
        }
    }

    /**
     * Kiểm tra file có tồn tại không
     */
    public fileExists(userId: string, projectId: string, relativePath: string): boolean {
        const filePath = this.getFilePath(userId, projectId, relativePath);
        return existsSync(filePath);
    }

    /**
     * Update project metadata
     */
    private async updateProjectMetadata(userId: string, projectId: string): Promise<void> {
        const metadataPath = path.join(this.getProjectDir(userId, projectId), 'metadata.json');
        try {
            const content = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(content);
            metadata.lastModified = new Date().toISOString();
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            // Metadata file might not exist for old projects
            console.warn(`[FileStorage] Failed to update metadata for ${userId}/${projectId}`);
        }
    }

    /**
     * Lấy thông tin metadata của project
     */
    public async getProjectMetadata(userId: string, projectId: string): Promise<any> {
        const metadataPath = path.join(this.getProjectDir(userId, projectId), 'metadata.json');
        try {
            const content = await fs.readFile(metadataPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    /**
     * Lấy danh sách projects của user
     */
    public async getUserProjects(userId: string): Promise<string[]> {
        const userDir = this.getUserDir(userId);
        try {
            const entries = await fs.readdir(userDir, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);
        } catch (error) {
            return [];
        }
    }

    /**
     * Lấy tổng dung lượng của user (tất cả projects)
     */
    public async getUserStorageSize(userId: string): Promise<number> {
        const userDir = this.getUserDir(userId);
        try {
            return await this.getDirectorySize(userDir);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Lấy dung lượng của một project
     */
    public async getProjectStorageSize(userId: string, projectId: string): Promise<number> {
        const projectDir = this.getProjectDir(userId, projectId);
        try {
            return await this.getDirectorySize(projectDir);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Helper: Tính tổng dung lượng của thư mục (recursive)
     */
    private async getDirectorySize(dirPath: string): Promise<number> {
        let totalSize = 0;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    totalSize += await this.getDirectorySize(fullPath);
                } else {
                    const stats = await fs.stat(fullPath);
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            console.error(`[FileStorage] Error calculating size for ${dirPath}:`, error);
        }
        
        return totalSize;
    }

    /**
     * Rename/move file
     */
    public async renameFile(
        userId: string,
        projectId: string,
        oldPath: string,
        newPath: string
    ): Promise<void> {
        const oldFilePath = this.getFilePath(userId, projectId, oldPath);
        const newFilePath = this.getFilePath(userId, projectId, newPath);
        
        // Tạo thư mục đích nếu cần
        const newDir = path.dirname(newFilePath);
        await fs.mkdir(newDir, { recursive: true });
        
        // Rename file
        await fs.rename(oldFilePath, newFilePath);
        await this.updateProjectMetadata(userId, projectId);
    }

    /**
     * Copy file
     */
    public async copyFile(
        userId: string,
        projectId: string,
        sourcePath: string,
        destPath: string
    ): Promise<void> {
        const sourceFilePath = this.getFilePath(userId, projectId, sourcePath);
        const destFilePath = this.getFilePath(userId, projectId, destPath);
        
        // Tạo thư mục đích nếu cần
        const destDir = path.dirname(destFilePath);
        await fs.mkdir(destDir, { recursive: true });
        
        // Copy file
        await fs.copyFile(sourceFilePath, destFilePath);
        await this.updateProjectMetadata(userId, projectId);
    }
}

// Export singleton instance
export const fileStorage = new FileStorageService();
