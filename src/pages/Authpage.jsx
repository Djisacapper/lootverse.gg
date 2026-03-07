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

async function syncBase44User({ email, full_name, username = '', referred_by = '' }) {
  let existing = null;
  try {
    const results = await Users.filter({ email });
    if (results?.length > 0) existing = results[0];
  } catch (_) {}

  if (existing) {
    return Users.update(existing.id, { full_name });
  }

  return Users.create({
    email,
    full_name,
    username,
    role: 'user',
    balance: 1000,
    xp: 0,
    level: 1,
    is_anonymous: false,
    affiliate_code: generateAffiliateCode(),
    referred_by,
    total_deposited: 0,
    affiliate_earnings: 0,
    affiliate_earnings_claimable: 0,
    rakeback_instant: 0,
    rakeback_daily: 0,
    rakeback_weekly: 0,
    rakeback_monthly: 0,
    total_rakeback_claimed: 0,
    rakeback_daily_claimed_at: '',
    rakeback_weekly_claimed_at: '',
    rakeback_monthly_claimed_at: '',
  });
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
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.auth-root {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  background: #03000d;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.auth-title { font-family: 'Rajdhani', sans-serif; }

/* ── Animated background orbs ── */
.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  animation: auth-orb-drift 12s ease-in-out infinite;
}
@keyframes auth-orb-drift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(30px,-20px) scale(1.08); }
  66%      { transform: translate(-20px,15px) scale(.94); }
}

/* ── Scan line ── */
@keyframes auth-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.auth-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 10;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(245,200,66,.2), transparent);
  animation: auth-scan 8s linear infinite;
}

/* ── Noise texture ── */
.auth-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px;
  mix-blend-mode: overlay;
  opacity: .04;
}

/* ── Particles ── */
@keyframes auth-particle {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  85%  { opacity: .3; }
  100% { transform: translateY(-120px) translateX(var(--dx)) scale(0); opacity: 0; }
}
.auth-pt {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: auth-particle var(--d) ease-out infinite var(--delay);
}

/* ── Card ── */
.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(160deg, #0d0a1e 0%, #080518 50%, #06030f 100%);
  border: 1px solid rgba(245,200,66,.18);
  box-shadow:
    0 0 0 1px rgba(245,200,66,.06),
    0 0 100px rgba(157,111,255,.1),
    0 30px 80px rgba(0,0,0,.8);
  z-index: 10;
}

/* ── Inputs ── */
.auth-input-wrap {
  position: relative;
  width: 100%;
}
.auth-input {
  width: 100%;
  padding: 13px 44px 13px 44px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  outline: none;
  color: #f0eaff;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.auth-input::placeholder { color: rgba(240,234,255,.2); }
.auth-input:focus {
  border-color: rgba(245,200,66,.4);
  background: rgba(245,200,66,.04);
  box-shadow: 0 0 0 3px rgba(245,200,66,.06);
}
.auth-input.error {
  border-color: rgba(255,78,106,.4);
  background: rgba(255,78,106,.04);
}
.auth-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(240,234,255,.2);
  pointer-events: none;
  transition: color .2s;
}
.auth-input-wrap:focus-within .auth-input-icon { color: rgba(245,200,66,.5); }
.auth-eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(240,234,255,.2);
  transition: color .2s;
}
.auth-eye-btn:hover { color: rgba(245,200,66,.6); }

/* ── Submit button ── */
.auth-submit {
  width: 100%;
  padding: 14px;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .02em;
  background: linear-gradient(135deg, #f5c842 0%, #e8a800 60%, #f5c842 100%);
  background-size: 200%;
  color: #0a0600;
  box-shadow: 0 0 32px rgba(245,200,66,.35), 0 4px 20px rgba(0,0,0,.5);
  transition: transform .18s, box-shadow .18s, background-position .4s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.auth-submit:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 48px rgba(245,200,66,.5), 0 8px 24px rgba(0,0,0,.6);
  background-position: 100%;
}
.auth-submit:active:not(:disabled) { transform: scale(.98); }
.auth-submit:disabled { opacity: .4; cursor: not-allowed; }

/* ── Tab toggle ── */
.auth-tab {
  flex: 1;
  padding: 12px;
  border: none;
  cursor: pointer;
  background: transparent;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 800;
  transition: color .2s;
  position: relative;
}
.auth-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  border-radius: 2px;
  transition: opacity .2s, background .2s;
}
.auth-tab.active { color: #f5c842; }
.auth-tab.active::after { background: #f5c842; opacity: 1; }
.auth-tab.inactive { color: rgba(240,234,255,.25); }
.auth-tab.inactive::after { opacity: 0; }

/* ── Guest button ── */
.auth-guest {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.08);
  cursor: pointer;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255,255,255,.03);
  color: rgba(240,234,255,.4);
  transition: all .2s;
}
.auth-guest:hover {
  background: rgba(157,111,255,.08);
  border-color: rgba(157,111,255,.25);
  color: #c084fc;
}

/* ── Error / success toasts ── */
.auth-error {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255,78,106,.1);
  border: 1px solid rgba(255,78,106,.25);
  color: #ff4e6a;
  font-size: 12px;
  font-weight: 700;
}
.auth-success {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0,229,160,.08);
  border: 1px solid rgba(0,229,160,.25);
  color: #00e5a0;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Spinner ── */
@keyframes auth-spin { to { transform: rotate(360deg); } }
.auth-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,.2);
  border-top-color: #000;
  animation: auth-spin .7s linear infinite;
}

/* ── Logo pulse ── */
@keyframes auth-logo-glow {
  0%,100% { filter: drop-shadow(0 0 8px rgba(245,200,66,.4)); }
  50%     { filter: drop-shadow(0 0 22px rgba(245,200,66,.8)) drop-shadow(0 0 40px rgba(245,200,66,.3)); }
}
.auth-logo { animation: auth-logo-glow 2.5s ease-in-out infinite; }

/* ── Referral toggle ── */
.auth-referral-toggle {
  font-size: 11px;
  font-weight: 700;
  color: rgba(245,200,66,.4);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
  text-align: left;
}
.auth-referral-toggle:hover { color: rgba(245,200,66,.8); }

/* ── Divider ── */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}
.auth-divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,.06);
}
.auth-divider-text {
  font-size: 10px;
  font-weight: 700;
  color: rgba(240,234,255,.2);
  letter-spacing: .14em;
  text-transform: uppercase;
}

/* ── Clerk badge ── */
.auth-badge {
  text-align: center;
  font-size: 10px;
  color: rgba(240,234,255,.12);
  font-weight: 600;
  margin-top: 2px;
}

/* ── Forgot password link ── */
.auth-forgot {
  font-size: 11px;
  font-weight: 700;
  color: rgba(245,200,66,.5);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .2s;
}
.auth-forgot:hover { color: #f5c842; }
`;

/* ─── Particles ──────────────────────────────────────────────────── */
const Particles = ({ count = 14 }) => {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    bottom: `${Math.random() * 20}%`,
    size: 1.2 + Math.random() * 2.4,
    color: Math.random() > .5 ? '#f5c842' : '#9d6fff',
    d: `${4 + Math.random() * 6}s`,
    delay: `${-Math.random() * 8}s`,
    dx: `${(Math.random() - .5) * 44}px`,
  }))).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="auth-pt" style={{
          left: p.left,
          bottom: p.bottom,
          width: p.size,
          height: p.size,
          background: p.color,
          boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          '--d': p.d,
          '--delay': p.delay,
          '--dx': p.dx,
        }} />
      ))}
    </div>
  );
};

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
      <Icon style={{ width: 15, height: 15 }} />
    </div>
    {showToggle && (
      <button type="button" className="auth-eye-btn" onClick={onToggle}>
        {showPw
          ? <EyeOff style={{ width: 14, height: 14 }} />
          : <Eye style={{ width: 14, height: 14 }} />}
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
      // Sync User entity now that account is verified
      await syncBase44User({
        email: pendingEmail,
        full_name: username,
        username,
        referred_by: referralCode,
      });
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

    // Basic validation
    if (!email.trim())                         { setError('Email is required'); return; }
    if (!password)                             { setError('Password is required'); return; }
    if (mode === 'signup' && !username.trim()) { setError('Username is required'); return; }
    if (mode === 'signup' && strength < 2)     { setError('Password is too weak'); return; }

    setLoading(true);
    try {
      if (mode === 'signin') {
        // ── Sign in via base44 SDK ──────────────────────────────────
        await base44.auth.loginViaEmailPassword(email, password);
        // Token is automatically set — reload so AuthContext picks it up
        window.location.reload();

      } else {
        // ── Sign up via base44 SDK ──────────────────────────────────
        await base44.auth.register({
          email,
          password,
          full_name: username,
        });
        // Registration sent a verification email — show code input step
        setPendingEmail(email);
        setVerifyStep(true);
      }
    } catch (err) {
      // base44 SDK throws an error object with a message field
      const msg = err?.message || err?.error || 'Something went wrong. Please try again.';
      // Clean up common base44 error messages
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

  const handleGuest = () => {
    // Skip auth — go straight to Home
    navigate('/Home');
  };

  return (
    <div className="auth-root">
      <style>{CSS}</style>

      {/* Background orbs */}
      <div className="auth-orb" style={{ width: 500, height: 500, top: '-20%', left: '-15%', background: 'radial-gradient(circle,rgba(157,111,255,.12) 0%,transparent 70%)', animationDelay: '0s' }} />
      <div className="auth-orb" style={{ width: 400, height: 400, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle,rgba(245,200,66,.09) 0%,transparent 70%)', animationDelay: '-4s' }} />
      <div className="auth-orb" style={{ width: 300, height: 300, top: '40%', right: '20%', background: 'radial-gradient(circle,rgba(157,111,255,.07) 0%,transparent 70%)', animationDelay: '-8s' }} />

      <Particles />

      {/* Card */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 28, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div className="auth-scan" />
        <div className="auth-noise" />

        {/* Top accent bar */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#f5c842,#9d6fff,transparent)' }} />

        {/* Logo */}
        <div style={{ padding: '28px 28px 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="auth-logo" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58,
            borderRadius: 16,
            background: 'linear-gradient(135deg,rgba(245,200,66,.15),rgba(157,111,255,.1))',
            border: '1px solid rgba(245,200,66,.25)',
            marginBottom: 14,
          }}>
            <Sparkles style={{ width: 26, height: 26, color: '#f5c842' }} />
          </div>
          <h1 className="auth-title" style={{ fontSize: 28, fontWeight: 700, color: '#f0eaff', letterSpacing: '.04em', marginBottom: 4 }}>
            CASERIFT
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(240,234,255,.3)', fontWeight: 600, letterSpacing: '.08em' }}>
            {mode === 'signin' ? 'Welcome back, player' : 'Join the arena'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '22px 28px 0', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 2 }}>
          <button className={`auth-tab ${mode === 'signin' ? 'active' : 'inactive'}`} onClick={() => switchMode('signin')}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => switchMode('signup')}>
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 28px 28px', position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">

            {/* ── Verify email step ── */}
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
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#f0eaff', marginBottom: 4 }}>
                    Check your email
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(240,234,255,.35)', fontWeight: 600 }}>
                    We sent a verification code to
                  </p>
                  <p style={{ fontSize: 12, color: '#f5c842', fontWeight: 800, marginTop: 2 }}>
                    {pendingEmail}
                  </p>
                </div>

                {/* Code input */}
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Enter verification code"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value)}
                    autoComplete="one-time-code"
                    maxLength={8}
                    style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, letterSpacing: '.3em' }}
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="auth-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      className="auth-success"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span style={{ fontSize: 16 }}>🎉</span>
                      Account verified! Welcome to the arena.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                  whileTap={{ scale: .98 }}
                  style={{ marginTop: 4 }}
                >
                  {loading ? <div className="auth-spinner" /> : <>Verify Email <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { setVerifyStep(false); setError(''); setVerifyCode(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,234,255,.25)', fontWeight: 700, fontSize: 12, fontFamily: 'Outfit,sans-serif' }}
                >
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
              {/* Username — signup only */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Field
                    icon={User}
                    placeholder="Username"
                    value={username}
                    onChange={setUn}
                  />
                </motion.div>
              )}

              {/* Email */}
              <Field
                icon={Mail}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={setEmail}
              />

              {/* Password + strength bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field
                  icon={Lock}
                  placeholder="Password"
                  value={password}
                  onChange={setPw}
                  showToggle
                  showPw={showPw}
                  onToggle={() => setShowPw(v => !v)}
                />
                {mode === 'signup' && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                  >
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 3,
                          background: i <= strength ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,.07)',
                          transition: 'background .3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: STRENGTH_COLORS[strength] || 'rgba(240,234,255,.25)', letterSpacing: '.06em' }}>
                      {STRENGTH_LABELS[strength] || 'Enter a password'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Referral code — signup only */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <button
                    type="button"
                    className="auth-referral-toggle"
                    onClick={() => setShowReferral(v => !v)}
                  >
                    {showReferral ? '▾ Hide referral code' : '▸ Have a referral code?'}
                  </button>
                  <AnimatePresence>
                    {showReferral && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Field
                          icon={Sparkles}
                          placeholder="Referral code (optional)"
                          value={referralCode}
                          onChange={setReferral}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Forgot password — signin only */}
              {mode === 'signin' && (
                <div style={{ textAlign: 'right' }}>
                  <button type="button" className="auth-forgot">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="auth-error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    className="auth-success"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span style={{ fontSize: 16 }}>🎉</span>
                    Account created! Welcome to the arena.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                className="auth-submit"
                disabled={loading}
                whileTap={{ scale: .98 }}
                style={{ marginTop: 4 }}
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
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
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(240,234,255,.25)', fontWeight: 600, marginTop: 4 }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5c842', fontWeight: 800, fontFamily: 'Outfit,sans-serif', fontSize: 12 }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              <p className="auth-badge">🔐 Secured by base44</p>

            </motion.form>
            )} {/* end verifyStep ternary */}
          </AnimatePresence>
        </div>

        {/* Bottom accent */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,111,255,.2),transparent)' }} />
      </motion.div>
    </div>
  );
}