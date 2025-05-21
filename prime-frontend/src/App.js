import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServicesPage from './pages/ServicesPage';
import MakeAppointmentPage from './pages/MakeAppointmentPage';

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/services" element={<ServicesPage />} />

        {/* Only /make-appointment is protected */}
        <Route
          path="/make-appointment"
          element={
            <PrivateRoute>
              <MakeAppointmentPage />
            </PrivateRoute>
          }
        />

        {/* Root: send to services */}
        <Route path="/" element={<ServicesPage />} />
      </Routes>
    </Router>
  );
}

export default App;