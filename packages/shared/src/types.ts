export interface UserProfile {
    id: string;
    nickname: string;
    isGuest: boolean;
    isAdmin?: boolean;
    createdAt: number;
    avatarModel?: string;
}

export const AVATAR_MODELS = [
    { id: 'player.glb', name: 'Clásico' },
    { id: 'tralalero.glb', name: 'Tralalero' },
    { id: 'tuntunsahur.glb', name: 'Tun Tun Sahur' },
    { id: 'capuchino.glb', name: 'Cappuccino Assassino' }
];
// Core Game Types
export enum RoomState {
    LOBBY = 'LOBBY',
    PRE_ROUND = 'PRE_ROUND',
    PLAYING = 'PLAYING',
    POST_ROUND = 'POST_ROUND',
    GAME_OVER = 'GAME_OVER'
}

export interface Player {
    id: string; // Matches UserProfile.id
    nickname: string;
    score: number;
    streak: number;
    isConnected: boolean;
    lastAnswer?: string;
    hasAnswered: boolean;
    avatarId: string;
    slot?: number;
}

export interface RoomInfo {
    id: string;
    code: string; // 4-char code
    hostId: string;
    state: RoomState;
    players: Record<string, Player>;
    currentRoundIndex: number;
    totalRounds: number;
    roundStartTime?: number; // Timestamp
    roundDuration?: number; // Seconds
    maxPlayers: number;
    isPrivate: boolean;
}

export interface GameConfig {
    totalRounds: number;
    roundDuration: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}
