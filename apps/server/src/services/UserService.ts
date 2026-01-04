import { PrismaClient } from '@prisma/client';
import { prisma } from '../db';
import * as bcrypt from 'bcryptjs';

export class UserService {
    static async listUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                nickname: true,
                email: true,
                isAdmin: true,
                isVerified: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async updateUser(id: string, data: { nickname?: string; email?: string; isAdmin?: boolean; isVerified?: boolean; password?: string; avatarModel?: string }) {
        return prisma.user.update({
            where: { id },
            data: {
                nickname: data.nickname,
                email: data.email,
                isAdmin: data.isAdmin,
                isVerified: data.isVerified,
                password: data.password, // Optionally allow password reset
                avatarModel: data.avatarModel
            },
            select: {
                id: true,
                nickname: true,
                email: true,
                isAdmin: true,
                isVerified: true,
                avatarModel: true
            }
        });
    }

    static async addGems(userId: string, amount: number) {
        return prisma.user.update({
            where: { id: userId },
            data: { gems: { increment: amount } },
            select: { id: true, gems: true }
        });
    }

    static async deleteUser(userId: string) {
        return prisma.user.delete({
            where: { id: userId }
        });
    }

    static async resetAndSeedAdmin(adminName: string, adminPass: string) {
        // Delete all data in order
        await prisma.ownedItem.deleteMany({});
        await prisma.user.deleteMany({});

        // Create Admin
        const hashedPassword = await bcrypt.hash(adminPass, 10);
        return prisma.user.create({
            data: {
                nickname: adminName,
                password: hashedPassword,
                email: 'admin@buzz.com',
                isAdmin: true,
                isVerified: true,
                verificationCode: null,
                gems: 99999
            }
        });
    }
}
