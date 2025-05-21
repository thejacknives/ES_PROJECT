import React, { useEffect, useState } from 'react';
import './ServicesPage.css';
import { list_services } from '../api/auth';
//import { AuthContext } from '../contexts/AuthContext';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await list_services();
        setServices(res.data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar serviços.');
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Carregando serviços…</div>;
    }
    if (error) {
      return <div className="error">{error}</div>;
    }
    return (
      <div className="services-grid">
        {services.map((s) => (
          <div key={s.id} className="service-card">
            <div className="service-name">{s.name}</div>
            <div className="service-price">€{parseFloat(s.base_price).toFixed(2)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="services-page">
      <h1 className="services-title">Our Repair Services</h1>
      {renderContent()}
    </div>
  );
};

export default ServicesPage;