import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sanitizeInput } from './middleware/security.middleware.js';

dotenv.config();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

const app = express();

app.use(compression());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(sanitizeInput);

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'AI Code Review API is running' });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Test Express App Running' });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handler
app.use(errorHandler);

export default app;
