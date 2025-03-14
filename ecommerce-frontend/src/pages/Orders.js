// ecommerce-frontend/src/pages/Orders.js
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

export default Orders;