import { User } from '../models/user.model.js';
import { CodeReview } from '../models/review.model.js';
import { Favorite } from '../models/favorite.model.js';
import { ReviewHistory } from '../models/history.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Update Profile Details (Name & Email)
 * @route PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return next(new ApiError(400, 'Name and email are required.'));
    }

    // If email is changing, check if new email is already taken
    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ApiError(400, 'Email address is already in use by another account.'));
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email: email.toLowerCase() },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    return res
      .status(200)
      .json(new ApiResponse(200, { user: updatedUser }, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload & Update Profile Picture
 * @route POST /api/users/avatar
 */
export const updateAvatar = async (req, res, next) => {
  try {
    const { profileImage } = req.body;

    // Handle base64 string or image URL
    let imageUrl = profileImage;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const mimeType = req.file.mimetype || 'image/png';
      imageUrl = `data:${mimeType};base64,${b64}`;
    }

    if (!imageUrl) {
      return next(new ApiError(400, 'Please provide an image file or profile image URL.'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { returnDocument: 'after' }
    ).select('-password');

    return res
      .status(200)
      .json(new ApiResponse(200, { user: updatedUser }, 'Profile picture updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Change Account Password
 * @route PUT /api/users/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Please provide current password and new password.'));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, 'New password must be at least 6 characters long.'));
    }

    // Select password explicitly to compare
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect.'));
    }

    // Update password (triggers pre-save bcrypt hook)
    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Account and Purge User Data
 * @route DELETE /api/users/account
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Purge user's reviews, favorites, and history
    await CodeReview.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    await ReviewHistory.deleteMany({ user: userId });

    // Delete user document
    await User.findByIdAndDelete(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Account and associated data permanently deleted'));
  } catch (error) {
    next(error);
  }
};
