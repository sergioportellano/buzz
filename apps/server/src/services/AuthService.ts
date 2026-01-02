import { UserProfile } from '@buzz/shared';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for MVP. Replace with DB later.
const users = new Map<string, UserProfile>();

export class AuthService {
    static createGuest(): { user: UserProfile; token: string } {
        const id = uuidv4();
        const user: UserProfile = {
            id,
            nickname: `Guest_${id.slice(0, 4)}`,
            isGuest: true,
            createdAt: Date.now()
        };

        users.set(id, user);

        // For MVP, token is just the ID. In prod, use JWT.
        return { user, token: id };
    }

    static validateToken(token: string): UserProfile | null {
        // For MVP, token === id
        return users.get(token) || null;
    }
}
