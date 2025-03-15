import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Checkout.css';

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('checkoutForm')) || {};
    setFormData((prev) => ({ ...prev, ...savedData }));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (cart.length === 0) {
      setError('Your cart is empty. Redirecting to products...');
      setTimeout(() => navigate('/products'), 3000);
    }
  }, [cart, user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 8) * 100);
  }, [formData]);

  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);
  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const maxStock = item.stock || 10;
    if (newQuantity <= maxStock) {
      updateQuantity(item._id, newQuantity);
      setError('');
    } else {
      setError(`Cannot add more of ${item.name}. Only ${maxStock} in stock.`);
    }
  };

  const validateForm = () => {
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(formData.cardNumber)) {
      setError('Card number must be 16 digits');
      return false;
    }
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(formData.expiry)) {
      setError('Expiry must be in MM/YY format');
      return false;
    }
    const cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(formData.cvv)) {
      setError('CVV must be 3 digits');
      return false;
    }
    if (!formData.fullName.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim()) {
      setError('All shipping address fields must be filled');
      return false;
    }
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!validateForm()) return;
  
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      setError('Cannot place order: Your cart is empty');
      return;
    }
  
    for (const item of cart) {
      if (!item._id || !item.name || !item.quantity || !item.price) {
        setError(`Invalid cart item: Missing required fields (id, name, quantity, price)`);
        return;
      }
    }
  
    const orderFormData = new FormData();
    orderFormData.append('userId', user._id);
    orderFormData.append('total', total);
    orderFormData.append('items', JSON.stringify(cart.map(item => ({
      productId: item._id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      image: item.image || ''
    }))));
    orderFormData.append('shippingAddress', JSON.stringify({
      address: formData.address.trim(),
      fullName: formData.fullName.trim(),
      city: formData.city.trim(),
      postalCode: formData.postalCode.trim(),
      country: formData.country.trim()
    }));
    orderFormData.append('payment', `Card ending in ${formData.cardNumber.slice(-4)}`);
  
    console.log('FormData being sent:');
    for (let [key, value] of orderFormData.entries()) {
      console.log(`${key}: ${value}`);
    }
  
    try {
      setIsSubmitted(true);
      const token = localStorage.getItem('token');
      console.log('Submitting order - user._id:', user._id, 'token:', token);
      if (!token) {
        throw new Error('No token found');
      }
  
      const response = await axios.post('http://localhost:5001/api/orders', orderFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Order response:', response.data);
  
      setTimeout(() => {
        clearCart();
        localStorage.removeItem('checkoutForm');
        alert('Order placed successfully! Order ID: ' + response.data.orderId);
        navigate('/products');
      }, 2000);
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        console.log('Error details:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to place order');
      }
      setIsSubmitted(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="checkout-wrapper py-5">
      <div className="orbital-container">
        <h1 className="checkout-title">Cosmic Checkout</h1>

        <div className="progress-ring">
          <svg className="progress-circle" width="120" height="120">
            <circle className="progress-circle-bg" cx="60" cy="60" r="50" strokeWidth="10" />
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
          <div className="input-orbit">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              required
              className="form-input"
            />
          </div>
          <div className="input-orbit">
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="Postal Code"
              required
              className="form-input"
            />
          </div>
          <div className="input-orbit">
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Country"
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

        {isSubmitted && <div className="particle-burst"></div>}
      </div>
    </div>
  );
}

export default Checkout;