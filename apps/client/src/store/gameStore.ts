import { create } from 'zustand';
import type { RoomInfo, ChatMessage } from '@buzz/shared';
import { useUserStore } from './userStore';

interface GameState {
    room: RoomInfo | null;
    joinError: string | null;

    // Actions
    lobby: any[]; // RoomInfo[] but simplified for list

    // Actions
    createRoom: (options: { maxPlayers: number, password?: string }) => void;
    joinRoom: (code: string, password?: string) => void;
    getLobby: () => void;
    startGame: () => void;
    leaveRoom: () => void;

    // Handlers (Internally called by Socket)
    setError: (msg: string) => void;
    setRoom: (room: RoomInfo) => void;

    // Chat
    chatMessages: Record<string, ChatMessage>; // Map by SenderID (Last message) or Array? 
    // Using Map by SenderID to easily show "Speech Bubble" per player. 
    // If we wanted a history log, we'd use an Array. 
    // Start with Map for "Bubble Only" requirement simplicity.
    addChatMessage: (msg: ChatMessage) => void;
    sendChatMessage: (text: string) => void;
    setLobby: (lobby: any[]) => void;

    // Kick
    kickPlayer: (targetId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    room: null,
    lobby: [],
    joinError: null,

    createRoom: (options) => {
        const socket = useUserStore.getState().socket;
        if (!socket) return;
        socket.emit('create_room', options);
    },

    joinRoom: (code, password) => {
        const socket = useUserStore.getState().socket;
        if (!socket) return;
        set({ joinError: null });
        socket.emit('join_room', code, password);
    },

    getLobby: () => {
        const socket = useUserStore.getState().socket;
        if (socket) socket.emit('get_lobby');
    },

    startGame: () => {
        const socket = useUserStore.getState().socket;
        if (!socket) return;
        socket.emit('start_game');
    },

    leaveRoom: () => {
        set({ room: null });
        // Reload to reset socket state or emit 'leave_room' if implemented
        window.location.reload();
    },

    setRoom: (room) => set({ room }),
    setLobby: (lobby) => set({ lobby }),
    setError: (msg) => set({ joinError: msg }),

    chatMessages: {},
    addChatMessage: (msg) => set((state) => ({
        chatMessages: { ...state.chatMessages, [msg.senderId]: msg }
    })),
    sendChatMessage: (text) => {
        const socket = useUserStore.getState().socket;
        if (socket) socket.emit('chat_message', text);
    },

    kickPlayer: (targetId: string) => {
        const socket = useUserStore.getState().socket;
        if (socket) socket.emit('kick_player', targetId);
    }
}));

// Initialize Socket Listeners for Game Events
// This should be called once, e.g. in App.tsx or a dedicated hook
export const initGameListeners = () => {
    // We need to subscribe to the socket from UserStore
    useUserStore.subscribe((state) => {
        const socket = state.socket;
        if (!socket) return;

        // Remove existing to prevent duplicates if socket reconnects
        socket.off('room_joined');
        socket.off('room_error');
        socket.off('state_update');
        socket.off('chat_broadcast');
        socket.off('lobby_update');
        socket.off('kicked');

        socket.on('room_joined', (room) => {
            console.log('Joined Room:', room);
            useGameStore.getState().setRoom(room);
        });

        socket.on('room_error', (msg) => {
            console.error('Room Error:', msg);
            useGameStore.getState().setError(msg);
        });

        socket.on('state_update', (room) => {
            // console.log('State Update:', room.state);
            useGameStore.getState().setRoom(room);
        });

        socket.on('chat_broadcast', (msg) => {
            useGameStore.getState().addChatMessage(msg);
        });

        socket.on('lobby_update', (lobby) => {
            useGameStore.getState().setLobby(lobby);
        });

        socket.on('kicked', (msg: string) => {
            alert(msg);
            useGameStore.getState().leaveRoom();
        });
    });
};
