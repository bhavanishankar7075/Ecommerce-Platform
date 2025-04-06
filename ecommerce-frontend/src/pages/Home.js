// ecommerce-frontend/src/pages/Home.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Home.css';

function Home() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { user, loading: authLoading } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [topSellingSmartphones, setTopSellingSmartphones] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [youMayLikeItems, setYouMayLikeItems] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [dealTimer, setDealTimer] = useState(3600); // 1 hour in seconds
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [priceFilter, setPriceFilter] = useState({ min: 0, max: Infinity });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopCategory, setSelectedTopCategory] = useState(null);
  const [filteredCategoryProducts, setFilteredCategoryProducts] = useState([]);
  const [filteredTopCategoryProducts, setFilteredTopCategoryProducts] = useState([]);
  const [currentPageCategory, setCurrentPageCategory] = useState(1);
  const [currentPageTopCategory, setCurrentPageTopCategory] = useState(1);
  const productsPerPage = 4;
  const navigate = useNavigate();

  // Categories with images
  const categories = [
    { name: 'Books', image: 'https://img.freepik.com/free-photo/3d-view-books-cartoon-style_52683-117189.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Electronics', image: 'https://img.freepik.com/premium-photo/household-appliances-shopping-cart-black-background-ecommerce-online-shopping-concept-3d_505080-2555.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Toys', image: 'https://img.freepik.com/free-photo/cute-plush-toys-arrangement_23-2150312316.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Clothing', image: 'https://img.freepik.com/premium-photo/pair-shoes-are-table-with-hat-table_874904-102811.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Accessories', image: 'https://img.freepik.com/free-photo/cosmetics-accessories-near-keyboard_23-2147778967.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Sports', image: 'https://img.freepik.com/premium-photo/high-angle-view-eyeglasses-table_1048944-14435092.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Beauty', image: 'https://img.freepik.com/premium-photo/digital-tablet-with-woman-s-accessories-white-wooden-table-background-top-view_392895-210870.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Jewelry', image: 'https://img.freepik.com/free-photo/traditional-indian-wedding-jewelry_8353-9762.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Automotive', image: 'https://img.freepik.com/free-vector/mobile-application-buy-car_603843-656.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Health', image: 'https://img.freepik.com/free-photo/elevated-view-stethoscope-stitched-heart-shape-wireless-keyboard-succulent-plant-yellow-backdrop_23-2148214051.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Stationery', image: 'https://img.freepik.com/free-photo/overhead-view-office-stationeries-laptop-white-background_23-2148042099.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Furniture', image: 'https://img.freepik.com/premium-photo/hotel-furniture-white-background_996135-44810.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
    { name: 'Footwear', image: 'https://img.freepik.com/premium-photo/high-angle-view-mobile-phone-table_1048944-19477214.jpg?uid=R187650059&ga=GA1.1.982110684.1717591516&semt=ais_hybrid' },
  ];

  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      // Featured Products (for carousel)
      const featured = products.filter((product) => product.featured);
      const selectedFeatured = featured.length > 0 ? featured : products.slice(0, 3);
      setFeaturedProducts(selectedFeatured); // Directly use the product data, including its image field

      // Trending Products (for "Suggested for You")
      const sortedByPrice = [...products].sort((a, b) => Number(b.price) - Number(a.price));
      setTrendingProducts(sortedByPrice.slice(0, 4));

      // Suggested Items (random selection)
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setSuggestedItems(shuffled.slice(0, 4));

      // Top Selling Smartphones (filter by category or price)
      const smartphones = products
        .filter((product) => product.category.toLowerCase().includes('electronics'))
        .sort((a, b) => Number(b.price) - Number(a.price));
      setTopSellingSmartphones(smartphones.slice(0, 3));

      // Recommended Items (another random selection)
      const recommended = [...products].sort(() => 0.5 - Math.random());
      setRecommendedItems(recommended.slice(0, 4));

      // You May Like Items (another random selection)
      const youMayLike = [...products].sort(() => 0.5 - Math.random());
      setYouMayLikeItems(youMayLike.slice(0, 4));

      // Recently Viewed Products (from local storage or context)
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
      const viewedProducts = products.filter((product) => viewed.includes(product._id));
      setRecentlyViewed(viewedProducts.slice(0, 10)); // Limit to 10 items

      // Best Sellers (sort by rating or sales)
      const best = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setBestSellers(best.slice(0, 4));
    }
  }, [products, productsLoading]);

  // Filter products for "Shop by Category"
  useEffect(() => {
    if (selectedCategory) {
      let filtered = products.filter((product) =>
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      filtered = filtered.filter((product) => {
        const price = Number(product.price);
        const matchesPrice = price >= priceFilter.min && (priceFilter.max === Infinity || price <= priceFilter.max);
        const matchesRating = product.rating ? product.rating >= ratingFilter : true;
        return matchesPrice && matchesRating;
      });
      if (sortFilter === 'price-low-high') {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortFilter === 'price-high-low') {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
      }
      setFilteredCategoryProducts(filtered);
      setCurrentPageCategory(1);
    } else {
      setFilteredCategoryProducts([]);
    }
  }, [selectedCategory, products, priceFilter, sortFilter, ratingFilter]);

  // Filter products for "Top Categories"
  useEffect(() => {
    if (selectedTopCategory) {
      let filtered = products.filter((product) =>
        product.category.toLowerCase() === selectedTopCategory.toLowerCase()
      );
      filtered = filtered.filter((product) => {
        const price = Number(product.price);
        const matchesPrice = price >= priceFilter.min && (priceFilter.max === Infinity || price <= priceFilter.max);
        const matchesRating = product.rating ? product.rating >= ratingFilter : true;
        return matchesPrice && matchesRating;
      });
      if (sortFilter === 'price-low-high') {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortFilter === 'price-high-low') {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
      }
      setFilteredTopCategoryProducts(filtered);
      setCurrentPageTopCategory(1);
    } else {
      setFilteredTopCategoryProducts([]);
    }
  }, [selectedTopCategory, products, priceFilter, sortFilter, ratingFilter]);

  // Filter for Suggested Items
  const filteredSuggestedItems = suggestedItems.filter((product) => {
    const price = Number(product.price);
    const matchesPrice = price >= priceFilter.min && (priceFilter.max === Infinity || price <= priceFilter.max);
    const matchesCategory = categoryFilter ? product.category.toLowerCase() === categoryFilter.toLowerCase() : true;
    const matchesRating = product.rating ? product.rating >= ratingFilter : true;
    return matchesPrice && matchesCategory && matchesRating;
  }).sort((a, b) => {
    if (sortFilter === 'price-low-high') {
      return Number(a.price) - Number(b.price);
    } else if (sortFilter === 'price-high-low') {
      return Number(b.price) - Number(a.price);
    }
    return 0;
  });

  // Pagination for Shop by Category
  const indexOfLastCategoryProduct = currentPageCategory * productsPerPage;
  const indexOfFirstCategoryProduct = indexOfLastCategoryProduct - productsPerPage;
  const currentCategoryProducts = filteredCategoryProducts.slice(
    indexOfFirstCategoryProduct,
    indexOfLastCategoryProduct
  );
  const totalCategoryPages = Math.ceil(filteredCategoryProducts.length / productsPerPage);

  // Pagination for Top Categories
  const indexOfLastTopCategoryProduct = currentPageTopCategory * productsPerPage;
  const indexOfFirstTopCategoryProduct = indexOfLastTopCategoryProduct - productsPerPage;
  const currentTopCategoryProducts = filteredTopCategoryProducts.slice(
    indexOfFirstTopCategoryProduct,
    indexOfLastTopCategoryProduct
  );
  const totalTopCategoryPages = Math.ceil(filteredTopCategoryProducts.length / productsPerPage);

  // Countdown timer for Featured Deals
  useEffect(() => {
    const timer = setInterval(() => {
      setDealTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Back to Top visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePriceFilterChange = (e) => {
    const { name, value } = e.target;
    setPriceFilter((prev) => ({
      ...prev,
      [name]: value === '' ? (name === 'min' ? 0 : Infinity) : Number(value),
    }));
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  const handleSortFilterChange = (e) => {
    setSortFilter(e.target.value);
  };

  const handleRatingFilterChange = (e) => {
    setRatingFilter(Number(e.target.value));
  };

  const clearFilters = () => {
    setPriceFilter({ min: 0, max: Infinity });
    setCategoryFilter('');
    setSortFilter('');
    setRatingFilter(0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading || productsLoading) {
    return (
      <div className="container-loading my-5 text-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="container-loading my-5 text-center">
        <h3>Error loading products</h3>
        <p>{productsError}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h3>No products available</h3>
        <p>Please check back later.</p>
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="home-wrapper">
      {/* Hero Section with Carousel */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="hero-section">
        <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-indicators">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? 'active' : ''}
                aria-current={index === 0 ? 'true' : 'false'}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>
          <div className="carousel-inner">
            {featuredProducts.map((product, index) => (
              <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={product._id}>
                <img
                  src={product.image || 'https://placehold.co/1200x400?text=Featured+Product'}
                  className="d-block w-100 carousel-image"
                  alt={product.name}
                  onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                  onError={(e) => {
                    console.log(`Failed to load image for ${product.name}: ${product.image}`);
                    e.target.src = 'https://placehold.co/1200x400?text=Featured+Product';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Promotional Banner */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="promo-banner">
        <div className="promo-content">
          <h2>Plan Your Next Adventure</h2>
          <p>Discover Amazing Deals with E-Shop!</p>
          <button
            className="btn btn-light"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            Explore Now
          </button>
        </div>
      </motion.section>

      {/* Category Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-section">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="category-container">
            {categories.map((category) => (
              <div
                className="category-item"
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/100x100?text=Category';
                  }}
                />
                <p>{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Filtered Products by Category (Shop by Category) */}
      {selectedCategory && filteredCategoryProducts.length > 0 && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-category-products-section">
          <div className="container">
            <h2>{selectedCategory} Products</h2>
            <div className="product-list">
              {currentCategoryProducts.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
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
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setCurrentPageCategory((prev) => Math.max(prev - 1, 1))}
                disabled={currentPageCategory === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPageCategory} of {totalCategoryPages}
              </span>
              <button
                onClick={() => setCurrentPageCategory((prev) => Math.min(prev + 1, totalCategoryPages))}
                disabled={currentPageCategory === totalCategoryPages}
              >
                Next
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Filter Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filter-section">
        <div className="container">
          <h2>Filter Products</h2>
          <div className="filter-container">
            <div className="filter-group">
              <label>Price Range:</label>
              <input
                type="number"
                name="min"
                placeholder="Min Price"
                value={priceFilter.min === 0 ? '' : priceFilter.min}
                onChange={handlePriceFilterChange}
              />
              <input
                type="number"
                name="max"
                placeholder="Max Price"
                value={priceFilter.max === Infinity ? '' : priceFilter.max}
                onChange={handlePriceFilterChange}
              />
            </div>
            <div className="filter-group">
              <label>Category:</label>
              <select value={categoryFilter} onChange={handleCategoryFilterChange}>
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name.toLowerCase()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Sort By:</label>
              <select value={sortFilter} onChange={handleSortFilterChange}>
                <option value="">Default</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Minimum Rating:</label>
              <select value={ratingFilter} onChange={handleRatingFilterChange}>
                <option value="0">All Ratings</option>
                <option value="4">4 Stars & Above</option>
                <option value="3">3 Stars & Above</option>
                <option value="2">2 Stars & Above</option>
              </select>
            </div>
            <div className="filter-group">
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>  
        </div>
      </motion.section>

      {/* Suggested Items Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="suggested-items-section">
        <div className="container">
          <h2>Suggested Items</h2>
          <div className="product-list">
            {filteredSuggestedItems.map((product) => (
              <div
                className="product-item"
                key={product._id}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Suggested for You Section */}
      {user && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="suggested-for-you-section">
          <div className="container">
            <h2>Suggested for You</h2>
            <div className="product-list">
              {trendingProducts.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
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
                    <p className="discount">{product.offer || '15% OFF'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Top Selling Smartphones Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-selling-section">
        <div className="container">
          <h2>Top Selling Smartphones</h2>
          <p className="subtitle">Latest Technology, Best Brands</p>
          <div className="product-list">
            {topSellingSmartphones.map((product) => (
              <div
                className="product-item"
                key={product._id}
                onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
              >
                <img
                  src={product.image || 'https://placehold.co/100x100?text=Smartphone'}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/100x100?text=Smartphone';
                  }}
                />
                <div className="product-details">
                  <h5>{product.name}</h5>
                  <p className="price">₹{Number(product.price).toFixed(2)}</p>
                  <p className="discount">{product.offer || '20% OFF'}</p>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(user ? `/product/${product._id}` : '/login');
                    }}
                  >
                    Explore Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Deals Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="featured-deals-section">
        <div className="container">
          <h2>Featured Deals</h2>
          <p className="deal-timer">Hurry! Offer ends in: {formatTime(dealTimer)}</p>
          <div className="product-list">
            {suggestedItems.slice(0, 3).map((product) => (
              <div
                className="product-item"
                key={product._id}
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
                  <p className="discount">{product.offer || '25% OFF'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Top Categories Banner Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-categories-section">
        <div className="container">
          <h2>Top Categories</h2>
          <div className="category-banner-container">
            {categories.slice(0, 3).map((category) => (
              <div
                className="category-banner-item"
                key={category.name}
                onClick={() => setSelectedTopCategory(category.name)}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200?text=Category';
                  }}
                />
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                  <button className="btn btn-light">View Products</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Filtered Products by Top Category */}
      {selectedTopCategory && filteredTopCategoryProducts.length > 0 && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-top-category-products-section">
          <div className="container">
            <h2>{selectedTopCategory} Products</h2>
            <div className="product-list">
              {currentTopCategoryProducts.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
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
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setCurrentPageTopCategory((prev) => Math.max(prev - 1, 1))}
                disabled={currentPageTopCategory === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPageTopCategory} of {totalTopCategoryPages}
              </span>
              <button
                onClick={() => setCurrentPageTopCategory((prev) => Math.min(prev + 1, totalTopCategoryPages))}
                disabled={currentPageTopCategory === totalTopCategoryPages}
              >
                Next
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Best Sellers Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="best-sellers-section">
        <div className="container">
          <h2>Best Sellers</h2>
          <div className="product-list">
            {bestSellers.map((product) => (
              <div
                className="product-item"
                key={product._id}
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
                  <p className="discount">{product.offer || '15% OFF'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Customer Reviews Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="customer-reviews-section">
        <div className="container">
          <h2>Customer Reviews</h2>
          <div className="reviews-container">
            <div className="review-item">
              <p>"Amazing products and fast delivery! Highly recommend E-Shop."</p>
              <p className="reviewer">- Priya S.</p>
            </div>
            <div className="review-item">
              <p>"Great quality and affordable prices. My go-to online store!"</p>
              <p className="reviewer">- Arjun K.</p>
            </div>
            <div className="review-item">
              <p>"Excellent customer service and a wide range of products."</p>
              <p className="reviewer">- Sneha M.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Recommended Items Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="recommended-items-section">
        <div className="container">
          <h2>Recommended Items</h2>
          <div className="product-list">
            {recommendedItems.map((product) => (
              <div
                className="product-item"
                key={product._id}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* You May Like Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="you-may-like-section">
        <div className="container">
          <h2>You May Like...</h2>
          <div className="product-list">
            {youMayLikeItems.map((product) => (
              <div
                className="product-item"
                key={product._id}
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
                  <p className="discount">{product.offer || '15% OFF'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="recently-viewed-section">
          <div className="container">
            <h2>Recently Viewed Products</h2>
            <div className="recently-viewed-container">
              {recentlyViewed.map((product) => (
                <div
                  className="product-item"
                  key={product._id}
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop}></button>
      )}
    </div>
  );
}

export default Home;