// ecommerce-backend/routes/checkout.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/', authenticate, (req, res) => {
  const { cart, shipping, payment } = req.body;
  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  const order = {
    userId: req.user.id,
    cart: cart.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    shipping,
    payment: {
      cardNumber: payment.cardNumber.slice(-4), // Store only last 4 digits
      expiry: payment.expiry,
    },
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    date: new Date(),
  };
  // In a real app, save to a database (e.g., MongoDB)
  console.log('Order Placed:', order);
  res.status(200).json({ message: 'Order placed successfully', orderId: Date.now() }); // Mock order ID
});

module.exports = router;