// ecommerce-frontend/src/components/Navbar.js
import { useState, useEffect } from 'react';
import { Link,  } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

function Navigation() {
  const { user,  } = useAuth();
  const { cart } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMedium, setIsMedium] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsMedium(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* const handleLogout = () => {
    logout();
    navigate('/login');
  }; */

  return (
    <nav className="cosmic-navbar fixed-top">
      <div className="navbar-container">
        <Link className="navbar-brand" to="/">
          Cosmic Shop
        </Link>
        <ul className="nav-orbit main-orbit">
          <li className="nav-star">
            <Link to="/" className="nav-link" title="Home">
              <i className="fas fa-home"></i>
              {!isMobile && <span>Home</span>}
            </Link>
          </li>
          {user && (
            <>
              <li className="nav-star">
                <Link to="/products" className="nav-link" title="Products">
                  <i className="fas fa-store"></i>
                  {!isMobile && <span>Products</span>}
                </Link>
              </li>
              <li className="nav-star">
                <Link to="/cart" className="nav-link" title="Cart">
                  <i className="fas fa-shopping-cart"></i>
                  {!isMobile && <span>Cart</span>}
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
              <li className="nav-star">
                <Link to="/checkout" className="nav-link" title="Checkout">
                  <i className="fas fa-credit-card"></i>
                  {!isMobile && <span className='nav-link'>Checkout</span>}
                </Link>
              </li>
              <li className="nav-star">
                <Link to="/profile" className="nav-link" title="Profile">
                  <i className="fas fa-user"></i>
                  {!isMobile && <span>Profile</span>}
                </Link>
              </li>
            </>
          )}
        </ul>
        <ul className="nav-orbit auth-orbit">
          {user ? (
            <>
              <li className="nav-star welcome-star">
                <span className="nav-link" title={`Welcome, ${user.fullname || user.username || user.email}`}>
                  <i className="fas fa-user-astronaut"></i>
                  {!isMobile && <span>{user.fullname || user.username || user.email}</span>}
                </span>
              </li>
              {/* <li className="nav-star">
                <button className="nav-link logout-btn" onClick={handleLogout} title="Logout">
                  <i className="fas fa-sign-out-alt"></i>
                  {!isMobile && <span>Logout</span>}
                </button>
              </li> */}
            </>
          ) : (
            <>
              <li className="nav-star">
                <Link to="/login" className="nav-link" title="Login">
                  <i className="fas fa-sign-in-alt"></i>
                  {!isMobile && <span>Login</span>}
                </Link>
              </li>
              <li className="nav-star">
                <Link to="/signup" className="nav-link" title="Signup">
                  <i className="fas fa-user-plus"></i>
                  {!isMobile && <span>Signup</span>}
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;