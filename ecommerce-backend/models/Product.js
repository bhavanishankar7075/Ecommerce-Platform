
const mongoose = require('mongoose');

// models/Product.js (hypothetical)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  offer: { type: String, default: '' },
  sizes: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  brand: { type: String },
  weight: { type: Number },
  model: { type: String },
  image: { type: String, required: true }, // This makes the image field mandatory
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
},{ timestamps: true });




module.exports = mongoose.model('Product', productSchema);











































/* // ecommerce-backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String }, // URL to the main image
  category: { type: String, default: 'Uncategorized' },
  featured: { type: Boolean, default: false },
  description: { type: String, default: '' },
  images: { type: [String], default: [] }, // Array of additional image URLs
  brand: { type: String, default: '' }, // New field
  weight: { type: Number, default: 0 }, // New field (in kg, for example)
  model: { type: String, default: '' }, // New field
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); */