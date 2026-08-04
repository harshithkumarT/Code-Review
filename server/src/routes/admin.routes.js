import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  deleteUserByAdmin,
  getAdminReviews,
} from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// Require both JWT authentication AND Admin authorization
router.use(authenticateUser, authorizeAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.delete('/users/:userId', deleteUserByAdmin);
router.get('/reviews', getAdminReviews);

export default router;
