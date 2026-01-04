import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { VERSION } from '@buzz/shared';
import { AuthService } from './services/AuthService';
import { GameManager } from './GameManager';

const app = express();

const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://buzz-client-silk.vercel.app"
];

// Dynamic CORS Origin Check
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin) || /https:\/\/buzz-client-.*\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        } else {
            console.warn(`Blocked CORS for origin: ${origin}`);
            // Ensure we don't break the server, just block connection
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Handle preflight specifically
app.options('*', cors(corsOptions));

app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.includes(origin) || /https:\/\/buzz-client-.*\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'), false);
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Auth Route
// Serve static files (uploaded audio)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Admin Endpoints ---
import { QuestionService } from './services/QuestionService';
import { UserService } from './services/UserService';
import { StoreService } from './services/StoreService';
import { upload } from './services/FileService';
// Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];

    // We can reuse AuthService.validateToken, but it returns UserProfile | null
    // Here we want to attach user to req
    const user = await AuthService.validateToken(token);
    if (!user) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
};

const requireAdmin = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];
    const user = await AuthService.validateToken(token);
    if (!user || !user.isAdmin) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
};

// --- User Management ---
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await UserService.listUsers();
        res.json(users);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const updatedUser = await UserService.updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// User Self Update
app.put('/api/users/me', async (req: any, res: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];

    try {
        const user = await AuthService.validateToken(token);
        if (!user) return res.status(401).json({ error: "Invalid Token" });

        // Only allow updating specific fields for self-update
        const allowedUpdates = {
            avatarModel: req.body.avatarModel
            // Add nickname or other fields here if we want to allow user to change them
        };

        const updatedUser = await UserService.updateUser(user.id, allowedUpdates);
        res.json(updatedUser);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Create Question (with Audio)
app.post('/api/admin/questions', requireAdmin, upload.single('audio'), async (req: any, res: any) => {
    try {
        const body = req.body;
        // Parse options and tags since they might come as JSON strings from FormData
        let options = body.options;
        if (typeof options === 'string') options = JSON.parse(options);

        let tags = body.tags;
        if (typeof tags === 'string') tags = JSON.parse(tags);

        const data = {
            text: body.text,
            options: options,
            correctOptionIndex: body.correctOptionIndex,
            tags: tags
        };

        const result = await QuestionService.createQuestion(data, req.file);
        res.json(result);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// List Questions
app.get('/api/admin/questions', requireAdmin, async (req, res) => {
    const questions = await QuestionService.listQuestions();
    res.json(questions);
});

// Delete Question
app.delete('/api/admin/questions/:id', requireAdmin, async (req, res) => {
    await QuestionService.deleteQuestion(req.params.id);
    res.json({ success: true });
});

// List Tags
app.get('/api/admin/tags', requireAdmin, async (req, res) => {
    const tags = await QuestionService.listTags();
    res.json(tags);
});

// --- Auth Endpoints ---
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

// Store Routes
app.get('/api/store', async (req, res) => {
    try {
        const items = await StoreService.getStoreItems();
        res.json(items);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/store/buy', authenticateToken, async (req: any, res) => {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });

    try {
        const result = await StoreService.purchaseItem(req.user.id, itemId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Grant Gems
app.post('/api/admin/users/:id/gems', requireAdmin, async (req, res) => {
    const { amount } = req.body;
    try {
        const result = await UserService.addGems(req.params.id, Number(amount));
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Admin: Seed Store
app.post('/api/admin/store/seed', requireAdmin, async (req, res) => {
    try {
        await StoreService.seedDefaultItems();
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
    console.log(`Server v${VERSION} running on port ${PORT}`);
    // Auto-seed store
    try {
        await StoreService.seedDefaultItems();
    } catch (e) {
        console.error("Failed to seed store:", e);
    }
});
