// ecommerce-backend/routes/customer.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Public route to fetch products (no authentication needed)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;









































/* // ecommerce-backend/routes/customer.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products.map(product => ({
      id: product._id.toString(), // Convert MongoDB _id to string for frontend compatibility
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      description: product.description,
      specifications: product.specifications,
      images: product.images,
    })));
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: Add a route to get a single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      description: product.description,
      specifications: product.specifications,
      images: product.images,
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; */