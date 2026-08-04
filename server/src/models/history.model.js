import mongoose from 'mongoose';

/**
 * Review History & Audit Log Schema
 * Tracks activity timeline and user actions on code reviews
 */
const historySchema = new mongoose.Schema(
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
      required: [true, 'Code review reference is required'],
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'favorited', 'shared', 'deleted'],
      default: 'created',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const ReviewHistory = mongoose.model('ReviewHistory', historySchema);
