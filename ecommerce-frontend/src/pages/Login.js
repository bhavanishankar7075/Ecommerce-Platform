// ecommerce-frontend/src/pages/Login.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
  
    try {
      const success = await login(email, password);
      if (success) {
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      }
    } catch (err) {
      console.error('Login submit error:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
      const errorMessage = err.response?.data?.message || 'Failed to log in. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="galaxy-portal">
        <h1 className="login-title">Enter the Cosmos</h1>

        <div className="starfield">
          {[...Array(50)].map((_, i) => (
            <span
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            ></span>
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-orb">
            <label htmlFor="email" className="orb-label">Email</label>
            <input
              type="email"
              id="email"
              ref={emailRef}
              className="orb-input"
              placeholder="Enter your galactic email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-orb">
            <label htmlFor="password" className="orb-label">Password</label>
            <input
              type="password"
              id="password"
              className="orb-input"
              placeholder="Unlock the stars"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-comet">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="portal-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Opening Portal...' : 'Login to Universe'}
          </button>
        </form>

        <p className="signup-link">
          New to the galaxy? <a href="/signup">Join the stars</a>
        </p>

        {isSubmitting && !error && <div className="portal-effect"></div>}
      </div>
    </div>
  );
}

export default Login;