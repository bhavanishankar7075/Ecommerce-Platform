// ecommerce-frontend/src/pages/Signup.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

function Signup() {
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null); // Changed from usernameRef to emailRef

  // Auto-focus email field on mount
  useEffect(() => {
    emailRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

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

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await signup(email, password); // Updated to pass email
      if (success) {
        setTimeout(() => {
          navigate('/products');
        }, 1500); // Delay for starburst animation
      } else {
        setError('User already exists');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="signup-wrapper">
      <div className="stellar-genesis">
        <h1 className="signup-title">Forge Your Star</h1>

        {/* Nebula Background */}
        <div className="nebula-core">
          <div className="nebula-tendrils"></div>
          {[...Array(30)].map((_, i) => (
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

        {/* Form Cloud */}
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="input-star">
            <label htmlFor="email" className="star-label">Email</label> {/* Changed label */}
            <input
              type="email" // Changed type to email
              id="email"
              ref={emailRef} // Updated ref
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

          {/* Error Shockwave */}
          {error && (
            <div className="error-shockwave">
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="ignite-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Igniting...' : 'Ignite Your Journey'}
          </button>
        </form>

        {/* Login Link */}
        <p className="login-link">
          Already a star? <a href="/login">Enter here</a>
        </p>

        {/* Starburst Animation on Success */}
        {isSubmitting && !error && <div className="starburst-effect"></div>}
      </div>
    </div>
  );
}

export default Signup;