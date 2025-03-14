/*  const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/Product');





// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const Admin = require('../models/Admin');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ message: 'Unauthorized: Admin not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Format product image URL
const formatProductImage = (product) => {
  if (product.image) {
    product.image = `http://localhost:5001${product.image}`;
  }
  return product;
};

// GET: Fetch all products
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    const formattedProducts = products.map(formatProductImage);
    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
  const {
    name, price, stock, category, description, specifications, brand, weight,
  } = req.body;

  try {
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description,
      specifications,
      brand,
      weight: weight ? parseFloat(weight) : null,
      image,
    });
    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    res.status(201).json({ message: 'Product added successfully', product: formattedProduct });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT: Update a product
router.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  const {
    name, price, stock, category, description, specifications, brand, weight,
  } = req.body;

  console.log('PUT Request Body:', req.body);
  console.log('Uploaded File:', req.file);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : product.image;

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.specifications = specifications !== undefined && specifications !== '' ? specifications : product.specifications;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.image = image;

    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE: Delete a product
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete the image file if it exists
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      console.log('Attempting to delete image:', imagePath);
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err.message);
        // Continue even if image deletion fails
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;  */ 


























// ecommerce-backend/routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/Product');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const Admin = require('../models/Admin');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ message: 'Unauthorized: Admin not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Format product image URL (updated to handle images array)
const formatProductImage = (product) => {
  if (product.image) {
    product.image = `http://localhost:5001${product.image}`;
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map(img => `http://localhost:5001${img}`);
  }
  return product;
};

// GET: Fetch all products
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    const formattedProducts = products.map(formatProductImage);
    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }, // Support up to 10 additional images
]), async (req, res) => {
  const {
    name, price, stock, category, description, featured, brand, weight, model
  } = req.body;

  try {
    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description,
      featured: featured === 'true', // Convert string to boolean
      brand,
      weight: weight ? parseFloat(weight) : null,
      model,
      image,
      images,
    });
    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    res.status(201).json({ message: 'Product added successfully', product: formattedProduct });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT: Update a product
router.put('/:id', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, featured, brand, weight, model
  } = req.body;

  console.log('PUT Request Body:', req.body);
  console.log('Uploaded Files:', req.files);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : product.image;
    let updatedImages = product.images;
    if (req.files['images']) {
      const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);
      updatedImages = [...product.images, ...newImages];
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.featured = featured !== undefined && featured !== '' ? featured === 'true' : product.featured;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.model = model !== undefined && model !== '' ? model : product.model;
    product.image = image;
    product.images = updatedImages;

    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE: Delete a product
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete the main image file if it exists
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      console.log('Attempting to delete image:', imagePath);
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err.message);
        // Continue even if image deletion fails
      }
    }

    // Delete additional images if they exist
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
          console.log('Attempting to delete additional image:', imagePath);
          try {
            await fs.access(imagePath);
            await fs.unlink(imagePath);
            console.log('Additional image deleted successfully:', imagePath);
          } catch (err) {
            console.error('Error deleting additional image:', err.message);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;





















































