/**
 * Update existing avatar URLs from MinIO presigned URLs to proxy paths
 * Run: node update-avatar-urls.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAvatarUrls() {
    try {
        // Find all users with avatars
        const users = await prisma.user.findMany({
            where: {
                avatar: {
                    not: null
                }
            }
        });

        console.log(`Found ${users.length} users with avatars`);

        for (const user of users) {
            // Check if avatar URL is a MinIO presigned URL (http://127.0.0.1:5434 or contains X-Amz-)
            if (user.avatar && (user.avatar.includes('127.0.0.1:5434') || user.avatar.includes('X-Amz-'))) {
                // Extract filename from URL
                const match = user.avatar.match(/\/avatars\/([^?]+)/);
                if (match) {
                    const filename = match[1];
                    const newUrl = `/api/avatars/${filename}`;
                    
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { avatar: newUrl }
                    });
                    
                    console.log(`✓ Updated ${user.email}: ${filename}`);
                } else {
                    console.log(`⚠ Could not parse URL for ${user.email}: ${user.avatar}`);
                }
            } else if (user.avatar && !user.avatar.startsWith('/api/avatars/')) {
                console.log(`⚠ Unknown avatar format for ${user.email}: ${user.avatar}`);
            } else {
                console.log(`✓ Already using new format: ${user.email}`);
            }
        }

        console.log('\n✅ Avatar URL migration complete!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAvatarUrls();
