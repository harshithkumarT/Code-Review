import { User } from '../models/user.model.js';
import { generateToken } from '../utils/generateToken.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ApiError(400, 'Please provide all required fields (name, email, password)'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'User with this email already exists'));
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };

    return res
      .status(201)
      .json(new ApiResponse(201, { user: userResponse, token }, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user & issue JWT token
 * @route POST /api/auth/login
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    // Select password explicitly since it's hidden by default in user model
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: userResponse, token }, 'Logged in successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user profile
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, 'User profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user session
 * @route POST /api/auth/logout
 */
export const logoutUser = async (req, res, next) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'User logged out successfully'));
  } catch (error) {
    next(error);
  }
};
