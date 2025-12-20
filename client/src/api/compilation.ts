/**
 * API Client for Compilation Service
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5433';

export interface CompileJobResponse {
    success: boolean;
    jobId: string;
    status: 'queued' | 'compiling' | 'completed' | 'failed';
    queuePosition?: number;
    stats: {
        compiling: number;
        queued: number;
    };
}

export interface JobStatusResponse {
    success: boolean;
    job: {
        id: string;
        status: 'queued' | 'compiling' | 'completed' | 'failed';
        queuePosition?: number;
        createdAt: string;
        startedAt?: string;
        completedAt?: string;
        error?: string;
    };
    stats: {
        compiling: number;
        queued: number;
    };
}

export interface StatsResponse {
    success: boolean;
    stats: {
        compiling: number;
        queued: number;
        total: number;
        available: number;
    };
}

export class CompilationAPI {
    private token: string | null = null;

    constructor() {
        // Get token from localStorage
        this.token = localStorage.getItem('token');
    }

    private get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Submit a compilation job
     */
    async submitJob(fileName: string, content: string, projectId?: string): Promise<CompileJobResponse> {
        const response = await axios.post<CompileJobResponse>(
            `${API_URL}/api/compile`,
            { fileName, content, projectId },
            { headers: this.headers }
        );
        return response.data;
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<JobStatusResponse> {
        const response = await axios.get<JobStatusResponse>(
            `${API_URL}/api/compile/${jobId}`,
            { headers: this.headers }
        );
        return response.data;
    }

    /**
     * Get PDF for completed job
     */
    async getPDF(jobId: string): Promise<Blob> {
        const response = await axios.get(
            `${API_URL}/api/compile/${jobId}/pdf`,
            {
                headers: this.headers,
                responseType: 'blob',
            }
        );
        return response.data;
    }

    /**
     * Get compilation log
     */
    async getLog(jobId: string): Promise<string> {
        const response = await axios.get(
            `${API_URL}/api/compile/${jobId}/log`,
            {
                headers: this.headers,
                responseType: 'text',
            }
        );
        return response.data;
    }

    /**
     * Get queue statistics (public endpoint)
     */
    async getStats(): Promise<StatsResponse> {
        const response = await axios.get<StatsResponse>(
            `${API_URL}/api/compile/stats`
        );
        return response.data;
    }

    /**
     * Poll job status until completed or failed
     */
    async pollJobStatus(
        jobId: string,
        onUpdate?: (status: JobStatusResponse) => void,
        interval: number = 1000
    ): Promise<JobStatusResponse> {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.getJobStatus(jobId);
                    
                    if (onUpdate) {
                        onUpdate(status);
                    }

                    if (status.job.status === 'completed' || status.job.status === 'failed') {
                        resolve(status);
                    } else {
                        setTimeout(poll, interval);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }
}

// Singleton instance
export const compilationAPI = new CompilationAPI();
