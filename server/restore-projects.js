/**
 * EMERGENCY: Restore deleted project directories
 * This recreates project folders that were accidentally deleted
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreProjects() {
    try {
        // Get all projects for the affected user
        const userId = 'aa83a4ee-065d-4560-aefe-cdaea1b71bed';
        const projects = await prisma.project.findMany({
            where: { ownerId: userId },
            include: { files: true }
        });

        console.log(`Found ${projects.length} projects for user ${userId}`);

        for (const project of projects) {
            const projectDir = path.join('/Users/mac/heytex/users', userId, project.id);
            
            console.log(`\nRestoring project: ${project.name} (${project.id})`);
            
            // Create project directory
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
                console.log(`  ✓ Created directory: ${projectDir}`);
            } else {
                console.log(`  • Directory already exists`);
            }

            // Restore files
            for (const file of project.files) {
                const filePath = path.join(projectDir, file.path);
                const fileDir = path.dirname(filePath);
                
                // Create subdirectories if needed
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }
                
                // Write file content
                if (!fs.existsSync(filePath)) {
                    const content = file.content || ''; // Handle null content
                    fs.writeFileSync(filePath, content);
                    console.log(`    ✓ Restored: ${file.path}`);
                } else {
                    console.log(`    • Already exists: ${file.path}`);
                }
            }
            
            console.log(`  ✓ Restored ${project.files.length} files`);
        }

        console.log(`\n✅ Project restoration complete!`);
        console.log(`Restored ${projects.length} projects`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreProjects();
