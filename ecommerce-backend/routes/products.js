const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyAdmin = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Format product images (simplified post-migration)
const formatProductImage = (product) => {
  const placeholderImage = 'https://via.placeholder.com/150';
  const formattedProduct = { ...product };

  if (!formattedProduct.image || !formattedProduct.image.startsWith('http')) {
    console.log(`Invalid main image for product ${formattedProduct.name}: ${formattedProduct.image}`);
    formattedProduct.image = placeholderImage;
  }

  if (formattedProduct.images && Array.isArray(formattedProduct.images)) {
    formattedProduct.images = formattedProduct.images.map(img => {
      if (!img || !img.startsWith('http')) {
        console.log(`Invalid additional image for product ${formattedProduct.name}: ${img}`);
        return placeholderImage;
      }
      return img;
    });
  } else {
    formattedProduct.images = [];
  }

  return formattedProduct;
};

// GET /api/products - Fetch all active products for frontend
router.get('/', async (req, res) => {
  try {
    console.log('Fetching products for frontend');
    const products = await Product.find({ isActive: true });
    const formattedProducts = products.map(product => formatProductImage(product.toObject()));
    res.status(200).json(formattedProducts);
  } catch (err) {
    console.error('Error fetching products for frontend:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/products - Fetch products for admin
router.get('/', verifyAdmin, async (req, res) => {
  try {
    console.log('Fetching products for admin');
    const { search, category, priceMin, priceMax, stock, offer, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin) {
      query.price = { ...query.price, $gte: parseFloat(priceMin) };
    }
    if (priceMax) {
      query.price = { ...query.price, $lte: parseFloat(priceMax) };
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 5 };
      if (stock === 'lowStock') query.stock = { $gte: 1, $lte: 5 };
      if (stock === 'outOfStock') query.stock = 0;
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '' };
      if (offer === 'noOffer') query.offer = '';
    }

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const formattedProducts = products.map(product => formatProductImage(product.toObject()));

    res.status(200).json({
      products: formattedProducts,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching products for admin:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/products - Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  try {
    console.log('Starting POST /api/admin/products');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const {
      name, price, category, stock, description, offer, sizes, isActive, brand, weight, weightUnit, model,
    } = req.body;

    if (!name || !price || !category || !stock || !description) {
      console.log('Missing required fields:', { name, price, category, stock, description });
      return res.status(400).json({ message: 'Missing required fields: name, price, category, stock, or description' });
    }

    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    if (!mainImageFile) {
      console.log('Main image missing');
      return res.status(400).json({ message: 'Main image is required' });
    }

    console.log('Uploading main image to Cloudinary...');
    let mainImageUrl;
    try {
      const mainImageResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(mainImageFile.buffer);
      });
      mainImageUrl = mainImageResult.secure_url;
      console.log('Main image uploaded:', mainImageUrl);
    } catch (uploadError) {
      console.error('Cloudinary Main Image Upload Error:', uploadError.message, uploadError.stack);
      return res.status(500).json({ message: 'Failed to upload main image to Cloudinary', error: uploadError.message });
    }

    console.log('Processing additional images...');
    const additionalImageFiles = req.files && req.files['images'] ? req.files['images'] : [];
    const uniqueAdditionalImages = [];
    const seenUrls = new Set();
    for (const file of additionalImageFiles) {
      console.log('Uploading additional image to Cloudinary:', file.originalname);
      try {
        const imageResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'products' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
        const imageUrl = imageResult.secure_url;
        console.log('Additional image uploaded:', imageUrl);
        if (!seenUrls.has(imageUrl)) {
          seenUrls.add(imageUrl);
          uniqueAdditionalImages.push(imageUrl);
        }
      } catch (uploadError) {
        console.error('Cloudinary Additional Image Upload Error:', uploadError.message, uploadError.stack);
        return res.status(500).json({ message: `Failed to upload additional image ${file.originalname} to Cloudinary`, error: uploadError.message });
      }
    }

    console.log('Creating new product...');
    const product = new Product({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      description,
      image: mainImageUrl,
      images: uniqueAdditionalImages,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      brand: brand || '',
      weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
    });

    console.log('Saving product to database...');
    try {
      const savedProduct = await product.save();
      console.log('Product saved:', savedProduct);
      const formattedProduct = formatProductImage(savedProduct.toObject());
      res.status(201).json({ message: 'Product added successfully', product: formattedProduct });
    } catch (dbError) {
      console.error('Database Save Error:', dbError.message, dbError.stack);
      res.status(500).json({ message: 'Failed to save product to database', error: dbError.message });
    }
  } catch (err) {
    console.error('Add Product Error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/products/:id - Update a product
router.put('/:id', verifyAdmin, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  try {
    console.log(`Starting PUT /api/admin/products/${req.params.id}`);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name, price, category, stock, description, offer, sizes, isActive, brand, weight, weightUnit, model, existingImages,
    } = req.body;

    if (!name || !price || !category || !stock || !description) {
      return res.status(400).json({ message: 'Missing required fields: name, price, category, stock, or description' });
    }

    let mainImageUrl = product.image;
    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    if (mainImageFile) {
      console.log('Uploading new main image to Cloudinary...');
      try {
        const mainImageResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'products' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(mainImageFile.buffer);
        });
        mainImageUrl = mainImageResult.secure_url;
        console.log('New main image uploaded:', mainImageUrl);
      } catch (uploadError) {
        console.error('Cloudinary Main Image Upload Error:', uploadError.message, uploadError.stack);
        return res.status(500).json({ message: 'Failed to upload main image to Cloudinary', error: uploadError.message });
      }
    }

    let additionalImages = existingImages ? JSON.parse(existingImages) : product.images || [];
    const additionalImageFiles = req.files && req.files['images'] ? req.files['images'] : [];
    const seenUrls = new Set(additionalImages);
    for (const file of additionalImageFiles) {
      console.log('Uploading new additional image to Cloudinary:', file.originalname);
      try {
        const imageResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'products' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
        const imageUrl = imageResult.secure_url;
        console.log('New additional image uploaded:', imageUrl);
        if (!seenUrls.has(imageUrl)) {
          seenUrls.add(imageUrl);
          additionalImages.push(imageUrl);
        }
      } catch (uploadError) {
        console.error('Cloudinary Additional Image Upload Error:', uploadError.message, uploadError.stack);
        return res.status(500).json({ message: `Failed to upload additional image ${file.originalname} to Cloudinary`, error: uploadError.message });
      }
    }

    product.name = name;
    product.price = parseFloat(price);
    product.category = category;
    product.stock = parseInt(stock);
    product.description = description;
    product.image = mainImageUrl;
    product.images = additionalImages;
    product.offer = offer || '';
    product.sizes = sizes ? JSON.parse(sizes) : [];
    product.isActive = isActive === 'true' || isActive === true;
    product.brand = brand || '';
    product.weight = weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null;
    product.weightUnit = weightUnit || 'kg';
    product.model = model || '';

    console.log('Saving updated product to database...');
    const updatedProduct = await product.save();
    console.log('Product updated:', updatedProduct);
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.status(200).json({ message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Update Product Error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/products/:id - Delete a product
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    console.log(`Deleting product with ID: ${req.params.id}`);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product deleted:', product);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/products/:id/toggle-status - Toggle product status
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    console.log(`Toggling status for product with ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    console.log('Product status updated:', updatedProduct);
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.status(200).json({ message: 'Product status updated', product: formattedProduct });
  } catch (err) {
    console.error('Toggle Status Error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
























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

module.exports = router; */
 



























































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





















































