import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
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
    // Reset all errors
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    });
    setIsSubmitting(true);

    // Username validation: Must contain both alphabets and numbers
    const usernameRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/;
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: 'Please enter your username' }));
      setIsSubmitting(false);
      return;
    }
    if (!usernameRegex.test(username)) {
      setErrors((prev) => ({
        ...prev,
        username: 'Username must contain both letters and numbers (e.g., john123)',
      }));
      setIsSubmitting(false);
      return;
    }

    // Email validation
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

    // Password validation: Must contain letters, numbers, and special characters
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      setIsSubmitting(false);
      return;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      setIsSubmitting(false);
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must contain letters, numbers, and special characters (e.g., Pass123!)',
      }));
      setIsSubmitting(false);
      return;
    }

    // Confirm Password validation
    if (!confirmPassword.trim()) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
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
      setErrors((prev) => ({ ...prev, general: errorMessage }));
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="signup-container ">
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
                <p className="suggestion-text">Example: easycart123 (use letters and numbers)</p>
                {errors.username && (
                  <div className="error-message">
                    <span>{errors.username}</span>
                  </div>
                )}
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
                <p className="suggestion-text">Example: easycart@example.com</p>
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
                  placeholder="Set your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="suggestion-text">Example: easycart123! (use letters, numbers, and special characters)</p>
                {errors.password && (
                  <div className="error-message">
                    <span>{errors.password}</span>
                  </div>
                )}
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
                <p className="suggestion-text">Must match the password above</p>
                {errors.confirmPassword && (
                  <div className="error-message">
                    <span>{errors.confirmPassword}</span>
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
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
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
    // Reset all errors
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    });
    setIsSubmitting(true);

    // Username validation: Must contain both alphabets and numbers
    const usernameRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/;
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: 'Please enter your username' }));
      setIsSubmitting(false);
      return;
    }
    if (!usernameRegex.test(username)) {
      setErrors((prev) => ({
        ...prev,
        username: 'Username must contain both letters and numbers (e.g., john123)',
      }));
      setIsSubmitting(false);
      return;
    }

    // Email validation
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

    // Password validation: Must contain letters, numbers, and special characters
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      setIsSubmitting(false);
      return;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      setIsSubmitting(false);
      return;
    }
    if (!passwordRegex.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password must contain letters, numbers, and special characters (e.g., Pass123!)',
      }));
      setIsSubmitting(false);
      return;
    }

    // Confirm Password validation
    if (!confirmPassword.trim()) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
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
      setErrors((prev) => ({ ...prev, general: errorMessage }));
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
                {errors.username && (
                  <div className="error-message">
                    <span>{errors.username}</span>
                  </div>
                )}
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
                  placeholder="Set your password"
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
                {errors.confirmPassword && (
                  <div className="error-message">
                    <span>{errors.confirmPassword}</span>
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

export default Signup; */


























/* // Signup.js
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

export default Signup; */

































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