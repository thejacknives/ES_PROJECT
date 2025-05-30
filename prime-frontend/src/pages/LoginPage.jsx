import React, { useState, useContext } from 'react';
import './LoginPage.css';
import logo from '../assets/image.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, loginUserFace } from '../api/auth';
import { AuthContext } from '../contexts/AuthContext';

const LoginPage = () => {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [faceImage, setFaceImage] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState('credentials');
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to where they wanted, default /services
  const from = location.state?.from?.pathname || '/services';

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser({ email, password });
      const { token, message, user_id } = res.data;

      // Persist in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('welcomeMessage', message);
      localStorage.setItem('user_id', user_id);

      // Update context with user_id
      setUser({ token, message, user_id });

      setSuccessMessage(message);
      setTimeout(() => navigate(from, { replace: true }), 1200);
    } catch {
      setError('Invalid credentials');
    }
  };

  const handleFaceLogin = async (e) => {
    e.preventDefault();
    if (!faceImage) {
      setError('Please select an image');
      return;
    }
    setError('');
    const formData = new FormData();
    formData.append('face_image', faceImage);

    try {
      const res = await loginUserFace(formData);
      const { token, message, user_id } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('welcomeMessage', message);
      localStorage.setItem('user_id', user_id);
      setUser({ token, message, user_id });
      setSuccessMessage(message);
      setTimeout(() => navigate(from, { replace: true }), 1200);
    } catch {
      setError('Face login failed');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>LOGIN</h2>
        {successMessage && <p className="success">{successMessage}</p>}

        {mode === 'credentials' ? (
          <form onSubmit={handleCredentialsLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        ) : (
          <form onSubmit={handleFaceLogin}>
            <input
              type="file"
              accept="image/*"
              onChange={e => setFaceImage(e.target.files[0])}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn">Login with Face</button>
          </form>
        )}

        <div className="switch-mode">
          <button
            onClick={() => setMode('credentials')}
            className={mode === 'credentials' ? 'active' : ''}
          >
            Login with Credentials
          </button>
          <button
            onClick={() => setMode('face')}
            className={mode === 'face' ? 'active' : ''}
          >
            Login with Face
          </button>
        </div>

        <div className="switch-mode">
          <button onClick={() => navigate('/register')}>
            Don’t have an account yet? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;