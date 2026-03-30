const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Kampanya oluşturulunca otomatik push bildirim gönder
 */
exports.sendCampaignNotification = onDocumentCreated(
  { document: "campaigns/{campaignId}", region: "europe-west1" },
  async (event) => {
    const campaign = event.data.data();
    if (!campaign.active) return;

    const title = "CaffeDiFiore ☕";
    const body = campaign.title + (campaign.description ? " — " + campaign.description : "");

    // Hedef kitleye göre müşterileri filtrele
    let customersQuery = db.collection("customers");
    const snapshot = await customersQuery.get();

    const tokens = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const fcm = data.fcmTokens || [];

      // Hedef kitle kontrolü
      if (campaign.target === "all" || campaign.target === data.level) {
        tokens.push(...fcm);
      }
      // "misafir" target = yeni üyeler (misafir seviyesi)
      if (campaign.target === "misafir" && data.level === "misafir") {
        tokens.push(...fcm);
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
          notification: { title, body },
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
            // Token geçersiz — Firestore'dan sil
            const badToken = batch[idx];
            snapshot.docs.forEach(async (doc) => {
              const data = doc.data();
              if (data.fcmTokens?.includes(badToken)) {
                const updatedTokens = data.fcmTokens.filter((t) => t !== badToken);
                await doc.ref.update({ fcmTokens: updatedTokens });
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
