const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Seviye hesaplama (frontend ile aynı: constants.js STAMP_CONFIG)
const GOAT_THRESHOLD = 40;
const MUDAVIM_THRESHOLD = 16;
const MIN_STAMP_INTERVAL_MS = 15 * 60 * 1000; // 15 dakika

function calculateLevel(totalStamps) {
  if (totalStamps >= GOAT_THRESHOLD) return 'goat';
  if (totalStamps >= MUDAVIM_THRESHOLD) return 'mudavim';
  return 'misafir';
}

// Personel/admin doğrulama
async function verifyStaff(staffId) {
  if (!staffId) throw new HttpsError('unauthenticated', 'staffId gerekli');
  const snap = await db.collection('staff').doc(staffId).get();
  if (!snap.exists || snap.data().status !== 'active') {
    // Admin kontrolü — settings/admin kontrol et
    const adminSnap = await db.collection('settings').doc('admin').get();
    if (!adminSnap.exists) throw new HttpsError('permission-denied', 'Yetkisiz');
    return { isAdmin: true, name: 'Admin' };
  }
  return { isAdmin: false, ...snap.data() };
}

/**
 * Damga Ekle (Callable)
 */
exports.addStamp = onCall({ region: "europe-west1" }, async (request) => {
  const { customerId, staffId, branchId, productCategory, isAdmin } = request.data;
  if (!customerId || !staffId) throw new HttpsError('invalid-argument', 'customerId ve staffId gerekli');

  const staff = isAdmin ? { isAdmin: true, name: 'Admin QR', branch: branchId || '' } : await verifyStaff(staffId);

  // Müşteriyi getir
  const custRef = db.collection('customers').doc(customerId);
  const custSnap = await custRef.get();
  if (!custSnap.exists) throw new HttpsError('not-found', 'Müşteri bulunamadı');
  const cust = custSnap.data();

  if ((cust.currentCard || 0) >= 7) throw new HttpsError('failed-precondition', 'Kart dolu');

  // Minimum damga aralığı kontrolü (15dk)
  if (!isAdmin) {
    const recentSnap = await db.collection('stampLogs')
      .where('customerId', '==', customerId).where('type', '==', 'stamp')
      .orderBy('timestamp', 'desc').limit(1).get();
    if (!recentSnap.empty) {
      const lastTime = recentSnap.docs[0].data().timestamp?.toDate?.()?.getTime() || 0;
      if (lastTime > 0 && (Date.now() - lastTime) < MIN_STAMP_INTERVAL_MS) {
        const remaining = Math.ceil((MIN_STAMP_INTERVAL_MS - (Date.now() - lastTime)) / 60000);
        throw new HttpsError('failed-precondition', `Son damgadan ${remaining} dk beklenmeli`);
      }
    }
  }

  const nc = (cust.currentCard || 0) + 1;
  const nt = (cust.totalStamps || 0) + 1;
  const nl = calculateLevel(nt);

  // Transaction ile güncelle
  await db.runTransaction(async (t) => {
    t.update(custRef, { currentCard: nc, totalStamps: nt, level: nl });
    t.create(db.collection('stampLogs').doc(), {
      customerId, customerName: cust.name, staffId, staffName: staff.name,
      branchId: staff.branch || branchId || '', type: isAdmin ? 'admin_add' : 'stamp',
      productCategory: productCategory || '', cardBefore: cust.currentCard || 0, cardAfter: nc,
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  // Referans bonusu
  if (nt === 1 && cust.referredBy) {
    try {
      const refRef = db.collection('customers').doc(cust.referredBy);
      const refSnap = await refRef.get();
      if (refSnap.exists) {
        const rd = refSnap.data();
        const rnc = (rd.currentCard || 0) < 7 ? (rd.currentCard || 0) + 1 : rd.currentCard || 0;
        const rnt = (rd.totalStamps || 0) + 1;
        await refRef.update({ currentCard: rnc, totalStamps: rnt, level: calculateLevel(rnt) });
        await db.collection('stampLogs').add({
          customerId: cust.referredBy, customerName: rd.name, staffId: 'system',
          staffName: 'Referans Bonus', branchId: '', type: 'referral_bonus',
          cardAfter: rnc, timestamp: FieldValue.serverTimestamp(),
        });
      }
    } catch (e) { console.error('Referans bonus hatası:', e); }
  }

  return { success: true, currentCard: nc, totalStamps: nt, level: nl };
});

/**
 * Sadakat Ücretsiz Kullan (Callable)
 */
exports.redeemFree = onCall({ region: "europe-west1" }, async (request) => {
  const { customerId, staffId, branchId, isAdmin } = request.data;
  if (!customerId || !staffId) throw new HttpsError('invalid-argument', 'customerId ve staffId gerekli');

  if (!isAdmin) await verifyStaff(staffId);

  const custRef = db.collection('customers').doc(customerId);
  const custSnap = await custRef.get();
  if (!custSnap.exists) throw new HttpsError('not-found', 'Müşteri bulunamadı');
  const cust = custSnap.data();

  if ((cust.currentCard || 0) < 7) throw new HttpsError('failed-precondition', 'Kart dolmamış');

  await db.runTransaction(async (t) => {
    t.update(custRef, { currentCard: 0 });
    t.create(db.collection('stampLogs').doc(), {
      customerId, customerName: cust.name, staffId, staffName: isAdmin ? 'Admin' : (await db.collection('staff').doc(staffId).get()).data()?.name || staffId,
      branchId: branchId || '', type: 'free_redeemed', timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, currentCard: 0 };
});

/**
 * GOAT Aylık Ücretsiz Kullan (Callable)
 */
exports.redeemGoatMonthly = onCall({ region: "europe-west1" }, async (request) => {
  const { customerId, staffId, branchId, isAdmin } = request.data;
  if (!customerId || !staffId) throw new HttpsError('invalid-argument', 'customerId ve staffId gerekli');

  if (!isAdmin) await verifyStaff(staffId);

  const custRef = db.collection('customers').doc(customerId);
  const custSnap = await custRef.get();
  if (!custSnap.exists) throw new HttpsError('not-found', 'Müşteri bulunamadı');
  const cust = custSnap.data();

  if (cust.level !== 'goat') throw new HttpsError('failed-precondition', 'Müşteri GOAT değil');
  if (cust.goatMonthlyUsed) throw new HttpsError('failed-precondition', 'GOAT aylık zaten kullanılmış');

  await db.runTransaction(async (t) => {
    t.update(custRef, { goatMonthlyUsed: true });
    t.create(db.collection('stampLogs').doc(), {
      customerId, customerName: cust.name, staffId, staffName: isAdmin ? 'Admin' : (await db.collection('staff').doc(staffId).get()).data()?.name || staffId,
      branchId: branchId || '', type: 'goat_monthly', timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

/**
 * Admin Damga Düzenleme (+/-) (Callable)
 */
exports.adminAdjustStamp = onCall({ region: "europe-west1" }, async (request) => {
  const { customerId, action } = request.data; // action: 'add' veya 'remove'
  if (!customerId || !action) throw new HttpsError('invalid-argument', 'customerId ve action gerekli');

  const custRef = db.collection('customers').doc(customerId);
  const custSnap = await custRef.get();
  if (!custSnap.exists) throw new HttpsError('not-found', 'Müşteri bulunamadı');
  const cust = custSnap.data();

  let nc = cust.currentCard || 0;
  let nt = cust.totalStamps || 0;

  if (action === 'add') {
    if (nc >= 7) throw new HttpsError('failed-precondition', 'Kart dolu');
    nc += 1; nt += 1;
  } else if (action === 'remove') {
    if (nc <= 0) throw new HttpsError('failed-precondition', 'Damga 0');
    nc -= 1; nt = Math.max(0, nt - 1);
  } else {
    throw new HttpsError('invalid-argument', 'action add veya remove olmalı');
  }

  const nl = calculateLevel(nt);

  await db.runTransaction(async (t) => {
    t.update(custRef, { currentCard: nc, totalStamps: nt, level: nl });
    t.create(db.collection('stampLogs').doc(), {
      customerId, customerName: cust.name, staffId: 'admin', staffName: 'Admin',
      branchId: '', type: action === 'add' ? 'admin_add' : 'admin_remove',
      cardBefore: cust.currentCard || 0, cardAfter: nc, timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, currentCard: nc, totalStamps: nt, level: nl };
});

/**
 * Kampanya oluşturulunca otomatik push bildirim gönder
 */
exports.sendCampaignNotification = onDocumentCreated(
  { document: "campaigns/{campaignId}", region: "europe-west1" },
  async (event) => {
    const campaign = event.data.data();
    if (!campaign.active) return;

    const title = "CaffeDiFiore";
    const body = campaign.title + (campaign.description ? " — " + campaign.description : "");

    // Hedef kitleye göre müşterileri filtrele
    let customersQuery = db.collection("customers");
    const snapshot = await customersQuery.get();

    const tokens = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const token = data.fcmToken; // Tek token

      if (!token) return;

      // Hedef kitle kontrolü
      if (campaign.target === "all" ||
          campaign.target === data.level ||
          (campaign.target === "misafir" && data.level === "misafir")) {
        tokens.push(token);
      }
    });

    if (tokens.length === 0) {
      console.log("Bildirim gönderilecek token yok");
      return;
    }

    // Benzersiz tokenlar
    const uniqueTokens = [...new Set(tokens)];
    console.log(`${uniqueTokens.length} cihaza bildirim gönderiliyor...`);

    // 500'lük gruplar halinde gönder (FCM limiti)
    const batchSize = 500;
    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const batch = uniqueTokens.slice(i, i + batchSize);
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          webpush: {
            notification: {
              title,
              body,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-64.png",
              tag: "campaign-" + event.params.campaignId,
            },
            fcmOptions: { link: "https://caffedifiore-loyalty.web.app" },
          },
        });

        console.log(`Gönderildi: ${response.successCount} başarılı, ${response.failureCount} başarısız`);

        // Geçersiz tokenları temizle
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
            const badToken = batch[idx];
            snapshot.docs.forEach(async (d) => {
              if (d.data().fcmToken === badToken) {
                await d.ref.update({ fcmToken: null });
              }
            });
          }
        });
      } catch (err) {
        console.error("Bildirim gönderme hatası:", err);
      }
    }

    // Kampanyaya bildirim bilgisini ekle
    await event.data.ref.update({
      notificationSent: true,
      notificationCount: uniqueTokens.length,
      notificationSentAt: new Date(),
    });
  }
);

/**
 * Damga verilince müşteriye push bildirim gönder
 */
exports.sendStampNotification = onDocumentCreated(
  { document: "stampLogs/{logId}", region: "europe-west1" },
  async (event) => {
    const log = event.data.data();
    if (!log.customerId) return;

    // Sadece damga, ücretsiz ve GOAT işlemlerinde bildirim
    const messages = {
      stamp: `Yeni damga eklendi! Kart: ${log.cardAfter || '?'}/7`,
      free_redeemed: 'Ücretsiz kahven kullanıldı! Kart sıfırlandı.',
      goat_monthly: 'GOAT aylık ücretsiz kahven kullanıldı!',
      referral_bonus: 'Referans bonusu! Arkadaşın ilk kahvesini aldı, +1 damga kazandın.',
    };

    const body = messages[log.type];
    if (!body) return; // admin_add, admin_remove için bildirim yok

    try {
      const custDoc = await db.collection("customers").doc(log.customerId).get();
      if (!custDoc.exists) return;
      const token = custDoc.data().fcmToken;
      if (!token) return;

      await messaging.send({
        token,
        webpush: {
          notification: {
            title: "CaffeDiFiore",
            body,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-64.png",
            tag: "stamp-" + event.params.logId,
          },
          fcmOptions: { link: "https://caffedifiore-loyalty.web.app" },
        },
      });
      console.log(`Bildirim gönderildi: ${log.customerName} — ${log.type}`);
    } catch (err) {
      console.log("Stamp bildirim hatası:", err.message);
    }
  }
);

/**
 * Her ayın 1'inde GOAT aylık ücretsiz sıfırla
 * Schedule: Her ayın 1'i saat 00:00 (Türkiye saati)
 */
exports.resetGoatMonthly = onSchedule(
  { schedule: "0 0 1 * *", timeZone: "Europe/Istanbul", region: "europe-west1" },
  async () => {
    const snapshot = await db.collection("customers").where("level", "==", "goat").get();
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { goatMonthlyUsed: false });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`${count} GOAT müşterinin aylık ücretsizi sıfırlandı`);
    }
  }
);

/**
 * Her Pazartesi gece yarısı haftalık logları temizle (30 günden eski)
 * Schedule: Her Pazartesi 00:00 (Türkiye saati)
 */
exports.cleanupOldLogs = onSchedule(
  { schedule: "0 0 * * 1", timeZone: "Europe/Istanbul", region: "europe-west1" },
  async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db
      .collection("stampLogs")
      .where("timestamp", "<", thirtyDaysAgo)
      .get();

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`${count} eski log silindi`);
    }
  }
);
