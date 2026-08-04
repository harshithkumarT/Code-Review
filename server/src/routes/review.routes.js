import { Router } from 'express';
import {
  createCodeReview,
  createCodeReviewFromFile,
  getReviewById,
  getUserReviews,
  deleteReview,
  getReviewAnalytics,
} from '../controllers/review.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { codeUpload } from '../middleware/upload.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/', createCodeReview);
router.post('/upload-file', codeUpload.single('codeFile'), createCodeReviewFromFile);
router.get('/analytics', cacheMiddleware(60), getReviewAnalytics); // Cached for 60 seconds
router.get('/', cacheMiddleware(30), getUserReviews); // Cached for 30 seconds
router.get('/:id', getReviewById);
router.delete('/:id', deleteReview);

export default router;
