import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@buzz/shared';
import { io, Socket } from 'socket.io-client';
import { TimeSync } from '../services/TimeSync';

interface UserState {
    user: UserProfile | null;
    token: string | null;
    socket: Socket | null;
    timeSync: TimeSync | null;
    loginGuest: () => Promise<void>;
    register: (nickname: string, password: string) => Promise<{ success: boolean, error?: string }>;
    login: (nickname: string, password: string) => Promise<{ success: boolean, error?: string }>;
    logout: () => void;
    connectSocket: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            socket: null,
            timeSync: null,

            loginGuest: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' });
                    const data = await res.json();
                    set({ user: data.user, token: data.token });
                } catch (err) {
                    console.error('Guest Login failed', err);
                }
            },

            register: async (nickname, password) => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nickname, password })
                    });
                    const data = await res.json();
                    if (data.error) return { success: false, error: data.error };

                    set({ user: data.user, token: data.token });
                    return { success: true };
                } catch (err) {
                    return { success: false, error: "Network Error" };
                }
            },

            login: async (nickname, password) => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nickname, password })
                    });
                    const data = await res.json();
                    if (data.error) return { success: false, error: data.error };

                    set({ user: data.user, token: data.token });
                    return { success: true };
                } catch (err) {
                    return { success: false, error: "Network Error" };
                }
            },

            logout: () => {
                const { socket } = get();
                if (socket) socket.disconnect();
                set({ user: null, token: null, socket: null, timeSync: null });
            },

            connectSocket: () => {
                const { token, socket } = get();
                if (!token || socket) return;

                const newSocket = io(API_URL, {
                    auth: { token }
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected:', newSocket.id);
                    const sync = new TimeSync(newSocket);
                    sync.sync().then(() => {
                        set({ timeSync: sync });
                    });
                });

                set({ socket: newSocket });
            }
        }),
        {
            name: 'buzz-user-storage',
            partialize: (state) => ({ token: state.token, user: state.user }), // Persist only token and user
        }
    )
);
