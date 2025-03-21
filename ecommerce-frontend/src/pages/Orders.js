import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import OrderItem from './OrderItem';
import { toast } from 'react-toastify';
import '../styles/Orders.css';

function Orders() {
  const { addToCart } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [reviewData, setReviewData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [reviews, setReviews] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessages, setWishlistMessages] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      fetchOrders();
      fetchWishlist();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchReviews();
    }
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched orders:', res.data);
      res.data.forEach(order => {
        console.log(`Order ${order._id} items:`, order.items);
        order.items.forEach(item => {
          console.log(`Item in order ${order._id}:`, {
            name: item.name,
            productId: item.productId,
            image: item.image,
            _id: item._id,
          });
        });
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
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

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched wishlist:', res.data);
      setWishlist(res.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err.response?.data?.message || 'Failed to fetch wishlist.');
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const newReviews = {};
      for (const order of orders) {
        for (const item of order.items) {
          const productId = item.productId;
          if (!productId) {
            console.warn(`Missing productId for item in order ${order._id}:`, item);
            continue;
          }
          const key = `${order._id}_${productId}`;
          console.log(`Fetching review for order ${order._id}, product ${productId}`);
          try {
            const res = await axios.get(
              `http://localhost:5001/api/reviews/order/${order._id}/product/${productId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data && res.data.rating) {
              newReviews[key] = res.data;
            }
          } catch (err) {
            if (err.response?.status === 404) {
              console.log(`No review found for order ${order._id}, product ${productId}`);
            } else {
              console.error(`Error fetching review for order ${order._id}, product ${productId}:`, err);
            }
          }
        }
      }
      console.log('Fetched reviews:', newReviews);
      setReviews(newReviews);
    } catch (err) {
      console.error('Unexpected error in fetchReviews:', err);
      setError(err.response?.data?.message || 'Failed to fetch reviews.');
    }
  };

  /* const handleAddToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5001/api/wishlist',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist([...wishlist, res.data.item]);
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Added to wishlist!',
      }));
      toast.success('Added to wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }; */

  const handleAddToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5001/api/wishlist',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Added to wishlist response:', res.data); // Debug the response
      setWishlist([...wishlist, res.data.item]);
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Added to wishlist!',
      }));
      toast.success('Added to wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const wishlistItem = wishlist.find((item) => item.productId?._id?.toString() === productId);
      if (wishlistItem) {
        await axios.delete(`http://localhost:5001/api/wishlist/${wishlistItem._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist(wishlist.filter((item) => item._id !== wishlistItem._id));
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: 'Removed from wishlist!',
        }));
        toast.success('Removed from wishlist!');
        setTimeout(() => {
          setWishlistMessages((prev) => ({
            ...prev,
            [productId]: '',
          }));
        }, 3000);
      } else {
        console.warn('Wishlist item not found for product:', productId);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove from wishlist.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.items.some((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const orderDate = new Date(order.createdAt);
    const matchesYear =
      filterYear === 'All' || orderDate.getFullYear().toString() === filterYear;
    const matchesDate = !filterDate || orderDate.toISOString().split('T')[0] === filterDate;
    return matchesSearch && matchesYear && matchesDate;
  });

  const years = ['All', ...new Set(orders.map((order) => new Date(order.createdAt).getFullYear()))];

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReorder = async (order) => {
    try {
      console.log('Reordering order:', order);
      console.log('Order items:', order.items);
      const items = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      console.log('Items to add to cart:', items);
      await addToCart(items, true);
      console.log('Successfully added items to cart');
      navigate('/cart');
    } catch (err) {
      console.error('Error reordering:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reorder. Please try again.';
      setError(errorMessage);
    }
  };

  const handleReviewSubmit = async (orderId, productId, isEdit = false) => {
    const key = `${orderId}_${productId}`;
    const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

    if (data.rating < 1 || data.rating > 5) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please select a rating between 1 and 5.' } });
      return;
    }

    if (!data.comment.trim()) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Please enter a review comment.' } });
      return;
    }

    if (!orderId || !productId) {
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Order ID or Product ID is missing.' } });
      return;
    }

    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId(orderId) || !isValidObjectId(productId)) {
      console.error('Invalid ObjectId:', { orderId, productId });
      setReviewData({ ...reviewData, [key]: { ...data, error: 'Invalid Order ID or Product ID. Please contact support.' } });
      return;
    }

    setReviewData({ ...reviewData, [key]: { ...data, loading: true, error: '', message: '' } });

    try {
      console.log('Submitting review:', { orderId, productId, rating: data.rating, comment: data.comment });
      const token = localStorage.getItem('token');
      const method = isEdit ? 'put' : 'post';
      const url = isEdit
        ? `http://localhost:5001/api/reviews/${reviews[key]._id}`
        : `http://localhost:5001/api/reviews/${orderId}/${productId}`;
      console.log('Request URL:', url);
      const res = await axios[method](
        url,
        { rating: data.rating, comment: data.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Review submission response:', res.data);

      setReviews((prev) => ({
        ...prev,
        [key]: res.data.review,
      }));

      setReviewData({
        ...reviewData,
        [key]: {
          rating: 0,
          comment: '',
          message: isEdit ? 'Review updated successfully!' : 'Review submitted successfully!',
          error: '',
          loading: false,
          showForm: false,
        },
      });

      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      let errorMessage = 'Failed to submit review.';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Review endpoint not found. Please contact support.';
        } else if (err.response.status === 403) {
          errorMessage = 'You can only review delivered products you have purchased.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid request. Please try again.';
        } else {
          errorMessage = err.response.data.message || 'Failed to submit review.';
        }
      }
      setReviewData({
        ...reviewData,
        [key]: {
          ...data,
          loading: false,
          error: errorMessage,
          message: '',
        },
      });
    }
  };

  const handleDeleteReview = async (orderId, productId) => {
    const key = `${orderId}_${productId}`;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/reviews/${reviews[key]._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) => {
        const newReviews = { ...prev };
        delete newReviews[key];
        return newReviews;
      });
      setReviewData((prev) => ({
        ...prev,
        [key]: { rating: 0, comment: '', message: 'Review deleted successfully!', error: '', loading: false, showForm: false },
      }));
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      setReviewData((prev) => ({
        ...prev,
        [key]: { ...prev[key], error: err.response?.data?.message || 'Failed to delete review.', message: '' },
      }));
    }
  };

  const handleExportOrders = () => {
    const orderText = filteredOrders
      .map((order) => `Order #${order._id.slice(-6)} - ${new Date(order.createdAt).toLocaleDateString()} - ₹${order.total.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([orderText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_history.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    setError('Order history exported successfully!');
    toast.success('Order history exported successfully!');
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="orders-container ">
        <h1 className="orders-title ">Your Orders</h1>
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
    <div className="orders-container my-5 py-5">
      <h1 className="orders-title">Your Orders</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="orders-controls">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="filter-select"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-filter"
        />
        <button className="export-btn" onClick={handleExportOrders}>
          Export History
        </button>
      </div>
      {currentOrders.length > 0 ? (
        <div className="orders-timeline">
          {currentOrders.map((order) => (
            <div
              key={order._id}
              className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`}
            >
              <div className="timeline-dot"></div>
              <div className="order-header" onClick={() => toggleOrderDetails(order._id)}>
                <div className="order-id">Order #{order._id.slice(-6)}</div>
                <div className={`status-badge status-${order.status.toLowerCase()} pulsing`}>
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
                  <div className="status-tracker">
                    <div
                      className={`tracker-step ${
                        ['Processing', 'Shipped', 'Delivered', 'Completed'].includes(order.status)
                          ? 'active'
                          : ''
                      }`}
                    >
                      Placed
                    </div>
                    <div
                      className={`tracker-step ${
                        ['Shipped', 'Delivered', 'Completed'].includes(order.status) ? 'active' : ''
                      }`}
                    >
                      Shipped
                    </div>
                    <div
                      className={`tracker-step ${
                        ['Delivered', 'Completed'].includes(order.status) ? 'active' : ''
                      }`}
                    >
                      Delivered
                    </div>
                  </div>
                  <p>
                    <strong>Shipping Address:</strong>{' '}
                    {order.shippingAddress.address || 'Not specified'}
                  </p>
                  <h4>Items:</h4>
                  <div className="order-items-grid">
                    {order.items.map((item, index) => (
                      <OrderItem
                        key={index}
                        order={order}
                        item={item}
                        index={index}
                        handleProductClick={handleProductClick}
                        reviewData={reviewData}
                        setReviewData={setReviewData}
                        reviews={reviews}
                        handleReviewSubmit={handleReviewSubmit}
                        handleDeleteReview={handleDeleteReview}
                        wishlist={wishlist}
                        handleAddToWishlist={handleAddToWishlist}
                        handleRemoveFromWishlist={handleRemoveFromWishlist}
                        wishlistMessages={wishlistMessages}
                      />
                    ))}
                  </div>
                  <button
                    className="reorder-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(order);
                    }}
                  >
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
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