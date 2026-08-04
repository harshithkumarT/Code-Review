import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { CodeReview } from '../src/models/review.model.js';
import { Favorite } from '../src/models/favorite.model.js';
import { generateToken } from '../src/utils/generateToken.js';

describe('Favorites API Integration Tests', () => {
  let userId;
  let token;
  let reviewId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-code-reviewer-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const user = await User.create({
      name: 'Fav Tester',
      email: `fav-test-${Date.now()}@example.com`,
      password: 'password123',
    });

    userId = user._id;
    token = generateToken(userId);

    const review = await CodeReview.create({
      user: userId,
      title: 'Favorite Test Review',
      language: 'Python',
      originalCode: 'def test(): pass',
      score: 90,
    });

    reviewId = review._id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /fav-test.*@example\.com/ });
    await CodeReview.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    await mongoose.connection.close();
  });

  it('POST /api/favorites/toggle - Should add review to favorites', async () => {
    const res = await request(app)
      .post('/api/favorites/toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewId });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.isFavorite).toBe(true);
  });

  it('GET /api/favorites - Should fetch bookmarked favorites list', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.favorites.length).toBeGreaterThan(0);
  });

  it('POST /api/favorites/toggle - Should remove review from favorites when toggled again', async () => {
    const res = await request(app)
      .post('/api/favorites/toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewId });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isFavorite).toBe(false);
  });
});
