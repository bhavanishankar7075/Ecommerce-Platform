












































































// admin-frontend/src/pages/Dashboard.js
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

export default Dashboard;   