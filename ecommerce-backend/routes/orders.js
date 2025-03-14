// ecommerce-backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Middleware to get user from token (for simplicity, we'll add this later)
const getUser = (req, res, next) => {
  req.user = { id: 'guest' }; // Dummy user for now; replace with JWT later
  next();
};

// Create a new order
router.post('/', getUser, async (req, res) => {
  try {
    const { items, shipping, payment, total } = req.body;
    const order = new Order({
      userId: req.user.id, // Use authenticated user ID
      items,
      shipping,
      payment,
      total,
    });
    await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// Get all orders for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all orders (admin)
router.get('/admin', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Update order status (admin)
router.put('/admin/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

module.exports = router;











































/* 
// ecommerce-backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create a new order (already implemented)
router.post('/', async (req, res) => {
  try {
    const { items, shipping, payment, total } = req.body;
    const order = new Order({
      userId: 'guest', // Replace with authenticated user ID later
      items,
      shipping,
      payment,
      total,
    });
    await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// Get all orders for a user (for /orders page)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all orders (for admin)
router.get('/admin', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Update order status (for admin)
router.put('/admin/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

module.exports = router; */















































/* // ecommerce-backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { items, shipping, payment, total } = req.body;
    const order = new Order({
      userId: 'guest', // Replace with authenticated user ID in the future
      items,
      shipping,
      payment,
      total,
    });
    await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

module.exports = router; */