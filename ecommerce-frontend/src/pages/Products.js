import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Products.css';

function ProductList() {
  const { products, loading, error: productsError } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [filtered, setFiltered] = useState([]);
  const [sort, setSort] = useState(localStorage.getItem('sort') || 'popularity');
  const [searchQuery, setSearchQuery] = useState(localStorage.getItem('searchQuery') || '');
  const [categoryFilter, setCategoryFilter] = useState(localStorage.getItem('categoryFilter') || '');
  const [priceRange, setPriceRange] = useState(
    JSON.parse(localStorage.getItem('priceRange')) || [0, 10000]
  );
  const [ratingFilter, setRatingFilter] = useState(localStorage.getItem('ratingFilter') || '');
  const [inStockOnly, setInStockOnly] = useState(
    localStorage.getItem('inStockOnly') === 'true' || false
  );
  const [quickFilters, setQuickFilters] = useState({
    inStock: false,
    highRated: false,
    discounted: false,
  });
  const [visibleCount, setVisibleCount] = useState(12);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [categories, setCategories] = useState(['']);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessages, setWishlistMessages] = useState({});
  const [productRatings, setProductRatings] = useState(
    JSON.parse(localStorage.getItem('productRatings')) || {}
  );
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches')) || []
  );
  const [recentFilters, setRecentFilters] = useState(
    JSON.parse(localStorage.getItem('recentFilters')) || []
  );
  const [correctedSearch, setCorrectedSearch] = useState('');
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isRatingsLoading, setIsRatingsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef();
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

  // Fetch the user's wishlist
  useEffect(() => {
    if (user && user._id) {
      const fetchWishlist = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5001/api/wishlist/user/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWishlist(res.data);
        } catch (err) {
          console.error('Error fetching wishlist:', err);
          toast.error('Failed to load wishlist.');
        }
      };
      fetchWishlist();
    }
  }, [user]);

  // Fetch ratings for all products only once when the user logs in
  useEffect(() => {
    const fetchRatings = async () => {
      const storedRatings = JSON.parse(localStorage.getItem('productRatings'));
      if (storedRatings && Object.keys(storedRatings).length > 0) {
        setProductRatings(storedRatings);
        setIsRatingsLoading(false);
        return;
      }

      if (user && user._id && products.length > 0) {
        try {
          setIsRatingsLoading(true);
          const ratingsData = {};
          for (const product of products) {
            const res = await axios.get(`http://localhost:5001/api/reviews/product/${product._id}`);
            if (res.data && Array.isArray(res.data)) {
              const totalRating = res.data.reduce((sum, review) => sum + review.rating, 0);
              const averageRating = res.data.length > 0 ? (totalRating / res.data.length).toFixed(1) : 0;
              ratingsData[product._id] = {
                averageRating,
                reviewCount: res.data.length,
              };
            } else {
              ratingsData[product._id] = { averageRating: 0, reviewCount: 0 };
            }
          }
          setProductRatings(ratingsData);
          localStorage.setItem('productRatings', JSON.stringify(ratingsData));
        } catch (err) {
          console.error('Error fetching ratings:', err);
          toast.error('Failed to load product ratings.');
        } finally {
          setIsRatingsLoading(false);
        }
      }
    };

    fetchRatings();
  }, [user, products]);

  // Infinite Scroll: Load more products when the user scrolls to the bottom
  const lastProductElementRef = useCallback(
    (node) => {
      if (isLoadingMore || loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 12);
            setIsLoadingMore(false);
          }, 500);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, loading, visibleCount, filtered.length]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setCategoryFilter(category);
      localStorage.setItem('categoryFilter', category);
    }
  }, [location.search]);

  useEffect(() => {
    if (!loading && products.length > 0) {
      setFiltered([...products]);
      const uniqueCategories = ['', ...new Set(products.map(p => p.category || 'Uncategorized'))];
      setCategories(uniqueCategories);
      const prices = products.map(p => Number(p.price) || 0);
      const max = Math.ceil(Math.max(...prices) / 100) * 100;
      setMaxPrice(max || 10000);
      setPriceRange(prev => [prev[0], Math.min(prev[1], max)]);
    }
  }, [products, loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [titles.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const correctSearchTerm = (query) => {
    const productNames = products.map(p => p.name.toLowerCase());
    const words = query.toLowerCase().split(' ');
    let closestMatch = '';
    let minDistance = Infinity;

    for (const name of productNames) {
      const nameWords = name.split(' ');
      for (const word of words) {
        for (const nameWord of nameWords) {
          const distance = levenshteinDistance(word, nameWord);
          if (distance < minDistance && distance <= 3) {
            minDistance = distance;
            closestMatch = nameWord;
          }
        }
      }
    }

    return closestMatch ? closestMatch.charAt(0).toUpperCase() + closestMatch.slice(1) : '';
  };

  const levenshteinDistance = (a, b) => {
    const matrix = Array(b.length + 1).fill(null).map(() =>
      Array(a.length + 1).fill(null)
    );

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  };

  const applyFilters = useCallback(() => {
    let updatedProducts = [...products];

    if (searchQuery) {
      const queryWords = searchQuery.toLowerCase().split(' ');
      updatedProducts = updatedProducts.filter((product) => {
        const name = product.name.toLowerCase();
        return queryWords.some(word => name.includes(word));
      });

      const corrected = correctSearchTerm(searchQuery);
      setCorrectedSearch(corrected);

      if (searchQuery && !recentSearches.includes(searchQuery)) {
        const updatedSearches = [searchQuery, ...recentSearches].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      }
    } else {
      setCorrectedSearch('');
    }

    if (categoryFilter && categoryFilter !== '') {
      updatedProducts = updatedProducts.filter((product) => product.category === categoryFilter);
    }

    updatedProducts = updatedProducts.filter(
      (product) => Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1]
    );

    if (inStockOnly || quickFilters.inStock) {
      updatedProducts = updatedProducts.filter((product) => (product.stock || 0) > 0);
    }

    if (ratingFilter || quickFilters.highRated) {
      updatedProducts = updatedProducts.filter((product) => {
        const rating = productRatings[product._id]?.averageRating || 0;
        if (ratingFilter === '4') return rating >= 4;
        if (ratingFilter === '3') return rating >= 3;
        if (quickFilters.highRated) return rating >= 4;
        return true;
      });
    }

    if (quickFilters.discounted) {
      updatedProducts = updatedProducts.filter((product) => product.offer && parseFloat(product.offer) > 0);
    }

    if (sort === 'popularity') {
      updatedProducts.sort((a, b) => {
        const aReviews = productRatings[a._id]?.reviewCount || 0;
        const bReviews = productRatings[b._id]?.reviewCount || 0;
        return bReviews - aReviews;
      });
    } else if (sort === 'price-asc') {
      updatedProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-desc') {
      updatedProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'newest') {
      updatedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'discount') {
      updatedProducts.sort((a, b) => {
        const aDiscount = a.offer ? parseFloat(a.offer) : 0;
        const bDiscount = b.offer ? parseFloat(b.offer) : 0;
        return bDiscount - aDiscount;
      });
    }

    setFiltered(updatedProducts);
    setVisibleCount(12);
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, sort, productRatings, recentSearches, quickFilters]);

  useEffect(() => {
    localStorage.setItem('sort', sort);
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('categoryFilter', categoryFilter);
    localStorage.setItem('priceRange', JSON.stringify(priceRange));
    localStorage.setItem('inStockOnly', inStockOnly.toString());
    localStorage.setItem('ratingFilter', ratingFilter);
    applyFilters();
  }, [sort, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, quickFilters, applyFilters]);

  useEffect(() => {
    const currentFilters = {
      category: categoryFilter,
      priceRange,
      rating: ratingFilter,
      inStock: inStockOnly,
    };
    const filterString = JSON.stringify(currentFilters);
    if (
      categoryFilter || priceRange[0] !== 0 || priceRange[1] !== maxPrice || ratingFilter || inStockOnly
    ) {
      const updatedRecentFilters = recentFilters.filter(f => JSON.stringify(f) !== filterString);
      updatedRecentFilters.unshift(currentFilters);
      const limitedFilters = updatedRecentFilters.slice(0, 5);
      setRecentFilters(limitedFilters);
      localStorage.setItem('recentFilters', JSON.stringify(limitedFilters));
    }
  }, [categoryFilter, priceRange, ratingFilter, inStockOnly, maxPrice]);

  const resetFilters = () => {
    setSort('popularity');
    setSearchQuery('');
    setCategoryFilter('');
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setRatingFilter('');
    setQuickFilters({ inStock: false, highRated: false, discounted: false });
    setFiltered([...products]);
    localStorage.setItem('sort', 'popularity');
    localStorage.setItem('searchQuery', '');
    localStorage.setItem('categoryFilter', '');
    localStorage.setItem('priceRange', JSON.stringify([0, maxPrice]));
    localStorage.setItem('inStockOnly', 'false');
    localStorage.setItem('ratingFilter', '');
    setShowFilters(false);
  };

  const applyRecentFilter = (filter) => {
    setCategoryFilter(filter.category);
    setPriceRange(filter.priceRange);
    setRatingFilter(filter.rating);
    setInStockOnly(filter.inStock);
    setShowFilters(false);
  };

  const handleQuickFilterToggle = (filter) => {
    setQuickFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const handleShareProduct = async (product) => {
    const shareUrl = `${window.location.origin}/product/${product._id}`;
    const shareData = {
      title: product.name,
      text: `Check out this product: ${product.name} - ₹${product.price}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Product link copied to clipboard!', {
          position: 'bottom-right',
          autoClose: 2000,
        });
      }
    } catch (err) {
      console.error('Error sharing product:', err);
      toast.error('Failed to share product.', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
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

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} blasted into your cart!`, {
      position: 'bottom-right',
      autoClose: 2000,
      hideProgressBar: true,
      className: 'cosmic-toast',
    });
  };

  const handleAddToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please log in to add to wishlist.');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5001/api/wishlist',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist([...wishlist, res.data.item]);
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Added to wishlist!',
      }));
      toast.success('Added to wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error adding to wishlist:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
      toast.error(errorMessage);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const wishlistItem = wishlist.find((item) =>
        item.productId && item.productId._id === productId
      );
      if (!wishlistItem) return;

      await axios.delete(`http://localhost:5001/api/wishlist/${wishlistItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(wishlist.filter((item) => item._id !== wishlistItem._id));
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: 'Removed from wishlist!',
      }));
      toast.success('Removed from wishlist!');
      setTimeout(() => {
        setWishlistMessages((prev) => ({
          ...prev,
          [productId]: '',
        }));
      }, 3000);
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error(err.response?.data?.message || 'Failed to remove from wishlist.');
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setShowRecentSearches(false);
      applyFilters();
    }
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
    setShowRecentSearches(false);
    applyFilters();
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setCorrectedSearch('');
    applyFilters();
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.setItem('recentSearches', JSON.stringify([]));
    setShowRecentSearches(false);
  };

  const activeFilterCount = [
    categoryFilter,
    priceRange[0] !== 0 || priceRange[1] !== maxPrice,
    ratingFilter,
    inStockOnly,
    quickFilters.inStock,
    quickFilters.highRated,
    quickFilters.discounted,
  ].filter(Boolean).length;

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

        <div className="products-content">
          <div className={`filters-sidebar ${showFilters ? 'visible' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <div>
                <button className="btn-clear-all" onClick={resetFilters}>
                  Clear All
                </button>
                <button className="btn-close-filters" onClick={() => setShowFilters(false)}>
                  ✕
                </button>
              </div>
            </div>
            {recentFilters.length > 0 && (
              <div className="filter-section">
                <h4>Recent Filters</h4>
                {recentFilters.map((filter, index) => (
                  <button
                    key={index}
                    className="recent-filter"
                    onClick={() => applyRecentFilter(filter)}
                  >
                    {filter.category || 'All Categories'}, ₹{filter.priceRange[0]}-₹{filter.priceRange[1]}
                    {filter.rating && `, ${filter.rating}★ & above`}
                    {filter.inStock && ', In Stock'}
                  </button>
                ))}
              </div>
            )}
            <div className="filter-section">
              <h4>Categories</h4>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setShowFilters(false);
                }}
              >
                {categories.map((cat) => (
                  <option key={cat || 'all'} value={cat}>
                    {cat === '' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-section">
              <h4>Price</h4>
              <div className="price-range">
                <span>₹{priceRange[0]}</span> - <span>₹{priceRange[1]}</span>
              </div>
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
                onChange={(e) => {
                  setPriceRange([priceRange[0], Number(e.target.value)]);
                  setShowFilters(false);
                }}
              />
            </div>
            <div className="filter-section">
              <h4>Customer Ratings</h4>
              <label>
                <input
                  type="radio"
                  name="rating"
                  value="4"
                  checked={ratingFilter === '4'}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setShowFilters(false);
                  }}
                />
                4★ & above
              </label>
              <label>
                <input
                  type="radio"
                  name="rating"
                  value="3"
                  checked={ratingFilter === '3'}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setShowFilters(false);
                  }}
                />
                3★ & above
              </label>
              <label>
                <input
                  type="radio"
                  name="rating"
                  value=""
                  checked={ratingFilter === ''}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setShowFilters(false);
                  }}
                />
                All
              </label>
            </div>
            <div className="filter-section">
              <h4>Availability</h4>
              <label>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setShowFilters(false);
                  }}
                />
                In Stock Only
              </label>
            </div>
          </div>

          <div className="products-main">
            <div className="products-header">
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search the cosmos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  onKeyPress={handleSearchKeyPress}
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="recent-searches">
                    <div className="recent-searches-header">
                      <h4>Recent Searches</h4>
                      <button className="btn-clear-recent" onClick={handleClearRecentSearches}>
                        Clear All
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="recent-search-item"
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        {search}
                      </div>
                    ))}
                  </div>
                )}
                {correctedSearch && searchQuery && (
                  <div className="search-suggestion">
                    Did you mean: <span onClick={() => handleSuggestionClick(correctedSearch)}>{correctedSearch}</span>?
                  </div>
                )}
              </div>
              <div className="sort-options">
                <label>Sort By: </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price -- Low to High</option>
                  <option value="price-desc">Price -- High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
              <button
                className="btn-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>

            {/* Quick Filters */}
            <div className="quick-filters">
              <button
                className={`quick-filter-chip ${quickFilters.inStock ? 'active' : ''}`}
                onClick={() => handleQuickFilterToggle('inStock')}
              >
                In Stock
              </button>
              <button
                className={`quick-filter-chip ${quickFilters.highRated ? 'active' : ''}`}
                onClick={() => handleQuickFilterToggle('highRated')}
              >
                High Rated (4★ & above)
              </button>
              <button
                className={`quick-filter-chip ${quickFilters.discounted ? 'active' : ''}`}
                onClick={() => handleQuickFilterToggle('discounted')}
              >
                Discounted
              </button>
            </div>

            {/* Product Grid */}
            <div className="product-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="product-card skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="card-content">
                      <div className="skeleton-text skeleton-title"></div>
                      <div className="skeleton-text skeleton-price"></div>
                      <div className="skeleton-text skeleton-rating"></div>
                      <div className="skeleton-text skeleton-stock"></div>
                      <div className="button-group">
                        <div className="skeleton-button"></div>
                        <div className="skeleton-button"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.slice(0, visibleCount).map((product, index) => {
                  const stock = product.stock || 0;
                  const isWishlisted = wishlist.some((item) =>
                    item.productId && item.productId._id === product._id
                  );
                  const rating = productRatings[product._id] || { averageRating: 0, reviewCount: 0 };
                  const discount = product.offer ? parseFloat(product.offer) : 0;
                  const originalPrice = discount
                    ? (product.price / (1 - discount / 100)).toFixed(2)
                    : product.price;
                  const isLastElement = index === filtered.slice(0, visibleCount).length - 1;

                  return (
                    <div
                      key={product._id}
                      className="product-card"
                      ref={isLastElement ? lastProductElementRef : null}
                    >
                      <meta name="description" content={`${product.name} - ₹${product.price}`} />
                      {product.featured && <span className="badge featured-badge">Featured</span>}
                      <button
                        className={`wishlist-btn ${isWishlisted ? 'filled' : ''}`}
                        onClick={() =>
                          isWishlisted
                            ? handleRemoveFromWishlist(product._id)
                            : handleAddToWishlist(product._id)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={isWishlisted ? '#d32f2f' : 'none'}
                          stroke={isWishlisted ? '#d32f2f' : '#212121'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                      {wishlistMessages[product._id] && (
                        <span className="wishlist-message">{wishlistMessages[product._id]}</span>
                      )}
                      <button
                        className="share-btn"
                        onClick={() => handleShareProduct(product)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#212121"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                      </button>
                      <div className="product-card-inner">
                        <div className="image-container">
                          {isRatingsLoading ? (
                            <div className="skeleton-image"></div>
                          ) : (
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="product-image"
                              loading="lazy"
                              onError={(e) => {
                                console.log(`Failed to load image for ${product.name}: ${product.image}`);
                                e.target.src = 'https://via.placeholder.com/150';
                              }}
                              onClick={() => handleImageClick(product._id)}
                            />
                          )}
                        </div>
                        <div className="card-content">
                          <h3 className="product-title">{product.name}</h3>
                          <div className="price-section">
                            <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
                            {discount > 0 && (
                              <>
                                <span className="original-price">₹{Number(originalPrice).toFixed(2)}</span>
                                <span className="discount">{discount}% off</span>
                              </>
                            )}
                          </div>
                          {rating.averageRating > 0 && (
                            <div className="rating-section">
                              <span className="rating-badge">
                                {rating.averageRating} ★ ({rating.reviewCount})
                              </span>
                            </div>
                          )}
                          <p className={`stock-status ${getStockStatus(stock).replace(' ', '-')}`}>
                            {getStockStatus(stock)}
                          </p>
                          <div className="button-group">
                            <button
                              className="btn-add-to-cart"
                              onClick={() => handleAddToCart(product)}
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
                      <button
                        className="btn-quick-view"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        Quick View
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="no-products">No products found in this galaxy.</div>
              )}
            </div>
            {isLoadingMore && (
              <div className="load-more-section">
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>

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