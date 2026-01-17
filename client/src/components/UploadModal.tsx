/**
 * Enhanced Upload Modal Component
 * Similar to Overleaf CE upload functionality
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { ProjectFile } from '../lib/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5433';

interface UploadFile {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface UploadModalProps {
    projectId: string;
    targetPath?: string;
    onClose: () => void;
    onSuccess?: () => void;
    onUploadComplete?: (files: ProjectFile[]) => void;
}

export function UploadModal({ projectId, targetPath = '/', onClose, onSuccess, onUploadComplete }: UploadModalProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        // Cache files immediately before any async operations (DataTransfer gets cleared)
        const cachedFiles = Array.from(e.dataTransfer.files);
        const items = Array.from(e.dataTransfer.items);
        const allFiles: File[] = [];

        // Check if browser supports webkitGetAsEntry (for folders)
        const supportsFileSystemAPI = items.length > 0 && items[0].webkitGetAsEntry !== undefined;

        if (supportsFileSystemAPI) {
            // Process all dropped items (files and folders) using FileSystem API
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                // Some browsers set kind to empty string for subsequent items
                if (item.kind === 'file' || item.kind === '') {
                    const entry = item.webkitGetAsEntry();
                    
                    if (entry) {
                        try {
                            const files = await traverseFileTree(entry);
                            allFiles.push(...files);
                        } catch (error) {
                            console.error('[Upload] Error processing entry:', entry?.name, error);
                        }
                    } else {
                        // Fallback to getAsFile() if webkitGetAsEntry fails
                        const file = item.getAsFile();
                        if (file) {
                            allFiles.push(file);
                        }
                    }
                }
            }
            
            // If we got fewer files than expected, use cached files as fallback
            if (allFiles.length < cachedFiles.length) {
                allFiles.length = 0; // Clear
                allFiles.push(...cachedFiles);
            }
        } else {
            // Fallback for simple file drops without FileSystem API
            allFiles.push(...cachedFiles);
        }
        addFiles(allFiles);
    }, []);

    // Recursively traverse folders to get all files
    const traverseFileTree = async (item: any, path = ''): Promise<File[]> => {
        return new Promise((resolve, reject) => {
            if (item.isFile) {
                item.file((file: File) => {
                    // Create a new File object with the relative path
                    const relativePath = path + file.name;
                    const fileWithPath = new File([file], relativePath, { type: file.type });
                    // Store the relative path in a custom property
                    (fileWithPath as any).relativePath = relativePath;
                    resolve([fileWithPath]);
                }, reject);
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                const entries: any[] = [];
                
                const readEntries = () => {
                    dirReader.readEntries(async (results: any[]) => {
                        if (results.length === 0) {
                            // Done reading this directory
                            const allFiles: File[] = [];
                            for (const entry of entries) {
                                const files = await traverseFileTree(entry, path + item.name + '/');
                                allFiles.push(...files);
                            }
                            resolve(allFiles);
                        } else {
                            entries.push(...results);
                            readEntries(); // Continue reading
                        }
                    }, reject);
                };
                
                readEntries();
            } else {
                resolve([]);
            }
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const filesArray = Array.from(selectedFiles);
            // For file input, try to preserve webkitRelativePath if available
            const filesWithPath = filesArray.map(file => {
                if ((file as any).webkitRelativePath) {
                    (file as any).relativePath = (file as any).webkitRelativePath;
                }
                return file;
            });
            addFiles(filesWithPath);
        }
    };

    const addFiles = (newFiles: File[]) => {
        const uploadFiles: UploadFile[] = newFiles.map(file => ({
            file,
            progress: 0,
            status: 'pending' as const,
        }));
        setFiles(prev => [...prev, ...uploadFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        setIsUploading(true);

        const uploadedFiles: ProjectFile[] = [];
        const token = localStorage.getItem('heytex_token');

        // Upload files one by one to preserve folder structure
        for (let i = 0; i < files.length; i++) {
            const uploadFile = files[i];
            
            try {
                setFiles(prev => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'uploading', progress: 0 };
                    return updated;
                });

                // Use FormData for multipart upload
                const formData = new FormData();
                formData.append('files', uploadFile.file);
                formData.append('projectId', projectId);
                
                // Include relative path for folder structure
                const relativePath = (uploadFile.file as any).relativePath || uploadFile.file.name;
                formData.append('relativePath', relativePath);
                formData.append('targetPath', targetPath);

                const response = await fetch(`${API_URL}/upload/files`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                    throw new Error(errorData.error || 'Upload failed');
                }

                const result = await response.json();
                // Backend returns { success: true, files: [...] }
                if (result.files && result.files.length > 0) {
                    uploadedFiles.push(...result.files);
                }

                setFiles(prev => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], status: 'success', progress: 100 };
                    return updated;
                });
            } catch (error) {
                setFiles(prev => {
                    const updated = [...prev];
                    updated[i] = {
                        ...updated[i],
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Upload failed',
                    };
                    return updated;
                });
            }
        }

        setIsUploading(false);

        if (uploadedFiles.length > 0) {
            onSuccess?.();
            onUploadComplete?.(uploadedFiles);
        }

        const allSucceeded = files.every((_, idx) => {
            const current = files[idx];
            return current?.status === 'success';
        });

        if (allSucceeded) {
            setTimeout(onClose, 1000);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg w-[90%] max-w-2xl max-h-[80vh] flex flex-col shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {targetPath === '/' ? 'Upload Files' : `Upload to ${targetPath}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 p-5 overflow-y-auto">
                    <div
                        className={`
                            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
                            transition-all duration-200
                            ${isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-400 hover:bg-blue-50/50'
                            }
                        `}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {isDragging ? 'Drop files or folders here' : 'Drag & drop files or folders here'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Supports multiple files, folders, and ZIP archives
                        </p>
                        <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Select Files
                            </button>
                            <button
                                onClick={() => folderInputRef.current?.click()}
                                className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            >
                                Select Folder
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <input
                            ref={folderInputRef}
                            type="file"
                            /* @ts-ignore - webkitdirectory is not in TypeScript types */
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Selected Files ({files.length})
                            </h3>
                            <div className="space-y-2">
                                {files.map((uploadFile, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {(uploadFile.file as any).relativePath || uploadFile.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(uploadFile.file.size)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {uploadFile.status === 'uploading' && (
                                                <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-300"
                                                        style={{ width: `${uploadFile.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {uploadFile.status === 'success' && (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                            {uploadFile.status === 'error' && (
                                                <div title={uploadFile.error}>
                                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                                </div>
                                            )}

                                            {uploadFile.status === 'pending' && (
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    disabled={isUploading}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            const allCompleted = files.every(f => f.status === 'success' || f.status === 'error');
                            if (allCompleted && !isUploading) {
                                onClose();
                            } else {
                                handleUpload();
                            }
                        }}
                        disabled={files.length === 0 || isUploading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {(() => {
                            const allCompleted = files.every(f => f.status === 'success' || f.status === 'error');
                            if (allCompleted && !isUploading) return 'Close';
                            if (isUploading) return 'Uploading...';
                            return `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`;
                        })()}
                    </button>
                </div>
            </div>
        </div>
    );
}
