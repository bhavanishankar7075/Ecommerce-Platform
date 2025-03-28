// Signup.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    usernameRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!username.trim()) {
      setError('Please enter your username');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await signup(email, password, username);
      if (success) {
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      }
    } catch (err) {
      console.error('Signup submit error:', err.response?.data?.message || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to sign up. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="signup-container">
      <div className="signup-scrollable">
        <div className="signup-content">
          <h1 className="signup-title">Create Your Account</h1>
          <div className="signup-card">
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username" className="input-label">Username</label>
                <input
                  type="text"
                  id="username"
                  ref={usernameRef}
                  className="input-field"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
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
                  placeholder="Set your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                <div className="input-with-indicator">
                  <input
                    type="password"
                    id="confirmPassword"
                    className="input-field"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {passwordsMatch && <span className="match-indicator">✓</span>}
                </div>
              </div>
              {error && (
                <div className="error-message">
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                className="signup-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            <p className="login-link">
              Already have an account? <a href="/login">Log in here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;

































/* import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    usernameRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    console.log('Form data:', { username, email, password, confirmPassword });

    if (!username.trim()) {
      setError('Please enter your username');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await signup(email, password, username);
      if (success) {
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      }
    } catch (err) {
      console.error('Signup submit error:', err.response?.data?.message || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to sign up. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="signup-wrapper bg-black">
      <div className="stellar-genesis">
        <h1 className="signup-title">Forge Your Star</h1>
        <div className="nebula-core">
          <div className="nebula-tendrils"></div>
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="nebula-spark"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            ></span>
          ))}
        </div>
        <form className="signup-form bg-success" onSubmit={handleSubmit}>
          <div className="input-star">
            <label htmlFor="username" className="star-label">Username</label>
            <input
              type="text"
              id="username"
              ref={usernameRef}
              className="star-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-star">
            <label htmlFor="email" className="star-label">Email</label>
            <input
              type="email"
              id="email"
              ref={emailRef}
              className="star-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-star">
            <label htmlFor="password" className="star-label">Password</label>
            <input
              type="password"
              id="password"
              className="star-input"
              placeholder="Set your cosmic key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-star">
            <label htmlFor="confirmPassword" className="star-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="star-input"
              placeholder="Confirm your key"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordsMatch && <span className="match-indicator">✓</span>}
          </div>
          {error && (
            <div className="error-shockwave">
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            className="ignite-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Igniting...' : 'Ignite Your Journey'}
          </button>
        </form>
        <p className="login-link">
          Already a star? <a href="/login">Enter here</a>
        </p>
        {isSubmitting && !error && <div className="starburst-effect"></div>}
      </div>
    </div>
  );
}

export default Signup; */