// ecommerce-frontend/src/pages/Categories.js
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { motion } from 'framer-motion';
import '../styles/Categories.css';

function Categories() {
  const { user } = useAuth();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const navigate = useNavigate();

  const categories = [
    { name: 'Grocery', image: 'https://placehold.co/50x50?text=Grocery' },
    { name: 'Fashion', image: 'https://placehold.co/50x50?text=Fashion' },
    { name: 'Gadgets', image: 'https://placehold.co/50x50?text=Gadgets' },
    { name: 'Electronics', image: 'https://placehold.co/50x50?text=Electronics' },
    { name: 'Furniture', image: 'https://placehold.co/50x50?text=Furniture' },
    { name: 'Food', image: 'https://placehold.co/50x50?text=Food' },
    { name: 'Scan & Pay', image: 'https://placehold.co/50x50?text=Scan+%26+Pay' },
    { name: 'Mobiles', image: 'https://placehold.co/50x50?text=Mobiles' },
    { name: 'Appliances', image: 'https://placehold.co/50x50?text=Appliances' },
    { name: 'Beauty', image: 'https://placehold.co/50x50?text=Beauty' },
    { name: 'Home', image: 'https://placehold.co/50x50?text=Home' },
    { name: 'Toys', image: 'https://placehold.co/50x50?text=Toys' },
  ];

  // Filter products based on selected category and search query
  useEffect(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, products]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Mock related products (replace with actual logic if needed)
  const relatedProducts = products.slice(0, 4);
  const topPicks = products.slice(4, 8);
  const bestDeals = products.slice(8, 12);
  const recentlyViewed = products.slice(12, 16);

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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="categories-wrapper">
      <div className="categories-container">
        {/* Left Sidebar: Categories */}
        <motion.aside initial="hidden" animate="visible" variants={fadeIn} className="category-sidebar">
          <h2>Categories</h2>
          <div className="category-list">
            <div
              className={`category-item ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <img
                src="https://placehold.co/50x50?text=All"
                alt="All Categories"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/50x50?text=All';
                }}
              />
              <span>All Categories</span>
            </div>
            {categories.map((category) => (
              <div
                key={category.name}
                className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/50x50?text=Category';
                  }}
                />
                <span>{category.name}</span>
              </div>
            ))}
          </div>
        </motion.aside>

        {/* Right Content: Products and Sections */}
        <div className="categories-content">
          {/* Header: Search */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="categories-header">
            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search within this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Filtered Products */}
          {filteredProducts.length > 0 ? (
            <motion.section initial="hidden" animate="visible" variants={fadeIn} className="filtered-products-section">
              <h2>{selectedCategory ? `${selectedCategory} Products` : 'All Products'}</h2>
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
            </motion.section>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="no-products">
              <p>No products found. Try a different category or search term.</p>
            </motion.div>
          )}

          {/* Related Products */}
          <motion.section initial="hidden" animate="visible" variants={fadeIn} className="related-products-section">
            <h2>Related Products</h2>
            <div className="product-list">
              {relatedProducts.map((product) => (
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
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Top Picks */}
          <motion.section initial="hidden" animate="visible" variants={fadeIn} className="top-picks-section">
            <h2>Top Picks</h2>
            <div className="product-list">
              {topPicks.map((product) => (
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
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Best Deals */}
          <motion.section initial="hidden" animate="visible" variants={fadeIn} className="best-deals-section">
            <h2>Best Deals</h2>
            <div className="product-list">
              {bestDeals.map((product) => (
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
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Recently Viewed */}
          <motion.section initial="hidden" animate="visible" variants={fadeIn} className="recently-viewed-section">
            <h2>Recently Viewed</h2>
            <div className="product-list">
              {recentlyViewed.map((product) => (
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
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default Categories;