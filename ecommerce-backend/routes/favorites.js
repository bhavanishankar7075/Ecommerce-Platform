const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');
const mongoose = require('mongoose');

router.post('/', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Favorite request:', { orderId, userId: req.user.id });

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const favorite = new Favorite({
      userId: req.user.id,
      orderId: new mongoose.Types.ObjectId(orderId),
    });
    await favorite.save();
    res.status(201).json({ message: 'Order favorited successfully', favorite });
  } catch (error) {
    console.error('Error favoriting order:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Order already favorited' });
    }
    res.status(500).json({ message: 'Failed to favorite order', error: error.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const favorites = await Favorite.find({ userId }).populate('orderId');
    // Log the favorites to debug
    console.log('Fetched favorites:', favorites);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites', error: error.message });
  }
});

router.delete('/:favoriteId', auth, async (req, res) => {
  try {
    const { favoriteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
      return res.status(400).json({ message: 'Invalid favorite ID' });
    }

    const favorite = await Favorite.findOneAndDelete({
      _id: favoriteId,
      userId: req.user.id,
    });
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' });
    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite', error: error.message });
  }
});

module.exports = router;