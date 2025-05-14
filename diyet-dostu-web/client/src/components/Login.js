import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/global.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const navigate = useNavigate();

  // Sayfa yüklendiğinde token kontrolü yap
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);

  // Test modu aktifleştirildiğinde otomatik giriş yap
  useEffect(() => {
    if (testMode) {
      const submitButton = document.getElementById('login-submit');
      if (submitButton) {
        submitButton.click();
      }
    }
  }, [testMode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const loginWithTestUser = () => {
    setFormData({
      email: 'whodenur@gmail.com',
      password: 'test123'
    });
    setTestMode(true);
  };

  const handleTestLogin = () => {
    // Test kullanıcısı ile giriş işlemine devam et
    const token = `test_token_${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', '1746606015392');
    navigate('/chat');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (testMode) {
      // Test modunda ise API'ye istek göndermeden doğrudan giriş yap
      handleTestLogin();
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post('http://localhost:5000/api/login', formData);
      
      // JWT token'ı ve kullanıcı ID'sini localStorage'a kaydet
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      
      // Kullanıcıyı sohbet sayfasına yönlendir
      navigate('/chat');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        setError(error.response.data.message || 'Giriş başarısız');
      } else if (error.request) {
        setError('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.');
      } else {
        setError('Giriş işlemi sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Arka plan blur efekti */}
      <div className="blur-backdrop"></div>
      
      {/* Geri dönüş oku */}
      <Link to="/" className="absolute top-4 left-4 z-20 text-diet-green hover:text-diet-green-dark transition-colors">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="ml-1 font-medium">Anasayfa</span>
        </div>
      </Link>
      
      {/* Animasyonlu sebze ve meyveler - erişilebilirlik düzeltmeleri */}
      <div className="floating-items">
        <span role="img" aria-label="Kırmızı elma" className="floating-item item-1">🍎</span>
        <span role="img" aria-label="Muz" className="floating-item item-2">🍌</span>
        <span role="img" aria-label="Brokoli" className="floating-item item-3">🥦</span>
        <span role="img" aria-label="Avokado" className="floating-item item-4">🥑</span>
        <span role="img" aria-label="Portakal" className="floating-item item-5">🍊</span>
        <span role="img" aria-label="Havuç" className="floating-item item-6">🥕</span>
        <span role="img" aria-label="Üzüm" className="floating-item item-7">🍇</span>
        <span role="img" aria-label="Kivi" className="floating-item item-8">🥝</span>
        <span role="img" aria-label="Çilek" className="floating-item item-9">🍓</span>
        <span role="img" aria-label="Karpuz" className="floating-item item-10">🍉</span>
        <span role="img" aria-label="Yaban mersini" className="floating-item item-11">🫐</span>
        <span role="img" aria-label="Salatalık" className="floating-item item-12">🥒</span>
      </div>
      
      <div className="login-container">
        <div className="login-header">
          <span role="img" aria-label="Salata" className="login-logo">🥗</span>
          <h1 className="login-title">Diyet Dostu</h1>
          <p className="login-subtitle">Sağlıklı yaşam asistanınız</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="E-posta adresiniz"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Parola
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Parolanız"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn w-full"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="text-muted mb-4">veya</p>
          <button
            onClick={loginWithTestUser}
            className="btn btn-secondary w-full mb-4"
          >
            Test Kullanıcısı ile Giriş Yap
          </button>
          
          <p className="mt-4">
            Hesabınız yok mu?{' '}
            <a href="/register" className="login-link">
              Kaydolun
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 