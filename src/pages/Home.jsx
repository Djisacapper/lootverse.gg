import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, Swords, Box, RotateCcw, TrendingUp, Zap, Star, Gift, Sparkles } from 'lucide-react';

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href;
const roseImg  = new URL('../assets/Rose Love.png',        import.meta.url).href;
const vtechImg = new URL('../assets/V-Tech.png',           import.meta.url).href;

/* ══════════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.lv { font-family: 'Nunito', sans-serif; }

/* ─ Page bg ─ */
.page-bg {
  background: #04000a;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(120,40,200,.13) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(200,140,20,.08) 0%, transparent 55%);
}

/* ─ Gem float animations ─ */
@keyframes gem-float-1 {
  0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
  25%     { transform: translateY(-22px) rotate(8deg) scale(1.04); }
  75%     { transform: translateY(-10px) rotate(-5deg) scale(.97); }
}
@keyframes gem-float-2 {
  0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
  30%     { transform: translateY(-30px) rotate(-10deg) scale(1.06); }
  70%     { transform: translateY(-8px)  rotate(6deg)  scale(.96); }
}
@keyframes gem-float-3 {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  40%     { transform: translateY(-18px) rotate(12deg); }
  80%     { transform: translateY(-6px)  rotate(-8deg); }
}
@keyframes gem-float-4 {
  0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
  35%     { transform: translateY(-26px) rotate(-6deg) scale(1.05); }
  65%     { transform: translateY(-14px) rotate(9deg)  scale(.98); }
}
@keyframes gem-spin-slow { to { transform: rotate(360deg); } }
@keyframes gem-spin-rev  { to { transform: rotate(-360deg); } }

.gf1 { animation: gem-float-1 6s   ease-in-out infinite; }
.gf2 { animation: gem-float-2 8s   ease-in-out infinite 1s; }
.gf3 { animation: gem-float-3 7s   ease-in-out infinite 2s; }
.gf4 { animation: gem-float-4 9s   ease-in-out infinite .5s; }
.gf5 { animation: gem-float-1 5.5s ease-in-out infinite 3s; }
.gf6 { animation: gem-float-2 10s  ease-in-out infinite 1.5s; }

/* ─ Gem inner shimmer ─ */
@keyframes gem-inner-shimmer {
  0%,100% { opacity: .4; transform: rotate(0deg) scale(.8); }
  50%      { opacity: .9; transform: rotate(180deg) scale(1.1); }
}
.gem-shine { animation: gem-inner-shimmer 3s ease-in-out infinite; }

/* ─ Particles ─ */
@keyframes ptcl {
  0%   { transform: translateY(0) translateX(0); opacity:0; }
  8%   { opacity: 1; }
  88%  { opacity: .5; }
  100% { transform: translateY(var(--py)) translateX(var(--px)); opacity:0; }
}
.pt { position:absolute; border-radius:50%; pointer-events:none; animation: ptcl var(--pd) ease-out infinite var(--pdl); }

/* ─ Live dot ─ */
@keyframes live-pulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.5);opacity:0} }
.live-ring { animation: live-pulse 1.8s ease-out infinite; }

/* ─ Card shimmer sweep ─ */
@keyframes shim-x {
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(500%)  skewX(-12deg); }
}
.card-shim::after {
  content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:10; overflow:hidden;
  background: linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 45%,rgba(255,255,255,.10) 50%,rgba(255,255,255,.04) 55%,transparent 100%);
  width:30%; animation: shim-x 6s ease-in-out infinite; animation-delay: var(--shim-dl,0s);
}

/* ─ Hero scan line ─ */
@keyframes hero-scan {
  0%   { top:-2px; opacity:0; }
  4%   { opacity:.7; }
  92%  { opacity:.4; }
  100% { top:100%; opacity:0; }
}
.hero-scan {
  position:absolute; left:0; right:0; height:1px; pointer-events:none; z-index:6;
  background: linear-gradient(90deg, transparent, rgba(251,191,36,.18), rgba(200,140,250,.18), transparent);
  animation: hero-scan 9s linear infinite;
}

/* ─ Ambient grid ─ */
.ambi-grid {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(251,191,36,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251,191,36,.035) 1px, transparent 1px);
  background-size: 38px 38px;
}
@keyframes grid-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
.ambi-grid { animation: grid-pulse 6s ease-in-out infinite; }

/* ─ Card glow border pulse ─ */
@keyframes card-border {
  0%,100% { box-shadow: var(--cb-base); }
  50%     { box-shadow: var(--cb-glow); }
}
.cbp { animation: card-border 3.5s ease-in-out infinite; }

/* ─ Hover lift ─ */
.hlift { transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease; }
.hlift:hover { transform: translateY(-6px) scale(1.015); }

/* ─ Hero text gradient anim ─ */
@keyframes grad-shift {
  0%  { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100%{ background-position: 0% 50%; }
}
.hero-title-grad {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #e879f9, #c084fc, #818cf8, #fbbf24);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: grad-shift 5s ease-in-out infinite;
  filter: drop-shadow(0 0 24px rgba(251,191,36,.35));
}

/* ─ Loading spinner ─ */
@keyframes spin   { to { transform: rotate(360deg); } }
@keyframes spin-r { to { transform: rotate(-360deg); } }

/* ─ Section label underline ─ */
.sec-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.sec-label::after {
  content: '';
  position: absolute;
  bottom: -4px; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, rgba(251,191,36,.6), rgba(168,85,247,.4), transparent);
}

/* ─ Scrollbar ─ */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1e1a00; border-radius: 4px; }
`;

/* ══════════════════════════════════════════════════════════════
   GEMS — beautifully designed floating crystal shapes
══════════════════════════════════════════════════════════════ */

/* Glossy diamond gem SVG component */
function GemDiamond({ size = 80, color1, color2, glowColor, className, style }) {
  const id = useRef(`gd-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className={className} style={{ width: size, height: size, position: 'absolute', ...style, filter: `drop-shadow(0 0 ${size*.3}px ${glowColor}) drop-shadow(0 ${size*.12}px ${size*.35}px rgba(0,0,0,.8))` }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
        <defs>
          <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color1} stopOpacity="1"/>
            <stop offset="55%"  stopColor={color2} stopOpacity=".9"/>
            <stop offset="100%" stopColor={color1} stopOpacity=".7"/>
          </linearGradient>
          <linearGradient id={`${id}-b`} x1="20%" y1="0%" x2="60%" y2="80%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.7)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id={`${id}-c`} cx="35%" cy="30%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.55)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        {/* Main body */}
        <polygon points="50,5 95,38 75,95 25,95 5,38" fill={`url(#${id}-a)`}/>
        {/* Inner facets */}
        <polygon points="50,5 95,38 50,45" fill={`url(#${id}-b)`} opacity=".5"/>
        <polygon points="50,5 5,38 50,45"  fill="rgba(255,255,255,.08)"/>
        <polygon points="95,38 75,95 50,65 50,45" fill="rgba(0,0,0,.18)"/>
        <polygon points="5,38 25,95 50,65 50,45"  fill="rgba(255,255,255,.07)"/>
        <polygon points="50,45 50,65 75,95 25,95"  fill="rgba(0,0,0,.1)"/>
        {/* Gloss highlight */}
        <ellipse cx="38" cy="26" rx="14" ry="9" fill={`url(#${id}-c)`} className="gem-shine"/>
        {/* Edge sparkle */}
        <circle cx="50" cy="5" r="2.5" fill="rgba(255,255,255,.9)"/>
      </svg>
    </div>
  );
}

/* Glossy octagon gem */
function GemOctagon({ size = 60, color1, color2, glowColor, className, style }) {
  const id = useRef(`go-${Math.random().toString(36).slice(2)}`).current;
  const pts = [
    [50,5],[82,18],[95,50],[82,82],[50,95],[18,82],[5,50],[18,18]
  ].map(([x,y])=>`${x},${y}`).join(' ');
  const innerPts = [
    [50,18],[71,27],[82,50],[71,73],[50,82],[29,73],[18,50],[29,27]
  ].map(([x,y])=>`${x},${y}`).join(' ');
  return (
    <div className={className} style={{ width: size, height: size, position: 'absolute', ...style, filter: `drop-shadow(0 0 ${size*.28}px ${glowColor}) drop-shadow(0 ${size*.1}px ${size*.3}px rgba(0,0,0,.85))` }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%',height:'100%' }}>
        <defs>
          <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color1}/>
            <stop offset="100%" stopColor={color2}/>
          </linearGradient>
          <radialGradient id={`${id}-b`} cx="35%" cy="30%" r="45%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.6)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <polygon points={pts} fill={`url(#${id}-a)`}/>
        <polygon points={innerPts} fill="rgba(0,0,0,.12)" stroke="rgba(255,255,255,.08)" strokeWidth=".5"/>
        <polygon points="50,5 82,18 50,32 18,18" fill="rgba(255,255,255,.12)"/>
        <polygon points="82,18 95,50 68,50 50,32" fill="rgba(255,255,255,.06)"/>
        <ellipse cx="36" cy="32" rx="12" ry="8" fill={`url(#${id}-b)`} className="gem-shine"/>
        <circle cx="50" cy="5" r="2" fill="rgba(255,255,255,.95)"/>
        <circle cx="95" cy="50" r="1.5" fill="rgba(255,255,255,.6)"/>
      </svg>
    </div>
  );
}

/* Teardrop/shield gem */
function GemShield({ size = 50, color1, color2, glowColor, className, style }) {
  const id = useRef(`gs-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className={className} style={{ width: size, height: size, position: 'absolute', ...style, filter: `drop-shadow(0 0 ${size*.32}px ${glowColor}) drop-shadow(0 ${size*.12}px ${size*.28}px rgba(0,0,0,.8))` }}>
      <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%',height:'100%' }}>
        <defs>
          <linearGradient id={`${id}-a`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%"   stopColor={color1}/>
            <stop offset="100%" stopColor={color2}/>
          </linearGradient>
          <radialGradient id={`${id}-b`} cx="38%" cy="28%" r="42%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.65)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        {/* Rounded top, pointed bottom */}
        <path d="M50,5 C20,5 5,20 5,40 C5,70 50,105 50,105 C50,105 95,70 95,40 C95,20 80,5 50,5 Z" fill={`url(#${id}-a)`}/>
        <path d="M50,5 C20,5 5,20 5,40 L50,42 L95,40 C95,20 80,5 50,5 Z" fill="rgba(255,255,255,.1)"/>
        <path d="M5,40 L50,42 L50,105 C30,85 5,63 5,40 Z" fill="rgba(255,255,255,.06)"/>
        <ellipse cx="37" cy="30" rx="14" ry="9" fill={`url(#${id}-b)`} className="gem-shine"/>
        <circle cx="50" cy="5" r="2.5" fill="rgba(255,255,255,.9)"/>
      </svg>
    </div>
  );
}

/* Round brilliant gem */
function GemRound({ size = 45, color1, color2, glowColor, className, style }) {
  const id = useRef(`gr-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className={className} style={{ width: size, height: size, position: 'absolute', ...style, filter: `drop-shadow(0 0 ${size*.4}px ${glowColor}) drop-shadow(0 ${size*.1}px ${size*.3}px rgba(0,0,0,.8))` }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%',height:'100%' }}>
        <defs>
          <radialGradient id={`${id}-a`} cx="40%" cy="35%" r="55%">
            <stop offset="0%"   stopColor={color1}/>
            <stop offset="100%" stopColor={color2}/>
          </radialGradient>
          <radialGradient id={`${id}-b`} cx="32%" cy="28%" r="38%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.75)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
          <radialGradient id={`${id}-c`} cx="65%" cy="68%" r="30%">
            <stop offset="0%"   stopColor="rgba(255,255,255,.25)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-a)`}/>
        {/* Facet lines */}
        {[0,45,90,135].map(a => {
          const rad = a * Math.PI/180;
          return <line key={a} x1="50" y1="50" x2={50+47*Math.cos(rad)} y2={50+47*Math.sin(rad)} stroke="rgba(255,255,255,.07)" strokeWidth="1"/>;
        })}
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
        <circle cx="50" cy="50" r="14" fill="rgba(0,0,0,.15)"/>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-b)`}/>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-c)`}/>
        <circle cx="34" cy="28" r="7" fill="rgba(255,255,255,.45)"/>
        <circle cx="62" cy="66" r="3" fill="rgba(255,255,255,.2)"/>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PARTICLES
══════════════════════════════════════════════════════════════ */
function Particles({ accent, count = 14 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      bottom: `${Math.random() * 22}%`,
      size: 1.5 + Math.random() * 2.8,
      pd: `${3 + Math.random() * 5}s`,
      pdl: `${-Math.random() * 6}s`,
      px: `${(Math.random() - .5) * 50}px`,
      py: `-${60 + Math.random() * 90}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background: accent, boxShadow: `0 0 ${p.size*4}px ${accent}`,
          '--pd':p.pd, '--pdl':p.pdl, '--px':p.px, '--py':p.py,
        }}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════════════ */
function HeroBanner() {
  return (
    <motion.div
      initial={{ opacity:0, y:24 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.8, ease:[.22,1,.36,1] }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:20,
        background:'linear-gradient(125deg,#050010 0%,#0e0025 35%,#1a0040 65%,#08001a 100%)',
        minHeight:260,
        boxShadow:'0 0 0 1px rgba(251,191,36,.12), 0 24px 80px rgba(0,0,0,.9), 0 0 100px rgba(120,40,200,.18)',
      }}>

      <div className="ambi-grid"/>
      <div className="hero-scan"/>

      {/* Color atmosphere */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 65% 90% at 72% 55%, rgba(120,40,200,.22) 0%, transparent 60%), radial-gradient(ellipse 35% 45% at 88% 8%, rgba(251,191,36,.14) 0%, transparent 50%)',
      }}/>

      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <Particles accent="#fbbf24" count={10}/>
        <Particles accent="#a855f7" count={8}/>
      </div>

      {/* Case images */}
      <img src={vtechImg} alt="" className="gf1"
        style={{ position:'absolute', right:'28%', top:'5%', width:134,
          filter:'drop-shadow(0 0 30px rgba(168,85,247,.9)) drop-shadow(0 14px 40px rgba(0,0,0,.95))' }}/>
      <img src={roseImg} alt="" className="gf2"
        style={{ position:'absolute', right:'8%', top:'12%', width:150,
          filter:'drop-shadow(0 0 30px rgba(251,191,36,.8)) drop-shadow(0 14px 40px rgba(0,0,0,.95))' }}/>
      <img src={irishImg} alt="" className="gf3"
        style={{ position:'absolute', right:'18%', bottom:'8%', width:112,
          filter:'drop-shadow(0 0 24px rgba(251,191,36,.7)) drop-shadow(0 12px 36px rgba(0,0,0,.95))' }}/>

      {/* FLOATING GEMS around the case images */}
      <GemDiamond size={62} color1="#e9d5ff" color2="#7c3aed" glowColor="rgba(168,85,247,.95)"
        className="gf4" style={{ right:'46%', top:'8%' }}/>
      <GemOctagon size={44} color1="#fde68a" color2="#d97706" glowColor="rgba(251,191,36,.9)"
        className="gf5" style={{ right:'53%', bottom:'16%' }}/>
      <GemRound size={34} color1="#f9a8d4" color2="#9d174d" glowColor="rgba(236,72,153,.85)"
        className="gf6" style={{ right:'40%', bottom:'28%' }}/>
      <GemShield size={38} color1="#bfdbfe" color2="#1d4ed8" glowColor="rgba(96,165,250,.85)"
        className="gf1" style={{ right:'62%', top:'18%', animationDelay:'2.5s' }}/>
      <GemRound size={22} color1="#bbf7d0" color2="#16a34a" glowColor="rgba(74,222,128,.8)"
        className="gf2" style={{ right:'44%', top:'52%', animationDelay:'1.2s' }}/>

      {/* Text content */}
      <div style={{ position:'relative', zIndex:10, padding:'46px 46px' }}>

        {/* Live badge */}
        <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2 }}
          style={{
            display:'inline-flex', alignItems:'center', gap:8, marginBottom:18,
            background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.22)',
            borderRadius:100, padding:'4px 14px 4px 10px',
          }}>
          <div style={{ position:'relative', width:8, height:8 }}>
            <div className="live-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(251,191,36,.45)' }}/>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 10px #fbbf24' }}/>
          </div>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.18em', color:'rgba(251,191,36,.75)', textTransform:'uppercase', fontFamily:'Nunito,sans-serif' }}>Live Now</span>
        </motion.div>

        <motion.h1 initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:.26, duration:.85, ease:[.22,1,.36,1] }}
          style={{ margin:0, lineHeight:1.1, marginBottom:12 }}>
          <span style={{ display:'block', fontSize:'clamp(30px,4vw,46px)', fontWeight:900, color:'#fff', fontFamily:'Nunito,sans-serif' }}>
            Welcome To
          </span>
          <span className="hero-title-grad"
            style={{ display:'block', fontSize:'clamp(34px,4.5vw,52px)', fontWeight:900, fontFamily:'Nunito,sans-serif' }}>
            Amethystgg!
          </span>
        </motion.h1>

        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.42 }}
          style={{ fontSize:13, color:'rgba(255,255,255,.4)', lineHeight:1.65, marginBottom:28, maxWidth:320, fontWeight:400 }}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{ color:'#fbbf24', fontWeight:700 }}>amazing rewards.</span>
        </motion.p>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.54 }}
          style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.96 }}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'11px 22px',
                borderRadius:12, border:'none', cursor:'pointer',
                fontSize:14, fontWeight:800, color:'#000', fontFamily:'Nunito,sans-serif',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)',
                boxShadow:'0 0 40px rgba(251,191,36,.5), 0 4px 20px rgba(0,0,0,.5)',
              }}>
              <Trophy style={{ width:15, height:15 }}/> View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.96 }}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'11px 22px',
                borderRadius:12, cursor:'pointer',
                fontSize:14, fontWeight:800, color:'rgba(251,191,36,.9)', fontFamily:'Nunito,sans-serif',
                background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.25)',
              }}>
              Open Cases <ChevronRight style={{ width:15, height:15 }}/>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Bottom line */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:1.5,
        background:'linear-gradient(90deg,transparent,rgba(251,191,36,.6),rgba(168,85,247,.6),transparent)',
        pointerEvents:'none',
      }}/>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GAME CARD DATA
══════════════════════════════════════════════════════════════ */
const GAMES = [
  {
    name:'Battles', page:'Battles', icon:Swords, size:'lg',
    bg:'linear-gradient(145deg,#08001a 0%,#150040 45%,#0a0020 100%)',
    accent:'#c084fc', glowColor:'rgba(192,132,252,.32)',
    caseImg: vtechImg,
    caseGlow:'drop-shadow(0 0 32px rgba(192,132,252,.9)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    borderBase:'0 0 0 1px rgba(192,132,252,.14), 0 20px 60px rgba(0,0,0,.8)',
    borderGlow:'0 0 0 1px rgba(192,132,252,.35), 0 20px 60px rgba(0,0,0,.8), 0 0 80px rgba(192,132,252,.2)',
    tag:'HOT', tagColor:'#d97706',
    gems: [
      { type:'diamond', size:90, color1:'#e9d5ff', color2:'#6d28d9', glow:'rgba(167,139,250,.95)', right:'48%', top:'10%', cls:'gf2' },
      { type:'round',   size:55, color1:'#fde68a', color2:'#a16207', glow:'rgba(251,191,36,.85)',  right:'38%', top:'50%', cls:'gf4' },
      { type:'shield',  size:36, color1:'#f9a8d4', color2:'#be185d', glow:'rgba(236,72,153,.8)',   right:'58%', top:'42%', cls:'gf5' },
    ],
  },
  {
    name:'Cases', page:'Cases', icon:Box, size:'lg',
    bg:'linear-gradient(145deg,#0d0800 0%,#1e1200 45%,#0d0600 100%)',
    accent:'#fbbf24', glowColor:'rgba(251,191,36,.32)',
    caseImg: roseImg,
    caseGlow:'drop-shadow(0 0 32px rgba(251,191,36,.95)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    borderBase:'0 0 0 1px rgba(251,191,36,.13), 0 20px 60px rgba(0,0,0,.8)',
    borderGlow:'0 0 0 1px rgba(251,191,36,.32), 0 20px 60px rgba(0,0,0,.8), 0 0 80px rgba(251,191,36,.18)',
    tag:'NEW', tagColor:'#7c3aed',
    gems: [
      { type:'octagon', size:84, color1:'#fde68a', color2:'#b45309', glow:'rgba(251,191,36,.95)', right:'46%', top:'8%',  cls:'gf1' },
      { type:'round',   size:52, color1:'#c084fc', color2:'#6b21a8', glow:'rgba(192,132,252,.85)',right:'36%', top:'52%', cls:'gf3' },
      { type:'diamond', size:34, color1:'#bbf7d0', color2:'#15803d', glow:'rgba(74,222,128,.8)',  right:'56%', top:'38%', cls:'gf6' },
    ],
  },
  {
    name:'Coinflip', page:'Coinflip', icon:RotateCcw, size:'sm',
    bg:'linear-gradient(145deg,#060010 0%,#10002c 55%,#04000c 100%)',
    accent:'#fbbf24', glowColor:'rgba(251,191,36,.25)',
    caseImg: irishImg,
    caseGlow:'drop-shadow(0 0 24px rgba(251,191,36,.9)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
    borderBase:'0 0 0 1px rgba(251,191,36,.1), 0 14px 44px rgba(0,0,0,.8)',
    borderGlow:'0 0 0 1px rgba(251,191,36,.28), 0 14px 44px rgba(0,0,0,.8), 0 0 55px rgba(251,191,36,.15)',
    gems: [
      { type:'round',   size:58, color1:'#fde68a', color2:'#d97706', glow:'rgba(251,191,36,.9)', right:'28%', top:'5%',  cls:'gf2' },
      { type:'shield',  size:32, color1:'#c084fc', color2:'#7e22ce', glow:'rgba(192,132,252,.8)',right:'48%', top:'38%', cls:'gf5' },
    ],
  },
  {
    name:'Crash', page:'Crash', icon:Zap, size:'sm',
    bg:'linear-gradient(145deg,#060008 0%,#100020 55%,#030008 100%)',
    accent:'#a855f7', glowColor:'rgba(168,85,247,.28)',
    caseImg: roseImg,
    caseGlow:'drop-shadow(0 0 24px rgba(168,85,247,.9)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
    borderBase:'0 0 0 1px rgba(168,85,247,.1), 0 14px 44px rgba(0,0,0,.8)',
    borderGlow:'0 0 0 1px rgba(168,85,247,.28), 0 14px 44px rgba(0,0,0,.8), 0 0 55px rgba(168,85,247,.15)',
    tag:'LIVE', tagColor:'#7c3aed',
    gems: [
      { type:'diamond', size:62, color1:'#e879f9', color2:'#7e22ce', glow:'rgba(232,121,249,.92)', right:'26%', top:'4%',  cls:'gf3' },
      { type:'octagon', size:36, color1:'#fde68a', color2:'#d97706', glow:'rgba(251,191,36,.8)',   right:'46%', top:'44%', cls:'gf6' },
    ],
  },
];

/* ── Gem renderer ── */
function CardGems({ gems, hov }) {
  return gems.map((g, i) => {
    const GemComp = { diamond: GemDiamond, octagon: GemOctagon, shield: GemShield, round: GemRound }[g.type];
    if (!GemComp) return null;
    return (
      <motion.div key={i}
        animate={{ scale: hov ? 1.12 : 1, y: hov ? -8 : 0 }}
        transition={{ type:'spring', stiffness:160, damping:18, delay: i * .04 }}>
        <GemComp size={g.size} color1={g.color1} color2={g.color2} glowColor={g.glow}
          className={g.cls} style={{ right:g.right, top:g.top }}/>
      </motion.div>
    );
  });
}

/* ══════════════════════════════════════════════════════════════
   LARGE GAME CARD
══════════════════════════════════════════════════════════════ */
function LgGameCard({ g, i }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:30, scale:.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.12 + i*.1, duration:.75, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl(g.page)}>
        <div
          className="card-shim hlift cbp"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18, cursor:'pointer',
            height:220, background:g.bg,
            '--cb-base': g.borderBase,
            '--cb-glow': g.borderGlow,
            '--shim-dl': `${i * .8}s`,
          }}>

          {/* Subtle inner grid */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
            backgroundImage:`linear-gradient(${g.accent}07 1px, transparent 1px), linear-gradient(90deg, ${g.accent}07 1px, transparent 1px)`,
            backgroundSize:'32px 32px',
          }}/>

          {/* Atmospheric glow */}
          <motion.div animate={{ opacity: hov ? 1 : .45 }} transition={{ duration:.5 }}
            style={{
              position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
              background:`radial-gradient(ellipse 80% 75% at 70% 40%, ${g.glowColor} 0%, transparent 60%)`,
            }}/>

          {hov && <Particles accent={g.accent} count={14}/>}

          {/* Floating gems */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:3 }}>
            <CardGems gems={g.gems} hov={hov}/>
          </div>

          {/* Case image */}
          <motion.img src={g.caseImg} alt={g.name}
            animate={{ scale: hov ? 1.1 : 1, y: hov ? -10 : 0, rotate: hov ? 4 : 0 }}
            transition={{ type:'spring', stiffness:180, damping:18 }}
            style={{
              position:'absolute', right:16, top:'50%', marginTop:-78, width:156,
              pointerEvents:'none', userSelect:'none', filter:g.caseGlow, zIndex:4,
            }}/>

          {/* Bottom info bar */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:8,
            background:'linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.7) 45%, transparent 100%)',
            padding:'22px 20px 16px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <g.icon style={{ width:16, height:16, color:g.accent }}/>
              <span style={{ fontSize:17, fontWeight:900, color:'#fff', fontFamily:'Nunito,sans-serif' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize:9, fontWeight:800, letterSpacing:'.16em', textTransform:'uppercase',
                  color: g.tag === 'HOT' ? '#000' : '#fff',
                  background: g.tag === 'HOT' ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : g.tagColor,
                  borderRadius:6, padding:'2px 8px',
                  boxShadow: g.tag === 'HOT' ? '0 0 14px rgba(251,191,36,.65)' : undefined,
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          {/* Top hover line */}
          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .3 }}
            transition={{ duration:.35 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:2, zIndex:9,
              background:`linear-gradient(90deg, transparent, ${g.accent}, rgba(251,191,36,.9), ${g.accent}, transparent)`,
              transformOrigin:'center',
            }}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SMALL GAME CARD
══════════════════════════════════════════════════════════════ */
function SmGameCard({ g, i }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:24, scale:.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.28 + i*.09, duration:.65, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl(g.page)}>
        <div
          className="card-shim hlift"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18, cursor:'pointer',
            height:165, background:g.bg,
            boxShadow: hov ? g.borderGlow : g.borderBase,
            transition:'box-shadow .35s ease',
            '--shim-dl': `${(i+2) * .7}s`,
          }}>

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
            backgroundImage:`linear-gradient(${g.accent}06 1px, transparent 1px), linear-gradient(90deg, ${g.accent}06 1px, transparent 1px)`,
            backgroundSize:'26px 26px',
          }}/>

          <motion.div animate={{ opacity: hov ? 1 : .4 }} transition={{ duration:.5 }}
            style={{
              position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
              background:`radial-gradient(ellipse 90% 75% at 75% 35%, ${g.glowColor} 0%, transparent 60%)`,
            }}/>

          {hov && <Particles accent={g.accent} count={9}/>}

          {/* Gems */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:3 }}>
            <CardGems gems={g.gems} hov={hov}/>
          </div>

          {/* Case image */}
          <motion.img src={g.caseImg} alt={g.name}
            animate={{ scale: hov ? 1.16 : 1, y: hov ? -8 : 0, rotate: hov ? 6 : 0 }}
            transition={{ type:'spring', stiffness:220, damping:18 }}
            style={{
              position:'absolute', right:10, top:6, width:118,
              pointerEvents:'none', userSelect:'none', filter:g.caseGlow, zIndex:4,
            }}/>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:8,
            background:'linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.7) 50%, transparent 100%)',
            padding:'18px 18px 14px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <g.icon style={{ width:14, height:14, color:g.accent }}/>
              <span style={{ fontSize:15, fontWeight:900, color:'#fff', fontFamily:'Nunito,sans-serif' }}>{g.name}</span>
              {g.tag && (
                <span style={{
                  fontSize:9, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase',
                  color:'#fff', background:g.tagColor, borderRadius:5, padding:'2px 7px',
                  boxShadow:'0 0 10px rgba(124,58,237,.5)',
                }}>{g.tag}</span>
              )}
            </div>
          </div>

          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .3 }}
            transition={{ duration:.35 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:2, zIndex:9,
              background:`linear-gradient(90deg, transparent, ${g.accent}, rgba(251,191,36,.7), ${g.accent}, transparent)`,
              transformOrigin:'center',
            }}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURED CASE CARD (3rd small slot)
══════════════════════════════════════════════════════════════ */
function FeaturedSlot() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:24, scale:.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.46, duration:.65, ease:[.22,1,.36,1] }}>
      <Link to={createPageUrl('Cases')}>
        <div
          className="card-shim hlift"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18, cursor:'pointer', height:165,
            background:'linear-gradient(145deg,#07001a 0%,#120035 55%,#04000d 100%)',
            boxShadow: hov
              ? '0 0 0 1px rgba(251,191,36,.32), 0 14px 44px rgba(0,0,0,.8), 0 0 55px rgba(251,191,36,.18)'
              : '0 0 0 1px rgba(251,191,36,.12), 0 14px 44px rgba(0,0,0,.8)',
            transition:'box-shadow .35s ease',
            '--shim-dl':'1.4s',
          }}>
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
            background:'radial-gradient(ellipse 80% 70% at 78% 35%, rgba(251,191,36,.18) 0%, transparent 60%)',
          }}/>

          {hov && <Particles accent="#fbbf24" count={9}/>}

          {/* Floating case + gems */}
          <img src={vtechImg} alt="" className="gf1" style={{
            position:'absolute', right:4, top:-6, width:90, zIndex:4,
            filter:'drop-shadow(0 0 20px rgba(168,85,247,.8)) drop-shadow(0 8px 24px rgba(0,0,0,.95))',
          }}/>
          <img src={irishImg} alt="" className="gf3" style={{
            position:'absolute', right:54, top:40, width:62, zIndex:4, opacity:.9,
            filter:'drop-shadow(0 0 16px rgba(251,191,36,.75)) drop-shadow(0 6px 18px rgba(0,0,0,.95))',
          }}/>

          {/* Mini gems */}
          <GemDiamond size={32} color1="#fde68a" color2="#b45309" glowColor="rgba(251,191,36,.85)"
            className="gf4" style={{ right:'54%', top:'8%', zIndex:3 }}/>
          <GemRound size={22} color1="#c084fc" color2="#6d28d9" glowColor="rgba(192,132,252,.8)"
            className="gf5" style={{ right:'42%', bottom:'22%', zIndex:3 }}/>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:8,
            background:'linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.7) 50%, transparent 100%)',
            padding:'18px 18px 14px',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Star style={{ width:14, height:14, color:'#fbbf24' }}/>
                <span style={{ fontSize:15, fontWeight:900, color:'#fff', fontFamily:'Nunito,sans-serif' }}>Featured Cases</span>
              </div>
              <ChevronRight style={{ width:14, height:14, color:'rgba(251,191,36,.6)' }}/>
            </div>
          </div>

          <motion.div animate={{ opacity: hov ? 1 : 0, scaleX: hov ? 1 : .3 }}
            style={{
              position:'absolute', top:0, left:0, right:0, height:2, zIndex:9,
              background:'linear-gradient(90deg, transparent, #fbbf24, #a855f7, transparent)',
              transformOrigin:'center',
            }}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURED CASE MINI CARDS
══════════════════════════════════════════════════════════════ */
function FeaturedCard({ c, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5+i*.08 }}>
      <Link to={`${createPageUrl('CaseOpen')}?id=${c.id}`}>
        <div className="card-shim hlift"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            position:'relative', overflow:'hidden', borderRadius:14, cursor:'pointer',
            padding:'18px 14px', textAlign:'center',
            background:'linear-gradient(145deg,#080012,#100022)',
            boxShadow: hov
              ? '0 0 0 1px rgba(251,191,36,.22), 0 10px 40px rgba(0,0,0,.85), 0 0 40px rgba(251,191,36,.1)'
              : '0 0 0 1px rgba(251,191,36,.09), 0 8px 30px rgba(0,0,0,.8)',
            transition:'box-shadow .3s ease',
            '--shim-dl':`${i*.5}s`,
          }}>
          <motion.div
            animate={{ scale: hov ? 1.08 : 1 }}
            transition={{ type:'spring', stiffness:220, damping:18 }}
            style={{
              width:50, height:50, margin:'0 auto 10px', borderRadius:12,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(135deg,rgba(251,191,36,.15),rgba(168,85,247,.15))',
              border:'1px solid rgba(251,191,36,.25)',
              boxShadow: hov ? '0 4px 20px rgba(251,191,36,.2)' : '0 4px 16px rgba(251,191,36,.1)',
            }}>
            <Gift style={{ width:22, height:22, color:'#fbbf24' }}/>
          </motion.div>
          <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' }}>{c.name}</div>
          <div style={{ fontSize:12, fontWeight:800, color:'#fbbf24', fontFamily:'Nunito,sans-serif' }}>{c.price?.toLocaleString()} coins</div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════════ */
function SectionHead({ label, icon: Icon, accent = '#fbbf24', right }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:3, height:22, borderRadius:3, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }}/>
        <Icon style={{ width:16, height:16, color:accent }}/>
        <span style={{ fontSize:17, fontWeight:900, color:'#fff', fontFamily:'Nunito,sans-serif', letterSpacing:'.01em' }}>{label}</span>
      </div>
      {right}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4)
      .then(setFeaturedCases).catch(() => setFeaturedCases([]));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:'#04000a' }}>
      <div style={{ position:'relative', width:52, height:52 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #fbbf24', animation:'spin 1s linear infinite' }}/>
        <div style={{ position:'absolute', inset:7, borderRadius:'50%', border:'2px solid #a855f7', animation:'spin-r .72s linear infinite' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 16px #fbbf24' }}/>
        </div>
      </div>
    </div>
  );

  const lgGames = GAMES.filter(g => g.size === 'lg');
  const smGames = GAMES.filter(g => g.size === 'sm');

  return (
    <div className="lv page-bg" style={{ minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>

        <HeroBanner/>

        <section>
          <SectionHead label="Magic Games" icon={Zap} accent="#fbbf24"/>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {lgGames.map((g,i) => <LgGameCard key={g.name} g={g} i={i}/>)}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {smGames.map((g,i) => <SmGameCard key={g.name} g={g} i={i}/>)}
            <FeaturedSlot/>
          </div>
        </section>

        {featuredCases.length > 0 && (
          <section>
            <SectionHead label="Featured Cases" icon={Gift} accent="#fbbf24"
              right={
                <Link to={createPageUrl('Cases')}>
                  <motion.span whileHover={{ x:3 }}
                    style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:'rgba(251,191,36,.6)', cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
                    View all <ChevronRight style={{ width:13, height:13 }}/>
                  </motion.span>
                </Link>
              }/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {featuredCases.map((c,i) => <FeaturedCard key={c.id} c={c} i={i}/>)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}