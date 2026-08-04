import { Router } from 'express';
import authRoutes from './auth.routes.js';
import reviewRoutes from './review.routes.js';
import userRoutes from './user.routes.js';
import favoriteRoutes from './favorite.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

export default router;
