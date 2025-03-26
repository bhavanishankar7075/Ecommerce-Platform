// ecommerce-frontend/src/pages/Categories.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Categories.css';

function Categories() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredCategoryProducts, setFilteredCategoryProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const navigate = useNavigate();

  const categories = [
    { name: 'Grocery', image: 'https://placehold.co/100x100?text=Grocery' },
    { name: 'Fashion', image: 'https://placehold.co/100x100?text=Fashion' },
    { name: 'Gadgets', image: 'https://placehold.co/100x100?text=Gadgets' },
    { name: 'Electronics', image: 'https://placehold.co/100x100?text=Electronics' },
    { name: 'Furniture', image: 'https://placehold.co/100x100?text=Furniture' },
    { name: 'Food', image: 'https://placehold.co/100x100?text=Food' },
    { name: 'Scan & Pay', image: 'https://placehold.co/100x100?text=Scan+%26+Pay' },
    { name: 'Mobiles', image: 'https://placehold.co/100x100?text=Mobiles' },
    { name: 'Appliances', image: 'https://placehold.co/100x100?text=Appliances' },
    { name: 'Beauty', image: 'https://placehold.co/100x100?text=Beauty' },
    { name: 'Home', image: 'https://placehold.co/100x100?text=Home' },
    { name: 'Toys', image: 'https://placehold.co/100x100?text=Toys' },
  ];

  useEffect(() => {
    if (selectedCategory) {
      const filtered = products.filter((product) =>
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      setFilteredCategoryProducts(filtered);
      setCurrentPage(1);
    } else {
      setFilteredCategoryProducts([]);
    }
  }, [selectedCategory, products]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredCategoryProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredCategoryProducts.length / productsPerPage);

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
      {/* Category Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-section">
        <div className="container">
          <h2>Categories</h2>
          <div className="category-container">
            {categories.map((category) => (
              <div
                className="category-item"
                key={category.name}
                onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
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

      {/* Filtered Category Products */}
      {selectedCategory && filteredCategoryProducts.length > 0 && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-products-section">
          <div className="container">
            <h2>{selectedCategory} Products</h2>
            <div className="product-list">
              {currentProducts.map((product) => (
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
          </div>
        </motion.section>
      )}
    </div>
  );
}

export default Categories;