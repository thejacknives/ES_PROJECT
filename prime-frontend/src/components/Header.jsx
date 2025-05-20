import React from 'react';
import './Header.css';
import logo from '../assets/image.png';

export default function Header() {
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
          <a href="/login" className="login-link">Login</a>
        </nav>
      </div>
    </header>
  );
}