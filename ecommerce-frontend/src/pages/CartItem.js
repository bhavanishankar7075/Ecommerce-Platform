// ecommerce-frontend/src/pages/CartItem.js
import React from 'react';
import { toast } from 'react-toastify';
import '../styles/CartItem.css';

function CartItem({ item, removeFromCart, updateQuantity, navigate, isSelected, onSelect }) {
  const handleProductClick = () => {
    navigate(`/product/${item.productId?._id || item._id}`);
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item._id);
    } catch (err) {
      toast.error('Failed to remove item.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleIncrease = async () => {
    try {
      await updateQuantity(item._id, item.quantity + 1);
    } catch (err) {
      // Removed toast notification
      console.error('Failed to increase quantity:', err);
    }
  };

  const handleDecrease = async () => {
    if (item.quantity <= 1) {
      await handleRemove();
      return;
    }
    try {
      await updateQuantity(item._id, item.quantity - 1);
    } catch (err) {
      // Removed toast notification
      console.error('Failed to decrease quantity:', err);
    }
  };

  return (
    <div className="cart-item">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="cart-item-checkbox"
      />
      <div className="cart-item-image" onClick={handleProductClick}>
        <img
          src={item.productId?.image || 'https://placehold.co/100x100?text=No+Image'}
          alt={item.productId?.name || 'Product'}
          onError={(e) => {
            e.target.src = 'https://placehold.co/100x100?text=No+Image';
          }}
        />
      </div>
      <div className="cart-item-details">
        <h5 onClick={handleProductClick}>{item.productId?.name || 'Unknown Product'}</h5>
        <p className="seller-info">Seller: RetailNet</p>
        {item.inStock !== false ? (
          <div className="price-section">
            <span className="price">₹{Number(item.productId?.price || 0).toFixed(2)}</span>
            <span className="original-price">₹{(Number(item.productId?.price || 0) * 1.9).toFixed(2)}</span>
            <span className="discount">90% off</span>
          </div>
        ) : (
          <p className="out-of-stock">Out of Stock</p>
        )}
        <div className="quantity-section">
          <button onClick={handleDecrease} disabled={item.quantity <= 1}>-</button>
          <span>{item.quantity}</span>
          <button onClick={handleIncrease} disabled={item.inStock === false}>+</button>
        </div>
        <div className="cart-item-actions">
          <button onClick={handleRemove} className="action-btn">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;










































/* import React from 'react';
import { toast } from 'react-toastify';
import '../styles/CartItem.css';

function CartItem({ item, removeFromCart, updateQuantity }) {
  // Log the item to debug the image field
  console.log('Cart item:', item);

  const handleRemove = async () => {
    try {
      await removeFromCart(item._id);
    } catch (err) {
      toast.error('Failed to remove item.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleIncrease = async () => {
    try {
      await updateQuantity(item._id, item.quantity + 1);
    } catch (err) {
      toast.error('Failed to increase quantity.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleDecrease = async () => {
    if (item.quantity <= 1) {
      await handleRemove();
      return;
    }
    try {
      await updateQuantity(item._id, item.quantity - 1);
    } catch (err) {
      toast.error('Failed to decrease quantity.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="cart-item">
      <img
        src={item.productId?.image || 'https://placehold.co/50?text=No+Image'}
        alt={item.productId?.name || 'Product'}
        className="cart-item-image"
        onError={(e) => {
          e.target.src = 'https://placehold.co/50?text=No+Image'; // Fallback if image fails to load
          e.target.style.display = 'block';
        }}
      />
      <div className="cart-item-details">
        <h3>{item.productId?.name || 'Unknown Product'}</h3>
        <p>Price: ₹{item.productId?.price?.toFixed(2) || 0}</p>
        <div className="quantity-controls">
          <button onClick={handleDecrease}>-</button>
          <span>{item.quantity}</span>
          <button onClick={handleIncrease}>+</button>
        </div>
      </div>
      <button onClick={handleRemove} className="remove-btn">Remove</button>
    </div>
  );
}

export default CartItem; */




































/* import { useRef } from 'react';

function CartItem({ item, removeFromCart, updateQuantity }) {
  // useRef is now at the top level of the component
  const spinnerRef = useRef(null);

  const imageUrl = item.image
    ? item.image.startsWith('http://') || item.image.startsWith('https://')
      ? item.image
      : `http://localhost:5001/${item.image.replace(/^\/+/, '')}`
    : 'https://placehold.co/80x80';
  console.log(`Image URL for ${item.name}:`, imageUrl);

  const handleIncrease = () => {
    const maxStock = item.stock || 10;
    if (item.quantity < maxStock) {
      updateQuantity(item.productId, item.quantity + 1);
    } else {
      alert(`Cannot add more of ${item.name}. Only ${maxStock} in stock.`);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };

  return (
    <article className="cart-item">
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
          <div style={{ border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
      <div className="item-details">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-price">₹{Number(item.price).toFixed(2)}</p>
        <div className="quantity-controls">
          <button onClick={handleDecrease} className="quantity-btn">-</button>
          <span>{item.quantity}</span>
          <button onClick={handleIncrease} className="quantity-btn">+</button>
        </div>
        <p className="item-subtotal">Subtotal: ₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
      </div>
      <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>✖</button>
    </article>
  );
}

export default CartItem; */