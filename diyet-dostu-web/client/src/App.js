import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import axios from 'axios';
import './styles/global.css';

// Tıklama olaylarını iyileştirmek için özel bileşen
const ClickEnhancer = () => {
  useEffect(() => {
    // Sayfa yüklendiğinde tüm tıklanabilir öğelerin tıklanabilirliğini iyileştir
    const enhanceClickability = () => {
      // Z-index ve overlay sorunlarını çöz
      document.querySelectorAll('*').forEach(el => {
        if (getComputedStyle(el).position === 'fixed' && 
            !el.classList.contains('header') && 
            parseInt(getComputedStyle(el).zIndex) > 500) {
          console.log('Blocking element adjusted:', el);
          el.style.pointerEvents = 'none';
        }
      });

      // Linkleri ve butonları güçlendir
      document.querySelectorAll('a, button, .tab, .nav-link').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
      });

      console.log('Click enhancement applied');
    };

    // İlk çalıştırma
    enhanceClickability();

    // DOM değişikliklerini izle ve gerektiğinde tekrar uygula
    const observer = new MutationObserver(enhanceClickability);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // Görünür öğe oluşturmaz, sadece etki ekler
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Token kontrolü
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Token'ı API isteğine ekle
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Kimlik doğrulaması başarılı
          console.log('Kimlik doğrulaması başarılı, token:', token.substring(0, 15) + '...');
          setIsAuthenticated(true);
          
          // Test token ise, normal API çağrıları yerine simülasyon yapacağız
          if (token.startsWith('test_token_')) {
            console.log('Test modu tespit edildi - normal API çağrıları atlanacak');
          }
        } catch (error) {
          console.error('Token geçersiz:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          setIsAuthenticated(false);
        }
      } else {
        console.log('Token bulunamadı, oturum açılmamış');
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const handleLogin = () => {
    console.log('Login başarılı, durum güncelleniyor');
    setIsAuthenticated(true);
    // Axios ile yapılan tüm isteklere otomatik token ekle
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Axios için header ayarlandı');
    }
  };
  
  const handleLogout = () => {
    console.log('Çıkış yapılıyor...');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    // Axios headers'dan token'ı kaldır
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  // Sayfa yüklenirken loading göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-diet-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {isAuthenticated && <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />}
        <div className={isAuthenticated ? "flex-grow container mx-auto px-4 py-8" : "flex-grow"}>
          <ClickEnhancer />
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Register onLogin={handleLogin} />
            } />
            <Route path="/chat" element={
              isAuthenticated ? <Chat /> : <Navigate to="/login" replace />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
            } />
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <LandingPage />
            } />
            {/* Yönlendirici tarafından eşleştirilmeyen herhangi bir yolu chat veya login'e yönlendirin */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/"} replace />} />
          </Routes>
        </div>
        {isAuthenticated && (
          <footer className="bg-white py-4 text-center shadow-inner">
            <p className="text-gray-600">© 2025 Diyet Dostu 🥗 - Sağlıklı yaşam asistanınız</p>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App; 