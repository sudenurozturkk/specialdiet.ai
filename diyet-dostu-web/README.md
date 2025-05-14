# Diyet Dostu 🥗

Diyet Dostu, Gemini API ile çalışan kişiselleştirilmiş bir diyet ve spor asistanı web uygulamasıdır. Türk mutfağına uygun kolay ve diyete uygun tarifler ile kişisel spor planları sunar.

## Özellikler

- **Kişiselleştirilmiş Diyet Planları**: Türk mutfağına uygun, kolay ve düşük kalorili/yüksek proteinli tarifler
- **Özel Spor Programları**: Hedefe göre özelleştirilmiş egzersizler, süre ve yoğunluk
- **Görsel Analiz**: Yemek fotoğrafı yükleyerek besin değeri tahmini
- **Kullanıcı Profili**: Kilo takibi, beslenme planı ve spor programı yönetimi
- **JWT Tabanlı Kullanıcı Girişi**: Güvenli oturum açma ve kayıt sistemi

## Kurulum

### Gereksinimler

- Node.js (v14.0.0 veya üzeri)
- npm (v6.0.0 veya üzeri)
- Google Gemini API anahtarı

### Adımlar

1. Projeyi klonlayın:
```
git clone https://github.com/your-username/diyet-dostu-web.git
cd diyet-dostu-web
```

2. Server için gerekli bağımlılıkları yükleyin:
```
cd server
npm install
```

3. `.env` dosyasını oluşturun ve Gemini API anahtarınızı ekleyin:
```
GOOGLE_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
```

4. Server'ı başlatın:
```
node server.js
```

5. Yeni bir terminal açın ve client için gerekli bağımlılıkları yükleyin:
```
cd client
npm install
```

6. Client'ı başlatın:
```
npm start
```

7. Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı kullanmaya başlayın.

## Test Senaryoları

1. Kaydolun ve oturum açın
2. Profilinizi düzenleyin (yaş, boy, kilo, hedef)
3. Sohbet alanından diyet veya spor önerisi isteyin (örn. "Vegan diyet istiyorum")
4. Bir yemek fotoğrafı yükleyin ve besin tahmini alın
5. Profilden kilo takibi yapın ve beslenme/spor programınızı işaretleyin

## Teknolojiler

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Veritabanı**: JSON dosya sistemi (userData.json)
- **API**: Google Gemini AI
- **Güvenlik**: JWT, bcrypt

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 