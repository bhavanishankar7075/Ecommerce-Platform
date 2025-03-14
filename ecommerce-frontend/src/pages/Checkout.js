// ecommerce-frontend/src/pages/Checkout.js
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Checkout.css';

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Load form data from local storage on mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('checkoutForm')) || {};
    setFormData((prev) => ({ ...prev, ...savedData }));
  }, []);

  // Redirect to products if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      setTimeout(() => navigate('/products'), 3000);
    }
  }, [cart, navigate]);

  // Save form data to local storage and update progress
  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 5) * 100); // 5 fields total
  }, [formData]);

  // Calculate total in real-time
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);
  const deliveryFee = 5.00; // Consistent with Cart.js
  const total = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return; // Prevent quantity from going below 1
    const maxStock = item.stock || 0;
    if (newQuantity <= maxStock) {
      updateQuantity(item._id, newQuantity);
      setError('');
    } else {
      setError(`Cannot add more of ${item.name}. Only ${maxStock} in stock.`);
    }
  };

  const validateForm = () => {
    // Basic card number validation (16 digits)
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(formData.cardNumber)) {
      setError('Card number must be 16 digits');
      return false;
    }
    // Expiry validation (MM/YY format)
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(formData.expiry)) {
      setError('Expiry must be in MM/YY format');
      return false;
    }
    // CVV validation (3 digits)
    const cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(formData.cvv)) {
      setError('CVV must be 3 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) return;

    // Prepare order data
    const orderData = {
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        image: item.image,
      })),
      shipping: {
        fullName: formData.fullName,
        address: formData.address,
      },
      payment: {
        cardNumber: formData.cardNumber,
        expiry: formData.expiry,
        cvv: formData.cvv,
      },
      total,
    };

    try {
      setIsSubmitted(true);
      // Submit order to backend
      const response = await axios.post('http://localhost:5001/api/orders', orderData);
      console.log('Order response:', response.data);

      // Clear cart and form data
      setTimeout(() => {
        clearCart();
        localStorage.removeItem('checkoutForm');
        alert('Order placed successfully! Order ID: ' + response.data.orderId);
        navigate('/products');
      }, 2000); // Delay for animation
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Failed to place order');
      setIsSubmitted(false);
    }
  };

  return (
    <div className="checkout-wrapper py-5">
      <div className="orbital-container">
        <h1 className="checkout-title">Cosmic Checkout</h1>

        {/* Progress Ring */}
        <div className="progress-ring">
          <svg className="progress-circle" width="120" height="120">
            <circle
              className="progress-circle-bg"
              cx="60"
              cy="60"
              r="50"
              strokeWidth="10"
            />
            <circle
              className="progress-circle-fill"
              cx="60"
              cy="60"
              r="50"
              strokeWidth="10"
              style={{ strokeDashoffset: `${314 - (314 * progress) / 100}` }}
            />
          </svg>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        {/* Cart Orbit */}
        <div className="cart-orbit">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item._id} className="cart-planet">
                <img
                  src={item.image || ''}
                  alt={item.name}
                  className="planet-img"
                  onError={(e) => {
                    console.log(`Failed to load image for ${item.name}: ${item.image}`);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="planet-info">
                  <p>{item.name}</p>
                  <p>₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(item, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item, item.quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-cart">Your cart is a void! Redirecting to products...</p>
          )}
        </div>

        {/* Form Nebula */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h3 className="form-section">Shipping Nebula</h3>
          <div className="input-orbit">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
              className="form-input"
            />
          </div>
          <div className="input-orbit">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Address"
              required
              className="form-input"
            />
          </div>

          <h3 className="form-section">Payment Galaxy</h3>
          <div className="input-orbit">
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="Card Number"
              required
              className="form-input"
            />
          </div>
          <div className="input-orbit dual-orbit">
            <input
              type="text"
              name="expiry"
              value={formData.expiry}
              onChange={handleInputChange}
              placeholder="Expiry (MM/YY)"
              required
              className="form-input half"
            />
            <input
              type="text"
              name="cvv"
              value={formData.cvv}
              onChange={handleInputChange}
              placeholder="CVV"
              required
              className="form-input half"
            />
          </div>

          {/* Total and Submit */}
          <div className="total-pod">
            <strong>Subtotal: ₹{subtotal.toFixed(2)}</strong>
            <br />
            <strong>Delivery Fee: ₹{deliveryFee.toFixed(2)}</strong>
            <br />
            <strong>Total: ₹{total.toFixed(2)}</strong>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-btn" disabled={cart.length === 0 || isSubmitted}>
            {isSubmitted ? 'Launching...' : 'Launch Order'}
          </button>
        </form>

        {/* Submission Animation */}
        {isSubmitted && <div className="particle-burst"></div>}
      </div>
    </div>
  );
}

export default Checkout;