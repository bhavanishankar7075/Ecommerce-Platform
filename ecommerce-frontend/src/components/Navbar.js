import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

function Navigation() {
  const { user,  } = useAuth();    //logout to add init
  const { cart } = useCart();
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleNavToggle = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const closeNavbar = () => {
    setIsNavCollapsed(true);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">E-Shop</Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={handleNavToggle}
          aria-controls="navbarNav"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isNavCollapsed ? '' : 'show'}`} id="navbarNav">
          <ul className="navbar-nav main-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={closeNavbar}>Home</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/products" onClick={closeNavbar}>Products</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cart" onClick={closeNavbar}>
                    Cart
                    {cartCount > 0 && (
                      <span className="cart-badge ms-1">{cartCount}</span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/checkout" onClick={closeNavbar}>Checkout</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile" onClick={closeNavbar}>Profile</Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav auth-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link welcome-text">
                    Welcome,{ user.fullname ||user.username  || user.email} 
                  </span>
                </li> 
               {/*  <li className="nav-item">
                  <button className="nav-link logout-btn" onClick={() => { logout(); closeNavbar(); }}>
                    Logout
                  </button>
                </li> */} 
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" onClick={closeNavbar}>Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup" onClick={closeNavbar}>Signup</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;











































/* // ecommerce-frontend/src/components/Navigation.js
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

function Navigation() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  console.log('User in Navigation:', user); // Debug
  console.log('Cart in Navigation:', cart); // Debug
 
  return (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">E-Shop</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav main-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/products">Products</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cart">
                    Cart
                    {cartCount > 0 && (
                      <span className="cart-badge ms-1">{cartCount}</span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/checkout">Checkout</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav auth-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link welcome-text">
                    Welcome, {user.username || user.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="nav-link logout-btn" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Signup</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navigation; */




































































/* // ecommerce-frontend/src/components/NavBar.js
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

function Navigation() {
  const { user, logout, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading } = useCart();
  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;

  if (authLoading || cartLoading) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">E-Shop</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav main-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/products">Products</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cart">
                    Cart
                    {cartCount > 0 && (
                      <span className="cart-badge ms-1">{cartCount}</span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/checkout">Checkout</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav auth-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link welcome-text">
                    Welcome, {user.username}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="nav-link logout-btn" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Signup</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navigation; */