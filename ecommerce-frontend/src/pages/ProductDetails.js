import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductDetails.css';

function ProductDetails() {
  const { id } = useParams();
  console.log('Product ID:', id);
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

  console.log('Products array:', products);
  const product = products.find((p) => p._id === id);
  console.log('Selected product:', product);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (product) {
      const defaultImage = product.images?.[0] || product.image || '';
      setCurrentImage(defaultImage);
      setStockCount(product.stock || 0);
      if (isValidObjectId(id)) {
        fetchReviews();
      } else {
        setReviewsError('Invalid product ID. Unable to load reviews.');
        setReviews([]);
        setAverageRating(0);
        setReviewsLoading(false);
      }
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');

      const res = await axios.get(`http://localhost:5001/api/reviews/product/${id}`);

      if (!Array.isArray(res.data)) {
        console.error('Expected an array of reviews, but received:', JSON.stringify(res.data, null, 2));
        console.error('Response status:', res.status);
        setReviews([]);
        setAverageRating(0);
        setReviewsLoading(false);
        setReviewsError(res.data.message || 'Failed to load reviews. Please try again.');
        return;
      }

      setReviews(res.data);
      calculateAverageRating(res.data);
      setReviewsLoading(false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        setReviewsError(err.response.data.message || 'Failed to load reviews. Please try again later.');
      } else {
        setReviewsError('Failed to load reviews. Please try again later.');
      }
      setReviews([]);
      setAverageRating(0);
      setReviewsLoading(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      setAverageRating(0);
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avg = totalRating / reviews.length;
    setAverageRating(avg.toFixed(1));
  };

  /* const handleAddToCart = () => {
    if (stockCount > 0) {
      if (!product || !product._id || !isValidObjectId(product._id)) {
        console.error('Invalid product or product ID:', product);
        setReviewsError('Cannot add to cart: Invalid product.');
        return;
      }
      console.log('Product being added to cart:', product);
      addToCart(product)
        .then(() => {
          setStockCount((prev) => prev - 1);
        })
        .catch((error) => {
          console.error('Failed to add to cart:', error);
          setReviewsError(error.message || 'Failed to add to cart. Please try again.');
        });
    }
  }; */

  const handleAddToCart = () => {
    if (stockCount > 0) {
      if (!product || !product._id || !isValidObjectId(product._id)) {
        console.error('Invalid product or product ID:', product);
        setReviewsError('Cannot add to cart: Invalid product.');
        return;
      }
      console.log('Product being added to cart:', product);
      addToCart(product)
        .then(() => {
          setStockCount((prev) => prev - 1);
        })
        .catch((error) => {
          console.error('Failed to add to cart:', error);
          setReviewsError(error.message || 'Failed to add to cart. Please try again.');
        });
    }
  };



  const handleBuyNow = () => {
    if (stockCount > 0) {
      if (!product || !product._id || !isValidObjectId(product._id)) {
        console.error('Invalid product or product ID:', product);
        setReviewsError('Cannot proceed to checkout: Invalid product.');
        return;
      }
      addToCart(product)
        .then(() => {
          setStockCount((prev) => prev - 1);
          navigate('/checkout');
        })
        .catch((error) => {
          console.error('Failed to add to cart:', error);
          setReviewsError(error.message || 'Failed to add to cart. Please try again.');
        });
    }
  };

  const handleThumbnailClick = (img) => {
    setCurrentImage(img);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientX - top) / height) * 100;
    setZoomPosition({ x, y });
    setIsZoomVisible(true);
  };

  const handleMouseLeave = () => {
    setIsZoomVisible(false);
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
            <div className="cosmic-loading">
              <div className="spinner-orbit"></div>
              <p>Loading Reviews...</p>
            </div>
          ) : reviewsError ? (
            <p className="error-text">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet for this product. Be the first to share your thoughts!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.userId?.name || 'Anonymous'}</span>
                    <span className="review-rating">Rating: {review.rating} / 5</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-comment">{review.comment || 'No comment provided.'}</p>
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