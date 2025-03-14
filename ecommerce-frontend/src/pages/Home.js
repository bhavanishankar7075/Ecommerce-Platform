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
  const navigate = useNavigate();

  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      const featured = products.filter((product) => product.featured);
      setFeaturedProducts(featured.length > 0 ? featured : products.slice(0, 3));

      const sortedByPrice = [...products].sort((a, b) => Number(b.price) - Number(a.price));
      setTrendingProducts(sortedByPrice.slice(0, 3));
    }
  }, [products, productsLoading]);

  useEffect(() => {
    if (featuredProducts.length > 0) {
      console.log('Featured products with image URLs:', featuredProducts.map(p => ({ name: p.name, image: p.image })));
    }
    if (trendingProducts.length > 0) {
      console.log('Trending products with image URLs:', trendingProducts.map(p => ({ name: p.name, image: p.image })));
    }
  }, [featuredProducts, trendingProducts]);

  if (authLoading || productsLoading) {
    return <div className="container my-5"><div className="spinner"></div></div>;
  }

  if (productsError) {
    return (
      <div className="container my-5 text-center">
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
    <div className="home-wrapper py-5 my-5">
      {/* Hero Section with Carousel */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="hero-section">
        <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner w-100">
            {featuredProducts.map((product, index) => (
              <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={product._id}>
                <img
                  src={product.image}
                  className="d-block carousel-image"
                  alt={product.name}
                  style={{ height: '500px' }}
                  onError={(e) => {
                    console.log(`Failed to load image for ${product.name}: ${product.image}`);
                    e.target.style.display = 'none'; // Hide the image if it fails
                  }}
                />
                <div className="carousel-caption">
                  <h3>{product.name}</h3>
                  <p>₹{Number(product.price).toFixed(2)}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(user ? `/product/${product._id}` : '/login')}
                  >
                    {user ? 'Shop Now' : 'Login to Shop'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="prev"
          >
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="next"
          >
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </motion.section>

      {/* Welcome Section */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="welcome-section text-center">
        <div className="container">
          <h1>Welcome to E-Shop</h1>
          <p className="lead">
            {user
              ? 'Explore the latest trends and unbeatable deals!'
              : 'Join us today to unlock exclusive shopping experiences.'}
          </p>
          <button
            className="btn btn-gradient btn-lg"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            {user ? 'Start Shopping' : 'Get Started'}
          </button>
        </div>
      </motion.section>

      {/* Trending Products Section */}
      {user && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="trending-section">
          <div className="container">
            <h2 className="text-center mb-4">Trending Products</h2>
            <div className="row">
              {trendingProducts.map((product) => (
                <div className="col-lg-4 col-md-6 col-sm-12 mb-4" key={product._id}>
                  <div className="product-card">
                    <div className="image-container">
                      <img
                        src={product.image}
                        className="img-fluid"
                        alt={product.name}
                        onError={(e) => {
                          console.log(`Failed to load image for ${product.name}: ${product.image}`);
                          e.target.style.display = 'none'; // Hide the image if it fails
                        }}
                      />
                    </div>
                    <div className="card-body">
                      <h5>{product.name}</h5>
                      <p className="price">₹{Number(product.price).toFixed(2)}</p>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Category Showcase */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-section">
        <div className="container">
          <h2 className="text-center mb-4">Shop by Category</h2>
          <div className="row">
            {['Electronics', 'Clothing', 'Accessories'].map((category) => (
              <div className="col-lg-4 col-md-6 mb-4" key={category}>
                <div className="category-card">
                  <div className="category-overlay">
                    <h3>{category}</h3>
                    <button
                      className="btn btn-light"
                      onClick={() => navigate(user ? `/products?category=${category.toLowerCase()}` : '/login')}
                    >
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Call-to-Action Banner */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="cta-section text-center">
        <div className="container">
          <h2>{user ? 'Exclusive Offers Await!' : 'Join the E-Shop Family!'}</h2>
          <p className="lead">
            {user
              ? 'Get the best deals on your favorite products today.'
              : 'Sign up now for exclusive access and discounts.'}
          </p>
          <button
            className="btn btn-success btn-lg"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            {user ? 'Shop Deals' : 'Sign Up Now'}
          </button>
        </div>
      </motion.section>
    </div>
  );
}

export default Home;




































































/* // ecommerce-frontend/src/pages/Home.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Home.css';

function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { user, loading: authLoading } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      const featured = products.filter((product) => product.featured);
      setFeaturedProducts(featured.length > 0 ? featured : products.slice(0, 3));

      const sortedByPrice = [...products].sort((a, b) => Number(b.price) - Number(a.price));
      setTrendingProducts(sortedByPrice.slice(0, 3));
    } else if (!productsLoading && products.length === 0) {
      setFeaturedProducts([]);
      setTrendingProducts([]);
    }
  }, [products, productsLoading]);

  if (authLoading || productsLoading) {
    return <div className="container my-5"><div className="spinner"></div></div>;
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="home-wrapper py-5 my-5">
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="hero-section">
        <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner w-100">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={product.id}>
                  <img
                    src={product.image}
                    className="d-block carousel-image"
                    alt={product.name}
                    style={{ height: '500px' }}
                  />
                  <div className="carousel-caption">
                    <h3>{product.name}</h3>
                    <p>₹{Number(product.price).toFixed(2)}</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(user ? `/product/${product.id}` : '/login')}
                    >
                      {user ? 'Shop Now' : 'Login to Shop'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="carousel-item active">
                <img
                  src="https://via.placeholder.com/1200x500?text=No+Featured+Products"
                  className="d-block carousel-image"
                  alt="No Featured Products"
                  style={{ height: '500px' }}
                />
                <div className="carousel-caption">
                  <h3>No Featured Products</h3>
                  <p>Check back later for exciting deals!</p>
                </div>
              </div>
            )}
          </div>
          {featuredProducts.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
              </button>
            </>
          )}
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="welcome-section text-center">
        <div className="container">
          <h1>Welcome to E-Shop</h1>
          <p className="lead">
            {user
              ? 'Explore the latest trends and unbeatable deals!'
              : 'Join us today to unlock exclusive shopping experiences.'}
          </p>
          <button
            className="btn btn-gradient btn-lg"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            {user ? 'Start Shopping' : 'Get Started'}
          </button>
        </div>
      </motion.section>

      {user && (
        <motion.section initial="hidden" animate="visible" variants={fadeIn} className="trending-section">
          <div className="container">
            <h2 className="text-center mb-4">Trending Products</h2>
            {trendingProducts.length > 0 ? (
              <div className="row">
                {trendingProducts.map((product) => (
                  <div className="col-lg-4 col-md-6 col-sm-12 mb-4" key={product.id}>
                    <div className="product-card">
                      <div className="image-container">
                        <img
                          src={product.image}
                          className="img-fluid"
                          alt={product.name}
                        />
                      </div>
                      <div className="card-body">
                        <h5>{product.name}</h5>
                        <p className="price">₹{Number(product.price).toFixed(2)}</p>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center">No trending products available.</p>
            )}
          </div>
        </motion.section>
      )}

      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="category-section">
        <div className="container">
          <h2 className="text-center mb-4">Shop by Category</h2>
          <div className="row">
            {['Electronics', 'Clothing', 'Accessories'].map((category) => (
              <div className="col-lg-4 col-md-6 mb-4" key={category}>
                <div className="category-card">
                  <div className="category-overlay">
                    <h3>{category}</h3>
                    <button
                      className="btn btn-light"
                      onClick={() => navigate(user ? '/products' : '/login')}
                    >
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="cta-section text-center">
        <div className="container">
          <h2>{user ? 'Exclusive Offers Await!' : 'Join the E-Shop Family!'}</h2>
          <p className="lead">
            {user
              ? 'Get the best deals on your favorite products today.'
              : 'Sign up now for exclusive access and discounts.'}
          </p>
          <button
            className="btn btn-success btn-lg"
            onClick={() => navigate(user ? '/products' : '/signup')}
          >
            {user ? 'Shop Deals' : 'Sign Up Now'}
          </button>
        </div>
      </motion.section>
    </div>
  );
}

export default Home; */