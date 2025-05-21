import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    // Redirect to login, saving the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}