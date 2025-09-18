import React, { useEffect, useState, useRef } from 'react';
import '../Assets/Css/Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../Assets/Images/Logo.png';
import { auth } from '../Firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileOpen(false);
      navigate('/signin');
    } catch (e) {
      // optionally surface error to user
      console.error('Logout failed', e);
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-content">
        <Link className="brand" to="/">
          <img src={Logo} alt="Elderlyze logo" className="brand-logo" />
        </Link>
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle navigation menu" aria-expanded={isMenuOpen}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`} aria-label="Primary Navigation">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to={{ pathname: '/', hash: '#features' }} onClick={closeMenu}>Features</Link>
          <Link to={{ pathname: '/', hash: '#how-it-works' }} onClick={closeMenu}>How It Works</Link>
          <Link to={{ pathname: '/', hash: '#tutorial' }} onClick={closeMenu}>Tutorial</Link>
          <Link to={{ pathname: '/', hash: '#about' }} onClick={closeMenu}>About</Link>
          <Link to={{ pathname: '/', hash: '#contact' }} onClick={closeMenu}>Contact</Link>
        </nav>
        <div className={`auth-actions ${isMenuOpen ? 'open' : ''}`}>
          {(!currentUser || location.pathname === '/signup') ? (
            <>
              <button className="btn btn-ghost" aria-label="Login" onClick={() => { navigate('/signin'); closeMenu(); }}>Login</button>
              <button className="btn btn-primary" aria-label="Sign Up" onClick={() => { navigate('/signup'); closeMenu(); }}>Sign Up</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" aria-label="Dashboard" onClick={() => { navigate('/app'); closeMenu(); }}>Dashboard</button>
              <div className="profile-menu" ref={profileRef}>
                <button className="btn btn-ghost" aria-haspopup="menu" aria-expanded={isProfileOpen} onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Profile'} ▾
                </button>
                {isProfileOpen && (
                  <div className="dropdown" role="menu">
                    <button className="dropdown-item" onClick={() => { navigate('/app/profile'); setIsProfileOpen(false); }}>Profile</button>
                    <hr className="dropdown-sep" />
                    <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;


