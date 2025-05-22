import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token   = localStorage.getItem('token');
    const message = localStorage.getItem('welcomeMessage');
    const user_id = localStorage.getItem('user_id');
    // If a token exists in storage, initialize user immediately
    return token
      ? { token, message, user_id: Number(user_id) }
      : null;
  });

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