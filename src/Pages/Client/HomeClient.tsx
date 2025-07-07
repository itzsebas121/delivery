import React, { useState, useEffect } from 'react';
import './HomeClients.css'
import { useAuth } from '../../context/Authcontext';
import { Clock, Sun, MapPin, Phone, Truck, ChefHat, DollarSign, Utensils, CreditCard, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeClient: React.FC = () => {
    const { user, loading } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="chef-icon">👨‍🍳</div>
                </div>
                <p className="loading-text">Preparando tu experiencia culinaria...</p>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
    };

    const handleNavigation = (route: string) => {
        navigate(route);
    };

    return (
        <div className="home-client">
            {/* Header Compacto */}
            <header className="main-header">
                <div className="header-container">
                    <div className="user-welcome">
                        <div className="avatar">
                            <span>{user?.nombre?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="welcome-info">
                            <h1>¡Hola, {user?.nombre || "Cliente"}!</h1>
                            <span className="user-badge">{user?.rol}</span>
                        </div>
                    </div>

                    <div className="header-widgets">
                        <div className="time-weather-widget">
                            <div className="time-display">
                                <Clock size={16} />
                                <div className="time-info">
                                    <span className="current-time">{formatTime(currentTime)}</span>
                                    <span className="current-date">{formatDate(currentTime)}</span>
                                </div>
                            </div>
                            <div className="weather-display">
                                <Sun size={16} />
                                <span className="temperature">22°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* Grid Principal */}
                <div className="content-grid">
                    <div className="left-section">
                        {/* ¿Qué quieres hacer hoy? */}
                        <section className="action-center">
                            <h2>¿Qué quieres hacer hoy?</h2>
                            <div className="main-actions">
                                <button className="action-card primary" onClick={() => handleNavigation('products')}>
                                    <Utensils className="action-icon" size={24} />
                                    <div className="action-content">
                                        <span className="action-title">Ver Productos</span>
                                        <span className="action-subtitle">Nuestras especialidades</span>
                                    </div>
                                </button>
                                <button className="action-card secondary" onClick={() => handleNavigation('payment')}>
                                    <CreditCard className="action-icon" size={24} />
                                    <div className="action-content">
                                        <span className="action-title">Pagar Pedidos</span>
                                        <span className="action-subtitle">Completar órdenes</span>
                                    </div>
                                </button>
                                <button className="action-card accent" onClick={() => handleNavigation('history')}>
                                    <Package className="action-icon" size={24} />
                                    <div className="action-content">
                                        <span className="action-title">Mis Pedidos</span>
                                        <span className="action-subtitle">Historial y seguimiento</span>
                                    </div>
                                </button>
                            </div>
                        </section>

                        {/* Información del Restaurante */}
                        <section className="restaurant-info">
                            <div className="restaurant-header">
                                <h3>🔥 Hot-Grill</h3>
                                <span className="status-badge close">Cerrado</span>
                            </div>

                            <div className="detail-grid">
                                <div className="detail-item-hc">
                                    <MapPin size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Dirección</span>
                                        <span className="detail-value">Alonso castllo, y, Ambato 125180</span>
                                    </div>
                                </div>
                                <div className="detail-item-hc">
                                    <Clock size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Horarios</span>
                                        <span className="detail-value">Lun-Sab: 16H00 - 22H00</span>
                                    </div>
                                </div>
                                <div className="detail-item-hc">
                                    <Phone size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Teléfono</span>
                                        <span className="detail-value">0988698578</span>
                                    </div>
                                </div>
                                <div className="detail-item-hc">
                                    <Truck size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Entrega</span>
                                        <span className="detail-value">25-35 min aprox.</span>
                                    </div>
                                </div>
                                <div className="detail-item-hc">
                                    <ChefHat size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Especialidad</span>
                                        <span className="detail-value">Alitas</span>
                                    </div>
                                </div>
                                <div className="detail-item-hc">
                                    <DollarSign size={14} className="detail-icon" />
                                    <div className="detail-text">
                                        <span className="detail-label">Precio Promedio</span>
                                        <span className="detail-value">$15 - $25 por persona</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sección Derecha: Mapa y Promoción */}
                    <div className="right-section">
                        {/* Mapa del Restaurante */}
                        <section className="restaurant-map">
                            <div className="map-header">
                                <h4><MapPin size={16} /> Nuestra Ubicación</h4>
                                <p className="map-description">Visítanos en nuestro acogedor local</p>
                            </div>
                            <div className="map-container">
                                <iframe
                                    title="Ubicación del Restaurante Hot-Grill"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.817741836187!2d-78.4871065!3d-0.1578994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDknMjguNCJTIDc4wrAyOSc0OC4wIlc!5e0!3m2!1ses!2sec!4v1688150000000!5m2!1ses!2sec"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, borderRadius: '12px' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </section>


                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomeClient;
