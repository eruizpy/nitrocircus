import { useState } from 'react'

export default function Cosito2Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carModel: '',
    service: '',
    message: ''
  })

  const handleWhatsAppContact = (customMessage?: string) => {
    let message = customMessage
    if (!customMessage) {
      message = `Hola, soy ${formData.name}. Tengo un ${formData.carModel} y estoy interesado en ${formData.service}. ${formData.message ? `Comentario adicional: ${formData.message}` : ''}`
    }
    const encodedMessage = encodeURIComponent(message || 'Hola, estoy interesado en sus servicios de high-performance para Subaru Impreza')
    window.open(`https://wa.me/5491123456789?text=${encodedMessage}`, '_blank')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleWhatsAppContact()
  }

  return (
    <div className="cosito2-landing">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <h1>HIGH-PERFORMANCE</h1>
            <span>SUBARU IMPREZA SPECIALISTS</span>
          </div>
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#servicios">Servicios</a>
            <a href="#experiencia">Experiencia</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Especialistas en<br/>High-Performance</h2>
            <h3>Subaru Impreza</h3>
            <p>Transformamos tu Subaru Impreza en una máquina de alta performance con más de 15 años de experiencia en el mundo del automovilismo deportivo.</p>
            <button className="cta-button" onClick={() => handleWhatsAppContact('Hola, estoy interesado en sus servicios de high-performance para Subaru Impreza')}>
              <span>Contactar por WhatsApp</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.593z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div className="hero-visual">
            <div className="car-silhouette">
              <div className="engine-glow"></div>
            </div>
            <div className="performance-stats">
              <div className="stat">
                <span className="number">300+</span>
                <span className="label">HP</span>
              </div>
              <div className="stat">
                <span className="number">15+</span>
                <span className="label">Años</span>
              </div>
              <div className="stat">
                <span className="number">500+</span>
                <span className="label">Proyectos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="services">
        <div className="container">
          <h2>Nuestros Servicios</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">⚡</div>
              <h3>Reprogramación ECU</h3>
              <p>Optimización de la centralita para máximo rendimiento y eficiencia.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🔧</div>
              <h3>Preparación Motor</h3>
              <p>Modificaciones internas del motor para alta performance.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🏁</div>
              <h3>Suspensión Deportiva</h3>
              <p>Setup de suspensión para competición y uso deportivo.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💨</div>
              <h3>Sistema de Escape</h3>
              <p>Escapes deportivos para mejor flujo y sonido racing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Demo Images */}
      <section className="gallery">
        <div className="container">
          <h2>Nuestros Proyectos</h2>
          <p className="gallery-subtitle">Algunos de los Subaru Impreza que hemos transformado</p>
          <div className="gallery-grid">
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">🏎️</div>
                  <div className="project-overlay">
                    <h3>Impreza STI 2015</h3>
                    <p>350HP • Turbo upgrade • ECU remap</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">🏁</div>
                  <div className="project-overlay">
                    <h3>WRX Rally Build</h3>
                    <p>Rally setup • Roll cage • Competition ready</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">⚡</div>
                  <div className="project-overlay">
                    <h3>Street Performance</h3>
                    <p>Daily driver • 280HP • Perfect balance</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">🔥</div>
                  <div className="project-overlay">
                    <h3>Track Day Special</h3>
                    <p>Circuit setup • Aerodynamics • 320HP</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">💨</div>
                  <div className="project-overlay">
                    <h3>Drift Machine</h3>
                    <p>Drift setup • LSD • Custom suspension</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-image">
                <div className="image-placeholder">
                  <div className="car-icon">🏆</div>
                  <div className="project-overlay">
                    <h3>Championship Winner</h3>
                    <p>Racing build • 400HP • Podium finisher</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experiencia" className="experience">
        <div className="container">
          <div className="experience-content">
            <div className="experience-text">
              <h2>15 Años de Experiencia</h2>
              <p>Especializados exclusivamente en Subaru Impreza, hemos participado en más de 100 competencias de automovilismo deportivo, obteniendo múltiples podios y victorias.</p>
              <ul>
                <li>Campeones Regionales de Rally 2019-2021</li>
                <li>Más de 500 Subaru Impreza preparados</li>
                <li>Equipo certificado por Subaru Motorsport</li>
                <li>Garantía en todos nuestros trabajos</li>
              </ul>
            </div>
            <div className="experience-visual">
              <div className="trophy-case">
                <div className="trophy">🏆</div>
                <div className="trophy">🥇</div>
                <div className="trophy">🏅</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="contact">
        <div className="container">
          <h2>¿Listo para potenciar tu Impreza?</h2>
          <p>Completa el formulario y te contactaremos via WhatsApp</p>

          <div className="contact-content">
            <form className="contact-form" onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Nombre completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="carModel">Modelo de Impreza</label>
                  <select
                    id="carModel"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona tu modelo</option>
                    <option value="Impreza WRX">Impreza WRX</option>
                    <option value="Impreza STI">Impreza STI</option>
                    <option value="Impreza RS">Impreza RS</option>
                    <option value="Impreza Base">Impreza Base</option>
                    <option value="Otro modelo">Otro modelo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="service">Servicio de interés</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un servicio</option>
                    <option value="Reprogramación ECU">Reprogramación ECU</option>
                    <option value="Preparación Motor">Preparación Motor</option>
                    <option value="Suspensión Deportiva">Suspensión Deportiva</option>
                    <option value="Sistema de Escape">Sistema de Escape</option>
                    <option value="Setup completo">Setup completo</option>
                    <option value="Consulta general">Consulta general</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="message">Mensaje adicional (opcional)</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Cuéntanos más sobre tu proyecto..."
                  rows={4}
                />
              </div>

              <button type="submit" className="cta-button large">
                <span>Enviar consulta por WhatsApp</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.593z" fill="currentColor"/>
                </svg>
              </button>
            </form>

            <div className="contact-info">
              <div className="contact-card">
                <h3>Contacto Directo</h3>
                <p>¿Prefieres contactarnos directamente?</p>
                <button className="cta-button" onClick={() => handleWhatsAppContact('Hola, estoy interesado en sus servicios de high-performance para Subaru Impreza')}>
                  <span>WhatsApp Directo</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.593z" fill="currentColor"/>
                  </svg>
                </button>
                <div className="contact-details">
                  <p><strong>Horarios:</strong><br/>Lun - Vie: 9:00 - 18:00<br/>Sáb: 9:00 - 14:00</p>
                  <p><strong>Ubicación:</strong><br/>Zona Norte, Buenos Aires</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 High-Performance Subaru Impreza Specialists. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}