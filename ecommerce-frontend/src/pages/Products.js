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
        nested: ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel'],
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
    approvedOnly: false,
    lowStockAlert: false,
  });
  const [visibleCount, setVisibleCount] = useState(12);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
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
  const [selectedProducts, setSelectedProducts] = useState(
    JSON.parse(localStorage.getItem('selectedProducts')) || []
  );
  const [priceDropAlerts, setPriceDropAlerts] = useState(
    JSON.parse(localStorage.getItem('priceDropAlerts')) || {}
  );
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

  const brands = ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'Samsung', 'Apple'];
  const colors = ['Red', 'Blue', 'Black', 'White', 'Green'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const tags = ['Eco-Friendly', 'Waterproof', 'Limited Edition', 'Best Seller'];

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

  useEffect(() => {
    if (products.length > 0) {
      const updatedAlerts = { ...priceDropAlerts };
      let hasPriceDrop = false;
      products.forEach((product) => {
        const alert = updatedAlerts[product._id];
        if (alert && product.price < alert.targetPrice && !alert.notified) {
          toast.info(`Price Drop Alert: ${product.name} is now ₹${product.price}!`, {
            position: 'bottom-right',
            autoClose: 5000,
          });
          updatedAlerts[product._id] = { ...alert, notified: true };
          hasPriceDrop = true;
        }
      });
      if (hasPriceDrop) {
        setPriceDropAlerts(updatedAlerts);
        localStorage.setItem('priceDropAlerts', JSON.stringify(updatedAlerts));
      }
    }
  }, [products]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [titles.length]);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
  }, [selectedProducts]);

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

    console.log('All Products:', products.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      mainCategory: p.mainCategory,
      subcategory: p.subcategory,
      nestedCategory: p.nestedCategory
    })));

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

        console.log(`Comparing Product: "${product.name}"`, {
          ProductCategoryPath: productCategoryPath,
          FilterCategoryPath: filterCategoryPath,
          ProductCats: productCats,
          FilterCats: filterCats
        });

        if (filterCats.length > productCats.length) {
          console.log(`Product ${product.name} has fewer category parts (${productCats.length}) than filter (${filterCats.length}), excluding.`);
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

        console.log(`Product ${product.name} (Category: ${productCategoryPath}) Match Result: ${matches}`);

        return matches;
      });

      console.log('Filtered Products after Category Filter:', updatedProducts.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        mainCategory: p.mainCategory,
        subcategory: p.subcategory,
        nestedCategory: p.nestedCategory
      })));
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
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, sort, productRatings, recentSearches, quickFilters, user]);

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

  const handleCompareToggle = (product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p._id === product._id);
      if (isSelected) return prev.filter((p) => p._id !== product._id);
      if (prev.length >= 4) {
        toast.error('You can compare up to 4 products at a time.', { position: 'bottom-right', autoClose: 2000 });
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleCompareNow = () => {
    if (selectedProducts.length < 2) {
      toast.error('Please select at least 2 products to compare.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    navigate('/compare', { state: { products: selectedProducts } });
  };

  const handleClearCompare = () => setSelectedProducts([]);

  const handleSetPriceDropAlert = (product) => {
    if (!user) {
      toast.error('Please log in to set a price drop alert.', { position: 'bottom-right', autoClose: 2000 });
      navigate('/login');
      return;
    }
    const targetPrice = prompt(`Enter your target price for ${product.name} (Current Price: ₹${product.price}):`, product.price * 0.9);
    if (targetPrice === null) return;
    const parsedPrice = parseFloat(targetPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid target price.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    if (parsedPrice >= product.price) {
      toast.error('Target price must be less than the current price.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    const newAlert = { targetPrice: parsedPrice, notified: false };
    setPriceDropAlerts((prev) => {
      const updatedAlerts = { ...prev, [product._id]: newAlert };
      localStorage.setItem('priceDropAlerts', JSON.stringify(updatedAlerts));
      return updatedAlerts;
    });
    toast.success(`Price drop alert set for ${product.name} at ₹${parsedPrice}!`, { position: 'bottom-right', autoClose: 2000 });
  };

  const handleBackToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleImageClick = (productId) => window.open(`/product/${productId}`, '_blank');
  const getStockStatus = (stock) => (stock || 0) > 0 ? 'In Stock' : 'Out of Stock';
  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} blasted into your cart!`, { position: 'bottom-right', autoClose: 2000, hideProgressBar: true, className: 'cosmic-toast' });
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
      setWishlistMessages((prev) => ({ ...prev, [productId]: 'Added to wishlist!' }));
      toast.success('Added to wishlist!');
      setTimeout(() => setWishlistMessages((prev) => ({ ...prev, [productId]: '' })), 3000);
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
      setWishlistMessages((prev) => ({ ...prev, [productId]: 'Removed from wishlist!' }));
      toast.success('Removed from wishlist!');
      setTimeout(() => setWishlistMessages((prev) => ({ ...prev, [productId]: '' })), 3000);
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
      <div className="container py-6">
        <div className="premium-deals-banner bg-blue-600 text-white px-4 py-2 rounded-lg overflow-hidden whitespace-nowrap mb-4">
          <div className="deals-track inline-block animate-scroll">
            {premiumDeals.concat(premiumDeals).map((deal, index) => (
              <span key={index} className="deal-item mx-6 text-sm">{deal}</span>
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-4">{titles[titleIndex]}</h1>
        <div className="products-content flex gap-6">
          <div className={`filters-sidebar ${showFilters ? 'visible' : ''}`}>
            <div className="filters-header flex justify-between items-center ">
              <h3 className="text-lg font-medium text-gray-800 mt-5">Filters</h3>
              <div className="flex gap-2 mt-5">
                <button className="text-blue-600 hover:underline text-sm " onClick={resetFilters}>Clear All</button>
                <button className="close-btn text-gray-800 text-xl hover:text-gray-600 md:hidden " onClick={() => setShowFilters(false)}>✕</button>
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
                    <label key={index} className="filter-option flex items-center pl-4 py-1 text-sm text-gray-600">
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
              <h4 className="text-sm font-medium text-gray-800 mb-2">Price</h4>
              <div className="text-xs text-gray-500 mb-2 flex justify-between">
                <span>₹{priceRange[0]}</span> - <span>₹{priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="w-full mb-2"
              />
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full"
              />
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Customer Ratings</h4>
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
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="mr-2"
                />
                All
              </label>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Availability</h4>
              <label className="block text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="mr-2"
                />
                In Stock Only
              </label>
            </div>
            {user?.role === 'admin' && (
              <div className="filter-section">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Admin Filters</h4>
                <label className="block text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={quickFilters.approvedOnly}
                    onChange={() => handleQuickFilterToggle('approvedOnly')}
                    className="mr-2"
                  />
                  Approved Only
                </label>
                <label className="block text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={quickFilters.lowStockAlert}
                    onChange={() => handleQuickFilterToggle('lowStockAlert')}
                    className="mr-2"
                  />
                  Low Stock Alert (10)
                </label>
              </div>
            )}
          </div>
          <div className="products-main flex-1">
            <div className="products-header flex justify-between items-center mb-4 flex-wrap gap-4">
              <div className="search-bar w-full max-w-md relative">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search the cosmos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  onKeyPress={handleSearchKeyPress}
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="recent-searches absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10 p-2 mt-1">
                    <div className="recent-searches-header flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">Recent Searches</h4>
                      <button className="text-blue-600 hover:underline text-xs" onClick={handleClearRecentSearches}>Clear All</button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div key={index} className="recent-search-item p-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleRecentSearchClick(search)}>
                        {search}
                      </div>
                    ))}
                  </div>
                )}
                {correctedSearch && searchQuery && (
                  <div className="search-suggestion absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-600 z-10 mt-1">
                    Did you mean: <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => handleSuggestionClick(correctedSearch)}>{correctedSearch}</span>?
                  </div>
                )}
              </div>
              <div className="sort-options flex items-center gap-2">
                <label className="text-sm text-gray-800">Sort By: </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option className='custom-sort-dropdown' value="popularity">Popularity</option>
                  <option className='custom-sort-dropdown' value="price-asc">Price -- Low to High</option>
                  <option className='custom-sort-dropdown' value="price-desc">Price -- High to Low</option>
                  <option className='custom-sort-dropdown' value="newest">Newest First</option>
                  <option className='custom-sort-dropdown' value="discount">Discount</option>
                </select>
              </div>
              <button className="btn-filter-toggle bg-blue-600 text-white p-2 rounded-lg text-sm hover:bg-blue-700" onClick={() => setShowFilters(!showFilters)}>
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              <button className=" btn-filter-toggle text-white p-2 rounded-lg text-sm hover:bg-blue-700" onClick={resetFilters}>Clear All</button>

            </div>
            <div className="quick-filters flex gap-2 mb-4 flex-wrap">
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.inStock ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('inStock')}
              >
                In Stock
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.highRated ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('highRated')}
              >
                High Rated (4★ & above)
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.discounted ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('discounted')}
              >
                Discounted
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.approvedOnly ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('approvedOnly')}
                  >
                    Approved Only
                  </button>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.lowStockAlert ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('lowStockAlert')}
                  >
                    Low Stock
                  </button>
                </>
              )}
            </div>
            <div className="product-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="product-card bg-white border border-gray-200 p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="skeleton-image w-full h-40 bg-gray-200 rounded"></div>
                    <div className="card-content mt-2">
                      <div className="skeleton-text w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="skeleton-text w-1/2 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="skeleton-text w-1/3 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="button-group flex gap-2 mt-auto">
                        <div className="skeleton-button w-full h-10 bg-gray-200 rounded"></div>
                        <div className="skeleton-button w-full h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.slice(0, visibleCount).map((product, index) => {
                  const stock = product.stock;
                  const isWishlisted = wishlist.some((item) => item.productId && item.productId._id === product._id);
                  const rating = productRatings[product._id] || { averageRating: 0, reviewCount: 0 };
                  const discount = product.offer ? parseFloat(product.offer) : 0;
                  const originalPrice = discount ? (product.price / (1 - discount / 100)).toFixed(2) : product.price;
                  const isLastElement = index === filtered.slice(0, visibleCount).length - 1;
                  const isSelectedForCompare = selectedProducts.some((p) => p._id === product._id);
                  const hasAlert = priceDropAlerts[product._id] && !priceDropAlerts[product._id].notified;
                  const isLowStock = (stock || 0) < 10 && user?.role === 'admin';
                  const isApproved = product.approved !== undefined ? product.approved : true;

                  return (
                    <div key={product._id} className="product-card bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" ref={isLastElement ? lastProductElementRef : null}>
                      <meta name="description" content={`${product.name} - ₹${product.price}`} />
                      {product.featured && <span className="badge bg-green-600 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Featured</span>}
                      {hasAlert && <span className="badge bg-yellow-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Price Alert</span>}
                      {isLowStock && <span className="badge bg-red-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Low Stock</span>}
                      {!isApproved && user?.role === 'admin' && <span className="badge bg-gray-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Unapproved</span>}
                      <button className="wishlist-btn absolute top-2 right-2 p-1 text-gray-600 hover:text-red-600 transition-colors" onClick={() => (isWishlisted ? handleRemoveFromWishlist(product._id) : handleAddToWishlist(product._id))}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#d32f2f' : 'none'} stroke={isWishlisted ? '#d32f2f' : '#212121'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                      {wishlistMessages[product._id] && <span className="wishlist-message absolute top-10 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">{wishlistMessages[product._id]}</span>}
                      <button className="price-alert-btn absolute top-10 right-2 p-1 text-gray-600 hover:text-yellow-600 transition-colors" onClick={() => handleSetPriceDropAlert(product)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212121" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                          <path d="M12 8v4"></path>
                          <path d="M12 16h.01"></path>
                        </svg>
                      </button>
                      <div className="image-container flex justify-center items-center mb-2 overflow-hidden">
                        {isRatingsLoading ? (
                          <div className="skeleton-image w-full h-full bg-gray-200 rounded"></div>
                        ) : (
                          <img
                            src={product.image || 'https://via.placeholder.com/150'}
                            alt={product.name}
                            width="150"
                            height="150"
                            className="product-image max-h-full max-w-full object-cover cursor-pointer"
                            loading="lazy"
                            onError={(e) => { console.log(`Failed to load image for ${product.name}: ${product.image}`); e.target.src = 'https://via.placeholder.com/150'; }}
                            onClick={() => handleImageClick(product._id)}
                          />
                        )}
                      </div>
                      <div className="card-content flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="product-title text-sm font-medium text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
                          <div className="price-section flex items-center gap-2 mb-1 flex-wrap">
                            <span className="product-price text-lg font-semibold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
                            {discount > 0 && (
                              <>
                                <span className="original-price text-sm text-gray-500 line-through">₹{Number(originalPrice).toFixed(2)}</span>
                                <span className="discount text-sm font-medium text-green-600">{discount}% off</span>
                              </>
                            )}
                          </div>
                          {rating.averageRating > 0 && (
                            <div className="rating-section mb-1">
                              <span className="rating-badge bg-green-600 text-white text-xs px-2 py-1 rounded">{rating.averageRating} ★ ({rating.reviewCount})</span>
                            </div>
                          )}
                          <p className={`stock-status text-xs font-medium ${getStockStatus(stock).replace(' ', '-') === 'In-Stock' ? 'text-green-600' : 'text-red-600'} mb-2`}>{getStockStatus(stock)}</p>
                          <div className="compare-section mb-2">
                            <label className="flex items-center text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={isSelectedForCompare}
                                onChange={() => handleCompareToggle(product)}
                                className="mr-1"
                              />{' '}
                              Compare
                            </label>
                          </div>
                        </div>
                        <div className="button-group flex gap-2">
                          <button
                            className="btn-add-to-cart bg-teal-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed w-full"
                            onClick={() => handleAddToCart(product)}
                            disabled={stock <= 0}
                          >
                            <i className="fas fa-shopping-cart"></i> Add
                          </button>
                          <button
                            className="btn-view-details bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 w-full hidden md:block"
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
                <div className="no-products text-center text-lg text-gray-500 py-4">No products found in this galaxy.</div>
              )}
            </div>
            {isLoadingMore && <div className="load-more-section text-center py-4"><div className="spinner w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin inline-block"></div></div>}
          </div>
        </div>
        {selectedProducts.length > 0 && (
          <div className="comparison-bar fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
            <div className="comparison-content max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-800">Selected Products ({selectedProducts.length}/4):</span>
              <div className="selected-products flex gap-3 overflow-x-auto py-2 px-2">
                {selectedProducts.map((product) => (
                  <div key={product._id} className="selected-product flex items-center gap-2 bg-gray-100 p-2 rounded-lg text-xs text-gray-700 min-w-[120px]">
                    <img
                      src={product.image || 'https://via.placeholder.com/40'}
                      alt={product.name}
                      className="selected-product-image w-10 h-10 object-contain"
                    />
                    <span className="line-clamp-1">{product.name.length > 15 ? `${product.name.slice(0, 15)}...` : product.name}</span>
                    <button className="remove-product text-red-500 hover:text-red-700 text-sm" onClick={() => handleCompareToggle(product)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="comparison-actions flex gap-3">
                <button className="btn-clear-compare border border-gray-200 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100" onClick={handleClearCompare}>
                  Clear
                </button>
                <button className="btn-compare-now bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700" onClick={handleCompareNow}>
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        )}
        {scrollPosition > 300 && <button className="back-to-top fixed bottom-8 right-8 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-blue-700" onClick={handleBackToTop}>↑</button>}
      </div>
    </div>
  );
}

export default ProductList;





























/*  import { useState, useEffect, useCallback, useRef } from 'react';
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
    approvedOnly: false,
    lowStockAlert: false,
  });
  const [visibleCount, setVisibleCount] = useState(12);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories] = useState([
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
          nested: ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Google Pixel'],
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
  ]);
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
  const [selectedProducts, setSelectedProducts] = useState(
    JSON.parse(localStorage.getItem('selectedProducts')) || []
  );
  const [priceDropAlerts, setPriceDropAlerts] = useState(
    JSON.parse(localStorage.getItem('priceDropAlerts')) || {}
  );
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

  useEffect(() => {
    if (products.length > 0) {
      const updatedAlerts = { ...priceDropAlerts };
      let hasPriceDrop = false;
      products.forEach((product) => {
        const alert = updatedAlerts[product._id];
        if (alert && product.price < alert.targetPrice && !alert.notified) {
          toast.info(`Price Drop Alert: ${product.name} is now ₹${product.price}!`, {
            position: 'bottom-right',
            autoClose: 5000,
          });
          updatedAlerts[product._id] = { ...alert, notified: true };
          hasPriceDrop = true;
        }
      });
      if (hasPriceDrop) {
        setPriceDropAlerts(updatedAlerts);
        localStorage.setItem('priceDropAlerts', JSON.stringify(updatedAlerts));
      }
    }
  }, [products]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [titles.length]);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
  }, [selectedProducts]);

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

    // Log all products to debug their categories
    console.log('All Products:', products.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      mainCategory: p.mainCategory,
      subcategory: p.subcategory,
      nestedCategory: p.nestedCategory
    })));

    // Apply search filter
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

    // Apply category filter with case-sensitive matching
    if (categoryFilter && categoryFilter !== 'All Categories') {
      updatedProducts = updatedProducts.filter((product) => {
        // Construct the full category path from product fields with original capitalization
        const productMainCategory = (product.mainCategory || '').trim();
        const productSubcategory = (product.subcategory || '').trim();
        const productNestedCategory = (product.nestedCategory || '').trim();

        // Create the product's full category path (e.g., "Fashion/Men/Top Wear")
        const productCategoryPathParts = [
          productMainCategory,
          productSubcategory,
          productNestedCategory
        ].filter(Boolean); // Remove empty strings
        const productCategoryPath = productCategoryPathParts.join('/');

        // Use the filter category path as-is (e.g., "Fashion/Men/Top Wear")
        const filterCategoryPath = categoryFilter.trim();

        // Split both paths into parts for comparison
        const productCats = productCategoryPath.split('/').filter(Boolean);
        const filterCats = filterCategoryPath.split('/').filter(Boolean);

        // Log the comparison for debugging
        console.log(`Comparing Product: "${product.name}"`, {
          ProductCategoryPath: productCategoryPath,
          FilterCategoryPath: filterCategoryPath,
          ProductCats: productCats,
          FilterCats: filterCats
        });

        // If the filter has more parts than the product category path, it can't match
        if (filterCats.length > productCats.length) {
          console.log(`Product ${product.name} has fewer category parts (${productCats.length}) than filter (${filterCats.length}), excluding.`);
          return false;
        }

        // Compare each part of the filter with the corresponding part of the product category (case-sensitive)
        let matches = true;
        for (let i = 0; i < filterCats.length; i++) {
          if (!productCats[i] || productCats[i] !== filterCats[i]) {
            matches = false;
            break;
          }
        }

        // Special case for top-level categories (e.g., "Gadgets")
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

        // Log the result of the match
        console.log(`Product ${product.name} (Category: ${productCategoryPath}) Match Result: ${matches}`);

        return matches;
      });

      // Log the filtered products after category filter
      console.log('Filtered Products after Category Filter:', updatedProducts.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        mainCategory: p.mainCategory,
        subcategory: p.subcategory,
        nestedCategory: p.nestedCategory
      })));
    }

    // Apply price filter
    updatedProducts = updatedProducts.filter(
      (product) => Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1]
    );

    // Apply stock filter
    if (inStockOnly || quickFilters.inStock) {
      updatedProducts = updatedProducts.filter((product) => (product.stock || 0) > 0);
    }

    // Apply rating filter
    if (ratingFilter || quickFilters.highRated) {
      updatedProducts = updatedProducts.filter((product) => {
        const rating = productRatings[product._id]?.averageRating || 0;
        if (ratingFilter === '4') return rating >= 4;
        if (ratingFilter === '3') return rating >= 3;
        if (quickFilters.highRated) return rating >= 4;
        return true;
      });
    }

    // Apply discount filter
    if (quickFilters.discounted) {
      updatedProducts = updatedProducts.filter((product) => product.offer && parseFloat(product.offer) > 0);
    }

    // Apply admin filters
    if (quickFilters.approvedOnly && user?.role === 'admin') {
      updatedProducts = updatedProducts.filter((product) => product.approved === true);
    }

    if (quickFilters.lowStockAlert && user?.role === 'admin') {
      updatedProducts = updatedProducts.filter((product) => (product.stock || 0) < 10);
    }

    // Apply sorting
    if (sort === 'popularity') {
      updatedProducts.sort((a, b) => (productRatings[b._id]?.reviewCount || 0) - (productRatings[a._id]?.reviewCount || 0));
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
  }, [products, searchQuery, categoryFilter, priceRange, inStockOnly, ratingFilter, sort, productRatings, recentSearches, quickFilters, user]);

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
    setQuickFilters({ inStock: false, highRated: false, discounted: false, approvedOnly: false, lowStockAlert: false });
    setExpandedCategories({});
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

  const handleCompareToggle = (product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p._id === product._id);
      if (isSelected) return prev.filter((p) => p._id !== product._id);
      if (prev.length >= 4) {
        toast.error('You can compare up to 4 products at a time.', { position: 'bottom-right', autoClose: 2000 });
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleCompareNow = () => {
    if (selectedProducts.length < 2) {
      toast.error('Please select at least 2 products to compare.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    navigate('/compare', { state: { products: selectedProducts } });
  };

  const handleClearCompare = () => setSelectedProducts([]);

  const handleSetPriceDropAlert = (product) => {
    if (!user) {
      toast.error('Please log in to set a price drop alert.', { position: 'bottom-right', autoClose: 2000 });
      navigate('/login');
      return;
    }
    const targetPrice = prompt(`Enter your target price for ${product.name} (Current Price: ₹${product.price}):`, product.price * 0.9);
    if (targetPrice === null) return;
    const parsedPrice = parseFloat(targetPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid target price.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    if (parsedPrice >= product.price) {
      toast.error('Target price must be less than the current price.', { position: 'bottom-right', autoClose: 2000 });
      return;
    }
    const newAlert = { targetPrice: parsedPrice, notified: false };
    setPriceDropAlerts((prev) => {
      const updatedAlerts = { ...prev, [product._id]: newAlert };
      localStorage.setItem('priceDropAlerts', JSON.stringify(updatedAlerts));
      return updatedAlerts;
    });
    toast.success(`Price drop alert set for ${product.name} at ₹${parsedPrice}!`, { position: 'bottom-right', autoClose: 2000 });
  };

  const handleBackToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleImageClick = (productId) => window.open(`/product/${productId}`, '_blank');
  const getStockStatus = (stock) => (stock || 0) > 0 ? 'In Stock' : 'Out of Stock';
  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} blasted into your cart!`, { position: 'bottom-right', autoClose: 2000, hideProgressBar: true, className: 'cosmic-toast' });
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
      setWishlistMessages((prev) => ({ ...prev, [productId]: 'Added to wishlist!' }));
      toast.success('Added to wishlist!');
      setTimeout(() => setWishlistMessages((prev) => ({ ...prev, [productId]: '' })), 3000);
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
      setWishlistMessages((prev) => ({ ...prev, [productId]: 'Removed from wishlist!' }));
      toast.success('Removed from wishlist!');
      setTimeout(() => setWishlistMessages((prev) => ({ ...prev, [productId]: '' })), 3000);
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

  const handleApplyFashionFilter = (cat) => {
    setCategoryFilter(cat === categoryFilter ? '' : cat);
    setShowFilters(false);
    applyFilters();
  };

  const activeFilterCount = [
    categoryFilter && categoryFilter !== 'All Categories',
    priceRange[0] !== 0 || priceRange[1] !== maxPrice,
    ratingFilter,
    inStockOnly,
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
    <div className="product-list-wrapper">
      <div className="container py-6">
        <div className="premium-deals-banner bg-blue-600 text-white px-4 py-2 rounded-lg overflow-hidden whitespace-nowrap mb-4">
          <div className="deals-track inline-block animate-scroll">
            {premiumDeals.concat(premiumDeals).map((deal, index) => (
              <span key={index} className="deal-item mx-6 text-sm">{deal}</span>
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-4">{titles[titleIndex]}</h1>
        <div className="products-content flex gap-6">
          <div className={`filters-sidebar w-64 bg-white p-4 border border-gray-200 shadow-md ${showFilters ? 'visible' : ''}`}>
            <div className="filters-header flex justify-between items-center mt-5">
              <h3 className="text-lg font-medium text-gray-800 mt-5">Filters</h3>
              <div className="flex gap-2 mt-5">
                <button className="text-blue-600 hover:underline text-sm" onClick={resetFilters}>Clear All</button>
                <button className="text-gray-800 text-xl hover:text-gray-600" onClick={() => setShowFilters(false)}>✕</button>
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
              {categories.map((cat, index) => (
                cat.name !== 'All Categories' && (
                  <div key={index}>
                    <button
                      className="w-full text-left text-sm font-medium text-gray-800 py-2 hover:bg-gray-100 rounded transition-colors"
                      onClick={() => {
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [cat.name]: !prev[cat.name],
                        }));
                      }}
                    >
                      {cat.name} {cat.sub.length > 0 && (expandedCategories[cat.name] ? '▼' : '▶')}
                    </button>
                    {cat.sub.length > 0 && expandedCategories[cat.name] && (
                      <div className="ml-4">
                        {cat.sub.map((sub, subIndex) => (
                          <div key={subIndex}>
                            <button
                              className="w-full text-left text-sm text-gray-600 py-1 hover:bg-gray-100 rounded transition-colors"
                              onClick={() => setExpandedCategories((prev) => ({
                                ...prev,
                                [sub.name]: !prev[sub.name],
                              }))}
                            >
                              {sub.name} {sub.nested.length > 0 && (expandedCategories[sub.name] ? '▼' : '▶')}
                            </button>
                            {expandedCategories[sub.name] && sub.nested.map((nested, nestedIndex) => (
                              <button
                                key={nestedIndex}
                                className="w-full text-left text-sm text-gray-500 pl-6 py-1 hover:bg-gray-100 rounded transition-colors"
                                onClick={() => setCategoryFilter(`${cat.name}/${sub.name}/${nested}`)}
                              >
                                {nested}
                              </button>
                            ))}
                          </div>
                        ))}
                        {cat.sub.map((sub, subIndex) => (
                          <button
                            key={subIndex}
                            className="w-full text-left text-sm text-gray-600 py-1 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => setCategoryFilter(`${cat.name}/${sub.name}`)}
                          >
                            {sub.name}
                          </button>
                        ))}
                        <button
                          className="w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 mt-2"
                          onClick={() => handleApplyFashionFilter(cat.name)}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {cat.sub.length === 0 && (
                      <button
                        className="w-full text-left text-sm text-gray-600 py-1 hover:bg-gray-100 rounded transition-colors ml-4"
                        onClick={() => handleApplyFashionFilter(cat.name)}
                      >
                        {cat.name}
                      </button>
                    )}
                  </div>
                )
              ))}
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Price</h4>
              <div className="text-xs text-gray-500 mb-2 flex justify-between">
                <span>₹{priceRange[0]}</span> - <span>₹{priceRange[1]}</span>
              </div>
              <input type="range" min="0" max={maxPrice} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full mb-2" />
              <input type="range" min="0" max={maxPrice} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full" />
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Customer Ratings</h4>
              <label className="block text-sm text-gray-600"><input type="radio" name="rating" value="4" checked={ratingFilter === '4'} onChange={(e) => setRatingFilter(e.target.value)} className="mr-2" />4★ & above</label>
              <label className="block text-sm text-gray-600"><input type="radio" name="rating" value="3" checked={ratingFilter === '3'} onChange={(e) => setRatingFilter(e.target.value)} className="mr-2" />3★ & above</label>
              <label className="block text-sm text-gray-600"><input type="radio" name="rating" value="" checked={ratingFilter === ''} onChange={(e) => setRatingFilter(e.target.value)} className="mr-2" />All</label>
            </div>
            <div className="filter-section mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Availability</h4>
              <label className="block text-sm text-gray-600"><input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="mr-2" />In Stock Only</label>
            </div>
            {user?.role === 'admin' && (
              <div className="filter-section">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Admin Filters</h4>
                <label className="block text-sm text-gray-600"><input type="checkbox" checked={quickFilters.approvedOnly} onChange={() => handleQuickFilterToggle('approvedOnly')} className="mr-2" />Approved Only</label>
                <label className="block text-sm text-gray-600"><input type="checkbox" checked={quickFilters.lowStockAlert} onChange={() => handleQuickFilterToggle('lowStockAlert')} className="mr-2" />Low Stock Alert (10)</label>
              </div>
            )}
          </div>
          <div className="products-main flex-1">
            <div className="products-header flex justify-between items-center mb-4 flex-wrap gap-4">
              <div className="search-bar w-full max-w-md relative">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search the cosmos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  onKeyPress={handleSearchKeyPress}
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="recent-searches absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10 p-2 mt-1">
                    <div className="recent-searches-header flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">Recent Searches</h4>
                      <button className="text-blue-600 hover:underline text-xs" onClick={handleClearRecentSearches}>Clear All</button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div key={index} className="recent-search-item p-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleRecentSearchClick(search)}>
                        {search}
                      </div>
                    ))}
                  </div>
                )}
                {correctedSearch && searchQuery && (
                  <div className="search-suggestion absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-600 z-10 mt-1">
                    Did you mean: <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => handleSuggestionClick(correctedSearch)}>{correctedSearch}</span>?
                  </div>
                )}
              </div>
              <div className="sort-options flex items-center gap-2">
                <label className="text-sm text-gray-800">Sort By: </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price -- Low to High</option>
                  <option value="price-desc">Price -- High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
              <button className="btn-filter-toggle bg-blue-600 text-white p-2 rounded-lg text-sm hover:bg-blue-700 hidden md:block" onClick={() => setShowFilters(!showFilters)}>
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
            <div className="quick-filters flex gap-2 mb-4 flex-wrap">
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.inStock ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('inStock')}
              >
                In Stock
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.highRated ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('highRated')}
              >
                High Rated (4★ & above)
              </button>
              <button
                className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.discounted ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                onClick={() => handleQuickFilterToggle('discounted')}
              >
                Discounted
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.approvedOnly ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('approvedOnly')}
                  >
                    Approved Only
                  </button>
                  <button
                    className={`quick-filter-chip px-3 py-1 text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition-colors ${quickFilters.lowStockAlert ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600'}`}
                    onClick={() => handleQuickFilterToggle('lowStockAlert')}
                  >
                    Low Stock
                  </button>
                </>
              )}
            </div>
            <div className="product-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="product-card bg-white border border-gray-200 p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="skeleton-image w-full h-40 bg-gray-200 rounded"></div>
                    <div className="card-content mt-2">
                      <div className="skeleton-text w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="skeleton-text w-1/2 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="skeleton-text w-1/3 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="button-group flex gap-2 mt-auto">
                        <div className="skeleton-button w-full h-10 bg-gray-200 rounded"></div>
                        <div className="skeleton-button w-full h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.slice(0, visibleCount).map((product, index) => {
                  const stock = product.stock;
                  const isWishlisted = wishlist.some((item) => item.productId && item.productId._id === product._id);
                  const rating = productRatings[product._id] || { averageRating: 0, reviewCount: 0 };
                  const discount = product.offer ? parseFloat(product.offer) : 0;
                  const originalPrice = discount ? (product.price / (1 - discount / 100)).toFixed(2) : product.price;
                  const isLastElement = index === filtered.slice(0, visibleCount).length - 1;
                  const isSelectedForCompare = selectedProducts.some((p) => p._id === product._id);
                  const hasAlert = priceDropAlerts[product._id] && !priceDropAlerts[product._id].notified;
                  const isLowStock = (stock || 0) < 10 && user?.role === 'admin';
                  const isApproved = product.approved !== undefined ? product.approved : true;

                  return (
                    <div key={product._id} className="product-card bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" ref={isLastElement ? lastProductElementRef : null}>
                      <meta name="description" content={`${product.name} - ₹${product.price}`} />
                      {product.featured && <span className="badge bg-green-600 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Featured</span>}
                      {hasAlert && <span className="badge bg-yellow-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Price Alert</span>}
                      {isLowStock && <span className="badge bg-red-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Low Stock</span>}
                      {!isApproved && user?.role === 'admin' && <span className="badge bg-gray-500 text-white text-xs px-2 py-1 rounded absolute top-2 left-2">Unapproved</span>}
                      <button className="wishlist-btn absolute top-2 right-2 p-1 text-gray-600 hover:text-red-600 transition-colors" onClick={() => (isWishlisted ? handleRemoveFromWishlist(product._id) : handleAddToWishlist(product._id))}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#d32f2f' : 'none'} stroke={isWishlisted ? '#d32f2f' : '#212121'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                      {wishlistMessages[product._id] && <span className="wishlist-message absolute top-10 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">{wishlistMessages[product._id]}</span>}
                      <button className="price-alert-btn absolute top-10 right-2 p-1 text-gray-600 hover:text-yellow-600 transition-colors" onClick={() => handleSetPriceDropAlert(product)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212121" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                          <path d="M12 8v4"></path>
                          <path d="M12 16h.01"></path>
                        </svg>
                      </button>
                      <div className="image-container flex justify-center items-center mb-2 overflow-hidden">
                        {isRatingsLoading ? (
                          <div className="skeleton-image w-full h-full bg-gray-200 rounded"></div>
                        ) : (
                          <img
                            src={product.image || 'https://via.placeholder.com/150'}
                            alt={product.name}
                            className="product-image max-h-full max-w-full object-contain cursor-pointer"
                            loading="lazy"
                            onError={(e) => { console.log(`Failed to load image for ${product.name}: ${product.image}`); e.target.src = 'https://via.placeholder.com/150'; }}
                            onClick={() => handleImageClick(product._id)}
                          />
                        )}
                      </div>
                      <div className="card-content flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="product-title text-sm font-medium text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
                          <div className="price-section flex items-center gap-2 mb-1 flex-wrap">
                            <span className="product-price text-lg font-semibold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
                            {discount > 0 && (
                              <>
                                <span className="original-price text-sm text-gray-500 line-through">₹{Number(originalPrice).toFixed(2)}</span>
                                <span className="discount text-sm font-medium text-green-600">{discount}% off</span>
                              </>
                            )}
                          </div>
                          {rating.averageRating > 0 && (
                            <div className="rating-section mb-1">
                              <span className="rating-badge bg-green-600 text-white text-xs px-2 py-1 rounded">{rating.averageRating} ★ ({rating.reviewCount})</span>
                            </div>
                          )}
                          <p className={`stock-status text-xs font-medium ${getStockStatus(stock).replace(' ', '-') === 'In-Stock' ? 'text-green-600' : 'text-red-600'} mb-2`}>{getStockStatus(stock)}</p>
                          <div className="compare-section mb-2">
                            <label className="flex items-center text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={isSelectedForCompare}
                                onChange={() => handleCompareToggle(product)}
                                className="mr-1"
                              />{' '}
                              Compare
                            </label>
                          </div>
                        </div>
                        <div className="button-group flex gap-2">
                          <button
                            className="btn-add-to-cart bg-teal-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed w-full"
                            onClick={() => handleAddToCart(product)}
                            disabled={stock <= 0}
                          >
                            <i className="fas fa-shopping-cart"></i> Add
                          </button>
                          <button
                            className="btn-view-details bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 w-full hidden md:block"
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
                <div className="no-products text-center text-lg text-gray-500 py-4">No products found in this galaxy.</div>
              )}
            </div>
            {isLoadingMore && <div className="load-more-section text-center py-4"><div className="spinner w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin inline-block"></div></div>}
          </div>
        </div>
        {selectedProducts.length > 0 && (
          <div className="comparison-bar fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
            <div className="comparison-content max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-800">Selected Products ({selectedProducts.length}/4):</span>
              <div className="selected-products flex gap-3 overflow-x-auto py-2 px-2">
                {selectedProducts.map((product) => (
                  <div key={product._id} className="selected-product flex items-center gap-2 bg-gray-100 p-2 rounded-lg text-xs text-gray-700 min-w-[120px]">
                    <img
                      src={product.image || 'https://via.placeholder.com/40'}
                      alt={product.name}
                      className="selected-product-image w-10 h-10 object-contain"
                    />
                    <span className="line-clamp-1">{product.name.length > 15 ? `${product.name.slice(0, 15)}...` : product.name}</span>
                    <button className="remove-product text-red-500 hover:text-red-700 text-sm" onClick={() => handleCompareToggle(product)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="comparison-actions flex gap-3">
                <button className="btn-clear-compare border border-gray-200 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100" onClick={handleClearCompare}>
                  Clear
                </button>
                <button className="btn-compare-now bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700" onClick={handleCompareNow}>
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        )}
        {scrollPosition > 300 && <button className="back-to-top fixed bottom-8 right-8 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-blue-700" onClick={handleBackToTop}>↑</button>}
      </div>
    </div>
  );
}

export default ProductList;  */