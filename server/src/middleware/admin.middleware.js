import { ApiError } from '../utils/apiError.js';

/**
 * Role-Based Authorization Middleware for Admin Access
 */
export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied. Admin privileges required.'));
  }
  next();
};
