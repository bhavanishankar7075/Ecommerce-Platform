import React from 'react';
import { Link } from 'react-router-dom';

const OrderItem = ({
  order,
  item,
  index,
  handleProductClick,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
}) => {
  const key = `${order._id}_${item.productId}`;
  const review = reviews[key];
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const isWishlisted = wishlist.some((w) => {
    const wishlistProductId = w.productId && w.productId._id ? w.productId._id.toString() : null;
    const itemProductId = item.productId ? item.productId.toString() : null;
    return wishlistProductId && itemProductId && wishlistProductId === itemProductId;
  });

  const handleRatingChange = (rating) => {
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  return (
    <div className="order-item-card">
      <img
        src={item.image || '/default-product.jpg'}
        alt={item.name}
        className="item-image"
        onError={(e) => (e.target.src = '/default-product.jpg')}
        onClick={() => handleProductClick(item.productId || 'default')}
      />
      <div className="item-details">
        <span className="item-name">
          <Link to={`/product/${item.productId || 'default'}`}>{item.name}</Link>
        </span>
        <span className="item-quantity">Qty: {item.quantity}</span>
        <span className="item-price">₹{item.price.toFixed(2)}</span>
        <div className="wishlist-section">
          {isWishlisted ? (
            <button
              className="wishlist-btn filled"
              onClick={() => handleRemoveFromWishlist(item.productId)}
            >
              ♥
            </button>
          ) : (
            <button
              className="wishlist-btn"
              onClick={() => handleAddToWishlist(item.productId)}
            >
              ♥
            </button>
          )}
          {wishlistMessages[item.productId] && (
            <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
          )}
        </div>
      </div>




      
      {order.status === 'Delivered' && (
        <div className="review-section">
          {review ? (
            <div className="submitted-review">
              <h4>Your Review</h4>
              <p className="review-rating">{review.rating} ★</p>
              <p className="review-comment">{review.comment}</p>
              <div className="review-actions">
                <button className="edit-review-btn" onClick={toggleReviewForm}>
                  Edit Review
                </button>
                <button
                  className="delete-review-btn"
                  onClick={() => handleDeleteReview(order._id, item.productId)}
                >
                  Delete Review
                </button>
              </div>
            </div>
          ) : (
            <button className="review-btn" onClick={toggleReviewForm}>
              Write a Review
            </button>
          )}
          {data.showForm && (
            <div className="review-form">
              <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
              <div className="form-group">
                <label>Rating</label>
                <select
                  className="rating-dropdown"
                  value={data.rating}
                  onChange={(e) => handleRatingChange(Number(e.target.value))}
                >
                  <option value={0}>Select rating</option>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <option key={star} value={star}>
                      {star} ★
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  className="review-input"
                  value={data.comment}
                  onChange={(e) => setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } })}
                  placeholder="Write your review..."
                />
              </div>
              <button
                className="submit-review-btn"
                onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                disabled={data.loading}
              >
                {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
              </button>
              {data.error && <p className="error-message">{data.error}</p>}
              {data.message && <p className="success-message">{data.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderItem;




























































/* import { useRef } from 'react';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  handleProductClick,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
}) {
  const spinnerRef = useRef(null);

  // Simplify image URL handling; rely on the fallback if the image fails to load
  const imageUrl = item.image || 'https://placehold.co/80x80';
  console.log(`Order item image URL for ${item.name}:`, imageUrl);

  // Use item.productId directly; no fallback to item._id
  const productId = item.productId;
  if (!productId) {
    console.warn(`Missing productId for item in order ${order._id}:`, item);
  }
  const reviewKey = `${order._id}_${productId}`; // Use both orderId and productId as the key
  const reviewState = reviewData[reviewKey] || {
    rating: 0,
    comment: '',
    message: '',
    error: '',
    loading: false,
    showForm: false,
  };
  const existingReview = reviews[reviewKey];

  const toggleReviewForm = () => {
    setReviewData({
      ...reviewData,
      [reviewKey]: {
        ...reviewState,
        showForm: !reviewState.showForm,
        rating: existingReview ? existingReview.rating : 0,
        comment: existingReview ? existingReview.comment : '',
        error: '', // Clear error when toggling the form
        message: '', // Clear message when toggling the form
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [reviewKey]: { ...reviewState, [name]: value, error: '', message: '' },
    });
  };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value);
    setReviewData({
      ...reviewData,
      [reviewKey]: { ...reviewState, rating, error: '', message: '' },
    });
  };

  return (
    <div className="order-item-card">
      <div className="image-container" style={{ position: 'relative', width: '80px', height: '80px' }}>
        <img
          src={imageUrl}
          alt={item.name}
          className="item-image"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'none' }}
          onError={(e) => {
            console.error(`Failed to load image for ${item.name}: ${imageUrl}`);
            e.target.src = 'https://placehold.co/80x80'; // Fallback image
            e.target.style.display = 'block';
            if (spinnerRef.current) {
              spinnerRef.current.style.display = 'none'; // Hide spinner on error
            }
          }}
          onLoad={(e) => {
            console.log(`Successfully loaded image for ${item.name}: ${imageUrl}`);
            e.target.style.display = 'block';
            if (spinnerRef.current) {
              spinnerRef.current.style.display = 'none'; // Hide spinner on load
            }
          }}
          onClick={() => handleProductClick(productId || 'default')}
        />
        <div
          ref={spinnerRef}
          className="image-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'block',
          }}
        >
          <div className="spinner" />
        </div>
      </div>
      <div className="item-details">
        <span className="item-name">{item.name}</span>
        <span className="item-quantity">Qty: {item.quantity}</span>
        <span className="item-price">₹{item.price.toFixed(2)}</span>
      </div>
      {['Delivered', 'Completed'].includes(order.status) && (
        <div className="review-section">
          {existingReview && !reviewState.showForm ? (
            <div className="submitted-review">
              <h4>Your Review for {item.name}</h4>
              <div className="review-rating">
                <span>Rating: {existingReview.rating}/5</span>
              </div>
              <p className="review-comment">
                {existingReview.comment || 'No comment provided.'}
              </p>
              <div className="review-actions">
                <button
                  className="edit-review-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReviewForm();
                  }}
                >
                  Edit Review
                </button>
                <button
                  className="delete-review-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReview(order._id, productId);
                  }}
                >
                  Delete Review
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                className="review-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReviewForm();
                }}
              >
                {reviewState.showForm ? 'Cancel' : existingReview ? 'Edit Review' : 'Add Review'}
              </button>
              {reviewState.showForm && (
                <div className="review-form">
                  <h4>{existingReview ? 'Edit Review' : 'Review'} {item.name}</h4>
                  <div className="form-group">
                    <label htmlFor={`rating-${reviewKey}`}>Rating:</label>
                    <select
                      id={`rating-${reviewKey}`}
                      value={reviewState.rating}
                      onChange={handleRatingChange}
                      className="rating-dropdown"
                    >
                      <option value={0}>Select Rating</option>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor={`comment-${reviewKey}`}>Comment:</label>
                    <textarea
                      id={`comment-${reviewKey}`}
                      name="comment"
                      placeholder="Write your review..."
                      value={reviewState.comment}
                      onChange={handleInputChange}
                      className="review-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="submit-review-btn"
                    onClick={() => handleReviewSubmit(order._id, productId, !!existingReview)}
                    disabled={reviewState.loading || reviewState.rating === 0 || !reviewState.comment.trim()}
                  >
                    {reviewState.loading ? 'Submitting...' : existingReview ? 'Update' : 'Submit'}
                  </button>
                  {reviewState.message && (
                    <p className="success-message">{reviewState.message}</p>
                  )}
                  {reviewState.error && (
                    <p className="error-message">{reviewState.error}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderItem; */