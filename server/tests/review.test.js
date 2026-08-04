import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { CodeReview } from '../src/models/review.model.js';
import { generateToken } from '../src/utils/generateToken.js';

describe('Review & History API Integration Tests', () => {
  let userId;
  let token;
  let createdReviewId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-code-reviewer-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const user = await User.create({
      name: 'Review Tester',
      email: `review-test-${Date.now()}@example.com`,
      password: 'password123',
    });

    userId = user._id;
    token = generateToken(userId);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /review-test.*@example\.com/ });
    await CodeReview.deleteMany({ user: userId });
    await mongoose.connection.close();
  });

  it('POST /api/reviews - Should submit code for AI review and store in DB', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Jest Test Middleware Validation',
        language: 'JavaScript',
        codeSnippet: 'const auth = (req, res, next) => { console.log(req.headers); next(); };',
        checkSecurity: true,
        checkPerformance: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review.title).toBe('Jest Test Middleware Validation');
    expect(res.body.data.review.score).toBeDefined();

    createdReviewId = res.body.data.review._id;
  });

  it('POST /api/reviews - Should reject code snippets under 10 characters', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Short Snippet',
        language: 'JavaScript',
        codeSnippet: 'short',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/reviews/:id - Should fetch review details by ID', async () => {
    const res = await request(app)
      .get(`/api/reviews/${createdReviewId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.review._id).toBe(createdReviewId.toString());
  });

  it('GET /api/reviews - Should fetch paginated and searchable review list', async () => {
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: 'Jest', language: 'JavaScript' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.reviews).toBeDefined();
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
  });
});
