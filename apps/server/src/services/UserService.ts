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
}
