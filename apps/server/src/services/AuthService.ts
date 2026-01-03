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
            console.error("Register error", e);
            return { error: "Registration failed" };
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
        // Check if guest (UUID check? or just in memory?)
        // Guests are not in DB. We need to handle them.
        // For MVP, if token is not found in DB, maybe it's a guest?
        // But we don't store guests in DB. 
        // We need a strategy. 
        // Option 1: Store guests in DB with isGuest=true
        // Option 2: Keep guests in memory (but restarting server kills them).
        // Let's implement looking up in DB. If not found, check memory?
        // But we removed memory cache.
        // Let's assume for now we only support DB users for persistence.
        // Guests will be ephemeral. We need a way to validate them.
        // We can keep a simple memory set for active guest tokens.

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
