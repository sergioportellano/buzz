import 'dotenv/config';
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
app.post('/api/auth/register', async (req, res) => {
    const { nickname, password, email } = req.body;
    if (!nickname || !password || !email) return res.status(400).json({ error: "Missing fields" });
    const result = await AuthService.register(nickname, password, email);
    res.json(result);
});

app.post('/api/auth/verify', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Missing fields" });
    const result = await AuthService.verifyAccount(email, code);
    res.json(result);
});

app.post('/api/auth/login', async (req, res) => {
    const { nickname, password } = req.body;
    if (!nickname || !password) return res.status(400).json({ error: "Missing fields" });
    const result = await AuthService.login(nickname, password);
    res.json(result);
});

app.post('/api/auth/guest', (req, res) => {
    const result = AuthService.createGuest();
    res.json(result);
});

app.get('/health', (req, res) => {
    res.send('OK');
});

// Socket Middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
        const user = await AuthService.validateToken(token);
        if (!user) {
            return next(new Error("Authentication Error"));
        }
        // Attach user to socket
        (socket as any).user = user;
        next();
    } catch (e) {
        next(new Error("Authentication Error"));
    }
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
