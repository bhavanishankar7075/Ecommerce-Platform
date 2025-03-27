// OrderDetails.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/OrderDetails.css';

function OrderDetails() {
  const { orderId } = useParams();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      const token = localStorage.getItem('token');
      console.log('User ID:', user._id);
      console.log('Token:', token);
      if (!token) {
        setError('No authentication token found. Please log in again.');
        logout();
        navigate('/login');
        return;
      }
      if (!orderId || orderId.length !== 24) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }
      fetchUserOrders();
    }
  }, [user, authLoading, navigate, orderId]);

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserOrders(res.data);
      // Check if the orderId exists in the user's orders
      const orderExists = res.data.some(order => order._id === orderId);
      if (!orderExists) {
        setError('This order does not belong to you or does not exist.');
        setLoading(false);
        return;
      }
      fetchOrderDetails();
    } catch (err) {
      console.error('Error fetching user orders:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching order with ID:', orderId);
      const res = await axios.get(`http://localhost:5001/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Order details response:', res.data);
      setOrder(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      console.log('Error response:', err.response?.data);
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (err.response?.status === 403) {
          const { message, orderUserId, authenticatedUserId } = err.response.data;
          setError(
            `${message} (Order belongs to user ${orderUserId}, but you are logged in as user ${authenticatedUserId})`
          );
        } else {
          await logout();
          navigate('/login');
          setError('Session expired. Please log in again.');
        }
      } else if (err.response?.status === 404) {
        setError('Order not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load order details');
      }
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="order-details-container">
        <div className="order-details-content">
          <div className="order-details-left skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-text skeleton-name"></div>
            <div className="skeleton-text skeleton-status"></div>
          </div>
          <div className="order-details-right">
            <div className="skeleton-text skeleton-address"></div>
            <div className="skeleton-text skeleton-price"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    setTimeout(() => {
      navigate('/orders');
    }, 3000);
    return (
      <div className="order-details-container">
        <p className="error-message">{error || 'Order not found.'} Redirecting to Orders...</p>
        <button className="back-btn" onClick={() => navigate('/orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  const item = order.items[0];
  const couponDiscount = order.couponDiscount || 0;
  const deliveryFee = 40;
  const platformFee = 3;
  const subtotal = item.price;
  const total = order.total || (subtotal + deliveryFee + platformFee - couponDiscount);

  const getStatusMessage = () => {
    switch (order.status.toLowerCase()) {
      case 'delivered':
        return `Delivered on ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'cancelled':
        return `Cancelled on ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'shipped':
        return `Shipped, Today`;
      default:
        return `Expected by ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  return (
    <div className="order-details-container">
      <h1 className="order-details-title">Order Details</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="order-details-content">
        <div className="order-details-left">
          <div className="order-details-product">
            <img
              src={item.image || '/default-product.jpg'}
              alt={item.name}
              className="product-image"
              onError={(e) => (e.target.src = '/default-product.jpg')}
              onClick={() => handleProductClick(item.productId || 'default')}
            />
            <div className="product-info">
              <h2 className="product-name">{item.name}</h2>
              <p className="product-price">₹{item.price.toFixed(2)}</p>
              <div className="status-tracker">
                <div className="status-step completed">
                  <span className="status-dot"></span>
                  <p>Order Confirmed, Today</p>
                </div>
                <div className={`status-step ${order.status.toLowerCase() === 'shipped' ? 'completed' : ''}`}>
                  <span className="status-dot"></span>
                  <p>{getStatusMessage()}</p>
                </div>
                <div className="status-step">
                  <span className="status-dot"></span>
                  <p>Out For Delivery</p>
                </div>
                <div className="status-step">
                  <span className="status-dot"></span>
                  <p>Delivery, Mar 30 by 11 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-actions">
            <button className="see-updates-btn">See All Updates</button>
            <button className="cancel-btn">Cancel</button>
            <button className="chat-btn">Chat with us</button>
          </div>
        </div>

        <div className="order-details-right">
          <div className="shipping-address">
            <h3>Shipping Address</h3>
            <p><strong>{order.shippingAddress?.name || 'N/A'}</strong></p>
            <p>{order.shippingAddress?.address || 'N/A'}</p>
            <p>{order.shippingAddress?.city || ''} {order.shippingAddress?.state || ''} - {order.shippingAddress?.zip || ''}</p>
            <p>Phone number: {order.shippingAddress?.phone || 'N/A'}</p>
            <button className="change-btn">Change</button>
          </div>
          <div className="price-details">
            <h3>Price Details</h3>
            <div className="price-item">
              <span>List price</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="price-item">
              <span>Selling Price</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="price-item">
              <span>Extra Discount</span>
              <span>₹0.00</span>
            </div>
            <div className="price-item">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="price-item">
              <span>Platform Fee</span>
              <span>₹{platformFee.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="price-item discount">
                <span>Get extra ₹{couponDiscount} off on 1 item(s)</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="price-item total">
              <span><strong>Total</strong></span>
              <span><strong>₹{total.toFixed(2)}</strong></span>
            </div>
            {couponDiscount > 0 && (
              <p className="coupon-note">
                1 coupon: Extra ₹{couponDiscount} off on 1 item(s) (price inclusive of cashback/coupon)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;