import React, { useState } from 'react';
import { registerUser } from '../api/auth';

function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      console.log('✅ Registered:', res.data);
      alert('User registered!');
    } catch (err) {
      console.error('❌ Registration failed:', err.response?.data || err);
      alert('Error registering user.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={form.username} onChange={handleChange} placeholder="Username" />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  );
}

function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
    </div>
  );
}

export default RegisterPage;