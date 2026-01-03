import { UserProfile } from '@buzz/shared';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './EmailService';

const prisma = new PrismaClient();

export class AuthService {
    static async register(nickname: string, password: string, email: string): Promise<{ user?: UserProfile; token?: string; error?: string; requiresVerification?: boolean }> {
        try {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            const user = await prisma.user.create({
                data: {
                    nickname,
                    password, // Plaintext for now as requested
                    email,
                    isVerified: false,
                    verificationCode: code
                }
            });

            // Send Verification Email
            await EmailService.sendVerificationEmail(email, code);

            // Do NOT return token yet. Require verification.
            return { requiresVerification: true };

        } catch (e: any) {
            if (e.code === 'P2002') {
                const target = e.meta?.target;
                if (target && target.includes('email')) return { error: "Email already registered" };
                return { error: "Nickname already taken" };
            }
            console.error("Register error detail:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
            return { error: "Registration failed: " + (e.message || "Unknown error") };
        }
    }

    static async verifyAccount(email: string, code: string): Promise<{ user: UserProfile; token: string } | { error: string }> {
        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) return { error: "User not found" };
            if (user.isVerified) return { error: "Already verified" };
            if (user.verificationCode !== code) return { error: "Invalid verification code" };

            // Activate user
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { isVerified: true, verificationCode: null }
            });

            return {
                user: {
                    id: updatedUser.id,
                    nickname: updatedUser.nickname,
                    isGuest: false,
                    createdAt: updatedUser.createdAt.getTime()
                },
                token: updatedUser.id
            };

        } catch (e) {
            console.error("Verification error", e);
            return { error: "Verification failed" };
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

            if (!user.isVerified) {
                return { error: "Account not verified. Please check your email." };
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
