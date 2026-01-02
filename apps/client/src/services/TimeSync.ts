import { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@buzz/shared';

export class TimeSync {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    private timeOffset: number = 0;
    private latency: number = 0;
    private isSynced: boolean = false;

    constructor(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
    }

    private setupListeners() {
        this.socket.on('pong', (_serverTimestamp: number) => {
            // Logic handled in sync() promise
        });
    }

    public getIsSynced(): boolean {
        return this.isSynced;
    }

    public async sync(): Promise<void> {
        const samples: number[] = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
            const offset = await this.ping();
            samples.push(offset);
            await new Promise(r => setTimeout(r, 100));
        }

        this.timeOffset = samples.reduce((a, b) => a + b, 0) / samples.length;
        this.isSynced = true;
        console.log(`[TimeSync] Synced. Offset: ${this.timeOffset.toFixed(2)}ms`);
    }

    private ping(): Promise<number> {
        return new Promise((resolve) => {
            const start = Date.now();
            this.socket.emit('ping');

            const handler = (serverTimestamp: number) => {
                const end = Date.now();
                const rtt = end - start;
                this.latency = rtt / 2;
                const offset = (serverTimestamp - end) + this.latency;

                this.socket.off('pong', handler);
                resolve(offset);
            };

            this.socket.on('pong', handler);
        });
    }

    public getServerTime(): number {
        return Date.now() + this.timeOffset;
    }
}
