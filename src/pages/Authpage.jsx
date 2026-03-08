import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/* ─── base44 entity shorthand ────────────────────────────────────── */
const Users = base44.entities.User;

/* ─── helpers ────────────────────────────────────────────────────── */
function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CR-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* ─── password strength ──────────────────────────────────────────── */
const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ff4e6a', '#fbbf24', '#34d399', '#00e5a0'];

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.auth-root {
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

.auth-title { font-family: 'Cinzel', serif; }

/* ── Floating gems ── */
@keyframes gem-float {
  0%    { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%   { opacity: var(--gem-opacity, 0.7); }
  90%   { opacity: var(--gem-opacity, 0.5); }
  100%  { transform: translateY(var(--gem-dy,-80px)) translateX(var(--gem-dx,0px)) rotate(var(--gem-rot,30deg)); opacity: 0; }
}
.auth-gem {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  animation: gem-float var(--gem-d,12s) ease-in-out infinite var(--gem-delay,0s);
}

/* ── Scan line ── */
@keyframes auth-scan {
  0%   { top:-1px; opacity:0; }
  5%   { opacity:.4; }
  95%  { opacity:.3; }
  100% { top:100%; opacity:0; }
}
.auth-scan {
  position: absolute; left:0; right:0; height:1px; z-index:10; pointer-events:none;
  background: linear-gradient(90deg,transparent,rgba(157,78,221,.4),rgba(245,200,66,.2),transparent);
  animation: auth-scan 10s linear infinite;
}

/* ── Card sparkle dots ── */
@keyframes sparkle-pop {
  0%,100% { opacity:0; transform:scale(0); }
  50%     { opacity:1; transform:scale(1.3); }
}
.auth-sparkle {
  position:absolute; border-radius:50%; pointer-events:none;
  animation: sparkle-pop 2.4s ease-in-out infinite;
}

/* ── Card ── */
.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(8,2,20,0.84);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid rgba(157,78,221,.28);
  box-shadow:
    0 0 0 1px rgba(245,200,66,.06),
    0 0 80px rgba(123,47,247,.2),
    0 0 180px rgba(157,78,221,.08),
    0 40px 100px rgba(0,0,0,.8);
  z-index: 10;
}

/* ── Inputs ── */
.auth-input-wrap { position:relative; width:100%; }
.auth-input {
  width:100%; padding:13px 44px 13px 44px;
  background: rgba(157,78,221,.06);
  border: 1px solid rgba(157,78,221,.18);
  border-radius:12px; outline:none; color:#f0eaff;
  font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.auth-input::placeholder { color: rgba(192,132,252,.25); }
.auth-input:focus {
  border-color: rgba(245,200,66,.45);
  background: rgba(245,200,66,.04);
  box-shadow: 0 0 0 3px rgba(245,200,66,.07), 0 0 20px rgba(157,78,221,.1);
}
.auth-input.error {
  border-color: rgba(255,78,106,.4);
  background: rgba(255,78,106,.04);
}
.auth-input-icon {
  position:absolute; left:14px; top:50%; transform:translateY(-50%);
  color:rgba(157,78,221,.4); pointer-events:none; transition:color .2s;
}
.auth-input-wrap:focus-within .auth-input-icon { color: rgba(245,200,66,.6); }
.auth-eye-btn {
  position:absolute; right:12px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; padding:4px;
  color:rgba(157,78,221,.35); transition:color .2s;
}
.auth-eye-btn:hover { color:rgba(245,200,66,.7); }

/* ── Submit button ── */
.auth-submit {
  width:100%; padding:14px; border:none; cursor:pointer; border-radius:12px;
  font-family:'DM Sans',sans-serif; font-size:15px; font-weight:900; letter-spacing:.04em;
  background: linear-gradient(135deg,#f5c842 0%,#d4a200 40%,#9d4edd 100%);
  background-size:220%; color:#0a0600;
  box-shadow: 0 0 36px rgba(245,200,66,.3), 0 0 80px rgba(157,78,221,.15), 0 4px 24px rgba(0,0,0,.5);
  transition: transform .18s, box-shadow .2s, background-position .5s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.auth-submit:hover:not(:disabled) {
  transform:translateY(-2px) scale(1.02);
  box-shadow: 0 0 56px rgba(245,200,66,.45), 0 0 100px rgba(157,78,221,.25), 0 8px 28px rgba(0,0,0,.6);
  background-position:100%;
}
.auth-submit:active:not(:disabled) { transform:scale(.98); }
.auth-submit:disabled { opacity:.35; cursor:not-allowed; }

/* ── Tab toggle ── */
.auth-tab {
  flex:1; padding:12px; border:none; cursor:pointer;
  background:transparent; font-family:'DM Sans',sans-serif;
  font-size:13px; font-weight:800; transition:color .2s; position:relative;
}
.auth-tab::after {
  content:''; position:absolute; bottom:0; left:20%; right:20%;
  height:2px; border-radius:2px; transition:opacity .25s, transform .25s; transform:scaleX(0);
}
.auth-tab.active { color:#f5c842; }
.auth-tab.active::after { background:linear-gradient(90deg,#f5c842,#c084fc); opacity:1; transform:scaleX(1); }
.auth-tab.inactive { color:rgba(192,132,252,.3); }
.auth-tab.inactive::after { opacity:0; transform:scaleX(0); }

/* ── Guest button ── */
.auth-guest {
  width:100%; padding:12px; cursor:pointer;
  border:1px solid rgba(157,78,221,.18); border-radius:12px;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700;
  background:rgba(157,78,221,.05); color:rgba(192,132,252,.45); transition:all .2s;
}
.auth-guest:hover {
  background:rgba(157,78,221,.12); border-color:rgba(157,78,221,.4); color:#c084fc;
  box-shadow:0 0 20px rgba(157,78,221,.1);
}

/* ── Error / success ── */
.auth-error {
  padding:10px 14px; border-radius:10px;
  background:rgba(255,78,106,.08); border:1px solid rgba(255,78,106,.25);
  color:#ff4e6a; font-size:12px; font-weight:700;
}
.auth-success {
  padding:10px 14px; border-radius:10px;
  background:rgba(157,78,221,.1); border:1px solid rgba(157,78,221,.3);
  color:#c084fc; font-size:12px; font-weight:700;
  display:flex; align-items:center; gap:8px;
}

/* ── Spinner ── */
@keyframes auth-spin { to { transform:rotate(360deg); } }
.auth-spinner {
  width:16px; height:16px; border-radius:50%;
  border:2px solid rgba(10,6,0,.2); border-top-color:#0a0600;
  animation:auth-spin .7s linear infinite;
}

/* ── Logo glow ── */
@keyframes auth-logo-glow {
  0%,100% { filter:drop-shadow(0 0 8px rgba(157,78,221,.5)) drop-shadow(0 0 16px rgba(245,200,66,.2)); }
  50%     { filter:drop-shadow(0 0 20px rgba(157,78,221,.9)) drop-shadow(0 0 40px rgba(245,200,66,.35)); }
}
.auth-logo { animation:auth-logo-glow 2.5s ease-in-out infinite; }

/* ── Referral toggle ── */
.auth-referral-toggle {
  font-size:11px; font-weight:700; color:rgba(245,200,66,.4);
  background:none; border:none; cursor:pointer; padding:0; transition:color .2s; text-align:left;
}
.auth-referral-toggle:hover { color:rgba(245,200,66,.8); }

/* ── Divider ── */
.auth-divider { display:flex; align-items:center; gap:12px; margin:4px 0; }
.auth-divider-line { flex:1; height:1px; background:rgba(157,78,221,.12); }
.auth-divider-text { font-size:10px; font-weight:700; color:rgba(192,132,252,.2); letter-spacing:.14em; text-transform:uppercase; }

/* ── Badge ── */
.auth-badge { text-align:center; font-size:10px; color:rgba(157,78,221,.2); font-weight:600; margin-top:2px; }

/* ── Forgot password ── */
.auth-forgot {
  font-size:11px; font-weight:700; color:rgba(245,200,66,.45);
  background:none; border:none; cursor:pointer; padding:0; transition:color .2s;
}
.auth-forgot:hover { color:#f5c842; }

/* ── Verify code input ── */
.auth-verify-input {
  text-align:center !important;
  font-size:26px !important;
  font-weight:900 !important;
  letter-spacing:.4em !important;
  padding-left:14px !important;
  padding-right:14px !important;
  font-family:'Cinzel',serif !important;
  color:#f5c842 !important;
  border-color:rgba(245,200,66,.25) !important;
}
.auth-verify-input:focus {
  border-color:rgba(245,200,66,.55) !important;
  box-shadow:0 0 0 3px rgba(245,200,66,.08), 0 0 24px rgba(157,78,221,.15) !important;
}
`;

/* ── Gem SVG ── */
const GemSVG = ({ size, color, glow, shape = 'hex' }) => {
  const pts =
    shape === 'diamond' ? '50,5 90,35 70,95 30,95 10,35' :
    shape === 'oct'     ? '35,5 65,5 95,35 95,65 65,95 35,95 5,65 5,35' :
                          '50,4 88,28 88,72 50,96 12,72 12,28';
  const id = `gg-${color.replace('#','')}-${shape}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter:`drop-shadow(0 0 ${size*.28}px ${glow})` }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fff"    stopOpacity="0.45" />
          <stop offset="45%"  stopColor={color}   stopOpacity="0.88" />
          <stop offset="100%" stopColor="#0a001e" stopOpacity="0.8"  />
        </linearGradient>
      </defs>
      <polygon points={pts} fill={`url(#${id})`} stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
      <polygon points={shape === 'diamond' ? '50,5 90,35 50,50' : '50,4 88,28 50,50'} fill="white" fillOpacity="0.12" />
    </svg>
  );
};

const GEMS = [
  { size:52, color:'#9d4edd', glow:'#9d4edd', shape:'hex',     x:'5%',  y:'8%',  d:'14s', delay:'0s',    dy:'-40px', dx:'18px',  rot:'22deg',  o:0.7  },
  { size:34, color:'#f5c842', glow:'#f5c842', shape:'diamond', x:'88%', y:'5%',  d:'11s', delay:'-3s',   dy:'30px',  dx:'-12px', rot:'-30deg', o:0.65 },
  { size:44, color:'#7b2ff7', glow:'#7b2ff7', shape:'oct',     x:'91%', y:'55%', d:'16s', delay:'-1s',   dy:'-32px', dx:'-20px', rot:'18deg',  o:0.6  },
  { size:28, color:'#f5c842', glow:'#d4a800', shape:'diamond', x:'3%',  y:'70%', d:'12s', delay:'-5s',   dy:'-22px', dx:'14px',  rot:'40deg',  o:0.55 },
  { size:56, color:'#c084fc', glow:'#c084fc', shape:'hex',     x:'78%', y:'80%', d:'18s', delay:'-2s',   dy:'28px',  dx:'-14px', rot:'-14deg', o:0.7  },
  { size:38, color:'#9d4edd', glow:'#9d4edd', shape:'oct',     x:'15%', y:'45%', d:'13s', delay:'-7s',   dy:'26px',  dx:'22px',  rot:'28deg',  o:0.5  },
  { size:24, color:'#fde68a', glow:'#f5c842', shape:'diamond', x:'50%', y:'3%',  d:'10s', delay:'-4s',   dy:'20px',  dx:'10px',  rot:'50deg',  o:0.6  },
  { size:40, color:'#6d28d9', glow:'#7b2ff7', shape:'hex',     x:'60%', y:'88%', d:'15s', delay:'-6s',   dy:'-28px', dx:'-18px', rot:'-20deg', o:0.55 },
  { size:20, color:'#c084fc', glow:'#c084fc', shape:'oct',     x:'70%', y:'20%', d:'9s',  delay:'-8s',   dy:'16px',  dx:'-8px',  rot:'60deg',  o:0.5  },
  { size:18, color:'#f5c842', glow:'#f5c842', shape:'diamond', x:'22%', y:'18%', d:'8s',  delay:'-1.5s', dy:'14px',  dx:'16px',  rot:'55deg',  o:0.55 },
  { size:32, color:'#9d4edd', glow:'#9d4edd', shape:'hex',     x:'82%', y:'38%', d:'17s', delay:'-9s',   dy:'-24px', dx:'-10px', rot:'24deg',  o:0.5  },
];

const FloatingGems = () => (
  <>
    {GEMS.map((g, i) => (
      <div key={i} className="auth-gem" style={{
        left:g.x, top:g.y,
        '--gem-d':g.d, '--gem-delay':g.delay,
        '--gem-dy':g.dy, '--gem-dx':g.dx,
        '--gem-rot':g.rot, '--gem-opacity':g.o,
      }}>
        <GemSVG size={g.size} color={g.color} glow={g.glow} shape={g.shape} />
      </div>
    ))}
  </>
);

/* ── Card sparkles ── */
const SPARKS = [
  { x:'10%', y:'15%', size:5, delay:'0s',    color:'#f5c842' },
  { x:'88%', y:'10%', size:4, delay:'-1.2s', color:'#c084fc' },
  { x:'76%', y:'70%', size:5, delay:'-2.5s', color:'#f5c842' },
  { x:'7%',  y:'62%', size:4, delay:'-0.7s', color:'#9d4edd' },
  { x:'50%', y:'6%',  size:3, delay:'-1.9s', color:'#f5c842' },
];
const CardSparkles = () => (
  <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:1 }}>
    {SPARKS.map((s,i) => (
      <div key={i} className="auth-sparkle" style={{
        left:s.x, top:s.y, width:s.size, height:s.size,
        background:s.color, boxShadow:`0 0 ${s.size*3}px ${s.color}`,
        animationDelay:s.delay,
      }} />
    ))}
  </div>
);

/* ── Logo ── */
const AmethystLogo = () => (
  <svg width="46" height="46" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="am-logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#f5c842" />
        <stop offset="50%"  stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7b2ff7" />
      </linearGradient>
    </defs>
    <polygon points="50,4 88,28 88,72 50,96 12,72 12,28" fill="url(#am-logo-g)" opacity="0.95" />
    <polygon points="50,4 88,28 50,50" fill="white" fillOpacity="0.2" />
    <polygon points="12,28 50,50 12,72" fill="black" fillOpacity="0.15" />
    <line x1="50" y1="4" x2="50" y2="96" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
    <line x1="12" y1="50" x2="88" y2="50" stroke="white" strokeWidth="1" strokeOpacity="0.08" />
  </svg>
);

/* ─── Field component ────────────────────────────────────────────── */
const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, showToggle, onToggle, showPw }) => (
  <div className="auth-input-wrap">
    <input
      className="auth-input"
      type={showToggle ? (showPw ? 'text' : 'password') : type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
    />
    <div className="auth-input-icon">
      <Icon style={{ width:15, height:15 }} />
    </div>
    {showToggle && (
      <button type="button" className="auth-eye-btn" onClick={onToggle}>
        {showPw ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
      </button>
    )}
  </div>
);

/* ─── Main ───────────────────────────────────────────────────────── */
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

  // Already logged in → go home
  useEffect(() => {
    if (isAuthenticated) navigate('/Home');
  }, [isAuthenticated]);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setEmail('');
    setPw('');
    setUn('');
    setReferral('');
    setShowReferral(false);
    setSuccess(false);
    setVerifyStep(false);
    setVerifyCode('');
    setPendingEmail('');
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
      const msg = err?.message || err?.error || 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim())                         { setError('Email is required'); return; }
    if (!password)                             { setError('Password is required'); return; }
    if (mode === 'signup' && strength < 2)     { setError('Password is too weak'); return; }

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
    <div className="auth-root">
      <style>{CSS}</style>

      {/* Floating gems */}
      <FloatingGems />

      {/* Card */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 28, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div className="auth-scan" />
        <CardSparkles />

        {/* Top accent bar */}
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,#9d4edd,#f5c842,#9d4edd,transparent)' }} />

        {/* Logo */}
        <div style={{ padding:'28px 28px 0', textAlign:'center', position:'relative', zIndex:2 }}>
          <motion.div
            className="auth-logo"
            initial={{ scale:0.6, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ type:'spring', stiffness:300, damping:20, delay:0.15 }}
            style={{ display:'inline-block', marginBottom:14 }}
          >
            <AmethystLogo />
          </motion.div>

          <motion.h1
            className="auth-title"
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.25 }}
            style={{
              fontSize:26, fontWeight:900, letterSpacing:'.12em', marginBottom:4,
              background:'linear-gradient(135deg,#f5c842 20%,#c084fc 60%,#9d4edd 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}
          >
            AMETHYST.GG
          </motion.h1>

          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.35 }}
            style={{ fontSize:11, color:'rgba(192,132,252,.45)', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase' }}
          >
            {verifyStep ? '✦ Check your inbox ✦' : mode === 'signin' ? '✦ Welcome back, player ✦' : '✦ Join the arena ✦'}
          </motion.p>
        </div>

        {/* Tabs — hidden during verify */}
        {!verifyStep && (
          <div style={{ display:'flex', margin:'22px 28px 0', borderBottom:'1px solid rgba(157,78,221,.15)', position:'relative', zIndex:2 }}>
            <button className={`auth-tab ${mode === 'signin' ? 'active' : 'inactive'}`} onClick={() => switchMode('signin')}>Sign In</button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>
        )}

        {/* Form area */}
        <div style={{ padding:'24px 28px 28px', position:'relative', zIndex:2 }}>
          <AnimatePresence mode="wait">

            {/* ── Verify email step ── */}
            {verifyStep ? (
              <motion.form
                key="verify"
                onSubmit={handleVerify}
                initial={{ opacity:0, x:18 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-18 }}
                transition={{ duration:.22 }}
                style={{ display:'flex', flexDirection:'column', gap:14 }}
              >
                <motion.div
                  initial={{ scale:0.7, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  transition={{ type:'spring', stiffness:280, damping:20 }}
                  style={{ textAlign:'center', marginBottom:4 }}
                >
                  <div style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:58, height:58, borderRadius:16, marginBottom:12, fontSize:28,
                    background:'linear-gradient(135deg,rgba(157,78,221,.2),rgba(245,200,66,.1))',
                    border:'1px solid rgba(245,200,66,.25)',
                    boxShadow:'0 0 30px rgba(157,78,221,.2)',
                  }}>📧</div>
                  <p style={{ fontSize:14, fontWeight:800, color:'#f0eaff', marginBottom:6, fontFamily:'Cinzel,serif', letterSpacing:'.04em' }}>
                    Check your email
                  </p>
                  <p style={{ fontSize:12, color:'rgba(192,132,252,.4)', fontWeight:600, lineHeight:1.6 }}>
                    We sent a verification code to
                  </p>
                  <p style={{ fontSize:12, color:'#f5c842', fontWeight:800, marginTop:4, letterSpacing:'.04em' }}>
                    {pendingEmail}
                  </p>
                </motion.div>

                <div className="auth-input-wrap">
                  <input
                    className="auth-input auth-verify-input"
                    type="text"
                    placeholder="• • • • • •"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value)}
                    autoComplete="one-time-code"
                    maxLength={8}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div className="auth-error" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div className="auth-success" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                      <span style={{ fontSize:16 }}>💎</span>
                      Account verified! Welcome to the arena.
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale:.98 }} style={{ marginTop:4 }}>
                  {loading ? <div className="auth-spinner" /> : <>Verify Email <ArrowRight style={{ width:16, height:16 }} /></>}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { setVerifyStep(false); setError(''); setVerifyCode(''); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(192,132,252,.3)', fontWeight:700, fontSize:12, fontFamily:'DM Sans,sans-serif', textAlign:'center', transition:'color .2s' }}
                  onMouseOver={e => e.currentTarget.style.color='rgba(192,132,252,.7)'}
                  onMouseOut={e => e.currentTarget.style.color='rgba(192,132,252,.3)'}
                >
                  ← Back
                </button>
              </motion.form>

            ) : (

            /* ── Main sign in / sign up form ── */
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity:0, x:mode === 'signup' ? 18 : -18 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:mode === 'signup' ? -18 : 18 }}
              transition={{ duration:.22 }}
              style={{ display:'flex', flexDirection:'column', gap:12 }}
            >
              {/* Email */}
              <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />

              {/* Password + strength bar */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <Field icon={Lock} placeholder="Password" value={password} onChange={setPw} showToggle showPw={showPw} onToggle={() => setShowPw(v => !v)} />
                {mode === 'signup' && password.length > 0 && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex:1, height:3, borderRadius:3,
                          background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(157,78,221,.12)',
                          transition:'background .3s',
                          boxShadow: i <= strength ? `0 0 6px ${STRENGTH_COLORS[strength]}` : 'none',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:STRENGTH_COLORS[strength]||'rgba(192,132,252,.25)', letterSpacing:'.06em' }}>
                      {STRENGTH_LABELS[strength] || 'Enter a password'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Referral code — signup only */}
              {mode === 'signup' && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <button type="button" className="auth-referral-toggle" onClick={() => setShowReferral(v => !v)}>
                    {showReferral ? '▾ Hide referral code' : '▸ Have a referral code?'}
                  </button>
                  <AnimatePresence>
                    {showReferral && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                        <Field icon={Sparkles} placeholder="Referral code (optional)" value={referralCode} onChange={setReferral} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Forgot password — signin only */}
              {mode === 'signin' && (
                <div style={{ textAlign:'right' }}>
                  <button type="button" className="auth-forgot">Forgot password?</button>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div className="auth-error" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale:.98 }} style={{ marginTop:4 }}>
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>{mode === 'signin' ? 'Sign In' : 'Create Account'}<ArrowRight style={{ width:16, height:16 }} /></>
                )}
              </motion.button>

              {/* Divider */}
              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <div className="auth-divider-line" />
              </div>

              {/* Guest */}
              <button type="button" className="auth-guest" onClick={handleGuest}>
                👻 Continue as Guest
              </button>

              {/* Switch mode */}
              <p style={{ textAlign:'center', fontSize:12, color:'rgba(192,132,252,.25)', fontWeight:600, marginTop:4 }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#f5c842', fontWeight:800, fontFamily:'DM Sans,sans-serif', fontSize:12 }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              <p className="auth-badge">💎 Secured by Amethyst</p>

            </motion.form>
            )}

          </AnimatePresence>
        </div>

        {/* Bottom accent */}
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(157,78,221,.25),transparent)' }} />
      </motion.div>
    </div>
  );
}