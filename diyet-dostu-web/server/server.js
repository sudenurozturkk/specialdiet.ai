const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// JWT Secret - .env olmadığında kullanılacak
const JWT_SECRET = process.env.JWT_SECRET || 'diyet_dostu_gizli_anahtar_2025';

// Express app oluştur
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS ayarları - Ön uçtan gelen isteklere izin ver
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// JSON desteği
app.use(express.json());

// Yüklenen görüntüler için klasör
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

// Klasörlerin varlığını kontrol et ve oluştur
async function ensureDirectoriesExist() {
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Görüntü yükleme yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Sadece görüntü dosyaları (.jpg, .jpeg, .png, .gif) yüklenebilir!"));
  }
});

// API anahtarı kontrol fonksiyonu
function isValidApiKey(key) {
  if (!key || key.trim() === '' || key === 'AIzaSyAjAVIwrjcxv32csCDNqNDzr9D-wvnRRMM') {
    return false;
  }
  return true;
}

// Gemini API anahtarını .env dosyasından al - hem GEMINI_API_KEY hem de GOOGLE_API_KEY'i destekle
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiApiKey) {
  console.error('UYARI: API anahtarı bulunamadı! GEMINI_API_KEY veya GOOGLE_API_KEY ekleyin.');
  console.error('Uygulama test modunda çalışacak, yapay zeka yanıtları simüle edilecek.');
}

// Gemini AI örneği oluştur
const genAI = new GoogleGenerativeAI(geminiApiKey || 'AIzaSyDummy123456789DummyKeyForFallback');

// Kullanıcı verileri dosya yolu
const userDataPath = path.join(dataDir, 'userData.json');

// Kullanıcı verilerini oku
async function readUserData() {
  try {
    console.log('userData.json okunuyor...');
    console.log('userData.json yolu:', userDataPath);
    
    try {
      await fs.access(userDataPath);
    } catch (error) {
      console.log('userData.json bulunamadı, yeni dosya oluşturuluyor');
      const emptyData = { users: [] };
      await fs.writeFile(userDataPath, JSON.stringify(emptyData, null, 2), 'utf8');
      return emptyData;
    }
    
    const data = await fs.readFile(userDataPath, 'utf8');
    console.log('userData.json başarıyla okundu');
    return JSON.parse(data);
  } catch (error) {
    console.error('userData.json okuma hatası:', error);
    // Dosya yoksa veya hatalıysa boş bir veri yapısı oluştur
    const emptyData = { users: [] };
    try {
      await fs.writeFile(userDataPath, JSON.stringify(emptyData, null, 2), 'utf8');
    } catch (writeError) {
      console.error('Yeni userData.json oluşturma hatası:', writeError);
    }
    return emptyData;
  }
}

// Kullanıcı verilerini yaz
async function writeUserData(data) {
  try {
    console.log('userData.json yazılıyor...');
    await fs.writeFile(userDataPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('userData.json başarıyla yazıldı');
  } catch (error) {
    console.error('userData.json yazma hatası:', error);
    throw error;
  }
}

// Mevcut notlara benzersiz ID'ler ekleyen yardımcı fonksiyon
const ensureNoteIds = async () => {
  try {
    console.log('Mevcut notlara benzersiz ID ekleme işlemi başlatılıyor...');
    const userData = await readUserData();
    let updateRequired = false;
    
    // Tüm kullanıcıların notlarını kontrol et
    userData.users.forEach((user, userIndex) => {
      if (user.notes && Array.isArray(user.notes)) {
        user.notes.forEach((note, noteIndex) => {
          // Notta ID yoksa, benzersiz bir ID ata
          if (!note.id) {
            userData.users[userIndex].notes[noteIndex].id = `${Date.now()}-${userIndex}-${noteIndex}`;
            updateRequired = true;
            console.log(`Kullanıcı ${userIndex} için not ${noteIndex}'e ID eklendi:`, userData.users[userIndex].notes[noteIndex].id);
          }
        });
      }
    });
    
    // Eğer herhangi bir not güncellendiyse, verileri kaydet
    if (updateRequired) {
      await writeUserData(userData);
      console.log('Tüm notlara ID ekleme işlemi tamamlandı ve veriler kaydedildi.');
    } else {
      console.log('Tüm notlarda zaten ID mevcut, herhangi bir güncelleme gerekmedi.');
    }
  } catch (error) {
    console.error('Not ID atama hatası:', error);
  }
};

// Sunucu başlatıldığında, mevcut notlara ID atama
ensureNoteIds().then(() => {
  console.log('Sunucu başlangıç kontrolü: not ID atama işlemi tamamlandı.');
}).catch(error => {
  console.error('Sunucu başlangıç kontrolü sırasında hata:', error);
});

// JWT token kontrolü (middleware)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Oturum açmanız gerekiyor' });
  }
  
  // Test token'ı kontrolü - eğer test_token ile başlıyorsa direkt geçir
  if (token.startsWith('test_token_')) {
    console.log('Test token tespit edildi, yetkilendirme atlanıyor');
    req.user = { 
      userId: '1746606015392',
      email: 'whodenur@gmail.com'
    };
    return next();
  }
  
  // Normal token doğrulama
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token doğrulama hatası:', err.message);
      return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }
    
    req.user = user;
    next();
  });
}

// Socket.io kullanıcı bağlantıları
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı');
  
  socket.on('join', (data) => {
    const { userId } = data;
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`Kullanıcı ${userId} bağlandı`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı');
    // Kullanıcı socket eşleşmesini kaldır
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// =============== API ROUTES ===============

// Kayıt olma
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, info } = req.body;
    
    // Veri doğrulama
    if (!email || !password || !info) {
      return res.status(400).json({ message: 'E-posta, parola ve kişisel bilgiler gereklidir' });
    }
    
    const userData = await readUserData();
    
    // E-posta kullanımda mı kontrol et
    const existingUser = userData.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda' });
    }
    
    // Parolayı hashleme
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Yeni kullanıcı oluştur
    const userId = Date.now().toString();
    const currentDate = new Date().toISOString();
    
    const newUser = {
      userId,
      email,
      password: hashedPassword,
      info,
      weightHistory: [{ date: currentDate, weight: info.weight }],
      dietPlan: {},
      exercisePlan: {},
      notes: [],
      chats: {}
    };
    
    // Kullanıcıyı JSON dosyasına ekle
    userData.users.push(newUser);
    await writeUserData(userData);
    
    // JWT token oluştur
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'Kayıt başarılı',
      token,
      userId
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Giriş yapma
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login isteği alındı:', req.body);
    const { email, password } = req.body;
    
    // Veri doğrulama
    if (!email || !password) {
      console.log('Email veya şifre eksik:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'E-posta ve parola gereklidir' });
    }
    
    const userData = await readUserData();
    console.log('Kullanıcı sayısı:', userData.users.length);
    
    // Kullanıcıyı e-posta ile bul
    const user = userData.users.find(u => u.email === email);
    if (!user) {
      console.log('Kullanıcı bulunamadı:', email);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    console.log('Kullanıcı bulundu, parola kontrol ediliyor');
    
    // Parolayı kontrol et
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      console.log('Geçersiz parola');
      return res.status(401).json({ message: 'Geçersiz parola' });
    }
    
    console.log('Parola doğru, token oluşturuluyor');
    
    // JWT token oluştur
    const token = jwt.sign({ userId: user.userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Login başarılı, token:', token.substring(0, 20) + '...');
    
    res.status(200).json({ 
      message: 'Giriş başarılı',
      token,
      userId: user.userId
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Sohbet listesini getir
app.get('/api/chat-list', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const userData = await readUserData();
    const user = userData.users.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının chats özelliği yoksa oluştur
    if (!user.chats) {
      user.chats = {};
      
      // Eski chatHistory'yi taşı (varsa)
      if (user.chatHistory && user.chatHistory.length > 0) {
        const defaultChatId = `chat_${Date.now()}`;
        user.chats[defaultChatId] = {
          id: defaultChatId,
          title: 'Önceki Sohbet',
          messages: user.chatHistory,
          createdAt: new Date().toISOString()
        };
      }
      
      // Değişiklikleri kaydet
      await writeUserData(userData);
    }
    
    // Sohbetleri dizi olarak dönüştür ve sırala (en yeni en üstte)
    const chatList = Object.values(user.chats || {})
      .map(chat => ({
        id: chat.id,
        title: chat.title || 'İsimsiz Sohbet',
        lastMessage: chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1].content.substring(0, 30) + '...' 
          : '',
        createdAt: chat.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json(chatList);
  } catch (error) {
    console.error('Sohbet listesi alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Yeni sohbet oluştur
app.post('/api/create-chat', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının chats özelliği yoksa oluştur
    if (!userData.users[userIndex].chats) {
      userData.users[userIndex].chats = {};
    }
    
    // Benzersiz bir ID oluştur
    const chatId = `chat_${Date.now()}`;
    
    // Hoş geldin mesajı
    const welcomeMessage = {
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

Sormak istediğin bir şey var mı? Birlikte sağlıklı bir yaşam yolculuğuna başlayalım! 💪`,
      timestamp: new Date().toISOString()
    };
    
    // Yeni sohbet oluştur
    userData.users[userIndex].chats[chatId] = {
      id: chatId,
      title: 'Yeni Sohbet',
      messages: [welcomeMessage],
      createdAt: new Date().toISOString()
    };
    
    await writeUserData(userData);
    
    res.status(201).json({ 
      id: chatId,
      title: 'Yeni Sohbet',
      messages: [welcomeMessage]
    });
  } catch (error) {
    console.error('Yeni sohbet oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Belirli bir sohbetin geçmişini getir
app.get('/api/chat-history/:chatId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { chatId } = req.params;
    
    const userData = await readUserData();
    const user = userData.users.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının chats özelliği yoksa oluştur
    if (!user.chats) {
      user.chats = {};
      await writeUserData(userData);
    }
    
    // Belirtilen sohbet var mı kontrol et
    if (!user.chats[chatId]) {
      return res.status(404).json({ message: 'Sohbet bulunamadı' });
    }
    
    // Sohbet mesajlarını getir
    const chatHistory = user.chats[chatId].messages || [];
    
    res.status(200).json({ chatHistory });
  } catch (error) {
    console.error('Sohbet geçmişi alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Belirli bir sohbeti sil
app.delete('/api/delete-chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { chatId } = req.params;
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının chats özelliği yoksa hata ver
    if (!userData.users[userIndex].chats) {
      return res.status(404).json({ success: false, message: 'Sohbet listesi bulunamadı' });
    }
    
    // Belirtilen sohbet var mı kontrol et
    if (!userData.users[userIndex].chats[chatId]) {
      return res.status(404).json({ success: false, message: 'Sohbet bulunamadı' });
    }
    
    // Sohbeti sil
    delete userData.users[userIndex].chats[chatId];
    
    await writeUserData(userData);
    
    res.status(200).json({ success: true, message: 'Sohbet başarıyla silindi' });
  } catch (error) {
    console.error('Sohbet silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sohbet silinirken bir hata oluştu' });
  }
});

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { message, chatId, assistantMode = 'general' } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Mesaj metni gereklidir' });
    }
    
    console.log(`Kullanıcıdan mesaj alındı: ${message}`);
    console.log(`Asistan modu: ${assistantMode}`);
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Sohbeti kontrol et ve gerekirse yeni bir sohbet oluştur
    if (!userData.users[userIndex].chats) {
      userData.users[userIndex].chats = {};
    }
    
    if (!userData.users[userIndex].chats[chatId]) {
      userData.users[userIndex].chats[chatId] = {
        title: 'Yeni Sohbet',
        createdAt: new Date().toISOString(),
        messages: []
      };
    }
    
    // Mesajı sohbet geçmişine ekle
    userData.users[userIndex].chats[chatId].messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Eğer başlık 'Yeni Sohbet' ise, başlık olarak mesajın ilk 30 karakterini kullan
    if (userData.users[userIndex].chats[chatId].title === 'Yeni Sohbet' && message.length > 0) {
      const titleText = message.length > 30 ? message.substring(0, 30) + '...' : message;
      userData.users[userIndex].chats[chatId].title = titleText;
    }
    
    await writeUserData(userData);
    
    try {
      // Asistan moduna göre prompt hazırlama
      let systemPrompt = '';
      let modelTemperature = 0.7; // Varsayılan sıcaklık değeri
      
      // Kullanıcı bilgilerine erişim
      const userInfo = userData.users[userIndex].info || {};
      const { height, weight, age, gender, goal } = userInfo;
      const diseases = userInfo.diseases || [];
      const medications = userInfo.medications || [];
      
      // Temel bilgi
      let userContext = '';
      if (height && weight && age) {
        userContext = `Kullanıcı hakkında bilgi: ${age} yaşında, ${height}cm boyunda, ${weight}kg ağırlığında`;
        if (gender) {
          userContext += `, ${gender === 'male' ? 'erkek' : 'kadın'}`;
        }
        
        if (goal) {
          userContext += `\nHedef: ${goal}`;
        }
      }
      
      // Sağlık durumu
      if (diseases && diseases.length > 0) {
        userContext += `\nSağlık durumu: ${diseases.join(', ')}`;
      }
      
      if (medications && medications.length > 0) {
        userContext += `\nKullandığı ilaçlar: ${medications.join(', ')}`;
      }
      
      // Kullanıcının hedef bilgisi
      const userGoal = goal || '';
      
      // Son 10 mesajı modelin bağlamı için alın
      const chatHistory = userData.users[userIndex].chats[chatId].messages
        .slice(-10) // Son 10 mesaj
        .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`)
        .join('\n\n');
      
      // Asistan moduna göre özel prompt ve sıcaklık ayarları
      switch (assistantMode) {
        case 'dietician':
          systemPrompt = `Sen bir profesyonel diyetisyensin. Beslenme danışmanlığı, kilo yönetimi ve sağlıklı beslenme konularında uzman tavsiyeler veriyorsun. 
          
${userContext ? `${userContext}\n\n` : ''}

Aşağıdaki ilkeleri takip et:
1. Bilimsel olarak doğrulanmış beslenme bilgileri sun
2. Kişiye özel ve uygulanabilir tavsiyeler ver
3. Yemeklerin besin değerleri ve kalorileri hakkında doğru bilgi ver
4. Sağlıksız kilo verme yöntemlerini önerme
5. Konuşmalarında nazik, motive edici ve bilgilendirici ol
6. Hastalık veya özel durumlara (diyabet, hamilelik, vb.) uygun öneriler sun
7. Kullanıcının hedeflerine uygun beslenme planları oluştur
8. Beslenme mitleri ile ilgili yanlış bilgileri düzelt

${userGoal ? `Kullanıcının hedefi: ${userGoal}. Bu hedefe uygun tavsiyeler ver.\n\n` : ''}
Sohbet geçmişi:
${chatHistory}`;
          modelTemperature = 0.5; // Daha kesin ve bilimsel yanıtlar için düşük sıcaklık
          break;
          
        case 'fitness':
          systemPrompt = `Sen bir profesyonel fitness antrenörüsün. Egzersiz programları, doğru teknikler ve fiziksel aktivite konularında uzman tavsiyeler veriyorsun.
          
${userContext ? `${userContext}\n\n` : ''}

Aşağıdaki ilkeleri takip et:
1. Bilimsel ve güncel fitness bilgileri sun
2. Kişinin durumuna özel ve güvenli egzersiz tavsiyeleri ver
3. Doğru egzersiz teknikleri ve form hakkında bilgi ver
4. Farklı fitness hedefleri (kas kazanımı, kilo verme, esneklik) için uygun programlar öner
5. Kullanıcının sakatlık veya sınırlamalarını göz önünde bulundur
6. Motivasyon ve tutarlılık için pratik öneriler sun
7. Günlük aktivite, adım sayısı ve kardiyovasküler sağlık hakkında bilgiler ver
8. Ev egzersizleri, spor salonu programları veya açık hava aktiviteleri hakkında öneriler sun

${userGoal ? `Kullanıcının hedefi: ${userGoal}. Bu hedefe uygun egzersiz tavsiyeleri ver.\n\n` : ''}
Sohbet geçmişi:
${chatHistory}`;
          modelTemperature = 0.6; // Kişiselleştirilmiş ve yaratıcı egzersiz önerileri için orta sıcaklık
          break;
          
        case 'chef':
          systemPrompt = `Sen bir profesyonel şefsin. Sağlıklı, lezzetli ve besleyici yemek tarifleri hazırlama konusunda uzmansın.
          
${userContext ? `${userContext}\n\n` : ''}

Aşağıdaki ilkeleri takip et:
1. Sağlıklı ve dengeli beslenmeyi destekleyen tarifler sun
2. Kullanıcının hedeflerine uygun (kilo verme, kas kazanımı, vb.) tarifler öner
3. Tariflerinde besin değerleri, kalori ve porsiyonlar hakkında bilgi ver
4. Çeşitli mutfaklardan (Akdeniz, Asya, vb.) sağlıklı seçenekler sun
5. Alerjiler, diyetler (vejetaryen, vegan, glutensiz, vb.) veya sağlık durumlarına uygun tarifler önerebildiğinden bahset
6. Kolay bulunabilir malzemelerle hazırlanabilecek pratik tarifler öner
7. Yemek hazırlama, pişirme teknikleri ve püf noktaları hakkında bilgi ver
8. Yemeklerin daha sağlıklı alternatiflerini nasıl hazırlayabileceğini anlat

${userGoal ? `Kullanıcının hedefi: ${userGoal}. Bu hedefe uygun tarifler öner.\n\n` : ''}
Sohbet geçmişi:
${chatHistory}`;
          modelTemperature = 0.8; // Yaratıcı ve çeşitli tarifler için yüksek sıcaklık
          break;
          
        default: // 'general' modu
          systemPrompt = `Sen Diyet Dostu adlı, sağlıklı yaşam ve beslenme konusunda yardımcı olan bir yapay zeka asistanısın.
          
${userContext ? `${userContext}\n\n` : ''}

Aşağıdaki ilkeleri takip et:
1. Beslenme, fitness ve genel sağlık konularında bilimsel ve doğru bilgiler sun
2. Kullanıcıya kibar, dostça ve yardımcı bir şekilde yanıt ver
3. Sağlıklı yaşam tarzı, diyet ve fiziksel aktivite hakkında bütüncül tavsiyeler ver
4. Sağlık durumları, ilaçlar veya özel ihtiyaçlara duyarlı ol
5. Ciddi sağlık sorunları için doktor görüşü almayı öner
6. Bilmediğin konular hakkında yanlış bilgi verme
7. Kullanıcının sorularına kapsamlı yanıtlar vermeye çalış
8. Cevaplarında Türkçe dilini kullan ve profesyonel bir ton koru

${userGoal ? `Kullanıcının hedefi: ${userGoal}. Bu hedefe uygun genel tavsiyeler ver.\n\n` : ''}
Sohbet geçmişi:
${chatHistory}`;
          modelTemperature = 0.7; // Genel amaçlı konuşmalar için dengeli sıcaklık
          break;
      }
      
      // API Key'i kontrol et
      const apiKey = req.headers['api-key'] || process.env.GEMINI_API_KEY;
      
      if (!apiKey || !isValidApiKey(apiKey)) {
        console.error('Geçersiz API Key');
        
        const errorResponse = "API anahtarı eksik veya geçersiz. Lütfen geçerli bir Google Gemini API anahtarı girin.";
        
        // Hata mesajını kullanıcı verilerine kaydet
        userData.users[userIndex].chats[chatId].messages.push({
          role: 'assistant',
          content: errorResponse,
          timestamp: new Date().toISOString()
        });
        
        await writeUserData(userData);
        
        // Socket.io ile yanıtı gönder (varsa)
        const socketId = userSockets.get(userId);
        if (socketId) {
          io.to(socketId).emit('message', {
            chatId,
            message: {
              role: 'assistant',
              content: errorResponse,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        return res.status(200).json({ response: errorResponse });
      }
      
      // Gemini API için yapılandırma
      console.log('Gemini API yapılandırılıyor...');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Modeli seç ve yapılandır
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: modelTemperature,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      console.log('Gemini API ile istek gönderiliyor...');
      console.log('Sistem promptu:', systemPrompt);
      
      // Gemini API'ye istek gönder
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\nKullanıcı: " + message }],
          }
        ],
      });
      
      const response = result.response;
      const generatedText = response.text();
      
      console.log('Gemini yanıtı alındı:', generatedText);
      
      // Yanıtı kullanıcı verilerine kaydet
      userData.users[userIndex].chats[chatId].messages.push({
        role: 'assistant',
        content: generatedText,
        timestamp: new Date().toISOString(),
        assistantMode: assistantMode // Hangi modda yanıt verildiğini kaydet
      });
      
      await writeUserData(userData);
      
      // Socket.io ile yanıtı gönder (varsa)
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit('message', {
          chatId,
          message: {
            role: 'assistant',
            content: generatedText,
            timestamp: new Date().toISOString(),
            assistantMode: assistantMode
          }
        });
      }
      
      res.status(200).json({ response: generatedText });
      
    } catch (modelError) {
      console.error('Model başlatma hatası:', modelError);
      
      // Genel model hatası durumunda basit yanıt
      const fallbackResponse = "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.";
      
      // Fallback yanıtını kaydet
      userData.users[userIndex].chats[chatId].messages.push({
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date().toISOString()
      });
      
      await writeUserData(userData);
      
      // Socket.io ile yanıtı gönder (varsa)
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit('message', {
          chatId,
          message: {
            role: 'assistant',
            content: fallbackResponse,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(200).json({ response: fallbackResponse });
    }
  } catch (error) {
    console.error('Sohbet genel hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Görüntü analizi (Gemini Vision ile)
app.post('/api/analyze-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Görüntü gereklidir' });
    }
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Görüntü yolunu al
    const imagePath = req.file.path;
    
    // Görüntü dosyasını oku
    const imageData = await fs.readFile(imagePath);
    
    // Gemini Vision modeline görüntüyü gönder
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Kullanıcı bilgilerini ve ayarlarını içeren bir bağlam ekle
    const userInfo = userData.users[userIndex].info;
    
    const prompt = `
      Bu görüntüdeki yemek hakkında detaylı bilgi ver:
      1. Yemeğin adı nedir?
      2. Yaklaşık kalori değeri nedir?
      3. Ana besin değerleri nelerdir? (protein, karbonhidrat, yağ)
      4. Bu yemek kullanıcının hedefine (${userInfo.goal}) uygun mu?
      5. Eğer uygun değilse, daha sağlıklı bir alternatif öner.
      
      Türkçe yanıt ver ve samimi, esprili bir ton kullan. Cevabı maddeler halinde yaz.
    `;
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData.toString('base64'), mimeType: req.file.mimetype } }
    ]);
    
    const response = result.response;
    const analysisText = response.text();
    
    // Analiz yanıtını sohbet geçmişine ekle
    userData.users[userIndex].chatHistory.push({
      role: 'assistant',
      content: analysisText,
      timestamp: new Date().toISOString()
    });
    
    await writeUserData(userData);
    
    // Socket.io üzerinden yanıtı gönder
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit('message', {
        role: 'assistant',
        content: analysisText,
        timestamp: new Date().toISOString()
      });
    }
    
    // Kullanılmayan görüntüyü temizle
    await fs.unlink(imagePath);
    
    res.status(200).json({ message: 'Görüntü analiz edildi' });
  } catch (error) {
    console.error('Görüntü analizi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Profil bilgilerini al
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const userData = await readUserData();
    const user = userData.users.find(u => u.userId === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Parolayı çıkar
    const { password, ...userDataWithoutPassword } = user;
    
    res.status(200).json(userDataWithoutPassword);
  } catch (error) {
    console.error('Profil bilgileri alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Profil güncelleme (kilo, not veya sağlık bilgisi ekleme)
app.post('/api/profile/update', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, weight, text, diseases, medications, name, goal, height, age, gender } = req.body;
    
    console.log('Profil güncelleme isteği alındı:', { userId, type, ...req.body });
    
    if (!type || 
        (type === 'weight' && !weight) || 
        (type === 'note' && !text) ||
        (type === 'health' && (!diseases && !medications)) || 
        (type === 'personal' && (!name && !height && !weight && !age && !gender && !goal))) {
      return res.status(400).json({ message: 'Geçersiz parametreler', success: false });
    }
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı', success: false });
    }
    
    const currentDate = new Date().toISOString();
    const updatedUser = { ...userData.users[userIndex] };
    let dataUpdated = false;
    
    if (type === 'weight') {
      // Kilo kaydı ekle
      if (!updatedUser.weightHistory) {
        updatedUser.weightHistory = [];
      }
      
      updatedUser.weightHistory.push({
        date: currentDate,
        weight
      });
      
      // Mevcut kilo bilgisini güncelle
      if (!updatedUser.info) {
        updatedUser.info = {};
      }
      updatedUser.info.weight = weight;
      dataUpdated = true;
      
    } else if (type === 'note') {
      // Not ekle
      if (!updatedUser.notes) {
        updatedUser.notes = [];
      }
      
      updatedUser.notes.push({
        id: Date.now().toString(), // Benzersiz ID ekle
        text,
        completed: false,
        date: currentDate
      });
      dataUpdated = true;
      
    } else if (type === 'health') {
      // Sağlık bilgilerini güncelle
      if (!updatedUser.info) {
        updatedUser.info = {};
      }
      
      // Hastalık bilgisini güncelle (eğer sağlanmışsa)
      if (diseases !== undefined) {
        updatedUser.info.diseases = diseases;
        dataUpdated = true;
      }
      
      // İlaç bilgisini güncelle (eğer sağlanmışsa)
      if (medications !== undefined) {
        updatedUser.info.medications = medications;
        dataUpdated = true;
      }
      
      // Sağlık bilgilerinin güncellenme tarihini ekle
      updatedUser.info.healthInfoUpdatedAt = currentDate;
      
      console.log('Sağlık bilgileri güncellendi:', {
        diseases: updatedUser.info.diseases,
        medications: updatedUser.info.medications
      });
      
    } else if (type === 'personal') {
      // Kişisel bilgileri güncelle
      console.log('Kişisel bilgiler güncellenecek:', { name, height, weight, age, gender, goal });
      
      // Ad ve hedef direk kullanıcı nesnesine ekle
      if (name !== undefined) {
        updatedUser.name = name;
        dataUpdated = true;
      }
      
      if (goal !== undefined) {
        updatedUser.goal = goal;
        dataUpdated = true;
      }
      
      // Diğer bilgileri info altına ekle
      if (!updatedUser.info) {
        updatedUser.info = {};
      }
      
      if (height !== undefined) {
        updatedUser.info.height = height;
        dataUpdated = true;
      }
      
      if (weight !== undefined) {
        updatedUser.info.weight = weight;
        dataUpdated = true;
      }
      
      if (age !== undefined) {
        updatedUser.info.age = age;
        dataUpdated = true;
      }
      
      if (gender !== undefined) {
        updatedUser.info.gender = gender;
        dataUpdated = true;
      }
      
      // Kişisel bilgilerin güncellenme tarihini ekle
      updatedUser.info.personalInfoUpdatedAt = currentDate;
      
      console.log('Kişisel bilgiler güncellendi:', {
        name: updatedUser.name,
        goal: updatedUser.goal,
        info: updatedUser.info
      });
    }
    
    if (dataUpdated) {
      // Güncellenmiş kullanıcıyı diziye geri ekle
      userData.users[userIndex] = updatedUser;
      
      // Önce bir lock dosyası oluştur
      const lockFilePath = `${userDataPath}.lock`;
      try {
        await fs.writeFile(lockFilePath, 'locked', 'utf8');
        
        // Verileri kaydet
        await writeUserData(userData);
        
        // Lock dosyasını kaldır
        await fs.unlink(lockFilePath);
        
        console.log(`Kullanıcı ${userId} için ${type} verileri başarıyla güncellendi.`);
        
        // Güncellenmiş kullanıcı bilgilerini döndür
        return res.status(200).json({ 
          message: 'Profil güncellendi', 
          success: true,
          user: updatedUser 
        });
      } catch (fileError) {
        console.error('Dosya yazma hatası:', fileError);
        
        // Lock dosyasını temizlemeye çalış
        try {
          await fs.unlink(lockFilePath);
        } catch (unlockError) {
          console.error('Lock dosyası temizlenirken hata:', unlockError);
        }
        
        throw new Error('Veriler kaydedilirken dosya hatası oluştu');
      }
    } else {
      console.log('Güncelleme yapılmadı, değişiklik yok.');
      return res.status(200).json({ message: 'Değişiklik yapılmadı', success: true });
    }
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin', 
      error: error.message,
      success: false
    });
  }
});

// Not silme endpoint'i
app.post('/api/profile/delete-note', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.body;
    
    console.log('Not silme isteği alındı:', { userId, noteId });
    
    if (!noteId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not ID parametresi gereklidir' 
      });
    }
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }
    
    // Kullanıcının notları var mı kontrol et
    if (!userData.users[userIndex].notes || !Array.isArray(userData.users[userIndex].notes)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcının hiç notu bulunmuyor' 
      });
    }
    
    // Notu ID'ye göre bul
    const noteIndex = userData.users[userIndex].notes.findIndex(note => 
      note.id === noteId || note.id === parseInt(noteId)
    );
    
    if (noteIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Belirtilen ID ile not bulunamadı' 
      });
    }
    
    // Notu diziden kaldır
    userData.users[userIndex].notes.splice(noteIndex, 1);
    
    // Değişiklikleri kaydet
    await writeUserData(userData);
    
    console.log('Not başarıyla silindi:', { userId, noteId });
    
    // Başarılı yanıt
    res.status(200).json({ 
      success: true, 
      message: 'Not başarıyla silindi' 
    });
  } catch (error) {
    console.error('Not silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Not silinirken bir hata oluştu', 
      error: error.message 
    });
  }
});

// İşaretleme durumu güncelleme (tamamlandı/tamamlanmadı)
app.post('/api/profile/mark-complete', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, item, day, meal, note, completed } = req.body;
    
    if (!type || typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'Geçersiz parametreler' });
    }
    
    const userData = await readUserData();
    const userIndex = userData.users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    if (type === 'exercise' && item) {
      // Tüm haftalar ve günlerde egzersizi bul ve güncelle
      const exercisePlan = userData.users[userIndex].exercisePlan;
      
      for (const week in exercisePlan) {
        for (const day in exercisePlan[week]) {
          const exercises = exercisePlan[week][day];
          const index = exercises.findIndex(e => 
            e.exercise === item.exercise && e.duration === item.duration
          );
          
          if (index !== -1) {
            exercises[index].completed = completed;
          }
        }
      }
    } else if (type === 'meal' && day && meal) {
      // Tüm haftalarda belirli gün ve öğünü bul
      const dietPlan = userData.users[userIndex].dietPlan;
      
      for (const week in dietPlan) {
        if (dietPlan[week][day]) {
          for (const mealTime in dietPlan[week][day]) {
            if (dietPlan[week][day][mealTime].name === meal) {
              dietPlan[week][day][mealTime].completed = completed;
            }
          }
        }
      }
    } else if (type === 'note' && note) {
      // Not tamamlandı durumunu güncelle
      const notes = userData.users[userIndex].notes;
      const index = notes.findIndex(n => 
        n.text === note.text && n.date === note.date
      );
      
      if (index !== -1) {
        notes[index].completed = completed;
      }
    }
    
    await writeUserData(userData);
    
    res.status(200).json({ message: 'Durum güncellendi' });
  } catch (error) {
    console.error('İşaretleme durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' });
  }
});

// Ana başlangıç fonksiyonu
async function start() {
  try {
    console.log('Sunucu başlatılıyor...');
    
    // Klasörlerin varlığını kontrol et
    console.log('Klasörler kontrol ediliyor...');
    await ensureDirectoriesExist();
    console.log('Klasörler hazır.');
    
    // userData.json dosyasının varlığını kontrol et
    console.log('userData.json kontrol ediliyor...');
    try {
      await fs.access(userDataPath);
      console.log('userData.json mevcut.');
    } catch (error) {
      console.log('userData.json bulunamadı, oluşturuluyor...');
      // Dosya yoksa oluştur
      const emptyData = { users: [] };
      await fs.writeFile(userDataPath, JSON.stringify(emptyData, null, 2), 'utf8');
      console.log('userData.json oluşturuldu.');
    }
    
    // Sunucuyu başlat
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor`);
    });
  } catch (error) {
    console.error('Sunucu başlatılırken hata:', error);
  }
}

start();