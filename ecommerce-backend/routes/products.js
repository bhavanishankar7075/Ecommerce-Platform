const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

const storage = multer.memoryStorage(); // Use memory storage for Cloudinary upload
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
    cb(null, true);
  },
});

// Configure Cloudinary using only CLOUDINARY_URL
if (!process.env.CLOUDINARY_URL) {
  throw new Error('CLOUDINARY_URL environment variable is required');
}
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);
cloudinary.config({ url: process.env.CLOUDINARY_URL });

// Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const Admin = require('../models/admin');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin role required' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Format product image URL
const formatProductImage = (product) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  if (product.image) {
    if (!product.image.startsWith('http')) {
      product.image = product.image; // Cloudinary URLs are already full URLs
    }
  } else {
    product.image = `${baseUrl}/default-product.jpg`;
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map((img) => {
      if (img && !img.startsWith('http')) {
        return img; // Cloudinary URLs are already full URLs
      }
      return img || `${baseUrl}/default-product.jpg`;
    });
  } else {
    product.images = [];
  }
  return product;
};

// GET: Fetch all active products (public)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET: Fetch products for admin with filters
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
      limit = 10,
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
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (isNaN(min) || min < 0) return res.status(400).json({ message: 'Invalid priceMin value' });
        query.price.$gte = min;
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (isNaN(max) || max < 0) return res.status(400).json({ message: 'Invalid priceMax value' });
        query.price.$lte = max;
      }
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '', $ne: null };
      if (offer === 'noOffer') query.offer = { $in: ['', null] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid page or limit value' });
    }
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
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
    featured, brand, weight, weightUnit, model,
  } = req.body;

  try {
    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required' });
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    // Upload main image to Cloudinary
    const mainImageResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(req.files['image'][0].buffer);
    });
    const image = mainImageResult.secure_url;

    // Upload additional images to Cloudinary
    const images = req.files['images'] ? await Promise.all(
      req.files['images'].map(async (file) => {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
        return result.secure_url;
      })
    ) : [];

    const product = new Product({
      name,
      price: priceNum,
      stock: stockNum,
      category,
      description,
      offer: offer || '',
      sizes: parsedSizes,
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true' || featured === true,
      brand: brand || '',
      weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
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
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, weightUnit, model, existingImages,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const priceNum = price ? parseFloat(price) : product.price;
    const stockNum = stock ? parseInt(stock) : product.stock;
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = product.sizes;
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    let image = product.image;
    if (req.files['image']) {
      const mainImageResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.files['image'][0].buffer);
      });
      image = mainImageResult.secure_url;
    }

    let updatedImages = [...product.images];
    console.log('Received existingImages:', existingImages);
    if (existingImages) {
      try {
        const retainedImages = JSON.parse(existingImages);
        console.log('Parsed retainedImages:', retainedImages);
        updatedImages = retainedImages.length > 0 ? retainedImages : product.images;
      } catch (parseErr) {
        console.error('Error parsing existingImages:', parseErr.message);
        updatedImages = [...product.images];
      }
    }
    if (req.files['images']) {
      const newImages = await Promise.all(
        req.files['images'].map(async (file) => {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }).end(file.buffer);
          });
          return result.secure_url;
        })
      );
      updatedImages = [...updatedImages, ...newImages];
    }
    console.log('Final updatedImages:', updatedImages);

    product.name = name || product.name;
    product.price = priceNum;
    product.stock = stockNum;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = parsedSizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true' || featured === true) : product.featured;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.weightUnit = weightUnit || product.weightUnit || 'kg';
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

    // No local file cleanup needed since images are on Cloudinary
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








































/*  const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/Product');

// Multer setup for image uploads with validation
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
    cb(null, true);
  },
});

// Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const Admin = require('../models/admin');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin role required' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Format product image URL
const formatProductImage = (product) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  if (product.image) {
    if (!product.image.startsWith('http')) {
      product.image = `${baseUrl}${product.image}`;
    }
  } else {
    product.image = `${baseUrl}/default-product.jpg`;
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map((img) => {
      if (img && !img.startsWith('http')) {
        return `${baseUrl}${img}`;
      }
      return img || `${baseUrl}/default-product.jpg`;
    });
  } else {
    product.images = [];
  }
  return product;
};

// GET: Fetch all active products (public)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET: Fetch products for admin with filters
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
      limit = 10,
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
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (isNaN(min) || min < 0) return res.status(400).json({ message: 'Invalid priceMin value' });
        query.price.$gte = min;
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (isNaN(max) || max < 0) return res.status(400).json({ message: 'Invalid priceMax value' });
        query.price.$lte = max;
      }
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '', $ne: null };
      if (offer === 'noOffer') query.offer = { $in: ['', null] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid page or limit value' });
    }
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
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
    featured, brand, weight, weightUnit, model,
  } = req.body;

  try {
    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required' });
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    const image = `/uploads/${req.files['image'][0].filename}`;
    const images = req.files['images'] ? req.files['images'].map((file) => `/uploads/${file.filename}`) : [];

    const product = new Product({
      name,
      price: priceNum,
      stock: stockNum,
      category,
      description,
      offer: offer || '',
      sizes: parsedSizes,
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true' || featured === true,
      brand: brand || '',
      weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
      image,
      images,
    });

    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    res.status(201).json({ message: 'Product added successfully', product: formattedProduct });
  } catch (err) {
    console.error('Add Product Error:', err);
    // Clean up uploaded files on failure
    if (req.files['image']) {
      const imagePath = path.join(__dirname, '..', `/uploads/${req.files['image'][0].filename}`);
      try {
        await fs.unlink(imagePath);
      } catch (deleteErr) {
        console.error('Failed to clean up main image:', deleteErr.message);
      }
    }
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const imagePath = path.join(__dirname, '..', `/uploads/${file.filename}`);
        try {
          await fs.unlink(imagePath);
        } catch (deleteErr) {
          console.error('Failed to clean up additional image:', deleteErr.message);
        }
      }
    }
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
    featured, brand, weight, weightUnit, model, existingImages,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const priceNum = price ? parseFloat(price) : product.price;
    const stockNum = stock ? parseInt(stock) : product.stock;
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = product.sizes;
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    let image = product.image;
    const oldImage = product.image;
    if (req.files['image']) {
      if (oldImage && oldImage.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', oldImage);
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
          console.log('Old main image deleted:', oldImagePath);
        } catch (err) {
          console.error('Error deleting old main image:', err.message);
        }
      }
      image = `/uploads/${req.files['image'][0].filename}`;
    }

    let updatedImages = product.images || [];
    const oldImages = [...product.images];
    if (existingImages) {
      const newImagesList = JSON.parse(existingImages).map((img) =>
        img.startsWith('http://localhost:5001') ? img.replace('http://localhost:5001', '') : img
      );
      const imagesToRemove = oldImages.filter((img) => !newImagesList.includes(img));
      for (const img of imagesToRemove) {
        if (img && img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
          try {
            await fs.access(imagePath);
            await fs.unlink(imagePath);
            console.log('Removed image deleted:', imagePath);
          } catch (err) {
            console.error('Error deleting removed image:', err.message);
          }
        }
      }
      updatedImages = newImagesList;
    }
    if (req.files['images']) {
      const newImages = req.files['images'].map((file) => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    product.name = name || product.name;
    product.price = priceNum;
    product.stock = stockNum;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = parsedSizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true' || featured === true) : product.featured;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.weightUnit = weightUnit || product.weightUnit || 'kg';
    product.model = model !== undefined && model !== '' ? model : product.model;
    product.image = image;
    product.images = updatedImages;

    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Update Product Error:', err);
    // Clean up new files on failure
    if (req.files['image']) {
      const newImagePath = path.join(__dirname, '..', `/uploads/${req.files['image'][0].filename}`);
      try {
        await fs.unlink(newImagePath);
      } catch (deleteErr) {
        console.error('Failed to clean up new main image:', deleteErr.message);
      }
    }
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const imagePath = path.join(__dirname, '..', `/uploads/${file.filename}`);
        try {
          await fs.unlink(imagePath);
        } catch (deleteErr) {
          console.error('Failed to clean up new additional image:', deleteErr.message);
        }
      }
    }
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
        console.log('Main image deleted:', imagePath);
      } catch (err) {
        console.error('Error deleting main image:', err.message);
      }
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', img);
          try {
            await fs.access(imagePath);
            await fs.unlink(imagePath);
            console.log('Additional image deleted:', imagePath);
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

module.exports = router;  */
























/*
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
    const Admin = require('../models/admin');
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
*/
 



























































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





















































