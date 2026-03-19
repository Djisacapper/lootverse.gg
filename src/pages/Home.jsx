import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Zap } from 'lucide-react';

const vtechImg    = 'https://i.imgur.com/doYHRMp.png';
const roseImg     = 'https://i.imgur.com/WVoUpzN.png';
const irishImg    = 'https://i.imgur.com/7KIsUqY.png';
const battlesImg  = 'https://i.imgur.com/vHp8zbU.png';
const casesImg    = 'https://i.imgur.com/WXw330m.png';
const coinflipImg = 'https://i.imgur.com/3AUD8Vu.png';
const crashImg    = 'https://i.imgur.com/53dgn4r.png';

/* ─────────────────────────────────────────────────────────────
   CSS
   Changes from original:
   - Swapped Nunito → Syne (display) + DM Sans (body)
   - Removed: scan line, ambient dot grid, gem floats, gradient title anim
   - Removed: pulsing live-ring animation on badge
   - Removed: HOT/NEW/LIVE colored tag backgrounds → thin outlined chips
   - Removed: per-card top bar gradient sweep animation
   - Removed: gc-sheen ::after swipe animation
   - Card hover: kept scale/shadow but removed the colored bloom glow
   - Grain noise layer added for texture depth
   - Hero radial glows kept but toned down
   - Hero floating items kept — just no extra sparkle shapes around them
───────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; }
.lv { font-family: 'DM Sans', sans-serif; }

/* grain — adds tactile realness, breaks the "clean AI render" flatness */
.lv::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: 0.028;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px;
}

/* hero item floats — kept, they're tasteful */
@keyframes hf1 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-14px) rotate(0deg)} }
@keyframes hf2 { 0%,100%{transform:translateY(0) rotate(2deg)}  50%{transform:translateY(-18px) rotate(5deg)} }
@keyframes hf3 { 0%,100%{transform:translateY(0) rotate(1deg)}  42%{transform:translateY(-10px) rotate(-2deg)} }
.hfa { animation: hf1 6s ease-in-out infinite }
.hfb { animation: hf2 8s ease-in-out infinite .9s }
.hfc { animation: hf3 7s ease-in-out infinite 1.5s }

/* live dot — just a solid dot, no expanding ring theater */
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 8px rgba(251,191,36,0.7);
  flex-shrink: 0;
}

/* ── HERO TITLE — static, no animated gradient ── */
.hero-title-static {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  line-height: 1.0;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 2px 24px rgba(0,0,0,0.6);
}

/* accent word: gold, no animation */
.hero-title-accent {
  color: #fbbf24;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* ── GAME CARDS ── */
.gc-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: inherit;
  filter: grayscale(1) brightness(.3) sepia(.5) hue-rotate(228deg);
  transform: scale(1.03);
  transition: filter .55s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1);
  will-change: filter, transform;
}
.gc-card:hover .gc-img {
  filter: grayscale(0) brightness(.88) saturate(1.15) contrast(1.04);
  transform: scale(1.1);
}

.gc-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(to top, rgba(2,0,14,.97) 0%, rgba(5,0,20,.62) 32%, rgba(8,0,28,.18) 62%, transparent 100%);
}

/* thin left accent bar — replaces the top gradient sweep (less AI, more editorial) */
.gc-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  z-index: 9;
  border-radius: 2px 0 0 2px;
  transform: scaleY(0);
  transform-origin: bottom center;
  transition: transform .38s cubic-bezier(.4,0,.2,1);
}
.gc-card:hover .gc-accent-bar { transform: scaleY(1); }

.gc-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  cursor: pointer;
  transition: box-shadow .4s ease, transform .3s cubic-bezier(.4,0,.2,1);
  border: 1px solid rgba(255,255,255,0.04);
}
.gc-card:hover { transform: translateY(-6px) scale(1.012); }

/* tag — no colored pill backgrounds, just a thin outline chip */
.gc-tag {
  font-family: 'Syne', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  border-radius: 4px;
  padding: 2px 8px;
  flex-shrink: 0;
  border: 1px solid;
  background: transparent;
}

/* gradient text util */
.gc-name {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .01em;
  text-shadow: 0 2px 14px rgba(0,0,0,.95);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

/* spinners */
@keyframes spin  { to { transform: rotate(360deg) } }
@keyframes spinr { to { transform: rotate(-360deg) } }
::-webkit-scrollbar { width: 4px }
::-webkit-scrollbar-thumb { background: #120020; border-radius: 4px }
`;

/* ─── GAME DATA ────────────────────────────────────────────── */
const GAMES = [
  {
    name: 'Battles', page: 'Battles',
    img: battlesImg, accent: '#c084fc',
    nameGrad: 'linear-gradient(90deg, #fff 0%, #c084fc 100%)',
    shadow: '0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    shadowHover: '0 0 0 1.5px rgba(192,132,252,.5), 0 18px 52px rgba(0,0,0,.92)',
    tag: 'HOT', tagColor: 'rgba(251,191,36,.7)',
  },
  {
    name: 'Cases', page: 'Cases',
    img: casesImg, accent: '#fbbf24',
    nameGrad: 'linear-gradient(90deg, #fff 0%, #fbbf24 100%)',
    shadow: '0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    shadowHover: '0 0 0 1.5px rgba(251,191,36,.5), 0 18px 52px rgba(0,0,0,.92)',
    tag: 'NEW', tagColor: 'rgba(192,132,252,.7)',
  },
  {
    name: 'Coinflip', page: 'Coinflip',
    img: coinflipImg, accent: '#fbbf24',
    nameGrad: 'linear-gradient(90deg, #fff 0%, #fbbf24 100%)',
    shadow: '0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    shadowHover: '0 0 0 1.5px rgba(251,191,36,.46), 0 18px 52px rgba(0,0,0,.92)',
    tag: null,
  },
  {
    name: 'Crash', page: 'Crash',
    img: crashImg, accent: '#a855f7',
    nameGrad: 'linear-gradient(90deg, #fff 0%, #a855f7 100%)',
    shadow: '0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    shadowHover: '0 0 0 1.5px rgba(168,85,247,.5), 0 18px 52px rgba(0,0,0,.92)',
    tag: 'LIVE', tagColor: 'rgba(168,85,247,.8)',
  },
];

/* ─── PARTICLES ─────────────────────────────────────────────── */
/* kept — subtle, not obviously AI */
function Particles({ accent, count = 8 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}%`,
    bottom: `${Math.random() * 16}%`,
    size: 1 + Math.random() * 2,
    dur: `${3.5 + Math.random() * 4.5}s`,
    delay: `${-Math.random() * 6}s`,
    px: `${(Math.random() - .5) * 38}px`,
    py: `-${44 + Math.random() * 64}px`,
  }))).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left, bottom: p.bottom,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 ${p.size * 3}px ${accent}`,
          animation: `ptcl ${p.dur} ease-out infinite ${p.delay}`,
          '--px': p.px, '--py': p.py,
        }} />
      ))}
      <style>{`
        @keyframes ptcl {
          0%   { transform: translateY(0) translateX(0); opacity: 0 }
          8%   { opacity: .9 }
          88%  { opacity: .4 }
          100% { transform: translateY(var(--py)) translateX(var(--px)); opacity: 0 }
        }
      `}</style>
    </div>
  );
}

/* ─── HERO ───────────────────────────────────────────────────── */
function HeroBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .78, ease: [.22, 1, .36, 1] }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        background: 'linear-gradient(130deg,#040010 0%,#0b001e 35%,#170035 65%,#060014 100%)',
        minHeight: 260,
        boxShadow: '0 0 0 1px rgba(251,191,36,.07), 0 28px 88px rgba(0,0,0,.96), inset 0 1px 0 rgba(255,255,255,.03)',
      }}
    >
      {/* ambient glow — kept, just no grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 55% 75% at 68% 50%, rgba(100,25,195,.22) 0%, transparent 62%),' +
          'radial-gradient(ellipse 28% 38% at 88% 10%, rgba(251,191,36,.08) 0%, transparent 52%)',
      }} />

      {/* particles — reduced count vs original */}
      <Particles accent="#fbbf24" count={7} />
      <Particles accent="#a855f7" count={5} />

      {/* floating item images — kept exactly */}
      <img src={vtechImg} alt="" className="hfa" style={{
        position: 'absolute', right: '27%', top: '5%', width: 126, pointerEvents: 'none',
        filter: 'drop-shadow(0 0 22px rgba(168,85,247,.75)) drop-shadow(0 12px 36px rgba(0,0,0,.95))',
      }} />
      <img src={roseImg} alt="" className="hfb" style={{
        position: 'absolute', right: '6%', top: '10%', width: 144, pointerEvents: 'none',
        filter: 'drop-shadow(0 0 22px rgba(251,191,36,.72)) drop-shadow(0 12px 36px rgba(0,0,0,.95))',
      }} />
      <img src={irishImg} alt="" className="hfc" style={{
        position: 'absolute', right: '17%', bottom: '6%', width: 106, pointerEvents: 'none',
        filter: 'drop-shadow(0 0 18px rgba(251,191,36,.6)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
      }} />

      <div style={{ position: 'relative', zIndex: 10, padding: '46px 48px' }}>

        {/* badge — solid dot, no pulsing ring */}
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: .2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
            background: 'rgba(251,191,36,.055)',
            border: '1px solid rgba(251,191,36,.15)',
            borderRadius: 100, padding: '5px 14px 5px 10px',
          }}
        >
          <div className="live-dot" />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.18em',
            color: 'rgba(251,191,36,.6)', textTransform: 'uppercase',
            fontFamily: 'Syne, sans-serif',
          }}>Live Now</span>
        </motion.div>

        {/* title — Syne, static gold accent, no animated gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .24, duration: .8, ease: [.22, 1, .36, 1] }}
          style={{ margin: 0, lineHeight: 1.07, marginBottom: 13 }}
        >
          <span style={{ display: 'block', fontSize: 'clamp(26px,3.4vw,42px)' }}
            className="hero-title-static">
            Welcome To
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(30px,4vw,30px)' }}
            className="hero-title-accent">
            Amethystgg!
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: .38 }}
          style={{
            fontSize: 13, color: 'rgba(255,255,255,.32)', lineHeight: 1.72,
            marginBottom: 30, maxWidth: 300, fontWeight: 300,
          }}
        >
          Step into a world of magic, luck, and excitement where every unbox
          and battle brings you closer to{' '}
          <span style={{ color: 'rgba(251,191,36,.75)', fontWeight: 500 }}>amazing rewards.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .5 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
        >
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#000',
                fontFamily: 'Syne, sans-serif',
                background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)',
                boxShadow: '0 0 28px rgba(251,191,36,.38), 0 4px 18px rgba(0,0,0,.55)',
              }}
            >
              <Trophy style={{ width: 15, height: 15 }} /> View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                color: 'rgba(251,191,36,.82)',
                fontFamily: 'Syne, sans-serif',
                background: 'rgba(251,191,36,.055)',
                border: '1px solid rgba(251,191,36,.18)',
              }}
            >
              Open Cases <ChevronRight style={{ width: 15, height: 15 }} />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* bottom line — kept */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, pointerEvents: 'none',
        background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.42),rgba(168,85,247,.35),transparent)',
      }} />
    </motion.div>
  );
}

/* ─── GAME CARD ─────────────────────────────────────────────── */
function GameCard({ g, i }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: .95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: .08 + i * .1, duration: .66, ease: [.22, 1, .36, 1] }}
    >
      <Link to={createPageUrl(g.page)}>
        <div
          className="gc-card"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ height: 210, boxShadow: hov ? g.shadowHover : g.shadow }}
        >
          <img src={g.img} alt={g.name} className="gc-img" />
          <div className="gc-vignette" />

          {/* left accent bar on hover (replaces top bar sweep) */}
          <div className="gc-accent-bar" style={{ background: g.accent }} />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            padding: '28px 20px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* gradient name — no icon */}
              <span
                className="gc-name"
                style={{ backgroundImage: g.nameGrad }}
              >
                {g.name}
              </span>

              {/* tag — outline chip */}
              {g.tag && (
                <span className="gc-tag" style={{ color: g.tagColor, borderColor: g.tagColor }}>
                  {g.tag}
                </span>
              )}
            </div>
          </div>

          {/* corner accent dot */}
          <div style={{
            position: 'absolute', top: 14, right: 16, zIndex: 9,
            width: 5, height: 5, borderRadius: '50%',
            background: g.accent,
            boxShadow: `0 0 8px 2px ${g.accent}`,
            opacity: hov ? .8 : 0,
            transition: 'opacity .28s ease',
          }} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── SECTION HEADER ────────────────────────────────────────── */
function SectionHead() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: .26 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}
    >
      <div style={{
        width: 3, height: 22, borderRadius: 3,
        background: 'linear-gradient(to bottom,#fbbf24,#a855f7)',
        boxShadow: '0 0 10px rgba(251,191,36,.3)',
      }} />
      <Zap style={{ width: 16, height: 16, color: '#fbbf24' }} />
      <span style={{
        fontSize: 17, fontWeight: 700, color: '#fff',
        letterSpacing: '.01em', fontFamily: 'Syne, sans-serif',
      }}>
        Home Games
      </span>
    </motion.div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', background: '#030009',
    }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid #fbbf24', animation: 'spin 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 7, borderRadius: '50%',
          border: '2px solid #a855f7', animation: 'spinr .72s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 16px #fbbf24' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="lv" style={{
      background: '#030009',
      backgroundImage:
        'radial-gradient(ellipse 62% 40% at 10% 0%, rgba(85,15,185,.15) 0%, transparent 60%),' +
        'radial-gradient(ellipse 48% 32% at 90% 100%, rgba(185,115,0,.09) 0%, transparent 55%)',
      minHeight: '100vh',
      padding: '24px 0 90px',
      position: 'relative',
    }}>
      <style>{CSS}</style>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <HeroBanner />
        <section>
          <SectionHead />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {GAMES.map((g, i) => <GameCard key={g.name} g={g} i={i} />)}
          </div>
        </section>
      </div>
    </div>
  );
}