import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Gem } from 'lucide-react';
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

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#f87171', '#fb923c', '#a78bfa', '#c084fc'];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --am-violet: #7c3aed;
  --am-purple: #9333ea;
  --am-amethyst: #a855f7;
  --am-lavender: #c084fc;
  --am-pale: #e9d5ff;
  --am-dark: #0a0212;
  --am-darker: #060010;
  --am-mid: #120824;
  --am-card: #0e0620;
  --am-glow: rgba(168,85,247,.35);
  --am-border: rgba(168,85,247,.2);
}

.am-root {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: var(--am-darker);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* ── Crystal SVG background ── */
.am-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ── Gradient mesh ── */
.am-mesh {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at 15% 20%, rgba(109,40,217,.25) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 85% 80%, rgba(147,51,234,.2) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(76,29,149,.15) 0%, transparent 60%),
    radial-gradient(ellipse 80% 30% at 50% 0%, rgba(124,58,237,.12) 0%, transparent 70%);
}

/* ── Crystal shards in background ── */
.am-shard {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

@keyframes am-float {
  0%,100% { transform: translateY(0px) rotate(var(--r)) scale(1); opacity: var(--op); }
  50% { transform: translateY(-18px) rotate(calc(var(--r) + 3deg)) scale(1.04); opacity: calc(var(--op) * 1.3); }
}

@keyframes am-shimmer {
  0%,100% { filter: drop-shadow(0 0 6px rgba(168,85,247,.3)); }
  50% { filter: drop-shadow(0 0 18px rgba(168,85,247,.7)) drop-shadow(0 0 32px rgba(192,132,252,.3)); }
}

/* ── Grid lines ── */
.am-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(124,58,237,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%);
}

/* ── Noise ── */
.am-noise {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 120px;
  mix-blend-mode: overlay;
  opacity: .03;
}

/* ── Orbiting particles ── */
@keyframes am-orbit {
  from { transform: rotate(0deg) translateX(var(--radius)) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg); }
}
.am-orb-particle {
  position: absolute;
  border-radius: 50%;
  animation: am-orbit var(--dur) linear infinite var(--delay);
  top: 50%;
  left: 50%;
  margin: -2px;
}

/* ── Scan line ── */
@keyframes am-scan {
  0%   { top: -1px; opacity: 0; }
  5%   { opacity: .3; }
  95%  { opacity: .3; }
  100% { top: 100%; opacity: 0; }
}
.am-scan {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(192,132,252,.3), transparent);
  animation: am-scan 10s linear infinite;
  z-index: 10;
  pointer-events: none;
}

/* ── Card ── */
.am-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(170deg, rgba(18,8,36,.95) 0%, rgba(14,6,32,.98) 60%, rgba(6,0,16,1) 100%);
  border: 1px solid rgba(168,85,247,.22);
  box-shadow:
    0 0 0 1px rgba(168,85,247,.07),
    0 0 80px rgba(124,58,237,.18),
    0 0 160px rgba(109,40,217,.1),
    inset 0 1px 0 rgba(192,132,252,.1),
    0 40px 100px rgba(0,0,0,.9);
  z-index: 10;
  backdrop-filter: blur(20px);
}

/* ── Card inner glow ── */
.am-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(168,85,247,.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ── Logo gem ── */
@keyframes am-gem-pulse {
  0%,100% {
    filter: drop-shadow(0 0 8px rgba(168,85,247,.5)) drop-shadow(0 0 20px rgba(124,58,237,.3));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(192,132,252,.8)) drop-shadow(0 0 40px rgba(168,85,247,.5)) drop-shadow(0 0 60px rgba(124,58,237,.2));
  }
}
.am-gem { animation: am-gem-pulse 3s ease-in-out infinite; }

/* ── Inputs ── */
.am-field {
  position: relative;
  width: 100%;
}
.am-input {
  width: 100%;
  padding: 13px 44px 13px 42px;
  background: rgba(109,40,217,.06);
  border: 1px solid rgba(168,85,247,.15);
  border-radius: 14px;
  outline: none;
  color: #e9d5ff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all .2s;
  letter-spacing: .01em;
}
.am-input::placeholder { color: rgba(196,168,232,.25); }
.am-input:focus {
  border-color: rgba(168,85,247,.5);
  background: rgba(168,85,247,.08);
  box-shadow: 0 0 0 3px rgba(168,85,247,.08), 0 0 20px rgba(124,58,237,.15);
}
.am-input-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(196,168,232,.25);
  pointer-events: none;
  transition: color .2s;
}
.am-field:focus-within .am-input-icon { color: rgba(192,132,252,.6); }
.am-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(196,168,232,.2);
  transition: color .2s;
}
.am-eye:hover { color: rgba(192,132,252,.7); }

/* ── Submit button ── */
.am-submit {
  width: 100%;
  padding: 14px;
  border: none;
  cursor: pointer;
  border-radius: 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .02em;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #a855f7 70%, #7c3aed 100%);
  background-size: 200%;
  color: #f3e8ff;
  box-shadow: 0 0 0 1px rgba(192,132,252,.2), 0 4px 24px rgba(124,58,237,.5), 0 0 60px rgba(124,58,237,.2);
  transition: transform .18s, box-shadow .18s, background-position .5s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.am-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%);
  transform: translateX(-100%);
  transition: transform .4s;
}
.am-submit:hover:not(:disabled)::before { transform: translateX(100%); }
.am-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(192,132,252,.3), 0 8px 32px rgba(124,58,237,.7), 0 0 80px rgba(168,85,247,.3);
  background-position: 100%;
}
.am-submit:active:not(:disabled) { transform: scale(.98); }
.am-submit:disabled { opacity: .35; cursor: not-allowed; }

/* ── Tabs ── */
.am-tab {
  flex: 1;
  padding: 12px;
  border: none;
  cursor: pointer;
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  transition: color .2s;
  position: relative;
  letter-spacing: .03em;
}
.am-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  border-radius: 2px;
  transition: opacity .25s, transform .25s;
  background: linear-gradient(90deg, #7c3aed, #c084fc);
  transform-origin: center;
}
.am-tab.active { color: #c084fc; }
.am-tab.active::after { opacity: 1; transform: scaleX(1); }
.am-tab.inactive { color: rgba(196,168,232,.2); }
.am-tab.inactive::after { opacity: 0; transform: scaleX(0); }



/* ── Alerts ── */
.am-error {
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.2);
  color: #fca5a5;
  font-size: 12px;
  font-weight: 600;
}
.am-success {
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(192,132,252,.1);
  border: 1px solid rgba(192,132,252,.3);
  color: #ddd6fe;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Spinner ── */
@keyframes am-spin { to { transform: rotate(360deg); } }
.am-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(243,232,255,.2);
  border-top-color: #f3e8ff;
  animation: am-spin .7s linear infinite;
}

/* ── Divider ── */
.am-divider { display: flex; align-items: center; gap: 12px; }
.am-divider-line { flex: 1; height: 1px; background: rgba(168,85,247,.08); }
.am-divider-text { font-size: 10px; font-weight: 700; color: rgba(196,168,232,.18); letter-spacing: .14em; text-transform: uppercase; }

/* ── Referral toggle ── */
.am-ref-toggle {
  font-size: 11px;
  font-weight: 600;
  color: rgba(192,132,252,.35);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
  font-family: 'DM Sans', sans-serif;
}
.am-ref-toggle:hover { color: rgba(192,132,252,.75); }

/* ── Forgot ── */
.am-forgot {
  font-size: 11px;
  font-weight: 600;
  color: rgba(192,132,252,.4);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
  font-family: 'DM Sans', sans-serif;
}
.am-forgot:hover { color: rgba(192,132,252,.8); }



/* ── Top gradient bar ── */
.am-topbar {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,.6), rgba(192,132,252,.8), rgba(124,58,237,.6), transparent);
}

/* ── Crystal decorative lines ── */
.am-crystal-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  border-radius: 28px;
}
`;

/* ── Crystal shard SVG paths ── */
const SHARDS = [
  { x: '8%',  y: '12%', w: 60,  h: 120, rx: 14, color: '#4c1d95', op: .18, r: '-22deg', delay: '0s',    dur: '7s'  },
  { x: '88%', y: '8%',  w: 45,  h: 95,  rx: 10, color: '#6d28d9', op: .14, r: '18deg',  delay: '-2s',   dur: '9s'  },
  { x: '5%',  y: '72%', w: 35,  h: 80,  rx: 8,  color: '#7c3aed', op: .12, r: '10deg',  delay: '-4s',   dur: '8s'  },
  { x: '80%', y: '65%', w: 50,  h: 110, rx: 12, color: '#5b21b6', op: .16, r: '-15deg', delay: '-1s',   dur: '11s' },
  { x: '50%', y: '2%',  w: 30,  h: 70,  rx: 7,  color: '#6d28d9', op: .10, r: '5deg',   delay: '-6s',   dur: '10s' },
  { x: '25%', y: '85%', w: 25,  h: 55,  rx: 6,  color: '#4c1d95', op: .09, r: '-8deg',  delay: '-3s',   dur: '12s' },
  { x: '70%', y: '30%', w: 20,  h: 45,  rx: 5,  color: '#7c3aed', op: .08, r: '25deg',  delay: '-5s',   dur: '8s'  },
];

const CrystalBackground = () => (
  <div className="am-bg">
    <div className="am-mesh" />
    <div className="am-grid" />
    {SHARDS.map((s, i) => (
      <div
        key={i}
        className="am-shard"
        style={{
          left: s.x,
          top: s.y,
          '--r': s.r,
          '--op': s.op,
          animation: `am-float ${s.dur} ease-in-out infinite ${s.delay}, am-shimmer ${s.dur} ease-in-out infinite ${s.delay}`,
        }}
      >
        <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`} fill="none">
          {/* Diamond/gem shape */}
          <polygon
            points={`${s.w/2},0 ${s.w},${s.h*0.38} ${s.w*0.75},${s.h} ${s.w*0.25},${s.h} 0,${s.h*0.38}`}
            fill={s.color}
            fillOpacity={s.op * 2.5}
            stroke="rgba(192,132,252,.35)"
            strokeWidth="1"
          />
          {/* Inner highlight */}
          <polygon
            points={`${s.w/2},${s.h*0.08} ${s.w*0.75},${s.h*0.38} ${s.w/2},${s.h*0.6} ${s.w*0.25},${s.h*0.38}`}
            fill="rgba(216,180,254,.06)"
            stroke="rgba(216,180,254,.12)"
            strokeWidth="0.5"
          />
          {/* Top edge gleam */}
          <line x1={s.w/2} y1="0" x2={s.w} y2={s.h*0.38} stroke="rgba(221,214,254,.2)" strokeWidth="0.5"/>
        </svg>
      </div>
    ))}
    <div className="am-noise" />
  </div>
);

/* ── Floating particles ── */
const FloatingDots = () => {
  const dots = useRef(Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 1.5 + Math.random() * 2,
    color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    dur: `${6 + Math.random() * 10}s`,
    delay: `${-Math.random() * 10}s`,
    dx: `${(Math.random() - .5) * 60}px`,
    dy: `${-30 - Math.random() * 60}px`,
  }))).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
      {dots.map(d => (
        <div key={d.id} style={{
          position: 'absolute',
          left: d.left,
          top: d.top,
          width: d.size,
          height: d.size,
          borderRadius: '50%',
          background: d.color,
          boxShadow: `0 0 ${d.size * 3}px ${d.color}`,
          animation: `am-float ${d.dur} ease-in-out infinite ${d.delay}`,
          opacity: .4,
        }}/>
      ))}
    </div>
  );
};

/* ── Field ── */
const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, showToggle, onToggle, showPw }) => (
  <div className="am-field">
    <input
      className="am-input"
      type={showToggle ? (showPw ? 'text' : 'password') : type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
    />
    <div className="am-input-icon">
      <Icon style={{ width: 15, height: 15 }} />
    </div>
    {showToggle && (
      <button type="button" className="am-eye" onClick={onToggle}>
        {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
      </button>
    )}
  </div>
);

/* ── Logo gem SVG ── */
const GemLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="am-gem">
    <polygon points="16,2 28,10 24,28 8,28 4,10" fill="url(#ggrad)" fillOpacity=".9"/>
    <polygon points="16,2 28,10 16,16" fill="rgba(221,214,254,.12)"/>
    <polygon points="16,2 4,10 16,16" fill="rgba(221,214,254,.06)"/>
    <polygon points="16,16 28,10 24,28" fill="rgba(0,0,0,.2)"/>
    <polygon points="16,16 4,10 8,28" fill="rgba(0,0,0,.1)"/>
    <polyline points="16,2 28,10 24,28 8,28 4,10 16,2" stroke="rgba(192,132,252,.6)" strokeWidth="0.8" fill="none"/>
    <defs>
      <linearGradient id="ggrad" x1="4" y1="2" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a855f7"/>
        <stop offset="50%" stopColor="#7c3aed"/>
        <stop offset="100%" stopColor="#4c1d95"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ── Main ── */
export default function Authpage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]                 = useState('signin');
  const [email, setEmail]               = useState('');
  const [password, setPw]               = useState('');
  const [username, setUn]               = useState('');
  const [referralCode, setReferral]     = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [showPw, setShowPw]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [verifyStep, setVerifyStep]     = useState(false);
  const [verifyCode, setVerifyCode]     = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const strength = mode === 'signup' ? getStrength(password) : 0;

  useEffect(() => {
    if (isAuthenticated) navigate('/Home');
  }, [isAuthenticated]);

  const switchMode = (m) => {
    setMode(m); setError(''); setEmail(''); setPw(''); setUn('');
    setReferral(''); setShowReferral(false); setSuccess(false);
    setVerifyStep(false); setVerifyCode(''); setPendingEmail('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!verifyCode.trim()) { setError('Please enter the verification code'); return; }
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email: pendingEmail, otpCode: verifyCode.trim() });
      const { access_token } = await base44.auth.loginViaEmailPassword(pendingEmail, password);
      base44.auth.setToken(access_token, true);
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1800);
    } catch (err) {
      setError(err?.message || err?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim())                     { setError('Email is required'); return; }
    if (!password)                         { setError('Password is required'); return; }
    if (mode === 'signup' && strength < 2) { setError('Password is too weak'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { access_token } = await base44.auth.loginViaEmailPassword(email, password);
        base44.auth.setToken(access_token, true);
        window.location.reload();
      } else {
        await base44.auth.register({ email, password, full_name: username });
        setPendingEmail(email);
        setVerifyStep(true);
      }
    } catch (err) {
      const msg = err?.message || err?.error || 'Something went wrong.';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) setError('Incorrect email or password.');
      else if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('already'))  setError('An account with this email already exists.');
      else if (msg.toLowerCase().includes('password')) setError('Password must be at least 8 characters.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="am-root">
      <style>{CSS}</style>
      <CrystalBackground />
      <FloatingDots />

      <motion.div
        className="am-card"
        initial={{ opacity: 0, y: 32, scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* Crystal line decorations inside card */}
        <div className="am-crystal-lines">
          <svg style={{ position: 'absolute', top: -20, right: -20, opacity: .06 }} width="200" height="200" viewBox="0 0 200 200">
            <polygon points="100,10 180,70 150,170 50,170 20,70" stroke="rgba(192,132,252,1)" strokeWidth="1" fill="none"/>
            <polygon points="100,30 160,78 136,158 64,158 40,78" stroke="rgba(192,132,252,1)" strokeWidth="0.5" fill="none"/>
          </svg>
          <svg style={{ position: 'absolute', bottom: -20, left: -20, opacity: .05 }} width="160" height="160" viewBox="0 0 160 160">
            <polygon points="80,8 144,56 120,136 40,136 16,56" stroke="rgba(167,139,250,1)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        <div className="am-scan" />
        <div className="am-topbar" />

        {/* Logo */}
        <div style={{ padding: '28px 28px 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 62,
            height: 62,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(124,58,237,.2), rgba(76,29,149,.15))',
            border: '1px solid rgba(168,85,247,.25)',
            marginBottom: 14,
            position: 'relative',
          }}>
            {/* Corner gem glints */}
            <div style={{ position: 'absolute', top: 6, right: 6, width: 3, height: 3, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 6px #c084fc' }}/>
            <GemLogo />
          </div>

          {/* Title */}
          <div style={{ marginBottom: 6 }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '.12em',
              background: 'linear-gradient(135deg, #ddd6fe 0%, #c084fc 40%, #a855f7 70%, #ddd6fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              lineHeight: 1,
            }}>
              AMETHYST
            </h1>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              fontWeight: 400,
              color: 'rgba(192,132,252,.5)',
              letterSpacing: '.15em',
              display: 'block',
              marginTop: 3,
            }}>.GG</span>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(196,168,232,.28)', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            {mode === 'signin' ? 'Welcome back, summoner' : 'Enter the crystal arena'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '20px 28px 0', borderBottom: '1px solid rgba(168,85,247,.08)', position: 'relative', zIndex: 2 }}>
          <button className={`am-tab ${mode === 'signin' ? 'active' : 'inactive'}`} onClick={() => switchMode('signin')}>Sign In</button>
          <button className={`am-tab ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => switchMode('signup')}>Sign Up</button>
        </div>

        {/* Form */}
        <div style={{ padding: '22px 28px 28px', position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">

            {verifyStep ? (
              <motion.form
                key="verify"
                onSubmit={handleVerify}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: .22 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💎</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#e9d5ff', marginBottom: 4 }}>Check your email</p>
                  <p style={{ fontSize: 12, color: 'rgba(196,168,232,.35)', fontWeight: 500 }}>We sent a verification code to</p>
                  <p style={{ fontSize: 12, color: '#c084fc', fontWeight: 700, marginTop: 2 }}>{pendingEmail}</p>
                </div>

                <div className="am-field">
                  <input
                    className="am-input"
                    type="text"
                    placeholder="· · · · · ·"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value)}
                    autoComplete="one-time-code"
                    maxLength={8}
                    style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: '.35em', paddingLeft: 14, paddingRight: 14 }}
                  />
                </div>

                <AnimatePresence>
                  {error && <motion.div className="am-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>}
                </AnimatePresence>
                <AnimatePresence>
                  {success && <motion.div className="am-success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>💎 Account verified! Welcome to Amethyst.</motion.div>}
                </AnimatePresence>

                <motion.button type="submit" className="am-submit" disabled={loading} whileTap={{ scale: .98 }} style={{ marginTop: 4 }}>
                  {loading ? <div className="am-spinner" /> : <>Verify Email <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </motion.button>

                <button type="button" onClick={() => { setVerifyStep(false); setError(''); setVerifyCode(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,168,232,.2)', fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                  ← Back
                </button>
              </motion.form>

            ) : (

              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: mode === 'signup' ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'signup' ? -18 : 18 }}
                transition={{ duration: .22 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {mode === 'signup' && (
                  <Field icon={User} placeholder="Display name" value={username} onChange={setUn} />
                )}

                <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field icon={Lock} placeholder="Password" value={password} onChange={setPw} showToggle showPw={showPw} onToggle={() => setShowPw(v => !v)} />
                  {mode === 'signup' && password.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(168,85,247,.08)', transition: 'background .3s' }}/>
                        ))}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: STRENGTH_COLORS[strength] || 'rgba(196,168,232,.25)', letterSpacing: '.05em' }}>
                        {STRENGTH_LABELS[strength] || 'Enter a password'}
                      </span>
                    </motion.div>
                  )}
                </div>

                {mode === 'signup' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button type="button" className="am-ref-toggle" onClick={() => setShowReferral(v => !v)}>
                      {showReferral ? '▾ Hide referral code' : '▸ Have a referral code?'}
                    </button>
                    <AnimatePresence>
                      {showReferral && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <Field icon={Gem} placeholder="Referral code (optional)" value={referralCode} onChange={setReferral} />
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
                  {error && <motion.div className="am-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>}
                </AnimatePresence>

                <motion.button type="submit" className="am-submit" disabled={loading} whileTap={{ scale: .98 }} style={{ marginTop: 4 }}>
                  {loading ? <div className="am-spinner" /> : (
                    <>{mode === 'signin' ? 'Sign In' : 'Create Account'}<ArrowRight style={{ width: 16, height: 16 }} /></>
                  )}
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(196,168,232,.22)', fontWeight: 500, marginTop: 2 }}>
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>


              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom accent */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,.3), rgba(168,85,247,.4), rgba(124,58,237,.3), transparent)' }}/>
      </motion.div>
    </div>
  );
}