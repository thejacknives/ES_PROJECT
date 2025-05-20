import React, { useState } from 'react';
import './LoginPage.css';
import logo from '../assets/image.png'; // Ensure this logo is present
import { useNavigate } from 'react-router-dom';
import { loginUser, loginUserFace } from '../api/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faceImage, setFaceImage] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('credentials');
  const navigate = useNavigate();

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser({ email, password });
      console.log('Login success:', res.data);
      navigate('/dashboard');
    } catch (err) {
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
      const res = await loginUserFace(formData, {
        
          'Content-Type': 'multipart/form-data',
        
      });
      const { data } = res;
      if (data.error) {
        setError(data.error);
        return;
      }
      console.log('Login success with face:', data);
      navigate('/dashboard');
    } catch {
      setError('Face login failed');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <img src={logo} alt="Logo" className="login-logo" style={{ width: '150px', height: 'auto' }} />
        <h2>LOGIN</h2>

        {mode === 'credentials' && (
          <form onSubmit={handleCredentialsLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        )}

        {mode === 'face' && (
          <form onSubmit={handleFaceLogin}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFaceImage(e.target.files[0])}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-btn">Login with Face</button>
          </form>
        )}

        <div className="switch-mode">
          <button onClick={() => setMode('credentials')} className={mode === 'credentials' ? 'active' : ''}>
            Login with Credentials
          </button>
          <button onClick={() => setMode('face')} className={mode === 'face' ? 'active' : ''}>
            Login with Face
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;