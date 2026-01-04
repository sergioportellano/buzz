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

    register: (nickname: string, password: string, email: string) => Promise<{ success: boolean, error?: string, requiresVerification?: boolean, debugCode?: string }>;
    verifyAccount: (email: string, code: string) => Promise<{ success: boolean, error?: string }>;
    login: (nickname: string, password: string) => Promise<{ success: boolean, error?: string }>;
    logout: () => void;
    connectSocket: () => void;
    updateProfile: (data: { nickname?: string; avatarModel?: string }) => Promise<{ success: boolean, error?: string }>;
    fetchUser: () => Promise<{ success: boolean, error?: string }>;
    buyItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            socket: null,
            timeSync: null,



            register: async (nickname, password, email) => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nickname, password, email })
                    });
                    const data = await res.json();
                    if (data.error) return { success: false, error: data.error };

                    if (data.requiresVerification) {
                        return { success: true, requiresVerification: true, debugCode: data.debugCode };
                    }

                    set({ user: data.user, token: data.token });
                    return { success: true };
                } catch (err) {
                    return { success: false, error: "Network Error" };
                }
            },

            verifyAccount: async (email, code) => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code })
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

            updateProfile: async (data) => {
                const { token, user } = get();
                if (!token) return { success: false, error: "Not logged in" };

                try {
                    const res = await fetch(`${API_URL}/api/users/me`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(data)
                    });

                    if (res.ok) {
                        const updatedUser = await res.json();
                        // Merge updated fields
                        set({ user: { ...user, ...updatedUser } as UserProfile });

                        // Force socket reconnect to update server state
                        const { socket } = get();
                        if (socket) {
                            socket.disconnect();
                            set({ socket: null });
                            setTimeout(() => {
                                get().connectSocket();
                            }, 100);
                        }
                        return { success: true };
                    } else {
                        const errorData = await res.json();
                        return { success: false, error: errorData.error || "Failed to update profile" };
                    }
                } catch (e: any) {
                    console.error("Failed to update profile", e);
                    return { success: false, error: e.message || "Network Error" };
                }
            },

            fetchUser: async () => {
                const { token } = get();
                if (!token) return { success: false, error: "Not logged in" };
                try {
                    const res = await fetch(`${API_URL}/api/auth/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.valid) {
                            set({ user: data.user });
                            return { success: true };
                        } else {
                            return { success: false, error: data.error || "Invalid token" };
                        }
                    } else {
                        const errorData = await res.json();
                        return { success: false, error: errorData.error || "Failed to fetch user" };
                    }
                } catch (e: any) {
                    console.error(e);
                    return { success: false, error: e.message || "Network Error" };
                }
            },

            buyItem: async (itemId: string) => {
                const { token, user } = get();
                if (!token) return { success: false, error: "Not logged in" };

                try {
                    const res = await fetch(`${API_URL}/api/store/buy`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ itemId })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        // Update local user state
                        set({
                            user: {
                                ...user,
                                gems: data.gems,
                                ownedItems: data.inventory
                            } as UserProfile
                        });
                        return { success: true };
                    } else {
                        return { success: false, error: data.error };
                    }
                } catch (e: any) {
                    return { success: false, error: e.message || "Network Error" };
                }
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

                newSocket.on('connect_error', (err) => {
                    console.error('Socket Connection Error:', err.message);
                    if (err.message === "Authentication Error" || err.message === "xhr poll error") {
                        console.warn("Auth failed or connection lost, logging out...");
                        get().logout();
                    }
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
