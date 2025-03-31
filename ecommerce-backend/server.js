 















































 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://localhost:5003', 'http://localhost:5004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/Cart');
const customerRoutes = require('./routes/customer');
const { router: adminRouter } = require('./routes/admin');
const productRoutes = require('./routes/products');
const { router: orderRouter } = require('./routes/orders'); // Ensure orders router is correctly destructured
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
// Note: Removing or commenting out checkoutRoutes for now since it might be causing conflicts
// const checkoutRoutes = require('./routes/checkout');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter); // Main orders route
app.use('/api/users', userRoutes);
app.use('/api', customerRoutes); // Moved to the end to avoid conflicts
 app.use('/api/wishlist', require('./routes/wishlist'));
  app.use('/api/reviews', reviewRoutes); 

 

// Map /api/checkout to /api/orders/create-session for Stripe session creation
app.use('/api/checkout', (req, res, next) => {
  console.log('Received request at /api/checkout, redirecting to /create-session:', req.body);
  req.url = '/create-session'; // Redirect to the create-session endpoint in orders.js
  orderRouter(req, res, next);
});

// Root Route
app.get('/', (req, res) => {
  res.send('E-commerce Backend is running on port 5001');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 

















































/* 
 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://localhost:5003', 'http://localhost:5004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/Cart');
const customerRoutes = require('./routes/customer');
const { router: adminRouter } = require('./routes/admin'); // Destructure router
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const { router: orderRouter } = require('./routes/orders'); // Destructure router
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', customerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', adminRouter); // Use the router instance
app.use('/api/orders', orderRouter); // Use the router instance
app.use('/api/checkout', checkoutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', require('./routes/reviews'));

// Root Route
app.get('/', (req, res) => {
  res.send('E-commerce Backend is running on port 5001');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 */ 

 



































