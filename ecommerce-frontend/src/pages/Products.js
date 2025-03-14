// ecommerce-frontend/src/pages/ProductList.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import '../styles/Products.css';

function ProductList() {
  const { products, loading, error: productsError } = useProducts();
  const { addToCart } = useCart();
  const [filtered, setFiltered] = useState([]);
  const [sort, setSort] = useState(localStorage.getItem('sort') || '');
  const [searchQuery, setSearchQuery] = useState(localStorage.getItem('searchQuery') || '');
  const [categoryFilter, setCategoryFilter] = useState(localStorage.getItem('categoryFilter') || '');
  const [priceRange, setPriceRange] = useState(
    JSON.parse(localStorage.getItem('priceRange')) || [0, 10000]
  );
  const [inStockOnly, setInStockOnly] = useState(
    localStorage.getItem('inStockOnly') === 'true' || false
  );
  const [visibleCount, setVisibleCount] = useState(12);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000); // Dynamic max price
  const [categories, setCategories] = useState(['']); // Dynamic categories
  const navigate = useNavigate();
  const location = useLocation();

  const titles = [
    'Explore Galactic Wonders',
    'Discover Cosmic Treasures',
    'Unveil Stellar Deals',
    'Journey Through Products',
  ];

  const premiumDeals = [
    '50% Off Electronics - Limited Time!',
    'Free Shipping on Jewelry Orders!',
    'Premium Pets Collection Now Available!',
    'Exclusive Home Deals - Save Big!',
  ];

  // Handle URL query params (e.g., /products?category=electronics)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setCategoryFilter(category);
      localStorage.setItem('categoryFilter', category);
    }
  }, [location.search]);

  // Initialize filtered products and compute dynamic categories and max price
  useEffect(() => {
    if (!loading && products.length > 0) {
      setFiltered([...products]);

      // Compute unique categories
      const uniqueCategories = ['', ...new Set(products.map(p => p.category || 'Uncategorized'))];
      setCategories(uniqueCategories);

      // Compute max price for price range
      const prices = products.map(p => Number(p.price) || 0);
      const max = Math.ceil(Math.max(...prices) / 100) * 100; // Round up to nearest 100
      setMaxPrice(max || 10000);
      setPriceRange(prev => [prev[0], Math.min(prev[1], max)]);
    }
  }, [products, loading]);

  // Rotate titles
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [titles.length]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const applyFilters = useCallback(() => {
    let updatedProducts = [...products];

    if (searchQuery) {
      updatedProducts = updatedProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (categoryFilter && categoryFilter !== '') {
      updatedProducts = updatedProducts.filter((product) => product.category === categoryFilter);
    }

    updatedProducts = updatedProducts.filter(
      (product) => Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1]
    );

    if (inStockOnly) {
      updatedProducts = updatedProducts.filter((product) => (product.stock || 0) > 0);
    }

    if (sort === 'price-asc') {
      updatedProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-desc') {
      updatedProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'name-asc') {
      updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFiltered(updatedProducts);
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, sort]);

  useEffect(() => {
    localStorage.setItem('sort', sort);
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('categoryFilter', categoryFilter);
    localStorage.setItem('priceRange', JSON.stringify(priceRange));
    localStorage.setItem('inStockOnly', inStockOnly.toString());
    applyFilters();
  }, [sort, searchQuery, categoryFilter, priceRange, inStockOnly, applyFilters]);

  const resetFilters = () => {
    setSort('');
    setSearchQuery('');
    setCategoryFilter('');
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setFiltered([...products]);
    localStorage.setItem('sort', '');
    localStorage.setItem('searchQuery', '');
    localStorage.setItem('categoryFilter', '');
    localStorage.setItem('priceRange', JSON.stringify([0, maxPrice]));
    localStorage.setItem('inStockOnly', 'false');
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageClick = (productId) => {
    window.open(`/product/${productId}`, '_blank');
  };

  const getStockStatus = (stock) => {
    return (stock || 0) > 0 ? 'In Stock' : 'Out of Stock';
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner"></div>
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
    <div className="product-list-wrapper">
      <div className="container py-5">
        <div className="premium-deals-banner">
          <div className="deals-track">
            {premiumDeals.concat(premiumDeals).map((deal, index) => (
              <span key={index} className="deal-item">
                {deal}
              </span>
            ))}
          </div>
        </div>

        <h1 className="page-title">{titles[titleIndex]}</h1>

        <div className={`search-bar ${scrollPosition > 150 ? 'sticky' : ''}`}>
          <input
            type="text"
            className="search-input"
            placeholder="Search the cosmos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-toggle">
          <button className="btn-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </button>
          <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
            <div className="filter-option category-filter">
              <label>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat || 'all'} value={cat}>
                    {cat === '' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-option price-filter">
              <label>Price: ₹{priceRange[0]} - ₹{priceRange[1]}</label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              />
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              />
            </div>
            <div className="filter-option stock-filter">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="stock-label">In Stock</span>
            </div>
            <div className="filter-option sort-filter">
              <button
                className={`btn-sort ${sort === 'price-asc' ? 'active' : ''}`}
                onClick={() => setSort('price-asc')}
              >
                Price ↑
              </button>
              <button
                className={`btn-sort ${sort === 'price-desc' ? 'active' : ''}`}
                onClick={() => setSort('price-desc')}
              >
                Price ↓
              </button>
              <button
                className={`btn-sort ${sort === 'name-asc' ? 'active' : ''}`}
                onClick={() => setSort('name-asc')}
              >
                A-Z
              </button>
            </div>
            <button className="btn-reset" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        <div className="product-grid">
          {filtered.length > 0 ? (
            filtered.slice(0, visibleCount).map((product) => {
              const stock = product.stock || 0;
              return (
                <div key={product._id} className="product-card">
                  <meta name="description" content={`${product.name} - ₹${product.price}`} />
                  {product.featured && <span className="badge featured-badge">Featured</span>}
                  <div className="image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      loading="lazy"
                      onError={(e) => {
                        console.log(`Failed to load image for ${product.name}: ${product.image}`);
                        e.target.style.display = 'none'; // Hide the image if it fails
                      }}
                      onClick={() => handleImageClick(product._id)}
                    />
                  </div>
                  <div className="card-content">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-price">₹{Number(product.price).toFixed(2)}</p>
                    <p className={`stock-status ${getStockStatus(stock).replace(' ', '-')}`}>
                      {getStockStatus(stock)}
                    </p>
                    <div className="button-group">
                      <button
                        className="btn-add-to-cart"
                        onClick={() => addToCart(product)}
                        disabled={stock <= 0}
                      >
                        <i className="fas fa-shopping-cart"></i> Add
                      </button>
                      <button
                        className="btn-view-details"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-products">No products found in this galaxy.</div>
          )}
        </div>

        {visibleCount < filtered.length && (
          <div className="load-more-section">
            <button className="btn-load-more" onClick={handleLoadMore}>
              Load More
            </button>
          </div>
        )}

        {scrollPosition > 300 && (
          <button className="back-to-top" onClick={handleBackToTop}>
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductList;