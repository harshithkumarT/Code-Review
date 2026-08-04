import { Router } from 'express';
import { toggleFavorite, removeFavorite, getUserFavorites } from '../controllers/favorite.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/toggle', toggleFavorite);
router.delete('/:reviewId', removeFavorite);
router.get('/', getUserFavorites);

export default router;
