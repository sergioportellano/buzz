import { create } from 'zustand';
import type { RoomInfo } from '@buzz/shared';
import { useUserStore } from './userStore';

interface GameState {
    room: RoomInfo | null;
    joinError: string | null;

    // Actions
    createRoom: () => void;
    joinRoom: (code: string) => void;
    startGame: () => void;
    leaveRoom: () => void;

    // Handlers (Internally called by Socket)
    setRoom: (room: RoomInfo) => void;
    setError: (msg: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    room: null,
    joinError: null,

    createRoom: () => {
        const socket = useUserStore.getState().socket;
        if (!socket) return;
        socket.emit('create_room');
    },

    joinRoom: (code: string) => {
        const socket = useUserStore.getState().socket;
        if (!socket) return;
        set({ joinError: null });
        socket.emit('join_room', code);
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
    setError: (msg) => set({ joinError: msg }),
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
    });
};
