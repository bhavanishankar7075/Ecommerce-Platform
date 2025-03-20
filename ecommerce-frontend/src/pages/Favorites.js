import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Favorites.css';

function Favorites() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPerPage] = useState(5);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user && user._id) {
      fetchFavorites();
    }
  }, [user, authLoading, navigate]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/favorites/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load favorites');
      }
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter((fav) => {
    if (!fav.orderId) return false;
    const matchesSearch = fav.orderId.items.some((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus =
      filterStatus === 'All' || fav.orderId.status === filterStatus;
    const orderDate = new Date(fav.orderId.createdAt);
    const matchesYear =
      filterYear === 'All' || orderDate.getFullYear().toString() === filterYear;
    return matchesSearch && matchesStatus && matchesYear;
  });

  // Fix: Convert Set to array before filtering
  const years = [
    'All',
    ...Array.from(
      new Set(favorites.map((fav) => (fav.orderId ? new Date(fav.orderId.createdAt).getFullYear() : null)))
    ).filter(Boolean),
  ];
  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];

  const indexOfLastFavorite = currentPage * favoritesPerPage;
  const indexOfFirstFavorite = indexOfLastFavorite - favoritesPerPage;
  const currentFavorites = filteredFavorites.slice(indexOfFirstFavorite, indexOfLastFavorite);
  const totalPages = Math.ceil(filteredFavorites.length / favoritesPerPage);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleUnfavoriteOrder = async (favoriteId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/favorites/${favoriteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((fav) => fav._id !== favoriteId));
      setError('Removed from favorites!');
    } catch (err) {
      console.error('Error unfavoriting order:', err);
      setError(err.response?.data?.message || 'Failed to unfavorite order.');
    }
  };

  const handleReorder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const items = order.items.map((item) => ({
        productId: item.productId || item._id,
        quantity: item.quantity,
      }));
      await axios.post(
        'http://localhost:5001/api/cart/add',
        { items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/cart');
    } catch (err) {
      console.error('Error reordering:', err);
      setError(err.response?.data?.message || 'Failed to reorder. Please try again.');
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="favorites-container">
        <h1 className="favorites-title">Your Favorites</h1>
        <div className="favorites-timeline">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="favorite-card skeleton">
              <div className="favorite-header">
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
    <div className="favorites-container">
      <h1 className="favorites-title">Your Favorites</h1>
      {/* Add a "Refresh Favorites" button to navigate to /favorites */}
      <div className="favorites-header-actions">
        <button
          className="refresh-favorites-btn"
          onClick={() => navigate('/favorites')}
        >
          Refresh Favorites
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="favorites-controls">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
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
      </div>
      {currentFavorites.length > 0 ? (
        <div className="favorites-timeline">
          {currentFavorites.map((fav) => {
            if (!fav.orderId) return null;
            return (
              <div
                key={fav._id}
                className={`favorite-card ${expandedOrder === fav.orderId._id ? 'expanded' : ''}`}
              >
                <div className="timeline-dot"></div>
                <div className="favorite-header" onClick={() => toggleOrderDetails(fav.orderId._id)}>
                  <div className="order-id">Order #{fav.orderId._id.slice(-6)}</div>
                  <div className={`status-badge status-${fav.orderId.status.toLowerCase()} pulsing`}>
                    {fav.orderId.status}
                  </div>
                </div>
                <div className="favorite-meta">
                  <span className="order-date">
                    {new Date(fav.orderId.createdAt).toLocaleDateString()}
                  </span>
                  <span className="order-total">₹{fav.orderId.total.toFixed(2)}</span>
                  <button
                    className="unfavorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfavoriteOrder(fav._id);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className={`favorite-details ${expandedOrder === fav.orderId._id ? 'show' : ''}`}>
                  <div className="favorite-details-content">
                    <div className="status-tracker">
                      <div
                        className={`tracker-step ${
                          ['Processing', 'Shipped', 'Delivered', 'Completed'].includes(fav.orderId.status)
                            ? 'active'
                            : ''
                        }`}
                      >
                        Placed
                      </div>
                      <div
                        className={`tracker-step ${
                          ['Shipped', 'Delivered', 'Completed'].includes(fav.orderId.status) ? 'active' : ''
                        }`}
                      >
                        Shipped
                      </div>
                      <div
                        className={`tracker-step ${
                          ['Delivered', 'Completed'].includes(fav.orderId.status) ? 'active' : ''
                        }`}
                      >
                        Delivered
                      </div>
                    </div>
                    <p>
                      <strong>Shipping Address:</strong>{' '}
                      {fav.orderId.shippingAddress.address || 'Not specified'}
                    </p>
                    <h4>Items:</h4>
                    <div className="favorite-items-grid">
                      {fav.orderId.items.map((item, index) => (
                        <div key={index} className="favorite-item-card">
                          <img
                            src={item.image || '/default-product.jpg'}
                            alt={item.name}
                            className="item-image"
                            onError={(e) => {
                              e.target.src = '/default-product.jpg';
                            }}
                            onClick={() => handleProductClick(item.productId || 'default')}
                          />
                          <div className="item-details">
                            <span className="item-name">
                              <Link to={`/product/${item.productId || 'default'}`}>
                                {item.name}
                              </Link>
                            </span>
                            <span className="item-quantity">Qty: {item.quantity}</span>
                            <span className="item-price">₹{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="reorder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(fav.orderId);
                      }}
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
        <div className="no-favorites">
          <p>No favorites found.</p>
          <button className="shop-now-btn" onClick={() => navigate('/products')}>
            Shop Now
          </button>
        </div>
      )}
    </div>
  );
}

export default Favorites;