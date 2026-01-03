import { UserProfile } from '@buzz/shared';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
    static async register(nickname: string, password: string): Promise<{ user: UserProfile; token: string } | { error: string }> {
        try {
            const user = await prisma.user.create({
                data: {
                    nickname,
                    password // Plaintext for now as requested
                }
            });

            return {
                user: {
                    id: user.id,
                    nickname: user.nickname,
                    isGuest: false,
                    createdAt: user.createdAt.getTime()
                },
                token: user.id
            };
        } catch (e: any) {
            if (e.code === 'P2002') {
                return { error: "Nickname already taken" };
            }
            console.error("Register error detail:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
            return { error: "Registration failed: " + (e.message || "Unknown error") };
        }
    }

    static async login(nickname: string, password: string): Promise<{ user: UserProfile; token: string } | { error: string }> {
        try {
            const user = await prisma.user.findUnique({
                where: { nickname }
            });

            if (!user || user.password !== password) {
                return { error: "Invalid credentials" };
            }

            return {
                user: {
                    id: user.id,
                    nickname: user.nickname,
                    isGuest: false,
                    createdAt: user.createdAt.getTime()
                },
                token: user.id
            };
        } catch (e) {
            console.error("Login error", e);
            return { error: "Login failed" };
        }
    }

    static createGuest(): { user: UserProfile; token: string } {
        const id = uuidv4();
        const user: UserProfile = {
            id,
            nickname: `Guest_${id.slice(0, 4)}`,
            isGuest: true,
            createdAt: Date.now()
        };

        guestTokens.set(id, user);
        return { user, token: id };
    }

    static async validateToken(token: string): Promise<UserProfile | null> {
        if (guestTokens.has(token)) {
            return guestTokens.get(token) || null;
        }

        const user = await prisma.user.findUnique({
            where: { id: token }
        });

        if (user) {
            return {
                id: user.id,
                nickname: user.nickname,
                isGuest: false,
                createdAt: user.createdAt.getTime()
            };
        }
        return null;
    }
}

// Simple in-memory guest store
const guestTokens = new Map<string, UserProfile>();
