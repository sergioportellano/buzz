"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
// In-memory store for MVP. Replace with DB later.
const users = new Map();
class AuthService {
    static createGuest() {
        const id = (0, uuid_1.v4)();
        const user = {
            id,
            nickname: `Guest_${id.slice(0, 4)}`,
            isGuest: true,
            createdAt: Date.now()
        };
        users.set(id, user);
        // For MVP, token is just the ID. In prod, use JWT.
        return { user, token: id };
    }
    static validateToken(token) {
        // For MVP, token === id
        return users.get(token) || null;
    }
}
exports.AuthService = AuthService;
