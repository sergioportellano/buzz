import { RoomInfo } from './types';
export interface ServerToClientEvents {
    pong: (timestamp: number) => void;
    room_joined: (room: RoomInfo) => void;
    room_error: (msg: string) => void;
    state_update: (room: RoomInfo) => void;
}
export interface ClientToServerEvents {
    ping: () => void;
    create_room: () => void;
    join_room: (code: string) => void;
    start_game: () => void;
    submit_answer: (answerId: string) => void;
}
