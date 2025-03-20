import { useRef } from 'react';
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
        {/* Loading spinner */}
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
      {/* Show review section for each item if the order is Delivered or Completed */}
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

export default OrderItem;