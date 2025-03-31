import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Import useCart
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

function Profile() {
  const { user, logout, loading: authLoading, updateUser } = useAuth();
  const { cart } = useCart(); // Get cart from CartContext
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    address: '',
    avatar: '/default-avatar.jpg',
    shippingAddress: {
      fullName: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      phoneNumber: '',
    },
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [wishlist, setWishlist] = useState([]);
  const [shippingAddressForm, setShippingAddressForm] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  });
  const [showSavedAddress, setShowSavedAddress] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Calculate cart count (total number of items in the cart)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Responsive handling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync profile data with user data
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
      const newProfileData = {
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        avatar: user.avatar || '/default-avatar.jpg',
        shippingAddress: user.shippingAddress || {
          fullName: '',
          address: '',
          city: '',
          postalCode: '',
          country: '',
          phoneNumber: '',
        },
      };
      setProfileData(newProfileData);
      setShippingAddressForm(newProfileData.shippingAddress);
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
          const res = await axios.get(`https://backend-ps76.onrender.com/api/wishlist/user/${user._id}`, {
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
      const res = await axios.get(`https://backend-ps76.onrender.com/api/orders/user/${user._id}`, {
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

  const handleShippingAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://backend-ps76.onrender.com/api/users/profile',
        { username: profileData.username, address: profileData.address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProfileRes = await axios.get('https://backend-ps76.onrender.com/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = updatedProfileRes.data;
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `https://backend-ps76.onrender.com${updatedUser.avatar}`
        : profileData.avatar;
      const newProfileData = {
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        address: updatedUser.address || '',
        avatar: avatarUrl,
        shippingAddress: updatedUser.shippingAddress || {
          fullName: '',
          address: '',
          city: '',
          postalCode: '',
          country: '',
          phoneNumber: '',
        },
      };
      setProfileData(newProfileData);
      setShippingAddressForm(newProfileData.shippingAddress);
      updateUser({ ...updatedUser, _id: updatedUser.id, avatar: avatarUrl });
      setIsEditingProfile(false);
      setNotification({ message: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.response?.data?.message || 'Failed to save profile');
      setNotification({ message: 'Failed to update profile.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleSaveShippingAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://backend-ps76.onrender.com/api/users/profile/shipping-address',
        {
          fullName: shippingAddressForm.fullName.trim(),
          address: shippingAddressForm.address.trim(),
          city: shippingAddressForm.city.trim(),
          postalCode: shippingAddressForm.postalCode.trim(),
          country: shippingAddressForm.country.trim(),
          phoneNumber: shippingAddressForm.phoneNumber.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProfileRes = await axios.get('https://backend-ps76.onrender.com/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = updatedProfileRes.data;
      const newProfileData = {
        ...profileData,
        shippingAddress: updatedUser.shippingAddress || {
          fullName: '',
          address: '',
          city: '',
          postalCode: '',
          country: '',
          phoneNumber: '',
        },
      };
      setProfileData(newProfileData);
      setShippingAddressForm(newProfileData.shippingAddress);
      updateUser(updatedUser);
      setIsEditingShipping(false);
      setNotification({ message: 'Shipping address updated successfully!', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Save shipping address error:', err);
      setError(err.response?.data?.message || 'Failed to save shipping address');
      setNotification({ message: 'Failed to update shipping address.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    }
  };

  const handleDeleteAddress = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your saved shipping address?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'https://backend-ps76.onrender.com/api/users/profile/shipping-address',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProfileRes = await axios.get('https://backend-ps76.onrender.com/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = updatedProfileRes.data;
      const newProfileData = {
        ...profileData,
        shippingAddress: updatedUser.shippingAddress || {
          fullName: '',
          address: '',
          city: '',
          postalCode: '',
          country: '',
          phoneNumber: '',
        },
      };
      setProfileData(newProfileData);
      setShippingAddressForm(newProfileData.shippingAddress);
      updateUser(updatedUser);
      setNotification({ message: 'Shipping address deleted successfully!', type: 'success' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Delete address error:', err);
      setError(err.response?.data?.message || 'Failed to delete shipping address');
      setNotification({ message: 'Failed to delete shipping address.', type: 'error' });
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
      const res = await axios.post('https://backend-ps76.onrender.com/api/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUser = res.data.user || res.data;
      const avatarUrl = updatedUser.avatar
        ? updatedUser.avatar.startsWith('http')
          ? updatedUser.avatar
          : `https://backend-ps76.onrender.com${updatedUser.avatar}`
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
        'https://backend-ps76.onrender.com/api/users/profile/password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSection(null);
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

  const handleCancelProfileEdit = () => {
    setProfileData((prev) => ({
      ...prev,
      username: user.username || '',
      address: user.address || '',
      avatar: user.avatar || '/default-avatar.jpg',
    }));
    setAvatarFile(null);
    setPreviewAvatar(null);
    setIsEditingProfile(false);
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
    if (section === 'profile') {
      setIsEditingProfile(false);
      setShowSavedAddress(false);
    }
    if (section === 'shipping') {
      setIsEditingShipping(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`cosmic-loading ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="spinner-orbit"></div>
        <p>Loading Profile...</p>
        {error && <p className="error-pod">{error}</p>}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`profile-galaxy ${darkMode ? 'dark-mode' : 'light-mode'}`}>
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
              onClick={() => toggleSection('profile')}
            >
              <i className="fas fa-user"></i> <span className="btn-text">Profile</span>
            </button>
            <button
              className="nav-btn"
              onClick={handleNavigateToOrders}
            >
              <i className="fas fa-list"></i> <span className="btn-text">Orders</span>
              {orders.length > 0 && (
                <span className="notification-badge">{orders.length}</span>
              )}
            </button>
            <button className="nav-btn" onClick={() => navigate('/cart')}>
              <i className="fas fa-shopping-cart"></i> <span className="btn-text">Cart</span>
              {cartCount > 0 && (
                <span className="notification-badge">{cartCount}</span>
              )}
            </button>
            <button className="nav-btn" onClick={handleNavigateToWishlist}>
              <i className="fas fa-heart"></i> <span className="btn-text">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="notification-badge">{wishlist.length}</span>
              )}
            </button>
            <button
              className="nav-btn"
              onClick={() => toggleSection('password')}
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
          <section className="accordion-container">
            {/* Profile Section */}
            <div className="accordion-item">
              <button
                className={`accordion-header ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => toggleSection('profile')}
              >
                Profile
                <span className="accordion-icon">
                  {activeSection === 'profile' ? '−' : '+'}
                </span>
              </button>
              {activeSection === 'profile' && (
                <div className="accordion-content">
                  <div className="stellar-card profile-pod">
                    <h3 className="card-title">Profile Details</h3>
                    <div className="avatar-cluster">
                      <div className="avatar-wrapper">
                        <img
                          src={previewAvatar || profileData.avatar || '/default-avatar.jpg'}
                          alt="User Avatar"
                          className="avatar-star"
                          onError={(e) => {
                            e.target.src = '/default-avatar.jpg';
                            e.target.onerror = null;
                          }}
                        />
                        <button
                          className="nebula-btn edit-btn"
                          onClick={() => setIsEditingProfile(!isEditingProfile)}
                        >
                          {isEditingProfile ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      {isEditingProfile && (
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
                      )}
                    </div>
                    <div className="profile-data">
                      <p><strong>Email:</strong> {profileData.email || 'N/A'}</p>
                      <div className="profile-field">
                        <strong>Username:</strong>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            name="username"
                            value={profileData.username || ''}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="Username"
                          />
                        ) : (
                          <span>{profileData.username || 'N/A'}</span>
                        )}
                      </div>
                      <div className="profile-field">
                        <strong>Address:</strong>
                        {isEditingProfile ? (
                          <textarea
                            name="address"
                            value={profileData.address || ''}
                            onChange={handleInputChange}
                            className="input-field textarea-field"
                            placeholder="Address"
                          />
                        ) : (
                          <span>{profileData.address || 'N/A'}</span>
                        )}
                      </div>
                      {isEditingProfile && (
                        <div className="action-cluster">
                          <button className="nebula-btn save-btn" onClick={handleSaveProfile}>
                            Save
                          </button>
                          <button className="nebula-btn cancel-btn" onClick={handleCancelProfileEdit}>
                            Cancel
                          </button>
                        </div>
                      )}
                      {!isEditingProfile && (
                        <>
                          <button
                            className="nebula-btn toggle-address-btn"
                            onClick={() => setShowSavedAddress(!showSavedAddress)}
                          >
                            {showSavedAddress ? 'Hide Saved Address' : 'Show Saved Address'}
                          </button>
                          {showSavedAddress && (
                            <div className="shipping-address">
                              <p><strong>Saved Shipping Address:</strong></p>
                              {profileData.shippingAddress && Object.values(profileData.shippingAddress).some(val => val) ? (
                                <ul>
                                  {profileData.shippingAddress.fullName && (
                                    <li><strong>Full Name:</strong> {profileData.shippingAddress.fullName}</li>
                                  )}
                                  {profileData.shippingAddress.address && (
                                    <li><strong>Address:</strong> {profileData.shippingAddress.address}</li>
                                  )}
                                  {profileData.shippingAddress.city && (
                                    <li><strong>City:</strong> {profileData.shippingAddress.city}</li>
                                  )}
                                  {profileData.shippingAddress.postalCode && (
                                    <li><strong>Postal Code:</strong> {profileData.shippingAddress.postalCode}</li>
                                  )}
                                  {profileData.shippingAddress.country && (
                                    <li><strong>Country:</strong> {profileData.shippingAddress.country}</li>
                                  )}
                                  {profileData.shippingAddress.phoneNumber && (
                                    <li><strong>Phone:</strong> {profileData.shippingAddress.phoneNumber}</li>
                                  )}
                                </ul>
                              ) : (
                                <p>No saved shipping address.</p>
                              )}
                              {profileData.shippingAddress && Object.values(profileData.shippingAddress).some(val => val) && (
                                <button className="nebula-btn delete-btn" onClick={handleDeleteAddress}>
                                  Delete Address
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Update Shipping Address Section */}
            <div className="accordion-item">
              <button
                className={`accordion-header ${activeSection === 'shipping' ? 'active' : ''}`}
                onClick={() => toggleSection('shipping')}
              >
                Update Shipping Address
                <span className="accordion-icon">
                  {activeSection === 'shipping' ? '−' : '+'}
                </span>
              </button>
              {activeSection === 'shipping' && (
                <div className="accordion-content">
                  <div className="stellar-card shipping-pod">
                    <h3 className="card-title">Update Shipping Address</h3>
                    <div className="shipping-address-form">
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddressForm.fullName}
                        onChange={handleShippingAddressChange}
                        className="input-field"
                        placeholder="Full Name"
                      />
                      <input
                        type="text"
                        name="address"
                        value={shippingAddressForm.address}
                        onChange={handleShippingAddressChange}
                        className="input-field"
                        placeholder="Address"
                      />
                      <input
                        type="text"
                        name="city"
                        value={shippingAddressForm.city}
                        onChange={handleShippingAddressChange}
                        className="input-field"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingAddressForm.postalCode}
                        onChange={handleShippingAddressChange}
                        className="input-field"
                        placeholder="Postal Code"
                      />
                      <input
                        type="text"
                        name="country"
                        value={shippingAddressForm.country}
                        onChange={handleShippingAddressChange}
                        className="input-field"
                        placeholder="Country"
                      />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={shippingAddressForm.phoneNumber}
                        onClick={handleShippingAddressChange}
                        className="input-field"
                        placeholder="Phone Number"
                      />
                      <div className="action-cluster">
                        <button className="nebula-btn save-btn" onClick={handleSaveShippingAddress}>
                          Save
                        </button>
                        <button className="nebula-btn cancel-btn" onClick={() => setIsEditingShipping(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Section - Now Navigates to /orders */}
            <div className="accordion-item">
              <button
                className="accordion-header"
                onClick={handleNavigateToOrders}
              >
                Orders
              </button>
            </div>

            {/* Change Password Section */}
            <div className="accordion-item">
              <button
                className={`accordion-header ${activeSection === 'password' ? 'active' : ''}`}
                onClick={() => toggleSection('password')}
              >
                Change Password
                <span className="accordion-icon">
                  {activeSection === 'password' ? '−' : '+'}
                </span>
              </button>
              {activeSection === 'password' && (
                <div className="accordion-content">
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
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Profile;