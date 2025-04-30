import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import '../styles/SearchPage.css';

function SearchPage() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Load recent searches from localStorage
  useEffect(() => {
    const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(storedSearches);
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
    setSearchResults(filteredProducts);

    // Update recent searches
    if (searchQuery) {
      const updatedSearches = [
        searchQuery,
        ...recentSearches.filter((item) => item !== searchQuery)
      ].slice(0, 5); // Keep only the last 5 searches
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
    setCurrentPage(1);
  }, [searchQuery, products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = searchResults.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(searchResults.length / productsPerPage);

  if (productsLoading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="container my-5 text-center">
        <h3>Error loading products</h3>
        <p>{productsError}</p>
      </div>
    );
  }

  return (
    <div className="search-page-wrapper">
      <div className="search-page-container">
        {/* Search Bar */}
        <div className="search-page-header">
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search for Products, Brands and More"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="recent-searches-section">
            <div className="recent-searches-header">
              <h3>Recent Searches</h3>
              <button onClick={handleClearRecentSearches} className="clear-recent-btn">
                Clear All
              </button>
            </div>
            <div className="recent-searches-list">
              {recentSearches.map((query, index) => (
                <div
                  key={index}
                  className="recent-search-item"
                  onClick={() => handleRecentSearchClick(query)}
                >
                  {query}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="search-results-section">
            <h3>Search Results for "{searchQuery}"</h3>
            {searchResults.length > 0 ? (
              <>
                <div className="product-list">
                  {currentProducts.map((product) => (
                    <div
                      key={product._id}
                      className="product-item"
                      onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                    >
                      <img
                        src={product.image || 'https://placehold.co/100x100?text=Product'}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/100x100?text=Product';
                        }}
                      />
                      <div className="product-details">
                        <h5>{product.name}</h5>
                        <p className="price">₹{Number(product.price).toFixed(2)}</p>
                        <p className="discount">{product.offer || '10% OFF'}</p>
                        {product.stock !== undefined && (
                          <p className={`stock-info ${product.stock <= 5 ? 'low-stock' : ''}`}>
                            {product.stock <= 5 ? `Hurry! Only ${product.stock} left!` : `In Stock: ${product.stock}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>No products found for "{searchQuery}". Try a different search term.</p>
              </div>
            )}
          </div>
        )}

        {/* Suggested Categories */}
        {!searchQuery && (
          <div className="suggested-categories-section">
            <h3>Explore Popular Categories</h3>
            <div className="category-list">
              {Object.keys({
                Fashion: 'fashion.jpg',
                Electronics: 'electronics.jpg',
                Home: 'home.jpg',
                Mobiles: 'mobiles.jpg'
              }).map((category) => (
                <div
                  key={category}
                  className="category-item"
                  onClick={() => navigate(`/categories?main=${category}`)}
                >
                  <img
                    src={`https://placehold.co/100x100?text=${category}`}
                    alt={category}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100?text=Category';
                    }}
                  />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;