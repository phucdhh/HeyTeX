/**
 * Upload Middleware
 * Rate limiting and security for uploads
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Simple in-memory rate limiter
class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    check(key: string): boolean {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Get existing requests for this key
        let requests = this.requests.get(key) || [];
        
        // Remove old requests outside the window
        requests = requests.filter(time => time > windowStart);

        // Check if limit exceeded
        if (requests.length >= this.maxRequests) {
            return false;
        }

        // Add current request
        requests.push(now);
        this.requests.set(key, requests);

        return true;
    }

    reset(key: string): void {
        this.requests.delete(key);
    }
}

// Rate limiters for different upload types
const fileUploadLimiter = new RateLimiter(
    15 * 60 * 1000, // 15 minutes
    500 // max 500 uploads per 15 min
);

const zipUploadLimiter = new RateLimiter(
    60 * 1000, // 1 minute
    20 // max 20 zip uploads per minute
);

/**
 * Rate limit middleware for file uploads
 */
export const uploadRateLimit = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const allowed = fileUploadLimiter.check(userId);

    if (!allowed) {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many upload requests. Please wait a moment and try again.',
            retryAfter: 60 // seconds
        });
        return;
    }

    next();
};

/**
 * Rate limit middleware for zip uploads
 */
export const zipUploadRateLimit = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const allowed = zipUploadLimiter.check(userId);

    if (!allowed) {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many zip upload requests. Please wait a moment and try again.',
            retryAfter: 60 // seconds
        });
        return;
    }

    next();
};

/**
 * Validate upload request middleware
 */
export const validateUploadRequest = (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
        res.status(400).json({
            error: 'Invalid content type',
            message: 'Expected multipart/form-data'
        });
        return;
    }

    next();
};

/**
 * Log upload activity
 */
export const logUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const projectId = req.body?.projectId || req.query?.projectId;
    
    console.log('[Upload] Request:', {
        userId,
        projectId,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    next();
};
