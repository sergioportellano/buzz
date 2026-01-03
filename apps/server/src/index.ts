import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { VERSION } from '@buzz/shared';
import { AuthService } from './services/AuthService';
import { GameManager } from './GameManager';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Auth Route
app.post('/api/auth/guest', (req, res) => {
    const result = AuthService.createGuest();
    res.json(result);
});

app.get('/health', (req, res) => {
    res.send('OK');
});

// Socket Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const user = AuthService.validateToken(token);
    if (!user) {
        return next(new Error("Authentication Error"));
    }
    // Attach user to socket
    (socket as any).user = user;
    next();
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.nickname} (${user.id})`);

    gameManager.handleConnection(socket);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.nickname}`);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server v${VERSION} running on port ${PORT}`);
});
