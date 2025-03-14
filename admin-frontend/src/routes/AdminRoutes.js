/* // admin-frontend/src/routes/AdminRoutes.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import AdminLogin from '../pages/AdminLogin';
import AdminSignup from '../pages/AdminSignup';
import Dashboard from '../pages/Dashboard';
import ProductManagement from '../pages/ProductManagement';

function AdminRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const verifyUser = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
        setIsAdmin(res.data.user.isAdmin);
      } catch (err) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  const ProtectedRoute = ({ children, adminOnly }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (adminOnly && !isAdmin) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/signup" element={<AdminSignup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute adminOnly={true}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default AdminRoutes; */



























































  // admin-frontend/src/routes/AdminRoutes.js
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminSignup from '../pages/AdminSignup'; // Added signup
import Dashboard from '../pages/Dashboard';
import ProductManagement from '../pages/ProductManagement';
import AdminOrders from '../pages/AdminOrders';

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/signup" element={<AdminSignup />} /> 
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<ProductManagement />} />
      <Route path="/" element={<Dashboard />} /> 
      <Route path="/admin/orders" element={<AdminOrders />} />
    </Routes>
  );
}

export default AdminRoutes; 