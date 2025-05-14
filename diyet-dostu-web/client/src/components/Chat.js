import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChatBubble from './ChatBubble';
import UserInfoForm from './UserInfoForm';
import DietPlanGenerator from './DietPlanGenerator';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [showDietPlan, setShowDietPlan] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [apiKey, setApiKey] = useState('');
  const [keySubmitted, setKeySubmitted] = useState(true);
  const [assistantMode, setAssistantMode] = useState('general');
  const [assistantHistory, setAssistantHistory] = useState([]);

  useEffect(() => {
    fetchChatList();
    checkUserInfo();
    
    // .env veya server API'den API anahtarını al
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (activeChatId) {
      fetchChatHistory();
    }
  }, [activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showUserInfoForm, showDietPlan]);

  const checkUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }
      
      const response = await axios.get('/api/user-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.userInfo) {
        setUserInfo(response.data.userInfo);
      } else {
        // Kullanıcı bilgisi yoksa formu göster
        // Gerçek uygulamada sohbet başlattıktan sonra göster
        // Şimdilik yorum satırı olarak bırakıyoruz
        // setShowUserInfoForm(true);
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi kontrolü sırasında hata:', error);
    }
  };

  const fetchChatList = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get('/api/chat-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sohbet listesini ayarla
      setChatList(response.data);
      
      // İlk sohbeti aktif olarak işaretle (eğer liste boş değilse)
      if (response.data.length > 0 && !activeChatId) {
        setActiveChatId(response.data[0].id);
        fetchChatHistory(response.data[0].id);
      } else if (response.data.length === 0) {
        // Sohbet listesi boşsa yeni bir sohbet oluştur
        createNewChat();
      }
    } catch (error) {
      console.error('Sohbet listesi alınırken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async (chatId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/chat-history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Başarılı yanıtta mesajları güncelle
      if (response.data.chatHistory && Array.isArray(response.data.chatHistory)) {
        setMessages(response.data.chatHistory);
      } else {
        // Boş mesaj listesi
        setMessages([]);
      }
    } catch (error) {
      console.error('Sohbet geçmişi alınırken hata:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setIsLoading(false);
        return;
      }
      
      // Yeni sohbet oluştur
      axios.post('/api/create-chat', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        if (response.data && response.data.id) {
          // Yeni sohbeti listeye ekle
          const newChat = {
            id: response.data.id,
            title: response.data.title || 'Yeni Sohbet',
            lastMessage: new Date().toISOString()
          };
          
          setChatList(prevList => [...prevList, newChat]);
          setActiveChatId(response.data.id);
          
          // Yeni sohbetin geçmişini yükle (boş olacak)
          setMessages([{
            role: 'assistant',
            content: `Merhaba! 😊 Diyet Dostu'na hoş geldin!

Ben senin kişisel beslenme ve spor asistanınım. Bana istediğin konuda soru sorabilirsin.

Türk mutfağına uygun, kolay ve sağlıklı tarifler sunarak diyet hedeflerine ulaşmana yardımcı olacağım.

İşte sana yardımcı olabileceğim konular:
🥗 Türk mutfağına uygun düşük kalorili/yüksek proteinli tarifler
🏋️‍♀️ Kişiselleştirilmiş egzersiz planları
📸 Yemek fotoğraflarını analiz ederek besin değeri tahmini
📝 Haftalık beslenme programı oluşturma
📊 Kilo takibi ve gelişim analizi

Sormak istediğin bir şey var mı? Birlikte sağlıklı bir yaşam yolculuğuna başlayalım! 💪`
          }]);
        }
      })
      .catch(error => {
        console.error('Yeni sohbet oluşturulurken hata:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Yeni sohbet oluşturulurken hata:', error);
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Bu sohbeti silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setIsLoading(false);
        return;
      }
      
      // API'ya istek gönder
      const response = await axios.delete(`/api/delete-chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Başarılı yanıtta UI'ı güncelle
      if (response.data.success) {
        // Sohbet listesinden sil
        setChatList(prevList => prevList.filter(chat => chat.id !== chatId));
        
        // Eğer aktif sohbet siliniyorsa başka bir sohbete geç
        if (chatId === activeChatId) {
          const remainingChats = chatList.filter(chat => chat.id !== chatId);
          const nextChat = remainingChats.length > 0 ? remainingChats[0] : null;
          
          if (nextChat) {
            setActiveChatId(nextChat.id);
            // Bu sohbetin geçmişini yükle
            fetchChatHistory(nextChat.id);
          } else {
            // Hiç sohbet kalmadıysa yeni bir sohbet oluştur
            createNewChat();
          }
        }
        
        // Bildirim göster
        alert('Sohbet başarıyla silindi.');
      } else {
        alert('Sohbet silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Sohbet silinirken hata:', error);
      alert('Sohbet silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      if (!window.confirm('Sohbet geçmişini temizlemek istediğinizden emin misiniz?')) {
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setIsLoading(false);
        return;
      }
      
      // API'ya istek gönder
      const response = await axios.post('/api/clear-chat', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Başarılı yanıtta mesajları güncelle
        setMessages(response.data.chatHistory || [{
          role: 'assistant',
          content: `Merhaba! 😊 Diyet Dostu'na hoş geldin!

Ben senin kişisel beslenme ve spor asistanınım. Sohbet geçmişin temizlendi ve yeni bir konuşma başlatıldı.

Türk mutfağına uygun, kolay ve sağlıklı tarifler sunarak diyet hedeflerine ulaşmana yardımcı olacağım.

İşte sana yardımcı olabileceğim konular:
🥗 Türk mutfağına uygun düşük kalorili/yüksek proteinli tarifler
🏋️‍♀️ Kişiselleştirilmiş egzersiz planları
📸 Yemek fotoğraflarını analiz ederek besin değeri tahmini
📝 Haftalık beslenme programı oluşturma
📊 Kilo takibi ve gelişim analizi

Sormak istediğin bir şey var mı? Birlikte sağlıklı bir yaşam yolculuğuna başlayalım! 💪`
        }]);
        
        // Aktif sohbeti güncelle
        const updatedList = chatList.map(chat => {
          if (chat.id === activeChatId) {
            return { ...chat, title: 'Temizlenmiş Sohbet' };
          }
          return chat;
        });
        
        setChatList(updatedList);
        
        // Formları gizle
        setShowUserInfoForm(false);
        setShowDietPlan(false);
        
        // Başarı mesajı göster
        alert('Sohbet geçmişi başarıyla temizlendi.');
      } else {
        // Hata mesajı
        alert('Sohbet geçmişi temizlenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Sohbet geçmişi temizlenirken hata:', error);
      // Hata durumunda kullanıcıyı bilgilendir
      alert('Sohbet geçmişi temizlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!input.trim() && !imageFile) || isLoading) return;
    
    // Kullanıcı mesajını ekle
    const userMessage = input.trim();
    setMessages(prevMessages => [...prevMessages, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    adjustTextareaHeight();
    
    // Resim varsa, yüklenen işlemi gerçekleştir
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('Token bulunamadı');
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.' 
          }]);
          setIsLoading(false);
          return;
        }
        
        const response = await axios.post(`/api/analyze-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        
        clearImage();
        
        // Görüntü analiz edildikten sonra cevap sohbete eklenecek
        // API tetikleyecek sohbet geçmişini sunucudan alacak
        fetchChatHistory(activeChatId);
      } catch (error) {
        console.error('Görüntü yükleme hatası:', error);
        
        if (error.response) {
          if (error.response.status === 401) {
            setMessages(prevMessages => [...prevMessages, { 
              role: 'assistant', 
              content: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.' 
            }]);
          } else if (error.response.status === 413) {
            setMessages(prevMessages => [...prevMessages, { 
              role: 'assistant', 
              content: 'Görüntü boyutu çok büyük. Lütfen daha küçük bir görüntü yükleyin.' 
            }]);
          } else {
            setMessages(prevMessages => [...prevMessages, { 
              role: 'assistant', 
              content: 'Görüntüyü işlerken bir hata oluştu. Lütfen tekrar deneyin.' 
            }]);
          }
        } else {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Görüntüyü işlerken bir hata oluştu. Lütfen tekrar deneyin.' 
          }]);
        }
        
        clearImage();
        setIsLoading(false);
      }
      
      return;
    }
    
    try {
      // Kullanıcı bilgi sorusu
      if (userMessage.toLowerCase().includes('kişisel bilgi') || 
          userMessage.toLowerCase().includes('bilgilerim') ||
          userMessage.toLowerCase().includes('profilim')) {
        setIsLoading(false);
        setShowUserInfoForm(true);
        return;
      }
      
      // Diyet planı istemi
      if (userMessage.toLowerCase().includes('diyet planı') || 
          userMessage.toLowerCase().includes('beslenme planı')) {
        setIsLoading(false);
        setShowDietPlan(true);
        
        // Bilgi eksikliği kontrolü
        if (!userInfo || !userInfo.weight || !userInfo.height || !userInfo.age) {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Size özel bir diyet planı oluşturabilmem için kişisel bilgilerinize ihtiyacım var. Lütfen kişisel bilgilerinizi güncelleyin.' 
          }]);
          setShowUserInfoForm(true);
        }
        
        return;
      }

      // AI Asistan modu komutları kontrolü
      if (userMessage.toLowerCase().includes('diyetisyen ol') || 
          userMessage.toLowerCase().includes('diyetisyen modu')) {
        changeAssistantMode('dietician');
        setIsLoading(false);
        return;
      }
      
      if (userMessage.toLowerCase().includes('fitness') || 
          userMessage.includes('antrenör ol') ||
          userMessage.includes('egzersiz modu')) {
        changeAssistantMode('fitness');
        setIsLoading(false);
        return;
      }
      
      if (userMessage.toLowerCase().includes('şef ol') || 
          userMessage.toLowerCase().includes('aşçı ol') ||
          userMessage.includes('tarif modu')) {
        changeAssistantMode('chef');
        setIsLoading(false);
        return;
      }
      
      if (userMessage.toLowerCase().includes('genel mod') || 
          userMessage.toLowerCase().includes('normal mod')) {
        changeAssistantMode('general');
        setIsLoading(false);
        return;
      }
      
      // AI asistan isteğini hazırla
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        setMessages(prevMessages => [...prevMessages, { 
          role: 'assistant', 
          content: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.' 
        }]);
        setIsLoading(false);
        return;
      }
      
      // Asistan moduna göre prompt'u hazırla
      let enhancedPrompt = userMessage;
      
      if (assistantMode === 'dietician') {
        enhancedPrompt = `[DİYETİSYEN MODU] Bir diyetisyen olarak yanıt ver: ${userMessage}`;
      } else if (assistantMode === 'fitness') {
        enhancedPrompt = `[FİTNESS MODU] Bir fitness antrenörü olarak yanıt ver: ${userMessage}`;
      } else if (assistantMode === 'chef') {
        enhancedPrompt = `[ŞEF MODU] Bir şef olarak sağlıklı tarifler öner: ${userMessage}`;
      }
      
      const response = await axios.post(`/api/chat`, 
        { 
          message: enhancedPrompt, 
          chatId: activeChatId,
          assistantMode: assistantMode 
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Sunucudan gelen yanıtı ekle
      if (response.data && response.data.response) {
        setMessages(prevMessages => [...prevMessages, { 
          role: 'assistant', 
          content: response.data.response 
        }]);
      }
      
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.' 
          }]);
        } else if (error.response.status === 403) {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Bu işlemi gerçekleştirmek için yetkiniz yok.' 
          }]);
        } else if (error.response.status === 404) {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'API endpoint\'i bulunamadı.' 
          }]);
        } else if (error.response.status === 500) {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' 
          }]);
        } else {
          setMessages(prevMessages => [...prevMessages, { 
            role: 'assistant', 
            content: 'Bir hata oluştu. Lütfen tekrar deneyin.' 
          }]);
        }
      } else if (error.request) {
        setMessages(prevMessages => [...prevMessages, { 
          role: 'assistant', 
          content: 'Sunucuya bağlanırken bir hata oluştu. İnternet bağlantınızı kontrol edin.' 
        }]);
      } else {
        setMessages(prevMessages => [...prevMessages, { 
          role: 'assistant', 
          content: 'Bir hata oluştu. Lütfen tekrar deneyin.' 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserInfoSubmit = (formData) => {
    // Kullanıcı bilgilerini kaydet
    setUserInfo(formData);
    setShowUserInfoForm(false);
    
    // Kullanıcı bilgileri alındığında diyet planını göster
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Teşekkürler! Bilgileriniz kaydedildi. 

Size özel bir beslenme planı hazırlıyorum. Bu plan, hedeflerinize, tercihlerinize ve ihtiyaçlarınıza göre özelleştirilmiştir.

İşte size özel beslenme planım:`
      }]);
      
      setTimeout(() => {
        setShowDietPlan(true);
      }, 1000);
    }, 500);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Eksik olduğu için not silme fonksiyonunu ekliyorum
  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }
      
      const response = await axios.delete(`/api/delete-note/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Notu listeden kaldır
        setMessages(messages.filter(msg => {
          // Not ID'si mesaj içinde tanımlanmışsa (data-note-id gibi bir özellik ile)
          return !(msg.type === 'note' && msg.noteId === noteId);
        }));
        
        // Bildirim göster
        alert('Not başarıyla silindi');
      } else {
        alert('Not silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Not silinirken hata:', error);
      alert('Not silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmitApiKey = (e) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('geminiApiKey', apiKey);
      setKeySubmitted(true);
      
      // API anahtarını sunucuya gönder
      const token = localStorage.getItem('token');
      if (token) {
        axios.post('/api/save-api-key', { apiKey }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(error => {
          console.error('API anahtarı kaydedilirken hata:', error);
        });
      }
    }
  };

  // API anahtarını sunucudan veya .env dosyasından al
  const fetchApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }
      
      // Sunucudan API anahtarını alma isteği
      const response = await axios.get('/api/get-api-key', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.apiKey) {
        setApiKey(response.data.apiKey);
        setKeySubmitted(true);
      } else {
        // Eğer localStorage'da kayıtlı bir anahtar varsa onu kullan
        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
          setApiKey(savedKey);
          setKeySubmitted(true);
        } else {
          // Eğer API anahtarı yoksa ve kullanıcı girmediyse, modal göster
          setKeySubmitted(false);
        }
      }
    } catch (error) {
      console.error('API anahtarı alınırken hata:', error);
      
      // Eğer localStorage'da kayıtlı bir anahtar varsa onu kullan
      const savedKey = localStorage.getItem('geminiApiKey');
      if (savedKey) {
        setApiKey(savedKey);
        setKeySubmitted(true);
      } else {
        // Eğer API anahtarı yoksa ve kullanıcı girmediyse, modal göster
        setKeySubmitted(false);
      }
    }
  };

  // Asistan modlarını değiştirme fonksiyonu
  const changeAssistantMode = (mode) => {
    setAssistantMode(mode);
    // Kullanıcıya mod değişikliği hakkında bilgi ver
    const modeMessages = {
      'general': 'Genel mod: Size sağlıklı yaşam konusunda yardımcı olabilirim.',
      'dietician': 'Diyetisyen mod: Size kişisel beslenme planı ve öneriler sunabilirim.',
      'fitness': 'Fitness mod: Size egzersiz programları ve aktivite önerileri sunabilirim.',
      'chef': 'Şef mod: Size sağlıklı ve lezzetli tarifler önerebilirim.'
    };
    
    // Mod değişikliği mesajını ekle
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: modeMessages[mode],
      timestamp: new Date().toISOString()
    }]);
    
    // Yeni modun bağlamını korumak için histori kaydet
    setAssistantHistory(prev => [...prev, { mode, startIndex: messages.length }]);
  };

  // Mesajı asistan moduna göre render et
  const renderMessageWithMode = (msg, index) => {
    let messageClass = "message";
    let avatarIcon = "🥗";

    // Asistan moduna göre ikon belirle
    if (msg.role === 'assistant') {
      if (assistantHistory.length > 0) {
        // Mesajın hangi modda gönderildiğini bul
        const messageMode = assistantHistory.reduce((current, historyItem) => {
          if (index >= historyItem.startIndex) {
            return historyItem.mode;
          }
          return current;
        }, 'general');

        // Moda göre ikon belirle
        switch (messageMode) {
          case 'dietician':
            avatarIcon = "🥗";
            messageClass += " dietician-message";
            break;
          case 'fitness':
            avatarIcon = "💪";
            messageClass += " fitness-message";
            break;
          case 'chef':
            avatarIcon = "👨‍🍳";
            messageClass += " chef-message";
            break;
          default:
            avatarIcon = "🤖";
            messageClass += " general-message";
        }
      }
    }

    return (
      <div key={index} className={`message-container ${msg.role}`}>
        {msg.role === 'assistant' && (
          <div className="avatar-container">
            <div className="assistant-avatar">{avatarIcon}</div>
          </div>
        )}
        <div className={msg.role === 'user' ? 'user-message' : messageClass}>
          {msg.content}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Sohbetler</h2>
          <button onClick={createNewChat} className="new-chat-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
            </svg>
            <span>Yeni Sohbet</span>
          </button>
        </div>
        
        <div className="mod-selector">
          <span className="mod-label">Mod:</span>
          <button 
            className={`mod-pill ${assistantMode === 'general' ? 'active' : ''}`}
            onClick={() => changeAssistantMode('general')}
          >
            🤖 Genel
          </button>
          <button 
            className={`mod-pill ${assistantMode === 'dietician' ? 'active' : ''}`}
            onClick={() => changeAssistantMode('dietician')}
          >
            🥗 Diyet
          </button>
          <button 
            className={`mod-pill ${assistantMode === 'fitness' ? 'active' : ''}`}
            onClick={() => changeAssistantMode('fitness')}
          >
            💪 Fitness
          </button>
          <button 
            className={`mod-pill ${assistantMode === 'chef' ? 'active' : ''}`}
            onClick={() => changeAssistantMode('chef')}
          >
            👨‍🍳 Şef
          </button>
        </div>
        
        {/* Mevcut sohbet listesi */}
        <div className="chat-list">
          {chatList.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <span className="chat-title">{chat.title || 'Yeni Sohbet'}</span>
              <div className="chat-actions">
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                  className="delete-chat-button"
                  title="Sohbeti sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <button onClick={clearChatHistory} className="clear-chat-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sohbeti Temizle
          </button>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <button onClick={toggleSidebar} className="sidebar-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1>Diyet Dostu AI</h1>
          <div className="assistant-mode-indicator">
            {assistantMode === 'dietician' && <span className="mode-badge dietician"><span>🥗</span> Diyetisyen</span>}
            {assistantMode === 'fitness' && <span className="mode-badge fitness"><span>💪</span> Fitness</span>}
            {assistantMode === 'chef' && <span className="mode-badge chef"><span>👨‍🍳</span> Şef</span>}
            {assistantMode === 'general' && <span className="mode-badge general"><span>🤖</span> Genel</span>}
          </div>
        </div>
        
        <div className="messages-container" id="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Diyet Dostu AI'a Hoş Geldiniz!</h2>
              <p>Beslenme, diyet veya fitness hakkında bir şeyler sor.</p>
              <div className="example-questions">
                <button onClick={() => setInput("Kilo vermek için nasıl beslenmeliyim?")}>
                  Kilo vermek için nasıl beslenmeliyim?
                </button>
                <button onClick={() => setInput("Bugün ne kadar protein almalıyım?")}>
                  Bugün ne kadar protein almalıyım?
                </button>
                <button onClick={() => setInput("Akşam yemeği için sağlıklı bir tarif önerir misin?")}>
                  Akşam yemeği için sağlıklı bir tarif önerir misin?
                </button>
              </div>
              <div className="assistant-modes-intro">
                <h3>Farklı Asistan Modları</h3>
                <p>İhtiyacınıza göre asistan modunu değiştirebilirsiniz:</p>
                <ul>
                  <li><strong>🥗 Diyetisyen:</strong> Kişisel beslenme planı ve tavsiyeler</li>
                  <li><strong>💪 Fitness:</strong> Egzersiz programları ve aktivite önerileri</li>
                  <li><strong>👨‍🍳 Şef:</strong> Sağlıklı ve lezzetli tarifler</li>
                </ul>
                <p>Mod değiştirmek için üstteki butonları kullanabilir veya şunları yazabilirsiniz:</p>
                <p>"diyetisyen ol", "fitness ol", "şef ol", "genel mod"</p>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => renderMessageWithMode(msg, index))}
              {isLoading && (
                <div className="loading-message">
                  <div className="loading-avatar">
                    <div className="assistant-avatar">
                      {assistantMode === 'dietician' && "🥗"}
                      {assistantMode === 'fitness' && "💪"}
                      {assistantMode === 'chef' && "👨‍🍳"}
                      {assistantMode === 'general' && "🤖"}
                    </div>
                  </div>
                  <div className="loading-animation">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Kullanıcı bilgi formu */}
          {showUserInfoForm && (
            <div className="user-info-form-container">
              <UserInfoForm 
                onSubmit={handleUserInfoSubmit} 
                onCancel={() => setShowUserInfoForm(false)}
              />
            </div>
          )}
          
          {/* Diyet planı */}
          {showDietPlan && userInfo && (
            <div className="diet-plan-container">
              <DietPlanGenerator userInfo={userInfo} />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit} className="input-form">
            <div className="textarea-container">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={textareaRef}
                placeholder="Diyet Dostu'na bir soru sor..."
                rows="1"
                className="chat-input"
              ></textarea>
              
              <label htmlFor="image-upload" className="upload-image-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !imageFile)}
              className="send-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </form>
          
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Yüklenen görsel" className="image-preview" />
              <button 
                onClick={clearImage}
                className="remove-image-button"
                title="Görseli kaldır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {!keySubmitted ? (
        <div className="api-key-modal">
          <div className="api-key-container">
            <h2>Gemini API Anahtarı Gerekli</h2>
            <p>Diyet Dostu AI ile sohbet etmek için Gemini API anahtarınızı girmeniz gerekiyor.</p>
            <form onSubmit={handleSubmitApiKey}>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="api-key-input"
                placeholder="Gemini API anahtarınız"
                required
              />
              <div className="api-key-actions">
                <label className="remember-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Bu bilgisayarda hatırla</span>
                </label>
                <button type="submit" className="api-key-button">Devam Et</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Chat; 