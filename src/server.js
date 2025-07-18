import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { UserRepository } from './infrastructure/repositories/UserRepository.js';
import { ChatRepository } from './infrastructure/repositories/ChatRepository.js';
import { AuthController } from './infrastructure/controllers/AuthController.js';
import { ChatController } from './infrastructure/controllers/ChatController.js';
import { OnlineUserRepository } from './infrastructure/repositories/OnlineUserRepository.js';

dotenv.config();

console.log('GMAIL_USER:', process.env.USER);
console.log('GMAIL_PASS:', process.env.PASS ? 'SET' : 'NOT SET');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const onlineLoggedInUsers = new Set();
const onlineGuestUsers = new Set();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}); 

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((e) => console.error('MongoDB error:', e));

// Repositories
const userRepository = new UserRepository();
const chatRepository = new ChatRepository();
const onlineUserRepository = new OnlineUserRepository();
// Controllers
const authController = AuthController(userRepository);

// REST API routes
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.get('/api/verify/:userId/:token', authController.verify);

// In-memory pools
const waitingPool = new Set();
const guestChatCounts = {};
const onlineUsers = new Set();

// Socket.IO
io.on('connection', ChatController(
  io, chatRepository, waitingPool, guestChatCounts,
  onlineLoggedInUsers, onlineGuestUsers, onlineUserRepository
));
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});