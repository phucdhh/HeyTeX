import { Router } from 'express';
import http from 'http';

const router = Router();

const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434');

// Proxy all requests to local Ollama instance.
// Normalise path: the deployed client omits the leading /api prefix (calls
// /tags, /chat), while the compiled source uses /api/tags, /api/chat.
// We add /api/ when it is missing so both versions work.
router.all('/*', (req, res) => {
    let ollamaPath = req.path;
    if (!ollamaPath.startsWith('/api/')) {
        ollamaPath = '/api' + ollamaPath;
    }

    const hasRequestBody = req.method !== 'GET' && req.method !== 'HEAD';
    const requestBody = hasRequestBody ? JSON.stringify(req.body ?? {}) : '';
    const requestHeaders: Record<string, string> = {
        host: `${OLLAMA_HOST}:${OLLAMA_PORT}`,
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

    const options: http.RequestOptions = {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: ollamaPath,
        method: req.method,
        headers: requestHeaders,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[Ollama Proxy] Error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Cannot connect to Ollama service' });
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
