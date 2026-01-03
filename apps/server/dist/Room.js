"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const shared_1 = require("@buzz/shared");
const uuid_1 = require("uuid");
class Room {
    constructor(io, hostId, code) {
        this.state = shared_1.RoomState.LOBBY;
        this.players = {};
        // Game Logic
        this.currentRoundIndex = 0;
        this.totalRounds = 5;
        this.roundStartTime = 0;
        this.roundDuration = 30; // Seconds
        this.io = io;
        this.id = (0, uuid_1.v4)();
        this.hostId = hostId;
        this.code = code;
    }
    addPlayer(user) {
        if (this.players[user.id]) {
            // Reconnection logic
            this.players[user.id].isConnected = true;
        }
        else {
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
    removePlayer(userId) {
        if (this.players[userId]) {
            this.players[userId].isConnected = false;
            // Optional: Remove completely if in Lobby?
            // For now, just mark disconected
            this.broadcastState();
        }
    }
    startGame() {
        if (this.state !== shared_1.RoomState.LOBBY)
            return;
        this.state = shared_1.RoomState.PRE_ROUND;
        this.broadcastState();
        // Simple loop for MVP demo
        setTimeout(() => this.startRound(), 3000);
    }
    startRound() {
        this.state = shared_1.RoomState.PLAYING;
        this.roundStartTime = Date.now();
        this.broadcastState();
    }
    toJSON() {
        return {
            id: this.id,
            code: this.code,
            hostId: this.hostId,
            state: this.state,
            players: this.players,
            currentRoundIndex: this.currentRoundIndex,
            totalRounds: this.totalRounds,
            roundStartTime: this.roundStartTime,
            roundDuration: this.roundDuration
        };
    }
    broadcastState() {
        this.io.to(this.id).emit('state_update', this.toJSON());
    }
    broadcastChat(message) {
        this.io.to(this.id).emit('chat_broadcast', message);
    }
}
exports.Room = Room;
