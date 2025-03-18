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
    avatar: '/default-avatar.jpg' // Default avatar as fallback
  });
  const [orders, setOrders] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showFullOrders, setShowFullOrders] = useState(false);

  // Responsive handling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync profile data and fetch orders
  useEffect(() => {
    console.log('Profile useEffect - authLoading:', authLoading, 'user:', user, 'isLoggingOut:', isLoggingOut);

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user && !isLoggingOut) {
      console.log('No user detected, navigating to /login');
      navigate('/login');
      return;
    }

    if (user && user._id) {
      console.log('User detected, syncing profile data for:', user._id);
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        avatar: user.avatar || '/default-avatar.jpg'
      });
      fetchOrders().then(() => {
        console.log('Orders fetch completed');
        setLoading(false);
      }).catch((err) => {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, authLoading, navigate, isLoggingOut]);

  const fetchOrders = async () => {
    try {
      if (!user?._id) throw new Error('User ID is undefined');
      console.log('Fetching orders for user:', user._id);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Orders response:', res.data);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Fetch orders error:', err.response?.data || err.message);
      throw err;
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
      console.log('Saving profile:', profileData);
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5001/api/users/profile', {
        username: profileData.username,
        address: profileData.address
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Save profile response:', res.data);
      const updatedUser = res.data.user || res.data; // Handle root-level or nested user
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `http://localhost:5001${updatedUser.avatar}`
        : profileData.avatar; // Fallback to current avatar
      setProfileData({
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        address: updatedUser.address || '',
        avatar: avatarUrl
      });
      updateUser({ ...updatedUser, _id: updatedUser.id, avatar: avatarUrl });
      setIsEditing(false);
      setError('');
      console.log('Profile saved successfully:', updatedUser);
    } catch (err) {
      console.error('Save profile error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to save profile');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setError('Please select an image file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    console.log('Uploading avatar:', {
      fileName: avatarFile.name,
      fileSize: avatarFile.size,
      fileType: avatarFile.type,
    });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');
      const res = await axios.post('http://localhost:5001/api/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Avatar upload response:', res.data);
      const updatedUser = res.data.user || res.data; // Handle root-level or nested user
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `http://localhost:5001${updatedUser.avatar}`
        : '';
      setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
      updateUser({ ...updatedUser, _id: updatedUser.id, avatar: avatarUrl });
      setAvatarFile(null);
      setError('');
      console.log('Avatar updated successfully, new URL:', avatarUrl);
    } catch (err) {
      console.error('Avatar upload error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to upload avatar');
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
      setError('');
      alert('Password updated successfully. Please log in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Password change error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to change password');
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
    navigate('/orders'); // Navigate to orders page
  };

  if (authLoading || loading) {
    return (
      <div className="cosmic-loading">
        <div className="spinner-orbit"></div>
        <p>Loading Profile...</p>
        {error && <p className="error-pod">{error}</p>}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-galaxy">
      <div className="profile-container">
        <aside className="stellar-sidebar">
          <div className="sidebar-header">
            <h2>Profile Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <button className="nav-btn" onClick={() => setIsEditing(!isEditing)}>
              <i className="fas fa-user"></i> {isEditing ? 'View Profile' : 'Edit Profile'}
            </button>
            <button className="nav-btn" onClick={handleNavigateToOrders}>
              <i className="fas fa-list"></i> Orders
            </button>
            <button className="nav-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i> Cart
            </button>
            <button className="nav-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              <i className="fas fa-lock"></i> {showPasswordForm ? 'Hide Password' : 'Change Password'}
            </button>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </nav>
        </aside>
        <main className="cosmic-dashboard">
          <header className="dashboard-header">
            <h1>Welcome, {profileData.username || profileData.email}</h1>
            {error && <p className="error-pod">{error}</p>}
          </header>
          <section className="profile-orbit">
            {isEditing ? (
              <div className="stellar-card profile-pod">
                <h3 className="card-title">Edit Profile</h3>
                <div className="avatar-cluster">
                  <img
                    src={profileData.avatar || '/default-avatar.jpg'}
                    alt="User Avatar"
                    className="avatar-star"
                    onError={(e) => {
                      console.log('Avatar load failed, using default:', e.target.src);
                      e.target.src = '/default-avatar.jpg';
                    }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="avatar-upload"
                  />
                  {avatarFile && (
                    <button className="nebula-btn upload-btn" onClick={handleAvatarUpload}>
                      Upload Avatar
                    </button>
                  )}
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
            ) : (
              <div className="stellar-card profile-pod">
                <h3 className="card-title">Profile Details</h3>
                <div className="avatar-cluster">
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
                <div className="profile-data">
                  <p><strong>Username:</strong> {profileData.username || 'N/A'}</p>
                  <p><strong>Email:</strong> {profileData.email}</p>
                  <p><strong>Address:</strong> {profileData.address || 'N/A'}</p>
                </div>
              </div>
            )}

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
              {orders.length > 0 ? (
                <div className="orders-orbit">
                  {(showFullOrders ? orders : orders.slice(0, 3)).map((order) => (
                    <div key={order._id} className="order-planet">
                      <p><strong>Order #{order._id.slice(-6)}</strong></p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>₹{order.total.toFixed(2)}</p>
                      <p>Status: {order.status}</p>
                    </div>
                  ))}
                  {orders.length > 3 && (
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