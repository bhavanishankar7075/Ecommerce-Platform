// ecommerce-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Login
/* router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Changed from username to email
  try {
    const user = await User.findOne({ email }); // Find by email
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username }, // Include username in token
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}); */

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin || false }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: user.toObject({ getters: true }) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Register (renamed from signup)
router.post('/register', async (req, res) => {
  const { email, password } = req.body; // Changed from username to email
  try {
    const existingUser = await User.findOne({ email }); // Check by email
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const username = email.split('@')[0]; // Derive username from email
    const user = new User({ email, username, password }); // Include email and username
    await user.save();
    const token = jwt.sign(
      { id: user._id, username: user.username }, // Include username in token
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({ token, user: { username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
/*     req.user = decoded; // Should set req.user.id
 */    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ user: { username: user.username, email: user.email } });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
});

module.exports = router;