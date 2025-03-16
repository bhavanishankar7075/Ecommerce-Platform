















































 // ecommerce-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

 const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true,lowercase: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  address: { type: String }, // Primary address
  avatar: { type: String }, // URL to avatar image
  addresses: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      address: { type: String, required: true },
    },
  ],
  paymentMethods: [
    { 
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      cardNumber: { type: String, required: true },
      expiry: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
  role: { type: String, enum: ['user', 'admin','customer'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
}); 





userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
 





























/* // ecommerce-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // Add admin flag
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema); */