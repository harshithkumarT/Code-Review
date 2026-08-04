import { CodeReview } from '../models/review.model.js';
import { ReviewHistory } from '../models/history.model.js';
import { Favorite } from '../models/favorite.model.js';
import { generateCodeReview } from '../services/ai.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

/**
 * Helper mapping extension to language name
 */
const extToLanguage = (ext) => {
  const map = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
  };
  return map[ext.toLowerCase()] || 'JavaScript';
};

/**
 * Submit Code Snippet for AI Review & Store in DB
 * @route POST /api/reviews
 */
export const createCodeReview = async (req, res, next) => {
  try {
    const { title, language, codeSnippet, checkSecurity, checkPerformance, checkCleanCode, calculateComplexity } = req.body;

    if (!title || !language || !codeSnippet) {
      return next(new ApiError(400, 'Please provide title, language, and code snippet.'));
    }

    if (codeSnippet.trim().length < 10) {
      return next(new ApiError(400, 'Code snippet must contain at least 10 characters.'));
    }

    const aiAnalysis = await generateCodeReview(codeSnippet, language, {
      checkSecurity,
      checkPerformance,
      checkCleanCode,
      calculateComplexity,
    });

    const review = await CodeReview.create({
      user: req.user._id,
      title,
      language,
      originalCode: codeSnippet,
      reviewedCode: aiAnalysis.reviewedCode || codeSnippet,
      aiFeedback: aiAnalysis.aiFeedback || '',
      score: aiAnalysis.score || 0,
      bugs: aiAnalysis.bugs || [],
      optimizations: aiAnalysis.optimizations || [],
      securityIssues: aiAnalysis.securityIssues || [],
      complexity: aiAnalysis.complexity || { timeComplexity: 'N/A', spaceComplexity: 'N/A' },
    });

    await ReviewHistory.create({
      user: req.user._id,
      review: review._id,
      action: 'created',
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { review }, 'Code review generated and saved successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Code File, Extract Content, Run AI Review, and Delete Temp File
 * @route POST /api/reviews/upload-file
 */
export const createCodeReviewFromFile = async (req, res, next) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return next(new ApiError(400, 'Please upload a code file (.py, .java, .js, .ts, .cpp, .cs).'));
    }

    tempFilePath = req.file.path;
    const originalFileName = req.file.originalname;
    const ext = path.extname(originalFileName);
    const detectedLanguage = req.body.language || extToLanguage(ext);
    const reviewTitle = req.body.title || `Review: ${originalFileName}`;

    // Read file content from disk
    const codeContent = await fs.readFile(tempFilePath, 'utf-8');

    if (!codeContent || codeContent.trim().length < 10) {
      return next(new ApiError(400, 'Uploaded file is empty or contains fewer than 10 characters.'));
    }

    // Process review using AI Service
    const aiAnalysis = await generateCodeReview(codeContent, detectedLanguage, {
      checkSecurity: req.body.checkSecurity !== 'false',
      checkPerformance: req.body.checkPerformance !== 'false',
      checkCleanCode: req.body.checkCleanCode !== 'false',
    });

    // Save in MongoDB
    const review = await CodeReview.create({
      user: req.user._id,
      title: reviewTitle,
      language: detectedLanguage,
      originalCode: codeContent,
      reviewedCode: aiAnalysis.reviewedCode || codeContent,
      aiFeedback: aiAnalysis.aiFeedback || '',
      score: aiAnalysis.score || 0,
      bugs: aiAnalysis.bugs || [],
      optimizations: aiAnalysis.optimizations || [],
      securityIssues: aiAnalysis.securityIssues || [],
      complexity: aiAnalysis.complexity || { timeComplexity: 'N/A', spaceComplexity: 'N/A' },
    });

    await ReviewHistory.create({
      user: req.user._id,
      review: review._id,
      action: 'created',
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { review }, 'File uploaded, analyzed by AI, and temporary file cleaned up successfully.'));
  } catch (error) {
    next(error);
  } finally {
    // Delete temporary file from disk after processing
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`🗑️ Temporary file deleted from disk: ${tempFilePath}`);
      } catch (unlinkErr) {
        console.error(`⚠️ Failed to delete temp file ${tempFilePath}:`, unlinkErr.message);
      }
    }
  }
};

/**
 * Get Analytics Metrics for User Dashboard
 * @route GET /api/reviews/analytics
 */
export const getReviewAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const totalReviews = await CodeReview.countDocuments({ user: userId });

    if (totalReviews === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalReviews: 0,
            averageScore: 0,
            mostUsedLanguage: 'N/A',
            bestScore: 0,
            worstScore: 0,
            weeklyReviews: 0,
            monthlyReviews: 0,
            languageDistribution: [],
            scoreDistribution: [],
            timelineData: [],
          },
          'Analytics retrieved (No reviews yet)'
        )
      );
    }

    const statsAgg = await CodeReview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
        },
      },
    ]);

    const averageScore = Math.round(statsAgg[0]?.avgScore || 0);
    const bestScore = statsAgg[0]?.maxScore || 0;
    const worstScore = statsAgg[0]?.minScore || 0;

    const langAgg = await CodeReview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const mostUsedLanguage = langAgg[0]?._id || 'N/A';
    const languageDistribution = langAgg.map((l) => ({ language: l._id, count: l.count }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weeklyReviews = await CodeReview.countDocuments({
      user: userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const monthlyReviews = await CodeReview.countDocuments({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const scoreRanges = [
      { range: '90-100', count: await CodeReview.countDocuments({ user: userId, score: { $gte: 90 } }) },
      { range: '80-89', count: await CodeReview.countDocuments({ user: userId, score: { $gte: 80, $lt: 90 } }) },
      { range: '70-79', count: await CodeReview.countDocuments({ user: userId, score: { $gte: 70, $lt: 80 } }) },
      { range: '<70', count: await CodeReview.countDocuments({ user: userId, score: { $lt: 70 } }) },
    ];

    const timelineAgg = await CodeReview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 10 },
    ]);

    const timelineData = timelineAgg.map((t) => ({
      date: t._id,
      count: t.count,
      avgScore: Math.round(t.avgScore),
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalReviews,
          averageScore,
          mostUsedLanguage,
          bestScore,
          worstScore,
          weeklyReviews,
          monthlyReviews,
          languageDistribution,
          scoreDistribution: scoreRanges,
          timelineData,
        },
        'Analytics data generated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Review details by ID
 * @route GET /api/reviews/:id
 */
export const getReviewById = async (req, res, next) => {
  try {
    const review = await CodeReview.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return next(new ApiError(404, 'Code review not found.'));
    }

    const fav = await Favorite.findOne({ user: req.user._id, review: review._id });
    const reviewObj = review.toObject();
    reviewObj.isFavorite = !!fav;

    return res
      .status(200)
      .json(new ApiResponse(200, { review: reviewObj }, 'Review details retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Advanced Search & Filter Endpoint for Code Reviews
 * @route GET /api/reviews
 */
export const getUserReviews = async (req, res, next) => {
  try {
    const {
      title,
      keywords,
      search,
      language,
      minScore,
      maxScore,
      startDate,
      endDate,
      sort = 'newest',
      page = 1,
      limit = 6,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user._id };

    if (keywords && keywords.trim()) {
      query.$text = { $search: keywords.trim() };
    }

    const searchString = title || search;
    if (searchString && searchString.trim() && !query.$text) {
      query.$or = [
        { title: { $regex: searchString.trim(), $options: 'i' } },
        { language: { $regex: searchString.trim(), $options: 'i' } },
      ];
    }

    if (language && language !== 'All') {
      query.language = language;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      query.score = {};
      if (minScore !== undefined && minScore !== '') query.score.$gte = Number(minScore);
      if (maxScore !== undefined && maxScore !== '') query.score.$lte = Number(maxScore);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    if (sort === 'score_desc') sortOptions = { score: -1, createdAt: -1 };
    if (sort === 'score_asc') sortOptions = { score: 1, createdAt: -1 };

    const totalCount = await CodeReview.countDocuments(query);
    const reviews = await CodeReview.find(query).sort(sortOptions).skip(skip).limit(limitNum);

    const userFavs = await Favorite.find({ user: req.user._id }).select('review');
    const favSet = new Set(userFavs.map((f) => f.review.toString()));

    const formattedReviews = reviews.map((r) => {
      const obj = r.toObject();
      obj.isFavorite = favSet.has(r._id.toString());
      return obj;
    });

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews: formattedReviews,
          pagination: {
            totalCount,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
          },
        },
        'User reviews fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a code review by ID
 * @route DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res, next) => {
  try {
    const review = await CodeReview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return next(new ApiError(404, 'Code review not found.'));
    }

    await Favorite.deleteMany({ review: req.params.id });
    await ReviewHistory.create({
      user: req.user._id,
      review: req.params.id,
      action: 'deleted',
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Code review deleted successfully.'));
  } catch (error) {
    next(error);
  }
};
