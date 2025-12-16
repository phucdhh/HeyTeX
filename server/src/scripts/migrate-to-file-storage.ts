/**
 * Migration Script: Move existing projects to new file structure
 * Run: npx ts-node src/scripts/migrate-to-file-storage.ts
 */

import { prisma } from '../lib/prisma';
import { fileStorage } from '../services/FileStorage';

async function migrateProjects() {
    console.log('🚀 Starting migration to new file storage structure...\n');

    try {
        // Get all projects
        const projects = await prisma.project.findMany({
            include: {
                files: true,
                owner: true,
            },
        });

        console.log(`Found ${projects.length} projects to migrate\n`);

        let successCount = 0;
        let failureCount = 0;

        for (const project of projects) {
            console.log(`\n📁 Migrating project: ${project.name} (${project.id})`);
            console.log(`   Owner: ${project.owner.email} (${project.ownerId})`);
            console.log(`   Files: ${project.files.length}`);

            try {
                // Create project directory structure
                await fileStorage.createProjectDir(project.ownerId, project.id);

                // Migrate each file
                for (const file of project.files) {
                    if (file.isFolder) {
                        // Create folder
                        await fileStorage.createFolder(project.ownerId, project.id, file.path);
                        console.log(`   ✓ Created folder: ${file.path}`);
                    } else if (file.content) {
                        // Save text file
                        await fileStorage.saveFile(project.ownerId, project.id, file.path, file.content);
                        console.log(`   ✓ Saved file: ${file.path} (${file.content.length} bytes)`);
                    } else {
                        console.log(`   ⚠ Skipped binary file: ${file.path} (no content in DB)`);
                    }
                }

                successCount++;
                console.log(`   ✅ Project migrated successfully`);
            } catch (error) {
                failureCount++;
                console.error(`   ❌ Failed to migrate project:`, error);
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Migration Summary:`);
        console.log(`   Total projects: ${projects.length}`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Display directory structure
        console.log('📂 New directory structure:');
        console.log('   users/');
        
        const users = [...new Set(projects.map(p => p.ownerId))];
        for (const userId of users) {
            const userProjects = projects.filter(p => p.ownerId === userId);
            const user = userProjects[0]?.owner;
            console.log(`   ├─ ${userId}/ (${user?.email || 'unknown'})`);
            
            for (let i = 0; i < userProjects.length; i++) {
                const isLast = i === userProjects.length - 1;
                const prefix = isLast ? '└─' : '├─';
                const project = userProjects[i];
                console.log(`   │  ${prefix} ${project.id}/ (${project.name})`);
                console.log(`   │  ${isLast ? ' ' : '│'}  ├─ files/`);
                console.log(`   │  ${isLast ? ' ' : '│'}  └─ metadata.json`);
            }
        }

        console.log('\n✨ Migration completed!\n');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateProjects()
    .then(() => {
        console.log('👋 Goodbye!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
