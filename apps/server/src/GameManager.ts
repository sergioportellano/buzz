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
        socket.on('create_room', (options) => this.createRoom(socket, user, options));
        socket.on('join_room', (code, password) => this.joinRoom(socket, user, code, password));
        socket.on('get_lobby', () => socket.emit('lobby_update', this.getLobbyInfo()));
        socket.on('ping', () => socket.emit('pong', Date.now()));

        // Quick Debug: Auto create if none exists? 
        // No, waiting for user action.
    }

    createRoom(socket: Socket, user: UserProfile, options: { maxPlayers?: number, password?: string } = {}) {
        const code = this.generateCode();
        // Constraints
        const maxPlayers = Math.max(2, Math.min(6, options.maxPlayers || 4));
        const password = options.password ? options.password.substring(0, 12) : undefined;

        const room = new Room(this.io, user.id, code, maxPlayers, password);

        this.rooms.set(room.id, room);
        this.roomCodes.set(code, room.id);

        this.joinSocketToRoom(socket, room, user);
        this.broadcastLobbyUpdate();
    }

    joinRoom(socket: Socket, user: UserProfile, code: string, password?: string) {
        const roomId = this.roomCodes.get(code.toUpperCase());
        if (!roomId) {
            socket.emit('room_error', 'Room not found');
            return;
        }
        const room = this.rooms.get(roomId);
        if (room) {
            const result = room.canJoin(password);
            if (!result.success) {
                socket.emit('room_error', result.message || 'Cannot join room');
                return;
            }
            this.joinSocketToRoom(socket, room, user);
            this.broadcastLobbyUpdate();
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
            this.checkRoomEmpty(room);
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

    private checkRoomEmpty(room: Room) {
        // Simple check: if no players connected (or maybe just present in list if we remove them?)
        // Room.removePlayer just marks disconnected.
        // Let's actually check if everyone is gone.
        const activePlayers = Object.values(room.players).filter(p => p.isConnected);
        if (activePlayers.length === 0) {
            console.log(`Room ${room.code} is empty, deleting.`);
            this.rooms.delete(room.id);
            this.roomCodes.delete(room.code);
            this.broadcastLobbyUpdate();
        } else {
            this.broadcastLobbyUpdate(); // Player count changed
        }
    }

    private getLobbyInfo() {
        return Array.from(this.rooms.values()).map(r => ({
            id: r.id,
            code: r.code,
            hostId: r.hostId,
            playerCount: Object.values(r.players).filter(p => p.isConnected).length,
            maxPlayers: r.maxPlayers,
            isPrivate: !!r.password
        }));
    }

    private broadcastLobbyUpdate() {
        // Broadcast to everyone (or just those in lobby? For now everyone connected)
        this.io.emit('lobby_update', this.getLobbyInfo());
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
