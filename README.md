# CaffeDiFiore Loyalty App

## Kurulum

### 1. Firebase Projesi Oluştur
1. https://console.firebase.google.com adresine git
2. "Proje Ekle" tıkla → İsim: `caffedifiore-loyalty`
3. Google Analytics: İsteğe bağlı

### 2. Firebase Servisleri Etkinleştir
- **Authentication** → Sign-in method → **Phone** (telefon) etkinleştir
- **Firestore Database** → Create database → Production mode
- **Hosting** → Get started

### 3. Firebase Config Al
Firebase Console → Proje Ayarları → General → Your apps → Web app ekle
→ Config objesini kopyala → `src/config/firebase.js` dosyasına yapıştır

### 4. Projeyi Çalıştır
```bash
npm install
npm run dev
```

### 5. Firebase Deploy
```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

## Dosya Yapısı
```
src/
  config/       → Firebase config, sabitler, menü verisi
  contexts/     → Auth context (giriş yönetimi)
  hooks/        → Custom React hooks
  components/   → UI bileşenleri
  pages/        → Sayfa componentleri
  services/     → Firebase servis fonksiyonları
  utils/        → Yardımcı fonksiyonlar
```

## Geliştirme Fazları
- [x] Faz 1: Altyapı (proje kurulumu, dosya yapısı, config)
- [ ] Faz 2: Auth (Müşteri SMS, Personel PIN, Admin şifre+SMS)
- [ ] Faz 3: Müşteri ekranları
- [ ] Faz 4: Personel ekranları
- [ ] Faz 5: Admin ekranları
- [ ] Faz 6: Güvenlik (GPS, QR, rate limiting)
- [ ] Faz 7: PWA + Deploy
