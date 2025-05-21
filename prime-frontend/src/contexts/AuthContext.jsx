import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On mount, restore auth state
  useEffect(() => {
    const token   = localStorage.getItem('token');
    const message = localStorage.getItem('welcomeMessage');
    const user_id = localStorage.getItem('user_id');
    if (token && user_id) {
      setUser({ token, message, user_id: Number(user_id) });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('welcomeMessage');
    localStorage.removeItem('user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}