// ecommerce-frontend/src/components/Navbar.js
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import '../styles/Navbar.css';

function Navigation() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { products } = useProducts();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;

  // Determine if the current route is Home or a blue-background route
  const isHomeRoute = location.pathname === '/';
  const isBlueBackgroundRoute = ['/products', '/orders'].includes(location.pathname) || location.pathname.startsWith('/product/');

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 576);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filteredProducts.slice(0, 5)); // Limit to 5 results
  }, [searchQuery, products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchResultClick = (productId) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/product/${productId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`flipkart-navbar fixed-top ${isHomeRoute ? 'navbar-white' : 'navbar-blue'}`}>
        <div className="navbar-container">
          {/* Logo */}
          <Link className="navbar-brand" to="/">
            <img src="/logo.png" alt="E-Shop" className="navbar-logo" />
          </Link>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              {/* <i className="fas fa-search search-icon"></i> */}
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(product._id)}
                  >
                    <img
                      src={product.image || 'https://placehold.co/40x40?text=Product'}
                      alt={product.name}
                      className="search-result-image"
                    />
                    <span>{product.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side Navigation (Medium and Desktop) */}
          {!isMobile && (
            <ul className="nav-links">
              {user ? (
                <li className="nav-item account-dropdown">
                  <div className="nav-link account-info">
                    <span>{user.username || user.email || 'Chinnu'}</span>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      Profile
                    </Link>
                    <Link to="/wishlist" className="dropdown-item">
                      Wishlist
                    </Link>
                    <Link to="/orders" className="dropdown-item">
                      Orders
                    </Link>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/signup" className="nav-link">
                      Signup
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link to="/cart" className="nav-link cart-link">
                  <i className="fas fa-shopping-cart"></i>
                  <span>Cart</span>
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
            </ul>
          )}
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <div className="bottom-nav fixed-bottom">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/categories" className={`bottom-nav-item ${location.pathname === '/categories' ? 'active' : ''}`}>
            <i className="fas fa-th"></i>
            <span>Categories</span>
          </Link>
          <Link to="/profile" className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            <i className="fas fa-user"></i>
            <span>Account</span>
          </Link>
          <Link to="/cart" className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}>
            <i className="fas fa-shopping-cart"></i>
            <span>Cart</span>
            {cartCount > 0 && <span className="bottom-nav-count">{cartCount}</span>}
          </Link>
        </div>
      )}
    </>
  );
}

export default Navigation;