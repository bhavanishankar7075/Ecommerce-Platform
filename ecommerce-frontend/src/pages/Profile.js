import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

function Profile() {
  const { user, logout, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    address: '',
    avatar: '/default-avatar.jpg',
  });
  const [orders, setOrders] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showFullOrders, setShowFullOrders] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('All');
  const [wishlist, setWishlist] = useState([]);

  // Responsive handling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync profile data and fetch orders
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user && !isLoggingOut) {
      navigate('/login');
      return;
    }

    if (user && user._id) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        avatar: user.avatar || '/default-avatar.jpg',
      });
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, navigate, isLoggingOut]);



  // Fetch wishlist on mount
  useEffect(() => {
    if (user && user._id) {
      const fetchWishlist = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5001/api/wishlist/user/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWishlist(res.data || []);
        } catch (err) {
          console.error('Error fetching wishlist:', err);
          setError(err.response?.data?.message || 'Failed to load wishlist');
        }
      };
      fetchWishlist();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user?._id) throw new Error('User ID is undefined');
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        'http://localhost:5001/api/users/profile',
        { username: profileData.username, address: profileData.address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = res.data.user || res.data;
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `http://localhost:5001${updatedUser.avatar}`
        : profileData.avatar;
      setProfileData({
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        address: updatedUser.address || '',
        avatar: avatarUrl,
      });
      updateUser({ ...updatedUser, _id: updatedUser.id, avatar: avatarUrl });
      setIsEditing(false);
      setNotification({ message: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.response?.data?.message || 'Failed to save profile');
      setNotification({ message: 'Failed to update profile.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setError('Please select an image file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUser = res.data.user || res.data;
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `http://localhost:5001${updatedUser.avatar}`
        : '';
      setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
      updateUser({ ...updatedUser, _id: updatedUser.id, avatar: avatarUrl });
      setAvatarFile(null);
      setPreviewAvatar(null);
      setNotification({ message: 'Avatar updated successfully!', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload avatar');
      setNotification({ message: 'Failed to upload avatar.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { currentPassword, newPassword, confirmPassword } = passwordData;
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All password fields are required');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      const isConfirmed = window.confirm('Are you sure you want to change your password?');
      if (!isConfirmed) return;

      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5001/api/users/profile/password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setNotification({ message: 'Password updated successfully! Please log in again.', type: 'success' });
      setTimeout(() => {
        setNotification({ message: '', type: '' });
        logout().then(() => navigate('/login'));
      }, 3000);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.message || 'Failed to change password');
      setNotification({ message: 'Failed to change password.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
      setIsLoggingOut(false);
    }
  };

  const handleNavigateToOrders = () => {
    navigate('/orders');
  };

  // Add function to navigate to wishlist
  const handleNavigateToWishlist = () => {
    navigate('/wishlist');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredOrders = filterStatus === 'All'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  if (authLoading || loading) {
    return (
      <div className={`cosmic-loading ${darkMode ? 'dark-mode' : ''}`}>
        <div className="spinner-orbit"></div>
        <p>Loading Profile...</p>
        {error && <p className="error-pod">{error}</p>}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`profile-galaxy ${darkMode ? 'dark-mode' : ''}`}>
      <div className="profile-container">
        <aside className="stellar-sidebar">
          <div className="sidebar-header">
            <h2>Profile Dashboard</h2>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
          <nav className="sidebar-nav">
            <button
              className="nav-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              <i className="fas fa-user"></i> <span className="btn-text">Profile</span>
            </button>
            <button className="nav-btn" onClick={handleNavigateToOrders}>
              <i className="fas fa-list"></i> <span className="btn-text">Orders</span>
              {orders.length > 0 && (
                <span className="notification-badge">{orders.length}</span>
              )}
            </button>
            <button className="nav-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i> <span className="btn-text">Cart</span>
            </button>
            {/* Add Wishlist Button */}
            {/* <button className="nav-btn" onClick={handleNavigateToWishlist}>
              <i className="fas fa-heart"></i> <span className="btn-text">Wishlist</span>
            </button> */}

            <button className="nav-btn" onClick={handleNavigateToWishlist}>
              <i className="fas fa-heart"></i> <span className="btn-text">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="notification-badge">{wishlist.length}</span>
              )}
            </button>


            <button
              className="nav-btn"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <i className="fas fa-lock"></i> <span className="btn-text">Password</span>
            </button>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> <span className="btn-text">Logout</span>
            </button>
          </nav>
        </aside>
        <main className="cosmic-dashboard">
          <header className="dashboard-header">
            <h1>Welcome, {profileData.username || profileData.email}</h1>
            {notification.message && (
              <div className={`notification ${notification.type}`}>
                {notification.message}
                <button onClick={() => setNotification({ message: '', type: '' })}>✖</button>
              </div>
            )}
            {error && <p className="error-pod">{error}</p>}
          </header>
          <section className="profile-orbit">
            <div className="stellar-card profile-pod flip-card">
              <div className={`flip-card-inner ${isEditing ? 'flipped' : ''}`}>
                {/* Front Side (View Mode) */}
                <div className="flip-card-front">
                  <h3 className="card-title">Profile Details</h3>
                  <div className="avatar-cluster">
                    <div className="avatar-wrapper">
                      <img
                        src={profileData.avatar || '/default-avatar.jpg'}
                        alt="User Avatar"
                        className="avatar-star"
                        onError={(e) => {
                          console.log('Avatar load failed, using default:', e.target.src);
                          e.target.src = '/default-avatar.jpg';
                        }}
                      />
                    </div>
                  </div>
                  <div className="profile-data">
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <p><strong>Username:</strong> {profileData.username || 'N/A'}</p>
                    <p><strong>Address:</strong> {profileData.address || 'N/A'}</p>
                  </div>
                </div>
                {/* Back Side (Edit Mode) */}
                <div className="flip-card-back">
                  <h3 className="card-title">Edit Profile</h3>
                  <div className="avatar-cluster">
                    <div className="avatar-wrapper">
                      <img
                        src={previewAvatar || profileData.avatar || '/default-avatar.jpg'}
                        alt="User Avatar"
                        className="avatar-star"
                        onError={(e) => {
                          console.log('Avatar load failed, using default:', e.target.src);
                          e.target.src = '/default-avatar.jpg';
                        }}
                      />
                      <div className="avatar-edit">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="avatar-upload"
                        />
                        {avatarFile && (
                          <button className="nebula-btn upload-btn" onClick={handleAvatarUpload}>
                            Upload Avatar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="profile-data">
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <input
                      type="text"
                      name="username"
                      value={profileData.username || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Username"
                    />
                    <textarea
                      name="address"
                      value={profileData.address || ''}
                      onChange={handleInputChange}
                      className="input-field textarea-field"
                      placeholder="Address"
                    />
                    <div className="action-cluster">
                      <button className="nebula-btn save-btn" onClick={handleSaveProfile}>
                        Save
                      </button>
                      <button className="nebula-btn cancel-btn" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showPasswordForm && (
              <div className="stellar-card password-pod">
                <h3 className="card-title">Change Password</h3>
                <div className="password-form">
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Current Password"
                    className="input-field"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                    className="input-field"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm New Password"
                    className="input-field"
                  />
                  <button className="nebula-btn update-btn" onClick={handleChangePassword}>
                    Update Password
                  </button>
                </div>
              </div>
            )}

            <div className="stellar-card orders-pod">
              <h3 className="card-title">Orders</h3>
              <div className="order-filters">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="order-summary">
                <p>Total Orders: {orders.length}</p>
                <p>Total Spent: ₹{orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</p>
              </div>
              {filteredOrders.length > 0 ? (
                <div className="orders-orbit">
                  {(showFullOrders ? filteredOrders : filteredOrders.slice(0, 3)).map((order) => (
                    <div key={order._id} className="order-planet">
                      <p><strong>Order #{order._id.slice(-6)}</strong></p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>₹{order.total.toFixed(2)}</p>
                      <div className="status-indicator">
                        <span
                          className={`status-dot ${order.status.toLowerCase()}`}
                          title={order.status}
                        ></span>
                        <span>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {filteredOrders.length > 3 && (
                    <button
                      className="nebula-btn"
                      onClick={() => setShowFullOrders(!showFullOrders)}
                    >
                      {showFullOrders ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>
              ) : (
                <p>No orders found</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Profile;