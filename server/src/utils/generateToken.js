import jwt from 'jsonwebtoken';

/**
 * Generate a JSON Web Token (JWT) signed with user ID
 * @param {string} userId - Mongo Document ID of the user
 * @returns {string} Signed JWT string valid for 7 days
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '7d' }
  );
};
