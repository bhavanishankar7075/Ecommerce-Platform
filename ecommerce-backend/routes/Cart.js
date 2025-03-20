const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate(
      'items.productId',
      'name price image'
    );
    if (!cart) {
      return res.json({ cart: { items: [] } });
    }
    console.log('Fetched cart response:', cart); // Debug the response
    res.json({ cart });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add a product to the cart
router.post('/add', auth, async (req, res) => {
  try {
    console.log('Add to cart request:', req.body);
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid product ID:', productId);
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image'
    );
    console.log('Populated cart response:', populatedCart); // Debug the response
    res.json({ message: 'Product added to cart', cart: populatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
});

// Remove an item from the cart
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: `Invalid item ID: ${itemId}` });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image'
    );
    console.log('Populated cart response after removal:', populatedCart); // Debug the response
    res.json({ message: 'Item removed from cart', cart: populatedCart || { items: [] } });
  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update item quantity
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: `Invalid item ID: ${itemId}` });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(cart.items[itemIndex].productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: `Cannot update quantity. Only ${product.stock} in stock.` });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image'
    );
    console.log('Populated cart response after update:', populatedCart); // Debug the response
    res.json({ message: 'Quantity updated', cart: populatedCart });
  } catch (err) {
    console.error('Error updating item quantity:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Clear the cart
router.delete('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.json({ message: 'Cart cleared', cart: { items: [] } });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: 'Cart cleared', cart: { items: [] } });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;































/* const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const Product = require('../models/Product');

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

// Get user's cart
router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart.items);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, total } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Validate each item and ensure product exists
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }
      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      total,
      status: 'Processing',
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});





// Add a product to the cart
router.post('/add', authenticate, async (req, res) => {
  try {
    console.log('Add to cart request:', req.body);
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid product ID:', productId);
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json({ message: 'Product added to cart', cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
});




// Remove an item from cart
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== id);
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update item quantity
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(item => item.productId.toString() === id);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (quantity > product.stock) {
      return res.status(400).json({ message: `Cannot update quantity. Only ${product.stock} in stock.` });
    }

    item.quantity = quantity;
    item.stock = product.stock; // Update stock in case it changed
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    console.error('Error updating item quantity:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json([]);
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; */















































/* const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

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

router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




router.post('/', authenticate, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: quantity || 1,
        image: product.image,
        stock: product.stock, // Ensure this is included
      });
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add items to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { items } = req.body; // Expecting items: [{ productId, quantity }, ...]
    const userId = req.user.id; // From authMiddleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    // Find or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Process each item
    for (const { productId, quantity } of items) {
      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Invalid productId or quantity' });
      }

      // Check if the product exists and has enough stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}. Only ${product.stock} available.` });
      }

      // Check if the item already exists in the cart
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        // Update quantity if the item exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          return res.status(400).json({ message: `Cannot add more of ${product.name}. Only ${product.stock} in stock.` });
        }
        existingItem.quantity = newQuantity;
      } else {
        // Add new item to the cart
        cart.items.push({
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          stock: product.stock,
        });
      }
    }
    // Save the cart
    await cart.save();
    res.status(200).json({ message: 'Items added to cart successfully', cart });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ message: 'Server error' });
  }
});





router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== id);
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(item => item.productId.toString() === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      await cart.save();
      res.json(cart.items);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; */








































/* // ecommerce-backend/routes/cart.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

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

router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: quantity || 1,
      });
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== id);
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(item => item.productId.toString() === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      await cart.save();
      res.json(cart.items);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router; */