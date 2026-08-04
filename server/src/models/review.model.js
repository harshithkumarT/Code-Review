import mongoose from 'mongoose';

/**
 * Code Review Schema
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    language: {
      type: String,
      required: [true, 'Programming language is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
    },
    originalCode: {
      type: String,
      required: [true, 'Original code snippet is required'],
    },
    reviewedCode: {
      type: String,
      default: '',
    },
    aiFeedback: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    bugs: [
      {
        line: { type: Number },
        issue: { type: String, required: true },
        suggestion: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
      },
    ],
    optimizations: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        impact: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
    ],
    securityIssues: [
      {
        issue: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
        mitigation: { type: String },
      },
    ],
    complexity: {
      timeComplexity: { type: String, default: 'N/A' },
      spaceComplexity: { type: String, default: 'N/A' },
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================================
   MONGODB INDEXES FOR ADVANCED SEARCH & HIGH PERFORMANCE QUERY EXECUTION
   ========================================================================== */

// 1. Full-Text Search Index over Title, Feedback, and Code Snippets
reviewSchema.index(
  {
    title: 'text',
    aiFeedback: 'text',
    originalCode: 'text',
    reviewedCode: 'text',
  },
  {
    weights: {
      title: 10,
      aiFeedback: 5,
      originalCode: 2,
      reviewedCode: 2,
    },
    name: 'TextSearchIndex',
    language_override: 'searchLanguage', // Prevents conflict with our 'language' field (JavaScript, Python, etc.)
    default_language: 'english',
  }
);

// 2. Compound Indexes for Filtered & Sorted Query Optimization
reviewSchema.index({ user: 1, createdAt: -1 }); // Fast user timeline lookup
reviewSchema.index({ user: 1, language: 1, score: -1 }); // User + Language + Score sorting
reviewSchema.index({ user: 1, score: 1 }); // Score range filtering

export const CodeReview = mongoose.model('CodeReview', reviewSchema);
