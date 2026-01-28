import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminAuth);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdmin: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        projects: true,
                        projectCollaborators: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const usersWithStats = users.map(user => ({
            ...user,
            projectCount: user._count.projects,
            collaborationCount: user._count.projectCollaborators,
            _count: undefined
        }));

        res.json({ users: usersWithStats });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdmin: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                projects: {
                    select: {
                        id: true,
                        name: true,
                        engine: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    orderBy: {
                        updatedAt: 'desc'
                    }
                },
                projectCollaborators: {
                    select: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                engine: true,
                                owner: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        role: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { email, password, name, isAdmin } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                isAdmin: isAdmin || false
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdmin: true,
                createdAt: true
            }
        });

        res.status(201).json({ user });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, isAdmin } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                isAdmin: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (id === req.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Delete user (cascade will delete related projects)
        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalProjects,
            latexProjects,
            typstProjects,
            recentUsers
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.project.count({ where: { engine: 'LATEX' } }),
            prisma.project.count({ where: { engine: 'TYPST' } }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                }
            })
        ]);

        res.json({
            stats: {
                totalUsers,
                totalProjects,
                latexProjects,
                typstProjects,
                recentUsers
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
