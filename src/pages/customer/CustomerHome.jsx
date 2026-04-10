import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { db } from '../../config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLORS, FONTS, STAMP_CONFIG } from '../../config/constants.js';
import { calculateLevel, stampsToNextLevel, generateQRToken } from '../../utils/helpers.js';

const f = FONTS;
const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.cardBg, borderRadius: 20, padding: '18px', border: `1px solid ${COLORS.divider}`, ...style }}>{children}</div>
);

const Bean = ({ color = COLORS.fioreOrange }) => (
  <svg width="12" height="12" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="6" ry="9" fill={color} opacity="0.3" stroke={color} strokeWidth="1"/><path d="M10 2 Q7 10 10 18" stroke={color} strokeWidth="1.2" fill="none"/></svg>
);

const CupProgress = ({ count, total = 7, isGoat }) => {
  const pct = count / total;
  const r = 56, size = 150, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const done = count >= total;
  const col = done ? COLORS.green : isGoat ? COLORS.gold : COLORS.fioreOrange;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.warmGray} strokeWidth="5"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
        {Array.from({ length: total }, (_, i) => {
          const a = (i/total)*2*Math.PI - Math.PI/2;
          const px = cx+r*Math.cos(a), py = cy+r*Math.sin(a);
          return (<g key={i}><circle cx={px} cy={py} r={8} fill={i<count?col:COLORS.cardBg} stroke={i<count?col:COLORS.warmGray} strokeWidth="1.5"/>{i<count?<path d={`M${px-2.5} ${py+0.5} L${px-0.5} ${py+2.5} L${px+3} ${py-2}`} stroke={COLORS.fioreSiyah} strokeWidth="1.8" fill="none" strokeLinecap="round"/>:<text x={px} y={py+3.5} textAnchor="middle" fontSize="8" fontWeight="600" fill={COLORS.gray} fontFamily={f.body}>{i+1}</text>}</g>);
        })}
        <g transform={`translate(${cx-13}, ${cy-17})`}>
          <rect x="6" y="0" width="14" height="2.5" rx="1.2" fill={col} opacity="0.55"/>
          <path d="M1 2.5 L25 2.5 L24 7 L2 7 Z" fill={col} opacity="0.45"/>
          <ellipse cx="18" cy="4" rx="2.5" ry="1" fill={COLORS.cardBg} opacity="0.5"/>
          <path d="M3 7 L5.5 33 Q6 34.5 8 34.5 L18 34.5 Q20 34.5 20.5 33 L23 7" fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M4.2 14 L21.8 14" stroke={col} strokeWidth="0.8" opacity="0.25"/>
          <path d="M4.6 18 L21.4 18" stroke={col} strokeWidth="0.8" opacity="0.25"/>
          <clipPath id="cupF"><path d="M3 7 L5.5 33 Q6 34.5 8 34.5 L18 34.5 Q20 34.5 20.5 33 L23 7 Z"/></clipPath>
          <rect x="1" y={34.5-(pct*27.5)} width="26" height="36" fill={col} opacity="0.2" clipPath="url(#cupF)" style={{ transition: 'y 0.6s ease' }}/>
        </g>
      </svg>
      <div style={{ marginTop: 6 }}><span style={{ fontSize: 26, fontWeight: 800, color: col }}>{count}</span><span style={{ fontSize: 15, fontWeight: 500, color: COLORS.gray }}> / {total}</span></div>
      <div style={{ fontSize: 12, fontWeight: 600, color: done ? COLORS.green : COLORS.grayDark, marginTop: 2 }}>{done ? 'Ücretsiz kahven hazır!' : `${total-count} kahve daha — 1 ücretsiz`}</div>
    </div>
  );
};

export default function CustomerHome() {
  const { userData } = useAuth();
  const [qrTimer, setQrTimer] = useState(60);
  const [qrToken, setQrToken] = useState('');
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const gen = () => { setQrToken(generateQRToken(userData?.phone || 'x', userData?.qrSecret || 'd')); };
    gen();
    const t = setInterval(() => { setQrTimer(p => { if (p<=1) { gen(); return 60; } return p-1; }); }, 1000);
    return () => clearInterval(t);
  }, [userData]);

  useEffect(() => {
    getDocs(query(collection(db, 'campaigns'), where('active', '==', true))).then(s => setCampaigns(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {});
  }, []);

  if (!userData) return null;
  const level = userData.level || calculateLevel(userData.totalStamps || 0);
  const isGoat = level === 'goat';
  const nextInfo = stampsToNextLevel(userData.totalStamps || 0);
  const stamps = userData.totalStamps || 0;
  const card = userData.currentCard || 0;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, fontFamily: f.body }}>
      <div style={{ background: COLORS.headerGradient, padding: '20px 20px 18px', borderBottom: `1px solid ${COLORS.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
          <div onClick={() => window.open('https://www.instagram.com/caffedifiore.tr?igsh=MWFvZnB4dXphYXY1cA==', '_blank')} style={{ position: 'absolute', left: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isGoat ? COLORS.gold : COLORS.fioreOrange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </div>
          <img src="/icons/logo-white.png" alt="CaffeDiFiore" style={{ height: 28 }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: FONTS.script, fontSize: 14, color: isGoat ? COLORS.gold : COLORS.fioreOrange }}>Sei Perfetto</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.gray, letterSpacing: 2, fontWeight: 600 }}>HOŞ GELDİN</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.fioreBeyaz, marginTop: 3 }}>{userData.name}</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isGoat ? COLORS.goldBg : COLORS.orangeGlow, padding: '5px 12px', borderRadius: 20, border: `1px solid ${isGoat ? COLORS.gold : COLORS.fioreOrange}15` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isGoat ? COLORS.gold : COLORS.fioreOrange }} />
            <span style={{ fontSize: 10, color: isGoat ? COLORS.gold : COLORS.fioreOrange, fontWeight: 600 }}>{isGoat ? 'GOAT' : level === 'mudavim' ? 'Müdavim' : 'Misafir'}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 80px' }}>
        <Card style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bean color={isGoat ? COLORS.gold : COLORS.fioreOrange} />
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.fioreBeyaz }}>{stamps} Damga</span>
            </div>
            {!isGoat && <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.fioreOrange }}>{nextInfo.next === 'goat' ? 'GOAT' : 'Müdavim'}'e {nextInfo.remaining} kaldı</span>}
            {isGoat && <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.gold }}>GOAT Üye</span>}
          </div>
          <div style={{ height: 5, background: COLORS.warmGray, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: `${Math.min((stamps / 40) * 100, 100)}%`, background: `linear-gradient(90deg, ${isGoat ? COLORS.gold : COLORS.fioreOrange}, ${isGoat ? COLORS.goldDark : COLORS.orangeLight})`, borderRadius: 3, boxShadow: `0 0 8px ${isGoat ? COLORS.gold : COLORS.fioreOrange}40`, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[['Misafir', 0], ['Müdavim', 16], ['GOAT', 40]].map(([l, n]) => (
              <span key={l} style={{ fontSize: 9, color: stamps >= n ? (l === 'GOAT' ? COLORS.gold : COLORS.fioreOrange) : COLORS.gray, fontWeight: stamps >= n ? 700 : 500 }}>{l} · {n}</span>
            ))}
          </div>
        </Card>

        {isGoat && (
          <div style={{ marginBottom: 10 }}>
            {userData.goatMonthlyUsed ? (
              <Card><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>Aylık ücretsiz kahven bu ay kullanıldı. Gelecek ay yenilenir.</span></Card>
            ) : (
              <div style={{ background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, borderRadius: 20, padding: '16px 18px', color: '#fff' }}>
                <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, opacity: 0.7 }}>GOAT AYLIK HEDİYE</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>Dilediğin bir kahve ücretsiz</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Tüm alışverişlerde %10 indirim</div>
              </div>
            )}
          </div>
        )}

        {campaigns.map(c => (
          <div key={c.id} style={{ background: `linear-gradient(135deg, ${COLORS.fioreOrange}, ${COLORS.orangeLight})`, borderRadius: 20, padding: '16px 18px', marginBottom: 10, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -16, top: -16, width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, opacity: 0.7 }}>KAMPANYA</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{c.title}</div>
            {c.description && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{c.description}</div>}
          </div>
        ))}

        <Card style={{ marginBottom: 10, padding: '20px 16px 16px' }}>
          <CupProgress count={card} total={7} isGoat={isGoat} />
        </Card>

        <Card style={{ textAlign: 'center' }}>
          {isGoat && <div style={{ background: COLORS.goldBg, borderRadius: 10, padding: '8px 12px', marginBottom: 10, borderLeft: `3px solid ${COLORS.gold}` }}><span style={{ fontSize: 11, fontWeight: 600, color: COLORS.gold }}>Ödeme öncesi GOAT üyeliğinizi kasaya gösteriniz</span></div>}
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.fioreBeyaz, marginBottom: 10 }}>Kasada QR Göster</div>
          <div style={{ display: 'inline-block', padding: 12, borderRadius: 14, background: '#fff' }}>
            <QRCodeSVG value={qrToken} size={160} level="H" fgColor="#000" bgColor="#fff" />
          </div>
          {isGoat && <div style={{ marginTop: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: COLORS.gold, padding: '4px 14px', borderRadius: 20 }}>GOAT · %10 İNDİRİM</span></div>}
          <div style={{ marginTop: 8, fontSize: 10, color: COLORS.gray }}>{qrTimer}s sonra yenilenir</div>
        </Card>
      </div>
    </div>
  );
}
