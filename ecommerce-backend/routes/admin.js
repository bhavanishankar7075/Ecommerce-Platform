const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized: Admin not found' });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    req.user = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, isAdmin: admin.isAdmin || false }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin dashboard (example)
router.get('/dashboard', verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard', admin: req.user });
});

// Export router and verifyAdmin
module.exports = { router, verifyAdmin };

































































































/* const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};




// Admin login 
  router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}); 

// Admin dashboard (example)
router.get('/dashboard', verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard', admin: req.admin });
});

module.exports = router; */





















































































/* // Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ message: 'Unauthorized: Admin not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
}; */