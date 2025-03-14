
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
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({ cardNumber: '', expiry: '', name: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showFullOrders, setShowFullOrders] = useState(false);

  useEffect(() => {
    console.log('useEffect - user:', user, 'authLoading:', authLoading);
    if (!authLoading && !user && !isLoggingOut) {
      navigate('/login');
    } else if (user && user._id) { // Use _id instead of id
      setProfile({ fullName: user.fullName, address: user.address || '', avatar: user.avatar || '' });
      fetchOrders();
      fetchAddresses();
      fetchPaymentMethods();
    }
  }, [user, authLoading, navigate,  isLoggingOut]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching orders - user._id:', user._id, 'token:', token);
      if (!token) {
        navigate('/login');
        throw new Error('No token found');
      }
      if (!user._id) {
        throw new Error('User ID is undefined');
      }
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Orders fetched:', res.data);
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Unauthorized access. Please log in with correct credentials.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
      setLoading(false);
    }
  };


  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get(`http://localhost:5001/api/users/profile/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get(`http://localhost:5001/api/users/profile/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
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

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setNewPaymentMethod((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put('http://localhost:5001/api/users/profile', profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.put('http://localhost:5001/api/users/profile/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasswordData({ currentPassword: '', newPassword: '' });
      setError('');
      alert('Password updated successfully');
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.post('http://localhost:5001/api/users/profile/avatar', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data.user;
      setProfile((prev) => ({ ...prev, avatar: updatedUser.avatar }));
      updateUser(updatedUser);
      setAvatarFile(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    try {
      const token = localStorage.getItem('token');
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
      setError(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.delete(`http://localhost:5001/api/users/profile/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber.trim() || !newPaymentMethod.expiry.trim() || !newPaymentMethod.name.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.post(
        'http://localhost:5001/api/users/profile/payment-methods',
        newPaymentMethod,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentMethods(res.data.paymentMethods);
      setNewPaymentMethod({ cardNumber: '', expiry: '', name: '' });
      setShowPaymentForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment method');
    }
  };

  const handleDeletePaymentMethod = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.delete(`http://localhost:5001/api/users/profile/payment-methods/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment method');
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

          <div className="card payment-methods-card">
            <h3
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="card-title"
              style={{ cursor: 'pointer' }}
            >
              Payment Methods {showPaymentForm ? '▼' : '►'}
            </h3>
            {paymentMethods.length > 0 ? (
              <ul className="payment-list">
                {paymentMethods.map((method) => (
                  <li key={method._id} className="payment-item">
                    {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeletePaymentMethod(method._id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No saved payment methods</p>
            )}
            {showPaymentForm && (
              <div className="payment-form">
                <input
                  type="text"
                  name="name"
                  value={newPaymentMethod.name}
                  onChange={handlePaymentInputChange}
                  placeholder="Cardholder Name"
                  className="input-field"
                />
                <input
                  type="text"
                  name="cardNumber"
                  value={newPaymentMethod.cardNumber}
                  onChange={handlePaymentInputChange}
                  placeholder="Card Number (e.g., 1234 5678 9012 3456)"
                  className="input-field"
                  maxLength="19"
                />
                <input
                  type="text"
                  name="expiry"
                  value={newPaymentMethod.expiry}
                  onChange={handlePaymentInputChange}
                  placeholder="MM/YY"
                  className="input-field"
                  maxLength="5"
                />
                <button className="action-btn add-btn" onClick={handleAddPaymentMethod}>
                  Add Payment Method
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
            <h3
              onClick={() => setShowFullOrders(!showFullOrders)}
              className="card-title"
              style={{ cursor: 'pointer' }}
            >
              Order History {showFullOrders ? '▼' : '►'}
            </h3>
            {orders.length > 0 ? (
              <div className="orders-list">
                {(showFullOrders ? orders : orders.slice(0, 3)).map((order) => (
                  <div key={order._id} className="order-item">
                    <div className="order-header">
                      <p><strong>Order #{order._id.slice(-6)}</strong></p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>₹{order.total.toFixed(2)}</p>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Shipping Address:</strong> {order.shippingAddress}</p>
                      <ul className="order-items">
                        {order.items.map((item, index) => (
                          <li key={index}>
                            {item.name} - Qty: {item.quantity} - ₹{item.price.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No orders yet</p>
            )}
            {orders.length > 3 && (
              <button
                className="action-btn view-all-btn"
                onClick={() => setShowFullOrders(!showFullOrders)}
              >
                {showFullOrders ? 'Show Less' : 'View All Orders'}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;