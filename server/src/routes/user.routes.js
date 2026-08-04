import { Router } from 'express';
import {
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/user.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// JWT Protection for all user routes
router.use(authenticateUser);

router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), updateAvatar);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);

export default router;
