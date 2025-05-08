import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItem from './CartItem';
import '../styles/Cart.css';

function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { cart: rawCart, removeFromCart, updateQuantity, clearCart, applyCoupon, coupon, calculateSubtotal, calculateTotal } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // State for selected items

  // Ensure cart is always an array, even if undefined
  const cart = Array.isArray(rawCart) ? rawCart : [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let timer;
    if (cart.length === 0 && !authLoading) {
      timer = setTimeout(() => navigate('/products'), 5000);
    }
    return () => clearTimeout(timer);
  }, [cart, navigate, authLoading]);

  // Calculate subtotal first
  const subtotal = calculateSubtotal();
  // Now use subtotal to calculate deliveryFee
  const deliveryFee = subtotal < 500 ? 5.00 : 0; // Free delivery if subtotal >= ₹500
  const finalTotal = calculateTotal() + deliveryFee;

  const handleApplyCoupon = () => {
    try {
      applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      toast.error('Failed to apply coupon.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setSelectedItems([]);
    } catch (err) {
      toast.error('Failed to clear cart.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleBulkRemove = async () => {
    try {
      for (const itemId of selectedItems) {
        await removeFromCart(itemId);
      }
      setSelectedItems([]);
      toast.success('Selected items removed.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      toast.error('Failed to remove selected items.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cart.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { subtotal, discount: coupon ? coupon.discount / 100 : 0, total: finalTotal } });
  };

  if (authLoading) {
    return (
      <div className="cart-container my-5 text-center cart-loading">
        <h1 className="cart-title">My Cart</h1>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="cart-container my-5 py-5">
      <h1 className="cart-title">My Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</h1>
      {cart.length > 0 ? (
        <div className="cart-content">
          {/* Cart Items */}
          <section className="cart-items">
            <div className="cart-items-header">
              <input
                type="checkbox"
                checked={selectedItems.length === cart.length && cart.length > 0}
                onChange={handleSelectAll}
              />
              <span>Select All ({selectedItems.length}/{cart.length})</span>
              {selectedItems.length > 0 && (
                <button onClick={handleBulkRemove} className="bulk-remove-btn">
                  Remove Selected
                </button>
              )}
            </div>
            {cart.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                navigate={navigate}
                isSelected={selectedItems.includes(item._id)}
                onSelect={() => handleSelectItem(item._id)}
              />
            ))}
          </section>

          {/* Price Summary */}
          <aside className="cart-summary">
            <h2 className="summary-title">PRICE DETAILS</h2>
            <div className="coupon-section">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button onClick={handleApplyCoupon} className="apply-btn">Apply</button>
              {coupon && <p className="coupon-success">{coupon.discount}% Off Applied!</p>}
            </div>
            <div className="total-section ">
              <div className="total-line">
                <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="total-line discount-line">
                  <span>Discount ({coupon.discount}%)</span>
                  <span>-₹{(subtotal * (coupon.discount / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Platform Fee</span>
                <span>₹3.00</span>
              </div>
              <div className="total-line">
                <span>Delivery Charges</span>
                <span className={deliveryFee > 0 ? '' : 'free-delivery'}>₹{deliveryFee.toFixed(2)}{deliveryFee === 0 && ' Free'}</span>
              </div>
            </div>
            {coupon && (
              <p className="savings-message">
                You will save ₹{(subtotal * (coupon.discount / 100)).toFixed(2)} on this order
              </p>
            )}
            {subtotal < 500 && (
              <p className="free-delivery-threshold">
                Add ₹{(500 - subtotal).toFixed(2)} more to get free delivery
              </p>
            )}
            <div className="secure-payment ">
              <i className="fas fa-shield-alt"></i>
              <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
            </div>
            {/* Sticky Footer Container for Mobile */}
            <div className="sticky-footer">
              <div className="total-line final-total">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="place-order-btn">Place Order</button>
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
              onError={(e) => {
                e.target.src = 'https://placehold.co/150x150';
                e.target.style.display = 'block';
              }}
            />
          </div>
          <p>Your cart is empty! Exploring in 5 seconds...</p>
          <button onClick={() => navigate('/products')} className="explore-btn">Explore Now</button>
        </div>
      )}
    </div>
  );
}

export default Cart;























//main
/* import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItem from './CartItem';
import '../styles/Cart.css';

function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { cart: rawCart, removeFromCart, updateQuantity, clearCart, applyCoupon, coupon, calculateSubtotal, calculateTotal } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // State for selected items

  // Ensure cart is always an array, even if undefined
  const cart = Array.isArray(rawCart) ? rawCart : [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let timer;
    if (cart.length === 0 && !authLoading) {
      timer = setTimeout(() => navigate('/products'), 5000);
    }
    return () => clearTimeout(timer);
  }, [cart, navigate, authLoading]);

  // Calculate subtotal first
  const subtotal = calculateSubtotal();
  // Now use subtotal to calculate deliveryFee
  const deliveryFee = subtotal < 500 ? 5.00 : 0; // Free delivery if subtotal >= ₹500
  const finalTotal = calculateTotal() + deliveryFee;

  const handleApplyCoupon = () => {
    try {
      applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      toast.error('Failed to apply coupon.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setSelectedItems([]);
    } catch (err) {
      toast.error('Failed to clear cart.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleBulkRemove = async () => {
    try {
      for (const itemId of selectedItems) {
        await removeFromCart(itemId);
      }
      setSelectedItems([]);
      toast.success('Selected items removed.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      toast.error('Failed to remove selected items.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cart.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { subtotal, discount: coupon ? coupon.discount / 100 : 0, total: finalTotal } });
  };

  if (authLoading) {
    return (
      <div className="cart-container my-5 text-center">
        <h1 className="cart-title">My Cart</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="cart-container my-5 py-5">
      <h1 className="cart-title">My Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</h1>
      {cart.length > 0 ? (
        <div className="cart-content">
          <section className="cart-items">
            <div className="cart-items-header">
              <input
                type="checkbox"
                checked={selectedItems.length === cart.length && cart.length > 0}
                onChange={handleSelectAll}
              />
              <span>Select All ({selectedItems.length}/{cart.length})</span>
              {selectedItems.length > 0 && (
                <button onClick={handleBulkRemove} className="bulk-remove-btn">
                  Remove Selected
                </button>
              )}
            </div>
            {cart.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                navigate={navigate}
                isSelected={selectedItems.includes(item._id)}
                onSelect={() => handleSelectItem(item._id)}
              />
            ))}
          </section>

          <aside className="cart-summary">
            <h2 className="summary-title">PRICE DETAILS</h2>
            <div className="coupon-section">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button onClick={handleApplyCoupon} className="apply-btn">Apply</button>
              {coupon && <p className="coupon-success">{coupon.discount}% Off Applied!</p>}
            </div>
            <div className="total-section ">
              <div className="total-line">
                <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="total-line discount-line">
                  <span>Discount ({coupon.discount}%)</span>
                  <span>-₹{(subtotal * (coupon.discount / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Platform Fee</span>
                <span>₹3.00</span>
              </div>
              <div className="total-line">
                <span>Delivery Charges</span>
                <span className={deliveryFee > 0 ? '' : 'free-delivery'}>₹{deliveryFee.toFixed(2)}{deliveryFee === 0 && ' Free'}</span>
              </div>
            </div>
            {coupon && (
              <p className="savings-message">
                You will save ₹{(subtotal * (coupon.discount / 100)).toFixed(2)} on this order
              </p>
            )}
            {subtotal < 500 && (
              <p className="free-delivery-threshold">
                Add ₹{(500 - subtotal).toFixed(2)} more to get free delivery
              </p>
            )}
            <div className="secure-payment ">
              <i className="fas fa-shield-alt"></i>
              <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
            </div>
            <div className="sticky-footer">
              <div className="total-line final-total">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="place-order-btn">Place Order</button>
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
              onError={(e) => {
                e.target.src = 'https://placehold.co/150x150';
                e.target.style.display = 'block';
              }}
            />
          </div>
          <p>Your cart is empty! Exploring in 5 seconds...</p>
          <button onClick={() => navigate('/products')} className="explore-btn">Explore Now</button>
        </div>
      )}
    </div>
  );
}

export default Cart; */





















































/* import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CartItem from '../pages/CartItem';
import '../styles/Cart.css';

function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, applyCoupon, coupon, calculateSubtotal, calculateTotal } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]); 

  useEffect(() => {
    if (cart.length === 0 && !authLoading) {
      setTimeout(() => navigate('/products'), 5000);
    }
  }, [cart, navigate, authLoading]);

  const deliveryFee = 5.00;
  const subtotal = calculateSubtotal();
  const finalTotal = calculateTotal() + deliveryFee;

  const handleApplyCoupon = () => {
    applyCoupon(couponCode);
    setCouponCode('');
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { subtotal, discount: coupon ? coupon.discount / 100 : 0, total: finalTotal } });
  };

  if (authLoading) {
    return (
      <div className="cart-universe">
        <h1 className="cart-title">Cosmic Cart Orbit</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="cart-universe">
      <h1 className="cart-title">Cosmic Cart Orbit</h1>
      {cart.length > 0 ? (
        <div className="cart-container">
          <section className="cart-items">
            {cart.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
              />
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
              onError={(e) => {
                e.target.src = 'https://placehold.co/150x150'; // Fallback for empty cart image
                e.target.style.display = 'block';
              }}
            />
          </div>
          <p>Your cosmic cart is a void! Exploring in 5 seconds...</p>
          <button onClick={() => navigate('/products')} className="explore-btn">Explore Now</button>
        </div>
      )}
    </div>
  );
}

export default Cart; */




















































/* // ecommerce-frontend/src/pages/Cart.js
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

export default Cart; */