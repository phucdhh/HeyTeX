import { Router } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';

const router = Router();
const CEREBRAS_HOST = 'api.cerebras.ai';

let cachedApiKey: string | null = null;

function loadApiKeyFromClientEnv(): string {
    try {
        const clientEnvPath = path.resolve(process.cwd(), '../client/.env');
        if (!fs.existsSync(clientEnvPath)) {
            return '';
        }

        const envContent = fs.readFileSync(clientEnvPath, 'utf8');
        const match = envContent.match(/^VITE_CEREBRAS_API_KEY=(.*)$/m);
        return match?.[1]?.trim() || '';
    } catch (error) {
        console.warn('[Cerebras Proxy] Failed to read client/.env:', error);
        return '';
    }
}

function getCerebrasApiKey(): string {
    if (cachedApiKey) {
        return cachedApiKey;
    }

    cachedApiKey = process.env.CEREBRAS_API_KEY
        || process.env.VITE_CEREBRAS_API_KEY
        || loadApiKeyFromClientEnv();

    return cachedApiKey;
}

router.all('/*', (req, res) => {
    const apiKey = getCerebrasApiKey();
    if (!apiKey) {
        return res.status(500).json({ error: 'Cerebras API key is not configured on the server' });
    }

    const hasRequestBody = req.method !== 'GET' && req.method !== 'HEAD';
    const requestBody = hasRequestBody ? JSON.stringify(req.body ?? {}) : '';

    const requestHeaders: Record<string, string> = {
        authorization: `Bearer ${apiKey}`,
        host: CEREBRAS_HOST,
    };

    if (typeof req.headers['content-type'] === 'string') {
        requestHeaders['content-type'] = req.headers['content-type'];
    }

    if (typeof req.headers.accept === 'string') {
        requestHeaders.accept = req.headers.accept;
    }

    if (hasRequestBody) {
        requestHeaders['content-length'] = Buffer.byteLength(requestBody).toString();
    }

    const options: https.RequestOptions = {
        hostname: CEREBRAS_HOST,
        port: 443,
        path: `/v1${req.path}`,
        method: req.method,
        headers: requestHeaders,
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[Cerebras Proxy] Error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Cannot connect to Cerebras service' });
        }
    });

    if (hasRequestBody) {
        proxyReq.write(requestBody);
        proxyReq.end();
    } else {
        proxyReq.end();
    }
});

export default router;
