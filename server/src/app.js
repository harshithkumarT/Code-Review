import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sanitizeInput } from './middleware/security.middleware.js';

dotenv.config();

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(sanitizeInput);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Test Express App Running' });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handler
app.use(errorHandler);

export default app;
