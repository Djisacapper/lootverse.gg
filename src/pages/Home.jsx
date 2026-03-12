import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Trophy, ChevronRight, Swords, Box, RotateCcw, Zap, Star, Gift } from 'lucide-react';

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href;
const roseImg  = new URL('../assets/Rose Love.png',        import.meta.url).href;
const vtechImg = new URL('../assets/V-Tech.png',           import.meta.url).href;

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }
.lv { font-family: 'DM Sans', sans-serif; }
.lv-display { font-family: 'Syne', sans-serif; }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(139,92,246,.3); border-radius: 8px; }

/* ── ambient orbs ── */
@keyframes orb-drift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(28px,-18px) scale(1.04); }
  66%     { transform: translate(-14px,22px) scale(.97); }
}
.orb { border-radius:50%; filter:blur(90px); animation: orb-drift var(--t,18s) ease-in-out infinite var(--d,0s); }

/* ── particles ── */
@keyframes p-float {
  0%   { transform:translateY(0) translateX(0) scale(1); opacity:0; }
  10%  { opacity:1; }
  85%  { opacity:.5; }
  100% { transform:translateY(var(--ry,-90px)) translateX(var(--rx,0px)) scale(.3); opacity:0; }
}
.pt { position:absolute; border-radius:50%; pointer-events:none;
      animation: p-float var(--d,4s) ease-out infinite var(--dl,0s); }

/* ── shimmer sweep ── */
@keyframes shim-sweep {
  0%  { transform:translateX(-120%) skewX(-18deg); }
  100%{ transform:translateX(380%)  skewX(-18deg); }
}
.shim-card::before {
  content:''; position:absolute; inset:0; border-radius:inherit; z-index:2; pointer-events:none;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.03) 45%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 55%,transparent);
  width:25%; animation: shim-sweep 8s ease-in-out infinite;
}

/* ── live pulse ── */
@keyframes live-ring { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.5);opacity:0} }
.live-ring { animation: live-ring 2s ease-out infinite; }

/* ── grain ── */
.grain::after {
  content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity:.02; mix-blend-mode:overlay;
}

/* ── scan line ── */
@keyframes scan-move {
  0%  { transform:translateY(-100%); opacity:0; }
  5%  { opacity:.6; }
  92% { opacity:.4; }
  100%{ transform:translateY(400%); opacity:0; }
}
.scan-line {
  position:absolute; left:0; right:0; height:1px; pointer-events:none; z-index:3;
  background:linear-gradient(90deg,transparent,rgba(167,139,250,.15),rgba(251,191,36,.1),rgba(167,139,250,.15),transparent);
  animation: scan-move 10s linear infinite;
}

/* ── float anims ── */
@keyframes flt-a { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-20px) rotate(-1deg)} }
@keyframes flt-b { 0%,100%{transform:translateY(0) rotate(3deg)}  50%{transform:translateY(-26px) rotate(7deg)}  }
@keyframes flt-c { 0%,100%{transform:translateY(0) rotate(1deg)}  42%{transform:translateY(-16px) rotate(-3deg)} }
.flt-a { animation: flt-a 6.5s ease-in-out infinite; }
.flt-b { animation: flt-b 8s ease-in-out infinite .9s; }
.flt-c { animation: flt-c 7.2s ease-in-out infinite 1.6s; }

/* ── card hover lift ── */
.game-card { transition: transform .32s cubic-bezier(.34,1.56,.64,1), box-shadow .32s ease; }
.game-card:hover { transform: translateY(-6px) scale(1.015); }

/* ── border glow pulse ── */
@keyframes border-pulse {
  0%,100% { box-shadow:0 0 0 1px rgba(139,92,246,.14),0 20px 60px rgba(0,0,0,.75); }
  50%     { box-shadow:0 0 0 1px rgba(167,139,250,.32),0 20px 60px rgba(0,0,0,.75),0 0 80px rgba(139,92,246,.18); }
}
.bp { animation: border-pulse 4s ease-in-out infinite; }

/* ── spinner ── */
@keyframes spin   { to{transform:rotate(360deg)}  }
@keyframes spin-r { to{transform:rotate(-360deg)} }
`;

/* ─── Ambient orbs ───────────────────────────────────────────── */
function AmbientOrbs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      <div className="orb" style={{ position:'absolute', width:650, height:650, left:'-18%', top:'4%',
        background:'radial-gradient(circle,rgba(109,40,217,.17) 0%,transparent 70%)', '--t':'22s' }} />
      <div className="orb" style={{ position:'absolute', width:520, height:520, right:'-12%', top:'18%',
        background:'radial-gradient(circle,rgba(251,191,36,.11) 0%,transparent 70%)', '--t':'19s', '--d':'-6s' }} />
      <div className="orb" style={{ position:'absolute', width:420, height:420, left:'32%', bottom:'-12%',
        background:'radial-gradient(circle,rgba(139,92,246,.13) 0%,transparent 70%)', '--t':'27s', '--d':'-13s' }} />
    </div>
  );
}

/* ─── Particles ──────────────────────────────────────────────── */
function Particles({ accent, count = 12 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${6 + Math.random() * 88}%`,
    bottom: `${Math.random() * 18}%`,
    size: 1.4 + Math.random() * 2.4,
    d: `${3.5 + Math.random() * 5}s`,
    dl: `${-Math.random() * 7}s`,
    rx: `${(Math.random() - .5) * 50}px`,
    ry: `${-(55 + Math.random() * 80)}px`,
  }))).current;

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="pt" style={{
          left:p.left, bottom:p.bottom,
          width:p.size, height:p.size,
          background:accent,
          boxShadow:`0 0 ${p.size * 5}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--rx':p.rx, '--ry':p.ry,
        }} />
      ))}
    </div>
  );
}

/* ─── Tilt card ──────────────────────────────────────────────── */
function TiltCard({ children, style, className, onMouseEnter, onMouseLeave }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotX = useSpring(rx, { stiffness:200, damping:24 });
  const rotY = useSpring(ry, { stiffness:200, damping:24 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rx.set(((e.clientY - rect.top)  / rect.height - .5) * -7);
    ry.set(((e.clientX - rect.left) / rect.width  - .5) *  7);
  };
  const handleLeave = () => { rx.set(0); ry.set(0); onMouseLeave?.(); };

  return (
    <motion.div ref={ref} style={{ ...style, rotateX:rotX, rotateY:rotY, transformPerspective:900 }}
      className={className} onMouseMove={handleMove} onMouseEnter={onMouseEnter} onMouseLeave={handleLeave}>
      {children}
    </motion.div>
  );
}

/* ─── Hero Banner ────────────────────────────────────────────── */
function HeroBanner() {
  return (
    <motion.div
      initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:.9, ease:[.22,1,.36,1] }}
      className="grain"
      style={{
        position:'relative', overflow:'hidden', borderRadius:20,
        background:'linear-gradient(130deg,#08001a 0%,#0f0028 40%,#16003a 65%,#090015 100%)',
        minHeight:260,
        border:'1px solid rgba(139,92,246,.18)',
        boxShadow:'0 0 0 1px rgba(139,92,246,.07),0 32px 80px rgba(0,0,0,.9),0 0 120px rgba(109,40,217,.15)',
      }}>

      <div className="scan-line" />

      {/* Grid */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(139,92,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.04) 1px,transparent 1px)',
        backgroundSize:'40px 40px',
      }} />

      {/* Color washes */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 65% 85% at 72% 50%,rgba(109,40,217,.25) 0%,transparent 60%),radial-gradient(ellipse 38% 50% at 88% 10%,rgba(251,191,36,.12) 0%,transparent 55%)',
      }} />

      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <Particles accent="#a78bfa" count={12} />
        <Particles accent="#fbbf24" count={8} />
      </div>

      {/* Floating images */}
      <img src={vtechImg} alt="" className="flt-a" style={{
        position:'absolute', right:'27%', top:'4%', width:140, pointerEvents:'none',
        filter:'drop-shadow(0 0 28px rgba(139,92,246,.9)) drop-shadow(0 18px 50px rgba(0,0,0,.95))',
      }} />
      <img src={roseImg} alt="" className="flt-b" style={{
        position:'absolute', right:'7%', top:'10%', width:155, pointerEvents:'none',
        filter:'drop-shadow(0 0 28px rgba(251,191,36,.75)) drop-shadow(0 18px 50px rgba(0,0,0,.95))',
      }} />
      <img src={irishImg} alt="" className="flt-c" style={{
        position:'absolute', right:'17%', bottom:'6%', width:116, pointerEvents:'none',
        filter:'drop-shadow(0 0 22px rgba(251,191,36,.65)) drop-shadow(0 14px 40px rgba(0,0,0,.95))',
      }} />

      {/* Deco gems */}
      {[
        { right:'47%', top:'9%',  w:54, h:54, bg:'radial-gradient(circle at 35% 35%,#c4b5fd,#6d28d9)', clip:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)', glow:'rgba(139,92,246,.9)', cls:'flt-b' },
        { right:'54%', bottom:'14%', w:42, h:42, bg:'radial-gradient(circle at 35% 30%,#fde68a,#b45309)', br:'50%', glow:'rgba(251,191,36,.85)', cls:'flt-c' },
        { right:'60%', top:'30%', w:28, h:28, bg:'radial-gradient(circle at 35% 35%,#f9a8d4,#9d174d)', br:'8px', glow:'rgba(249,168,212,.7)', cls:'flt-a' },
      ].map((g, i) => (
        <div key={i} className={g.cls} style={{
          position:'absolute', right:g.right, top:g.top, bottom:g.bottom,
          width:g.w, height:g.h,
          background:g.bg, borderRadius:g.br,
          clipPath:g.clip,
          filter:`drop-shadow(0 0 16px ${g.glow})`,
        }} />
      ))}

      {/* Content */}
      <div style={{ position:'relative', zIndex:10, padding:'48px 48px' }}>
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2 }}
          style={{
            display:'inline-flex', alignItems:'center', gap:8, marginBottom:18,
            background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.28)',
            borderRadius:100, padding:'5px 14px 5px 10px',
          }}>
          <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
            <div className="live-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(167,139,250,.5)' }} />
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#a78bfa', boxShadow:'0 0 10px #a78bfa' }} />
          </div>
          <span className="lv-display" style={{ fontSize:9, fontWeight:700, letterSpacing:'.2em', color:'rgba(167,139,250,.85)', textTransform:'uppercase' }}>Live Now</span>
        </motion.div>

        <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:.28, duration:.85, ease:[.22,1,.36,1] }}
          style={{ margin:0, lineHeight:1.05, marginBottom:14 }}>
          <span style={{ display:'block', fontSize:'clamp(28px,3.8vw,44px)', fontWeight:400, color:'rgba(255,255,255,.5)', letterSpacing:'-.01em' }}>
            Welcome to
          </span>
          <span className="lv-display" style={{
            display:'block', fontSize:'clamp(38px,5vw,60px)', fontWeight:800,
            background:'linear-gradient(95deg,#fbbf24 0%,#f59e0b 18%,#e879f9 52%,#a78bfa 78%,#818cf8 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            letterSpacing:'-.03em',
          }}>
            Amethystgg
          </span>
        </motion.h1>

        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.44 }}
          style={{ fontSize:14, color:'rgba(255,255,255,.37)', lineHeight:1.72, marginBottom:30, maxWidth:340, fontWeight:400 }}>
          Every unbox and battle brings you closer to{' '}
          <span style={{ color:'#fbbf24', fontWeight:600 }}>legendary rewards.</span>
        </motion.p>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.56 }}
          style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.95 }}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'12px 24px',
                borderRadius:12, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700, color:'#000', fontFamily:'Syne,sans-serif', letterSpacing:'.02em',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fde68a 100%)',
                boxShadow:'0 0 40px rgba(251,191,36,.45),0 4px 20px rgba(0,0,0,.5)',
              }}>
              <Trophy style={{ width:14, height:14 }} />
              Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.95 }}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'12px 24px',
                borderRadius:12, cursor:'pointer',
                fontSize:13, fontWeight:700, color:'rgba(167,139,250,.9)', fontFamily:'Syne,sans-serif', letterSpacing:'.02em',
                background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.3)',
              }}>
              Open Cases <ChevronRight style={{ width:14, height:14 }} />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Bottom accent */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg,transparent,rgba(139,92,246,.6) 30%,rgba(251,191,36,.5) 60%,transparent)',
        pointerEvents:'none',
      }} />
    </motion.div>
  );
}

/* ─── Game data ──────────────────────────────────────────────── */
const GAMES = [
  {
    name:'Battles', page:'Battles', icon:Swords, size:'lg',
    bg:'linear-gradient(140deg,#0a0018 0%,#180040 45%,#0a0020 100%)',
    accent:'#c084fc', accentAlt:'#818cf8', glowColor:'rgba(192,132,252,.35)',
    caseImg:vtechImg,
    caseGlow:'drop-shadow(0 0 32px rgba(192,132,252,.9)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    tag:'HOT',
  },
  {
    name:'Cases', page:'Cases', icon:Box, size:'lg',
    bg:'linear-gradient(140deg,#0d0900 0%,#1c1200 45%,#0d0600 100%)',
    accent:'#fbbf24', accentAlt:'#f97316', glowColor:'rgba(251,191,36,.35)',
    caseImg:roseImg,
    caseGlow:'drop-shadow(0 0 32px rgba(251,191,36,.95)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    tag:'NEW',
  },
  {
    name:'Coinflip', page:'Coinflip', icon:RotateCcw, size:'sm',
    bg:'linear-gradient(140deg,#060012 0%,#100030 55%,#040010 100%)',
    accent:'#fbbf24', accentAlt:'#fde68a', glowColor:'rgba(251,191,36,.28)',
    caseImg:irishImg,
    caseGlow:'drop-shadow(0 0 24px rgba(251,191,36,.9)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
  },
  {
    name:'Crash', page:'Crash', icon:Zap, size:'sm',
    bg:'linear-gradient(140deg,#070010 0%,#130030 55%,#030010 100%)',
    accent:'#a855f7', accentAlt:'#c084fc', glowColor:'rgba(168,85,247,.3)',
    caseImg:roseImg,
    caseGlow:'drop-shadow(0 0 24px rgba(168,85,247,.9)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
    tag:'LIVE',
  },
];

/* ─── Tag ────────────────────────────────────────────────────── */
function Tag({ label, accent }) {
  const isHot = label === 'HOT';
  const isLive = label === 'LIVE';
  return (
    <span className="lv-display" style={{
      fontSize:8, fontWeight:800, letterSpacing:'.2em', textTransform:'uppercase',
      color: isHot ? '#000' : '#fff',
      background: isHot ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : isLive ? 'rgba(168,85,247,.85)' : 'rgba(139,92,246,.7)',
      borderRadius:6, padding:'3px 8px',
      border: isHot ? 'none' : `1px solid ${accent}44`,
      boxShadow: isHot ? '0 0 14px rgba(251,191,36,.7)' : `0 0 10px ${accent}60`,
    }}>{isLive ? '● LIVE' : label}</span>
  );
}

/* ─── Icon pill ──────────────────────────────────────────────── */
function IconPill({ icon: Icon, accent, size = 28, iconSize = 13 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:Math.round(size * .3), flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:`${accent}18`, border:`1px solid ${accent}30`,
    }}>
      <Icon style={{ width:iconSize, height:iconSize, color:accent }} />
    </div>
  );
}

/* ─── Large Game Card ────────────────────────────────────────── */
function LgGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:30, scale:.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.14 + i * .1, duration:.75, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl(g.page)}>
        <TiltCard className="shim-card game-card bp"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            display:'block', position:'relative', overflow:'hidden', borderRadius:16,
            height:220, cursor:'pointer',
            background:g.bg,
            border:`1px solid ${g.accent}18`,
          }}>

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:`linear-gradient(${g.accent}06 1px,transparent 1px),linear-gradient(90deg,${g.accent}06 1px,transparent 1px)`,
            backgroundSize:'28px 28px',
          }} />

          <motion.div animate={{ opacity: hov ? 1 : .4 }} transition={{ duration:.4 }}
            style={{
              position:'absolute', inset:0, pointerEvents:'none',
              background:`radial-gradient(ellipse 75% 80% at 72% 40%,${g.glowColor} 0%,transparent 60%)`,
            }} />

          {hov && <Particles accent={g.accent} count={14} />}

          {/* Deco shapes */}
          <motion.div
            animate={{ rotate: hov ? 28 : 14, scale: hov ? 1.1 : 1 }}
            transition={{ type:'spring', stiffness:120, damping:16 }}
            style={{
              position:'absolute', right:'42%', top:'8%', width:88, height:88,
              background:`radial-gradient(circle at 35% 35%,${g.accentAlt},${g.accent}88)`,
              borderRadius:16, opacity:.5,
              boxShadow:`0 4px 24px ${g.glowColor}`,
              pointerEvents:'none',
            }} />
          <motion.div
            animate={{ rotate: hov ? -18 : -4, scale: hov ? .94 : 1 }}
            transition={{ type:'spring', stiffness:100, damping:18 }}
            style={{
              position:'absolute', right:'34%', top:'50%', width:54, height:54,
              background:`radial-gradient(circle at 40% 30%,${g.accent},${g.accentAlt}88)`,
              borderRadius:'50%', opacity:.42,
              boxShadow:`0 2px 14px ${g.glowColor}`,
              pointerEvents:'none',
            }} />

          <motion.img src={g.caseImg} alt={g.name}
            style={{ position:'absolute', right:16, top:'50%', marginTop:-80, width:160, pointerEvents:'none', userSelect:'none', filter:g.caseGlow, zIndex:4 }}
            animate={{ scale: hov ? 1.1 : 1, y: hov ? -12 : 0, rotate: hov ? 4 : 0 }}
            transition={{ type:'spring', stiffness:180, damping:18 }}
          />

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:5,
            background:'linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,.6) 55%,transparent 100%)',
            padding:'24px 20px 16px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <IconPill icon={g.icon} accent={g.accent} />
              <span className="lv-display" style={{ fontSize:17, fontWeight:800, color:'#fff', letterSpacing:'-.01em' }}>{g.name}</span>
              {g.tag && <Tag label={g.tag} accent={g.accent} />}
            </div>
          </div>

          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .5 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:1.5, zIndex:6,
              background:`linear-gradient(90deg,transparent,${g.accent},${g.accentAlt},${g.accent},transparent)`,
              transformOrigin:'center',
            }} />
        </TiltCard>
      </Link>
    </motion.div>
  );
}

/* ─── Small Game Card ────────────────────────────────────────── */
function SmGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:22, scale:.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.3 + i * .09, duration:.65, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl(g.page)}>
        <TiltCard className="shim-card game-card"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            display:'block', position:'relative', overflow:'hidden', borderRadius:16,
            height:165, cursor:'pointer',
            background:g.bg,
            border:`1px solid ${g.accent}18`,
            boxShadow:`0 0 0 1px rgba(255,255,255,.025),0 16px 44px rgba(0,0,0,.85),0 0 55px ${g.glowColor}`,
          }}>

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:`linear-gradient(${g.accent}05 1px,transparent 1px),linear-gradient(90deg,${g.accent}05 1px,transparent 1px)`,
            backgroundSize:'24px 24px',
          }} />

          <motion.div animate={{ opacity: hov ? 1 : .4 }} transition={{ duration:.4 }}
            style={{
              position:'absolute', inset:0, pointerEvents:'none',
              background:`radial-gradient(ellipse 85% 75% at 78% 35%,${g.glowColor} 0%,transparent 58%)`,
            }} />

          {hov && <Particles accent={g.accent} count={9} />}

          <motion.div
            animate={{ scale: hov ? 1.14 : 1, rotate: hov ? 18 : 0 }}
            transition={{ type:'spring', stiffness:150, damping:18 }}
            style={{
              position:'absolute', right:'26%', top:'5%', width:66, height:66,
              background:`radial-gradient(circle at 35% 35%,${g.accentAlt},${g.accent}88)`,
              borderRadius:14, opacity:.48,
              boxShadow:`0 4px 20px ${g.glowColor}`,
              pointerEvents:'none',
            }} />

          <motion.img src={g.caseImg} alt={g.name}
            style={{ position:'absolute', right:8, top:4, width:118, pointerEvents:'none', userSelect:'none', filter:g.caseGlow, zIndex:4 }}
            animate={{ scale: hov ? 1.16 : 1, y: hov ? -9 : 0, rotate: hov ? 6 : 0 }}
            transition={{ type:'spring', stiffness:220, damping:18 }}
          />

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:5,
            background:'linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,.6) 55%,transparent 100%)',
            padding:'18px 16px 13px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <IconPill icon={g.icon} accent={g.accent} size={24} iconSize={11} />
              <span className="lv-display" style={{ fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'-.01em' }}>{g.name}</span>
              {g.tag && <Tag label={g.tag} accent={g.accent} />}
            </div>
          </div>

          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .4 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:1.5, zIndex:6,
              background:`linear-gradient(90deg,transparent,${g.accent},${g.accentAlt},${g.accent},transparent)`,
              transformOrigin:'center',
            }} />
        </TiltCard>
      </Link>
    </motion.div>
  );
}

/* ─── Featured Cases link card ───────────────────────────────── */
function FeaturedLink() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:22, scale:.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.48, duration:.65, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl('Cases')}>
        <TiltCard className="game-card"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            display:'block', position:'relative', overflow:'hidden', borderRadius:16,
            height:165, cursor:'pointer',
            background:'linear-gradient(140deg,#080018 0%,#140035 55%,#040010 100%)',
            border:'1px solid rgba(251,191,36,.14)',
            boxShadow:'0 0 0 1px rgba(255,255,255,.02),0 16px 44px rgba(0,0,0,.85),0 0 55px rgba(251,191,36,.11)',
          }}>

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 80% 70% at 78% 35%,rgba(251,191,36,.15) 0%,transparent 60%)',
          }} />

          {hov && <Particles accent="#fbbf24" count={9} />}

          <img src={vtechImg} alt="" className="flt-a" style={{
            position:'absolute', right:2, top:-6, width:88, pointerEvents:'none',
            filter:'drop-shadow(0 0 18px rgba(139,92,246,.8)) drop-shadow(0 8px 24px rgba(0,0,0,.95))',
          }} />
          <img src={irishImg} alt="" className="flt-c" style={{
            position:'absolute', right:54, top:42, width:60, pointerEvents:'none',
            filter:'drop-shadow(0 0 14px rgba(251,191,36,.75)) drop-shadow(0 6px 18px rgba(0,0,0,.95))',
            opacity:.9,
          }} />

          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            background:'linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,.6) 55%,transparent 100%)',
            padding:'18px 16px 13px',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <IconPill icon={Star} accent="#fbbf24" size={24} iconSize={11} />
                <span className="lv-display" style={{ fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'-.01em' }}>Featured</span>
              </div>
              <ChevronRight style={{ width:14, height:14, color:'rgba(251,191,36,.55)' }} />
            </div>
          </div>

          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .4 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:1.5,
              background:'linear-gradient(90deg,transparent,#fbbf24,#a78bfa,#fbbf24,transparent)',
              transformOrigin:'center',
            }} />
        </TiltCard>
      </Link>
    </motion.div>
  );
}

/* ─── Featured Case Card ─────────────────────────────────────── */
function FeaturedCard({ c, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.54 + i * .07 }}>
      <Link to={`${createPageUrl('CaseOpen')}?id=${c.id}`}>
        <motion.div className="game-card"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            position:'relative', overflow:'hidden', borderRadius:14, cursor:'pointer',
            padding:'20px 14px', textAlign:'center',
            background:'linear-gradient(145deg,#090016,#0f001e)',
            border:'1px solid rgba(139,92,246,.15)',
            boxShadow: hov ? '0 12px 40px rgba(0,0,0,.85),0 0 40px rgba(139,92,246,.2)' : '0 8px 30px rgba(0,0,0,.8)',
            transition:'box-shadow .3s ease',
          }}>
          <motion.div
            animate={{ scale: hov ? 1.1 : 1, rotate: hov ? 8 : 0 }}
            transition={{ type:'spring', stiffness:200, damping:18 }}
            style={{
              width:52, height:52, margin:'0 auto 12px', borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(135deg,rgba(139,92,246,.18),rgba(251,191,36,.12))',
              border:'1px solid rgba(139,92,246,.3)',
              boxShadow: hov ? '0 4px 24px rgba(139,92,246,.35)' : '0 4px 16px rgba(139,92,246,.15)',
              transition:'box-shadow .3s',
            }}>
            <Gift style={{ width:22, height:22, color:'#a78bfa' }} />
          </motion.div>
          <div className="lv-display" style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-.01em' }}>{c.name}</div>
          <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24' }}>
            {c.price?.toLocaleString()} <span style={{ color:'rgba(251,191,36,.5)', fontSize:10 }}>coins</span>
          </div>
          {hov && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ position:'absolute', inset:0, borderRadius:'inherit', background:'radial-gradient(ellipse 80% 80% at 50% 80%,rgba(139,92,246,.1) 0%,transparent 65%)', pointerEvents:'none' }} />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHead({ label, icon: Icon, right }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.32 }}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:2.5, height:22, borderRadius:4, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
        <div style={{
          width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(139,92,246,.12)', border:'1px solid rgba(139,92,246,.22)',
        }}>
          <Icon style={{ width:13, height:13, color:'#a78bfa' }} />
        </div>
        <span className="lv-display" style={{ fontSize:16, fontWeight:800, color:'#fff', letterSpacing:'-.01em' }}>{label}</span>
      </div>
      {right}
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4)
      .then(setFeaturedCases).catch(() => setFeaturedCases([]));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:'#06000f' }}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(167,139,250,.7)', animation:'spin 1s linear infinite' }} />
        <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'2px solid rgba(251,191,36,.5)', animation:'spin-r .72s linear infinite' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#a78bfa', boxShadow:'0 0 18px #a78bfa' }} />
        </div>
      </div>
    </div>
  );

  const lgGames = GAMES.filter(g => g.size === 'lg');
  const smGames = GAMES.filter(g => g.size === 'sm');

  return (
    <div className="lv" style={{ background:'#06000f', minHeight:'100vh', padding:'20px 0 100px', position:'relative' }}>
      <style>{CSS}</style>
      <AmbientOrbs />

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:36 }}>

        <HeroBanner />

        <section>
          <SectionHead label="Games" icon={Zap} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {lgGames.map((g, i) => <LgGameCard key={g.name} g={g} i={i} />)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {smGames.map((g, i) => <SmGameCard key={g.name} g={g} i={i} />)}
            <FeaturedLink />
          </div>
        </section>

        {featuredCases.length > 0 && (
          <section>
            <SectionHead label="Featured Cases" icon={Gift}
              right={
                <Link to={createPageUrl('Cases')}>
                  <motion.span whileHover={{ x:2 }}
                    style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'rgba(167,139,250,.6)', cursor:'pointer', fontWeight:600 }}>
                    View all <ChevronRight style={{ width:13, height:13 }} />
                  </motion.span>
                </Link>
              }
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {featuredCases.map((c, i) => <FeaturedCard key={c.id} c={c} i={i} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}