import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  console.log('PrivateRoute:', location.pathname, 'user =', user);

  // If no token, redirect to login, preserving `from`
  if (!user?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}