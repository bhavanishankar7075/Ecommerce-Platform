// ecommerce-frontend/src/pages/ProductDetails.js
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductDetails.css';

function ProductDetails() {
  const { id } = useParams();
  const { products, loading, error: productsError } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(null);
  const [stockCount, setStockCount] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  const product = products.find((p) => p._id === id);

  useEffect(() => {
    if (product) {
      const defaultImage = product.images?.[0] || product.image || '';
      setCurrentImage(defaultImage);
      setStockCount(product.stock || 0);
      fetchReviews();
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/reviews/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
      calculateAverageRating(res.data);
      setReviewsLoading(false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviewsError('Failed to load reviews');
      setReviewsLoading(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) {
      setAverageRating(0);
      return;
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avg = totalRating / reviews.length;
    setAverageRating(avg.toFixed(1));
  };

  if (loading) {
    return (
      <div className="cosmic-loading">
        <div className="spinner-orbit"></div>
        <p>Loading Product...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="cosmic-error">
        <h3>Error Loading Product</h3>
        <p>{productsError}</p>
        <button className="btn-return" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="cosmic-error">
        <p>Product Not Found: {id}</p>
        <button className="btn-return" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  const description = product.description || 'No description available.';
  const stockStatus = stockCount > 5 ? 'In Stock' : stockCount > 0 ? 'Low Stock' : 'Out of Stock';
  const imageList = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || 'https://placehold.co/400?text=No+Image'];

  const handleAddToCart = () => {
    if (stockCount > 0) {
      addToCart(product);
      setStockCount((prev) => prev - 1);
    }
  };

  const handleBuyNow = () => {
    if (stockCount > 0) {
      addToCart(product);
      setStockCount((prev) => prev - 1);
      navigate('/checkout');
    }
  };

  const handleThumbnailClick = (img) => {
    setCurrentImage(img);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
    setIsZoomVisible(true);
  };

  const handleMouseLeave = () => {
    setIsZoomVisible(false);
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 3);

  return (
    <div className="product-details-universe">
      <div className="product-container">
        <div className="product-galaxy">
          {/* Image Section */}
          <div className="image-orbit">
            <div className="thumbnail-constellation">
              {imageList.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail-star ${img === currentImage ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(img)}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                </div>
              ))}
            </div>
            <div className="main-image-pod" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <img
                src={currentImage}
                alt={product.name}
                className="main-image"
                onError={(e) => (e.target.src = 'https://placehold.co/400?text=No+Image')}
              />
              {isZoomVisible && (
                <div className="zoom-portal">
                  <img
                    src={currentImage}
                    alt={`${product.name} zoomed`}
                    style={{
                      transform: `translate(-${zoomPosition.x * 1.5}%, -${zoomPosition.y * 1.5}%) scale(2.5)`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="info-nebula">
            <h1 className="product-name">{product.name}</h1>
            <p className="product-price">₹{Number(product.price).toFixed(2)}</p>
            <div className="product-meta">
              <span className="meta-item">Category: {product.category || 'N/A'}</span>
              <span className="meta-item">Brand: {product.brand || 'N/A'}</span>
              <span className="meta-item">Model: {product.model || 'N/A'}</span>
              <span className="meta-item">Weight: {product.weight || 'N/A'} kg</span>
            </div>
            <p className={`stock-status ${stockStatus.toLowerCase().replace(' ', '-')}`}>
              {stockStatus} {stockCount > 0 && `(${stockCount} left)`}
            </p>
            <div className="rating-summary">
              <span className="average-rating">
                Average Rating: {averageRating} / 5 ({reviews.length} reviews)
              </span>
            </div>
            <div className="action-cluster">
              <button
                className="btn-cart"
                onClick={handleAddToCart}
                disabled={stockCount <= 0}
              >
                <i className="fas fa-shopping-cart"></i> Add to Cart
              </button>
              <button
                className="btn-buy"
                onClick={handleBuyNow}
                disabled={stockCount <= 0}
              >
                <i className="fas fa-bolt"></i> Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="description-comet">
          <h2>Description</h2>
          <p>{description}</p>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews</h2>
          {reviewsLoading ? (
            <p>Loading reviews...</p>
          ) : reviewsError ? (
            <p className="error-text">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet for this product.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="review-rating">Rating: {review.rating} / 5</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-comment">{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-galaxy">
            <h2>Related Cosmic Finds</h2>
            <div className="related-orbit">
              {relatedProducts.map((related) => (
                <div key={related._id} className="related-planet">
                  <img
                    src={related.image || 'https://placehold.co/150?text=No+Image'}
                    alt={related.name}
                    onError={(e) => (e.target.src = 'https://placehold.co/150?text=No+Image')}
                  />
                  <div className="related-info">
                    <h3>{related.name}</h3>
                    <p>₹{Number(related.price).toFixed(2)}</p>
                    <button
                      className="btn-explore"
                      onClick={() => navigate(`/product/${related._id}`)}
                    >
                      Explore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;