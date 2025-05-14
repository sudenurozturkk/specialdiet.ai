import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ExerciseCard from './ExerciseCard';
import '../styles/global.css';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('kisisel');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [diseases, setDiseases] = useState('');
  const [medications, setMedications] = useState('');
  const [healthInfoEditing, setHealthInfoEditing] = useState(false);
  const [personalInfoEditing, setPersonalInfoEditing] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const tooltipRef = useRef(null); // tooltipRef eklendi

  useEffect(() => {
    // localStorage'da kaydedilmiş userData'ya öncelik ver
    const cachedUserData = localStorage.getItem('userData');
    if (cachedUserData) {
      try {
        const parsedData = JSON.parse(cachedUserData);
        console.log('localStorage\'dan yüklenen kullanıcı verileri:', parsedData);
        
        // weightLogs'un dizi olduğundan emin olalım
        if (parsedData) {
          if (!parsedData.weightLogs) {
            parsedData.weightLogs = [];
          } else if (!Array.isArray(parsedData.weightLogs)) {
            parsedData.weightLogs = [parsedData.weightLogs];
          }
        }
        
        setUserData(parsedData);
        
        if (parsedData.info) {
          setDiseases(parsedData.info.diseases || '');
          setMedications(parsedData.info.medications || '');
          setHeight(parsedData.info.height || '');
          setWeight(parsedData.info.weight || '');
          setAge(parsedData.info.age || '');
          setGender(parsedData.info.gender || '');
        }
        setName(parsedData.name || '');
        setGoal(parsedData.goal || '');
        
        console.log('Önbellekten kullanıcı verileri yüklendi:', parsedData);
      } catch (error) {
        console.error("Önbellek verisi ayrıştırılırken hata:", error);
        localStorage.removeItem('userData'); // Bozuk veriyi temizle
      }
    }
    
    // Her durumda güncel verileri de sunucudan al
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'kisisel' && userData?.weightLogs?.length > 1) {
      const setupTooltip = () => {
        const tooltip = document.querySelector('.profile-tab .pro-chart-tooltip');
        if (!tooltip) {
          // Tooltip yoksa oluştur
          const newTooltip = document.createElement('div');
          newTooltip.className = 'pro-chart-tooltip';
          newTooltip.style.zIndex = '5'; // Düşük z-index değeri
          newTooltip.innerHTML = `
            <div class="pro-chart-tooltip-value"></div>
            <div class="pro-chart-tooltip-date"></div>
          `;
          document.querySelector('.profile-tab .pro-chart-container')?.appendChild(newTooltip);
        }

        // Noktalar için olay dinleyicileri ekle
        const dots = document.querySelectorAll('.profile-tab .pro-chart-dot');
        dots.forEach(dot => {
          dot.addEventListener('mouseover', function() {
            const tooltip = document.querySelector('.profile-tab .pro-chart-tooltip');
            if (tooltip) {
              const weight = this.getAttribute('data-weight');
              const date = this.getAttribute('data-date');
              tooltip.querySelector('.pro-chart-tooltip-value').textContent = `${weight} kg`;
              tooltip.querySelector('.pro-chart-tooltip-date').textContent = date;
              
              // Tooltip pozisyonunu ayarla
              const rect = this.getBoundingClientRect();
              const container = document.querySelector('.profile-tab .pro-chart-container')?.getBoundingClientRect();
              if (container) {
                tooltip.style.left = `${rect.left - container.left + rect.width/2}px`;
                tooltip.style.top = `${rect.top - container.top}px`;
              }
              tooltip.style.opacity = '1';
            }
          });
          
          dot.addEventListener('mouseout', function() {
            const tooltip = document.querySelector('.profile-tab .pro-chart-tooltip');
            if (tooltip) {
              tooltip.style.opacity = '0';
            }
          });
        });
      };
      
      // Grafik yüklendikten sonra tooltip'i ayarla
      setTimeout(setupTooltip, 500);
    }
  }, [activeTab, userData]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Oturum token bulunamadı');
        setError('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      console.log('Sunucudan profil verileri alınıyor...');
      
      try {
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 saniye timeout ekle
        });
        
        console.log("Sunucudan alınan profil verileri:", response.data);
        
        if (response.data) {
          const updatedUserData = response.data;
          
          // Kilo geçmişi verilerinin diziden oluştuğundan emin olalım
          if (!updatedUserData.weightLogs) {
            updatedUserData.weightLogs = [];
          } else if (!Array.isArray(updatedUserData.weightLogs)) {
            console.warn("weightLogs bir dizi değil, düzeltiliyor:", updatedUserData.weightLogs);
            updatedUserData.weightLogs = [updatedUserData.weightLogs];
          }
          
          // Merging: localStorage'da olup sunucuda olmayan kilo kayıtları
          const cachedData = localStorage.getItem('userData');
          if (cachedData) {
            try {
              const parsedCache = JSON.parse(cachedData);
              
              // Eğer localStorage'da weightLogs varsa ve sunucudan gelen verilerden fazla kayıt içeriyorsa
              if (parsedCache.weightLogs && Array.isArray(parsedCache.weightLogs) && 
                  parsedCache.weightLogs.length > updatedUserData.weightLogs.length) {
                console.log("localStorage'daki kilo kayıtları sunucudakinden fazla, birleştiriliyor");
                
                // Sunucudaki kayıtların ID'lerini tut
                const serverLogIds = updatedUserData.weightLogs.map(log => log.id);
                
                // localStorage'da olup sunucuda olmayan kayıtları ekle
                const additionalLogs = parsedCache.weightLogs.filter(log => !serverLogIds.includes(log.id));
                
                if (additionalLogs.length > 0) {
                  console.log("Sunucuda olmayan, localStorage'dan eklenen kayıtlar:", additionalLogs);
                  updatedUserData.weightLogs = [...updatedUserData.weightLogs, ...additionalLogs];
                }
              }
            } catch (e) {
              console.error("localStorage'daki verileri birleştirirken hata:", e);
            }
          }
          
          // Kilo kayıtları için benzersiz ID'leri kontrol et ve tarihe göre sırala
          updatedUserData.weightLogs = updatedUserData.weightLogs
            .filter((log, index, self) => 
              index === self.findIndex(l => l.id === log.id)
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Önce localStorage'a kaydet
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          console.log('Kullanıcı verileri localStorage\'a kaydedildi');
          
          // Sonra state'i güncelle
          setUserData(updatedUserData);
          
          // Bilgileri state'e aktar
          if (updatedUserData.info) {
            setDiseases(updatedUserData.info.diseases || '');
            setMedications(updatedUserData.info.medications || '');
            setHeight(updatedUserData.info.height || '');
            setWeight(updatedUserData.info.weight || '');
            setAge(updatedUserData.info.age || '');
            setGender(updatedUserData.info.gender || '');
          }
          
          setName(updatedUserData.name || '');
          setGoal(updatedUserData.goal || '');
          
          console.log('Form state değerleri güncellendi');
        } else {
          console.error('API yanıtında veri yok veya beklenmeyen format');
          // LocalStorage'daki verileri koruyalım, hata mesajını göstermeyelim
        }
      } catch (apiError) {
        console.error('API isteği başarısız:', apiError);
        // Bağlantı hatası durumunda localStorage'daki verileri kullan
        console.log("Sunucu bağlantısı başarısız, localStorage'daki veriler korunacak");
        // Hata mesajı göstermiyoruz çünkü localStorage'daki verileri kullanacağız
      }
    } catch (error) {
      console.error('Profil bilgileri yüklenirken hata:', error);
      
      // Hata detaylarını göster
      if (error.response) {
        console.error('Sunucu yanıtı:', error.response.data);
        console.error('Durum kodu:', error.response.status);
      } else if (error.request) {
        console.error('Yanıt alınamadı:', error.request);
      }
      
      setError('Profil bilgileri yüklenemedi. Lütfen ağ bağlantınızı kontrol edin ve daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = async (exercise) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const updatedExercises = userData.exercisePlan.map(ex => {
        if (ex.id === exercise.id) {
          return { ...ex, completed: !ex.completed };
        }
        return ex;
      });
      
      const optimisticUserData = { ...userData, exercisePlan: updatedExercises };
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      await axios.post(
        'http://localhost:5000/api/profile/mark-complete',
        {
          type: 'exercise',
          item: exercise,
          completed: !exercise.completed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Başarılı işlem sonrası sunucudan güncel verileri al
      fetchUserData();
    } catch (error) {
      console.error('Egzersiz durumu güncellenirken hata:', error);
      setError('Egzersiz durumu güncellenemedi. Lütfen tekrar deneyin.');
      fetchUserData(); // Hata durumunda orijinal verileri geri yükle
    }
  };

  const handleToggleMeal = async (day, meal) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const updatedDietPlan = { ...userData.dietPlan };
      if (updatedDietPlan[day]) {
        updatedDietPlan[day] = updatedDietPlan[day].map(m => {
          if (m.name === meal.name) {
            return { ...m, completed: !m.completed };
          }
          return m;
        });
      }
      
      const optimisticUserData = { ...userData, dietPlan: updatedDietPlan };
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      await axios.post(
        'http://localhost:5000/api/profile/mark-complete',
        {
          type: 'meal',
          day,
          meal: meal.name,
          completed: !meal.completed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Başarılı işlem sonrası sunucudan güncel verileri al
      fetchUserData();
    } catch (error) {
      console.error('Yemek durumu güncellenirken hata:', error);
      setError('Yemek durumu güncellenemedi. Lütfen tekrar deneyin.');
      fetchUserData(); // Hata durumunda orijinal verileri geri yükle
    }
  };

  const handleToggleNote = async (note) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const updatedNotes = userData.notes.map(n => {
        if (n.id === note.id) {
          return { ...n, completed: !n.completed };
        }
        return n;
      });
      
      const optimisticUserData = { ...userData, notes: updatedNotes };
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      await axios.post(
        'http://localhost:5000/api/profile/mark-complete',
        {
          type: 'note',
          note,
          completed: !note.completed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Başarılı işlem sonrası sunucudan güncel verileri al
      fetchUserData();
    } catch (error) {
      console.error('Not durumu güncellenirken hata:', error);
      setError('Not durumu güncellenemedi. Lütfen tekrar deneyin.');
      fetchUserData(); // Hata durumunda orijinal verileri geri yükle
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // Yeni not oluştur
      const tempId = Date.now(); // Geçici ID
      const newNoteObj = {
        id: tempId,
        text: newNote,
        date: new Date().toISOString(),
        completed: false
      };
      
      // İyimser UI güncellemesi
      const updatedNotes = [...(userData.notes || []), newNoteObj];
      const optimisticUserData = { ...userData, notes: updatedNotes };
      
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      setNewNote(''); // Input alanını temizle
      
      // API çağrısı
      const response = await axios.post(
        'http://localhost:5000/api/profile/update',
        {
          type: 'note',
          text: newNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Not ekleme yanıtı:", response.data);
      
      // Başarı mesajı göster
      setSuccessMessage('Not başarıyla eklendi.');
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      // Güncel verileri al
      fetchUserData();
    } catch (error) {
      console.error('Not eklenirken hata:', error);
      setError('Not eklenemedi. Lütfen tekrar deneyin.');
      setNewNote(newNote); // Hata durumunda girilen notu geri al
      fetchUserData(); // Orijinal verileri geri yükle
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    
    if (!newWeight.trim()) return;
    
    try {
      setIsLoading(true); // Yükleniyor durumunu göster
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // Yeni kilo kaydı oluştur
      const newWeightValue = parseFloat(newWeight);
      const newWeightLog = {
        id: Date.now().toString(), // Benzersiz bir ID
        weight: newWeightValue,
        date: new Date().toISOString()
      };
      
      console.log("Eklenecek yeni kilo kaydı:", newWeightLog);
      
      // Mevcut userData'yı güncelleyelim
      let currentUserData = {...userData};
      
      // weightLogs dizisinin varlığını kontrol et
      if (!currentUserData.weightLogs) {
        currentUserData.weightLogs = [];
      } else if (!Array.isArray(currentUserData.weightLogs)) {
        // Eğer dizi değilse dizi haline getir
        currentUserData.weightLogs = [currentUserData.weightLogs];
      }
      
      // Yeni kilo kaydını ekle
      currentUserData.weightLogs.push(newWeightLog);
      
      // Mevcut kilo bilgisini de güncelle
      if (!currentUserData.info) {
        currentUserData.info = {}; 
      }
      
      currentUserData.info.weight = newWeightValue;
      
      console.log("Güncellenecek kullanıcı verisi:", currentUserData);
      
      // Önce yerel state'i güncelle
      setUserData(currentUserData);
      setWeight(newWeightValue.toString());
      
      // localStorage'a kaydet
      localStorage.setItem('userData', JSON.stringify(currentUserData));
      console.log("Kullanıcı verileri localStorage'a kaydedildi");
      
      // Input alanını temizle
      setNewWeight('');
      
      // Sunucuya gönder
      try {
        const response = await axios.post(
          'http://localhost:5000/api/profile/update',
          {
            type: 'weight',
            weight: newWeightValue
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Sunucu yanıtı:", response.data);
        
        if (response.data && response.data.success) {
          console.log("Kilo kaydı sunucuya başarıyla kaydedildi");
        } else {
          console.warn("Sunucu başarı bildirdi ancak tam istenilen yanıt formatında değil:", response.data);
        }
      } catch (apiError) {
        console.error("Sunucu API hatası:", apiError);
        console.log("Fakat yerel veriler güncellendi, frontend işleyişi devam edecek");
        // Sunucu hatasını göster
        // setError('Sunucuya bağlanırken bir hata oluştu, ancak verileriniz yerel olarak kaydedildi.');
        // setTimeout(() => setError(''), 5000);
      }
      
      // Başarı mesajı göstermiyoruz
      // setSuccessMessage('Kilo kaydınız başarıyla eklendi.');
      // setShowSuccessMessage(true);
      
      // setTimeout(() => {
      //   setShowSuccessMessage(false);
        
      //   // Hemen kilo takibi sekmesine geçiş yapalım
      //   setActiveTab('kilo');
      // }, 2000);
      
      // Doğrudan kilo takibi sekmesine geçiş yapalım
      setActiveTab('kilo');
      
    } catch (error) {
      console.error('Kilo eklenirken hata:', error);
      setError('Kilo eklenemedi: ' + error.message);
    } finally {
      setIsLoading(false); // Yükleniyor durumunu kapat
    }
  };

  const handleSaveHealthInfo = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const optimisticUserData = { 
        ...userData, 
        info: {
          ...userData.info,
          diseases: diseases,
          medications: medications
        }
      };
      
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      setHealthInfoEditing(false); // Düzenleme modunu kapat
      
      // API çağrısı
      const response = await axios.post(
        'http://localhost:5000/api/profile/update',
        {
          type: 'health',
          diseases: diseases,
          medications: medications
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Sağlık bilgileri güncelleme yanıtı:", response.data);
      
      // Başarı mesajı göster
      setSuccessMessage('Sağlık bilgileriniz başarıyla güncellendi.');
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      // Güncel verileri al
      fetchUserData();
    } catch (error) {
      console.error('Sağlık bilgileri güncellenirken hata:', error);
      setError('Sağlık bilgileriniz güncellenemedi. Lütfen tekrar deneyin.');
      setHealthInfoEditing(true); // Hata durumunda düzenleme modunu aktif tut
      fetchUserData(); // Orijinal verileri geri yükle
    }
  };

  const handleDeleteNote = async (note) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // Not ID'sini konsola yazdır (debug için)
      console.log("Silinecek not ID:", note.id);
      console.log("Tüm not objesi:", note);
      
      // Not ID'sinin geçerli olduğunu kontrol et
      if (!note.id) {
        setError('Not ID bulunamadı. Lütfen yenileyin ve tekrar deneyin.');
        return;
      }
      
      // İyimser UI güncellemesi
      const filteredNotes = userData.notes.filter(n => n.id !== note.id);
      const optimisticUserData = { ...userData, notes: filteredNotes };
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      try {
        // Not silme API çağrısı
        const response = await axios.post(
          'http://localhost:5000/api/profile/delete-note',
          { noteId: note.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Not silme yanıtı:", response.data);
        
        // Başarı mesajı göster
        setSuccessMessage('Not başarıyla silindi.');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (apiError) {
        console.error('Not silme API hatası:', apiError);
        
        // API hatası olsa bile UI'da notu kaldır (kullanıcı deneyimi için)
        // Arka planda yeniden senkronize etmek için sunucudan verileri al
        fetchUserData();
        
        // Kullanıcıya bildirim göster
        setError('Sunucu hatası: Not silinirken bir problem oluştu, ancak notunuz yerel olarak kaldırıldı.');
      }
    } catch (error) {
      console.error('Not silme genel hatası:', error);
      fetchUserData(); // Verileri yeniden al
      setError('Not silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true); // Yükleme göstergesi ekle
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // Mevcut durumu loglama
      console.log("Güncellenecek değerler:", {
        name, goal, height, weight, age, gender
      });
      
      // Form verilerini hazırla, boş değerleri güvenli şekilde işle
      const updateData = {
        type: 'personal',
        name: name.trim() || undefined,
        goal: goal || undefined,
        height: height ? height.toString() : undefined,
        weight: weight ? weight.toString() : undefined,
        age: age ? age.toString() : undefined,
        gender: gender || undefined
      };
      
      console.log("Gönderilen profil verileri:", updateData);
      
      // İyimser UI güncellemesi
      const optimisticUserData = { 
        ...userData, 
        name: name, 
        goal: goal,
        info: {
          ...userData.info,
          height: height,
          weight: weight,
          age: age,
          gender: gender
        }
      };
      
      // State'i ve localStorage'ı güncelle
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      // API isteği gönder
      const response = await axios.post(
        'http://localhost:5000/api/profile/update',
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Sunucu yanıtı:", response.data);
      
      // API yanıtı başarılıysa
      if (response.data && response.data.success) {
        // Sunucudan güncel kullanıcı verilerini al
        if (response.data.user) {
          const updatedUserData = response.data.user;
          setUserData(updatedUserData);
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          console.log('Kullanıcı verileri API yanıtından güncellendi');
          
          // Bilgileri state'e aktar
          if (updatedUserData.info) {
            setDiseases(updatedUserData.info.diseases || '');
            setMedications(updatedUserData.info.medications || '');
            setHeight(updatedUserData.info.height || '');
            setWeight(updatedUserData.info.weight || '');
            setAge(updatedUserData.info.age || '');
            setGender(updatedUserData.info.gender || '');
          }
          
          setName(updatedUserData.name || '');
          setGoal(updatedUserData.goal || '');
        } else {
          // API güncellenen kullanıcı verilerini döndürmediyse, güncel verileri al
          console.log('API güncellenen kullanıcı verilerini döndürmedi, fetchUserData çağrılıyor');
          fetchUserData();
        }
        
        setPersonalInfoEditing(false);
        
        // Başarı mesajı göster
        setSuccessMessage('Bilgileriniz başarıyla güncellendi.');
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        // API başarılı değilse
        console.error('API yanıtı başarısız:', response.data);
        setError('Bilgileriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
        
        // Güncel verileri al
        fetchUserData();
      }
    } catch (error) {
      console.error('Kişisel bilgiler güncellenirken hata:', error);
      
      // Hata detaylarını göster
      if (error.response) {
        console.error('Sunucu yanıtı:', error.response.data);
        console.error('Durum kodu:', error.response.status);
      } else if (error.request) {
        console.error('Yanıt alınamadı:', error.request);
      }
      
      // Hata durumunda güncel verileri al
      fetchUserData();
      setError('Bilgileriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false); // Yükleme göstergesini kaldır
    }
  };

  // Kilo kaydını silme fonksiyonu
  const handleDeleteWeight = async (weightId) => {
    // Onay iste
    if (!window.confirm('Bu kilo kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      console.log("Silinecek kilo kaydı ID:", weightId);
      
      // Önce yerel verileri güncelleyelim
      let currentUserData = {...userData};
      
      // weightLogs dizisinden ilgili kaydı çıkar
      if (currentUserData.weightLogs && Array.isArray(currentUserData.weightLogs)) {
        currentUserData.weightLogs = currentUserData.weightLogs.filter(log => log.id !== weightId);
        
        // Eğer kalan son kayıt varsa, current weight'i güncelle
        if (currentUserData.weightLogs.length > 0) {
          // En son kayıt tarihi en yeni olan
          const sortedLogs = [...currentUserData.weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
          const lastLog = sortedLogs[0];
          
          if (!currentUserData.info) {
            currentUserData.info = {};
          }
          
          currentUserData.info.weight = lastLog.weight;
        }
        
        // State'i ve localStorage'ı güncelle
        setUserData(currentUserData);
        if (currentUserData.info && currentUserData.info.weight) {
          setWeight(currentUserData.info.weight.toString());
        }
        
        localStorage.setItem('userData', JSON.stringify(currentUserData));
        console.log("Kilo kaydı yerel olarak silindi");
      }
      
      // Sunucudan da silme işlemi
      try {
        const response = await axios.post(
          'http://localhost:5000/api/profile/delete-weight',
          {
            weightId: weightId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Sunucu silme yanıtı:", response.data);
        
        if (response.data && response.data.success) {
          console.log("Kilo kaydı sunucudan başarıyla silindi");
        } else {
          console.warn("Sunucudan silme başarılı mesajı alınamadı:", response.data);
        }
      } catch (apiError) {
        console.error("Sunucu silme API hatası:", apiError);
        // Hata mesajını da kaldıralım, kullanıcı sadece işlemin yapıldığını bilmek istiyor
        // setError('Sunucudan silme sırasında bir hata oluştu, ancak yerel verilerden silindi.');
        // setTimeout(() => setError(''), 5000);
      }
      
    } catch (error) {
      console.error('Kilo kaydı silinirken hata:', error);
      setError('Kilo kaydı silinemedi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabs = () => {
    return (
      <div className="tabs" style={{ 
        position: 'relative', 
        zIndex: 9000,
        display: 'flex',
        marginBottom: '20px',
        borderBottom: '1px solid #ddd',
        background: 'white',
        padding: '10px 0',
        borderRadius: '8px 8px 0 0'
      }}>
        <div
          className={`tab ${activeTab === 'kisisel' ? 'active' : ''}`}
          onClick={() => setActiveTab('kisisel')}
          style={{ 
            cursor: 'pointer !important', 
            position: 'relative', 
            zIndex: 9000,
            padding: '8px 16px',
            color: activeTab === 'kisisel' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'kisisel' ? 'bold' : 'normal',
            borderBottom: activeTab === 'kisisel' ? '3px solid #4CAF50' : 'none'
          }}
        >
          Kişisel Bilgiler
        </div>
        <div
          className={`tab ${activeTab === 'kilo' ? 'active' : ''}`}
          onClick={() => setActiveTab('kilo')}
          style={{ 
            cursor: 'pointer !important', 
            position: 'relative', 
            zIndex: 9000,
            padding: '8px 16px',
            color: activeTab === 'kilo' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'kilo' ? 'bold' : 'normal',
            borderBottom: activeTab === 'kilo' ? '3px solid #4CAF50' : 'none'
          }}
        >
          Kilo Takibi
        </div>
        <div
          className={`tab ${activeTab === 'hedef' ? 'active' : ''}`}
          onClick={() => setActiveTab('hedef')}
          style={{ 
            cursor: 'pointer !important', 
            position: 'relative', 
            zIndex: 9000,
            padding: '8px 16px',
            color: activeTab === 'hedef' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'hedef' ? 'bold' : 'normal',
            borderBottom: activeTab === 'hedef' ? '3px solid #4CAF50' : 'none'
          }}
        >
          Hedefler
        </div>
        <div
          className={`tab ${activeTab === 'saglik' ? 'active' : ''}`}
          onClick={() => setActiveTab('saglik')}
          style={{ 
            cursor: 'pointer !important', 
            position: 'relative', 
            zIndex: 9000,
            padding: '8px 16px',
            color: activeTab === 'saglik' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'saglik' ? 'bold' : 'normal',
            borderBottom: activeTab === 'saglik' ? '3px solid #4CAF50' : 'none'
          }}
        >
          Sağlık Bilgileri
        </div>
        <div
          className={`tab ${activeTab === 'notlar' ? 'active' : ''}`}
          onClick={() => setActiveTab('notlar')}
          style={{ 
            cursor: 'pointer !important', 
            position: 'relative', 
            zIndex: 9000,
            padding: '8px 16px',
            color: activeTab === 'notlar' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'notlar' ? 'bold' : 'normal',
            borderBottom: activeTab === 'notlar' ? '3px solid #4CAF50' : 'none'
          }}
        >
          Notlarım
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="profile-header-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Profil Bilgilerim</h3>
          {!personalInfoEditing && (
            <button onClick={() => setPersonalInfoEditing(true)} className="btn btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Düzenle
            </button>
          )}
        </div>
        
        {personalInfoEditing ? (
          <form onSubmit={handleSavePersonalInfo} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label">İsim Soyisim</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="height" className="form-label">Boy (cm)</label>
                <input
                  type="number"
                  id="height"
                  className="form-input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Örn: 175"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="current-weight" className="form-label">Kilo (kg)</label>
                <input
                  type="number"
                  id="current-weight"
                  className="form-input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Örn: 70"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="age" className="form-label">Yaş</label>
                <input
                  type="number"
                  id="age"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Örn: 30"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender" className="form-label">Cinsiyet</label>
                <select
                  id="gender"
                  className="form-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="erkek">Erkek</option>
                  <option value="kadın">Kadın</option>
                  <option value="diğer">Diğer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="goal" className="form-label">Hedef</label>
                <select
                  id="goal"
                  className="form-input"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="kilo_verme">Kilo Vermek</option>
                  <option value="kilo_alma">Kilo Almak</option>
                  <option value="kilo_koruma">Kilo Korumak</option>
                  <option value="kas_kazanma">Kas Kazanmak</option>
                  <option value="saglikli_beslenme">Sağlıklı Beslenme</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                onClick={() => setPersonalInfoEditing(false)} 
                className="btn btn-outline"
              >
                İptal
              </button>
              <button type="submit" className="btn">
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </span>
                ) : "Kaydet"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="profile-info-card">
              <div className="profile-avatar">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
              <h2 className="profile-name">{name || 'İsimsiz Kullanıcı'}</h2>
              <p className="profile-bio">
                {userData && userData.joinDate && userData.joinDate !== 'Invalid Date' 
                  ? `${new Date(userData.joinDate).toLocaleDateString('tr-TR')} tarihinde katıldı` 
                  : 'Diyet Dostu üyesi'}
              </p>
            </div>
            
            <div className="profile-metrics-card">
              <div className="metric-item">
                <div className="metric-label">Boy</div>
                <div className="metric-value">{height ? `${height} cm` : '--'}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Kilo</div>
                <div className="metric-value">{weight ? `${weight} kg` : '--'}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">BMI</div>
                <div className="metric-value">
                  {height && weight 
                    ? (weight / ((height/100) * (height/100))).toFixed(1) 
                    : '--'}
                </div>
              </div>
            </div>
            
            <div className="profile-stats-card">
              <div className="stats-title">İstatistikler</div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{userData && userData.weightLogs ? userData.weightLogs.length : 0}</div>
                  <div className="stat-label">Kilo Kaydı</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{userData && userData.notes ? userData.notes.length : 0}</div>
                  <div className="stat-label">Not</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {goal 
                      ? goal === 'kilo_verme' 
                        ? 'Kilo Verme' 
                        : goal === 'kilo_alma' 
                          ? 'Kilo Alma' 
                          : goal === 'kilo_koruma' 
                            ? 'Kilo Koruma' 
                            : goal === 'kas_kazanma' 
                              ? 'Kas Kazanma' 
                              : 'Sağlıklı Beslenme'
                      : '--'}
                  </div>
                  <div className="stat-label">Hedef</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!personalInfoEditing && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">BMI Değeri</h3>
          <div className="bmi-gauge">
            {height && weight ? (
              <>
                <div className="bmi-meter-container">
                  <div className="bmi-meter">
                    <div className="bmi-scale">
                      <div className="bmi-section bmi-underweight"></div>
                      <div className="bmi-section bmi-normal"></div>
                      <div className="bmi-section bmi-overweight"></div>
                      <div className="bmi-section bmi-obese"></div>
                    </div>
                    <div 
                      className="bmi-indicator" 
                      style={{ 
                        left: `${Math.min(Math.max((weight / ((height/100) * (height/100)) - 10) * 5, 0), 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="bmi-labels">
                    <span>Zayıf</span>
                    <span>Normal</span>
                    <span>Fazla Kilolu</span>
                    <span>Obez</span>
                  </div>
                </div>
                <div className="bmi-value">
                  <span className="text-2xl font-bold">
                    {(weight / ((height/100) * (height/100))).toFixed(1)}
                  </span>
                  <span className="text-sm ml-2">kg/m²</span>
                </div>
                <p className="bmi-description mt-3">
                  {weight / ((height/100) * (height/100)) < 18.5 
                    ? 'Düşük kilolu kategoridesiniz. Sağlıklı beslenme ve tıbbi tavsiye önemlidir.' 
                    : weight / ((height/100) * (height/100)) < 25 
                      ? 'Tebrikler! Sağlıklı kilo aralığındasınız.' 
                      : weight / ((height/100) * (height/100)) < 30 
                        ? 'Fazla kilolu kategoridesiniz. Sağlıklı beslenme ve egzersiz önerilir.' 
                        : 'Obez kategoridesiniz. Bir sağlık uzmanının tavsiyelerini almanız önerilir.'}
                </p>
              </>
            ) : (
              <p className="text-center py-4">BMI hesaplaması için boy ve kilo bilgilerinizi ekleyin.</p>
            )}
          </div>
        </div>
      )}

      {!personalInfoEditing && userData && userData.goal && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Hedef İlerleme</h3>
          <div className="progress-container">
            <div className="progress-info">
              <span>İlerleme: %{userData.goalProgress || 0}</span>
              <span>{userData.goalStart || '--'} → {userData.goalTarget || '--'}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{width: `${userData.goalProgress || 0}%`}}
              ></div>
            </div>
          </div>
        </div>
      )}

      {!personalInfoEditing && userData?.weightLogs?.length > 0 && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Kilo Takibi</h3>
          
          {/* Eski çubuk grafik yerine daha küçük ve zarif modern çizgi grafik */}
          {userData.weightLogs.length > 1 && (
            <div className="pro-chart-container" style={{ zIndex: 1, position: 'relative' }}>
              {(() => {
                // Kilo kayıtlarını tarihe göre sırala
                const sortedLogs = [...userData.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Değerler için ölçek hesapla
                const weights = sortedLogs.map(log => parseFloat(log.weight));
                const maxWeight = Math.max(...weights);
                const minWeight = Math.min(...weights);
                const padding = Math.max(0.5, (maxWeight - minWeight) * 0.1);
                const adjustedMin = Math.max(0, minWeight - padding);
                const adjustedMax = maxWeight + padding;
                const range = adjustedMax - adjustedMin;
                
                // X ekseni için tarih etiketleri
                const dateLabels = sortedLogs.map(log => {
                  const date = new Date(log.date);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                });
                
                // Gösterilecek X etiketleri (en fazla 4 tane)
                const xLabelIndices = [];
                if (sortedLogs.length <= 4) {
                  for (let i = 0; i < sortedLogs.length; i++) {
                    xLabelIndices.push(i);
                  }
                } else {
                  xLabelIndices.push(0); // İlk
                  
                  if (sortedLogs.length > 2) {
                    xLabelIndices.push(Math.floor(sortedLogs.length / 3)); // Yaklaşık üçte bir
                  }
                  
                  if (sortedLogs.length > 3) {
                    xLabelIndices.push(Math.floor(2 * sortedLogs.length / 3)); // Yaklaşık üçte iki
                  }
                  
                  xLabelIndices.push(sortedLogs.length - 1); // Son
                }
                
                // SVG için nokta koordinatları
                const points = sortedLogs.map((log, index) => {
                  const x = (index / (sortedLogs.length - 1)) * 90;
                  const y = 100 - ((parseFloat(log.weight) - adjustedMin) / range * 100);
                  return { x, y, log, date: new Date(log.date).toLocaleDateString('tr-TR') };
                });
                
                // SVG path için çizgi noktaları
                const linePath = points.map((point, i) => 
                  `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                
                // SVG path için alan dolgusu
                const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;
                
                return (
                  <div className="pro-chart-inner" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px 5px 20px' }}>
                    <div className="pro-chart-header">
                      <div className="pro-chart-title" style={{ fontSize: '0.85rem' }}>Kilo Takibi</div>
                      <div className="pro-chart-legend">
                        <span className="text-xs text-gray-500">{dateLabels[0]} - {dateLabels[dateLabels.length-1]}</span>
                      </div>
                    </div>
                    
                    <div className="pro-chart-canvas" style={{ height: '70px' }}>
                      {/* Y ekseni değerleri */}
                      <div className="pro-chart-y-axis">
                        <span className="pro-chart-y-label">{adjustedMax.toFixed(1)} kg</span>
                        <span className="pro-chart-y-label">{adjustedMin.toFixed(1)} kg</span>
                      </div>
                      
                      <svg className="pro-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Gradient tanımı */}
                        <defs>
                          <linearGradient id="pro-chart-gradient-small" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                        
                        {/* Izgara çizgileri - daha hafif */}
                        <line x1="0" y1="0" x2="100" y2="0" className="pro-chart-grid-line" style={{ stroke: 'rgba(0,0,0,0.03)' }} />
                        <line x1="0" y1="50" x2="100" y2="50" className="pro-chart-grid-line" style={{ stroke: 'rgba(0,0,0,0.03)' }} />
                        <line x1="0" y1="100" x2="100" y2="100" className="pro-chart-grid-line" style={{ stroke: 'rgba(0,0,0,0.03)' }} />
                        
                        {/* Alan dolgusu */}
                        <path d={areaPath} style={{ fill: 'url(#pro-chart-gradient-small)', opacity: 0.2 }} />
                        
                        {/* Çizgi */}
                        <path d={linePath} style={{ fill: 'none', stroke: '#4CAF50', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
                        
                        {/* Veri noktaları */}
                        {points.map((point, i) => (
                          <circle 
                            key={i}
                            cx={point.x} 
                            cy={point.y} 
                            r="1.5"
                            style={{ fill: 'white', stroke: '#4CAF50', strokeWidth: '1.5' }}
                            data-weight={point.log.weight}
                            data-date={point.date}
                            className="pro-chart-dot"
                          />
                        ))}
                      </svg>
                      
                      {/* X ekseni değerleri */}
                      <div className="pro-chart-x-axis">
                        {xLabelIndices.map(idx => (
                          <span 
                            key={`label-${idx}`} 
                            style={{ position: 'absolute', left: `${points[idx].x}%`, transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#666' }}
                          >
                            {dateLabels[idx]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Son kilo değişimi özeti */}
          {userData.weightLogs.length > 1 && (
            <div className="flex justify-center mt-3">
              <div className="text-center text-sm">
                <span className="font-medium">Son kayıt: </span>
                <span className="font-bold">{
                  userData.weightLogs
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight
                } kg</span>
                <span className="mx-2">•</span>
                <span className="font-medium">Toplam kayıt: </span>
                <span className="font-bold">{userData.weightLogs.length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderWeightTab = () => {
    // Tablo oluşturulması için kilo kayıtlarını hazırla
    let weightLogsToDisplay = [];
    
    if (userData && userData.weightLogs) {
      if (Array.isArray(userData.weightLogs)) {
        weightLogsToDisplay = [...userData.weightLogs];
      } else {
        // Dizi değilse dizi haline getir
        weightLogsToDisplay = [userData.weightLogs];
      }
    }
    
    console.log("Görüntülenecek kilo kayıtları:", weightLogsToDisplay);
    
    return (
      <div>
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Kilo Geçmişi</h3>
          
          {weightLogsToDisplay.length > 0 ? (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full modern-table">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2">Tarih</th>
                      <th className="text-center px-4 py-2">Kilo (kg)</th>
                      <th className="text-center w-16 px-4 py-2">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightLogsToDisplay
                      .slice() // Kopya oluştur
                      .sort((a, b) => new Date(b.date) - new Date(a.date)) // En yeni kayıt üstte
                      .map((log, index) => {
                        // Bir önceki kilo kaydı ile farkı hesapla
                        let weightDiff = null;
                        if (index < weightLogsToDisplay.length - 1) {
                          const sortedLogs = [...weightLogsToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));
                          if (index + 1 < sortedLogs.length) {
                            weightDiff = parseFloat(log.weight) - parseFloat(sortedLogs[index + 1].weight);
                          }
                        }
                        
                        return (
                          <tr key={log.id || index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3">
                              <span className="font-medium">{new Date(log.date).toLocaleDateString('tr-TR')}</span>
                              <span className="text-xs text-gray-500 block">{new Date(log.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className="font-semibold">{log.weight} kg</span>
                              {weightDiff !== null && (
                                <span className={`ml-2 text-xs font-medium rounded-full px-2 py-1 ${
                                  weightDiff < 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : weightDiff > 0 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {weightDiff < 0 ? '↓' : weightDiff > 0 ? '↑' : '='}
                                  {Math.abs(weightDiff).toFixed(1)} kg
                                </span>
                              )}
                            </td>
                            <td className="text-center px-4 py-3">
                              <button 
                                onClick={() => handleDeleteWeight(log.id)} 
                                className="text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 p-1.5 rounded-full"
                                title="Kilo kaydını sil"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
              
              {/* Kilo değişim grafiği */}
              {weightLogsToDisplay.length > 1 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-3">Kilo Değişim Grafiği</h4>
                  <div className="pro-chart-container" style={{ maxWidth: '85%', margin: '0 auto' }}>
                    {(() => {
                      // Kilo kayıtlarını tarihe göre sırala
                      const sortedLogs = [...weightLogsToDisplay].sort((a, b) => new Date(a.date) - new Date(b.date));
                      
                      // Değerler için ölçek hesapla
                      const weights = sortedLogs.map(log => parseFloat(log.weight));
                      const maxWeight = Math.max(...weights);
                      const minWeight = Math.min(...weights);
                      // Grafiği daha görsel hale getirmek için ölçekleri ayarla
                      const padding = Math.max(0.5, (maxWeight - minWeight) * 0.1);
                      const adjustedMin = Math.max(0, minWeight - padding);
                      const adjustedMax = maxWeight + padding;
                      const range = adjustedMax - adjustedMin;
                      
                      // X ekseni için tarih etiketleri
                      const dateLabels = sortedLogs.map(log => {
                        const date = new Date(log.date);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      });
                      
                      // Gösterilecek X etiketleri (en fazla 5-6 tane)
                      const xLabelIndices = [];
                      if (sortedLogs.length <= 6) {
                        // 6 veya daha az nokta varsa hepsini göster
                        for (let i = 0; i < sortedLogs.length; i++) {
                          xLabelIndices.push(i);
                        }
                      } else {
                        // İlk, son ve arada eşit dağılımlı noktaları göster
                        xLabelIndices.push(0); // İlk
                        
                        const step = Math.ceil(sortedLogs.length / 4);
                        for (let i = step; i < sortedLogs.length - 1; i += step) {
                          xLabelIndices.push(i);
                        }
                        
                        xLabelIndices.push(sortedLogs.length - 1); // Son
                      }
                      
                      // SVG için nokta koordinatları - %85'e kadar kullan
                      const points = sortedLogs.map((log, index) => {
                        const x = (index / (sortedLogs.length - 1)) * 85;
                        const y = 100 - ((parseFloat(log.weight) - adjustedMin) / range * 100);
                        return { x, y, log, date: new Date(log.date).toLocaleDateString('tr-TR') };
                      });
                      
                      // SVG path için çizgi noktaları
                      const linePath = points.map((point, i) => 
                        `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                      ).join(' ');
                      
                      // SVG path için alan dolgusu
                      const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;
                      
                      return (
                        <div className="pro-chart-inner">
                          <div className="pro-chart-header">
                            <div className="pro-chart-title">Kilo Takibi</div>
                            <div className="pro-chart-legend">
                              <span className="text-sm">{sortedLogs[0].date ? new Date(sortedLogs[0].date).toLocaleDateString('tr-TR', {month: 'numeric', year: 'numeric'}) : ''} - {sortedLogs[sortedLogs.length-1].date ? new Date(sortedLogs[sortedLogs.length-1].date).toLocaleDateString('tr-TR', {month: 'numeric', year: 'numeric'}) : ''}</span>
                            </div>
                          </div>
                          
                          <div className="pro-chart-canvas" style={{ height: '150px' }}>
                            {/* Y ekseni değerleri */}
                            <div className="pro-chart-y-axis">
                              <span className="pro-chart-y-label">{adjustedMax.toFixed(1)} kg</span>
                              <span className="pro-chart-y-label">{((adjustedMax + adjustedMin) / 2).toFixed(1)} kg</span>
                              <span className="pro-chart-y-label">{adjustedMin.toFixed(1)} kg</span>
                            </div>
                            
                            <svg className="pro-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                              {/* Gradient tanımı */}
                              <defs>
                                <linearGradient id="pro-chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#ff3366" stopOpacity="0.7" />
                                  <stop offset="100%" stopColor="#ff3366" stopOpacity="0.1" />
                                </linearGradient>
                              </defs>
                              
                              {/* Izgara çizgileri */}
                              <line x1="0" y1="0" x2="100" y2="0" className="pro-chart-grid-line" />
                              <line x1="0" y1="33.33" x2="100" y2="33.33" className="pro-chart-grid-line" />
                              <line x1="0" y1="66.66" x2="100" y2="66.66" className="pro-chart-grid-line" />
                              <line x1="0" y1="100" x2="100" y2="100" className="pro-chart-grid-line" />
                              
                              {/* Dikey çizgiler */}
                              {xLabelIndices.map(idx => (
                                <line 
                                  key={`grid-${idx}`}
                                  x1={points[idx].x} 
                                  y1="0" 
                                  x2={points[idx].x} 
                                  y2="100" 
                                  className="pro-chart-grid-line" 
                                />
                              ))}
                              
                              {/* Alan dolgusu */}
                              <path d={areaPath} className="pro-chart-area" />
                              
                              {/* Çizgi */}
                              <path d={linePath} className="pro-chart-line" />
                              
                              {/* Veri noktaları */}
                              {points.map((point, i) => (
                                <circle 
                                  key={i}
                                  cx={point.x} 
                                  cy={point.y} 
                                  className="pro-chart-dot"
                                  data-weight={point.log.weight}
                                  data-date={point.date}
                                  onMouseOver={(e) => {
                                    const tooltip = document.querySelector('.pro-chart-tooltip');
                                    if (!tooltip) return;
                                    
                                    tooltip.style.opacity = 1;
                                    tooltip.style.left = `${e.target.cx.baseVal.value}%`;
                                    tooltip.style.top = `${e.target.cy.baseVal.value}%`;
                                    
                                    const valueElem = tooltip.querySelector('.pro-chart-tooltip-value');
                                    const dateElem = tooltip.querySelector('.pro-chart-tooltip-date');
                                    
                                    if (valueElem) valueElem.textContent = `${point.log.weight} kg`;
                                    if (dateElem) dateElem.textContent = point.date;
                                  }}
                                  onMouseOut={() => {
                                    const tooltip = document.querySelector('.pro-chart-tooltip');
                                    if (tooltip) tooltip.style.opacity = 0;
                                  }}
                                />
                              ))}
                            </svg>
                            
                            {/* X ekseni değerleri */}
                            <div className="pro-chart-x-axis">
                              {xLabelIndices.map(idx => (
                                <span 
                                  key={`label-${idx}`} 
                                  className="pro-chart-x-label"
                                  style={{ left: `${points[idx].x}%` }}
                                >
                                  {dateLabels[idx]}
                                </span>
                              ))}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="pro-chart-tooltip" ref={tooltipRef} style={{ zIndex: 5 }}>
                              <div className="pro-chart-tooltip-value"></div>
                              <div className="pro-chart-tooltip-date"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-4">Henüz kilo kaydı bulunmuyor.</p>
          )}
        </div>
        
        <div className="card mt-6">
          <h3 className="text-xl font-bold mb-4">Yeni Kilo Ekle</h3>
          <form onSubmit={handleAddWeight} className="mt-4">
            <div className="form-group">
              <label htmlFor="new-weight" className="form-label">Kilonuz (kg)</label>
              <div className="flex">
                <input
                  type="number"
                  id="new-weight"
                  className="form-input"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Örn: 70.5"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                />
                <button 
                  type="submit" 
                  className="btn ml-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ekleniyor...
                    </span>
                  ) : "Ekle"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderExerciseTab = () => (
    <div className="card">
      <h3>Egzersiz Planım</h3>
      {userData.exercisePlan && userData.exercisePlan.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {userData.exercisePlan.map((exercise, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{exercise.name}</h4>
                <input
                  type="checkbox"
                  checked={exercise.completed}
                  onChange={() => handleToggleExercise(exercise)}
                  className="h-5 w-5 text-diet-green"
                />
              </div>
              <p className="text-gray-600 mt-2">{exercise.description}</p>
              <div className="mt-2 text-sm">
                <span className="inline-block bg-diet-light-green text-diet-green-dark px-2 py-1 rounded mr-2">
                  {exercise.duration} dakika
                </span>
                <span className="inline-block bg-diet-light-blue text-diet-blue-dark px-2 py-1 rounded">
                  {exercise.caloriesBurned} kalori
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4">Henüz egzersiz planı oluşturulmadı.</p>
      )}
    </div>
  );

  const renderDietTab = () => (
    <div className="card">
      <h3>Beslenme Planım</h3>
      {userData.dietPlan && Object.keys(userData.dietPlan).length > 0 ? (
        <div className="mt-4">
          {Object.entries(userData.dietPlan).map(([day, meals]) => (
            <div key={day} className="mb-6">
              <h4 className="font-semibold mb-2">{day}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meals.map((meal, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">{meal.name}</h5>
                      <input
                        type="checkbox"
                        checked={meal.completed}
                        onChange={() => handleToggleMeal(day, meal)}
                        className="h-5 w-5 text-diet-green"
                      />
                    </div>
                    <p className="text-gray-600 mt-2">{meal.description}</p>
                    <div className="mt-2 text-sm flex flex-wrap gap-1">
                      <span className="inline-block bg-diet-light-green text-diet-green-dark px-2 py-1 rounded">
                        {meal.calories} kalori
                      </span>
                      <span className="inline-block bg-diet-light-blue text-diet-blue-dark px-2 py-1 rounded">
                        {meal.protein}g protein
                      </span>
                      <span className="inline-block bg-diet-light-yellow text-diet-yellow-dark px-2 py-1 rounded">
                        {meal.carbs}g karbonhidrat
                      </span>
                      <span className="inline-block bg-diet-light-red text-diet-red-dark px-2 py-1 rounded">
                        {meal.fat}g yağ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4">Henüz beslenme planı oluşturulmadı.</p>
      )}
    </div>
  );

  // Sağlık sekmesi render fonksiyonu
  const renderHealthTab = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Sağlık Bilgilerim</h3>
        {!healthInfoEditing && (
          <button onClick={() => setHealthInfoEditing(true)} className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Düzenle
          </button>
        )}
      </div>
      
      {healthInfoEditing ? (
        <form onSubmit={handleSaveHealthInfo} className="mt-4">
          <div className="form-group">
            <label htmlFor="diseases" className="form-label">Kronik Hastalıklar / Sağlık Durumu</label>
            <textarea
              id="diseases"
              className="form-input"
              value={diseases}
              onChange={(e) => setDiseases(e.target.value)}
              placeholder="Diyabet, hipertansiyon, vb."
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="medications" className="form-label">Düzenli Kullandığınız İlaçlar</label>
            <textarea
              id="medications"
              className="form-input"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="İlaç isimleri ve dozaj bilgileri"
              rows="3"
            ></textarea>
          </div>
          
          <div className="flex gap-2">
            <button type="submit" className="btn">Kaydet</button>
            <button type="button" onClick={() => setHealthInfoEditing(false)} className="btn btn-outline">
              İptal
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Kronik Hastalıklar / Sağlık Durumu</h4>
            <p>{diseases || 'Belirtilmemiş'}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Düzenli Kullandığınız İlaçlar</h4>
            <p>{medications || 'Belirtilmemiş'}</p>
          </div>
        </div>
      )}
    </div>
  );

  // Notlar sekmesi render fonksiyonu
  const renderNotesTab = () => (
    <div>
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Notlarım</h3>
        {userData.notes && userData.notes.length > 0 ? (
          <div className="flex flex-col space-y-2 mt-4">
            {userData.notes.map((note, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded hover:shadow-sm transition-shadow">
                <input
                  type="checkbox"
                  checked={note.completed}
                  onChange={() => handleToggleNote(note)}
                  className="h-5 w-5 text-diet-green mt-1"
                />
                <div className={`flex-grow ${note.completed ? 'line-through text-gray-400' : ''}`}>
                  <p>{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.date ? `${new Date(note.date).toLocaleDateString('tr-TR')} - ${new Date(note.date).toLocaleTimeString('tr-TR')}` : 'Tarih bilgisi yok'}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteNote(note)} 
                  className="text-diet-red hover:text-diet-red-dark transition-colors"
                  title="Notu sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4">Henüz notunuz bulunmuyor.</p>
        )}
      </div>
      
      <div className="card mt-6">
        <h3 className="text-xl font-bold mb-4">Yeni Not Ekle</h3>
        <form onSubmit={handleAddNote} className="mt-4">
          <div className="form-group">
            <label htmlFor="note" className="form-label">Notunuz</label>
            <div className="flex">
              <input
                type="text"
                id="note"
                className="form-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Notunuzu buraya yazın..."
                required
              />
              <button type="submit" className="btn ml-2">Ekle</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Hedefler sekmesi için render fonksiyonu güncellendi
  const [userGoals, setUserGoals] = useState([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalPeriod, setNewGoalPeriod] = useState('günlük');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState('');
  const [newGoalEndDate, setNewGoalEndDate] = useState('');

  const handleAddGoal = async (e) => {
    e.preventDefault();
    
    if (!newGoalText.trim()) return;
    
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // Yeni hedef objesi oluştur
      const newGoal = {
        id: Date.now().toString(),
        text: newGoalText,
        period: newGoalPeriod,
        target: newGoalTarget,
        startDate: newGoalStartDate || new Date().toISOString().split('T')[0],
        endDate: newGoalEndDate,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      // İyimser UI güncellemesi
      const updatedGoals = [...(userData.goals || []), newGoal];
      const optimisticUserData = { ...userData, goals: updatedGoals };
      
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      // Form alanlarını temizle
      setNewGoalText('');
      setNewGoalPeriod('günlük');
      setNewGoalTarget('');
      setNewGoalStartDate('');
      setNewGoalEndDate('');
      
      // API çağrısı
      try {
        const response = await axios.post(
          'http://localhost:5000/api/profile/update',
          {
            type: 'goal',
            goal: newGoal
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Hedef ekleme yanıtı:", response.data);
        
        // Başarı mesajı göster
        setSuccessMessage('Hedef başarıyla eklendi.');
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        
        // Güncel verileri al
        fetchUserData();
      } catch (apiError) {
        console.error("API hatası:", apiError);
        // Yine de UI'da göster, veri kaybı olmasın
      }
    } catch (error) {
      console.error('Hedef eklenirken hata:', error);
      setError('Hedef eklenemedi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    // Onay iste
    if (!window.confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const filteredGoals = userData.goals.filter(g => g.id !== goalId);
      const optimisticUserData = { ...userData, goals: filteredGoals };
      
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      // API çağrısı
      try {
        const response = await axios.post(
          'http://localhost:5000/api/profile/delete-goal',
          { goalId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Hedef silme yanıtı:", response.data);
        
        // Başarı mesajı göster
        setSuccessMessage('Hedef başarıyla silindi.');
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } catch (apiError) {
        console.error("API hatası:", apiError);
        // Yine de UI'da göster, veri kaybı olmasın
      }
    } catch (error) {
      console.error('Hedef silinirken hata:', error);
      setError('Hedef silinemedi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGoal = async (goal) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.');
      }
      
      // İyimser UI güncellemesi
      const updatedGoals = userData.goals.map(g => {
        if (g.id === goal.id) {
          return { ...g, completed: !g.completed };
        }
        return g;
      });
      
      const optimisticUserData = { ...userData, goals: updatedGoals };
      setUserData(optimisticUserData);
      localStorage.setItem('userData', JSON.stringify(optimisticUserData));
      
      // API çağrısı
      try {
        await axios.post(
          'http://localhost:5000/api/profile/mark-complete',
          {
            type: 'goal',
            goal,
            completed: !goal.completed
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (apiError) {
        console.error("API hatası:", apiError);
        // Yine de UI'da göster, veri kaybı olmasın
      }
    } catch (error) {
      console.error('Hedef durumu güncellenirken hata:', error);
      setError('Hedef durumu güncellenemedi: ' + error.message);
    }
  };

  // Hedefler sekmesi için render fonksiyonu güncellendi
  const renderGoalsTab = () => (
    <div>
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Ana Hedefim</h3>
        
        {userData && userData.goal ? (
          <div className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-semibold text-green-700 mb-2">Genel Hedef</h4>
                <p className="text-lg">{goal === 'kilo_verme' 
                    ? 'Kilo Vermek 🔽' 
                    : goal === 'kilo_alma' 
                    ? 'Kilo Almak 🔼' 
                    : goal === 'kilo_koruma' 
                    ? 'Kilo Korumak ⚖️' 
                    : goal === 'kas_kazanma' 
                    ? 'Kas Kazanmak 💪' 
                    : 'Sağlıklı Beslenme 🥗'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700 mb-2">Henüz ana hedef belirlenmemiş.</p>
            <button 
              onClick={() => setActiveTab('kisisel')} 
              className="text-blue-600 underline hover:text-blue-800"
            >
              Kişisel bilgiler kısmından ana hedef ekleyebilirsiniz
            </button>
          </div>
        )}
      </div>
      
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Özel Hedeflerim</h3>
          <button 
            onClick={() => document.getElementById('yeni-hedef-form').scrollIntoView({behavior: 'smooth'})}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Hedef Ekle
          </button>
        </div>
        
        {userData && userData.goals && userData.goals.length > 0 ? (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.goals.map((goal, index) => (
                <div key={index} className={`border rounded-lg p-4 shadow-sm transition-all duration-300 ${goal.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:shadow-md'}`}>
                  <div className="flex items-start gap-3">
                    <div>
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => handleToggleGoal(goal)}
                        className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500 mt-1"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold text-lg ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {goal.text}
                        </h4>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          goal.period === 'günlük' 
                            ? 'bg-blue-100 text-blue-700' 
                            : goal.period === 'haftalık' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {goal.period}
                        </span>
                      </div>
                      
                      {goal.target && (
                        <div className="mt-2 flex items-center">
                          <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                            Hedef: {goal.target}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex text-xs text-gray-500 mt-3 space-x-4">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Başlangıç: {new Date(goal.startDate).toLocaleDateString('tr-TR')}
                        </div>
                        {goal.endDate && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Bitiş: {new Date(goal.endDate).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      
                      {/* Hedef durumu göstergesi */}
                      {goal.completed ? (
                        <div className="mt-3 text-green-600 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Tamamlandı
                        </div>
                      ) : (
                        <div className="mt-3 text-blue-600 text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Devam ediyor
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                      title="Hedefi sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-700 mb-4 text-lg">Henüz özel hedef eklenmemiş.</p>
            <p className="text-gray-600">Sağlıklı yaşam için özel hedefler belirleyin ve takip edin!</p>
          </div>
        )}
      </div>
      
      <div id="yeni-hedef-form" className="card mt-6 border-t-4 border-blue-500">
        <h3 className="text-xl font-bold mb-4">Yeni Hedef Ekle</h3>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-700 font-medium">Nasıl Hedef Eklerim?</p>
              <p className="text-sm text-gray-600 mt-1">
                Hedef açıklaması, periyot ve tarih bilgilerini doldurarak kişisel hedeflerinizi ekleyebilirsiniz. 
                Örneğin: "10 kilo vermek", "Haftada 3 gün 5 km yürüyüş yapmak" gibi.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleAddGoal} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label htmlFor="goal-text" className="form-label font-medium text-gray-700">Hedef Açıklaması</label>
              <input
                type="text"
                id="goal-text"
                className="form-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Örn: 10 kilo vermek, Her gün 30 dakika yürüyüş yapmak..."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="goal-period" className="form-label font-medium text-gray-700">Hedef Periyodu</label>
              <select
                id="goal-period"
                className="form-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={newGoalPeriod}
                onChange={(e) => setNewGoalPeriod(e.target.value)}
              >
                <option value="günlük">Günlük</option>
                <option value="haftalık">Haftalık</option>
                <option value="aylık">Aylık</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="goal-target" className="form-label font-medium text-gray-700">Hedef Değer (Opsiyonel)</label>
              <input
                type="text"
                id="goal-target"
                className="form-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="Örn: 5 kg, 10.000 adım, vs."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="goal-start" className="form-label font-medium text-gray-700">Başlangıç Tarihi</label>
              <input
                type="date"
                id="goal-start"
                className="form-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={newGoalStartDate}
                onChange={(e) => setNewGoalStartDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Boş bırakırsanız bugün kullanılır</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="goal-end" className="form-label font-medium text-gray-700">Bitiş Tarihi (Opsiyonel)</label>
              <input
                type="date"
                id="goal-end"
                className="form-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                value={newGoalEndDate}
                onChange={(e) => setNewGoalEndDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Örn: "2 ay sonra 10 kg verme" hedefi için</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg flex items-center font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ekleniyor...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Hedefi Ekle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Return kısmını düzenle, tüm tabları aktifleştir
  return (
    <div className="container py-6" style={{ marginTop: '70px' }}>
      {renderTabs()}
      
      {showSuccessMessage && (
        <div className="success-message">
          <div className="success-content">
            <p>{successMessage}</p>
            <button 
              onClick={() => setShowSuccessMessage(false)}
              className="success-close"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <div className="error-content">
            <p>{error}</p>
            <button 
              onClick={() => setError('')}
              className="error-close"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
                 style={{borderColor: 'var(--primary-color) transparent transparent transparent'}}></div>
            <p>Profil bilgileri yükleniyor...</p>
          </div>
        </div>
      ) : error && !loading ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-auto max-w-md mt-10">
          {error}
        </div>
      ) : !userData ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-auto max-w-md mt-10">
          Kullanıcı verileri bulunamadı.
        </div>
      ) : (
        <div>
          {activeTab === 'kisisel' && renderProfileTab()}
          {activeTab === 'kilo' && renderWeightTab()}
          {activeTab === 'hedef' && renderGoalsTab()}
          {activeTab === 'saglik' && renderHealthTab()}
          {activeTab === 'notlar' && renderNotesTab()}
        </div>
      )}
    </div>
  );
};

export default Profile; 