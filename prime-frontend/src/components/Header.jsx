import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/image.png';
import { AuthContext } from '../contexts/AuthContext';

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
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/make-appointment">Make Appointment</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <div className="spacer" />

          {user ? (
            <button onClick={handleLogout} className="login-link">
              Logout
            </button>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
);
}