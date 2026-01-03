"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const shared_1 = require("@buzz/shared");
const AuthService_1 = require("./services/AuthService");
const GameManager_1 = require("./GameManager");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
// Auth Route
app.post('/api/auth/guest', (req, res) => {
    const result = AuthService_1.AuthService.createGuest();
    res.json(result);
});
// Socket Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const user = AuthService_1.AuthService.validateToken(token);
    if (!user) {
        return next(new Error("Authentication Error"));
    }
    // Attach user to socket
    socket.user = user;
    next();
});
const gameManager = new GameManager_1.GameManager(io);
io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.nickname} (${user.id})`);
    gameManager.handleConnection(socket);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.nickname}`);
    });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server v${shared_1.VERSION} running on port ${PORT}`);
});
