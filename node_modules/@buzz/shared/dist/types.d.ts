export interface UserProfile {
    id: string;
    nickname: string;
    isGuest: boolean;
    createdAt: number;
}
export declare enum RoomState {
    LOBBY = "LOBBY",
    PRE_ROUND = "PRE_ROUND",
    PLAYING = "PLAYING",
    POST_ROUND = "POST_ROUND",
    GAME_OVER = "GAME_OVER"
}
export interface Player {
    id: string;
    nickname: string;
    score: number;
    streak: number;
    isConnected: boolean;
    lastAnswer?: string;
    hasAnswered: boolean;
    avatarId: string;
}
export interface RoomInfo {
    id: string;
    code: string;
    hostId: string;
    state: RoomState;
    players: Record<string, Player>;
    currentRoundIndex: number;
    totalRounds: number;
    roundStartTime?: number;
    roundDuration?: number;
}
export interface GameConfig {
    totalRounds: number;
    roundDuration: number;
}
