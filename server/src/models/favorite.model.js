import mongoose from 'mongoose';

/**
 * Favorites Schema
 * Junction / Bookmarks model referencing User and CodeReview
 */
const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodeReview',
      required: [true, 'Review reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user cannot favorite the same review twice
favoriteSchema.index({ user: 1, review: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
