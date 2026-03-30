import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLORS, FONTS, STAMP_CONFIG } from '../../config/constants.js';
import { calculateLevel, stampsToNextLevel, generateQRToken } from '../../utils/helpers.js';

const f = FONTS;

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.fioreBeyaz, borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(42,24,16,0.06)', ...style }}>
    {children}
  </div>
);

const LevelBadge = ({ level }) => {
  const cfg = {
    misafir: { label: 'Fiore Misafir', color: COLORS.fioreOrange, bg: COLORS.orangeGlow, dot: COLORS.fioreOrange },
    mudavim: { label: 'Fiore Müdavim', color: COLORS.fioreOrange, bg: COLORS.orangeGlow, dot: COLORS.orangeLight },
    goat: { label: 'Fiore GOAT', color: COLORS.gold, bg: COLORS.goldBg, dot: COLORS.gold },
  }[level];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: cfg.bg, padding: '6px 16px', borderRadius: 24, border: `1.5px solid ${cfg.color}20` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
      <span style={{ fontSize: 12, color: cfg.color, fontWeight: 700, fontFamily: f.body, letterSpacing: 0.5 }}>{cfg.label}</span>
    </div>
  );
};

const StampDot = ({ filled, isFree, freeReady }) => (
  <div style={{
    width: 38, height: 38, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: filled ? COLORS.fioreOrange : isFree ? (freeReady ? COLORS.green : 'transparent') : 'transparent',
    border: filled ? 'none' : isFree ? `2px dashed ${freeReady ? COLORS.green : COLORS.green}80` : `2px solid ${COLORS.grayLight}`,
    transition: 'all 0.3s ease',
  }}>
    {filled ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) : isFree ? (
      <span style={{ fontSize: 10, fontWeight: 800, color: freeReady ? '#fff' : COLORS.green, fontFamily: f.body }}>FREE</span>
    ) : (
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayLight, fontFamily: f.body }}>{}</span>
    )}
  </div>
);

export default function CustomerHome() {
  const { userData } = useAuth();
  const [qrTimer, setQrTimer] = useState(60);
  const [qrToken, setQrToken] = useState('');
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const genToken = () => {
      const secret = userData?.qrSecret || 'default';
      const uid = userData?.phone || 'unknown';
      setQrToken(generateQRToken(uid, secret));
    };
    genToken();
    const t = setInterval(() => {
      setQrTimer(p => { if (p <= 1) { genToken(); return 60; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [userData]);

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
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>

      {/* Header */}
      <div style={{ background: isGoat ? 'linear-gradient(160deg, #3D2B1F 0%, #1a1208 100%)' : 'linear-gradient(160deg, #3D2B1F 0%, #2A1810 100%)', padding: '20px 24px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <img src="/icons/logo-header.png" alt="CaffeDiFiore" style={{ height: 26, opacity: 0.95 }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: isGoat ? COLORS.goldLight : 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', fontFamily: f.body }}>Hoş geldin</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.fioreBeyaz, marginTop: 4, fontFamily: f.heading }}>{userData.name}</div>
        </div>
        <div style={{ marginTop: 12 }}><LevelBadge level={level} /></div>
      </div>

      {/* İlerleme */}
      <div style={{ padding: '16px 20px 0' }}>
        <Card>
          {isGoat ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold, fontFamily: f.heading }}>GOAT Üyelik</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>{stamps} damga</span>
              </div>
              {[
                ['Her ay 1 kahve ücretsiz', COLORS.gold],
                ['Her alışverişte %10 indirim', COLORS.gold],
                ["7'de 1 ücretsiz devam eder", COLORS.fioreOrange],
                ['Özel kampanyalara erken erişim', COLORS.fioreOrange],
              ].map(([tx, c], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${COLORS.warmGray}` : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.grayDark }}>{tx}</span>
                </div>
              ))}
              <div style={{ background: COLORS.goldBg, borderRadius: 12, padding: '12px 14px', marginTop: 12, borderLeft: `3px solid ${COLORS.gold}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.goldDark }}>Ödeme öncesinde GOAT üyeliğinizi kasa personeline gösteriniz.</span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.fioreSiyah, fontFamily: f.heading }}>{stamps} Damga</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: nextInfo.next === 'goat' ? COLORS.gold : COLORS.fioreOrange }}>
                  {nextInfo.next === 'goat' ? 'GOAT' : 'Müdavim'}'e {nextInfo.remaining} kaldı
                </span>
              </div>
              <div style={{ height: 8, background: COLORS.warmGray, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((stamps / (nextInfo.next === 'goat' ? 40 : 16)) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${COLORS.fioreOrange}, ${COLORS.gold})`,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[['Misafir', '0'], ['Müdavim', '16'], ['GOAT', '40']].map(([l, n]) => (
                  <span key={l} style={{ fontSize: 10, fontWeight: 600, color: COLORS.gray }}>{l} ({n})</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* GOAT Aylık */}
      {isGoat && (
        <div style={{ padding: '12px 20px 0' }}>
          {userData.goatMonthlyUsed ? (
            <div style={{ background: COLORS.warmGray, borderRadius: 16, padding: '14px 18px', borderLeft: `3px solid ${COLORS.gold}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>Aylık ücretsiz kahven bu ay kullanıldı. Gelecek ay yenilenir.</span>
            </div>
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, borderRadius: 16, padding: '18px 20px', color: COLORS.fioreBeyaz }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, opacity: 0.8, marginBottom: 6 }}>GOAT AYLIK HEDİYE</div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: f.heading }}>1 Ücretsiz Kahve Hakkın Var</div>
            </div>
          )}
        </div>
      )}

      {/* Kampanyalar */}
      {campaigns.map(camp => (
        <div key={camp.id} style={{ padding: '12px 20px 0' }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.fioreOrange}, ${COLORS.orangeLight})`,
            borderRadius: 16, padding: '16px 20px', color: COLORS.fioreBeyaz,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, opacity: 0.8, marginBottom: 6 }}>KAMPANYA</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: f.heading }}>{camp.title}</div>
            {camp.description && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85, lineHeight: 1.5 }}>{camp.description}</div>}
          </div>
        </div>
      ))}

      {/* Sadakat Kartı */}
      <div style={{ padding: '16px 20px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.fioreSiyah, fontFamily: f.heading }}>Sadakat Kartım</span>
            <span style={{ fontSize: 14, color: COLORS.fioreOrange, fontWeight: 700 }}>{card} / 7</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: 7 }, (_, i) => (
              <StampDot key={i} filled={i < card} />
            ))}
            <StampDot isFree freeReady={card >= 7} />
          </div>
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 600, color: card >= 7 ? COLORS.green : COLORS.grayDark }}>
            {card >= 7 ? 'Ücretsiz kahve hakkınız var!' : `${7 - card} kahve daha — 1 ücretsiz`}
          </div>
        </Card>
      </div>

      {/* QR Kod */}
      <div style={{ padding: '16px 20px 20px' }}>
        <Card style={{ textAlign: 'center' }}>
          {isGoat && (
            <div style={{ background: COLORS.goldBg, borderRadius: 10, padding: '10px 14px', marginBottom: 14, borderLeft: `3px solid ${COLORS.gold}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.goldDark }}>Ödeme öncesi GOAT üyeliğinizi kasaya gösteriniz</span>
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.fioreSiyah, marginBottom: 14, fontFamily: f.heading }}>Kasada QR Göster</div>
          <div style={{
            display: 'inline-block', padding: 10,
            background: COLORS.fioreBeyaz, borderRadius: 16,
            border: `3px solid ${isGoat ? COLORS.gold : COLORS.fioreOrange}20`,
            boxShadow: `0 4px 24px ${isGoat ? COLORS.gold : COLORS.fioreOrange}15`,
          }}>
            <QRCodeSVG value={qrToken} size={130} level="M" fgColor={COLORS.fioreSiyah} bgColor={COLORS.fioreBeyaz} />
          </div>
          {isGoat && (
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.fioreBeyaz, background: COLORS.gold, padding: '5px 14px', borderRadius: 20, letterSpacing: 0.5 }}>
                GOAT · %10 İNDİRİM
              </span>
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${COLORS.grayLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: COLORS.gray }} />
            </div>
            <span style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>{qrTimer}s sonra yenilenir</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
