import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sayfa yüklenme animasyonu
    setIsLoaded(true);

    // Scroll efektleri
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fade-in');
    hiddenElements.forEach((el) => observer.observe(el));

    // Floating food animasyonları
    const foodElements = document.querySelectorAll('.floating-food');
    foodElements.forEach(food => {
      food.style.animationDelay = `${Math.random() * 5}s`;
    });

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Hareketli arka plan elementleri */}
      <div className="animated-background">
        <div className="shape circle"></div>
        <div className="shape square"></div>
        <div className="shape triangle"></div>
        <div className="shape rectangle"></div>
      </div>

      {/* Floating food emojileri */}
      <div className="floating-foods-container">
        <div className="floating-food" style={{ top: '10%', left: '5%' }}>🍎</div>
        <div className="floating-food" style={{ top: '25%', right: '8%' }}>🥑</div>
        <div className="floating-food" style={{ top: '60%', left: '12%' }}>🍓</div>
        <div className="floating-food" style={{ top: '75%', right: '15%' }}>🥦</div>
        <div className="floating-food" style={{ top: '40%', left: '80%' }}>🍇</div>
        <div className="floating-food" style={{ top: '85%', left: '40%' }}>🥕</div>
        <div className="floating-food" style={{ top: '15%', left: '50%' }}>🍌</div>
        <div className="floating-food" style={{ top: '50%', left: '25%' }}>🍊</div>
        <div className="floating-food" style={{ top: '30%', left: '70%' }}>🍉</div>
        <div className="floating-food" style={{ top: '70%', left: '60%' }}>🥝</div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="logo-animation">
            <div className="logo-circle">
              <span className="logo-icon">🥗</span>
            </div>
          </div>
          <h1 className="main-title">Diyet Dostu</h1>
          <div className="typing-container">
            <h2 className="subtitle">Kişisel sağlık ve <span className="typewriter">beslenme asistanınız</span></h2>
          </div>
          <p className="description fade-in">
            Yapay zeka ile güçlendirilmiş beslenme danışmanınız ile daha sağlıklı bir yaşam için adım atın.
            Anlık öneriler, kişiselleştirilmiş beslenme planları ve 7/24 destek!
          </p>
          <div className="button-container">
            <Link to="/register" className="cta-button signup-button fade-in pulse">Hemen Başla</Link>
            <Link to="/login" className="cta-button login-button fade-in">Giriş Yap</Link>
          </div>
        </div>
        <div className="hero-image fade-in">
          <div className="app-preview">
            <div className="web-app-mockup">
              <div className="web-app-header">
                <div className="app-logo">
                  <span className="app-logo-icon">🥗</span>
                  <span className="app-logo-text">Diyet Dostu</span>
                </div>
                <div className="web-app-menu">
                  <div className="menu-item">Ana Sayfa</div>
                  <div className="menu-item active">Sohbet</div>
                  <div className="menu-item">Profil</div>
                  <div className="menu-item">Tarifler</div>
                </div>
              </div>
              <div className="web-app-content">
                <div className="chat-container">
                  <div className="chat-bubble user">10 kilo vermek istiyorum, sağlıklı bir şekilde nasıl yapabilirim?</div>
                  <div className="chat-bubble assistant">
                    <div className="assistant-header">
                      <div className="assistant-avatar">🥗</div>
                      <div className="assistant-name">Diyet Dostu</div>
                    </div>
                    Merhaba! 😊 10 kilo verme hedefinize sağlıklı bir şekilde ulaşmak için şu adımları izleyebilirsiniz:
                    <ul>
                      <li>Günlük 500-600 kalori açığı oluşturun (sert diyet yapmadan)</li>
                      <li>Protein ağırlıklı beslenin (yağsız et, balık, baklagiller)</li>
                      <li>İşlenmiş şeker ve basit karbonhidratları azaltın</li>
                      <li>Günde en az 2-3 litre su için</li>
                      <li>Haftada 3-4 gün hem kardiyo hem de kuvvet antrenmanı yapın</li>
                      <li>Uyku düzeninize dikkat edin, her gece 7-8 saat uyumaya çalışın</li>
                    </ul>
                    <p>Hızlı sonuç almak yerine, kalıcı ve sağlıklı alışkanlıklar edinmeye odaklanın. Böylece verdiğiniz kiloları geri almaz, sağlıklı bir vücuda kavuşursunuz.</p>
                  </div>
                  <div className="chat-bubble user">Bu hızda kaç ayda 10 kilo verebilirim?</div>
                  <div className="chat-bubble assistant typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
                <div className="chat-input-area">
                  <input type="text" placeholder="Bir mesaj yazın..." className="chat-input" />
                  <button className="send-button">Gönder</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title fade-in">Diyet Dostu ile Neler Yapabilirsiniz?</h2>
          <div className="section-underline"></div>
        </div>
        
        <div className="features-grid">
          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">🍎</div>
            </div>
            <h3>Kişiselleştirilmiş Beslenme Planı</h3>
            <p>Yaş, boy, kilo ve hedeflerinize göre özel olarak hazırlanmış beslenme önerileri alın.</p>
          </div>
          
          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">💪</div>
            </div>
            <h3>Egzersiz Programları</h3>
            <p>Fiziksel durumunuza uygun egzersiz planları ile formda kalın ve hedeflerinize ulaşın.</p>
          </div>
          
          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">🤖</div>
            </div>
            <h3>AI Destekli Sohbet</h3>
            <p>Beslenme ve sağlık konularında sorularınızı sorun, anında yanıt alın.</p>
          </div>
          
          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">📊</div>
            </div>
            <h3>İlerleme Takibi</h3>
            <p>Kilo ve ölçülerinizi kaydedin, zaman içindeki değişimi grafiklerle görün.</p>
          </div>

          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">🍽️</div>
            </div>
            <h3>Yemek Tarifleri</h3>
            <p>Sağlıklı ve lezzetli tariflerle beslenme rutininizi keyifli hale getirin.</p>
          </div>

          <div className="feature-card fade-in">
            <div className="feature-icon-container">
              <div className="feature-icon">🔔</div>
            </div>
            <h3>Hatırlatıcılar</h3>
            <p>Su içme, öğün ve egzersiz hatırlatıcıları ile hedeflerinizden şaşmayın.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title fade-in">Nasıl Çalışır?</h2>
          <div className="section-underline"></div>
        </div>
        
        <div className="steps-container">
          <div className="step-card fade-in">
            <div className="step-number-container">
              <div className="step-number">1</div>
            </div>
            <h3>Üye Olun</h3>
            <p>Basit bilgilerinizle hızlıca kayıt olun ve tercihleri belirleyin.</p>
          </div>
          
          <div className="connector fade-in"></div>
          
          <div className="step-card fade-in">
            <div className="step-number-container">
              <div className="step-number">2</div>
            </div>
            <h3>Profilinizi Tamamlayın</h3>
            <p>Hedeflerinizi, boy-kilo bilgilerinizi ve beslenme tercihlerinizi girin.</p>
          </div>
          
          <div className="connector fade-in"></div>
          
          <div className="step-card fade-in">
            <div className="step-number-container">
              <div className="step-number">3</div>
            </div>
            <h3>Yapay Zeka Asistanınızla Sohbet Edin</h3>
            <p>Sorularınızı sorun, öneriler alın ve sağlıklı yaşamınıza başlayın.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-overlay"></div>
        <div className="cta-content fade-in">
          <h2>Sağlıklı Yaşama İlk Adımı Atın</h2>
          <p>Ücretsiz üye olun ve yapay zeka destekli beslenme asistanınızla tanışın.</p>
          <Link to="/register" className="cta-button signup-button pulse">Hemen Başla</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon-small">🥗</div>
            <span>Diyet Dostu</span>
          </div>
          <p>© 2025 Tüm hakları saklıdır</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 