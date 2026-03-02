import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Swords, Box, RotateCcw, TrendingUp, Zap, Star, Gift } from 'lucide-react';

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href;
const roseImg  = new URL('../assets/Rose Love.png',        import.meta.url).href;
const vtechImg = new URL('../assets/V-Tech.png',           import.meta.url).href;

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.lv { font-family: 'Nunito', sans-serif; }

/* ── Float animations for hero cases ── */
@keyframes float-hero-a {
  0%,100% { transform: translateY(0px)   rotate(-4deg); }
  50%     { transform: translateY(-18px) rotate(-1deg); }
}
@keyframes float-hero-b {
  0%,100% { transform: translateY(0px)   rotate(3deg); }
  50%     { transform: translateY(-22px) rotate(6deg); }
}
@keyframes float-hero-c {
  0%,100% { transform: translateY(0px)   rotate(2deg); }
  40%     { transform: translateY(-14px) rotate(-2deg); }
}
.fha { animation: float-hero-a  6s ease-in-out infinite; }
.fhb { animation: float-hero-b  8s ease-in-out infinite .8s; }
.fhc { animation: float-hero-c  7s ease-in-out infinite 1.4s; }

/* ── Particle rise ── */
@keyframes p-rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  8%   { opacity: 1; }
  90%  { opacity: .6; }
  100% { transform: translateY(-100px) translateX(var(--dx)); opacity: 0; }
}
.pt {
  position: absolute; border-radius: 50%; pointer-events: none;
  animation: p-rise var(--d) ease-out infinite var(--dl);
}

/* ── Live dot ── */
@keyframes live { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(3);opacity:0} }
.live-ring { animation: live 1.8s ease-out infinite; }

/* ── Shimmer ── */
@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(350%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
  animation:shim 5s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

/* ── Card hover lift ── */
.card-lift {
  transition: transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease;
}
.card-lift:hover { transform: translateY(-5px) scale(1.01); }

/* ── Scan line ── */
@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.8; }
  95% { opacity:.8; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
  animation:scan 7s linear infinite; pointer-events:none;
}

/* ── Glass ── */
.glass {
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e2235; border-radius:4px; }
`;

/* ─── Game cards data ──────────────────────────────────────── */
const GAMES = [
  {
    name: 'Battles',
    page: 'Battles',
    icon: Swords,
    size: 'lg',
    // Deep purple/blue arena feel
    bg: 'linear-gradient(135deg,#1a0a3d 0%,#2d1060 40%,#0d1a4a 100%)',
    accent: '#a78bfa',
    glowColor: 'rgba(167,139,250,.35)',
    caseImg: vtechImg,
    caseGlow: 'drop-shadow(0 0 30px rgba(167,139,250,.8)) drop-shadow(0 12px 40px rgba(0,0,0,.9))',
    // decorative 3d objects via CSS shapes + gradients
    deco: [
      { w:110, h:110, right:'48%', top:'10%', bg:'radial-gradient(circle at 35% 35%,#60a5fa,#1e40af)', br:'18px', rotate:'-15deg', glow:'rgba(96,165,250,.5)' },
      { w:70,  h:70,  right:'38%', top:'45%', bg:'radial-gradient(circle at 40% 30%,#c084fc,#7c3aed)', br:'12px', rotate:'20deg',  glow:'rgba(192,132,252,.4)' },
    ],
    tag: 'HOT',
    tagColor: '#f97316',
  },
  {
    name: 'Cases',
    page: 'Cases',
    icon: Box,
    size: 'lg',
    // Hot pink/magenta
    bg: 'linear-gradient(135deg,#3d0a2e 0%,#7b1060 40%,#2d0a4a 100%)',
    accent: '#f472b6',
    glowColor: 'rgba(244,114,182,.35)',
    caseImg: roseImg,
    caseGlow: 'drop-shadow(0 0 30px rgba(244,114,182,.85)) drop-shadow(0 12px 40px rgba(0,0,0,.9))',
    deco: [
      { w:100, h:100, right:'46%', top:'8%',  bg:'radial-gradient(circle at 35% 35%,#fb7185,#be185d)', br:'50%',  rotate:'0deg',   glow:'rgba(251,113,133,.5)' },
      { w:65,  h:65,  right:'34%', top:'50%', bg:'radial-gradient(circle at 40% 30%,#fbbf24,#b45309)', br:'14px', rotate:'30deg',  glow:'rgba(251,191,36,.4)' },
    ],
    tag: 'NEW',
    tagColor: '#10b981',
  },
  {
    name: 'Coinflip',
    page: 'Coinflip',
    icon: RotateCcw,
    size: 'sm',
    bg: 'linear-gradient(135deg,#1a1a00 0%,#3d2e00 50%,#1a0d00 100%)',
    accent: '#fbbf24',
    glowColor: 'rgba(251,191,36,.35)',
    caseImg: irishImg,
    caseGlow: 'drop-shadow(0 0 24px rgba(251,191,36,.8)) drop-shadow(0 10px 32px rgba(0,0,0,.9))',
    deco: [
      { w:80, h:80, right:'30%', top:'5%', bg:'radial-gradient(circle at 35% 35%,#fde68a,#d97706)', br:'50%', rotate:'0deg', glow:'rgba(253,230,138,.5)' },
    ],
  },

  {
    name: 'Crash',
    page: 'Crash',
    icon: Zap,
    size: 'sm',
    bg: 'linear-gradient(135deg,#1a0000 0%,#3d0a0a 50%,#1a001a 100%)',
    accent: '#f87171',
    glowColor: 'rgba(248,113,113,.35)',
    caseImg: roseImg,
    caseGlow: 'drop-shadow(0 0 24px rgba(248,113,113,.8)) drop-shadow(0 10px 32px rgba(0,0,0,.9))',
    deco: [
      { w:76, h:76, right:'26%', top:'6%', bg:'radial-gradient(circle at 35% 35%,#fca5a5,#dc2626)', br:'50%', rotate:'0deg', glow:'rgba(252,165,165,.5)' },
    ],
    tag: 'LIVE',
    tagColor: '#ef4444',
  },
];

/* ─── Particles ─────────────────────────────────────────────── */
function Particles({ accent, count = 14 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 20}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 40}px`,
    }))
  ).current;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="pt" style={{
          left: p.left, bottom: p.bottom,
          width: p.size, height: p.size,
          background: accent,
          boxShadow: `0 0 ${p.size * 4}px ${accent}`,
          '--d': p.d, '--dl': p.dl, '--dx': p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── 3-D deco object ────────────────────────────────────────── */
function DecoObj({ d, hov }) {
  // Convert rotate string like "15deg" or "-15deg" to a number for framer-motion
  const baseRot = parseFloat(d.rotate) || 0;
  return (
    <motion.div
      animate={{ y: hov ? -6 : 0, rotate: hov ? baseRot + 8 : baseRot }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      style={{
        position: 'absolute',
        right: d.right, top: d.top,
        width: d.w, height: d.h,
        background: d.bg,
        borderRadius: d.br,
        boxShadow: `0 8px 32px ${d.glow}, 0 2px 8px rgba(0,0,0,.6)`,
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Hero Banner ────────────────────────────────────────────── */
function HeroBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .7, ease: [.22, 1, .36, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        background: 'linear-gradient(120deg,#0d0a2e 0%,#1a0a4a 35%,#2d1060 65%,#1a0a3d 100%)',
        minHeight: 240,
        boxShadow: '0 0 0 1px rgba(255,255,255,.06), 0 32px 80px rgba(0,0,0,.7)',
      }}>

      <div className="scan" />

      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 80% at 75% 50%,rgba(139,92,246,.18) 0%,transparent 60%), radial-gradient(ellipse 40% 60% at 90% 20%,rgba(236,72,153,.12) 0%,transparent 55%)',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,.055) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* + decorative crosses */}
      {[[24, 18], [68, 14], [44, 62], [82, 55], [58, 80]].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${l}%`, top: `${t}%`,
          color: 'rgba(255,255,255,.14)', fontSize: 18, pointerEvents: 'none',
          fontWeight: 300, lineHeight: 1,
        }}>+</div>
      ))}

      {/* Floating case images */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Particles accent="#a78bfa" count={18} />
        <img src={vtechImg} alt="" className="fha"
          style={{
            position: 'absolute', right: '28%', top: '5%', width: 130,
            filter: 'drop-shadow(0 0 30px rgba(139,92,246,.8)) drop-shadow(0 16px 50px rgba(0,0,0,.95))',
          }} />
        <img src={roseImg} alt="" className="fhb"
          style={{
            position: 'absolute', right: '8%', top: '12%', width: 148,
            filter: 'drop-shadow(0 0 30px rgba(236,72,153,.75)) drop-shadow(0 16px 50px rgba(0,0,0,.95))',
          }} />
        <img src={irishImg} alt="" className="fhc"
          style={{
            position: 'absolute', right: '18%', bottom: '8%', width: 110,
            filter: 'drop-shadow(0 0 24px rgba(251,191,36,.7)) drop-shadow(0 14px 40px rgba(0,0,0,.95))',
          }} />
        {/* Gemstone crystal deco */}
        <div style={{
          position: 'absolute', right: '46%', top: '8%', width: 52, height: 52,
          background: 'radial-gradient(circle at 35% 35%,#c4b5fd,#7c3aed)',
          clipPath: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
          filter: 'drop-shadow(0 0 18px rgba(139,92,246,.9))',
          animation: 'float-hero-b 7s ease-in-out infinite .4s',
        }} />
        {/* Coin stack deco */}
        <div style={{
          position: 'absolute', right: '52%', bottom: '15%', width: 44, height: 44,
          background: 'radial-gradient(circle at 35% 30%,#fde68a,#d97706)',
          borderRadius: '50%',
          filter: 'drop-shadow(0 0 14px rgba(251,191,36,.8))',
          animation: 'float-hero-c 9s ease-in-out infinite 1s',
        }} />
      </div>

      {/* Text block */}
      <div style={{ position: 'relative', zIndex: 10, padding: '44px 44px' }}>
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 100, padding: '4px 12px',
          }}>
          <div style={{ position: 'relative', width: 7, height: 7 }}>
            <div className="live-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(16,185,129,.45)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase' }}>Live Now</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .26, duration: .85, ease: [.22, 1, .36, 1] }}
          style={{ margin: 0, lineHeight: 1.1, marginBottom: 10 }}>
          <span style={{ display: 'block', fontSize: 'clamp(30px,4vw,46px)', fontWeight: 900, color: '#fff' }}>
            Welcome To
          </span>
          <span style={{
            display: 'block', fontSize: 'clamp(34px,4.5vw,52px)', fontWeight: 900,
            background: 'linear-gradient(90deg,#a78bfa,#ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Lootverse!
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .42 }}
          style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.65, marginBottom: 28, maxWidth: 320, fontWeight: 400 }}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>amazing rewards.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .54 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'Nunito,sans-serif',
                background: 'linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%)',
                boxShadow: '0 0 40px rgba(139,92,246,.45), 0 4px 20px rgba(0,0,0,.5)',
              }}>
              <Trophy style={{ width: 15, height: 15 }} />
              View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.7)', fontFamily: 'Nunito,sans-serif',
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)',
              }}>
              Open Cases <ChevronRight style={{ width: 15, height: 15 }} />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Right edge vignette */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%',
        background: 'linear-gradient(to left,transparent,rgba(13,10,46,.3))',
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
}

/* ─── Large Game Card ────────────────────────────────────────── */
function LgGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  const a = g.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: .12 + i * .1, duration: .7, ease: [.22, 1, .36, 1] }}>
      <Link to={createPageUrl(g.page)}>
        <div className="shim card-lift"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
            height: 210,
            background: g.bg,
            boxShadow: `0 0 0 1px rgba(255,255,255,.07), 0 16px 50px rgba(0,0,0,.65), 0 0 60px ${g.glowColor}`,
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>

          <div className="scan" />
          {hov && <Particles accent={a} count={12} />}

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 80% 70% at 75% 40%,${a}28 0%,transparent 60%)`,
            opacity: hov ? 1 : .5, transition: 'opacity .5s',
          }} />

          {/* 3D deco objects */}
          {g.deco.map((d, di) => <DecoObj key={di} d={d} hov={hov} />)}

          {/* Case image — large, dominant */}
          <motion.img src={g.caseImg} alt={g.name}
            style={{
              position: 'absolute', right: 16, top: '50%', marginTop: -75,
              width: 150, pointerEvents: 'none', userSelect: 'none',
              filter: g.caseGlow,
            }}
            animate={{ scale: hov ? 1.12 : 1, y: hov ? -10 : 0, rotate: hov ? 5 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          />

          {/* Bottom label bar — like RBXMagic */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.5) 55%,transparent 100%)',
            padding: '20px 18px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <g.icon style={{ width: 16, height: 16, color: a }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
                  color: '#fff', background: g.tagColor, borderRadius: 6, padding: '2px 7px',
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          {/* Hover: subtle top line */}
          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${a},transparent)`,
            }} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Small Game Card ────────────────────────────────────────── */
function SmGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  const a = g.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: .96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: .28 + i * .09, duration: .65, ease: [.22, 1, .36, 1] }}>
      <Link to={createPageUrl(g.page)}>
        <div className="shim card-lift"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
            height: 160,
            background: g.bg,
            boxShadow: `0 0 0 1px rgba(255,255,255,.07), 0 12px 40px rgba(0,0,0,.65), 0 0 50px ${g.glowColor}`,
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>

          <div className="scan" />
          {hov && <Particles accent={a} count={9} />}

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 80% 70% at 80% 35%,${a}25 0%,transparent 58%)`,
            opacity: hov ? 1 : .5, transition: 'opacity .5s',
          }} />

          {/* Deco objects */}
          {g.deco?.map((d, di) => <DecoObj key={di} d={d} hov={hov} />)}

          {/* Case image */}
          <motion.img src={g.caseImg} alt={g.name}
            style={{
              position: 'absolute', right: 10, top: 6, width: 116,
              pointerEvents: 'none', userSelect: 'none',
              filter: g.caseGlow,
            }}
            animate={{ scale: hov ? 1.18 : 1, y: hov ? -8 : 0, rotate: hov ? 6 : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          />

          {/* Label */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.5) 55%,transparent 100%)',
            padding: '18px 16px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <g.icon style={{ width: 14, height: 14, color: a }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
                  color: '#fff', background: g.tagColor, borderRadius: 5, padding: '2px 6px',
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${a},transparent)`,
            }} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Featured Case Card ─────────────────────────────────────── */
function FeaturedCard({ c, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: .5 + i * .08 }}>
      <Link to={`${createPageUrl('CaseOpen')}?id=${c.id}`}>
        <div className="shim card-lift"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: 12, cursor: 'pointer',
            padding: '18px 14px', textAlign: 'center',
            background: 'linear-gradient(145deg,#0f1225,#131930)',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,.6)',
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>
          <motion.div
            animate={{ scale: hov ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{
              width: 50, height: 50, margin: '0 auto 10px', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,rgba(139,92,246,.2),rgba(236,72,153,.15))',
              border: '1px solid rgba(139,92,246,.3)',
              boxShadow: '0 4px 20px rgba(139,92,246,.2)',
            }}>
            <Gift style={{ width: 22, height: 22, color: '#a78bfa' }} />
          </motion.div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#ec4899' }}>{c.price?.toLocaleString()} coins</div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHead({ label, icon: Icon, accent = '#a78bfa', right }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon style={{ width: 16, height: 16, color: accent }} />
        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '.01em' }}>{label}</span>
      </div>
      {right}
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function Home() {
  const { loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4)
      .then(setFeaturedCases).catch(() => setFeaturedCases([]));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#0b0d1a' }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #8b5cf6', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '2px solid #ec4899', animation: 'spin .72s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 16px #a78bfa' }} />
        </div>
      </div>
    </div>
  );

  const lgGames = GAMES.filter(g => g.size === 'lg');
  const smGames = GAMES.filter(g => g.size === 'sm');

  return (
    <div className="lv" style={{ background: '#0b0d1a', minHeight: '100vh', padding: '20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Hero */}
        <HeroBanner />

        {/* Game Modes */}
        <section>
          <SectionHead label="Magic Games" icon={Zap} accent="#a78bfa" />

          {/* 2-col large */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {lgGames.map((g, i) => <LgGameCard key={g.name} g={g} i={i} />)}
          </div>

          {/* 3-col: Coinflip | Crash | Featured Cases teaser */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {smGames.map((g, i) => <SmGameCard key={g.name} g={g} i={i} />)}

            {/* Featured Cases slot — replaces where Upgrade was */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: .96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: .46, duration: .65, ease: [.22, 1, .36, 1] }}>
              <Link to={createPageUrl('Cases')}>
                <div className="card-lift"
                  style={{
                    position: 'relative', overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
                    height: 160,
                    background: 'linear-gradient(135deg,#1a0a3d 0%,#2d0a5a 50%,#0d0a2e 100%)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,.07), 0 12px 40px rgba(0,0,0,.65), 0 0 50px rgba(167,139,250,.25)',
                    border: '1px solid rgba(167,139,250,.2)',
                  }}>
                  {/* Glow */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 80% 70% at 80% 35%,rgba(167,139,250,.22) 0%,transparent 60%)',
                  }} />
                  {/* Floating case images inside */}
                  <img src={vtechImg} alt="" style={{
                    position: 'absolute', right: 4, top: -6, width: 90,
                    filter: 'drop-shadow(0 0 18px rgba(167,139,250,.7)) drop-shadow(0 8px 24px rgba(0,0,0,.9))',
                    animation: 'float-hero-a 6s ease-in-out infinite',
                  }} />
                  <img src={irishImg} alt="" style={{
                    position: 'absolute', right: 52, top: 40, width: 62,
                    filter: 'drop-shadow(0 0 14px rgba(251,191,36,.65)) drop-shadow(0 6px 18px rgba(0,0,0,.9))',
                    animation: 'float-hero-c 8s ease-in-out infinite .6s',
                    opacity: .9,
                  }} />
                  {/* Bottom label */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.5) 55%,transparent 100%)',
                    padding: '18px 16px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Star style={{ width: 14, height: 14, color: '#a78bfa' }} />
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Featured Cases</span>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: 'rgba(167,139,250,.6)' }} />
                    </div>
                  </div>
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg,transparent,#a78bfa,transparent)',
                  }} />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Featured Cases — full section below */}
        {featuredCases.length > 0 && (
          <section>
            <SectionHead
              label="Featured Cases"
              icon={Star}
              accent="#ec4899"
              right={
                <Link to={createPageUrl('Cases')}>
                  <motion.span whileHover={{ x: 4 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>
                    View all <ChevronRight style={{ width: 13, height: 13 }} />
                  </motion.span>
                </Link>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              {featuredCases.map((c, i) => <FeaturedCard key={c.id} c={c} i={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}