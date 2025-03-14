import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verify token on mount to check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token'); 
    if (token) {
      axios
        .get('http://localhost:5001/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          console.log('Profile fetch response on mount:', res.data);
          setUser(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Profile fetch error on mount:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          navigate('/login');
        });
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const verifyToken = async (token) => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (err) {
      console.error('Token verification failed:', err.response?.data || err.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email, password });
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      console.log('Login response:', res.data);
      const { token, user: userData } = res.data;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      setUser(userData);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setLoading(false);
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (email, password, username) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5001/api/auth/register', { email, password, username });
      console.log('Signup response:', res.data);
      const { token } = res.data;
      localStorage.setItem('token', token);
      await verifyToken(token);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setLoading(false);
      throw new Error(err.response?.data?.message || 'Signup failed');
    }
  };

  const logout = (resolve) => {
    localStorage.removeItem('token');
    setUser(null); // Ensure user is set to null
    setLoading(false);
    resolve();
  };

  const updateUser = (updatedUser) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);