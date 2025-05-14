import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header({ isAuthenticated, onLogout }) {
  const handleClick = (e, path) => {
    e.preventDefault();
    window.location.href = path;
  };

  return (
    <header className="header" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 999999, 
      width: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
      padding: '1rem 0',
      color: 'white'
    }}>
      <div className="container header-content">
        <a href="/" 
          onClick={(e) => handleClick(e, '/')}
          className="logo" 
          style={{ 
            position: 'relative', 
            zIndex: 999999,
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}>
          <span>🥗</span> Diyet Dostu
        </a>
        
        <div className="nav-links" style={{ 
          position: 'relative', 
          zIndex: 999999,
          display: 'flex',
          gap: '1.5rem'
        }}>
          {isAuthenticated ? (
            <>
              <a 
                href="/chat" 
                onClick={(e) => handleClick(e, '/chat')}
                className="nav-link" 
                style={{ 
                  position: 'relative', 
                  zIndex: 999999, 
                  cursor: 'pointer !important',
                  color: 'white',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  textDecoration: 'none'
                }}
              >
                Sohbet
              </a>
              <a 
                href="/profile" 
                onClick={(e) => handleClick(e, '/profile')}
                className="nav-link" 
                style={{ 
                  position: 'relative', 
                  zIndex: 999999, 
                  cursor: 'pointer !important',
                  color: 'white',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  textDecoration: 'none'
                }}
              >
                Profil
              </a>
              <button 
                onClick={onLogout} 
                className="nav-link" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  position: 'relative', 
                  zIndex: 999999,
                  fontWeight: 500,
                  padding: '0.5rem 1rem'
                }}
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <a 
                href="/login" 
                onClick={(e) => handleClick(e, '/login')}
                className="nav-link" 
                style={{ 
                  position: 'relative', 
                  zIndex: 999999, 
                  cursor: 'pointer !important',
                  color: 'white',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  textDecoration: 'none'
                }}
              >
                Giriş
              </a>
              <a 
                href="/register" 
                onClick={(e) => handleClick(e, '/register')}
                className="nav-link" 
                style={{ 
                  position: 'relative', 
                  zIndex: 999999, 
                  cursor: 'pointer !important',
                  color: 'white',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  textDecoration: 'none'
                }}
              >
                Kayıt Ol
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 