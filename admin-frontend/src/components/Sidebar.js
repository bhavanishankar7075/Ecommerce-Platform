// admin-frontend/src/components/Sidebar.js
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token'); // Check if admin is logged in

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h3>Admin Panel</h3>
      <ul>
        <li>
          <Link to="/dashboard">
            <span className="icon">🏠</span>
            <span className="text">Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/products">
            <span className="icon">📦</span>
            <span className="text">Products</span>
          </Link>
        </li>
        <li>
          <Link to="/signup">
            <span className="icon">✍️</span>
            <span className="text">Signup</span>
          </Link>
        </li>
        <li>
          <Link to="/login">
            <span className="icon">🔑</span>
            <span className="text">Login</span>
          </Link>
        </li>
        <li>
          <Link to="/admin/orders">
            <span className="icon">🔑</span>
            <span className="text">orders</span>
          </Link>
        </li>
        {isLoggedIn && (
          <li>
            <button onClick={handleLogout}>
              <span className="icon">🚪</span>
              <span className="text">Logout</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;