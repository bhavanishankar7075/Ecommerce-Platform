// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token); // Debug log
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Basic validation of token format (should have 3 parts: header.payload.signature)
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
      console.error('Invalid token format:', token);
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in auth middleware:', decoded); // Debug log
    if (!decoded.id && !decoded._id) {
      return res.status(401).json({ message: 'Invalid token: user ID not found in token' });
    }

    // Fetch user from database
    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId);
    console.log('Fetched user:', user); // Debug log
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    // Attach user to request
    req.user = user;
    console.log('req.user set:', req.user); // Debug log
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};




































/* const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in auth middleware:', decoded); // Debug log
    req.user = decoded;
    if (!req.user.id && !req.user._id) {
      return res.status(401).json({ message: 'Invalid token: user ID not found' });
    }
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}; */


























/* 
// ecommerce-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}; */