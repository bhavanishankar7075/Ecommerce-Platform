// ecommerce-frontend/src/pages/Profile.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

function Profile() {
  const { user, logout, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: '', address: '', avatar: '' });
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut) {
      navigate('/login');
    } else if (user) {
      setProfile({ fullName: user.fullName, address: user.address || '', avatar: user.avatar || '' });
      fetchOrders();
      fetchAddresses();
    }
  }, [user, authLoading, navigate, isLoggingOut]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching orders with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch Orders Error:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching addresses with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.get(`http://localhost:5001/api/users/profile/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error('Fetch Addresses Error:', err);
      setError(err.response?.data?.message || 'Failed to load addresses');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Saving profile with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.put('http://localhost:5001/api/users/profile', profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setIsEditing(false);
      setError('');
    } catch (err) {
      console.error('Save Profile Error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Changing password with token:', token); // Debug
      if (!token) throw new Error('No token found');
      await axios.put('http://localhost:5001/api/users/profile/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasswordData({ currentPassword: '', newPassword: '' });
      setError('');
      alert('Password updated successfully');
      setShowPasswordForm(false);
    } catch (err) {
      console.error('Change Password Error:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const token = localStorage.getItem('token');
      console.log('Uploading avatar with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.post('http://localhost:5001/api/users/profile/avatar', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      console.log('Avatar Upload Response:', res.data);
      const updatedUser = res.data.user;
      setProfile((prev) => ({ ...prev, avatar: updatedUser.avatar }));
      updateUser(updatedUser);
      setAvatarFile(null);
      setError('');
    } catch (err) {
      console.error('Avatar Upload Error:', err);
      setError(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    try {
      const token = localStorage.getItem('token');
      console.log('Adding address with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.post(
        'http://localhost:5001/api/users/profile/addresses',
        { address: newAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(res.data.addresses);
      setNewAddress('');
      setShowAddressForm(false);
      setError('');
    } catch (err) {
      console.error('Add Address Error:', err);
      setError(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting address with token:', token); // Debug
      if (!token) throw new Error('No token found');
      const res = await axios.delete(`http://localhost:5001/api/users/profile/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses);
      setError('');
    } catch (err) {
      console.error('Delete Address Error:', err);
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  if (authLoading || loading || (isLoggingOut && !user)) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  console.log('Rendering profile:', profile);

  return (
    <div className="profile-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Control Hub</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-btn active">Profile</button>
          <button className="nav-btn" onClick={() => navigate('/orders')}>Orders</button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
      </aside>
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>User Interface</h1>
          {error && <p className="error-alert">{error}</p>}
        </header>
        <section className="profile-grid">
          <div className="card profile-card">
            <div className="avatar-container">
              <img
                src={profile.avatar || 'https://via.placeholder.com/100'}
                alt="Avatar"
                className="avatar-img"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                className="avatar-upload"
              />
              {avatarFile && (
                <button className="action-btn upload-btn" onClick={handleAvatarUpload}>
                  Upload
                </button>
              )}
            </div>
            <div className="profile-info">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {profile.fullName}</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    placeholder="Primary Address"
                    className="input-field textarea-field"
                  />
                  <button className="action-btn save-btn" onClick={handleSaveProfile}>
                    Save
                  </button>
                  <button className="action-btn cancel-btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p><strong>Primary Address:</strong> {profile.address || 'Not set'}</p>
                  <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="card addresses-card">
            <h3
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="card-title"
              style={{ cursor: 'pointer' }}
            >
              Shipping Addresses {showAddressForm ? '▼' : '►'}
            </h3>
            {addresses.length > 0 ? (
              <ul className="address-list">
                {addresses.map((addr) => (
                  <li key={addr._id} className="address-item">
                    {addr.address}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteAddress(addr._id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No additional addresses</p>
            )}
            {showAddressForm && (
              <div className="address-form">
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter new shipping address"
                  className="input-field textarea-field"
                />
                <button className="action-btn add-btn" onClick={handleAddAddress}>
                  Add Address
                </button>
              </div>
            )}
          </div>

          <div className="card password-card">
            <h3 onClick={() => setShowPasswordForm(!showPasswordForm)} className="card-title">
              Change Password {showPasswordForm ? '▼' : '►'}
            </h3>
            {showPasswordForm && (
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
                <button className="action-btn change-btn" onClick={handleChangePassword}>
                  Update Password
                </button>
              </div>
            )}
          </div>

          <div className="card orders-card">
            <h3 className="card-title">Recent Orders</h3>
            <div className="orders-grid">
              {orders.length > 0 ? (
                orders.slice(0, 3).map((order) => (
                  <div key={order._id} className="order-item">
                    <p>
                      <strong>Order #{order._id.slice(-6)}</strong>
                    </p>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p>₹{order.total.toFixed(2)}</p>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                ))
              ) : (
                <p>No recent orders</p>
              )}
            </div>
            <button className="action-btn view-all-btn" onClick={() => navigate('/orders')}>
              View All Orders
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;