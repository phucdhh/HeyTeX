import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const router = Router();

// Map Kpathsea format IDs to format names
const FORMAT_MAP: Record<number, string> = {
    1: 'pk',
    3: 'tfm',
    4: 'vf',
    10: 'fmt',
    20: 'map',
    26: 'tex',
    32: 'type1 fonts',
    34: 'enc',
    36: 'truetype fonts',
    45: 'opentype fonts',
    // Add others as needed
};

// Helper to run kpsewhich
async function findFile(filename: string, formatId: number): Promise<string | null> {
    try {
        const format = FORMAT_MAP[formatId];
        const cmd = format
            ? `kpsewhich --format="${format}" "${filename}"`
            : `kpsewhich "${filename}"`;

        const { stdout } = await execAsync(cmd);
        const filePath = stdout.trim();
        return filePath && fs.existsSync(filePath) ? filePath : null;
    } catch (e) {
        return null;
    }
}

async function findPk(filename: string, dpi: number): Promise<string | null> {
    try {
        const cmd = `kpsewhich --format=pk --dpi=${dpi} "${filename}"`;
        const { stdout } = await execAsync(cmd);
        const filePath = stdout.trim();
        return filePath && fs.existsSync(filePath) ? filePath : null;
    } catch (e) {
        return null;
    }
}

// Route for standard files
router.get('/pdftex/:format/:filename', async (req: Request, res: Response) => {
    const format = parseInt(req.params.format);
    const filename = req.params.filename;

    // Special case for our custom format file
    if (filename === 'swiftlatexpdftex.fmt') {
        const customPath = path.resolve(__dirname, '../../../../client/public/core/swiftlatex/pdftex/10/swiftlatexpdftex.fmt');
        if (fs.existsSync(customPath)) {
            res.setHeader('fileid', filename);
            res.setHeader('Access-Control-Expose-Headers', 'fileid');
            return res.sendFile(customPath);
        }
    }

    const filePath = await findFile(filename, format);

    if (filePath) {
        res.setHeader('fileid', path.basename(filePath));
        res.setHeader('Access-Control-Expose-Headers', 'fileid');
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Route for XeTeX files
router.get('/xetex/:format/:filename', async (req: Request, res: Response) => {
    const format = parseInt(req.params.format);
    const filename = req.params.filename;

    console.log(`[XeTeX Route] Requested: ${filename}, format: ${format}`);

    // Special case for our custom XeTeX format file
    if (filename === 'swiftlatexxetex.fmt') {
        const customPath = path.resolve(__dirname, '../../../client/public/core/swiftlatex/xetex/10/swiftlatexxetex.fmt');
        console.log(`[XeTeX Route] Custom path: ${customPath}`);
        console.log(`[XeTeX Route] File exists: ${fs.existsSync(customPath)}`);
        
        if (fs.existsSync(customPath)) {
            res.setHeader('fileid', filename);
            res.setHeader('Access-Control-Expose-Headers', 'fileid');
            return res.sendFile(customPath);
        }
    }

    const filePath = await findFile(filename, format);

    if (filePath) {
        res.setHeader('fileid', path.basename(filePath));
        res.setHeader('Access-Control-Expose-Headers', 'fileid');
        res.sendFile(filePath);
    } else {
        console.log(`[XeTeX Route] File not found: ${filename}`);
        res.status(404).send('File not found');
    }
});

// Route for PK fonts
router.get('/pdftex/pk/:dpi/:filename', async (req: Request, res: Response) => {
    const dpi = parseInt(req.params.dpi);
    const filename = req.params.filename;

    const filePath = await findPk(filename, dpi);

    if (filePath) {
        res.setHeader('pkid', path.basename(filePath));
        res.setHeader('Access-Control-Expose-Headers', 'pkid');
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

export default router;
