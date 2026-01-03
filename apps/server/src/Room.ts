import { Server, Socket } from 'socket.io';
import { RoomInfo, RoomState, Player, UserProfile } from '@buzz/shared';
import { v4 as uuidv4 } from 'uuid';

export class Room {
    id: string;
    code: string;
    hostId: string;
    state: RoomState = RoomState.LOBBY;
    players: Record<string, Player> = {};

    // Game Logic
    currentRoundIndex: number = 0;
    totalRounds: number = 5;
    roundStartTime: number = 0;
    roundDuration: number = 30; // Seconds

    private io: Server;

    maxPlayers: number;
    password?: string;

    constructor(io: Server, hostId: string, code: string, maxPlayers: number = 4, password?: string) {
        this.io = io;
        this.id = uuidv4();
        this.hostId = hostId;
        this.code = code;
        this.maxPlayers = maxPlayers;
        this.password = password;
    }

    addPlayer(user: UserProfile) {
        if (this.players[user.id]) {
            // Reconnection logic
            this.players[user.id].isConnected = true;
        } else {
            this.players[user.id] = {
                id: user.id,
                nickname: user.nickname,
                score: 0,
                streak: 0,
                isConnected: true,
                hasAnswered: false,
                avatarId: 'default'
            };
        }
        this.broadcastState();
    }

    removePlayer(userId: string) {
        if (this.players[userId]) {
            this.players[userId].isConnected = false;
            // Optional: Remove completely if in Lobby?
            // For now, just mark disconected
            this.broadcastState();
        }
    }

    startGame() {
        if (this.state !== RoomState.LOBBY) return;
        this.state = RoomState.PRE_ROUND;
        this.broadcastState();

        // Simple loop for MVP demo
        setTimeout(() => this.startRound(), 3000);
    }

    startRound() {
        this.state = RoomState.PLAYING;
        this.roundStartTime = Date.now();
        this.broadcastState();
    }

    toJSON(): RoomInfo {
        return {
            id: this.id,
            code: this.code,
            hostId: this.hostId,
            state: this.state,
            players: this.players,
            currentRoundIndex: this.currentRoundIndex,
            totalRounds: this.totalRounds,
            roundStartTime: this.roundStartTime,
            roundDuration: this.roundDuration,
            maxPlayers: this.maxPlayers,
            isPrivate: !!this.password
        };
    }

    broadcastState() {
        this.io.to(this.id).emit('state_update', this.toJSON());
    }

    broadcastChat(message: any) {
        this.io.to(this.id).emit('chat_broadcast', message);
    }

    canJoin(password?: string): { success: boolean, message?: string } {
        if (Object.keys(this.players).length >= this.maxPlayers) {
            return { success: false, message: "Room is full" };
        }
        if (this.password && this.password !== password) {
            return { success: false, message: "Invalid password" };
        }
        return { success: true };
    }
}
