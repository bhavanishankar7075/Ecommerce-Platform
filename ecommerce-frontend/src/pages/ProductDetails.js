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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [email, setEmail] = useState('');

  const product = products.find((p) => p._id === id);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (product) {
      setStockCount(product.stock || 0);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
      if (isValidObjectId(id)) {
        fetchReviews();
      } else {
        setReviewsError('Invalid product ID. Unable to load reviews.');
        setReviews([]);
        setAverageRating(0);
        setReviewsLoading(false);
      }
      // Add to recently viewed (localStorage)
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      if (!recentlyViewed.includes(product._id)) {
        recentlyViewed.push(product._id);
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed.slice(-5)));
      }
    }
  }, [product, id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const res = await axios.get(`http://localhost:5001/api/reviews/product/${id}`);
      if (!Array.isArray(res.data)) {
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
      setReviewsError(err.response?.data?.message || 'Failed to load reviews. Please try again later.');
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

  const handleAddToCart = async () => {
    if (stockCount <= 0) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart({ ...product, selectedSize });
      setStockCount((prev) => prev - 1);
    } catch (error) {
      setReviewsError(error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (stockCount <= 0) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    setIsBuyingNow(true);
    try {
      await addToCart({ ...product, selectedSize });
      setStockCount((prev) => prev - 1);
      navigate('/checkout');
    } catch (error) {
      setReviewsError(error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    // Simulate sending a notification request (replace with actual API call)
    console.log(`Notification requested for ${email} when ${product.name} is back in stock.`);
    setIsNotifyModalOpen(false);
    setEmail('');
    alert('You will be notified when this product is back in stock!');
  };

  const shareProduct = (platform) => {
    const url = window.location.href;
    const text = `Check out this amazing product: ${product.name} on Clean Modern Marketplace!`;
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Product...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="error-container">
        <h3>Error Loading Product</h3>
        <p>{productsError}</p>
        <button className="btn-back" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <p>Product Not Found: {id}</p>
        <button className="btn-back" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>
    );
  }

  const imageList =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || 'https://placehold.co/400?text=No+Image'];

  const stockStatus = stockCount > 5 ? 'In Stock' : stockCount > 0 ? 'Low Stock' : 'Out of Stock';
  const relatedProducts = products
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 3);

  const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    .filter((pid) => pid !== id)
    .map((pid) => products.find((p) => p._id === pid))
    .filter(Boolean);

  // For demo purposes, assuming the offer is "45% OFF". Replace with actual offer data if available.
  const offerText = product.offer ? product.offer : '45% OFF';

  return ( 
    <div className="clean-modern-container my-5 py-5">
      <div className="product-details-wrapper">
        {/* Main Product Section */}
        <div className="product-main">
          {/* Image Section */}
          <div className="image-section">
            <div className="image-slider">
              <div className="main-image">
                <img
                  src={imageList[currentImageIndex]}
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => (e.target.src = 'https://placehold.co/400?text=No+Image')}
                />
              </div>
              <div className="thumbnails">
                {imageList.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => handleImageChange(index)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      loading="lazy"
                      onError={(e) => (e.target.src = 'https://placehold.co/100?text=No+Image')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info-card my-5 py-5">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-rating">
              <span className="rating-badge">
                {averageRating}/5 ({reviews.length} reviews)
              </span>
            </div>
            <div className="price-offer">
              <p className="product-price">₹{Number(product.price).toFixed(2)}</p>
              {offerText && <span className="offer-badge">{offerText}%</span>}
            </div>
            <p className={`stock-status ${stockStatus.toLowerCase().replace(' ', '-')}`}>
              {stockStatus} {stockCount > 0 && <span className="stock-count">({stockCount} left)</span>}
            </p>
            {product.sizes && product.sizes.length > 0 && (
              <div className="size-selector">
                <label htmlFor="size">Select Size:</label>
                <select
                  id="size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {product.sizes.map((size, index) => (
                    <option key={index} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="action-buttons">
              {stockCount > 0 ? (
                <>
                  <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    className="btn-buy-now buy-now-mobile"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow}
                  >
                    {isBuyingNow ? 'Processing...' : 'Buy Now'}
                  </button>
                </>
              ) : (
                <button
                  className="btn-notify"
                  onClick={() => setIsNotifyModalOpen(true)}
                >
                  Notify Me
                </button>
              )}
            </div>
            <div className="share-buttons">
              <p>Share this product:</p>
              <button className="share-btn twitter" onClick={() => shareProduct('twitter')}>
                Twitter
              </button>
              <button className="share-btn facebook" onClick={() => shareProduct('facebook')}>
                Facebook
              </button>
              <button className="share-btn whatsapp" onClick={() => shareProduct('whatsapp')}>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="product-details-section">
          <h2>Product Details</h2>
          <div className="details-content">
            <div className="details-row">
              <span className="details-label">Description:</span>
              <span className="details-value">{product.description || 'No description available.'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Category:</span>
              <span className="details-value">{product.category || 'N/A'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Brand:</span>
              <span className="details-value">{product.brand || 'N/A'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Model:</span>
              <span className="details-value">{product.model || 'N/A'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Weight:</span>
              <span className="details-value">{product.weight || 'N/A'} kg</span>
            </div>
            <div className="details-row">
              <span className="details-label">Featured:</span>
              <span className="details-value">{product.featured ? 'Yes' : 'No'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Status:</span>
              <span className="details-value">{product.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews</h2>
          {reviewsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading Reviews...</p>
            </div>
          ) : reviewsError ? (
            <p className="error-text">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p className='no-reviews'>No reviews yet for this product. Be the first to share your thoughts!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.userId?.name || 'Anonymous'}</span>
                    <span className="rating-badge">
                      {review.rating}/5
                    </span>
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

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2>People Also Bought</h2>
            <div className="related-products-grid">
              {relatedProducts.map((related) => (
                <div key={related._id} className="related-product-card">
                  <img
                    src={related.image || 'https://placehold.co/150?text=No+Image'}
                    alt={related.name}
                    loading="lazy"
                    onError={(e) => (e.target.src = 'https://placehold.co/150?text=No+Image')}
                  />
                  <div className="related-product-info">
                    <h3>{related.name}</h3>
                    <p>₹{Number(related.price).toFixed(2)}</p>
                    <button
                      className="btn-quick-view"
                      onClick={() => navigate(`/product/${related._id}`)}
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="recently-viewed-section">
            <h2>Recently Viewed</h2>
            <div className="recently-viewed-grid">
              {recentlyViewed.map((viewed) => (
                <div key={viewed._id} className="recently-viewed-card">
                  <img
                    src={viewed.image || 'https://placehold.co/150?text=No+Image'}
                    alt={viewed.name}
                    loading="lazy"
                    onError={(e) => (e.target.src = 'https://placehold.co/150?text=No+Image')}
                  />
                  <div className="recently-viewed-info">
                    <h3>{viewed.name}</h3>
                    <p>₹{Number(viewed.price).toFixed(2)}</p>
                    <button
                      className="btn-quick-view"
                      onClick={() => navigate(`/product/${viewed._id}`)}
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notify Me Modal */}
      {isNotifyModalOpen && (
        <div className="notify-modal">
          <div className="notify-modal-content">
            <h3>Notify Me When Back in Stock</h3>
            <form onSubmit={handleNotifySubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit" className="btn-submit-notify">
                Submit
              </button>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsNotifyModalOpen(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Action Buttons for Mobile */}
      {stockCount > 0 && (
        <div className="sticky-action-buttons">
          <button
            className="btn-add-to-cart"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            className="btn-buy-now"
            onClick={handleBuyNow}
            disabled={isBuyingNow}
          >
            {isBuyingNow ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;