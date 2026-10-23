import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser, logoutUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/security.middleware.js';

const router = Router();

// Apply auth rate limiter to prevent password brute-forcing
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

router.get('/me', authenticateUser, getCurrentUser);
router.post('/logout', logoutUser);

export default router;
