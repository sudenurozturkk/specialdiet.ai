import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    height: '',
    weight: '',
    goal: 'kilo verme' // Varsayılan hedef
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Parola kontrolü
    if (formData.password !== formData.confirmPassword) {
      setError('Parolalar eşleşmiyor');
      return;
    }
    
    setLoading(true);
    
    // API'ye gönderilecek veriyi hazırla
    const userData = {
      email: formData.email,
      password: formData.password,
      info: {
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        goal: formData.goal
      }
    };

    try {
      const response = await axios.post('http://localhost:5000/api/register', userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-diet-gray p-4 relative overflow-hidden">
      {/* Geri dönüş oku */}
      <Link to="/" className="absolute top-4 left-4 z-20 text-diet-green hover:text-diet-green-dark transition-colors">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="ml-1 font-medium">Anasayfa</span>
        </div>
      </Link>
      
      {/* Animasyonlu sebze ve meyveler */}
      <div className="food-animation-container">
        <div className="floating-food apple" style={{ top: '10%', left: '5%' }}>🍎</div>
        <div className="floating-food banana" style={{ top: '15%', right: '8%' }}>🍌</div>
        <div className="floating-food broccoli" style={{ bottom: '20%', left: '10%' }}>🥦</div>
        <div className="floating-food avocado" style={{ bottom: '15%', right: '15%' }}>🥑</div>
        <div className="floating-food orange" style={{ top: '35%', left: '20%' }}>🍊</div>
        <div className="floating-food tomato" style={{ top: '45%', right: '20%' }}>🍅</div>
        <div className="floating-food carrot" style={{ bottom: '30%', left: '25%' }}>🥕</div>
        <div className="floating-food pear" style={{ bottom: '40%', right: '10%' }}>🍐</div>
      </div>
      
      <div className="auth-container bg-white rounded-lg shadow-xl p-8 w-full max-w-md z-10 bg-opacity-95">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-diet-green">Yeni Hesap Oluştur</h2>
          <p className="text-gray-600 mt-2">Diyet Dostu ile sağlıklı yaşam yolculuğuna başla</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="auth-input"
              placeholder="ornek@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Parola
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="auth-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
              Parola Tekrar
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="auth-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="bg-diet-gray p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-3 text-diet-green">Kişisel Bilgiler</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="age">
                  Yaş
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className="auth-input"
                  placeholder="25"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="12"
                  max="120"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="height">
                  Boy (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  className="auth-input"
                  placeholder="170"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="100"
                  max="250"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="weight">
                  Kilo (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  className="auth-input"
                  placeholder="70"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  min="30"
                  max="300"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="goal">
                  Hedef
                </label>
                <select
                  id="goal"
                  name="goal"
                  className="auth-input"
                  value={formData.goal}
                  onChange={handleChange}
                  required
                >
                  <option value="kilo verme">Kilo Vermek</option>
                  <option value="kilo alma">Kilo Almak</option>
                  <option value="kilo koruma">Kiloyu Korumak</option>
                  <option value="kas kazanımı">Kas Kazanmak</option>
                </select>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="auth-button flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading ? 'Kayıt Oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-diet-green hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 