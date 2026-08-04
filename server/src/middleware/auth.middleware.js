import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

/**
 * JWT Authentication Middleware
 * Validates Bearer token in the Authorization header and attaches authenticated user to req.user
 */
export const authenticateUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>" header string
      token = req.headers.authorization.split(' ')[1];

      // Verify JWT signature using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

      // Fetch user from DB excluding password field and attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new ApiError(401, 'User not found or token is invalid'));
      }

      next();
    } catch (error) {
      return next(new ApiError(401, 'Not authorized, token verification failed'));
    }
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }
};
