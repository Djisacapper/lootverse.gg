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

@keyframes live { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(3);opacity:0} }
.live-ring { animation: live 1.8s ease-out infinite; }

@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(350%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.06),transparent);
  animation:shim 5s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

.card-lift {
  transition: transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease;
}
.card-lift:hover { transform: translateY(-5px) scale(1.01); }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.8; }
  95% { opacity:.8; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.15),transparent);
  animation:scan 7s linear infinite; pointer-events:none;
}

@keyframes hex-pulse {
  0%,100% { opacity:.03; }
  50% { opacity:.07; }
}
.hex-grid {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.04) 1px, transparent 1px);
  background-size: 32px 32px;
  animation: hex-pulse 4s ease-in-out infinite;
}

@keyframes border-glow {
  0%,100% { box-shadow: 0 0 0 1px rgba(255,220,0,.12), 0 16px 50px rgba(0,0,0,.65), 0 0 60px rgba(255,200,0,.2); }
  50%     { box-shadow: 0 0 0 1px rgba(255,220,0,.25), 0 16px 50px rgba(0,0,0,.65), 0 0 80px rgba(255,200,0,.35); }
}
.glow-pulse { animation: border-glow 3s ease-in-out infinite; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }
`;

/* ─── Game cards data ──────────────────────────────────────── */
const GAMES = [
  {
    name: 'Battles',
    page: 'Battles',
    icon: Swords,
    size: 'lg',
    bg: 'linear-gradient(135deg,#0a0010 0%,#1a0040 40%,#0d0020 100%)',
    accent: '#c084fc',
    glowColor: 'rgba(192,132,252,.3)',
    caseImg: vtechImg,
    caseGlow: 'drop-shadow(0 0 30px rgba(192,132,252,.85)) drop-shadow(0 12px 40px rgba(0,0,0,.9))',
    deco: [
      { w:110, h:110, right:'48%', top:'10%', bg:'radial-gradient(circle at 35% 35%,#d8b4fe,#7c3aed)', br:'18px', rotate:'-15deg', glow:'rgba(192,132,252,.55)' },
      { w:70,  h:70,  right:'38%', top:'45%', bg:'radial-gradient(circle at 40% 30%,#fde047,#a16207)', br:'12px', rotate:'20deg',  glow:'rgba(253,224,71,.45)' },
    ],
    tag: 'HOT',
    tagColor: '#d97706',
  },
  {
    name: 'Cases',
    page: 'Cases',
    icon: Box,
    size: 'lg',
    bg: 'linear-gradient(135deg,#0a0800 0%,#1a1000 40%,#0d0500 100%)',
    accent: '#fbbf24',
    glowColor: 'rgba(251,191,36,.32)',
    caseImg: roseImg,
    caseGlow: 'drop-shadow(0 0 30px rgba(251,191,36,.9)) drop-shadow(0 12px 40px rgba(0,0,0,.9))',
    deco: [
      { w:100, h:100, right:'46%', top:'8%',  bg:'radial-gradient(circle at 35% 35%,#fde68a,#b45309)', br:'50%',  rotate:'0deg',   glow:'rgba(253,230,138,.55)' },
      { w:65,  h:65,  right:'34%', top:'50%', bg:'radial-gradient(circle at 40% 30%,#c084fc,#6b21a8)', br:'14px', rotate:'30deg',  glow:'rgba(192,132,252,.4)' },
    ],
    tag: 'NEW',
    tagColor: '#7c3aed',
  },
  {
    name: 'Coinflip',
    page: 'Coinflip',
    icon: RotateCcw,
    size: 'sm',
    bg: 'linear-gradient(135deg,#080010 0%,#14003a 50%,#04000d 100%)',
    accent: '#fbbf24',
    glowColor: 'rgba(251,191,36,.3)',
    caseImg: irishImg,
    caseGlow: 'drop-shadow(0 0 24px rgba(251,191,36,.85)) drop-shadow(0 10px 32px rgba(0,0,0,.9))',
    deco: [
      { w:80, h:80, right:'30%', top:'5%', bg:'radial-gradient(circle at 35% 35%,#fde68a,#d97706)', br:'50%', rotate:'0deg', glow:'rgba(253,230,138,.5)' },
    ],
  },
  {
    name: 'Crash',
    page: 'Crash',
    icon: Zap,
    size: 'sm',
    bg: 'linear-gradient(135deg,#060008 0%,#120020 50%,#03000a 100%)',
    accent: '#a855f7',
    glowColor: 'rgba(168,85,247,.3)',
    caseImg: roseImg,
    caseGlow: 'drop-shadow(0 0 24px rgba(168,85,247,.85)) drop-shadow(0 10px 32px rgba(0,0,0,.9))',
    deco: [
      { w:76, h:76, right:'26%', top:'6%', bg:'radial-gradient(circle at 35% 35%,#e879f9,#7e22ce)', br:'50%', rotate:'0deg', glow:'rgba(232,121,249,.5)' },
    ],
    tag: 'LIVE',
    tagColor: '#7c3aed',
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
        background: 'linear-gradient(120deg,#040008 0%,#0e0025 35%,#1a0040 65%,#080010 100%)',
        minHeight: 240,
        boxShadow: '0 0 0 1px rgba(251,191,36,.12), 0 32px 80px rgba(0,0,0,.85), 0 0 120px rgba(168,85,247,.15)',
      }}>

      <div className="scan" />
      <div className="hex-grid" />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 80% at 75% 50%,rgba(168,85,247,.2) 0%,transparent 60%), radial-gradient(ellipse 40% 50% at 90% 15%,rgba(251,191,36,.1) 0%,transparent 55%), radial-gradient(ellipse 30% 40% at 10% 80%,rgba(251,191,36,.06) 0%,transparent 50%)',
      }} />

      {[[24, 18], [68, 14], [44, 62], [82, 55], [58, 80]].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${l}%`, top: `${t}%`,
          color: 'rgba(251,191,36,.18)', fontSize: 18, pointerEvents: 'none',
          fontWeight: 300, lineHeight: 1,
        }}>+</div>
      ))}

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Particles accent="#fbbf24" count={10} />
        <Particles accent="#a855f7" count={10} />
        <img src={vtechImg} alt="" className="fha"
          style={{
            position: 'absolute', right: '28%', top: '5%', width: 130,
            filter: 'drop-shadow(0 0 30px rgba(168,85,247,.85)) drop-shadow(0 16px 50px rgba(0,0,0,.95))',
          }} />
        <img src={roseImg} alt="" className="fhb"
          style={{
            position: 'absolute', right: '8%', top: '12%', width: 148,
            filter: 'drop-shadow(0 0 30px rgba(251,191,36,.75)) drop-shadow(0 16px 50px rgba(0,0,0,.95))',
          }} />
        <img src={irishImg} alt="" className="fhc"
          style={{
            position: 'absolute', right: '18%', bottom: '8%', width: 110,
            filter: 'drop-shadow(0 0 24px rgba(251,191,36,.7)) drop-shadow(0 14px 40px rgba(0,0,0,.95))',
          }} />
        <div style={{
          position: 'absolute', right: '46%', top: '8%', width: 52, height: 52,
          background: 'radial-gradient(circle at 35% 35%,#e9d5ff,#7c3aed)',
          clipPath: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
          filter: 'drop-shadow(0 0 18px rgba(168,85,247,.9))',
          animation: 'float-hero-b 7s ease-in-out infinite .4s',
        }} />
        <div style={{
          position: 'absolute', right: '52%', bottom: '15%', width: 44, height: 44,
          background: 'radial-gradient(circle at 35% 30%,#fde68a,#b45309)',
          borderRadius: '50%',
          filter: 'drop-shadow(0 0 14px rgba(251,191,36,.9))',
          animation: 'float-hero-c 9s ease-in-out infinite 1s',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '44px 44px' }}>
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)',
            borderRadius: 100, padding: '4px 12px',
          }}>
          <div style={{ position: 'relative', width: 7, height: 7 }}>
            <div className="live-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(251,191,36,.45)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: 'rgba(251,191,36,.7)', textTransform: 'uppercase' }}>Live Now</span>
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
            background: 'linear-gradient(90deg,#fbbf24 0%,#f59e0b 35%,#c084fc 70%,#a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(251,191,36,.3))',
          }}>
            Amethystgg!
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .42 }}
          style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.65, marginBottom: 28, maxWidth: 320, fontWeight: 400 }}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>amazing rewards.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .54 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 800, color: '#000', fontFamily: 'Nunito,sans-serif',
                background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)',
                boxShadow: '0 0 40px rgba(251,191,36,.5), 0 4px 20px rgba(0,0,0,.5)',
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
                fontSize: 14, fontWeight: 800, color: 'rgba(251,191,36,.85)', fontFamily: 'Nunito,sans-serif',
                background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)',
              }}>
              Open Cases <ChevronRight style={{ width: 15, height: 15 }} />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%',
        background: 'linear-gradient(to left,transparent,rgba(4,0,8,.3))',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.5),transparent)',
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
        <div className="shim card-lift glow-pulse"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
            height: 210,
            background: g.bg,
            border: `1px solid rgba(251,191,36,.1)`,
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>

          <div className="scan" />
          {hov && <Particles accent={a} count={12} />}

          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 80% 70% at 75% 40%,${a}28 0%,transparent 60%)`,
            opacity: hov ? 1 : .5, transition: 'opacity .5s',
          }} />

          {g.deco.map((d, di) => <DecoObj key={di} d={d} hov={hov} />)}

          <motion.img src={g.caseImg} alt={g.name}
            style={{
              position: 'absolute', right: 16, top: '50%', marginTop: -75,
              width: 150, pointerEvents: 'none', userSelect: 'none',
              filter: g.caseGlow,
            }}
            animate={{ scale: hov ? 1.12 : 1, y: hov ? -10 : 0, rotate: hov ? 5 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 55%,transparent 100%)',
            padding: '20px 18px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <g.icon style={{ width: 16, height: 16, color: a }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
                  color: g.tag === 'HOT' ? '#000' : '#fff',
                  background: g.tag === 'HOT'
                    ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                    : g.tagColor,
                  borderRadius: 6, padding: '2px 7px',
                  boxShadow: g.tag === 'HOT' ? '0 0 12px rgba(251,191,36,.6)' : undefined,
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${a},rgba(251,191,36,.8),${a},transparent)`,
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
            boxShadow: `0 0 0 1px rgba(251,191,36,.08), 0 12px 40px rgba(0,0,0,.8), 0 0 50px ${g.glowColor}`,
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>

          <div className="scan" />
          {hov && <Particles accent={a} count={9} />}

          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 80% 70% at 80% 35%,${a}25 0%,transparent 58%)`,
            opacity: hov ? 1 : .5, transition: 'opacity .5s',
          }} />

          {g.deco?.map((d, di) => <DecoObj key={di} d={d} hov={hov} />)}

          <motion.img src={g.caseImg} alt={g.name}
            style={{
              position: 'absolute', right: 10, top: 6, width: 116,
              pointerEvents: 'none', userSelect: 'none',
              filter: g.caseGlow,
            }}
            animate={{ scale: hov ? 1.18 : 1, y: hov ? -8 : 0, rotate: hov ? 6 : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          />

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 55%,transparent 100%)',
            padding: '18px 16px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <g.icon style={{ width: 14, height: 14, color: a }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
                  color: '#fff', background: g.tagColor, borderRadius: 5, padding: '2px 6px',
                  boxShadow: '0 0 10px rgba(124,58,237,.5)',
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${a},rgba(251,191,36,.6),${a},transparent)`,
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
            background: 'linear-gradient(145deg,#080010,#100020)',
            border: '1px solid rgba(251,191,36,.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,.8)',
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}>
          <motion.div
            animate={{ scale: hov ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{
              width: 50, height: 50, margin: '0 auto 10px', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,rgba(251,191,36,.15),rgba(168,85,247,.15))',
              border: '1px solid rgba(251,191,36,.25)',
              boxShadow: '0 4px 20px rgba(251,191,36,.15)',
            }}>
            <Gift style={{ width: 22, height: 22, color: '#fbbf24' }} />
          </motion.div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{c.price?.toLocaleString()} coins</div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHead({ label, icon: Icon, accent = '#fbbf24', right }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#04000a' }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #fbbf24', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '2px solid #a855f7', animation: 'spin .72s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 16px #fbbf24' }} />
        </div>
      </div>
    </div>
  );

  const lgGames = GAMES.filter(g => g.size === 'lg');
  const smGames = GAMES.filter(g => g.size === 'sm');

  return (
    <div className="lv" style={{ background: '#04000a', minHeight: '100vh', padding: '20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        <HeroBanner />

        <section>
          <SectionHead label="Magic Games" icon={Zap} accent="#fbbf24" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {lgGames.map((g, i) => <LgGameCard key={g.name} g={g} i={i} />)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {smGames.map((g, i) => <SmGameCard key={g.name} g={g} i={i} />)}

            <motion.div
              initial={{ opacity: 0, y: 24, scale: .96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: .46, duration: .65, ease: [.22, 1, .36, 1] }}>
              <Link to={createPageUrl('Cases')}>
                <div className="card-lift"
                  style={{
                    position: 'relative', overflow: 'hidden', borderRadius: 14, cursor: 'pointer',
                    height: 160,
                    background: 'linear-gradient(135deg,#080010 0%,#140030 50%,#04000d 100%)',
                    boxShadow: '0 0 0 1px rgba(251,191,36,.12), 0 12px 40px rgba(0,0,0,.8), 0 0 50px rgba(251,191,36,.12)',
                    border: '1px solid rgba(251,191,36,.15)',
                  }}>
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 80% 70% at 80% 35%,rgba(251,191,36,.12) 0%,transparent 60%)',
                  }} />
                  <img src={vtechImg} alt="" style={{
                    position: 'absolute', right: 4, top: -6, width: 90,
                    filter: 'drop-shadow(0 0 18px rgba(168,85,247,.75)) drop-shadow(0 8px 24px rgba(0,0,0,.9))',
                    animation: 'float-hero-a 6s ease-in-out infinite',
                  }} />
                  <img src={irishImg} alt="" style={{
                    position: 'absolute', right: 52, top: 40, width: 62,
                    filter: 'drop-shadow(0 0 14px rgba(251,191,36,.7)) drop-shadow(0 6px 18px rgba(0,0,0,.9))',
                    animation: 'float-hero-c 8s ease-in-out infinite .6s',
                    opacity: .9,
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 55%,transparent 100%)',
                    padding: '18px 16px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Star style={{ width: 14, height: 14, color: '#fbbf24' }} />
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Featured Cases</span>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: 'rgba(251,191,36,.6)' }} />
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)',
                  }} />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}