import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

interface Template {
    id: string;
    name: string;
    description: string;
    engine: 'LATEX' | 'TYPST';
    mainFile: string;
    files: Array<{
        path: string;
        content: string;
    }>;
}

const TEMPLATES_DIR = path.join(process.cwd(), '../templates');

/**
 * GET /api/templates
 * Get list of all available templates
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const templates: Record<string, Template[]> = {
            LATEX: [],
            TYPST: [],
        };

        // Read LaTeX templates
        const latexDir = path.join(TEMPLATES_DIR, 'latex');
        try {
            const latexCategories = await fs.readdir(latexDir);
            for (const category of latexCategories) {
                const templateFile = path.join(latexDir, category, 'template.json');
                try {
                    const content = await fs.readFile(templateFile, 'utf-8');
                    const template = JSON.parse(content);
                    templates.LATEX.push({
                        ...template,
                        category,
                    });
                } catch (error) {
                    // Skip if template.json doesn't exist
                    console.warn(`No template.json in ${category}`);
                }
            }
        } catch (error) {
            console.warn('No LaTeX templates directory');
        }

        // Read Typst templates
        const typstDir = path.join(TEMPLATES_DIR, 'typst');
        try {
            const typstCategories = await fs.readdir(typstDir);
            for (const category of typstCategories) {
                const templateFile = path.join(typstDir, category, 'template.json');
                try {
                    const content = await fs.readFile(templateFile, 'utf-8');
                    const template = JSON.parse(content);
                    templates.TYPST.push({
                        ...template,
                        category,
                    });
                } catch (error) {
                    // Skip if template.json doesn't exist
                    console.warn(`No template.json in ${category}`);
                }
            }
        } catch (error) {
            console.warn('No Typst templates directory');
        }

        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to get templates' });
    }
});

/**
 * GET /api/templates/:engine/:templateId
 * Get specific template files
 */
router.get('/:engine/:templateId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { engine, templateId } = req.params;

        if (!['latex', 'typst'].includes(engine.toLowerCase())) {
            res.status(400).json({ error: 'Invalid engine' });
            return;
        }

        const templateDir = path.join(TEMPLATES_DIR, engine.toLowerCase(), templateId);
        const templateFile = path.join(templateDir, 'template.json');

        // Read template metadata
        const metaContent = await fs.readFile(templateFile, 'utf-8');
        const template: Template = JSON.parse(metaContent);

        // Read all template files
        const files = [];
        for (const fileInfo of template.files) {
            const filePath = path.join(templateDir, fileInfo.content);
            const content = await fs.readFile(filePath, 'utf-8');
            files.push({
                path: fileInfo.path,
                content,
            });
        }

        res.json({
            template: {
                ...template,
                files,
            },
        });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(404).json({ error: 'Template not found' });
    }
});

export default router;
