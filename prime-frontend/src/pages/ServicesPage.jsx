import React, { useEffect, useState } from 'react';
import './ServicesPage.css';
import { list_services } from '../api/auth';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await list_services();
        setServices(res.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  // Service icons mapping (you can customize these)
  const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('screen') || name.includes('display')) return '📱';
    if (name.includes('battery')) return '🔋';
    if (name.includes('keyboard') || name.includes('touchpad')) return '⌨️';
    if (name.includes('camera')) return '📷';
    if (name.includes('speaker') || name.includes('audio')) return '🔊';
    if (name.includes('charging') || name.includes('port')) return '🔌';
    if (name.includes('button') || name.includes('key')) return '⚡';
    if (name.includes('water') || name.includes('liquid')) return '💧';
    if (name.includes('software') || name.includes('system')) return '⚙️';
    return '🔧'; // Default repair icon
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return numPrice % 1 === 0 ? `€${numPrice}` : `€${numPrice.toFixed(2)}`;
  };

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading our services...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (services.length === 0) {
      return (
        <div className="loading">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧</div>
          No services available at the moment.
        </div>
      );
    }

    return (
      <div className="services-grid">
        {services.map((service, index) => (
          <div 
            key={service.id} 
            className="service-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="service-icon">
              {getServiceIcon(service.name)}
            </div>
            <div className="service-name">{service.name}</div>
            <div className="service-price">
              {formatPrice(service.base_price)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="services-page">
      <h1 className="services-title">Our Repair Services</h1>
      <p className="services-subtitle">
        Professional device repair with quality guarantee and competitive pricing
      </p>
      {renderContent()}
    </div>
  );
};

export default ServicesPage;