

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Success.css'; // Create this CSS file

function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      if (!sessionId) {
        setError('No session ID provided');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view order details');
          navigate('/login');
          return;
        }

        // Fetch order details from backend using session ID
        const response = await axios.get(`http://localhost:5001/api/orders/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrderDetails(response.data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      }
    };

    fetchOrderDetails();
  }, [location, navigate]);

  const handleReturn = () => {
    navigate('/products');
  };

  return (
    <div className="success-wrapper">
      <div className="success-container">
        <h1 className="success-title">Order Confirmed!</h1>
        {error ? (
          <p className="error-message">{error}</p>
        ) : orderDetails ? (
          <>
            <p className="success-message">Thank you for your purchase! Your order has been successfully placed.</p>
            <div className="order-details">
              <h3>Order ID: {orderDetails.orderId}</h3>
              <h4>Items:</h4>
              <ul>
                {orderDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.name} - Quantity: {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p><strong>Shipping Address:</strong> {orderDetails.shippingAddress.fullName}, {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.postalCode}, {orderDetails.shippingAddress.country}</p>
              <p><strong>Phone:</strong> {orderDetails.shippingAddress.phoneNumber}</p>
              <p><strong>Total:</strong> ₹{orderDetails.total.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> {orderDetails.payment}</p>
            </div>
          </>
        ) : (
          <p>Loading order details...</p>
        )}
        <button className="return-btn" onClick={handleReturn}>
          Back to Products
        </button>
      </div>
    </div>
  );
}

export default Success; 



















/* 
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/failure');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5001/api/orders/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Order details:', response.data);
        // Display success message or order details here
      } catch (err) {
        console.error('Error fetching order details:', err);
        navigate('/failure');
      }
    };

    fetchOrderDetails();
  }, [sessionId, navigate]);

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase. Your order is being processed.</p>
    </div>
  );
};

export default Success; */

































