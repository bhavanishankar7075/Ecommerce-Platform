 import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Failure.css'; // Create this CSS file

function Failure() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/checkout');
  };

  const handleReturn = () => {
    navigate('/products');
  };

  return (
    <div className="failure-wrapper">
      <div className="failure-container">
        <h1 className="failure-title">Order Failed</h1>
        <p className="failure-message">
          Oops! Something went wrong with your payment, or it was canceled. Please try again or contact support if the issue persists.
        </p>
        <div className="button-group">
          <button className="retry-btn" onClick={handleRetry}>
            Retry Checkout
          </button>
          <button className="return-btn" onClick={handleReturn}>
            Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}



export default Failure; 








/* import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Failure = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Optionally clear cart or reset state
    console.log('Payment failed or canceled');
    // Add a timeout to allow the user to see the failure message
    const timer = setTimeout(() => navigate('/products'), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div>
      <h1>Payment Failed!</h1>
      <p>Sorry, your payment could not be processed. Please try again or contact support.</p>
      <button onClick={() => navigate('/checkout')}>Try Again</button>
    </div>
  );
};

export default Failure; */