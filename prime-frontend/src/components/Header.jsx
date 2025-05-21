import React, { useContext } from 'react';
import './Header.css';
import logo from '../assets/image.png';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-glass">
        <img src={logo} alt="Logo" className="header-logo" />

        <nav className="header-nav">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <div className="spacer" />

          {user ? (
            <button onClick={handleLogout} className="login-link">
              Logout
            </button>
          ) : (
            <a href="/login" className="login-link">
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}