import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketManager } from './sockets/SpAbhay_socketManager.js';
import coreRoutes from './routes/SpAbhay_coreRoutes.js';
import authRoutes from './routes/SpAbhay_authRoutes.js';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', coreRoutes);

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grocery_billing')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Setup WebSockets
setupSocketManager(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
