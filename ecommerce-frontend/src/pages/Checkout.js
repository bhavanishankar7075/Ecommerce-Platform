import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutItem from '../pages/CheckoutItem';
import '../styles/Checkout.css';

const stripePromise = loadStripe('pk_test_51PwKUJL4Eh51qnT6VIIEEXuLQQEuAcdbPOXFH36DIQ10wlSmntvODebkaUkfpm3Yn18GKUevcRYbBcHQ1IaOBX6200DmcOugdB');

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal: passedSubtotal, discount: passedDiscount, total: passedTotal } = location.state || {};

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);

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
    } else if (user) {
      fetchPaymentMethods();
    }
  }, [cart, user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 7) * 100);
  }, [formData]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('http://localhost:5001/api/users/profile/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.paymentMethods.length > 0) {
        setSelectedPaymentMethod(res.data.paymentMethods[0]._id);
        setShowNewPaymentForm(false);
      } else {
        setSelectedPaymentMethod('new');
        setShowNewPaymentForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
    }
  };

  // Update subtotal calculation to use item.productId.price
  const subtotal = passedSubtotal || cart.reduce((sum, item) => sum + (Number(item.productId?.price) || 0) * item.quantity, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const total = passedTotal || (discountedSubtotal + deliveryFee);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const maxStock = item.productId?.stock || 10; // Use item.productId.stock
    if (newQuantity <= maxStock) {
      updateQuantity(item._id, newQuantity);
      setError('');
    } else {
      setError(`Cannot add more of ${item.productId?.name || 'this item'}. Only ${maxStock} in stock.`);
    }
  };

  const validateForm = () => {
    if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim() || !formData.phoneNumber.trim()) {
      setError('All shipping address fields, including phone number, must be filled');
      return false;
    }
    if (selectedPaymentMethod === 'new') {
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
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value);
    setShowNewPaymentForm(value === 'new');
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
      if (!item._id || !item.productId?._id || !item.productId?.name || !item.quantity || !item.productId?.price || !item.productId?.image) {
        setError(`Invalid cart item: Missing required fields (id, name, quantity, price, image)`);
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      navigate('/login');
      return;
    }

    console.log('User from AuthContext:', user);
    if (!user || !user._id) {
      setError('User not authenticated. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitted(true);

      if (selectedPaymentMethod === 'cod') {
        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item.productId._id, // Use item.productId._id
            name: item.productId.name,
            quantity: item.quantity,
            price: Number(item.productId.price),
            image: item.productId.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          payment: 'Cash on Delivery',
          total,
        };

        console.log('COD order data:', orderData);

        const response = await axios.post('http://localhost:5001/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('COD Order response:', response.data);

        setTimeout(() => {
          clearCart();
          localStorage.removeItem('checkoutForm');
          alert('Order placed successfully! Order ID: ' + response.data.orderId);
          navigate(`/success?session_id=cod-${response.data.orderId}`);
          navigate('/products');
        }, 2000);
      } else {
        const stripe = await stripePromise;

        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item.productId._id, // Use item.productId._id
            name: item.productId.name,
            price: Math.round(Number(item.productId.price) * 100),
            quantity: item.quantity,
            image: item.productId.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total: Math.round(total * 100),
          paymentMethod: selectedPaymentMethod === 'new' ? 'stripe' : 'saved',
          cardDetails: selectedPaymentMethod === 'new'
            ? {
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                cvv: formData.cvv,
              }
            : paymentMethods.find(method => method._id === selectedPaymentMethod),
        };

        console.log('Stripe order data:', orderData);

        const response = await axios.post('http://localhost:5001/api/checkout', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Stripe session response:', response.data);

        const { sessionId } = response.data;
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          console.error('Stripe redirect error:', result.error.message);
          navigate('/failure');
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        setError(err.response.data.message || 'Failed to place order');
      } else {
        setError('An unexpected error occurred');
      }
      setIsSubmitted(false);
      navigate('/failure');
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
              <CheckoutItem
                key={item._id}
                item={item}
                handleQuantityChange={handleQuantityChange}
              />
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
          <div className="input-orbit">
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Phone Number (10 digits)"
              required
              className="form-input"
            />
          </div>

          <h3 className="form-section">Payment Galaxy</h3>
          <div className="input-orbit">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
              className="form-input"
            >
              {paymentMethods.length > 0 &&
                paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                  </option>
                ))}
              <option value="new">Add New Card (Online Payment)</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {showNewPaymentForm && (
            <>
              <div className="input-orbit">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Card Number (16 digits)"
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
                  placeholder="CVV (3 digits)"
                  required
                  className="form-input half"
                />
              </div>
            </>
          )}

          <div className="total-pod">
            <strong>Subtotal: ₹{subtotal.toFixed(2)}</strong>
            {passedDiscount > 0 && (
              <p>Discount ({(passedDiscount * 100).toFixed(0)}%): -₹{(subtotal * passedDiscount).toFixed(2)}</p>
            )}
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


















































































/* import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutItem from '../pages/CheckoutItem'; // Import the new component
import '../styles/Checkout.css';

const stripePromise = loadStripe('pk_test_51PwKUJL4Eh51qnT6VIIEEXuLQQEuAcdbPOXFH36DIQ10wlSmntvODebkaUkfpm3Yn18GKUevcRYbBcHQ1IaOBX6200DmcOugdB');

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal: passedSubtotal, discount: passedDiscount, total: passedTotal } = location.state || {};

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);

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
    } else if (user) {
      fetchPaymentMethods();
    }
  }, [cart, user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 7) * 100);
  }, [formData]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('http://localhost:5001/api/users/profile/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.paymentMethods.length > 0) {
        setSelectedPaymentMethod(res.data.paymentMethods[0]._id);
        setShowNewPaymentForm(false);
      } else {
        setSelectedPaymentMethod('new');
        setShowNewPaymentForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
    }
  };

  const subtotal = passedSubtotal || cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const total = passedTotal || (discountedSubtotal + deliveryFee);

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
    if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim() || !formData.phoneNumber.trim()) {
      setError('All shipping address fields, including phone number, must be filled');
      return false;
    }
    if (selectedPaymentMethod === 'new') {
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
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value);
    setShowNewPaymentForm(value === 'new');
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
      if (!item._id || !item.name || !item.quantity || !item.price || !item.image) {
        setError(`Invalid cart item: Missing required fields (id, name, quantity, price, image)`);
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      navigate('/login');
      return;
    }

    console.log('User from AuthContext:', user);
    if (!user || !user._id) {
      setError('User not authenticated. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitted(true);

      if (selectedPaymentMethod === 'cod') {
        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          payment: 'Cash on Delivery',
          total,
        };

        console.log('COD order data:', orderData);

        const response = await axios.post('http://localhost:5001/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('COD Order response:', response.data);

        setTimeout(() => {
          clearCart();
          localStorage.removeItem('checkoutForm');
          alert('Order placed successfully! Order ID: ' + response.data.orderId);
          navigate(`/success?session_id=cod-${response.data.orderId}`);
          navigate('/products');
        }, 2000);
      } else {
        const stripe = await stripePromise;

        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            price: Math.round(Number(item.price) * 100),
            quantity: item.quantity,
            image: item.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total: Math.round(total * 100),
          paymentMethod: selectedPaymentMethod === 'new' ? 'stripe' : 'saved',
          cardDetails: selectedPaymentMethod === 'new'
            ? {
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                cvv: formData.cvv,
              }
            : paymentMethods.find(method => method._id === selectedPaymentMethod),
        };

        console.log('Stripe order data:', orderData);

        const response = await axios.post('http://localhost:5001/api/checkout', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Stripe session response:', response.data);

        const { sessionId } = response.data;
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          console.error('Stripe redirect error:', result.error.message);
          navigate('/failure');
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        setError(err.response.data.message || 'Failed to place order');
      } else {
        setError('An unexpected error occurred');
      }
      setIsSubmitted(false);
      navigate('/failure');
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
              <CheckoutItem
                key={item._id}
                item={item}
                handleQuantityChange={handleQuantityChange}
              />
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
          <div className="input-orbit">
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Phone Number (10 digits)"
              required
              className="form-input"
            />
          </div>

          <h3 className="form-section">Payment Galaxy</h3>
          <div className="input-orbit">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
              className="form-input"
            >
              {paymentMethods.length > 0 &&
                paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                  </option>
                ))}
              <option value="new">Add New Card (Online Payment)</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {showNewPaymentForm && (
            <>
              <div className="input-orbit">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Card Number (16 digits)"
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
                  placeholder="CVV (3 digits)"
                  required
                  className="form-input half"
                />
              </div>
            </>
          )}

          <div className="total-pod">
            <strong>Subtotal: ₹{subtotal.toFixed(2)}</strong>
            {passedDiscount > 0 && (
              <p>Discount ({(passedDiscount * 100).toFixed(0)}%): -₹{(subtotal * passedDiscount).toFixed(2)}</p>
            )}
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

export default Checkout; */






























































/* import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/Checkout.css';


const stripePromise = loadStripe('pk_test_51PwKUJL4Eh51qnT6VIIEEXuLQQEuAcdbPOXFH36DIQ10wlSmntvODebkaUkfpm3Yn18GKUevcRYbBcHQ1IaOBX6200DmcOugdB'); // Replace with your actual key

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal: passedSubtotal, discount: passedDiscount, total: passedTotal } = location.state || {};

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);

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
    } else if (user) {
      fetchPaymentMethods();
    }
  }, [cart, user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 7) * 100); // Updated to 7 fields (removed fullName)
  }, [formData]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('http://localhost:5001/api/users/profile/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.paymentMethods.length > 0) {
        setSelectedPaymentMethod(res.data.paymentMethods[0]._id);
        setShowNewPaymentForm(false);
      } else {
        setSelectedPaymentMethod('new');
        setShowNewPaymentForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
    }
  };

  const subtotal = passedSubtotal || cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const total = passedTotal || (discountedSubtotal + deliveryFee);

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
    if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim() || !formData.phoneNumber.trim()) {
      setError('All shipping address fields, including phone number, must be filled');
      return false;
    }
    if (selectedPaymentMethod === 'new') {
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
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value);
    setShowNewPaymentForm(value === 'new');
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
      if (!item._id || !item.name || !item.quantity || !item.price || !item.image) {
        setError(`Invalid cart item: Missing required fields (id, name, quantity, price, image)`);
        return;
      }
    }
  
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      navigate('/login');
      return;
    }
  
    console.log('User from AuthContext:', user);
    if (!user || !user._id) {
      setError('User not authenticated. Please log in again.');
      navigate('/login');
      return;
    }
  
    try {
      setIsSubmitted(true);
  
      if (selectedPaymentMethod === 'cod') {
        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          payment: 'Cash on Delivery',
          total,
        };
  
        console.log('COD order data:', orderData);
  
        const response = await axios.post('http://localhost:5001/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('COD Order response:', response.data);
  
        setTimeout(() => {
          clearCart();
          localStorage.removeItem('checkoutForm');
          alert('Order placed successfully! Order ID: ' + response.data.orderId);
          navigate(`/success?session_id=cod-${response.data.orderId}`);
          navigate('/products');
        }, 2000);
      } else {
        const stripe = await stripePromise;
  
        const orderData = {
          userId: user._id,
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            price: Math.round(Number(item.price) * 100),
            quantity: item.quantity,
            image: item.image || '',
          })),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total: Math.round(total * 100),
          paymentMethod: selectedPaymentMethod === 'new' ? 'stripe' : 'saved',
          cardDetails: selectedPaymentMethod === 'new'
            ? {
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                cvv: formData.cvv,
              }
            : paymentMethods.find(method => method._id === selectedPaymentMethod),
        };
  
        console.log('Stripe order data:', orderData);
  
        const response = await axios.post('http://localhost:5001/api/checkout', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        console.log('Stripe session response:', response.data);
  
        const { sessionId } = response.data;
        const result = await stripe.redirectToCheckout({ sessionId });
  
        if (result.error) {
          console.error('Stripe redirect error:', result.error.message);
          navigate('/failure');
        }
        // Stripe will handle redirection to success_url or cancel_url
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        setError(err.response.data.message || 'Failed to place order');
      } else {
        setError('An unexpected error occurred');
      }
      setIsSubmitted(false);
      navigate('/failure');
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
          <div className="input-orbit">
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Phone Number (10 digits)"
              required
              className="form-input"
            />
          </div>

          <h3 className="form-section">Payment Galaxy</h3>
          <div className="input-orbit">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
              className="form-input"
            >
              {paymentMethods.length > 0 &&
                paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                  </option>
                ))}
              <option value="new">Add New Card (Online Payment)</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {showNewPaymentForm && (
            <>
              <div className="input-orbit">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Card Number (16 digits)"
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
                  placeholder="CVV (3 digits)"
                  required
                  className="form-input half"
                />
              </div>
            </>
          )}

          <div className="total-pod">
            <strong>Subtotal: ₹{subtotal.toFixed(2)}</strong>
            {passedDiscount > 0 && (
              <p>Discount ({(passedDiscount * 100).toFixed(0)}%): -₹{(subtotal * passedDiscount).toFixed(2)}</p>
            )}
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
































































/* import { useState, useEffect, } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/Checkout.css';

const stripePromise = loadStripe('pk_test_51PwKUJL4Eh51qnT6VIIEEXuLQQEuAcdbPOXFH36DIQ10wlSmntvODebkaUkfpm3Yn18GKUevcRYbBcHQ1IaOBX6200DmcOugdB'); // Replace with your actual key

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal: passedSubtotal, discount: passedDiscount, total: passedTotal } = location.state || {};

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);

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
    } else if (user) {
      fetchPaymentMethods();
    }
  }, [cart, user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 9) * 100);
  }, [formData]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('http://localhost:5001/api/users/profile/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.paymentMethods.length > 0) {
        setSelectedPaymentMethod(res.data.paymentMethods[0]._id);
        setShowNewPaymentForm(false);
      } else {
        setSelectedPaymentMethod('new');
        setShowNewPaymentForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
    }
  };

  const subtotal = passedSubtotal || cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const total = passedTotal || (discountedSubtotal + deliveryFee);

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
    if (!formData.fullName.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim() || !formData.phoneNumber.trim()) {
      setError('All shipping address fields, including phone number, must be filled');
      return false;
    }
    if (selectedPaymentMethod === 'new') {
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
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value);
    setShowNewPaymentForm(value === 'new');
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

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitted(true);

      if (selectedPaymentMethod === 'cod') {
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
          country: formData.country.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        }));
        orderFormData.append('payment', 'Cash on Delivery');

        const response = await axios.post('http://localhost:5001/api/orders', orderFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('COD Order response:', response.data);

        setTimeout(() => {
          clearCart();
          localStorage.removeItem('checkoutForm');
          alert('Order placed successfully! Order ID: ' + response.data.orderId);
          navigate(`/success?session_id=cod-${response.data.orderId}`);
          navigate('/products');
        }, 2000);
      } else {
        const stripe = await stripePromise;

        console.log('Sending request to create Stripe session:', {
          userId: user._id,
          items: cart,
          shippingAddress: {
            address: formData.address.trim(),
            fullName: formData.fullName.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total,
          paymentMethod: selectedPaymentMethod === 'new' ? 'stripe' : 'saved',
          cardDetails: selectedPaymentMethod === 'new' ? {
            cardNumber: formData.cardNumber,
            expiry: formData.expiry,
            cvv: formData.cvv,
          } : paymentMethods.find(method => method._id === selectedPaymentMethod),
        });

        const response = await axios.post('http://localhost:5001/api/orders/create-session', {
          userId: user._id,
          items: cart.map(item => ({
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
          })),
          shippingAddress: {
            address: formData.address.trim(),
            fullName: formData.fullName.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total,
          paymentMethod: selectedPaymentMethod === 'new' ? 'stripe' : 'saved',
          cardDetails: selectedPaymentMethod === 'new' ? {
            cardNumber: formData.cardNumber,
            expiry: formData.expiry,
            cvv: formData.cvv,
          } : paymentMethods.find(method => method._id === selectedPaymentMethod),
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Stripe session response:', response.data);

        const { sessionId } = response.data;
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          setError(result.error.message);
          setIsSubmitted(false);
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        setError(err.response.data.message || 'Failed to place order');
      } else {
        setError('An unexpected error occurred');
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
          <div className="input-orbit">
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Phone Number (10 digits)"
              required
              className="form-input"
            />
          </div>

          <h3 className="form-section">Payment Galaxy</h3>
          <div className="input-orbit">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
              className="form-input"
            >
              {paymentMethods.length > 0 && (
                paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                  </option>
                ))
              )}
              <option value="new">Add New Card (Online Payment)</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {showNewPaymentForm && (
            <>
              <div className="input-orbit">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Card Number (16 digits)"
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
                  placeholder="CVV (3 digits)"
                  required
                  className="form-input half"
                />
              </div>
            </>
          )}

          <div className="total-pod">
            <strong>Subtotal: ₹{subtotal.toFixed(2)}</strong>
            {passedDiscount > 0 && (
              <p>Discount ({(passedDiscount * 100).toFixed(0)}%): -₹{(subtotal * passedDiscount).toFixed(2)}</p>
            )}
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

export default Checkout; */ 