import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, User, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

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

/* ── Primary button (Sign In) ── */
.auth-btn-primary {
  width: 100%;
  padding: 15px;
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
  gap: 10px;
}
.auth-btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 48px rgba(245,200,66,.5), 0 8px 24px rgba(0,0,0,.6);
  background-position: 100%;
}
.auth-btn-primary:active { transform: scale(.98); }

/* ── Secondary button (Sign Up) ── */
.auth-btn-secondary {
  width: 100%;
  padding: 15px;
  cursor: pointer;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .02em;
  background: transparent;
  border: 1px solid rgba(245,200,66,.3);
  color: #f5c842;
  transition: all .2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.auth-btn-secondary:hover {
  background: rgba(245,200,66,.08);
  border-color: rgba(245,200,66,.6);
  transform: translateY(-2px);
  box-shadow: 0 0 24px rgba(245,200,66,.15);
}
.auth-btn-secondary:active { transform: scale(.98); }

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

/* ── Feature pills ── */
.auth-features {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.auth-feature-pill {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  color: rgba(240,234,255,.3);
  text-transform: uppercase;
}

/* ── Logo pulse ── */
@keyframes auth-logo-glow {
  0%,100% { filter: drop-shadow(0 0 8px rgba(245,200,66,.4)); }
  50%     { filter: drop-shadow(0 0 22px rgba(245,200,66,.8)) drop-shadow(0 0 40px rgba(245,200,66,.3)); }
}
.auth-logo { animation: auth-logo-glow 2.5s ease-in-out infinite; }

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

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Authpage() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const navigate = useNavigate();

  // If already logged in, go straight to Home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/Home');
    }
  }, [isAuthenticated]);

  const handleSignIn = () => {
    // Triggers base44's native login modal
    navigateToLogin();
  };

  const handleSignUp = () => {
    // Triggers base44's native login modal (sign up tab)
    navigateToLogin();
  };

  const handleGuest = () => {
    // Skip auth entirely — go straight to Home as guest
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

        {/* Logo area */}
        <div style={{ padding: '36px 28px 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="auth-logo" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg,rgba(245,200,66,.15),rgba(157,111,255,.1))',
            border: '1px solid rgba(245,200,66,.25)',
            marginBottom: 16,
          }}>
            <Sparkles style={{ width: 28, height: 28, color: '#f5c842' }} />
          </div>
          <h1 className="auth-title" style={{ fontSize: 34, fontWeight: 700, color: '#f0eaff', letterSpacing: '.06em', marginBottom: 6 }}>
            CASERIFT
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(240,234,255,.35)', fontWeight: 600, letterSpacing: '.06em', marginBottom: 20 }}>
            The ultimate case opening experience
          </p>

          {/* Feature pills */}
          <div className="auth-features">
            <span className="auth-feature-pill">🎰 Case Opening</span>
            <span className="auth-feature-pill">⚔️ Battles</span>
            <span className="auth-feature-pill">🪙 Coinflip</span>
            <span className="auth-feature-pill">📈 Crash</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2 }}>

          {/* Sign In */}
          <motion.button
            className="auth-btn-primary"
            onClick={handleSignIn}
            whileTap={{ scale: .98 }}
          >
            <LogIn style={{ width: 18, height: 18 }} />
            Sign In
          </motion.button>

          {/* Sign Up */}
          <motion.button
            className="auth-btn-secondary"
            onClick={handleSignUp}
            whileTap={{ scale: .98 }}
          >
            <User style={{ width: 18, height: 18 }} />
            Create Account
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

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(240,234,255,.15)', fontWeight: 600, marginTop: 4 }}>
            By continuing you agree to our Terms of Service
          </p>
        </div>

        {/* Bottom accent */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(157,111,255,.2),transparent)' }} />
      </motion.div>
    </div>
  );
}