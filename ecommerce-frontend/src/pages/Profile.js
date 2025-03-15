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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !isLoggingOut) {
      navigate('/login');
    } else if (user && user._id) {
      setProfile({ fullName: user.fullName || '', address: user.address || '', avatar: user.avatar || '' });
      fetchOrders();
      fetchAddresses();
      fetchPaymentMethods();
    }
  }, [user, authLoading, navigate, isLoggingOut]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get(`http://localhost:5001/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      handleError(err, 'Failed to load orders');
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

  const handleError = (err, defaultMsg) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      setError('Session expired. Please log in again.');
    } else if (err.response?.status === 403) {
      setError('Unauthorized access. Please log in with correct credentials.');
    } else {
      setError(err.response?.data?.message || defaultMsg);
    }
    setLoading(false);
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
      await axios.put('http://localhost:5001/api/users/profile/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasswordData({ currentPassword: '', newPassword: '' });
      setShowPasswordForm(false);
      setError('');
      alert('Password updated successfully');
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
      const res = await axios.delete(`http://localhost:5001/api/users/profile/payment-methods/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment method');
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    try {
      logout(); // Call logout without await
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  if (authLoading || loading || (isLoggingOut && !user)) {
    return (
      <div className="cosmic-loading">
        <div className="spinner-orbit"></div>
        <p>Navigating the Cosmos...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-galaxy">
      <div className="profile-container">
        <aside className="stellar-sidebar">
          <div className="sidebar-header">
            <h2>Galactic Hub</h2>
          </div>
          <nav className="sidebar-nav">
            <button className="nav-btn" onClick={() => setIsEditing(!isEditing)}>
              <i className="fas fa-user"></i> Profile
            </button>
            <button className="nav-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i> Cart
            </button>
            <button className="nav-btn" onClick={() => navigate('/orders')}>
              <i className="fas fa-box"></i> Orders
            </button>
            <button className="nav-btn" onClick={() => setShowAddressForm(!showAddressForm)}>
              <i className="fas fa-map-marker-alt"></i> Addresses
            </button>
            <button className="nav-btn" onClick={() => setShowPaymentForm(!showPaymentForm)}>
              <i className="fas fa-credit-card"></i> Payments
            </button>
            <button className="nav-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              <i className="fas fa-lock"></i> Password
            </button>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </nav>
        </aside>
        <main className="cosmic-dashboard">
          <header className="dashboard-header">
            <h1>{user.fullName || user.username || user.email}'s Control Center</h1>
            <button className="cart-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i> View Cart
            </button>
            {error && <p className="error-pod">{error}</p>}
          </header>
          <section className="profile-orbit">
            {isEditing && (
              <div className="stellar-card profile-pod">
                <h3 className="card-title">Profile Core</h3>
                <div className="avatar-cluster">
                  <img
                    src={profile.avatar || 'https://via.placeholder.com/120'}
                    alt="Avatar"
                    className="avatar-star"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="avatar-upload"
                  />
                  {avatarFile && (
                    <button className="nebula-btn upload-btn" onClick={handleAvatarUpload}>
                      Upload
                    </button>
                  )}
                </div>
                <div className="profile-data">
                  <p><strong>Email:</strong> {user.email}</p>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Full Name"
                  />
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    placeholder="Primary Address"
                    className="input-field textarea-field"
                  />
                  <div className="action-cluster">
                    <button className="nebula-btn save-btn" onClick={handleSaveProfile}>Save</button>
                    <button className="nebula-btn cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {showAddressForm && (
              <div className="stellar-card addresses-pod">
                <h3 className="card-title">Shipping Coordinates</h3>
                {addresses.length > 0 ? (
                  <ul className="address-constellation">
                    {addresses.map((addr) => (
                      <li key={addr._id} className="address-star">
                        {addr.address}
                        <button className="nebula-btn delete-btn" onClick={() => handleDeleteAddress(addr._id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional coordinates</p>
                )}
                <div className="address-form">
                  <textarea
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="New Shipping Coordinate"
                    className="input-field textarea-field"
                  />
                  <button className="nebula-btn add-btn" onClick={handleAddAddress}>Add</button>
                </div>
              </div>
            )}

            {showPaymentForm && (
              <div className="stellar-card payments-pod">
                <h3 className="card-title">Payment Portals</h3>
                {paymentMethods.length > 0 ? (
                  <ul className="payment-constellation">
                    {paymentMethods.map((method) => (
                      <li key={method._id} className="payment-star">
                        {method.name} - **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                        <button className="nebula-btn delete-btn" onClick={() => handleDeletePaymentMethod(method._id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No saved portals</p>
                )}
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
                    placeholder="Card Number"
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
                  <button className="nebula-btn add-btn" onClick={handleAddPaymentMethod}>Add</button>
                </div>
              </div>
            )}

            {showPasswordForm && (
              <div className="stellar-card password-pod">
                <h3 className="card-title">Security Code</h3>
                <div className="password-form">
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Current Code"
                    className="input-field"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="New Code"
                    className="input-field"
                  />
                  <button className="nebula-btn update-btn" onClick={handleChangePassword}>Update</button>
                </div>
              </div>
            )}

            <div className="stellar-card orders-pod">
              <h3 className="card-title">Cosmic Orders</h3>
              {orders.length > 0 ? (
                <div className="orders-orbit">
                  {(showFullOrders ? orders : orders.slice(0, 3)).map((order) => (
                    <div key={order._id} className="order-planet">
                      <div className="order-header">
                        <p><strong>Order #{order._id.slice(-6)}</strong></p>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p>₹{order.total.toFixed(2)}</p>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-details">
                        <p><strong>Shipping:</strong> {order.shippingAddress?.address || 'N/A'}</p>
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
                  {orders.length > 3 && (
                    <button className="nebula-btn view-all-btn" onClick={() => setShowFullOrders(!showFullOrders)}>
                      {showFullOrders ? 'Collapse' : 'Expand'}
                    </button>
                  )}
                </div>
              ) : (
                <p>No orders in orbit</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Profile;