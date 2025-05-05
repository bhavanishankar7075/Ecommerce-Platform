import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Reset all errors
    setErrors({
      email: '',
      password: '',
      general: '',
    });
    setIsSubmitting(true);

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Please enter your email' }));
      setIsSubmitting(false);
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      setIsSubmitting(false);
      return;
    }

    // Client-side password validation
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login submit error:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });

      // Determine the type of error based on the response message
      const errorMessage = err.response?.data?.message?.toLowerCase() || 'failed to login';
      let emailError = '';
      let passwordError = '';
      let generalError = '';

      // Prioritize email error over password error to avoid showing both
      if (errorMessage.includes('user not found') || errorMessage.includes('invalid email')) {
        emailError = 'Email is incorrect';
      } else if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
        passwordError = 'Password is incorrect';
      } else {
        generalError = err.response?.data?.message || 'Failed to log in. Please try again.';
      }

      setErrors((prev) => ({
        ...prev,
        email: emailError,
        password: passwordError,
        general: generalError,
      }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-scrollable">
        <div className="login-content">
          <h1 className="login-title">Log In to Your Account</h1>
          <div className="login-card">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <div className="error-message">
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {errors.password && (
                  <div className="error-message">
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>
              {errors.general && (
                <div className="error-message">
                  <span>{errors.general}</span>
                </div>
              )}
              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
            </form>
            <p className="signup-link">
              New to the platform? <a href="/signup">Sign up here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;


























/* // Login.js
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
       
          navigate('/');
        
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
    <div className="login-container">
      <div className="login-scrollable">
        <div className="login-content">
          <h1 className="login-title">Log In to Your Account</h1>
          <div className="login-card">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="error-message">
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
            </form>
            <p className="signup-link">
              New to the platform? <a href="/signup">Sign up here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; */














































/* // ecommerce-frontend/src/pages/Login.js
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
    <div className="login-wrapper bg-primary">
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

        <form className="login-form bg-black" onSubmit={handleSubmit}>
          <div className="input-orb ">
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

export default Login; */