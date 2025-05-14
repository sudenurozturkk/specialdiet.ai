import React from 'react';

// Logoyu doğrudan SVG olarak yerleştiriyoruz (görsel yüklenemezse kullanılacak)
const DefaultLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4CAF50" className="w-full h-full">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z" />
  </svg>
);

const ChatBubble = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';
  
  // Hastalık ve ilaç bilgisi içeren mesajları kontrol et
  const hasMedicalInfo = content && (
    content.includes('ÖNEMLİ SAĞLIK BİLGİLERİ') || 
    content.includes('hastalık') || 
    content.includes('ilaç') || 
    content.includes('rahatsızlık')
  );
  
  // HTML içeriğini güvenli bir şekilde render et
  const createMarkup = (text) => {
    return { __html: text
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    };
  };
  
  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="avatar-container">
        {isUser ? (
          <div className="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <div className="assistant-avatar">
            {/* Logo için fallback mekanizması */}
            <div className="fallback-logo">
              <svg viewBox="0 0 24 24" fill="#4CAF50" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#e8f5e9" />
                <path d="M17 8.5C17 6.01 14.99 4 12.5 4C10.01 4 8 6.01 8 8.5C8 11.99 12.5 16.5 12.5 16.5C12.5 16.5 17 11.99 17 8.5ZM12.5 9.5C11.95 9.5 11.5 9.05 11.5 8.5C11.5 7.95 11.95 7.5 12.5 7.5C13.05 7.5 13.5 7.95 13.5 8.5C13.5 9.05 13.05 9.5 12.5 9.5Z" fill="#4CAF50" />
                <path d="M16 15H9C8.45 15 8 15.45 8 16C8 16.55 8.45 17 9 17H16C16.55 17 17 16.55 17 16C17 15.45 16.55 15 16 15Z" fill="#4CAF50" />
                <path d="M12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20ZM12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2Z" fill="#4CAF50" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className={`chat-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'} ${hasMedicalInfo ? 'medical-info' : ''}`}>
        <div dangerouslySetInnerHTML={createMarkup(content)} />
      </div>
    </div>
  );
};

export default ChatBubble; 