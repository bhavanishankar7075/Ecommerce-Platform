const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
      },
      name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
      },
      image: {
        type: String,
        trim: true,
      },
    },
  ],
  shippingAddress: {
    address: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    postalCode: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
  },
  payment: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Payment information is required'],
    validate: {
      validator: function (v) {
        if (typeof v === 'string') return true;
        if (v && typeof v.cardNumber === 'string' && typeof v.expiry === 'string') return true;
        if (v && typeof v.method === 'string') return true;
        return false;
      },
      message: 'Payment must be a string (e.g., "Cash on Delivery"), an object with cardNumber and expiry, or an object with a method field',
    },
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative'],
  },
  stripeSessionId: { type: String },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'], // Added 'Completed'
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` on save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);








































/* const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required:false,
      },
      name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
      },
      image: {
        type: String,
        trim: true,
      },
    },
  ],
  shippingAddress: {
    address: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    postalCode: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
  },
  payment: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Payment information is required'],
    validate: {
      validator: function (v) {
        // Allow string (e.g., "Cash on Delivery")
        if (typeof v === 'string') return true;
        // Allow object with cardNumber and expiry (for card payments)
        if (v && typeof v.cardNumber === 'string' && typeof v.expiry === 'string') return true;
        // Allow object with method (e.g., { method: "Cash on Delivery" })
        if (v && typeof v.method === 'string') return true;
        return false;
      },
      message: 'Payment must be a string (e.g., "Cash on Delivery"), an object with cardNumber and expiry, or an object with a method field',
    },
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative'],
  },
  stripeSessionId: { type: String },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` on save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema); */

























































/* const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
      },
      image: {
        type: String,
        trim: true,
      },
    },
  ],
  shippingAddress: {
    address: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  payment: {
    type: String,
    required: [true, 'Payment information is required'],
    trim: true,
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative'],
  },
  stripeSessionId: { type: String },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` on save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
 */





















































/*  const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
      },
      image: {
        type: String,
        trim: true,
      },
    },
  ],
  shippingAddress: {
    address: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  payment: {
    type: String,
    required: [true, 'Payment information is required'],
    trim: true,
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative'],
  },
  stripeSessionId: { type: String },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` on save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);   */