/**
 * Migrate avatars from MinIO to users directory
 * Run: node migrate-avatars.js
 */

const { PrismaClient } = require('@prisma/client');
const Minio = require('minio');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const prisma = new PrismaClient();

const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 5434,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'heytex_admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'heytex_secret_2024',
});

async function migrateAvatars() {
    try {
        const users = await prisma.user.findMany({
            where: {
                avatar: {
                    not: null
                }
            }
        });

        console.log(`Found ${users.length} users with avatars`);

        for (const user of users) {
            try {
                // Extract filename from avatar URL
                const match = user.avatar.match(/avatar-[^?]+\.jpg/);
                if (!match) {
                    console.log(`⚠ Could not parse avatar URL for ${user.email}: ${user.avatar}`);
                    continue;
                }

                const filename = match[0];
                console.log(`\nMigrating ${user.email}...`);
                console.log(`  MinIO file: ${filename}`);

                // Create user directory
                const userDir = path.join('/Users/mac/heytex/users', user.id);
                const avatarPath = path.join(userDir, 'avatar.jpg');

                if (!fs.existsSync(userDir)) {
                    fs.mkdirSync(userDir, { recursive: true });
                    console.log(`  ✓ Created directory: ${userDir}`);
                }

                // Download from MinIO
                const dataStream = await minioClient.getObject('avatars', filename);
                const writeStream = fs.createWriteStream(avatarPath);

                await pipeline(dataStream, writeStream);
                console.log(`  ✓ Downloaded to: ${avatarPath}`);

                // Update database
                const newUrl = `/api/users/${user.id}/avatar.jpg`;
                await prisma.user.update({
                    where: { id: user.id },
                    data: { avatar: newUrl }
                });
                console.log(`  ✓ Updated DB: ${newUrl}`);

            } catch (error) {
                console.error(`  ✗ Error migrating ${user.email}:`, error.message);
            }
        }

        console.log('\n✅ Avatar migration complete!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateAvatars();
