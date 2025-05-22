import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServicesPage from './pages/ServicesPage';
import MakeAppointmentPage from './pages/MakeAppointmentPage';
import RepairProgressPage from './pages/RepairProgressPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        {/* public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/services" element={<ServicesPage />} />

        {/* protected */}
        <Route
          path="/make-appointment"
          element={
            <PrivateRoute>
              <MakeAppointmentPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/repair-progress"
          element={
            <PrivateRoute>
              <RepairProgressPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPage />
            </PrivateRoute>
          }
        />

        {/* fallback */}
        <Route path="/" element={<ServicesPage />} />
      </Routes>
    </Router>
  );
}

export default App;