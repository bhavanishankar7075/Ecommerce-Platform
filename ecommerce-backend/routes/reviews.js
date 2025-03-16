/* // Backend: routes/reviews.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Assuming you have this
const Review = require('../models/Review'); // Create a Review model

// Get user's reviews
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Post a review/rating
router.post('/', authMiddleware, async (req, res) => {
  const { orderId, productId, rating, review } = req.body;
  try {
    let existingReview = await Review.findOne({ orderId, productId, userId: req.user.id });
    if (existingReview) {
      existingReview.rating = rating || existingReview.rating;
      existingReview.review = review || existingReview.review;
      await existingReview.save();
    } else {
      const newReview = new Review({
        orderId,
        productId,
        userId: req.user.id,
        rating: rating || 0,
        review: review || '',
      });
      await newReview.save();
    }
    res.status(201).json({ message: 'Review saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router; */