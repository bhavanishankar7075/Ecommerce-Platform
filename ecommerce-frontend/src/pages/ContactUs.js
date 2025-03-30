// src/pages/ContactUs.js
import { useState } from 'react';
import '../styles/ContactUs.css';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Basic validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please enter your message');
      return;
    }

    // Simulate form submission (replace with actual backend API call)
    setTimeout(() => {
      setSuccess('Your message has been sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="contactus-container">
      <div className="contactus-scrollable">
        <div className="contactus-content">
          <h1 className="contactus-title">Contact Us</h1>
          <div className="contactus-card">
            <div className="contactus-form-section">
              <h2>Send Us a Message</h2>
              {success && <div className="success-message">{success}</div>}
              {error && <div className="error-message">{error}</div>}
              <form className="contactus-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="name" className="input-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input-field"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email" className="input-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input-field"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="message" className="input-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    className="input-field textarea"
                    placeholder="Enter your message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
            <div className="contactus-info-section">
              <h2>Contact Information</h2>
              <p><strong>Email:</strong> support@cosmiccommerce.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Galactic Avenue, Star City, Universe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;