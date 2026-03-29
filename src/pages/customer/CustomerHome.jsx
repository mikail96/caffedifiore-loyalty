import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLORS, STAMP_CONFIG, STAMP_CATEGORIES } from '../../config/constants.js';
import { calculateLevel, stampsToNextLevel, generateQRToken } from '../../utils/helpers.js';

const Card = ({ children, style = {}, border }) => (
  <div style={{ background: COLORS.fioreBeyaz, borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(3,3,3,0.08)', border: border || 'none', ...style }}>
    {children}
  </div>
);

const LevelBadge = ({ level }) => {
  const cfg = {
    misafir: { icon: '☕', label: 'Fiore Misafir', color: COLORS.fioreOrange, bg: COLORS.orangeGlow },
    mudavim: { icon: '⭐', label: 'Fiore Müdavim', color: COLORS.fioreOrange, bg: COLORS.orangeGlow },
    goat: { icon: '🐐', label: 'Fiore GOAT', color: COLORS.gold, bg: COLORS.goldBg },
  }[level];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cfg.bg, padding: '6px 14px', borderRadius: 20, fontSize: 13, color: cfg.color, fontWeight: 800, border: `1.5px solid ${cfg.color}30` }}>
      {cfg.icon} {cfg.label}
    </div>
  );
};

const StampCard = ({ count, total = 7 }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{
        width: 36, height: 36, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: i < count ? COLORS.fioreOrange : COLORS.fioreBeyaz,
        border: i < count ? `2px solid ${COLORS.fioreOrange}` : `2px dashed ${COLORS.fioreOrange}50`,
        fontSize: 16,
      }}>
        {i < count ? '☕' : <span style={{ color: COLORS.fioreOrange, fontSize: 12, fontWeight: 800 }}>{i + 1}</span>}
      </div>
    ))}
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: count >= total ? COLORS.green : COLORS.fioreBeyaz,
      border: count >= total ? `2px solid ${COLORS.green}` : `2px dashed ${COLORS.green}`,
      fontSize: 14,
    }}>
      {count >= total ? '🎁' : <span style={{ color: COLORS.green, fontSize: 9, fontWeight: 900 }}>FREE</span>}
    </div>
  </div>
);

export default function CustomerHome() {
  const { userData } = useAuth();
  const [qrTimer, setQrTimer] = useState(60);
  const [qrToken, setQrToken] = useState('');
  const [campaigns, setCampaigns] = useState([]);

  // QR token her 60 saniyede yenilenir
  useEffect(() => {
    const genToken = () => {
      const secret = userData?.qrSecret || 'default';
      const uid = userData?.phone || 'unknown';
      setQrToken(generateQRToken(uid, secret));
    };
    genToken();
    const t = setInterval(() => {
      setQrTimer(p => {
        if (p <= 1) { genToken(); return 60; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [userData]);

  // Aktif kampanyaları yükle
  useEffect(() => {
    getDocs(query(collection(db, 'campaigns'), where('active', '==', true)))
      .then(snap => setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, []);

  if (!userData) return null;

  const level = userData.level || calculateLevel(userData.totalStamps || 0);
  const isGoat = level === 'goat';
  const nextInfo = stampsToNextLevel(userData.totalStamps || 0);
  const stamps = userData.totalStamps || 0;
  const card = userData.currentCard || 0;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: "Segoe UI, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: isGoat ? 'linear-gradient(135deg, #4A3728, #2A1810)' : 'linear-gradient(180deg, #3D2B1F, #2A1810)', padding: '16px 20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 28 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: isGoat ? COLORS.goldLight : COLORS.fioreOrange, fontWeight: 800, letterSpacing: 2 }}>HOŞ GELDİN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.fioreBeyaz, marginTop: 2 }}>{userData.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <LevelBadge level={level} />
        </div>
      </div>

      {/* Seviye + Damga Sayısı */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          {isGoat ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.gold, marginBottom: 8 }}>
                🐐 Fiore GOAT · {stamps} damga
              </div>
              {[
                ['☕', 'Her ay 1 kahve ücretsiz'],
                ['💰', 'Her alışverişte %10 indirim'],
                ['🎁', "7'de 1 ücretsiz devam eder"],
                ['👑', 'Özel kampanyalara erken erişim'],
              ].map(([ic, tx]) => (
                <div key={tx} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: `1px solid ${COLORS.grayLight}` }}>
                  <span style={{ fontSize: 14 }}>{ic}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>{tx}</span>
                </div>
              ))}
              <div style={{ background: COLORS.goldBg, borderRadius: 10, padding: '10px 12px', marginTop: 8, border: `1.5px solid ${COLORS.gold}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold }}>
                  ⚠ Ödeme öncesinde GOAT üyeliğinizi kasa personeline gösteriniz.
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.fioreSiyah }}>{stamps} damga</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: nextInfo.next === 'goat' ? COLORS.gold : COLORS.fioreOrange }}>
                  {nextInfo.next === 'goat' ? '🐐' : '⭐'} {nextInfo.next === 'goat' ? 'GOAT' : 'Müdavim'}'e {nextInfo.remaining} kaldı
                </span>
              </div>
              <div style={{ height: 10, background: COLORS.grayLight, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((stamps / (nextInfo.next === 'goat' ? 40 : 16)) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${COLORS.fioreOrange}, ${COLORS.gold})`,
                  borderRadius: 5,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray }}>☕ Misafir</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray }}>⭐ Müdavim (16)</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray }}>🐐 GOAT (40)</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* GOAT Aylık Hediye */}
      {isGoat && (
        <div style={{ padding: '14px 16px 0' }}>
          {userData.goatMonthlyUsed ? (
            <div style={{ background: COLORS.goldBg, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${COLORS.gold}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>
                🐐 Aylık ücretsiz kahven bu ay kullanıldı. Gelecek ay yenilenir!
              </div>
            </div>
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, borderRadius: 14, padding: '16px 18px', color: COLORS.fioreBeyaz }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>GOAT AYLIK HEDİYE</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>☕ 1 Ücretsiz Kahve Hakkın Var!</div>
            </div>
          )}
        </div>
      )}

      {/* Kampanyalar */}
      {campaigns.length > 0 && campaigns.map(camp => (
        <div key={camp.id} style={{ padding: '14px 16px 0' }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.fioreOrange}, ${COLORS.orangeLight})`,
            borderRadius: 14, padding: '14px 16px', color: COLORS.fioreBeyaz,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -8, top: -8, fontSize: 50, opacity: 0.12 }}>☕</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, opacity: 0.9 }}>KAMPANYA</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{camp.title}</div>
            {camp.description && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>{camp.description}</div>}
          </div>
        </div>
      ))}

      {/* Sadakat Kartı */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Sadakat Kartım</span>
            <span style={{ fontSize: 14, color: COLORS.fioreOrange, fontWeight: 800 }}>{card}/7</span>
          </div>
          <StampCard count={card} />
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>
            {card >= 7 ? '🎉 Ücretsiz kahve hakkın var!' : `${7 - card} kahve daha → 1 Ücretsiz ☕`}
          </div>
        </Card>
      </div>

      {/* QR Kod */}
      <div style={{ padding: '14px 16px' }}>
        <Card style={{ textAlign: 'center' }}>
          {isGoat && (
            <div style={{ background: COLORS.goldBg, borderRadius: 8, padding: '8px 12px', marginBottom: 10, border: `1.5px solid ${COLORS.gold}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold }}>
                Ödeme öncesi GOAT üyeliğinizi kasaya gösteriniz
              </div>
            </div>
          )}
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Kasada QR Göster</div>
          <div style={{ padding: 8, background: COLORS.fioreBeyaz, borderRadius: 14, display: 'inline-block', border: `4px solid ${isGoat ? COLORS.gold : COLORS.fioreOrange}` }}>
            <QRCodeSVG
              value={qrToken}
              size={130}
              level="M"
              fgColor={COLORS.fioreSiyah}
              bgColor={COLORS.fioreBeyaz}
            />
          </div>
          {isGoat && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.fioreBeyaz, background: COLORS.gold, padding: '4px 12px', borderRadius: 10 }}>
                🐐 GOAT · %10 İNDİRİM
              </span>
            </div>
          )}
          <div style={{ fontSize: 12, color: COLORS.grayDark, marginTop: 8, fontWeight: 600 }}>
            🔄 {qrTimer}s sonra yenilenir
          </div>
        </Card>
      </div>

      {/* Damga Kazandıran Ürünler */}
      <div style={{ padding: '0 16px 14px' }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>☕ Damga Kazandıran Ürünler</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STAMP_CATEGORIES.filter(c => c.eligible).map(c => (
              <span key={c.id} style={{
                fontSize: 11, background: COLORS.orangeGlow, color: COLORS.fioreOrange,
                padding: '4px 10px', borderRadius: 8, fontWeight: 700,
                border: `1px solid ${COLORS.fioreOrange}30`,
              }}>
                {c.icon} {c.name}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: COLORS.grayDark, marginTop: 8, fontWeight: 500 }}>
            Çay, soğuk içecek, kutulu ürünler ve tatlılar damga kazandırmaz.
          </div>
        </Card>
      </div>
    </div>
  );
}
