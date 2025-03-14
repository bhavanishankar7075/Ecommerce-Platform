// ecommerce-backend/models/Order.js
const mongoose = require('mongoose');

/* const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId,ref: 'User', required: true }, // Dummy userId for now
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
 
     name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String },
    },
  ],
  total: { type: Number, required: true },
  shipping: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
  },
  payment: {
    cardNumber: { type: String, required: true },
    expiry: { type: String, required: true },
    cvv: { type: String, required: true },
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now },
});
 */


const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      image: { type: String },
    },
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  payment: { type: String },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);