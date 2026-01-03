interface UserProfile {
    id: string;
    nickname: string;
    isGuest: boolean;
    isAdmin?: boolean;
    createdAt: number;
    avatarModel?: string;
}
declare const AVATAR_MODELS: {
    id: string;
    name: string;
}[];
declare enum RoomState {
    LOBBY = "LOBBY",
    PRE_ROUND = "PRE_ROUND",
    PLAYING = "PLAYING",
    POST_ROUND = "POST_ROUND",
    GAME_OVER = "GAME_OVER"
}
interface Player {
    id: string;
    nickname: string;
    score: number;
    streak: number;
    isConnected: boolean;
    lastAnswer?: string;
    hasAnswered: boolean;
    avatarId: string;
    slot?: number;
}
interface RoomInfo {
    id: string;
    code: string;
    hostId: string;
    state: RoomState;
    players: Record<string, Player>;
    currentRoundIndex: number;
    totalRounds: number;
    roundStartTime?: number;
    roundDuration?: number;
    maxPlayers: number;
    isPrivate: boolean;
}
interface GameConfig {
    totalRounds: number;
    roundDuration: number;
}
interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface ServerToClientEvents {
    pong: (timestamp: number) => void;
    room_joined: (room: RoomInfo) => void;
    room_error: (msg: string) => void;
    state_update: (room: RoomInfo) => void;
}
interface ClientToServerEvents {
    ping: () => void;
    create_room: () => void;
    join_room: (code: string) => void;
    start_game: () => void;
    submit_answer: (answerId: string) => void;
}

declare const VERSION = "0.0.1";

export { AVATAR_MODELS, type ChatMessage, type ClientToServerEvents, type GameConfig, type Player, type RoomInfo, RoomState, type ServerToClientEvents, type UserProfile, VERSION };
