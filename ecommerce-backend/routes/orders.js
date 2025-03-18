const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    const matchStage = {};
    if (status) matchStage.status = status;
    if (mongoose.Types.ObjectId.isValid(search)) {
      matchStage._id = new mongoose.Types.ObjectId(search);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      { $unwind: '$userId' },
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      { $sort: { [sortBy]: order === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: { _id: '$userId._id', email: '$userId.email' },
          items: 1,
          shippingAddress: 1,
          payment: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);
    const countPipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userId' } },
      { $unwind: '$userId' },
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      { $count: 'total' },
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

// Create a new order (used for COD)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId, total, payment, items, shippingAddress, savePaymentMethod } = req.body;

    console.log('Received COD order data:', req.body);

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required and must be a non-empty array' });
    }

    // Validate shippingAddress
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ message: 'Shipping address must be a valid object' });
    }
    if (!shippingAddress.address) {
      return res.status(400).json({ message: 'Shipping address field is required' });
    }

    // Validate total and payment
    if (!total || isNaN(total)) {
      return res.status(400).json({ message: 'Total is required and must be a number' });
    }
    if (!payment) {
      return res.status(400).json({ message: 'Payment information is required' });
    }

    // Validate and convert item productIds
    items.forEach((item, index) => {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new Error(`Invalid productId at index ${index}: ${item.productId}`);
      }
      item.productId = new mongoose.Types.ObjectId(item.productId);
      item.quantity = Number(item.quantity);
      item.price = Number(item.price);
    });

    // Handle savePaymentMethod (if provided)
    if (savePaymentMethod && payment !== 'Cash on Delivery') {
      let paymentData;
      try {
        paymentData = typeof savePaymentMethod === 'string' ? JSON.parse(savePaymentMethod) : savePaymentMethod;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid payment method data' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.paymentMethods.push({
        name: paymentData.name,
        cardNumber: paymentData.cardNumber,
        expiry: paymentData.expiry,
      });
      await user.save();
    }

    // Create the order
    const order = new Order({
      userId: userId || req.user.id,
      items,
      shippingAddress,
      payment,
      total: Number(total),
    });

    const savedOrder = await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: savedOrder._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: error.message || 'Failed to place order' });
  }
});

// Create Stripe Checkout session (used for card payments)
/* router.post('/create-session', authMiddleware, async (req, res) => {
  try {
    console.log('Received request to create Stripe session:', req.body);

    const { userId: userIdFromBody, items, shippingAddress, total, paymentMethod, cardDetails } = req.body;
    const userId = userIdFromBody || req.user.id; // Fallback to req.user.id from authMiddleware

    // Log all fields to debug
    console.log('Parsed fields:', { userId, items, shippingAddress, total, paymentMethod, cardDetails });

    // Validate required fields
    if (!userId || !items || !shippingAddress || !total) {
      console.error('Missing required fields:', { userId, items, shippingAddress, total });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle COD (though not expected in this endpoint)
    if (paymentMethod === 'cod') {
      console.log('COD selected, returning dummy session ID');
      return res.json({ sessionId: 'cod-' + Date.now() });
    }

    // Validate items array
    if (!Array.isArray(items)) {
      console.error('Items is not an array:', items);
      return res.status(400).json({ message: 'Items must be an array' });
    }
    if (items.length === 0) {
      console.error('Items array is empty:', items);
      return res.status(400).json({ message: 'Items array is empty' });
    }

    // Validate each item
    const lineItems = items.map(item => {
      if (!item.name || !item.price || !item.quantity) {
        console.error('Invalid item:', item);
        throw new Error('Each item must have name, price, and quantity');
      }
      return {
        price_data: {
          currency: 'inr',
          product_data: { name: item.name },
          unit_amount: Number(item.price), // Already in cents from frontend
        },
        quantity: Number(item.quantity),
      };
    });

    console.log('Creating Stripe session with line_items:', lineItems);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'http://localhost:3000/failure',
      shipping_address_collection: {
        allowed_countries: ['US', 'IN'],
      },
      metadata: {
        userId,
        shippingAddress: JSON.stringify(shippingAddress),
        payment: paymentMethod === 'saved' ? `Card ending in ${cardDetails.cardNumber.slice(-4)}` : 'Online Payment',
        items: JSON.stringify(items.map(item => ({
          name: item.name,
          price: item.price / 100, // Convert back to rupees for storage
          quantity: item.quantity,
          image: item.image || '',
        }))),
        total: (total / 100).toString(), // Convert back to rupees for storage
      },
    });

    console.log('Stripe session created successfully:', session.id);

    // Save the order as Pending
    const order = new Order({
      userId,
      items: items.map(item => ({
        name: item.name,
        price: item.price / 100, // Convert back to rupees
        quantity: item.quantity,
        image: item.image || '',
      })),
      shippingAddress,
      payment: paymentMethod === 'saved' ? `Card ending in ${cardDetails.cardNumber.slice(-4)}` : 'Online Payment',
      total: total / 100, // Convert back to rupees
      stripeSessionId: session.id,
      status: 'Pending',
    });

    await order.save();

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe session:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to create payment session', error: error.message });
  }
}); */



router.post('/create-session', authMiddleware, async (req, res) => {
  try {
    console.log('Received request to create Stripe session:', req.body);

    const { userId: userIdFromBody, items, shippingAddress, total, paymentMethod, cardDetails } = req.body;
    const userId = userIdFromBody || req.user.id; // Fallback to req.user.id from authMiddleware

    console.log('Parsed fields:', { userId, items, shippingAddress, total, paymentMethod, cardDetails });

    if (!userId || !items || !shippingAddress || !total) {
      console.error('Missing required fields:', { userId, items, shippingAddress, total });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (paymentMethod === 'cod') {
      console.log('COD selected, returning dummy session ID');
      return res.json({ sessionId: 'cod-' + Date.now() });
    }

    if (!Array.isArray(items)) {
      console.error('Items is not an array:', items);
      return res.status(400).json({ message: 'Items must be an array' });
    }
    if (items.length === 0) {
      console.error('Items array is empty:', items);
      return res.status(400).json({ message: 'Items array is empty' });
    }

    const lineItems = items.map(item => {
      if (!item.name || !item.price || !item.quantity) {
        console.error('Invalid item:', item);
        throw new Error('Each item must have name, price, and quantity');
      }
      return {
        price_data: {
          currency: 'inr',
          product_data: { name: item.name },
          unit_amount: Number(item.price), // Already in cents from frontend
        },
        quantity: Number(item.quantity),
      };
    });

    console.log('Creating Stripe session with line_items:', lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:5003/success?session_id={CHECKOUT_SESSION_ID}`, // Updated to port 5003
      cancel_url: `http://localhost:5003/failure`, // Updated to port 5003
      shipping_address_collection: {
        allowed_countries: ['US', 'IN'],
      },
      metadata: {
        userId,
        shippingAddress: JSON.stringify(shippingAddress),
        payment: paymentMethod === 'saved' ? `Card ending in ${cardDetails.cardNumber.slice(-4)}` : 'Online Payment',
        items: JSON.stringify(items.map(item => ({
          name: item.name,
          price: item.price / 100,
          quantity: item.quantity,
          image: item.image || '',
        }))),
        total: (total / 100).toString(),
      },
    });

    console.log('Stripe session created successfully:', session.id);

    const order = new Order({
      userId,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price / 100,
        quantity: item.quantity,
        image: item.image || '',
      })),
      shippingAddress,
      payment: paymentMethod === 'saved' ? `Card ending in ${cardDetails.cardNumber.slice(-4)}` : 'Online Payment',
      total: total / 100,
      stripeSessionId: session.id,
      status: 'Pending',
    });

    await order.save();

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe session:', error.message, error.stack);
    if (error.type === 'StripeAPIError') {
      return res.status(400).json({ message: 'Invalid Stripe API Key or configuration.', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create payment session', error: error.message });
  }
});


// Fetch order details by session ID
/* router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Check if order already exists
    let order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) {
      // Create order from session metadata
      const { userId, shippingAddress, payment, items, total } = session.metadata;

      order = new Order({
        userId,
        items: JSON.parse(items),
        shippingAddress: JSON.parse(shippingAddress),
        payment,
        total: Number(total),
        stripeSessionId: sessionId,
        status: 'Completed', // Update status after successful payment
      });

      await order.save();
    } else {
      // Update order status to Completed
      order.status = 'Completed';
      await order.save();
    }

    res.json({
      orderId: order._id,
      items: order.items,
      shippingAddress: order.shippingAddress,
      total: order.total,
      payment: order.payment,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
  }
}); */



router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Check if order already exists
    let order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) {
      // Create order from session metadata
      const { userId, shippingAddress, payment, items, total } = session.metadata;

      order = new Order({
        userId,
        items: JSON.parse(items),
        shippingAddress: JSON.parse(shippingAddress),
        payment,
        total: Number(total),
        stripeSessionId: sessionId,
        status: 'Delivered', // Changed to 'Delivered' to match schema
      });

      await order.save();
    } else {
      // Update order status to Delivered
      order.status = 'Delivered'; // Changed to 'Delivered' to match schema
      await order.save();
    }

    res.json({
      orderId: order._id,
      items: order.items,
      shippingAddress: order.shippingAddress,
      total: order.total,
      payment: order.payment,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
  }
});


// Get user's orders
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching orders for userId:', userId, 'req.user.id:', req.user.id);
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only view your own orders' });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log('Orders found:', orders);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order details (admin only)
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

// Update order status (admin only)
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



































































/* const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order'); // Fixed case sensitivity
const mongoose = require('mongoose');
const { verifyAdmin } = require('./admin');
const multer = require('multer');
const stripe = require('stripe')('sk_test_51PwKUJL4Eh51qnT6ELLRA7Gz4dU6mdeS5FT3FIf2Op7VMGoNaEBAZVz8a9R1ajWO9uF9DiFBq2cm9pLJW1ntlKMy00gmjWPI8J');

// Configure multer to handle form-data without file uploads
const upload = multer();

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

    const matchStage = {};
    if (status) matchStage.status = status;
    if (mongoose.Types.ObjectId.isValid(search)) {
      matchStage._id = new mongoose.Types.ObjectId(search);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      { $unwind: '$userId' },
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      { $sort: { [sortBy]: order === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: { _id: '$userId._id', email: '$userId.email' },
          items: 1,
          shippingAddress: 1,
          payment: 1,
          total: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);
    const countPipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userId' } },
      { $unwind: '$userId' },
      ...(search && !mongoose.Types.ObjectId.isValid(search)
        ? [{ $match: { 'userId.email': { $regex: search, $options: 'i' } } }]
        : []),
      { $count: 'total' },
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

// Create a new order
router.post('/', authMiddleware, upload.none(), async (req, res) => {
  try {
    const { userId, total, payment, items, shippingAddress, savePaymentMethod } = req.body;

    console.log('Received FormData (raw req.body):', req.body);

    let parsedItems;
    try {
      parsedItems = JSON.parse(items);
    } catch (e) {
      return res.status(400).json({ message: 'Items must be a valid JSON array' });
    }

    let parsedShippingAddress;
    try {
      parsedShippingAddress = JSON.parse(shippingAddress);
    } catch (e) {
      return res.status(400).json({ message: 'Shipping address must be a valid JSON object' });
    }

    console.log('Parsed shippingAddress:', parsedShippingAddress);

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ message: 'Items are required and must be a non-empty array' });
    }
    if (!parsedShippingAddress.address) {
      return res.status(400).json({ message: 'Shipping address field is required' });
    }
    if (!parsedShippingAddress.city) {
      return res.status(400).json({ message: 'Shipping city field is required' });
    }
    if (!parsedShippingAddress.postalCode) {
      return res.status(400).json({ message: 'Shipping postalCode field is required' });
    }
    if (!parsedShippingAddress.country) {
      return res.status(400).json({ message: 'Shipping country field is required' });
    }
    if (!parsedShippingAddress.phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!total || isNaN(total)) {
      return res.status(400).json({ message: 'Total is required and must be a number' });
    }
    if (!payment) {
      return res.status(400).json({ message: 'Payment information is required' });
    }

    parsedItems.forEach((item, index) => {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new Error(`Invalid productId at index ${index}: ${item.productId}`);
      }
      item.productId = new mongoose.Types.ObjectId(item.productId);
      item.quantity = Number(item.quantity);
      item.price = Number(item.price);
    });

    if (savePaymentMethod && payment !== 'Cash on Delivery') {
      let paymentData;
      try {
        paymentData = JSON.parse(savePaymentMethod);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid payment method data' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.paymentMethods.push({
        name: paymentData.name,
        cardNumber: paymentData.cardNumber,
        expiry: paymentData.expiry,
      });
      await user.save();
    }

    const order = new Order({
      userId: userId || req.user.id,
      items: parsedItems,
      shippingAddress: parsedShippingAddress,
      payment,
      total: Number(total),
    });

    const savedOrder = await order.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: savedOrder._id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: error.message || 'Failed to place order' });
  }
});

// Create Stripe Checkout session
router.post('/create-session', authMiddleware, async (req, res) => {
  try {
    console.log('Received request to create Stripe session:', req.body);

    const { userId, items, shippingAddress, total, paymentMethod, cardDetails } = req.body;

    if (!userId || !items || !shippingAddress || !total) {
      console.error('Missing required fields:', { userId, items, shippingAddress, total });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (paymentMethod === 'cod') {
      console.log('COD selected, returning dummy session ID');
      return res.json({ sessionId: 'cod-' + Date.now() });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array:', items);
      return res.status(400).json({ message: 'Items must be a non-empty array' });
    }

    const lineItems = items.map(item => {
      if (!item.name || !item.price || !item.quantity) {
        console.error('Invalid item:', item);
        throw new Error('Each item must have name, price, and quantity');
      }
      return {
        price_data: {
          currency: 'inr',
          product_data: { name: item.name },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Number(item.quantity),
      };
    });

    console.log('Creating Stripe session with line_items:', lineItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'http://localhost:3000/failure',
      metadata: {
        userId,
        shippingAddress: JSON.stringify(shippingAddress),
        payment: paymentMethod === 'saved' ? `Card ending in ${cardDetails.cardNumber.slice(-4)}` : 'Online Payment',
        items: JSON.stringify(items),
        total: total.toString(),
      },
    });

    console.log('Stripe session created successfully:', session.id);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe session:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to create payment session', error: error.message });
  }
});

// Fetch order details by session ID
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Check if order already exists
    let order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) {
      // Create order from session metadata
      const { userId, shippingAddress, payment, items, total } = session.metadata;

      order = new Order({
        userId,
        items: JSON.parse(items),
        shippingAddress: JSON.parse(shippingAddress),
        payment,
        total: Number(total),
        stripeSessionId: sessionId,
      });

      await order.save();
    }

    res.json({
      orderId: order._id,
      items: order.items,
      shippingAddress: order.shippingAddress,
      total: order.total,
      payment: order.payment,
    });
  } catch (error) {
    console.error('Error fetchingextended session:', error);
    res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
  }
});

// Get user's orders
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching orders for userId:', userId, 'req.user.id:', req.user.id);
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only view your own orders' });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log('Orders found:', orders);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order details (admin only)
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

// Update order status (admin only)
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

module.exports = { router, verifyAdmin }; */







































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














































































