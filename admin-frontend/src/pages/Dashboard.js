import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaBox, FaExclamationTriangle, FaMoneyBillWave, FaPlus, FaDownload, FaEye } from 'react-icons/fa';
import '../styles/Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1); // Add state for current page
  const [totalPages, setTotalPages] = useState(1); // Add state for total pages
  const productsPerPage = 10; // Number of products per page
  const navigate = useNavigate();

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme; // Apply theme to body for global styling
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: productsPerPage,
        });

        const res = await axios.get(`http://localhost:5001/api/admin/products?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages || 1); // Set total pages from API response
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching products');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchProducts().finally(() => setLoading(false));
  }, [navigate, currentPage]); // Add currentPage as a dependency to refetch products when the page changes

  // Prepare data for category distribution chart
  const categoryData = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#C9CB3F',
          '#FF6F61',
        ],
        hoverBackgroundColor: [
          '#FF4F6B',
          '#2A91D8',
          '#FFBB33',
          '#3A9C9C',
          '#8855EE',
          '#FF8C26',
          '#B5B72F',
          '#FF5A4D',
        ],
      },
    ],
  };

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 5).length;
  const totalRevenue = products.reduce((sum, p) => sum + p.price * (p.stock || 0), 0);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    if (sortField === 'price' || sortField === 'stock') {
      return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    return sortOrder === 'asc'
      ? fieldA.localeCompare(fieldB)
      : fieldB.localeCompare(fieldA);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={`dashboard-container ${theme}`}>
      <Sidebar />
      <div className="dashboard-content">
        {/* Header */}
        <div className="header">
          <h2>Admin Dashboard</h2>
          <div className="header-actions">
            <label className="theme-toggle">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </label>
            <button
              className="products-btn"
              onClick={() => navigate('/products')}
            >
              Go to Products
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <FaBox className="stat-icon" />
            <div>
              <h4>Total Products</h4>
              <p>{totalProducts}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaExclamationTriangle className="stat-icon" />
            <div>
              <h4>Low Stock</h4>
              <p>{lowStockProducts}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaMoneyBillWave className="stat-icon" />
            <div>
              <h4>Total Revenue</h4>
              <p>₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={() => navigate('/products')}
            >
              <FaPlus /> Add New Product
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/products?filter=lowStock')}
            >
              <FaEye /> View Low Stock
            </button>
            <button className="action-btn">
              <FaDownload /> Export Data
            </button>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="chart-section">
          <h3>Category Distribution</h3>
          <div className="chart-container">
            <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Product List */}
        <div className="products-list">
          <h3>Products Overview</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category')}>
                  Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('price')}>
                  Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('stock')}>
                  Stock {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <tr key={product._id} className={product.stock <= 5 ? 'low-stock' : ''}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>₹{Number(product.price).toFixed(2)}</td>
                    <td>
                      {product.stock}{' '}
                      {product.stock <= 5 && <span className="low-stock-badge">Low</span>}
                    </td>
                    <td>
                      <img
                        src={product.image || 'http://localhost:5001/uploads/default-image.png'}
                        alt={product.name}
                        width="50"
                        onError={(e) => {
                          console.log('Dashboard image load failed:', e.target.src);
                          e.target.src = 'http://localhost:5001/uploads/default-image.png';
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
