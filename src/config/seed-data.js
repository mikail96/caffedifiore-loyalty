/**
 * Bu script Firestore'a ilk verileri yükler.
 * Tarayıcı konsolunda çalıştır veya node ile çalıştır.
 * 
 * Kullanım: Uygulamayı açtıktan sonra tarayıcı konsolunda:
 * 1. Firebase Console > Firestore > elle ekle
 * VEYA
 * 2. Bu dosyadaki verileri Firestore'a import et
 */

// Firestore'a eklenmesi gereken başlangıç verileri:

// ======= settings/admin =======
// Collection: settings, Document ID: admin
const adminSettings = {
  username: "mikail.cdf",
  password: "Fiore2026!", // Faz 6'da hash'lenecek
  phone: "+905358841480",
  name: "Mikail",
};

// ======= settings/app =======
// Collection: settings, Document ID: app
const appSettings = {
  stampsForFree: 7,
  goatThreshold: 40,
  mudavimThreshold: 16,
  minStampInterval: 15, // dakika
  qrRefreshSec: 60,
  gpsRadius: 100, // metre
  adminPhone: "+905358841480",
};

// ======= branches =======
// Collection: branches
const branches = {
  gokkusagi: {
    name: "CaffeDiFiore Gökkuşağı AVM",
    shortName: "Gökkuşağı AVM",
    lat: null, // Haritadan seçilecek
    lng: null,
  },
  forum: {
    name: "CaffeDiFiore Forum Kampüs AVM",
    shortName: "Forum Kampüs AVM",
    lat: null,
    lng: null,
  },
};

// ======= staff =======
// Collection: staff
const staff = {
  staff_elif: {
    name: "Elif Arslan",
    username: "elif.arslan",
    pin: "1234", // Faz 6'da hash'lenecek
    role: "Barista",
    branch: "gokkusagi",
    status: "active",
    createdAt: new Date(),
  },
  staff_can: {
    name: "Can Bakır",
    username: "can.bakir",
    pin: "5678",
    role: "Barista",
    branch: "forum",
    status: "active",
    createdAt: new Date(),
  },
  staff_deniz: {
    name: "Deniz Kaya",
    username: "deniz.kaya",
    pin: "9012",
    role: "Part-time",
    branch: "gokkusagi",
    status: "active",
    createdAt: new Date(),
  },
};

/*
FIREBASE CONSOLE'DAN ELLE EKLEME TALİMATLARI:

1. https://console.firebase.google.com → caffedifiore-loyalty → Firestore Database

2. "Start collection" → Collection ID: settings
   → Document ID: admin
   → Field: username (string) = mikail.cdf
   → Field: password (string) = Fiore2026!
   → Field: phone (string) = +905358841480
   → Field: name (string) = Mikail
   → Save

3. Aynı settings collection'da → Add document → Document ID: app
   → Field: stampsForFree (number) = 7
   → Field: goatThreshold (number) = 40
   → Field: mudavimThreshold (number) = 16
   → Field: minStampInterval (number) = 15
   → Field: qrRefreshSec (number) = 60
   → Field: gpsRadius (number) = 100
   → Field: adminPhone (string) = +905358841480
   → Save

4. "Start collection" → Collection ID: branches
   → Document ID: gokkusagi
   → Field: name (string) = CaffeDiFiore Gökkuşağı AVM
   → Field: shortName (string) = Gökkuşağı AVM
   → Save
   
   → Add document → Document ID: forum
   → Field: name (string) = CaffeDiFiore Forum Kampüs AVM
   → Field: shortName (string) = Forum Kampüs AVM
   → Save

5. "Start collection" → Collection ID: staff
   → Document ID: staff_elif
   → Field: name (string) = Elif Arslan
   → Field: username (string) = elif.arslan
   → Field: pin (string) = 1234
   → Field: role (string) = Barista
   → Field: branch (string) = gokkusagi
   → Field: status (string) = active
   → Save

   → Add document → Document ID: staff_can
   → Field: name (string) = Can Bakır
   → Field: username (string) = can.bakir
   → Field: pin (string) = 5678
   → Field: role (string) = Barista
   → Field: branch (string) = forum
   → Field: status (string) = active
   → Save

   → Add document → Document ID: staff_deniz
   → Field: name (string) = Deniz Kaya
   → Field: username (string) = deniz.kaya
   → Field: pin (string) = 9012
   → Field: role (string) = Part-time
   → Field: branch (string) = gokkusagi
   → Field: status (string) = active
   → Save

Tamamlandı! Artık giriş ekranları çalışır.
*/

export { adminSettings, appSettings, branches, staff };
