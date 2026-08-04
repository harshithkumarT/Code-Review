import { Router } from 'express';
import { generatePdfReport, generateDocxReport } from '../controllers/report.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/:id/pdf', generatePdfReport);
router.get('/:id/docx', generateDocxReport);

export default router;
