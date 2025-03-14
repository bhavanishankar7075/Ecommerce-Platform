import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Orders.css';

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching orders - user._id:', user._id, 'token:', token);
      if (!token) {
        navigate('/login');
        throw new Error('No token found');
      }
      if (!user._id) {
        throw new Error('User ID is undefined');
      }
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Orders fetched:', res.data);
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        setError('Session expired or unauthorized. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReorder = (order) => {
    // Placeholder for reorder functionality
    console.log('Reordering order:', order);
    alert('Reorder functionality coming soon!');
  };

  if (authLoading || loading) {
    return (
      <div className="orders-container">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-timeline">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="order-card skeleton">
              <div className="order-header">
                <div className="skeleton-text skeleton-order-id"></div>
                <div className="skeleton-text skeleton-status"></div>
              </div>
              <div className="skeleton-text skeleton-date"></div>
              <div className="skeleton-text skeleton-total"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="orders-container">
      <h1 className="orders-title">Your Orders</h1>
      {error && <p className="error-message">{error}</p>}
      {orders.length > 0 ? (
        <div className="orders-timeline">
          {orders.map((order) => (
            <div
              key={order._id}
              className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`}
            >
              <div className="timeline-dot"></div>
              <div className="order-header" onClick={() => toggleOrderDetails(order._id)}>
                <div className="order-id">Order #{order._id.slice(-6)}</div>
                <div className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </div>
              </div>
              <div className="order-meta">
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="order-total">₹{order.total.toFixed(2)}</span>
              </div>
              <div className={`order-details ${expandedOrder === order._id ? 'show' : ''}`}>
                <div className="order-details-content">
                  <p>
                    <strong>Shipping Address:</strong>{' '}
                    {typeof order.shippingAddress === 'string'
                      ? order.shippingAddress
                      : order.shippingAddress?.address || 'Not specified'}
                  </p>
                  <h4>Items:</h4>
                  <ul className="order-items">
                    {order.items.map((item, index) => (
                      <li key={index} className="order-item-detail">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                        <span className="item-price">₹{item.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="reorder-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card toggle when clicking reorder
                      handleReorder(order);
                    }}
                  >
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-orders">
          <p>No orders found.</p>
          <button className="shop-now-btn" onClick={() => navigate('/products')}>
            Shop Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Orders;












































/* // ecommerce-frontend/src/pages/Orders.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Orders.css';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dummy userId for now (replace with authenticated user ID later)
  const userId = 'guest';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/orders/user/${userId}`);
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5 text-center">
        <h3>Error loading orders</h3>
        <p>{error}</p>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="orders-wrapper py-5">
      <div className="container">
        <h1 className="orders-title">Your Cosmic Orders</h1>
        {orders.length > 0 ? (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <h3>Order #{order._id}</h3>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
                <h4>Items:</h4>
                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.productId} className="order-item">
                      <img
                        src={item.image || ''}
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          console.log(`Failed to load image for ${item.name}: ${item.image}`);
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="item-details">
                        <p>{item.name}</p>
                        <p>₹{item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p><strong>Shipping:</strong> {order.shipping.fullName}, {order.shipping.address}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders text-center">
            <p>No orders found in your cosmic journey!</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              Shop Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders; */