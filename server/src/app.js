import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sanitizeInput } from './middleware/security.middleware.js';

dotenv.config();

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(compression());

// CORS configuration supporting localhost, Vercel, Netlify, and custom CLIENT_URL
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      if (!origin) return cb(null, true);
      if (configuredOrigins.length > 0 && configuredOrigins.includes(origin)) return cb(null, true);
      // Allow localhost and local loopback
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
      // Allow common frontend deployments
      if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
        return cb(null, true);
      }
      // If configuredOrigins is not explicitly set, permit all origins
      if (configuredOrigins.length === 0) return cb(null, true);
      return cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options('*', cors());
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
