import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Products.css';

// Define categories outside the component as a constant
const categories = [
  { name: 'All Categories', sub: [] },
  {
    name: 'Fashion',
    sub: [
      {
        name: 'Men',
        nested: [
          'Top Wear',
          'Bottom Wear',
          'Casual Shoes',
          'Watches',
          'Ethnic',
          'Sports Shoes',
          'Luggage',
          'Accessories',
          'Trimmers',
          'Essentials',
          'Men Grooming',
        ],
      },
      {
        name: 'Women',
        nested: [
          'Dresses',
          'Top Wear',
          'Bottom Wear',
          'Footwear',
          'Beauty',
          'Luggage & Bags',
          'Ethnic',
          'Watches & Shades',
          'Accessories',
          'Essentials',
        ],
      },
      {
        name: 'Beauty',
        nested: ['Swiss Beauty', 'Sugar Pop Insights', 'Renee'],
      },
    ],
  },
  { name: 'Gadgets', sub: [] },
  { name: 'Furniture', sub: [] },
  {
    name: 'Mobiles',
    sub: [
      {
        name: 'Smartphones',
        nested: ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel', 'Realme', 'Redmi'],
      },
      {
        name: 'FeaturePhones',
        nested: ['Nokia', 'JioPhone'],
      },
      {
        name: 'Tablets',
        nested: ['iPad', 'Samsung Galaxy Tab', 'Lenovo Tab'],
      },
      {
        name: 'Accessories',
        nested: ['Chargers', 'Earphones', 'Cases', 'Screen Protectors'],
      },
    ],
  },
  { name: 'Appliances', sub: [] },
  { name: 'Beauty', sub: [] },
  { name: 'Home', sub: [] },
  { name: 'Toys & Baby', sub: [] },
  { name: 'Sports', sub: [] },
];

// Define titles and premium deals for the banner
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

function Products() {
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
    approvedOnly: false,
    lowStockAlert: false,
  });
  const [visibleCount, setVisibleCount] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [expandedCategories, setExpandedCategories] = useState(
    categories.reduce((acc, cat) => {
      acc[cat.name] = false;
      if (cat.sub) {
        cat.sub.forEach((sub) => {
          acc[sub.name] = false;
        });
      }
      return acc;
    }, {})
  );
  const [wishlist, setWishlist] = useState([]);
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

  const brands = ['Nike', 'Adidas', 'Puma', "Levi's", 'Samsung', 'Apple'];
  const colors = ['Red', 'Blue', 'Black', 'White', 'Green'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const tags = ['Eco-Friendly', 'Waterproof', 'Limited Edition', 'Best Seller'];

  const [expandedFilters, setExpandedFilters] = useState({
    brand: false,
    color: false,
    size: false,
    tags: false,
  });
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (user && user._id) {
      const fetchWishlist = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
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

  useEffect(() => {
    const fetchRatings = async () => {
      const sunnyRatings = JSON.parse(localStorage.getItem('productRatings'));
      if (sunnyRatings && Object.keys(sunnyRatings).length > 0) {
        setProductRatings(sunnyRatings);
        setIsRatingsLoading(false);
        return;
      }
      if (user && user._id && products.length > 0) {
        try {
          setIsRatingsLoading(true);
          const ratingsData = {};
          for (const product of products) {
            const res = await axios.get(`https://backend-ps76.onrender.com/api/reviews/product/${product._id}`);
            if (res.data && Array.isArray(res.data)) {
              const totalRating = res.data.reduce((sum, review) => sum + review.rating, 0);
              const averageRating = res.data.length > 0 ? (totalRating / res.data.length).toFixed(1) : 0;
              ratingsData[product._id] = { averageRating, reviewCount: res.data.length };
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
      const prices = products.map(p => Number(p.price) || 0);
      const max = Math.ceil(Math.max(...prices) / 100) * 100;
      setMaxPrice(max || 10000);
      setPriceRange(prev => [prev[0], Math.min(prev[1], max)]);
    }
  }, [products, loading]);

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
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
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
      updatedProducts = updatedProducts.filter((product) =>
        queryWords.some(word => product.name.toLowerCase().includes(word))
      );
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

    if (categoryFilter && categoryFilter !== 'All Categories') {
      updatedProducts = updatedProducts.filter((product) => {
        const productMainCategory = (product.mainCategory || '').trim();
        const productSubcategory = (product.subcategory || '').trim();
        const productNestedCategory = (product.nestedCategory || '').trim();

        const productCategoryPathParts = [
          productMainCategory,
          productSubcategory,
          productNestedCategory
        ].filter(Boolean);
        const productCategoryPath = productCategoryPathParts.join('/');

        const filterCategoryPath = categoryFilter.trim();

        const productCats = productCategoryPath.split('/').filter(Boolean);
        const filterCats = filterCategoryPath.split('/').filter(Boolean);

        if (filterCats.length > productCats.length) {
          return false;
        }

        let matches = true;
        for (let i = 0; i < filterCats.length; i++) {
          if (!productCats[i] || productCats[i] !== filterCats[i]) {
            matches = false;
            break;
          }
        }

        if (filterCats.length === 1) {
          const filterCat = filterCats[0];
          const productCat = productCats[0] || '';
          const categoryMappings = {
            Gadgets: ['Electronics', 'Mobiles', 'Appliances'],
            Beauty: ['Beauty'],
            Fashion: ['Fashion'],
            Furniture: ['Furniture'],
            Home: ['Home'],
            'Toys & Baby': ['Toys & Baby'],
            Sports: ['Sports']
          };

          if (categoryMappings[filterCat] && categoryMappings[filterCat].includes(productCat)) {
            matches = true;
          }
        }

        return matches;
      });
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

    if (quickFilters.approvedOnly && user?.role === 'admin') {
      updatedProducts = updatedProducts.filter((product) => product.approved === true);
    }

    if (quickFilters.lowStockAlert && user?.role === 'admin') {
      updatedProducts = updatedProducts.filter((product) => (product.stock || 0) < 10);
    }

    if (selectedBrand) {
      updatedProducts = updatedProducts.filter((product) =>
        product.brand && product.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    if (selectedColor) {
      updatedProducts = updatedProducts.filter((product) =>
        product.color && product.color.toLowerCase() === selectedColor.toLowerCase()
      );
    }

    if (selectedSize) {
      updatedProducts = updatedProducts.filter((product) =>
        product.size && product.size.toLowerCase() === selectedSize.toLowerCase()
      );
    }

    if (selectedTags.length > 0) {
      updatedProducts = updatedProducts.filter((product) =>
        product.tags && selectedTags.every(tag => product.tags.includes(tag))
      );
    }

    if (sort === 'popularity') {
      updatedProducts.sort((a, b) => (productRatings[b._id]?.reviewCount || 0) - (productRatings[a._id]?.reviewCount || 0));
    } else if (sort === 'price-asc') {
      updatedProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-desc') {
      updatedProducts.sort((a, b) => Number(b.price) - Number(b.price));
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
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, sort, productRatings, recentSearches, quickFilters, user, selectedBrand, selectedColor, selectedSize, selectedTags]);

  useEffect(() => {
    localStorage.setItem('sort', sort);
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('categoryFilter', categoryFilter);
    localStorage.setItem('priceRange', JSON.stringify(priceRange));
    localStorage.setItem('inStockOnly', inStockOnly.toString());
    localStorage.setItem('ratingFilter', ratingFilter);
    applyFilters();
  }, [sort, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, quickFilters, selectedBrand, selectedColor, selectedSize, selectedTags, applyFilters]);

  useEffect(() => {
    const currentFilters = {
      category: categoryFilter,
      priceRange,
      rating: ratingFilter,
      inStock: inStockOnly,
    };
    const filterString = JSON.stringify(currentFilters);
    if (categoryFilter || priceRange[0] !== 0 || priceRange[1] !== maxPrice || ratingFilter || inStockOnly) {
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
    setSelectedBrand('');
    setSelectedColor('');
    setSelectedSize('');
    setSelectedTags([]);
    setQuickFilters({ inStock: false, highRated: false, discounted: false, approvedOnly: false, lowStockAlert: false });
    setExpandedCategories(
      categories.reduce((acc, cat) => {
        acc[cat.name] = false;
        if (cat.sub) {
          cat.sub.forEach((sub) => {
            acc[sub.name] = false;
          });
        }
        return acc;
      }, {})
    );
    setExpandedFilters({ brand: false, color: false, size: false, tags: false });
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

  const handleAddToCart = (product, event) => {
    // Prevent multiple rapid clicks by checking if the toast has already been triggered
    const button = event.currentTarget;
    if (button.getAttribute('data-toast-triggered') === 'true') {
      return;
    }

    // Set the attribute to prevent further clicks temporarily
    button.setAttribute('data-toast-triggered', 'true');

    // Add the product to the cart
    addToCart(product);

    // Show the toast notification only once
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Reset the attribute after a short delay to allow for future clicks
    setTimeout(() => {
      button.setAttribute('data-toast-triggered', 'false');
    }, 1000);
  };

  const handleAddToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please log in to add to wishlist.');
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://backend-ps76.onrender.com/api/wishlist', { productId }, { headers: { Authorization: `Bearer ${token}` } });
      setWishlist([...wishlist, res.data.item]);
    } catch (err) {
      console.error('Error adding to wishlist:', err.response || err);
      toast.error(err.response?.data?.message || 'Failed to add to wishlist.');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const wishlistItem = wishlist.find((item) => item.productId && item.productId._id === productId);
      if (!wishlistItem) return;
      await axios.delete(`https://backend-ps76.onrender.com/api/wishlist/${wishlistItem._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setWishlist(wishlist.filter((item) => item._id !== wishlistItem._id));
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

  const handleApplyFashionFilter = () => {
    setShowFilters(false);
    applyFilters();
  };

  const handleApplyBrandFilter = () => {
    setShowFilters(false);
    applyFilters();
  };

  const handleApplyColorFilter = () => {
    setShowFilters(false);
    applyFilters();
  };

  const handleApplySizeFilter = () => {
    setShowFilters(false);
    applyFilters();
  };

  const handleApplyTagsFilter = () => {
    setShowFilters(false);
    applyFilters();
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeFilterCount = [
    categoryFilter && categoryFilter !== 'All Categories',
    priceRange[0] !== 0 || priceRange[1] !== maxPrice,
    ratingFilter,
    inStockOnly,
    selectedBrand,
    selectedColor,
    selectedSize,
    selectedTags.length > 0,
    ...Object.values(quickFilters).filter(Boolean),
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
    <div className="product-list-wrapper my-5">
      <div className="premium-deals-banner">
        <div className="deals-track">
          {[...titles, ...premiumDeals].map((deal, index) => (
            <span key={index} className="deal-item">{deal}</span>
          ))}
        </div>
      </div>
      <div className="container py-6">
        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-4">Explore Products</h1>
        <div className="products-content flex gap-6">
          <div className={`filters-sidebar ${showFilters ? 'filters-sidebar--visible' : 'filters-sidebar--hidden'}`}>
            <div className="filters-header flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800 mt-5">Filters</h3>
              <div className="flex gap-2 mt-5">
                <button className="text-blue-600 hover:underline text-sm" onClick={resetFilters}>Clear All</button>
                <button className="close-btn text-gray-800 text-xl hover:text-gray-600 md:hidden" onClick={() => setShowFilters(false)}>✕</button>
              </div>
            </div>
            {recentFilters.length > 0 && (
              <div className="filter-section mb-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Recent Filters</h4>
                {recentFilters.map((filter, index) => (
                  <button key={index} className="block w-full text-left text-blue-600 hover:underline text-sm py-1" onClick={() => applyRecentFilter(filter)}>
                    {filter.category || 'All Categories'}, ₹{filter.priceRange[0]}-₹{filter.priceRange[1]}
                    {filter.rating && `, ${filter.rating}★ & above`}{filter.inStock && ', In Stock'}
                  </button>
                ))}
              </div>
            )}
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Categories</h4>
              <div className="nested-categories">
                {categories.map((cat, index) => (
                  cat.name !== 'All Categories' && (
                    <div key={index} className="category-item mb-1">
                      <div
                        className="category-header flex justify-between items-center cursor-pointer"
                        onClick={() => {
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [cat.name]: !prev[cat.name],
                          }));
                        }}
                      >
                        {cat.name}
                        {cat.sub.length > 0 && (
                          <span className={`arrow-icon ${expandedCategories[cat.name] ? 'expanded' : ''}`}>
                            {expandedCategories[cat.name] ? '▼' : '▶'}
                          </span>
                        )}
                      </div>
                      {cat.sub.length > 0 && (
                        <div className={`subcategories ${expandedCategories[cat.name] ? 'block' : 'hidden'}`}>
                          {cat.sub.map((sub, subIndex) => (
                            <div key={subIndex} className="subcategory-item">
                              <div
                                className="subcategory-header flex justify-between items-center cursor-pointer"
                                onClick={() => setExpandedCategories((prev) => ({
                                  ...prev,
                                  [sub.name]: !prev[sub.name],
                                }))}
                              >
                                {sub.name}
                                {sub.nested.length > 0 && (
                                  <span className={`arrow-icon ${expandedCategories[sub.name] ? 'expanded' : ''}`}>
                                    {expandedCategories[sub.name] ? '▼' : '▶'}
                                  </span>
                                )}
                              </div>
                              <div className={`nested-categories ${expandedCategories[sub.name] ? 'block' : 'hidden'}`}>
                                {sub.nested.map((nested, nestedIndex) => (
                                  <div
                                    key={nestedIndex}
                                    className="nested-category cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                    onClick={() => setCategoryFilter(`${cat.name}/${sub.name}/${nested}`)}
                                  >
                                    {nested}
                                  </div>
                                ))}
                              </div>
                              <div
                                className="nested-category cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                onClick={() => setCategoryFilter(`${cat.name}/${sub.name}`)}
                              >
                                {sub.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {cat.sub.length === 0 && (
                        <div
                          className="nested-category cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                          onClick={() => setCategoryFilter(cat.name)}
                        >
                          {cat.name}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
              <button
                className="apply-btn mt-2 bg-blue-600 text-black px-4 py-1 rounded-lg text-sm hover:bg-blue-700 w-full"
                onClick={handleApplyFashionFilter}
              >
                Apply
              </button>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Brand</h4>
              <div className="custom-filter">
                <div
                  className="filter-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedFilters((prev) => ({ ...prev, brand: !prev.brand }))}
                >
                  Select Brand
                  <span className={`arrow-icon ${expandedFilters.brand ? 'expanded' : ''}`}>
                    {expandedFilters.brand ? '▼' : '▶'}
                  </span>
                </div>
                <div className={`filter-options ${expandedFilters.brand ? 'block' : 'hidden'}`}>
                  {brands.map((brand, index) => (
                    <div
                      key={index}
                      className="filter-option cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setSelectedBrand(brand === selectedBrand ? '' : brand)}
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="apply-btn mt-2 bg-blue-600 text-black px-4 py-1 rounded-lg text-sm hover:bg-blue-700 w-full"
                onClick={handleApplyBrandFilter}
              >
                Apply
              </button>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Color</h4>
              <div className="custom-filter">
                <div
                  className="filter-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedFilters((prev) => ({ ...prev, color: !prev.color }))}
                >
                  Select Color
                  <span className={`arrow-icon ${expandedFilters.color ? 'expanded' : ''}`}>
                    {expandedFilters.color ? '▼' : '▶'}
                  </span>
                </div>
                <div className={`filter-options ${expandedFilters.color ? 'block' : 'hidden'}`}>
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="filter-option cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setSelectedColor(color === selectedColor ? '' : color)}
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="apply-btn mt-2 bg-blue-600 text-black px-4 py-1 rounded-lg text-sm hover:bg-blue-700 w-full"
                onClick={handleApplyColorFilter}
              >
                Apply
              </button>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Size</h4>
              <div className="custom-filter">
                <div
                  className="filter-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedFilters((prev) => ({ ...prev, size: !prev.size }))}
                >
                  Select Size
                  <span className={`arrow-icon ${expandedFilters.size ? 'expanded' : ''}`}>
                    {expandedFilters.size ? '▼' : '▶'}
                  </span>
                </div>
                <div className={`filter-options ${expandedFilters.size ? 'block' : 'hidden'}`}>
                  {sizes.map((size, index) => (
                    <div
                      key={index}
                      className="filter-option cursor-pointer pl-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setSelectedSize(size === selectedSize ? '' : size)}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="apply-btn mt-2 bg-blue-600 text-black px-4 py-1 rounded-lg text-sm hover:bg-blue-700 w-full"
                onClick={handleApplySizeFilter}
              >
                Apply
              </button>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Tags</h4>
              <div className="custom-filter">
                <div
                  className="filter-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedFilters((prev) => ({ ...prev, tags: !prev.tags }))}
                >
                  Select Tags
                  <span className={`arrow-icon ${expandedFilters.tags ? 'expanded' : ''}`}>
                    {expandedFilters.tags ? '▼' : '▶'}
                  </span>
                </div>
                <div className={`filter-options ${expandedFilters.tags ? 'block' : 'hidden'}`}>
                  {tags.map((tag, index) => (
                    <label key={index} className="block pl-4 py-1 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="mr-2"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="apply-btn mt-2 bg-blue-600 text-black px-4 py-1 rounded-lg text-sm hover:bg-blue-700 w-full"
                onClick={handleApplyTagsFilter}
              >
                Apply
              </button>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Price Range</h4>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full"
              />
              <div className="text-xs text-gray-600 flex justify-between">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Customer Rating</h4>
              <label className="block text-sm text-gray-600">
                <input
                  type="radio"
                  name="rating"
                  value="4"
                  checked={ratingFilter === '4'}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="mr-2"
                />
                4★ & above
              </label>
              <label className="block text-sm text-gray-600">
                <input
                  type="radio"
                  name="rating"
                  value="3"
                  checked={ratingFilter === '3'}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="mr-2"
                />
                3★ & above
              </label>
              <label className="block text-sm text-gray-600">
                <input
                  type="radio"
                  name="rating"
                  value=""
                  checked={ratingFilter === ''}
                  onChange={() => setRatingFilter('')}
                  className="mr-2"
                />
                All
              </label>
            </div>
            <div className="filter-section mb-4">
              <label className="block text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={() => setInStockOnly(!inStockOnly)}
                  className="mr-2"
                />
                In Stock Only
              </label>
            </div>
          </div>
          <div className="products-main flex-1">
            <div className="products-header flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="search-bar relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowRecentSearches(true);
                  }}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={() => setShowRecentSearches(true)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="recent-searches absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10">
                    <div className="recent-searches-header flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">Recent Searches</h4>
                      <button className="text-blue-600 text-xs hover:underline" onClick={handleClearRecentSearches}>
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="recent-search-item cursor-pointer py-1 px-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        {search}
                      </div>
                    ))}
                  </div>
                )}
                {correctedSearch && searchQuery && (
                  <div className="search-suggestion absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10">
                    Did you mean: <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => handleSuggestionClick(correctedSearch)}>{correctedSearch}</span>
                  </div>
                )}
              </div>
              <div className="sort-options flex items-center gap-2">
                <button
                  className="btn-filter-toggle bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 md:hidden"
                  onClick={() => setShowFilters(true)}
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
                <div className="custom-sort-dropdown relative">
                  <label className="mr-2 text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="custom-sort-dropdown border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button className="btn-clear-all bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700" onClick={resetFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
            <div className="quick-filters flex gap-2 flex-wrap mb-4">
              <button
                className={`quick-filter-chip px-3 py-1 text-sm border rounded-full ${quickFilters.inStock ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('inStock')}
              >
                In Stock
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm border rounded-full ${quickFilters.highRated ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('highRated')}
              >
                High Rated (4★ & above)
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm border rounded-full ${quickFilters.discounted ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('discounted')}
              >
                Discounted
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm border rounded-full ${quickFilters.approvedOnly ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('approvedOnly')}
                  >
                    Approved Only
                  </button>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm border rounded-full ${quickFilters.lowStockAlert ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('lowStockAlert')}
                  >
                    Low Stock Alert
                  </button>
                </>
              )}
            </div>
            <div className="product-grid grid grid-cols-2 gap-3">
              {loading || isRatingsLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="product-card p-3 border rounded-lg bg-white shadow-sm">
                      <div className="skeleton-image w-full h-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="skeleton-text w-3/4 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
                      <div className="skeleton-text w-1/2 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
                      <div className="skeleton-button w-full h-8 bg-gray-200 rounded mt-2 animate-pulse"></div>
                    </div>
                  ))
                : filtered.length === 0
                ? <div className="no-products col-span-2 text-center text-gray-600">No products found.</div>
                : filtered.slice(0, visibleCount).map((product, index) => {
                    const isInWishlist = wishlist.some((item) => item.productId && item.productId._id === product._id);
                    const rating = productRatings[product._id]?.averageRating || 0;
                    const reviewCount = productRatings[product._id]?.reviewCount || 0;
                    const isLastElement = index === filtered.slice(0, visibleCount).length - 1;

                    return (
                      <div
                        key={product._id}
                        ref={isLastElement ? lastProductElementRef : null}
                        className="product-card p-3 border rounded-lg bg-white shadow-sm relative"
                      >
                        {product.offer && (
                          <span className="badge bg-green-600 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">{product.offer}% Off</span>
                        )}
                        {product.stock < 10 && product.stock > 0 && (
                          <span className="badge bg-yellow-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Low Stock</span>
                        )}
                        {product.stock === 0 && (
                          <span className="badge bg-red-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Out of Stock</span>
                        )}
                        {user?.role === 'admin' && !product.approved && (
                          <span className="badge bg-gray-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Not Approved</span>
                        )}
                        <button
                          className="wishlist-btn absolute top-2 right-2 text-gray-600 hover:text-red-600"
                          onClick={() => (isInWishlist ? handleRemoveFromWishlist(product._id) : handleAddToWishlist(product._id))}
                        >
                          {isInWishlist ? '❤️' : '🤍'}
                        </button>
                        {isInWishlist && (
                          <span className="wishlist-message bg-blue-600 text-white text-xs px-2 py-1 rounded absolute top-8 right-2">In Wishlist</span>
                        )}
                        <div className="image-container w-full h-48 flex items-center justify-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="product-image w-full h-full object-contain cursor-pointer"
                            onClick={() => navigate(`/product/${product._id}`)}
                          />
                        </div>
                        <div className="card-content flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="product-title text-sm font-medium text-gray-800 mb-2">{product.name}</h3>
                            <div className="price-section flex items-center gap-2 mb-2">
                              <span className="product-price text-base font-semibold text-gray-800">₹{product.price}</span>
                              {product.offer && (
                                <>
                                  <span className="original-price text-sm text-gray-500 line-through">
                                    ₹{Math.round(product.price / (1 - parseFloat(product.offer) / 100))}
                                  </span>
                                  <span className="discount text-sm font-medium text-green-600">{product.offer}% off</span>
                                </>
                              )}
                            </div>
                            <div className="rating-section mb-2">
                              {rating > 0 ? (
                                <span className="rating-badge bg-green-600 text-white text-xs px-2 py-1 rounded">
                                  {rating}★ ({reviewCount})
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">No ratings yet</span>
                              )}
                            </div>
                            <div className="stock-status mb-2">
                              {product.stock > 0 ? (
                                <span className="stock-status text-green-600 text-xs font-medium">In Stock ({product.stock})</span>
                              ) : (
                                <span className="stock-status text-red-600 text-xs font-medium">Out of Stock</span>
                              )}
                            </div>
                          </div>
                          <div className="button-group flex gap-2">
                            <button
                              className={`btn-add-to-cart flex-1 text-white px-4 py-2 rounded-lg text-sm ${product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                              onClick={(e) => handleAddToCart(product, e)}
                              disabled={product.stock === 0}
                            >
                              Add to Cart
                            </button>
                            <button
                              className="btn-view-details flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
            {isLoadingMore && (
              <div className="flex justify-center mt-4">
                <div className="spinner w-6 h-6 border-4 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
            {visibleCount >= filtered.length && filtered.length > 0 && (
              <div className="text-center mt-4 text-gray-600">No more products to load.</div>
            )}
            <button
              className="back-to-top fixed bottom-16 right-4 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-blue-700"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;