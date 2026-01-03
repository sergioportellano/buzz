import { Server, Socket } from 'socket.io';
import { UserProfile } from '@buzz/shared';
import { Room } from './Room';

export class GameManager {
    private io: Server;
    private rooms: Map<string, Room> = new Map();
    private roomCodes: Map<string, string> = new Map(); // Code -> RoomID

    constructor(io: Server) {
        this.io = io;
    }

    handleConnection(socket: Socket) {
        const user = (socket as any).user as UserProfile;

        // Events
        socket.on('create_room', () => this.createRoom(socket, user));
        socket.on('join_room', (code) => this.joinRoom(socket, user, code));
        socket.on('ping', () => socket.emit('pong', Date.now()));

        // Quick Debug: Auto create if none exists? 
        // No, waiting for user action.
    }

    createRoom(socket: Socket, user: UserProfile) {
        const code = this.generateCode();
        const room = new Room(this.io, user.id, code);

        this.rooms.set(room.id, room);
        this.roomCodes.set(code, room.id);

        this.joinSocketToRoom(socket, room, user);
    }

    joinRoom(socket: Socket, user: UserProfile, code: string) {
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

    private joinSocketToRoom(socket: Socket, room: Room, user: UserProfile) {
        socket.join(room.id);
        room.addPlayer(user);

        // Forward Game Events
        socket.on('start_game', () => {
            if (room.hostId === user.id) room.startGame();
        });

        socket.on('disconnect', () => {
            room.removePlayer(user.id);
        });

        socket.on('chat_message', (text: string) => {
            if (room.players[user.id]) { // Validate member
                const message = {
                    id: Date.now().toString(), // Simple ID
                    senderId: user.id,
                    text: text.substring(0, 100), // Limit length
                    timestamp: Date.now()
                };
                room.broadcastChat(message);
            }
        });

        // Send initial join success
        socket.emit('room_joined', room.toJSON());
    }

    private generateCode(): string {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let result = "";
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
