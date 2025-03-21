import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatsPanel from '../components/StatsPanel';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaBox, FaExclamationTriangle, FaMoneyBillWave, FaPlus, FaDownload, FaEye } from 'react-icons/fa';
import '../styles/Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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
        const res = await axios.get('http://localhost:5001/api/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching products');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    const fetchActivityLog = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/admin/activity', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivityLog(res.data.activities || []);
      } catch (err) {
        console.error('Error fetching activity log:', err);
        setActivityLog([]);
      }
    };

    Promise.all([fetchProducts(), fetchActivityLog()]).finally(() => setLoading(false));
  }, [navigate]);

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
              {sortedProducts.map((product) => (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity Log */}
        <div className="activity-log">
          <h3>Recent Activity</h3>
          {activityLog.length > 0 ? (
            <ul>
              {activityLog.slice(0, 5).map((activity, index) => (
                <li key={index}>
                  {activity.action} - {new Date(activity.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;




































































/* // admin-frontend/src/pages/Dashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatsPanel from '../components/StatsPanel';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching products');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="header">
          <h2>Admin Dashboard</h2>
          <button className="products-btn" onClick={() => navigate('/products')}>
            Go to Products
          </button>
        </div>
        <StatsPanel products={products} />
        <div className="products-list">
          <h3>Products</h3>
          <ul>
            {products.map((product) => (
              <li key={product._id}>
                {product.name} - ₹{Number(product.price).toFixed(2)}
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    width="50"
                    onError={(e) => (e.target.src = 'http://localhost:5001/uploads/default-image.png')}
                  />
                ) : (
                  <img src="http://localhost:5001/uploads/default-image.png" alt="Default" width="50" />
                )}
              </li>
            ))} 
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;    */