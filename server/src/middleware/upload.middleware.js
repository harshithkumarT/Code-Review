import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/apiError.js';

// Ensure temporary uploads directory exists
const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// 1. Configure Multer Disk Storage for Temporary File Retention
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `code-${uniqueSuffix}${ext}`);
  },
});

// 2. File Filter for Allowed Code Extensions (.py, .java, .js, .ts, .cpp, .cs, etc.)
const codeFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.cpp', '.cs', '.go'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Supported extensions are: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// 3. Export Configured Multer Instance
export const codeUpload = multer({
  storage: diskStorage,
  fileFilter: codeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// Memory storage for user avatars
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});
