const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token in checkout:', decoded);
    req.user = decoded;
    if (!req.user.id && !req.user._id) {
      return res.status(401).json({ message: 'Invalid token: user ID not found' });
    }
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/', authenticate, async (req, res) => {
  try {
    const { cart, shipping, payment } = req.body;
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate userId
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is missing from token' });
    }

    // Create the order
    const order = new Order({
      userId,
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image, // Include if available
      })),
      shippingAddress: {
        address: shipping.address,
        city: shipping.city || '', // Optional fields
        postalCode: shipping.postalCode || '',
        country: shipping.country || '',
        phoneNumber: shipping.phoneNumber || '',
      },
      payment: {
        cardNumber: payment.cardNumber.slice(-4),
        expiry: payment.expiry,
      },
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });

    // Save the order to the database
    await order.save();

    res.status(200).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (error) {
    console.error('Error creating order in checkout:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY in .env');
    }

    const { items, shippingAddress, paymentMethod, cardDetails, total } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is missing from token' });
    }

    // Create Stripe Checkout Session
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: user.email, // Ensure user has an email (adjust if necessary)
    });

    // Save order to database
    const order = new Order({
      userId,
      items: items.map(item => ({
        productId: item.productId || item._id, // Ensure productId is provided
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
      })),
      shippingAddress,
      payment: paymentMethod === 'new' ? { cardNumber: cardDetails.cardNumber.slice(-4), expiry: cardDetails.expiry } : 'Saved Payment',
      total,
      stripeSessionId: session.id,
    });

    await order.save();

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
});



module.exports = router;




























/* // ecommerce-backend/routes/checkout.js
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

module.exports = router; */