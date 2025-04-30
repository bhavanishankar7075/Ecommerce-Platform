import React from 'react';
import '../styles/CheckoutItem.css';

function CheckoutItem({ item, handleQuantityChange }) {
  // Log the item to debug the fields
  console.log('Checkout item:', item);

  const handleIncrease = () => {
    handleQuantityChange(item, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      handleQuantityChange(item, item.quantity - 1);
    }
  };

  return (
    <div className="checkout-item">
      <img
        src={item.productId?.image || 'https://placehold.co/50?text=No+Image'}
        alt={item.productId?.name || 'Product'}
        className="checkout-item-image"
        onError={(e) => {
          e.target.src = 'https://placehold.co/50?text=No+Image';
          e.target.style.display = 'block';
        }}
      />
      <div className="checkout-item-details">
        <h3>{item.productId?.name || 'Unknown Product'}</h3>
        {item.selectedSize && (
          <p className="variant-info">Size: {item.selectedSize}</p>
        )}
        <p className="price-info">Price: ₹{item.productId?.price?.toFixed(2) || 0}</p>
        {item.productId?.stock && (
          <p className={`stock-info ${item.productId.stock <= 5 ? 'low-stock' : ''}`}>
            {item.productId.stock <= 5 ? `Hurry! Only ${item.productId.stock} left!` : `In Stock: ${item.productId.stock}`}
          </p>
        )}
        <div className="quantity-controls">
          <button
            onClick={handleDecrease}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.productId?.name || 'product'}`}
          >
            -
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={handleIncrease}
            disabled={item.productId?.stock && item.quantity >= item.productId.stock}
            aria-label={`Increase quantity of ${item.productId?.name || 'product'}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutItem;






























/* import React from 'react';
import '../styles/CheckoutItem.css';

function CheckoutItem({ item, handleQuantityChange }) {
  // Log the item to debug the fields
  console.log('Checkout item:', item);

  const handleIncrease = () => {
    handleQuantityChange(item, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      handleQuantityChange(item, item.quantity - 1);
    }
  };

  return (
    <div className="checkout-item">
      <img
        src={item.productId?.image || 'https://placehold.co/50?text=No+Image'}
        alt={item.productId?.name || 'Product'}
        className="checkout-item-image"
        onError={(e) => {
          e.target.src = 'https://placehold.co/50?text=No+Image'; // Fallback if image fails to load
          e.target.style.display = 'block';
        }}
      />
      <div className="checkout-item-details">
        <h3>{item.productId?.name || 'Unknown Product'}</h3>
        <p>Price: ₹{item.productId?.price?.toFixed(2) || 0}</p>
        <div className="quantity-controls">
          <button onClick={handleDecrease} disabled={item.quantity <= 1}>-</button>
          <span>{item.quantity}</span>
          <button onClick={handleIncrease}>+</button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutItem; */







































/* import { useRef } from 'react';

function CheckoutItem({ item, handleQuantityChange }) {
  // useRef is now at the top level of the component
  const spinnerRef = useRef(null);

  const imageUrl = item.image
    ? item.image.startsWith('http://') || item.image.startsWith('https://')
      ? item.image
      : `http://localhost:5001/${item.image.replace(/^\/+/, '')}`
    : 'https://placehold.co/80x80';
  console.log(`Checkout image URL for ${item.name}:`, imageUrl);

  return (
    <div className="cart-planet">
      <div className="image-container" style={{ position: 'relative', width: '80px', height: '80px' }}>
        <img
          src={imageUrl}
          alt={item.name}
          className="planet-img"
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
      <div className="planet-info">
        <p>{item.name}</p>
        <p>₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
        <div className="quantity-controls">
          <button onClick={() => handleQuantityChange(item, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => handleQuantityChange(item, item.quantity + 1)}>+</button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutItem; */