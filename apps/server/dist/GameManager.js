"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Room_1 = require("./Room");
class GameManager {
    constructor(io) {
        this.rooms = new Map();
        this.roomCodes = new Map(); // Code -> RoomID
        this.io = io;
    }
    handleConnection(socket) {
        const user = socket.user;
        // Events
        socket.on('create_room', () => this.createRoom(socket, user));
        socket.on('join_room', (code) => this.joinRoom(socket, user, code));
        socket.on('ping', () => socket.emit('pong', Date.now()));
        // Quick Debug: Auto create if none exists? 
        // No, waiting for user action.
    }
    createRoom(socket, user) {
        const code = this.generateCode();
        const room = new Room_1.Room(this.io, user.id, code);
        this.rooms.set(room.id, room);
        this.roomCodes.set(code, room.id);
        this.joinSocketToRoom(socket, room, user);
    }
    joinRoom(socket, user, code) {
        const roomId = this.roomCodes.get(code.toUpperCase());
        if (!roomId) {
            socket.emit('room_error', 'Room not found');
            return;
        }
        const room = this.rooms.get(roomId);
        if (room) {
            this.joinSocketToRoom(socket, room, user);
        }
    }
    joinSocketToRoom(socket, room, user) {
        socket.join(room.id);
        room.addPlayer(user);
        // Forward Game Events
        socket.on('start_game', () => {
            if (room.hostId === user.id)
                room.startGame();
        });
        socket.on('disconnect', () => {
            room.removePlayer(user.id);
        });
        // Send initial join success
        socket.emit('room_joined', room.toJSON());
    }
    generateCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let result = "";
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.GameManager = GameManager;
