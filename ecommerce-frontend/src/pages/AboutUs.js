// src/pages/AboutUs.js
import '../styles/AboutUs.css';

function AboutUs() {
  return (
    <div className="aboutus-container">
      <div className="aboutus-scrollable">
        <div className="aboutus-content">
          <h1 className="aboutus-title">About Cosmic Commerce</h1>
          <div className="aboutus-card">
            <p>
              Welcome to <strong>Cosmic Commerce</strong>, your premier destination for shopping the best products from across the galaxy. Founded in 2023, we set out on a mission to bring the wonders of the universe to your doorstep. Our platform offers a curated selection of high-quality products, from cutting-edge tech gadgets to stellar fashion pieces, all sourced from the farthest reaches of the cosmos.
            </p>
            <p>
              At Cosmic Commerce, we believe in delivering an out-of-this-world shopping experience. Our team is dedicated to providing exceptional customer service, fast shipping, and a seamless user experience. Whether you’re exploring new galaxies or just looking for something unique, we’ve got you covered.
            </p>
            <h2>Our Mission</h2>
            <p>
              To connect customers with the best products in the universe, while fostering a community of explorers and innovators.
            </p>
            <h2>Why Choose Us?</h2>
            <ul>
              <li>Curated selection of galactic products</li>
              <li>Fast and reliable shipping</li>
              <li>24/7 customer support</li>
              <li>Secure and easy checkout process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;