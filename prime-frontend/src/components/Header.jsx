import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/image.png';
import { AuthContext } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const userName = user?.message?.split(', ')[1]?.replace('!', '') || '';
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
          <Link to="/services">Services</Link>
          <Link to="/make-appointment">Make Appointment</Link>
          <Link to="/my-repairs">My Repairs</Link>
          <div className="spacer" />

          {user?.user_id === 1 && (
            <Link to="/admin" className="admin-link">
              Admin Page
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="login-link">
              Logout
            </button>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}

          {user && (
            <span className="user-name">
              {userName}
            </span>
          )}
        </nav>
      </div>
    </header>
);
}