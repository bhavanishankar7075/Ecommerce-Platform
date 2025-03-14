// ecommerce-frontend/src/context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount to check if user is logged in
 /*  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []); */


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);


  const verifyToken = async (token) => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user); // Expect { id, email, isAdmin, username }
    } catch (err) {
      console.error('Token verification failed:', err.response?.data);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function using backend API
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      setUser(res.data.user);
      await verifyToken(token);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  // Signup function using backend API
  const signup = async (email, password, username) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/register', { email, password, username });
      const { token } = res.data;
      localStorage.setItem('token', token);
      await verifyToken(token);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Signup failed');
    }
  };

  // Logout function
  const logout = (resolve) => {
    localStorage.removeItem('token');
    setUser(null);
    resolve();
  };

  const updateUser = (updatedUser) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedUser })); // Merge to ensure full update
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading ,updateUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);













































/* // ecommerce-frontend/src/context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/verify');
          setUser(res.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Token Verification Error:', err.response?.data);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return true;
    } catch (err) {
      console.error('Login Error:', err.response?.data);
      return false;
    }
  };

  const signup = async (email, password) => {
    try {
      const res = await api.post('/auth/register', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return true;
    } catch (err) {
      console.error('Signup Error:', err.response?.data);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);  */