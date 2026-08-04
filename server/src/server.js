import app from './app.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { apiLimiter } from './middleware/security.middleware.js';
import { connectDB } from './config/db.js';

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

// Security Middlewares for Production Server Entry
app.use(helmet());
app.use(mongoSanitize());
app.use('/api', apiLimiter);

app.listen(PORT, () => {
  console.log(`🚀 Secure Server running on http://localhost:${PORT}`);
});
