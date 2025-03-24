import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify'; // Import Toast for notifications
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ProductDetails.css';

function ProductDetails() {
  const { id } = useParams();
  const { products, loading, error: productsError } = useProducts();
  const { addToCart } = useCart();
  const { user, loading: authLoading, logout } = useAuth(); // Get user and token from AuthContext
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [email, setEmail] = useState('');

  const product = products.find((p) => p._id === id);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading

    if (!user) {
      // If user is not logged in, redirect to login
      navigate('/login');
      return;
    }

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
      // Check if product is in wishlist
      fetchWishlist();
    }
  }, [product, id, user, authLoading, navigate]);

  const fetchWishlist = async () => {
    if (!user || !user._id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/wishlist/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Check if the current product is in the wishlist
      const isProductInWishlist = res.data.some((item) => item.productId?._id === id);
      setIsInWishlist(isProductInWishlist);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load wishlist status.');
      }
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const res = await axios.get(`http://localhost:5001/api/reviews/product/${id}`);
      if (!Array.isArray(res.data)) {
        setReviews([]);
        setAverageRating(0);
        setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setReviewsLoading(false);
        setReviewsError(res.data.message || 'Failed to load reviews. Please try again.');
        return;
      }
      setReviews(res.data);
      calculateAverageRating(res.data);
      calculateRatingBreakdown(res.data);
      setReviewsLoading(false);
    } catch (err) {
      setReviewsError(err.response?.data?.message || 'Failed to load reviews. Please try again later.');
      setReviews([]);
      setAverageRating(0);
      setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
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

  const calculateRatingBreakdown = (reviews) => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
    });
    setRatingBreakdown(breakdown);
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
    console.log(`Notification requested for ${email} when ${product.name} is back in stock.`);
    setIsNotifyModalOpen(false);
    setEmail('');
    alert('You will be notified when this product is back in stock!');
  };

  const handleWishlistToggle = async () => {
    if (!user || !user._id) {
      toast.error('Please log in to add items to your wishlist.');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isInWishlist) {
        // Remove from wishlist
        const wishlistItem = await axios.get(`http://localhost:5001/api/wishlist/user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const itemToRemove = wishlistItem.data.find((item) => item.productId?._id === id);
        if (itemToRemove) {
          await axios.delete(`http://localhost:5001/api/wishlist/${itemToRemove._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsInWishlist(false);
          toast.success('Removed from wishlist!');
        }
      } else {
        // Add to wishlist
        await axios.post(
          'http://localhost:5001/api/wishlist',
          { userId: user._id, productId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update wishlist.');
      }
    }
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

  if (authLoading || loading) {
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
      ? [product.image, ...product.images]
      : [product.image || 'https://placehold.co/400?text=No+Image'];

  const stockStatus = stockCount > 5 ? 'In Stock' : stockCount > 0 ? 'Low Stock' : 'Out of Stock';
  const relatedProducts = products
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 3);

  const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    .filter((pid) => pid !== id)
    .map((pid) => products.find((p) => p._id === pid))
    .filter(Boolean);

  const offerText = product.offer ? product.offer : '45% OFF';
  const originalPrice = product.price / (1 - parseFloat(offerText) / 100);

  return (
    <div className="product-details-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="product-details-wrapper">
        {/* Back to Products Link */}
        <div className="back-to-products">
          <button className="btn-back-to-products" onClick={() => navigate('/products')}>
            ← Back to Products
          </button>
        </div>

        {/* Main Product Section */}
        <div className="product-main">
          {/* Image Section */}
          <div className="image-section">
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
            <div className="main-image">
              <img
                src={imageList[currentImageIndex]}
                alt={product.name}
                loading="lazy"
                onError={(e) => (e.target.src = 'https://placehold.co/400?text=No+Image')}
              />
              <div className="action-buttons-mobile">
                {stockCount > 0 ? (
                  <>
                    <button
                      className="add-to-cart"
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
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title1">{product.name}</h1>
              <button
                className={`wishlist-icon ${isInWishlist ? 'in-wishlist' : ''}`}
                onClick={handleWishlistToggle}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                {isInWishlist ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#d32f2f"
                    stroke="#d32f2f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#212121"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                )}
              </button>
            </div>
            <div className="product-rating">
              <span className="rating-badge">
                {averageRating} ★ ({reviews.length} Ratings & {reviews.length} Reviews)
              </span>
            </div>
            <div className="price-section">
              <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
              <span className="original-price">₹{Number(originalPrice).toFixed(2)}</span>
              <span className="discount">{offerText}</span>
            </div>
            <p className={`stock-status ${stockStatus.toLowerCase().replace(' ', '-')}`}>
              {stockStatus} {stockCount > 0 && <span>({stockCount} left)</span>}
            </p>
            {product.sizes && product.sizes.length > 0 && (
              <div className="size-selector">
                <label>Size: </label>
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
            <div className="action-buttons">
              {stockCount > 0 ? (
                <>
                  <button
                    className="add-to-cart"
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
            <div className="share-section">
              <div className="share-buttons">
                <p>Share:</p>
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
          <h2>Ratings & Reviews</h2>
          {reviewsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading Reviews...</p>
            </div>
          ) : reviewsError ? (
            <p className="error-text">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet for this product. Be the first to share your thoughts!</p>
          ) : (
            <>
              <div className="rating-summary">
                <div className="average-rating">
                  <span>{averageRating} ★</span>
                  <p>{reviews.length} Ratings & {reviews.length} Reviews</p>
                </div>
                <div className="rating-breakdown">
                  <p>5★: {ratingBreakdown[5]}</p>
                  <p>4★: {ratingBreakdown[4]}</p>
                  <p>3★: {ratingBreakdown[3]}</p>
                  <p>2★: {ratingBreakdown[2]}</p>
                  <p>1★: {ratingBreakdown[1]}</p>
                </div>
              </div>
              <div className="reviews-list">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">{review.userId?.name || 'Anonymous'}</span>
                      <span className="rating-badge">{review.rating} ★</span>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="review-comment">{review.comment || 'No comment provided.'}</p>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <button
                    className="view-all-reviews"
                    onClick={() => navigate(`/product/${id}/reviews`)}
                  >
                    View All Reviews
                  </button>
                )}
              </div>
            </>
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
    </div>
  );
}

export default ProductDetails;