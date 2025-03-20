const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  createdAt: { type: Date, default: Date.now },
});

// Ensure unique combination of userId and orderId
favoriteSchema.index({ userId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);