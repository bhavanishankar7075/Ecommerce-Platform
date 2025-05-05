import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import logoBlue from '../assets/logo-blue.png';
import logoWhite from '../assets/logo-white.png';
import '../styles/Navbar.css';

function Navigation() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { products } = useProducts();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;

  const isHomeRoute = location.pathname === '/';
  const isBlueBackgroundRoute = ['/products', '/orders'].includes(location.pathname) || location.pathname.startsWith('/product/');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 576);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filteredProducts.slice(0, 5));
  }, [searchQuery, products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClick = () => {
    navigate('/search', { state: { searchQuery } });
    setSearchQuery('');
    setSearchResults([]);
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

  const handleBottomNavClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryHierarchy = {
    Fashion: {
      Men: [
        'Top Wear', 'Bottom Wear', 'Casual Shoes', 'Watches', 'Ethnic', 'Sports Shoes',
        'Luggage', 'Trimmers', 'Essentials', 'Men Grooming'
      ],
      Women: ['Dresses', 'Top Wear', 'Footwear', 'Jewelry', 'Handbags', 'Accessories'],
      Beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrances']
    },
    Gadgets: {
      Accessories: ['Phone Cases', 'Chargers', 'Headphones'],
      SmartDevices: ['Smartwatches', 'Speakers', 'Cameras']
    },
    Electronics: {
      Audio: ['Headphones', 'Speakers', 'Earphones'],
      Computing: ['Laptops', 'Desktops', 'Monitors']
    },
    Home: {
      Decor: ['Wall Art', 'Rugs', 'Lighting'],
      Kitchen: ['Appliances', 'Utensils', 'Cookware']
    },
    Mobiles: {
      Brands: ['Samsung', 'Apple', 'Xiaomi', 'OnePlus']
    },
    Appliances: {
      Small: ['Microwave', 'Toaster', 'Blender'],
      Large: ['Refrigerator', 'Washing Machine', 'Air Conditioner']
    },
    Furniture: {
      Living: ['Sofas', 'Tables', 'Chairs'],
      Bedroom: ['Beds', 'Wardrobes', 'Mattresses']
    }
  };

  const mainCategories = Object.keys(categoryHierarchy);

  return (
    <>
      <nav className={`flipkart-navbar fixed-top ${isHomeRoute ? 'navbar-white' : 'navbar-blue'}`}>
        <div className="navbar-container">
          <Link className="navbar-brand" to="/">
            <img
              src={isHomeRoute ? logoBlue : logoWhite}
              alt="E-Shop"
              className="navbar-logo"
            />
          </Link>

          <div className="search-container1">
            <div className="search-bar1">
              <input
                type="text"
                placeholder="Search for Products, Brands and More"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleSearchClick}
                className="search-input1"
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

      {!isMobile && (
        <div className="mini-navbar">
          <ul className="mini-nav-links">
            {mainCategories.map((category) => (
              <li
                key={category}
                className="mini-nav-item"
                onMouseEnter={() => setHoveredCategory(category)}
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="mini-nav-link"
                >
                  {category}
                </Link>
                {hoveredCategory === category && (
                  <div className="mini-dropdown">
                    {Object.keys(categoryHierarchy[category]).map((subcategory) => (
                      <div
                        key={subcategory}
                        className="mini-dropdown-item"
                        onMouseEnter={() => setHoveredSubcategory(subcategory)}
                        onMouseLeave={() => setHoveredSubcategory(null)}
                      >
                        <Link
                          to={`/products?category=${encodeURIComponent(`${category}/${subcategory}`)}`}
                          className="mini-dropdown-link"
                        >
                          {subcategory}
                        </Link>
                        {hoveredSubcategory === subcategory && (
                          <div className="nested-dropdown">
                            {categoryHierarchy[category][subcategory].map((nestedCategory) => (
                              <Link
                                key={nestedCategory}
                                to={`/products?category=${encodeURIComponent(`${category}/${subcategory}/${nestedCategory}`)}`}
                                className="nested-dropdown-item"
                              >
                                {nestedCategory}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMobile && (
        <div className="bottom-nav fixed-bottom">
          <Link
            to="/"
            className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link
            to="/categories"
            className={`bottom-nav-item ${location.pathname === '/categories' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/categories')}
          >
            <i className="fas fa-th"></i>
            <span>Categories</span>
          </Link>
          <Link
            to="/profile"
            className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/profile')}
          >
            <i className="fas fa-user"></i>
            <span>Account</span>
          </Link>
          <Link
            to="/cart"
            className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/cart')}
          >
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



























































/* // ecommerce-frontend/src/components/Navbar.js
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

  // Handle bottom nav click to scroll to top
  const handleBottomNavClick = (path) => {
    // Navigate to the path
    navigate(path);
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className={`flipkart-navbar fixed-top ${isHomeRoute ? 'navbar-white' : 'navbar-blue'}`}>
        <div className="navbar-container">
          <Link className="navbar-brand" to="/">
            <img
              src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fkheaderlogo_plus-055f80.svg"
              alt="E-Shop"
              className="navbar-logo"
            />
          </Link>

          <div className="search-container1">
            <div className="search-bar1">
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

      {isMobile && (
        <div className="bottom-nav fixed-bottom">
          <Link
            to="/"
            className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link
            to="/categories"
            className={`bottom-nav-item ${location.pathname === '/categories' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/categories')}
          >
            <i className="fas fa-th"></i>
            <span>Categories</span>
          </Link>
          <Link
            to="/profile"
            className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/profile')}
          >
            <i className="fas fa-user"></i>
            <span>Account</span>
          </Link>
          <Link
            to="/cart"
            className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/cart')}
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Cart</span>
            {cartCount > 0 && <span className="bottom-nav-count">{cartCount}</span>}
          </Link>
        </div>
      )}
    </>
  );
}

export default Navigation; */



























































/* // ecommerce-frontend/src/components/Navbar.js
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

  // Handle bottom nav click to scroll to top
  const handleBottomNavClick = (path) => {
    // Navigate to the path
    navigate(path);
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className={`flipkart-navbar fixed-top ${isHomeRoute ? 'navbar-white' : 'navbar-blue'}`}>
        <div className="navbar-container">
          <Link className="navbar-brand" to="/">
            <img
              src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fkheaderlogo_plus-055f80.svg"
              alt="E-Shop"
              className="navbar-logo"
            />
          </Link>

          <div className="search-container1">
            <div className="search-bar1">
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

      {isMobile && (
        <div className="bottom-nav fixed-bottom">
          <Link
            to="/"
            className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link
            to="/categories"
            className={`bottom-nav-item ${location.pathname === '/categories' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/categories')}
          >
            <i className="fas fa-th"></i>
            <span>Categories</span>
          </Link>
          <Link
            to="/profile"
            className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/profile')}
          >
            <i className="fas fa-user"></i>
            <span>Account</span>
          </Link>
          <Link
            to="/cart"
            className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}
            onClick={() => handleBottomNavClick('/cart')}
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Cart</span>
            {cartCount > 0 && <span className="bottom-nav-count">{cartCount}</span>}
          </Link>
        </div>
      )}
    </>
  );
}

export default Navigation; */