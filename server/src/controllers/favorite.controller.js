import { Favorite } from '../models/favorite.model.js';
import { CodeReview } from '../models/review.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Toggle Favorite Status (Add or Remove)
 * @route POST /api/favorites/toggle
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { reviewId } = req.body;

    if (!reviewId) {
      return next(new ApiError(400, 'Review ID is required'));
    }

    const review = await CodeReview.findById(reviewId);
    if (!review) {
      return next(new ApiError(404, 'Code review not found'));
    }

    const existingFav = await Favorite.findOne({ user: req.user.id, review: reviewId });

    if (existingFav) {
      await Favorite.findByIdAndDelete(existingFav.id);
      return res
        .status(200)
        .json(new ApiResponse(200, { isFavorite: false }, 'Removed from favorites'));
    } else {
      await Favorite.create({ user: req.user.id, review: reviewId });
      return res
        .status(201)
        .json(new ApiResponse(201, { isFavorite: true }, 'Added to favorites'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Explicitly Remove a Code Review from Favorites
 * @route DELETE /api/favorites/:reviewId
 */
export const removeFavorite = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      review: reviewId,
    });

    if (!favorite) {
      return next(new ApiError(404, 'Favorite entry not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { isFavorite: false }, 'Removed from favorites successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookmarked favorites for the logged-in user
 * @route GET /api/favorites
 */
export const getUserFavorites = async (req, res, next) => {
  try {
    const reviewList = await Favorite.findByUserPopulated(req.user.id);

    return res
      .status(200)
      .json(new ApiResponse(200, { favorites: reviewList, count: reviewList.length }, 'Favorites fetched successfully'));
  } catch (error) {
    next(error);
  }
};
