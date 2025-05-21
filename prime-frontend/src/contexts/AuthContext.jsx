import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On mount, restore auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const message = localStorage.getItem('welcomeMessage');
    if (token) {
      setUser({ token, message });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('welcomeMessage');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}