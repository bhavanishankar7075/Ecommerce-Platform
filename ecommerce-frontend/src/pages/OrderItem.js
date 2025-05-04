import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
  handleReorder,
  variantDetails,
}) {
  const key = `${order._id}_${item.productId}`;
  const review = reviews ? reviews[key] : null;
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value, 10);
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';
  const isInWishlist = wishlist.some((w) => w.productId?._id?.toString() === item.productId);
  const variantColor = variantDetails?.specifications?.color || 'N/A';

  console.log(`OrderItem rendering for order ID: ${order._id}, navigating to: /order/${order._id}`);
  console.log(`Item details:`, item);

  if (!order._id) {
    console.error('Order ID is missing for item:', item);
    return null;
  }

  return (
    <div className="order-item">
      <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
        <img
          src={variantDetails?.mainImage || item.image || '/default-product.jpg'}
          alt={item.name}
          className="order-item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
        />
      </Link>
      <div className="order-item-details">
        <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="order-item-name">{item.name}</h3>
        </Link>
        <p className="order-item-price">₹{item.price.toFixed(2)}</p>
        {item.size && (
          <p className="variant-info">Size: {item.size}</p>
        )}
        {item.variantId && (
          <p className="variant-info">Color: {variantColor}</p>
        )}
        <p className="order-item-status">
          {order.status} on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="actions-container">
          {index === 0 && (
            <button className="reorder-btn" onClick={() => handleReorder(order)}>
              Reorder
            </button>
          )}
          <div className="wishlist-actions">
            {isInWishlist ? (
              <button
                className="remove-wishlist-btn"
                onClick={() => handleRemoveFromWishlist(item.productId)}
              >
                Remove
              </button>
            ) : (
              <button
                className="add-wishlist-btn"
                onClick={() => handleAddToWishlist(item.productId)}
              >
                Add to Wishlist
              </button>
            )}
            {wishlistMessages[item.productId] && (
              <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
            )}
          </div>
        </div>
        {isDelivered && (
          <div className="review-section">
            {review ? (
              <>
                <div className="review-display">
                  <p>Your Rating: {review.rating} Star{review.rating !== 1 ? 's' : ''}</p>
                  <p>{review.comment}</p>
                </div>
                <button onClick={toggleReviewForm}>Edit Review</button>
                <button onClick={() => handleDeleteReview(order._id, item.productId)}>
                  Delete Review
                </button>
              </>
            ) : (
              <button onClick={toggleReviewForm}>Write a Review</button>
            )}
            {data.showForm && (
              <div className="review-form">
                <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
                <div className="rating">
                  <label htmlFor={`rating-${key}`} className="rating-label">
                    Rating:
                  </label>
                  <select
                    id={`rating-${key}`}
                    value={data.rating}
                    onChange={handleRatingChange}
                    className="rating-dropdown"
                  >
                    <option value="0" disabled>
                      Select a rating
                    </option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <textarea
                  value={data.comment}
                  onChange={handleCommentChange}
                  placeholder="Write your review here..."
                />
                {data.error && <p className="error-message">{data.error}</p>}
                {data.message && <p className="success-message">{data.message}</p>}
                <button
                  onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                  disabled={data.loading}
                >
                  {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </button>
                <button onClick={toggleReviewForm}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItem;















































//main
/* import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
  handleReorder,
}) {
  const key = `${order._id}_${item.productId}`;
  const review = reviews ? reviews[key] : null;
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value, 10);
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';
  const isInWishlist = wishlist.some((w) => w.productId?._id?.toString() === item.productId);

  return (
    <div className="order-item">
      <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
        <img
          src={item.image || '/default-product.jpg'}
          alt={item.name}
          className="order-item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
        />
      </Link>
      <div className="order-item-details">
        <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="order-item-name">{item.name}</h3>
        </Link>
        <p className="order-item-price">₹{item.price.toFixed(2)}</p>
        <p className="order-item-status">
          {order.status} on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="actions-container">
          {index === 0 && (
            <button className="reorder-btn" onClick={() => handleReorder(order)}>
              Reorder
            </button>
          )}
          <div className="wishlist-actions">
            {isInWishlist ? (
              <button
                className="remove-wishlist-btn"
                onClick={() => handleRemoveFromWishlist(item.productId)}
              >
                Remove 
              </button>
            ) : (
              <button
                className="add-wishlist-btn"
                onClick={() => handleAddToWishlist(item.productId)}
              >
                Add to Wishlist
              </button>
            )}
            {wishlistMessages[item.productId] && (
              <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
            )}
          </div>
        </div>
        {isDelivered && (
          <div className="review-section">
            {review ? (
              <>
                <div className="review-display">
                  <p>Your Rating: {review.rating} Star{review.rating !== 1 ? 's' : ''}</p>
                  <p>{review.comment}</p>
                </div>
                <button onClick={toggleReviewForm}>Edit Review</button>
                <button onClick={() => handleDeleteReview(order._id, item.productId)}>
                  Delete Review
                </button>
              </>
            ) : (
              <button onClick={toggleReviewForm}>Write a Review</button>
            )}
            {data.showForm && (
              <div className="review-form">
                <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
                <div className="rating">
                  <label htmlFor={`rating-${key}`} className="rating-label">
                    Rating:
                  </label>
                  <select
                    id={`rating-${key}`}
                    value={data.rating}
                    onChange={handleRatingChange}
                    className="rating-dropdown"
                  >
                    <option value="0" disabled>
                      Select a rating
                    </option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <textarea
                  value={data.comment}
                  onChange={handleCommentChange}
                  placeholder="Write your review here..."
                />
                {data.error && <p className="error-message">{data.error}</p>}
                {data.message && <p className="success-message">{data.message}</p>}
                <button
                  onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                  disabled={data.loading}
                >
                  {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </button>
                <button onClick={toggleReviewForm}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItem; */










































/* // OrderItem.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
  handleReorder,
}) {
  const key = `${order._id}_${item.productId}`;
  const review = reviews ? reviews[key] : null;
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value, 10);
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';
  const isInWishlist = wishlist.some((w) => w.productId?._id?.toString() === item.productId);

  return (
    <div className="order-item">
      <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
        <img
          src={item.image || '/default-product.jpg'}
          alt={item.name}
          className="order-item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
        />
      </Link>
      <div className="order-item-details">
        <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="order-item-name">{item.name}</h3>
        </Link>
        <p className="order-item-price">₹{item.price.toFixed(2)}</p>
        <p className="order-item-status">
          {order.status} on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {index === 0 && (
          <button className="reorder-btn" onClick={() => handleReorder(order)}>
            Reorder
          </button>
        )}
        <div className="wishlist-actions">
          {isInWishlist ? (
            <button
              className="remove-wishlist-btn"
              onClick={() => handleRemoveFromWishlist(item.productId)}
            >
              Remove from Wishlist
            </button>
          ) : (
            <button
              className="add-wishlist-btn"
              onClick={() => handleAddToWishlist(item.productId)}
            >
              Add to Wishlist
            </button>
          )}
          {wishlistMessages[item.productId] && (
            <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
          )}
        </div>
        {isDelivered && (
          <div className="review-section">
            {review ? (
              <>
                <div className="review-display">
                  <p>Your Rating: {review.rating} Star{review.rating !== 1 ? 's' : ''}</p>
                  <p>{review.comment}</p>
                </div>
                <button onClick={toggleReviewForm}>Edit Review</button>
                <button onClick={() => handleDeleteReview(order._id, item.productId)}>
                  Delete Review
                </button>
              </>
            ) : (
              <button onClick={toggleReviewForm}>Write a Review</button>
            )}
            {data.showForm && (
              <div className="review-form">
                <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
                <div className="rating">
                  <label htmlFor={`rating-${key}`} className="rating-label">
                    Rating:
                  </label>
                  <select
                    id={`rating-${key}`}
                    value={data.rating}
                    onChange={handleRatingChange}
                    className="rating-dropdown"
                  >
                    <option value="0" disabled>
                      Select a rating
                    </option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <textarea
                  value={data.comment}
                  onChange={handleCommentChange}
                  placeholder="Write your review here..."
                />
                {data.error && <p className="error-message">{data.error}</p>}
                {data.message && <p className="success-message">{data.message}</p>}
                <button
                  onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                  disabled={data.loading}
                >
                  {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </button>
                <button onClick={toggleReviewForm}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItem; */





















/* // OrderItem.js (Updated)
import React from 'react';
import {  useNavigate } from 'react-router-dom'; // Added useNavigate
import '../styles/OrderItem.css';

const OrderItem = ({
  order,
  item,
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
  handleReorder,
}) => {
  const navigate = useNavigate(); // Added for navigation
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

  const getStatusMessage = () => {
    switch (order.status.toLowerCase()) {
      case 'delivered':
        return `Delivered on ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'cancelled':
        return `Cancelled on ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return `Expected by ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  // Navigate to OrderDetails page when product is clicked
  const handleOrderClick = () => {
    console.log('Navigating to order ID:', order._id);
    navigate(`/order/${order._id}`);
  };

  return (
    <div className="order-item">
      <div className="order-item-content">
        <img
          src={item.image || '/default-product.jpg'}
          alt={item.name}
          className="item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
          onClick={handleOrderClick} // Updated to navigate to OrderDetails
        />
        <div className="item-details">
          <div className="item-details-main">
            <span className="item-name">
              <span onClick={handleOrderClick} style={{ cursor: 'pointer' }}>
                {item.name}
              </span>
            </span>
            <span className="item-price">₹{item.price.toFixed(2)}</span>
            <div className={`status-message status-${order.status.toLowerCase()}`}>
              {getStatusMessage()}
            </div>
          </div>
          <div className="item-actions">
            <button className="reorder-btn" onClick={() => handleReorder(order)}>
              Reorder
            </button>
            <button
              className={`wishlist-btn ${isWishlisted ? 'filled' : ''}`}
              onClick={() =>
                isWishlisted ? handleRemoveFromWishlist(item.productId) : handleAddToWishlist(item.productId)
              }
            >
              ♥
            </button>
            {wishlistMessages[item.productId] && (
              <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
            )}
          </div>
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
                  onChange={(e) =>
                    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } })
                  }
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

export default OrderItem; */


































/* import React from 'react';
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

export default OrderItem; */




























































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