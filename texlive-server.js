#!/usr/bin/env node
/**
 * Simple TeXLive Server for SwiftLaTeX
 * Serves TeXLive format files and packages on-demand using kpsewhich
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 5435;

// Ensure TeXLive binaries are in PATH
if (!process.env.PATH.includes('/opt/homebrew/bin')) {
    process.env.PATH = '/opt/homebrew/bin:' + process.env.PATH;
}
if (!process.env.PATH.includes('/Library/TeX/texbin')) {
    process.env.PATH = '/Library/TeX/texbin:' + process.env.PATH;
}

// Enable CORS for all origins (adjust for production)
app.use(cors({
    origin: '*',
    exposedHeaders: ['fileid', 'pkid']
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Map Kpathsea format IDs to format names
const FORMAT_MAP = {
    1: 'pk',
    3: 'tfm',
    4: 'vf',
    10: 'fmt',
    11: 'other text files',  // Map files (.map, .txt)
    20: 'map',
    26: 'tex',
    32: 'type1 fonts',
    34: 'enc',
    36: 'truetype fonts',
    41: 'misc fonts',  // XeTeX mapping files (.tec)
    45: 'opentype fonts',
    47: 'other text files', // Fallback for unknown formats
};

/**
 * Find file using kpsewhich
 */
async function findFile(filename, formatId, engineType = 'xetex') {
    try {
        // First check client public directory
        const clientPath = path.join(__dirname, 'client', 'public', 'core', 'swiftlatex', engineType, String(formatId), filename);
        
        if (fs.existsSync(clientPath)) {
            console.log(`✅ Found in client: ${clientPath}`);
            return clientPath;
        }
        
        // For fonts, try common extensions if no extension provided
        const fontFormats = [32, 36, 45, 47]; // type1, truetype, opentype
        if (fontFormats.includes(formatId) && !filename.includes('.')) {
            const extensions = ['.otf', '.ttf', '.pfb', '.pfa'];
            for (const ext of extensions) {
                try {
                    const { stdout } = await execAsync(`kpsewhich "${filename}${ext}"`);
                    const filePath = stdout.trim();
                    if (filePath && fs.existsSync(filePath)) {
                        console.log(`✅ Found font with extension: ${filePath}`);
                        return filePath;
                    }
                } catch (e) {
                    // Try next extension
                }
            }
        }
        
        // Fallback to kpsewhich
        const format = FORMAT_MAP[formatId];
        const cmd = format
            ? `kpsewhich --format="${format}" "${filename}"`
            : `kpsewhich "${filename}"`;

        try {
            const { stdout, stderr } = await execAsync(cmd);
            if (stderr) {
                console.warn(`kpsewhich warning: ${stderr}`);
            }
            
            const filePath = stdout.trim();
            if (filePath && fs.existsSync(filePath)) {
                return filePath;
            }
        } catch (kpseError) {
            // kpsewhich failed, try fallback
            console.log(`kpsewhich failed for ${filename}, trying fallback...`);
        }
        
        // Fallback: search in common TeXLive locations
        if (formatId === 10) { // fmt files
            const commonPaths = [
                `/opt/homebrew/Cellar/texlive/20250308_2/share/texmf-var/web2c/${engineType}/${filename}`,
                `/usr/local/texlive/2024/texmf-var/web2c/${engineType}/${filename}`,
                `/usr/local/texlive/2023/texmf-var/web2c/${engineType}/${filename}`,
            ];
            
            for (const testPath of commonPaths) {
                if (fs.existsSync(testPath)) {
                    console.log(`✅ Found via fallback: ${testPath}`);
                    return testPath;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error(`Error finding file ${filename}:`, error.message);
        return null;
    }
}

/**
 * Find PK font file
 */
async function findPkFont(filename, dpi) {
    try {
        const cmd = `kpsewhich --format=pk --dpi=${dpi} "${filename}"`;
        const { stdout } = await execAsync(cmd);
        const filePath = stdout.trim();
        return filePath && fs.existsSync(filePath) ? filePath : null;
    } catch (error) {
        return null;
    }
}

/**
 * Route: /xetex/:format/:filename
 * Serves XeTeX format files and packages
 */
app.get('/xetex/:format/:filename', async (req, res) => {
    const { format, filename } = req.params;
    const formatId = parseInt(format);

    console.log(`[XeTeX] Requested: ${filename} (format: ${formatId})`);

    try {
        const filePath = await findFile(filename, formatId, 'xetex');

        if (filePath) {
            console.log(`[XeTeX] Found: ${filePath}`);
            res.setHeader('fileid', path.basename(filePath));
            res.setHeader('Access-Control-Expose-Headers', 'fileid');
            return res.sendFile(filePath);
        } else {
            console.log(`[XeTeX] Not found: ${filename}`);
            return res.status(404).send('File not found');
        }
    } catch (error) {
        console.error(`[XeTeX] Error:`, error);
        return res.status(500).send('Internal server error');
    }
});

/**
 * Route: /pdftex/:format/:filename
 * Serves pdfTeX format files and packages
 */
app.get('/pdftex/:format/:filename', async (req, res) => {
    const { format, filename } = req.params;
    const formatId = parseInt(format);

    console.log(`[pdfTeX] Requested: ${filename} (format: ${formatId})`);

    try {
        const filePath = await findFile(filename, formatId, 'pdftex');

        if (filePath) {
            console.log(`[pdfTeX] Found: ${filePath}`);
            res.setHeader('fileid', path.basename(filePath));
            res.setHeader('Access-Control-Expose-Headers', 'fileid');
            return res.sendFile(filePath);
        } else {
            console.log(`[pdfTeX] Not found: ${filename}`);
            return res.status(404).send('File not found');
        }
    } catch (error) {
        console.error(`[pdfTeX] Error:`, error);
        return res.status(500).send('Internal server error');
    }
});

/**
 * Route: /pdftex/pk/:dpi/:filename
 * Serves PK font files
 */
app.get('/pdftex/pk/:dpi/:filename', async (req, res) => {
    const { dpi, filename } = req.params;

    console.log(`[PK Font] Requested: ${filename} at ${dpi}dpi`);

    try {
        const filePath = await findPkFont(filename, parseInt(dpi));

        if (filePath) {
            console.log(`[PK Font] Found: ${filePath}`);
            res.setHeader('pkid', path.basename(filePath));
            res.setHeader('Access-Control-Expose-Headers', 'pkid');
            return res.sendFile(filePath);
        } else {
            console.log(`[PK Font] Not found: ${filename}`);
            return res.status(404).send('File not found');
        }
    } catch (error) {
        console.error(`[PK Font] Error:`, error);
        return res.status(500).send('Internal server error');
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'TeXLive Server',
        timestamp: new Date().toISOString()
    });
});

/**
 * Root endpoint - show info
 */
app.get('/', (req, res) => {
    res.json({
        service: 'TeXLive On-Demand Server',
        version: '1.0.0',
        endpoints: {
            xetex: '/xetex/:format/:filename',
            pdftex: '/pdftex/:format/:filename',
            pkfonts: '/pdftex/pk/:dpi/:filename',
            health: '/health'
        },
        formats: FORMAT_MAP
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       TeXLive On-Demand Server                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📍 XeTeX endpoint:    http://localhost:${PORT}/xetex/:format/:filename`);
    console.log(`📍 pdfTeX endpoint:   http://localhost:${PORT}/pdftex/:format/:filename`);
    console.log(`📍 Health check:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('Note: This server uses kpsewhich to find TeXLive files on the system.');
    console.log('      Make sure TeXLive is installed and kpsewhich is in PATH.');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});
