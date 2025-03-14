const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');

// Get all orders (admin only) with pagination, filtering, sorting, and search
router.get('/admin', verifyAdmin, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order || 'desc';
    const search = req.query.search || '';

    // Build the match stage for filtering
    const matchStage = {};
    if (status) matchStage.status = status;
    if (mongoose.Types.ObjectId.isValid(search)) {
      matchStage._id = new mongoose.Types.ObjectId(search);
    }

    // Build the aggregation pipeline
    const pipeline = [
      // Match orders based on status and _id (if search is a valid ObjectId)
      { $match: matchStage },
      // Lookup to join with Users collection
      {
        $lookup: {
          from: 'users', // The name of the User collection in MongoDB (lowercase 'users')
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      // Unwind the userId array (since $lookup creates an array)
      { $unwind: '$userId' },
      // Match again to filter by email (if search term is provided)
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      // Sort
      { $sort: { [sortBy]: order === 'asc' ? 1 : -1 } },
      // Pagination
      { $skip: skip },
      { $limit: limit },
      // Project to reshape the output (optional, to match previous structure)
      {
        $project: {
          _id: 1,
          userId: { _id: '$userId._id', email: '$userId.email' },
          items: 1,
          shippingAddress: 1,
          payment: 1,
          total: 1,
          status: 1,
          createdAt: 1
        }
      }
    ];

    // Execute the aggregation pipeline
    const orders = await Order.aggregate(pipeline);

    // Count total documents for pagination (without search by email for simplicity)
    const countPipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userId' } },
      { $unwind: '$userId' },
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      { $count: 'total' }
    ];
    const countResult = await Order.aggregate(countPipeline);
    const totalOrders = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Existing routes (post, get user orders, get order details, put) remain unchanged
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, payment, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required and must be an array' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!total || typeof total !== 'number') {
      return res.status(400).json({ message: 'Total is required and must be a number' });
    }

    const order = new Order({
      userId: req.user.id,
      items,
      shippingAddress,
      payment: payment || null,
      total,
    });
    await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only view your own orders' });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

router.get('/admin/details/:orderId', verifyAdmin, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId).populate('userId', 'email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
  }
});

router.put('/admin/:orderId', verifyAdmin, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'Status is required and must be a string' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

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

module.exports = { router, verifyAdmin };







































/* // ecommerce-backend/routes/orders.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
 const { verifyAdmin } = require('./admin');
 
// Create a new order (authenticated users only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, payment, total } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required and must be an array' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!total || typeof total !== 'number') {
      return res.status(400).json({ message: 'Total is required and must be a number' });
    }

    const order = new Order({
      userId: req.user.id, // From authMiddleware
      items,
      shippingAddress,
      payment: payment || null, // Optional payment info
      total,
    });
    await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// Get all orders for a user (authenticated user only)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only view your own orders' });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all orders (admin only - placeholder for role check)
router.get('/admin',verifyAdmin, async (req, res) => {
  try {
    // Placeholder for admin check (add role-based logic later)
    if (!req.user.isAdmin) { // Assuming user object has isAdmin field
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Update order status (admin only - placeholder for role check)
router.put('/admin/:orderId', verifyAdmin, async (req, res) => {
  try {
    // Placeholder for admin check
    if (!req.user.isAdmin) { // Assuming user object has isAdmin field
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

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

module.exports = {router,verifyAdmin}; */














































































/* // ecommerce-backend/routes/orders.js
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

module.exports = router; */











































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