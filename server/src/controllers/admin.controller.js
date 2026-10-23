import { User } from '../models/user.model.js';
import { CodeReview } from '../models/review.model.js';
import { Favorite } from '../models/favorite.model.js';
import { ReviewHistory } from '../models/history.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Get System-Wide Admin Statistics
 * @route GET /api/admin/stats
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReviews = await CodeReview.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Calculate platform-wide average score
    const avgPlatformScore = await CodeReview.getPlatformAvgScore();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalUsers,
          totalReviews,
          totalAdmins,
          avgPlatformScore,
        },
        'Admin statistics retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Searchable & Paginated System Users List
 * @route GET /api/admin/users
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { users, totalCount } = await User.findWithPagination({
      search,
      skip,
      limit: limitNum,
      sort: { createdAt: -1 },
    });

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pagination: {
            totalCount,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
          },
        },
        'Admin users list retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User Account & Associated Data (Admin Only)
 * @route DELETE /api/admin/users/:userId
 */
export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId.toString() === req.user.id.toString()) {
      return next(new ApiError(400, 'Admins cannot delete their own account from the admin dashboard.'));
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return next(new ApiError(404, 'User not found.'));
    }

    // Purge associated review data
    await CodeReview.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    await ReviewHistory.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, `User account ${userToDelete.email} permanently deleted`));
  } catch (error) {
    next(error);
  }
};

/**
 * Get System-Wide Code Reviews List across All Users
 * @route GET /api/admin/reviews
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const { reviews, totalCount } = await CodeReview.findWithUser({
      search,
      skip,
      limit: limitNum,
    });

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews,
          pagination: {
            totalCount,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
          },
        },
        'All system reviews retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};
