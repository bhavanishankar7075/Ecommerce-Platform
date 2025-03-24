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

// Format product image URL
const formatProductImage = (product) => {
  const baseUrl = 'http://localhost:5001';
  if (product.image) {
    // Only prepend the base URL if the image path doesn't already start with it
    if (!product.image.startsWith(baseUrl)) {
      product.image = `${baseUrl}${product.image}`;
    }
  } else {
    product.image = 'http://localhost:5002/default-product.jpg';
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map(img => {
      if (img) {
        // Only prepend the base URL if the image path doesn't already start with it
        if (!img.startsWith(baseUrl)) {
          return `${baseUrl}${img}`;
        }
        return img;
      }
      return 'http://localhost:5002/default-product.jpg';
    });
  } else {
    product.images = [];
  }
  return product;
};

// GET: Fetch all products
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      priceMin = '',
      priceMax = '',
      stock = '',
      offer = '',
      page = 1,
      limit = 8,
    } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '' };
      if (offer === 'noOffer') query.offer = { $eq: '' };
    }

    console.log('Backend query for fetching products:', query);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log('Fetched products from DB:', products);

    const formattedProducts = products.map(formatProductImage);
    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, weightUnit, model
  } = req.body;

  try {
    console.log('Received files:', req.files);

    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required when adding a new product' });
    }

    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true',
      brand,
      weight: weight ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model,
      image,
      images,
    });

    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    console.log('Saved product:', formattedProduct);
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
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, weightUnit, model, existingImages
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let image = product.image;
    if (req.files['image']) {
      if (product.image && product.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
          console.log('Old image deleted successfully:', oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err.message);
        }
      }
      image = `/uploads/${req.files['image'][0].filename}`;
    }

    let updatedImages = product.images || [];
    console.log('Existing images from frontend:', existingImages);
    console.log('Current product images before update:', updatedImages);

    if (existingImages) {
      const newImagesList = JSON.parse(existingImages);
      // Remove the base URL from existing images if present
      const cleanedImagesList = newImagesList.map(img => {
        if (img.startsWith('http://localhost:5001')) {
          return img.replace('http://localhost:5001', '');
        }
        return img;
      });
      const imagesToRemove = updatedImages.filter(img => !cleanedImagesList.includes(img));
      for (const img of imagesToRemove) {
        if (img && img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
          try {
            await fs.access(imagePath);
            await fs.unlink(imagePath);
            console.log('Removed image deleted successfully:', imagePath);
          } catch (err) {
            console.error('Error deleting removed image:', err.message);
          }
        }
      }
      updatedImages = cleanedImagesList;
    }

    if (req.files['images']) {
      const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    console.log('Updated images after processing:', updatedImages);

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true') : product.featured;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.weightUnit = weightUnit || product.weightUnit || 'kg';
    product.model = model !== undefined && model !== '' ? model : product.model;
    product.image = image;
    product.images = updatedImages;

    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    console.log('Formatted product after update:', formattedProduct);
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

    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err.message);
      }
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
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

// PUT: Toggle product status
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product status updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Toggle Product Status Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;




























































/* // routes/products.js
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

// Format product image URL
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
    const {
      search = '',
      category = '',
      priceMin = '',
      priceMax = '',
      stock = '',
      offer = '',
      page = 1,
      limit = 8,
    } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '' };
      if (offer === 'noOffer') query.offer = { $eq: '' };
    }

    console.log('Backend query for fetching products:', query);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(limitNum);

    console.log('Fetched products from DB:', products);

    const formattedProducts = products.map(formatProductImage);
    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, model
  } = req.body;

  try {
    console.log('Received files:', req.files);

    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required when adding a new product' });
    }

    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true',
      brand,
      weight: weight ? parseFloat(weight) : null,
      model,
      image,
      images,
    });

    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    console.log('Saved product:', formattedProduct);
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
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, model
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let image = product.image;
    if (req.files['image']) {
      if (product.image && product.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
          console.log('Old image deleted successfully:', oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err.message);
        }
      }
      image = `/uploads/${req.files['image'][0].filename}`;
    }

    let updatedImages = product.images || [];
    if (req.files['images']) {
      const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true') : product.featured;
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

    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err.message);
      }
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
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

// PUT: Toggle product status
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product status updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Toggle Product Status Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; */





























































/* 

// routes/products.js
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

// Format product image URL
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
    const {
      search = '',
      category = '',
      priceMin = '',
      priceMax = '',
      stock = '',
      offer = '',
      page = 1,
      limit = 8,
    } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '' };
      if (offer === 'noOffer') query.offer = { $eq: '' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map(formatProductImage);
    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, model
  } = req.body;

  try {
    // Log the received files for debugging
    console.log('Received files:', req.files);

    // Validate that an image is provided when adding a new product
    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required when adding a new product' });
    }

    const image = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true',
      brand,
      weight: weight ? parseFloat(weight) : null,
      model,
      image,
      images,
    });

    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    console.log('Saved product:', formattedProduct); // Log the saved product
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
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, model
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let image = product.image;
    if (req.files['image']) {
      if (product.image && product.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', product.image);
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
          console.log('Old image deleted successfully:', oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err.message);
        }
      }
      image = `/uploads/${req.files['image'][0].filename}`;
    }

    let updatedImages = product.images || [];
    if (req.files['images']) {
      const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true') : product.featured;
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

    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err.message);
      }
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
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

// PUT: Toggle product status
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product status updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Toggle Product Status Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; */















































/* 
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






module.exports = router; */





















































