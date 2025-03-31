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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      fetchOrderDetails();
    }
  }, [user, authLoading, navigate, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://backend-ps76.onrender.com/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load order details');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://backend-ps76.onrender.com/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleProductClick = (productId) => {
    const id = typeof productId === 'object' && productId?._id ? productId._id : productId;
    if (id && id !== 'default') {
      navigate(`/product/${id}`);
    } else {
      console.error('Invalid product ID:', productId);
      setError('Unable to navigate to product details. Invalid product ID.');
    }
  };

  const handleShareOrder = () => {
    if (!order) return;

    const item = order.items[0];
    const shareText = `
Order Details:
- Order ID: ${order._id}
- Order Date: ${new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}
- Product: ${item.name}
- Price: ₹${item.price.toFixed(2)}
- Status: ${order.status}
- Shipping Address:
  - Full Name: ${order.shippingAddress?.fullName || 'N/A'}
  - Address: ${order.shippingAddress?.address || 'N/A'}
  - City: ${order.shippingAddress?.city || 'N/A'}
  - Postal Code: ${order.shippingAddress?.postalCode || 'N/A'}
  - Country: ${order.shippingAddress?.country || 'N/A'}
  - Phone: ${order.shippingAddress?.phoneNumber || 'N/A'}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Order Details',
        text: shareText,
      }).catch((err) => {
        console.error('Error sharing order:', err);
        setError('Failed to share order details.');
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Order details copied to clipboard!');
      }).catch((err) => {
        console.error('Error copying to clipboard:', err);
        setError('Failed to copy order details to clipboard.');
      });
    }
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
    return (
      <div className="order-details-container">
        <p className="error-message">{error || 'Order not found.'}</p>
      </div>
    );
  }

  const item = order.items[0];
  const couponDiscount = order.couponDiscount || 0;
  const deliveryFee = 40;
  const platformFee = 3;
  const subtotal = item.price;
  const total = subtotal + deliveryFee + platformFee - couponDiscount;

  const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStatus = order.status;
  const isCancelled = currentStatus === 'Cancelled';
  const currentStepIndex = isCancelled ? -1 : statusSteps.indexOf(currentStatus);
  const progressPercentage = isCancelled ? 0 : ((currentStepIndex + 1) / statusSteps.length) * 100;
  const progressHeight = isCancelled ? 0 : ((currentStepIndex + 1) / statusSteps.length) * 100;

  // Status history with timestamps (assuming order.statusHistory exists)
  const statusHistory = order.statusHistory || [];

  return (
    <div className="order-details-container my-5 py-5">
      <div className="order-details-scrollable">
        <h1 className="order-details-title">Order Details</h1>
        {error && <p className="error-message">{error}</p>}
        <div className="order-details-content">
          {/* Left Section: Product Details and Status */}
          <div className="order-details-left">
            <div className="order-meta">
              <p><strong>Order ID:</strong> {order._id}</p>
              <p>
                <strong>Order Date:</strong>{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div
              className="order-details-product"
              onClick={() => handleProductClick(item.productId || 'default')}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.image || '/default-product.jpg'}
                alt={item.name}
                className="product-image"
                onError={(e) => (e.target.src = '/default-product.jpg')}
              />
              <div className="product-info">
                <h2 className="product-name">{item.name}</h2>
                <p className="product-price">₹{item.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="status-tracker">
              <h3>Order Status</h3>
              <div className="status-progress">
                {statusSteps.map((step, index) => {
                  const statusEntry = statusHistory.find((entry) => entry.status === step);
                  return (
                    <div
                      key={step}
                      className={`status-step ${
                        isCancelled ? 'cancelled' : index <= currentStepIndex ? 'completed' : ''
                      }`}
                    >
                      <div className="status-circle"></div>
                      <div className="status-info">
                        <span>{step}</span>
                        {statusEntry && (
                          <p className="status-timestamp">
                            {new Date(statusEntry.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isCancelled && (
                  <div className="status-step cancelled">
                    <div className="status-circle"></div>
                    <div className="status-info">
                      <span>Cancelled</span>
                      {statusHistory.find((entry) => entry.status === 'Cancelled') && (
                        <p className="status-timestamp">
                          {new Date(
                            statusHistory.find((entry) => entry.status === 'Cancelled').timestamp
                          ).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: window.innerWidth >= 768 ? `${progressPercentage}%` : '100%',
                      height: window.innerWidth < 768 ? `${progressHeight}%` : '100%',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="order-actions">
              <button className="share-button" onClick={handleShareOrder}>
                Share Order Details
              </button>
            </div>
          </div>

          {/* Right Section: Shipping Address and Price Details */}
          <div className="order-details-right">
            <div className="shipping-address">
              <h3>Shipping Address</h3>
              <ul>
                {order.shippingAddress?.fullName && (
                  <li><strong>Full Name:</strong> {order.shippingAddress.fullName}</li>
                )}
                {order.shippingAddress?.address && (
                  <li><strong>Address:</strong> {order.shippingAddress.address}</li>
                )}
                {order.shippingAddress?.city && (
                  <li><strong>City:</strong> {order.shippingAddress.city}</li>
                )}
                {order.shippingAddress?.postalCode && (
                  <li><strong>Postal Code:</strong> {order.shippingAddress.postalCode}</li>
                )}
                {order.shippingAddress?.country && (
                  <li><strong>Country:</strong> {order.shippingAddress.country}</li>
                )}
                {order.shippingAddress?.phoneNumber && (
                  <li><strong>Phone:</strong> {order.shippingAddress.phoneNumber}</li>
                )}
                {!order.shippingAddress || Object.keys(order.shippingAddress).length === 0 && (
                  <li>No shipping address available.</li>
                )}
              </ul>
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
    </div>
  );
}

export default OrderDetails;