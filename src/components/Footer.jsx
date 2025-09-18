import React from 'react';
import '../Assets/Css/Footer.css';
import { Twitter, Facebook, Instagram, Mail } from 'lucide-react';

function Footer() {
  function onSubscribe(e) {
    e.preventDefault();
  }

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-backdrop" aria-hidden="true" />
      <div className="container footer-content">
        <div className="footer-left">
          <div className="brand">Elderlyze</div>
          <p className="footer-tag">Compassionate technology for mental wellness, companionship, and safety.</p>
          <div className="social">
            <a className="social-btn" aria-label="Twitter" href="#"><Twitter size={16} /></a>
            <a className="social-btn" aria-label="Facebook" href="#"><Facebook size={16} /></a>
            <a className="social-btn" aria-label="Instagram" href="#"><Instagram size={16} /></a>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer links">
          <div className="footer-heading">Links</div>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </nav>

        <div className="footer-news">
          <div className="footer-heading">Stay in the loop</div>
          <p className="muted">Get gentle updates and wellness tips.</p>
          <form className="news-form" onSubmit={onSubscribe}>
            <div className="input-with-icon">
              <input aria-label="Email" type="email" placeholder="Your email" required />
              <span className="mail" aria-hidden="true"><Mail size={14} /></span>
            </div>
            <button className="btn btn-primary" type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Elderlyze</div>
    </footer>
  );
}

export default Footer;


