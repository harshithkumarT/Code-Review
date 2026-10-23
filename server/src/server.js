import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import helmet from 'helmet';
import { apiLimiter } from './middleware/security.middleware.js';
import { connectDB } from './config/db.js';

// Connect to PostgreSQL
connectDB();

const PORT = process.env.PORT || 5000;

// Security Middlewares for Production Server Entry
app.use(helmet());
app.use('/api', apiLimiter);


app.listen(PORT, () => {
  console.log(`🚀 Secure Server running on http://localhost:${PORT}`);
});
