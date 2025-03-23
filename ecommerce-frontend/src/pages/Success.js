// Success.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Success.css';

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

  const handleViewOrders = () => {
    navigate('/orders');
  };

  return (
    <div className="success-wrapper">
      <div className="success-container">
        <h1 className="success-title">Order Confirmed!</h1>
        {error ? (
          <p className="error-message">{error}</p>
        ) : orderDetails ? (
          <>
            <p className="success-message">
              Thank you for your purchase! Your order has been successfully placed.
              {orderDetails.status === 'Processing' &&
                ' It is currently being processed and will be shipped soon.'}
              {orderDetails.status === 'Shipped' && ' It has been shipped and is on its way to you!'}
              {orderDetails.status === 'Delivered' && ' It has been delivered to your address.'}
            </p>
            <div className="order-details">
              <h3>Order ID: {orderDetails.orderId}</h3>
              <h4>Items:</h4>
              <ul>
                {orderDetails.items.map((item, index) => (
                  <li key={index}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '50px', height: '50px', marginRight: '10px' }}
                      />
                    )}
                    {item.name} - Quantity: {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              <div className="shipping-address">
                <h4>Shipping Address:</h4>
                {orderDetails.shippingAddress ? (
                  <ul className="address-details">
                    {orderDetails.shippingAddress.fullName && (
                      <li><strong>Name:</strong> {orderDetails.shippingAddress.fullName}</li>
                    )}
                    {orderDetails.shippingAddress.address && (
                      <li><strong>Address:</strong> {orderDetails.shippingAddress.address}</li>
                    )}
                    {orderDetails.shippingAddress.city && (
                      <li><strong>City:</strong> {orderDetails.shippingAddress.city}</li>
                    )}
                    {orderDetails.shippingAddress.postalCode && (
                      <li><strong>Postal Code:</strong> {orderDetails.shippingAddress.postalCode}</li>
                    )}
                    {orderDetails.shippingAddress.country && (
                      <li><strong>Country:</strong> {orderDetails.shippingAddress.country}</li>
                    )}
                    {orderDetails.shippingAddress.phoneNumber && (
                      <li><strong>Phone:</strong> {orderDetails.shippingAddress.phoneNumber}</li>
                    )}
                    {!orderDetails.shippingAddress.fullName &&
                     !orderDetails.shippingAddress.address &&
                     !orderDetails.shippingAddress.city &&
                     !orderDetails.shippingAddress.postalCode &&
                     !orderDetails.shippingAddress.country &&
                     !orderDetails.shippingAddress.phoneNumber && (
                      <li>Not specified</li>
                    )}
                  </ul>
                ) : (
                  <p>Not specified</p>
                )}
              </div>
              <p><strong>Total:</strong> ₹{orderDetails.total.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> {orderDetails.payment}</p>
              <p><strong>Status:</strong> {orderDetails.status}</p>
              <p><strong>Order Date:</strong> {new Date(orderDetails.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="success-buttons">
              <button className="return-btn" onClick={handleReturn}>
                Back to Products
              </button>
              <button className="view-orders-btn" onClick={handleViewOrders}>
                View My Orders
              </button>
            </div>
          </>
        ) : (
          <p>Loading order details...</p>
        )}
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

































