// ecommerce-frontend/src/pages/Cart.js
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Cart.css';

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, applyCoupon, coupon, calculateSubtotal, calculateTotal } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (cart.length === 0) {
      setTimeout(() => navigate('/products'), 5000);
    }
  }, [cart, navigate]);

  const deliveryFee = 5.00;
  const subtotal = calculateSubtotal();
  const finalTotal = calculateTotal() + deliveryFee;

  const handleIncrease = (item) => {
    const maxStock = item.stock || 10;
    if (item.quantity < maxStock) {
      updateQuantity(item._id, item.quantity + 1);
    } else {
      alert(`Cannot add more of ${item.name}. Only ${maxStock} in stock.`);
    }
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item._id, item.quantity - 1);
    }
  };

  const handleApplyCoupon = () => {
    applyCoupon(couponCode);
    setCouponCode('');
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { subtotal, discount: coupon ? coupon.discount / 100 : 0, total: finalTotal } });
  };

  return (
    <div className="cart-universe">
      <h1 className="cart-title">Cosmic Cart Orbit</h1>
      {cart.length > 0 ? (
        <div className="cart-container">
          <section className="cart-items">
            {cart.map((item) => (
              <article key={item._id} className="cart-item">
                <img
                  src={item.image || 'https://via.placeholder.com/80'}
                  alt={item.name}
                  className="item-image"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-price">₹{Number(item.price).toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => handleDecrease(item)} className="quantity-btn">-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleIncrease(item)} className="quantity-btn">+</button>
                  </div>
                  <p className="item-subtotal">Subtotal: ₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item._id)}>✖</button>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <div className="coupon-section">
              <input
                type="text"
                placeholder="Enter Cosmic Coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button onClick={handleApplyCoupon} className="apply-btn">Apply</button>
              {coupon && <p className="coupon-success">{coupon.discount}% Off Applied!</p>}
            </div>

            <div className="total-section">
              <div className="total-line">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="total-line discount-line">
                  <span>Discount ({coupon.discount}%)</span>
                  <span>-₹{(subtotal * (coupon.discount / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="total-line final-total">
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={clearCart} className="clear-btn">Clear Orbit</button>
              <button onClick={handleCheckout} className="checkout-btn">Launch Checkout</button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-cart">
          <div className="void-spinner">
            <img
              src="https://img.freepik.com/premium-vector/shopping-ecommerce-graphic-design-with-icons_24911-20665.jpg"
              alt="Empty Cart"
              className="void-image"
              onError={(e) => (e.target.style.display = 'none')}
            />
          </div>
          <p>Your cosmic cart is a void! Exploring in 5 seconds...</p>
          <button onClick={() => navigate('/products')} className="explore-btn">Explore Now</button>
        </div>
      )}
    </div>
  );
}

export default Cart;