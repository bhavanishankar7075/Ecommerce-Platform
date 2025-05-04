const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  category: { type: String, required: true }, // Now stores the full path, e.g., "Fashion/Men/Top Wear"
  description: { type: String },
  offer: { type: String },
  sizes: [String],
  seller: { type: String },
  specifications: { type: Object, default: {} },
  warranty: { type: String },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  dealTag: { type: String },
  brand: { type: String },
  weight: { type: Number, default: null },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String },
  image: { type: String, required: true },
  images: [String],
  variants: [
    {
      variantId: { type: String, required: true },
      mainImage: { type: String },
      additionalImages: [String],
      specifications: { type: Object, default: {} },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Remove subcategory and nestedCategory fields
module.exports = mongoose.model('Product', productSchema);



























/* const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  nestedCategory: { type: String },
  description: { type: String },
  offer: { type: String },
  sizes: [String],
  seller: { type: String },
  specifications: { type: Object, default: {} }, // Changed to accept object with string values
  warranty: { type: String },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  dealTag: { type: String },
  brand: { type: String },
  weight: { type: Number, default: null },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String },
  image: { type: String, required: true },
  images: [String],
  variants: [
    {
      variantId: { type: String, required: true },
      mainImage: { type: String },
      additionalImages: [String],
      specifications: { type: Object, default: {} },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema); */































































///main
/* const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Now only Cloudinary URLs
  images: [{ type: String }], // Now only Cloudinary URLs
  offer: { type: String, default: '' },
  sizes: [{ type: String }],
  isActive: { type: Boolean, default: true },
  brand: { type: String, default: '' },
  weight: { type: Number },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String, default: '' },
createdAt: { type: Date, default: Date.now }
},{timestamps: true});

module.exports = mongoose.model('Product', productSchema);
 */



















/* 
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
  weight: { type: Number,default: null },
  weightUnit: { type: String, default: 'kg' },
  model: { type: String },
  image: { type: String, required: true }, // This makes the image field mandatory
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
},{ timestamps: true });



module.exports = mongoose.model('Product', productSchema); */











































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