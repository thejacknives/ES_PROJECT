import React, { useState } from 'react';
import './LoginPage.css'; // Reuse the same styles
import logo from '../assets/image.png';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faceImage, setFaceImage] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!faceImage) {
      setError('Please select a face image');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('face_image', faceImage);

    try {
      const res = await registerUser(formData);
      const { data } = res;
      if (data.error) {
        setError(data.error);
        return;
      }
      console.log('Registration successful:', data);
      navigate('/login');
    } catch {
      setError('Registration failed');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <img src={logo} alt="Logo" className="login-logo" style={{ width: '150px', height: 'auto' }} />
        <h2>REGISTER</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFaceImage(e.target.files[0])}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-btn">Register</button>
        </form>
        <div className="switch-mode">
          <button onClick={() => navigate('/login')}>Already have an account? Login</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;