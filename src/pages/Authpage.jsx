import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const Users = base44.entities.User;

function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AM-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function syncBase44User({ email, full_name, username = '', referred_by = '' }) {
  let existing = null;
  try {
    const results = await Users.filter({ email });
    if (results?.length > 0) existing = results[0];
  } catch (_) {}
  if (existing) return Users.update(existing.id, { full_name });
  return Users.create({
    email, full_name, username, role: 'user', balance: 1000, xp: 0, level: 1,
    is_anonymous: false, affiliate_code: generateAffiliateCode(), referred_by,
    total_deposited: 0, affiliate_earnings: 0, affiliate_earnings_claimable: 0,
    rakeback_instant: 0, rakeback_daily: 0, rakeback_weekly: 0, rakeback_monthly: 0,
    total_rakeback_claimed: 0, rakeback_daily_claimed_at: '', rakeback_weekly_claimed_at: '',
    rakeback_monthly_claimed_at: '',
  });
}

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ff4e6a', '#fbbf24', '#a78bfa', '#f5c842'];

/* ── Gem SVG shapes ── */
const GemShapes = {
  diamond: ({ size, color, glow }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${glow})` }}>
      <defs>
        <linearGradient id={`dg-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="40%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1a0033" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <polygon points="50,5 90,35 70,95 30,95 10,35" fill={`url(#dg-${color})`} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <polygon points="50,5 90,35 50,50" fill="white" fillOpacity="0.15" />
      <polygon points="10,35 50,50 30,95" fill="black" fillOpacity="0.1" />
    </svg>
  ),
  hexagon: ({ size, color, glow }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${glow})` }}>
      <defs>
        <linearGradient id={`hg-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="50%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0d0020" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill={`url(#hg-${color})`} stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
      <polygon points="50,3 93,26 50,50" fill="white" fillOpacity="0.12" />
      <line x1="50" y1="3" x2="50" y2="97" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
    </svg>
  ),
  octagon: ({ size, color, glow }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${glow})` }}>
      <defs>
        <linearGradient id={`og-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="45%" stopColor={color} stopOpacity="0.88" />
          <stop offset="100%" stopColor="#0a001e" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <polygon points="35,5 65,5 95,35 95,65 65,95 35,95 5,65 5,35" fill={`url(#og-${color})`} stroke={color} strokeWidth="1.5" strokeOpacity="0.45" />
      <polygon points="35,5 65,5 95,35 50,50" fill="white" fillOpacity="0.1" />
    </svg>
  ),
  shield: ({ size, color, glow }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${glow})` }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="50%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050010" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path d="M50,5 L90,20 L90,55 Q90,80 50,95 Q10,80 10,55 L10,20 Z" fill={`url(#sg-${color})`} stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M50,5 L90,20 L50,50 Z" fill="white" fillOpacity="0.13" />
    </svg>
  ),
};

/* ── Floating Gem ── */
const FloatingGem = ({ shape, size, color, glow, x, y, duration, delay, rotateRange, driftX, driftY }) => {
  const ShapeComp = GemShapes[shape];
  return (
    <motion.div
      style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 0, opacity: 0 }}
      animate={{
        y: [0, driftY, 0, -driftY * 0.5, 0],
        x: [0, driftX, 0, -driftX * 0.6, 0],
        rotate: [0, rotateRange, -rotateRange * 0.5, rotateRange * 0.3, 0],
        opacity: [0, 0.7, 0.85, 0.6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <ShapeComp size={size} color={color} glow={glow} />
    </motion.div>
  );
};

/* ── Generate gems ── */
const GEMS_DATA = [
  { shape: 'diamond', size: 52, color: '#9d4edd', glow: '#9d4edd', x: '5%', y: '8%', duration: 14, delay: 0, rotateRange: 22, driftX: 18, driftY: -30 },
  { shape: 'hexagon', size: 34, color: '#f5c842', glow: '#f5c842', x: '88%', y: '5%', duration: 11, delay: 1.5, rotateRange: 35, driftX: -12, driftY: 25 },
  { shape: 'octagon', size: 44, color: '#7b2ff7', glow: '#7b2ff7', x: '92%', y: '55%', duration: 16, delay: 0.8, rotateRange: 18, driftX: -20, driftY: -28 },
  { shape: 'diamond', size: 28, color: '#f5c842', glow: '#d4a800', x: '3%', y: '70%', duration: 12, delay: 2.2, rotateRange: 40, driftX: 15, driftY: -18 },
  { shape: 'shield', size: 56, color: '#c084fc', glow: '#c084fc', x: '78%', y: '80%', duration: 18, delay: 0.4, rotateRange: 14, driftX: -14, driftY: 22 },
  { shape: 'hexagon', size: 38, color: '#9d4edd', glow: '#9d4edd', x: '15%', y: '45%', duration: 13, delay: 3.1, rotateRange: 28, driftX: 22, driftY: 20 },
  { shape: 'octagon', size: 24, color: '#fde68a', glow: '#f5c842', x: '50%', y: '3%', duration: 10, delay: 1.0, rotateRange: 50, driftX: 10, driftY: 18 },
  { shape: 'diamond', size: 40, color: '#6d28d9', glow: '#7b2ff7', x: '60%', y: '88%', duration: 15, delay: 2.8, rotateRange: 20, driftX: -18, driftY: -24 },
  { shape: 'shield', size: 30, color: '#f5c842', glow: '#f5c842', x: '35%', y: '92%', duration: 11, delay: 0.6, rotateRange: 32, driftX: 12, driftY: -16 },
  { shape: 'hexagon', size: 20, color: '#c084fc', glow: '#c084fc', x: '70%', y: '20%', duration: 9, delay: 4.0, rotateRange: 60, driftX: -8, driftY: 14 },
  { shape: 'diamond', size: 18, color: '#f5c842', glow: '#f5c842', x: '22%', y: '18%', duration: 8, delay: 1.8, rotateRange: 55, driftX: 16, driftY: 12 },
  { shape: 'octagon', size: 32, color: '#9d4edd', glow: '#9d4edd', x: '82%', y: '38%', duration: 17, delay: 3.5, rotateRange: 24, driftX: -10, driftY: -20 },
];

/* ── AmethystLogo SVG ── */
const AmethystLogo = () => (
  <svg width="44" height="44" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 12px #9d4edd) drop-shadow(0 0 28px rgba(157,78,221,0.5))' }}>
    <defs>
      <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5c842" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7b2ff7" />
      </linearGradient>
    </defs>
    <polygon points="50,4 88,28 88,72 50,96 12,72 12,28" fill="url(#logo-g)" opacity="0.95" />
    <polygon points="50,4 88,28 50,50" fill="white" fillOpacity="0.2" />
    <polygon points="12,28 50,50 12,72" fill="black" fillOpacity="0.15" />
    <line x1="50" y1="4" x2="50" y2="96" stroke="white" strokeWidth="1" strokeOpacity="0.12" />
    <line x1="12" y1="50" x2="88" y2="50" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
  </svg>
);

/* ── CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.am-root {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.am-title { font-family: 'Cinzel', serif; }

.am-card {
  position: relative;
  width: 100%;
  max-width: 410px;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(8, 2, 20, 0.82);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid rgba(157, 78, 221, 0.28);
  box-shadow:
    0 0 0 1px rgba(245,200,66,.07),
    0 0 80px rgba(123,47,247,.18),
    0 0 160px rgba(157,78,221,.08),
    0 40px 100px rgba(0,0,0,.7);
  z-index: 10;
}

.am-input-wrap { position: relative; width: 100%; }
.am-input {
  width: 100%;
  padding: 13px 44px 13px 44px;
  background: rgba(157,78,221,.06);
  border: 1px solid rgba(157,78,221,.18);
  border-radius: 11px;
  outline: none;
  color: #f0eaff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.am-input::placeholder { color: rgba(192,132,252,.25); }
.am-input:focus {
  border-color: rgba(245,200,66,.45);
  background: rgba(245,200,66,.04);
  box-shadow: 0 0 0 3px rgba(245,200,66,.07), 0 0 20px rgba(157,78,221,.1);
}
.am-input-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: rgba(157,78,221,.4); pointer-events: none; transition: color .2s;
}
.am-input-wrap:focus-within .am-input-icon { color: rgba(245,200,66,.6); }
.am-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; padding: 4px;
  color: rgba(157,78,221,.35); transition: color .2s;
}
.am-eye-btn:hover { color: rgba(245,200,66,.7); }

.am-submit {
  width: 100%; padding: 14px; border: none; cursor: pointer;
  border-radius: 11px; font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 800; letter-spacing: .04em;
  background: linear-gradient(135deg, #f5c842 0%, #d4a200 40%, #9d4edd 100%);
  background-size: 220%;
  color: #0a0600;
  box-shadow: 0 0 36px rgba(245,200,66,.3), 0 0 80px rgba(157,78,221,.15), 0 4px 24px rgba(0,0,0,.5);
  transition: transform .18s, box-shadow .2s, background-position .5s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.am-submit:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 56px rgba(245,200,66,.45), 0 0 100px rgba(157,78,221,.25), 0 8px 28px rgba(0,0,0,.6);
  background-position: 100%;
}
.am-submit:active:not(:disabled) { transform: scale(.98); }
.am-submit:disabled { opacity: .35; cursor: not-allowed; }

.am-tab {
  flex: 1; padding: 12px; border: none; cursor: pointer;
  background: transparent; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 800; position: relative;
  transition: color .2s;
}
.am-tab::after {
  content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
  height: 2px; border-radius: 2px; transition: opacity .25s, transform .25s;
  transform: scaleX(0);
}
.am-tab.active { color: #f5c842; }
.am-tab.active::after { background: linear-gradient(90deg,#f5c842,#c084fc); opacity: 1; transform: scaleX(1); }
.am-tab.inactive { color: rgba(192,132,252,.3); }
.am-tab.inactive::after { opacity: 0; transform: scaleX(0); }

.am-guest {
  width: 100%; padding: 12px; cursor: pointer;
  border: 1px solid rgba(157,78,221,.18);
  border-radius: 11px; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 700;
  background: rgba(157,78,221,.05); color: rgba(192,132,252,.45);
  transition: all .2s;
}
.am-guest:hover {
  background: rgba(157,78,221,.12); border-color: rgba(157,78,221,.4); color: #c084fc;
  box-shadow: 0 0 20px rgba(157,78,221,.1);
}

.am-error {
  padding: 10px 14px; border-radius: 10px;
  background: rgba(255,78,106,.08); border: 1px solid rgba(255,78,106,.25);
  color: #ff4e6a; font-size: 12px; font-weight: 700;
}
.am-success {
  padding: 10px 14px; border-radius: 10px;
  background: rgba(157,78,221,.1); border: 1px solid rgba(157,78,221,.3);
  color: #c084fc; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}

@keyframes am-spin { to { transform: rotate(360deg); } }
.am-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(10,6,0,.2); border-top-color: #0a0600;
  animation: am-spin .7s linear infinite;
}

.am-referral-toggle {
  font-size: 11px; font-weight: 700; color: rgba(245,200,66,.4);
  background: none; border: none; cursor: pointer; padding: 0; transition: color .2s;
}
.am-referral-toggle:hover { color: rgba(245,200,66,.8); }

.am-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0; }
.am-divider-line { flex: 1; height: 1px; background: rgba(157,78,221,.12); }
.am-divider-text { font-size: 10px; font-weight: 700; color: rgba(192,132,252,.2); letter-spacing: .14em; text-transform: uppercase; }

.am-forgot {
  font-size: 11px; font-weight: 700; color: rgba(245,200,66,.45);
  background: none; border: none; cursor: pointer; padding: 0; transition: color .2s;
}
.am-forgot:hover { color: #f5c842; }

@keyframes am-scan {
  0%  { top: -1px; opacity: 0; }
  5%  { opacity: .4; }
  95% { opacity: .3; }
  100%{ top: 100%; opacity: 0; }
}
.am-scan {
  position: absolute; left: 0; right: 0; height: 1px; z-index: 20; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(157,78,221,.35), rgba(245,200,66,.2), transparent);
  animation: am-scan 10s linear infinite;
}

/* Gem sparkle inside card */
@keyframes am-sparkle {
  0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
}
`;

const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, showToggle, onToggle, showPw }) => (
  <div className="am-input-wrap">
    <input
      className="am-input"
      type={showToggle ? (showPw ? 'text' : 'password') : type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
    />
    <div className="am-input-icon"><Icon style={{ width: 15, height: 15 }} /></div>
    {showToggle && (
      <button type="button" className="am-eye-btn" onClick={onToggle}>
        {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
      </button>
    )}
  </div>
);

/* ── Tiny sparkle dots inside card header ── */
const CardSparkles = () => {
  const sparks = [
    { x: '12%', y: '18%', size: 6, delay: 0, color: '#f5c842' },
    { x: '88%', y: '12%', size: 4, delay: 1.2, color: '#c084fc' },
    { x: '75%', y: '72%', size: 5, delay: 2.5, color: '#f5c842' },
    { x: '8%', y: '65%', size: 4, delay: 0.7, color: '#9d4edd' },
    { x: '50%', y: '8%', size: 3, delay: 1.9, color: '#f5c842' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: s.x, top: s.y, width: s.size, height: s.size, background: s.color, borderRadius: '50%', boxShadow: `0 0 ${s.size * 3}px ${s.color}` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0] }}
          transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

export default function Authpage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPw] = useState('');
  const [username, setUn] = useState('');
  const [referralCode, setReferral] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = mode === 'signup' ? getStrength(password) : 0;

  useEffect(() => { if (isAuthenticated) navigate('/Home'); }, [isAuthenticated]);

  const switchMode = (m) => {
    setMode(m); setError(''); setEmail(''); setPw(''); setUn('');
    setReferral(''); setShowReferral(false); setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (mode === 'signup' && !username.trim()) { setError('Username is required'); return; }
    if (mode === 'signup' && strength < 2) { setError('Password is too weak'); return; }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await base44.auth.loginViaEmailPassword(email, password);
        window.location.reload();
      } else {
        await base44.auth.register({ email, password, full_name: username });
        await syncBase44User({ email, full_name: username, username, referred_by: referralCode });
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch (err) {
      const msg = err?.message || err?.error || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('Incorrect email or password.');
      } else if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('already')) {
        setError('An account with this email already exists.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('Password must be at least 8 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => navigate('/Home');

  return (
    <div className="am-root">
      <style>{CSS}</style>

      {/* Floating gems — fixed to page, behind card */}
      {GEMS_DATA.map((gem, i) => (
        <FloatingGem key={i} {...gem} />
      ))}

      {/* Card */}
      <motion.div
        className="am-card"
        initial={{ opacity: 0, y: 32, scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 }}
      >
        <div className="am-scan" />
        <CardSparkles />

        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#9d4edd,#f5c842,#9d4edd,transparent)' }} />

        {/* Header */}
        <div style={{ padding: '30px 28px 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            style={{ display: 'inline-block', marginBottom: 14 }}
          >
            <AmethystLogo />
          </motion.div>

          <motion.h1
            className="am-title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '.12em',
              marginBottom: 4,
              background: 'linear-gradient(135deg, #f5c842 20%, #c084fc 60%, #9d4edd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AMETHYST.GG
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 11, color: 'rgba(192,132,252,.45)', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}
          >
            {mode === 'signin' ? '✦ Welcome back, player ✦' : '✦ Join the arena ✦'}
          </motion.p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '22px 28px 0', borderBottom: '1px solid rgba(157,78,221,.15)', position: 'relative', zIndex: 2 }}>
          <button className={`am-tab ${mode === 'signin' ? 'active' : 'inactive'}`} onClick={() => switchMode('signin')}>Sign In</button>
          <button className={`am-tab ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => switchMode('signup')}>Sign Up</button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 28px 28px', position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
              transition={{ duration: .2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Field icon={User} placeholder="Username" value={username} onChange={setUn} />
                </motion.div>
              )}

              <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field icon={Lock} placeholder="Password" value={password} onChange={setPw} showToggle showPw={showPw} onToggle={() => setShowPw(v => !v)} />
                {mode === 'signup' && password.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 3,
                          background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(157,78,221,.12)',
                          transition: 'background .3s',
                          boxShadow: i <= strength ? `0 0 6px ${STRENGTH_COLORS[strength]}` : 'none',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: STRENGTH_COLORS[strength] || 'rgba(192,132,252,.25)', letterSpacing: '.06em' }}>
                      {STRENGTH_LABELS[strength] || 'Enter a password'}
                    </span>
                  </motion.div>
                )}
              </div>

              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button type="button" className="am-referral-toggle" onClick={() => setShowReferral(v => !v)}>
                    {showReferral ? '▾ Hide referral code' : '▸ Have a referral code?'}
                  </button>
                  <AnimatePresence>
                    {showReferral && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Field icon={User} placeholder="Referral code (optional)" value={referralCode} onChange={setReferral} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {mode === 'signin' && (
                <div style={{ textAlign: 'right' }}>
                  <button type="button" className="am-forgot">Forgot password?</button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div className="am-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {success && (
                  <motion.div className="am-success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <span style={{ fontSize: 16 }}>💎</span> Account created! Welcome to Amethyst.
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="am-submit"
                disabled={loading}
                whileTap={{ scale: .97 }}
                style={{ marginTop: 4 }}
              >
                {loading ? <div className="am-spinner" /> : (
                  <>{mode === 'signin' ? 'Sign In' : 'Create Account'}<ArrowRight style={{ width: 16, height: 16 }} /></>
                )}
              </motion.button>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(192,132,252,.2)', fontWeight: 600, marginTop: 4 }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5c842', fontWeight: 800, fontFamily: 'DM Sans,sans-serif', fontSize: 12 }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(157,78,221,.18)', fontWeight: 600, marginTop: 2 }}>
                💎 Secured by Amethyst
              </p>
            </motion.form>
          </AnimatePresence>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,78,221,.25),transparent)' }} />
      </motion.div>
    </div>
  );
}