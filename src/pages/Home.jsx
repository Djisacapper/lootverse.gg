import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Swords, Box, RotateCcw, Zap, Star } from 'lucide-react';

/* ══════ HERO IMAGES ══════ */
const vtechImg = 'https://i.imgur.com/doYHRMp.png';
const roseImg  = 'https://i.imgur.com/WVoUpzN.png';
const irishImg = 'https://i.imgur.com/7KIsUqY.png';

/* ══════════════════════════════════════════════
   GAMEMODE IMAGES — replace each URL below
   ══════════════════════════════════════════════ */
const battlesImg  = 'https://i.imgur.com/vHp8zbU.png';
const casesImg    = 'https://i.imgur.com/WXw330m.png';
const coinflipImg = 'https://i.imgur.com/3AUD8Vu.png';
const crashImg    = 'https://i.imgur.com/53dgn4r.png';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.lv { font-family: 'Nunito', sans-serif; }

/* ── gem floats ── */
@keyframes gf1 { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 33%{transform:translateY(-22px) rotate(11deg) scale(1.05)} 66%{transform:translateY(-8px) rotate(-7deg) scale(.97)} }
@keyframes gf2 { 0%,100%{transform:translateY(0) rotate(0deg)} 40%{transform:translateY(-28px) rotate(-13deg) scale(1.07)} 72%{transform:translateY(-10px) rotate(6deg)} }
@keyframes gf3 { 0%,100%{transform:translateY(0) rotate(0deg)} 36%{transform:translateY(-18px) rotate(16deg)} 68%{transform:translateY(-6px) rotate(-9deg)} }
@keyframes gf4 { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 44%{transform:translateY(-20px) rotate(-8deg) scale(1.04)} }
@keyframes gf5 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-24px) rotate(18deg)} }
.gfa{animation:gf1 7s ease-in-out infinite}
.gfb{animation:gf2 9s ease-in-out infinite 1.1s}
.gfc{animation:gf3 6.5s ease-in-out infinite 2.3s}
.gfd{animation:gf4 8.5s ease-in-out infinite 0.6s}
.gfe{animation:gf5 11s ease-in-out infinite 1.8s}
.gff{animation:gf1 7.8s ease-in-out infinite 3.2s}
.gfg{animation:gf2 10s ease-in-out infinite 0.3s}
.gfh{animation:gf3 8.2s ease-in-out infinite 4s}
.gfi{animation:gf4 9.5s ease-in-out infinite 2s}
.gfj{animation:gf5 6.8s ease-in-out infinite 1.5s}

@keyframes gem-shimmer{0%,100%{opacity:.3;transform:rotate(0deg) scale(.8)}50%{opacity:.8;transform:rotate(180deg) scale(1.1)}}
.gs{animation:gem-shimmer 3s ease-in-out infinite}

/* ── hero floats ── */
@keyframes hf1{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-16px) rotate(-1deg)}}
@keyframes hf2{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-20px) rotate(6deg)}}
@keyframes hf3{0%,100%{transform:translateY(0) rotate(2deg)}42%{transform:translateY(-12px) rotate(-3deg)}}
.hfa{animation:hf1 6s ease-in-out infinite}
.hfb{animation:hf2 8s ease-in-out infinite .9s}
.hfc{animation:hf3 7s ease-in-out infinite 1.5s}

/* ── particles ── */
@keyframes ptcl{0%{transform:translateY(0) translateX(0);opacity:0}8%{opacity:1}88%{opacity:.5}100%{transform:translateY(var(--py)) translateX(var(--px));opacity:0}}
.pt{position:absolute;border-radius:50%;pointer-events:none;animation:ptcl var(--pd) ease-out infinite var(--pdl)}

/* ── live dot ── */
@keyframes live-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.5);opacity:0}}
.live-ring{animation:live-pulse 1.8s ease-out infinite}

/* ── scan ── */
@keyframes scan{0%{top:-1px;opacity:0}4%{opacity:.6}92%{opacity:.3}100%{top:100%;opacity:0}}
.scan{position:absolute;left:0;right:0;height:1px;pointer-events:none;z-index:4;
  background:linear-gradient(90deg,transparent,rgba(251,191,36,.18),rgba(200,140,255,.15),transparent);
  animation:scan 9s linear infinite}

/* ── ambient grid ── */
.ambi-grid{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(251,191,36,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,.03) 1px,transparent 1px);
  background-size:40px 40px}

/* ── hero title gradient ── */
@keyframes grad-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.title-grad{
  background:linear-gradient(90deg,#fbbf24,#f59e0b,#e879f9,#c084fc,#818cf8,#fbbf24);
  background-size:300% 100%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:grad-shift 5s ease-in-out infinite;
  filter:drop-shadow(0 0 22px rgba(251,191,36,.3));
}

/* ══ GAME CARD SYSTEM ══
   Default: themed purple/dark tint (sepia-like but on-brand)
   Hover:   full vivid colour + glow
*/
.gc-img {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; object-position:center;
  border-radius:inherit;
  /* Themed greyscale: dark purple-black tint instead of plain grey */
  filter: grayscale(1) brightness(.35) sepia(.4) hue-rotate(230deg);
  transform: scale(1.02);
  transition: filter .55s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1);
  will-change: filter, transform;
}
.gc-card:hover .gc-img {
  filter: grayscale(0) brightness(.92) saturate(1.2) contrast(1.05);
  transform: scale(1.09);
}

/* Bottom vignette — always present */
.gc-vignette {
  position:absolute; inset:0; z-index:2; border-radius:inherit; pointer-events:none;
  background: linear-gradient(
    to top,
    rgba(2,0,14,.95) 0%,
    rgba(5,0,20,.7)  30%,
    rgba(8,0,28,.3)  58%,
    transparent      100%
  );
  transition: opacity .4s ease;
}

/* Colour overlay — purple/gold on hover only */
.gc-overlay {
  position:absolute; inset:0; z-index:3; border-radius:inherit; pointer-events:none;
  opacity:0;
  transition: opacity .5s ease;
}
.gc-card:hover .gc-overlay { opacity:1; }

/* Sheen sweep on hover */
@keyframes sheen {
  0%   { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(300%)  skewX(-18deg); }
}
.gc-sheen {
  position:absolute; inset:0; z-index:4; pointer-events:none; overflow:hidden; border-radius:inherit;
}
.gc-sheen::after {
  content:''; position:absolute; top:0; bottom:0; width:35%;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.07) 40%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.07) 60%,transparent);
  transform: translateX(-120%) skewX(-18deg);
  opacity:0; transition:opacity .1s;
}
.gc-card:hover .gc-sheen::after {
  opacity:1;
  animation: sheen .75s ease forwards;
}

/* Top accent bar */
.gc-bar {
  position:absolute; top:0; left:0; right:0; height:2px; z-index:9;
  transform:scaleX(0); opacity:0; transform-origin:left;
  transition: transform .45s cubic-bezier(.4,0,.2,1), opacity .3s ease;
  border-radius:inherit;
}
.gc-card:hover .gc-bar { transform:scaleX(1); opacity:1; }

/* Card wrap transition */
.gc-card {
  position:relative; overflow:hidden; border-radius:18px; cursor:pointer;
  transition: box-shadow .4s ease, transform .3s cubic-bezier(.4,0,.2,1);
  will-change: transform, box-shadow;
}
.gc-card:hover { transform: translateY(-7px) scale(1.015); }

/* Badge pulse for LIVE */
@keyframes badge-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)} 50%{box-shadow:0 0 0 5px rgba(124,58,237,0)} }
.badge-live { animation: badge-pulse 2s ease infinite; }

@keyframes spin  { to{transform:rotate(360deg)}  }
@keyframes spinr { to{transform:rotate(-360deg)} }
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#1a1200;border-radius:4px}
`;

/* ══ GEM SVGs ══ */
function GemDiamond({ size, c1, c2, glow, style, className }) {
  const id = useRef(`d${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{ position:'absolute', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.28}px ${glow}) drop-shadow(0 ${size*.1}px ${size*.3}px rgba(0,0,0,.6))`,
      ...style, zIndex:0 }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="55%" stopColor={c2} stopOpacity=".85"/><stop offset="100%" stopColor={c1} stopOpacity=".7"/>
          </linearGradient>
          <linearGradient id={`${id}b`} x1="15%" y1="0%" x2="65%" y2="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,.7)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id={`${id}c`} cx="36%" cy="28%" r="48%">
            <stop offset="0%" stopColor="rgba(255,255,255,.5)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <polygon points="50,4 96,38 76,96 24,96 4,38" fill={`url(#${id}a)`}/>
        <polygon points="50,4 96,38 50,46" fill={`url(#${id}b)`} opacity=".5"/>
        <polygon points="50,4 4,38 50,46" fill="rgba(255,255,255,.07)"/>
        <polygon points="96,38 76,96 50,66 50,46" fill="rgba(0,0,0,.18)"/>
        <polygon points="4,38 24,96 50,66 50,46" fill="rgba(255,255,255,.05)"/>
        <polygon points="50,46 50,66 76,96 24,96" fill="rgba(0,0,0,.1)"/>
        <ellipse cx="37" cy="25" rx="12" ry="7" fill={`url(#${id}c)`} className="gs"/>
        <circle cx="50" cy="4" r="2.5" fill="rgba(255,255,255,.9)"/>
      </svg>
    </div>
  );
}
function GemOctagon({ size, c1, c2, glow, style, className }) {
  const id = useRef(`o${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{ position:'absolute', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.25}px ${glow}) drop-shadow(0 ${size*.09}px ${size*.26}px rgba(0,0,0,.65))`,
      ...style, zIndex:0 }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </linearGradient>
          <radialGradient id={`${id}b`} cx="34%" cy="28%" r="44%">
            <stop offset="0%" stopColor="rgba(255,255,255,.55)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <polygon points="50,4 82,18 96,50 82,82 50,96 18,82 4,50 18,18" fill={`url(#${id}a)`}/>
        <polygon points="50,4 82,18 50,34 18,18" fill="rgba(255,255,255,.13)"/>
        <polygon points="50,34 66,50 82,82 18,82 34,50" fill="rgba(0,0,0,.12)"/>
        <ellipse cx="36" cy="30" rx="12" ry="7" fill={`url(#${id}b)`} className="gs"/>
        <circle cx="50" cy="4" r="2" fill="rgba(255,255,255,.88)"/>
      </svg>
    </div>
  );
}
function GemTeardrop({ size, c1, c2, glow, style, className }) {
  const id = useRef(`t${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{ position:'absolute', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.28}px ${glow}) drop-shadow(0 ${size*.09}px ${size*.25}px rgba(0,0,0,.6))`,
      ...style, zIndex:0 }}>
      <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </linearGradient>
          <radialGradient id={`${id}b`} cx="37%" cy="28%" r="42%">
            <stop offset="0%" stopColor="rgba(255,255,255,.6)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <path d="M50,5 C22,5 5,22 5,42 C5,72 50,106 50,106 C50,106 95,72 95,42 C95,22 78,5 50,5 Z" fill={`url(#${id}a)`}/>
        <path d="M50,5 C22,5 5,22 5,42 L50,44 L95,42 C95,22 78,5 50,5 Z" fill="rgba(255,255,255,.1)"/>
        <ellipse cx="36" cy="29" rx="13" ry="8" fill={`url(#${id}b)`} className="gs"/>
        <circle cx="50" cy="5" r="2.4" fill="rgba(255,255,255,.88)"/>
      </svg>
    </div>
  );
}
function GemRound({ size, c1, c2, glow, style, className }) {
  const id = useRef(`r${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{ position:'absolute', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.35}px ${glow}) drop-shadow(0 ${size*.09}px ${size*.27}px rgba(0,0,0,.6))`,
      ...style, zIndex:0 }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <radialGradient id={`${id}a`} cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </radialGradient>
          <radialGradient id={`${id}b`} cx="32%" cy="26%" r="38%">
            <stop offset="0%" stopColor="rgba(255,255,255,.68)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}a)`}/>
        {[0,60,120].map(a=>{const r=a*Math.PI/180;return<line key={a} x1="50" y1="50" x2={50+47*Math.cos(r)} y2={50+47*Math.sin(r)} stroke="rgba(255,255,255,.05)" strokeWidth="1"/>;})}
        <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}b)`}/>
        <circle cx="33" cy="26" r="6" fill="rgba(255,255,255,.42)"/>
      </svg>
    </div>
  );
}

/* ══ PAGE GEMS — absolute inside a relative wrapper so they stay in layout ══ */
function PageGems() {
  return (
    <div style={{position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0}}>
      {/* Left column */}
      <GemDiamond size={64}  c1="#e9d5ff" c2="#6d28d9" glow="rgba(167,139,250,.75)" className="gfa" style={{left:8,   top:'7%'}}/>
      <GemRound   size={38}  c1="#fde68a" c2="#d97706" glow="rgba(251,191,36,.7)"   className="gfc" style={{left:14,  top:'24%'}}/>
      <GemTeardrop size={50} c1="#f9a8d4" c2="#9d174d" glow="rgba(236,72,153,.65)"  className="gfe" style={{left:4,   top:'46%'}}/>
      <GemOctagon size={34}  c1="#bbf7d0" c2="#15803d" glow="rgba(74,222,128,.65)"  className="gfb" style={{left:18,  top:'68%'}}/>
      <GemRound   size={26}  c1="#c084fc" c2="#7c3aed" glow="rgba(192,132,252,.65)" className="gfd" style={{left:8,   top:'86%'}}/>
      {/* Right column */}
      <GemOctagon size={60}  c1="#fbbf24" c2="#b45309" glow="rgba(251,191,36,.78)"  className="gfb" style={{right:8,  top:'5%'}}/>
      <GemTeardrop size={44} c1="#a78bfa" c2="#4c1d95" glow="rgba(139,92,246,.72)"  className="gfd" style={{right:14, top:'22%'}}/>
      <GemDiamond size={54}  c1="#fde68a" c2="#a16207" glow="rgba(251,191,36,.72)"  className="gff" style={{right:4,  top:'44%'}}/>
      <GemRound   size={32}  c1="#e879f9" c2="#7e22ce" glow="rgba(232,121,249,.68)" className="gfg" style={{right:18, top:'65%'}}/>
      <GemTeardrop size={46} c1="#bfdbfe" c2="#1d4ed8" glow="rgba(96,165,250,.68)"  className="gfh" style={{right:6,  top:'82%'}}/>
      {/* Top edge */}
      <GemRound   size={28}  c1="#fde68a" c2="#b45309" glow="rgba(251,191,36,.6)"   className="gfc" style={{left:'8%', top:6}}/>
      <GemDiamond size={38}  c1="#c084fc" c2="#6d28d9" glow="rgba(192,132,252,.65)" className="gfi" style={{left:'22%',top:-4}}/>
      <GemOctagon size={26}  c1="#f9a8d4" c2="#9d174d" glow="rgba(236,72,153,.6)"   className="gfj" style={{right:'20%',top:4}}/>
      <GemRound   size={32}  c1="#bbf7d0" c2="#15803d" glow="rgba(74,222,128,.6)"   className="gfb" style={{right:'9%',top:-4}}/>
    </div>
  );
}

/* ══ PARTICLES ══ */
function Particles({ accent, count = 12 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id:i, left:`${5+Math.random()*90}%`, bottom:`${Math.random()*18}%`,
    size:1.2+Math.random()*2.4, pd:`${3+Math.random()*5}s`,
    pdl:`${-Math.random()*6}s`, px:`${(Math.random()-.5)*48}px`,
    py:`-${50+Math.random()*80}px`,
  }))).current;
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {pts.map(p=>(
        <div key={p.id} className="pt" style={{
          left:p.left,bottom:p.bottom,width:p.size,height:p.size,
          background:accent,boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--pd':p.pd,'--pdl':p.pdl,'--px':p.px,'--py':p.py,
        }}/>
      ))}
    </div>
  );
}

/* ══ HERO ══ */
function HeroBanner() {
  return (
    <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
      transition={{duration:.8,ease:[.22,1,.36,1]}}
      style={{position:'relative',overflow:'hidden',borderRadius:22,
        background:'linear-gradient(130deg,#040010 0%,#0c001f 35%,#180038 65%,#070016 100%)',
        minHeight:262,
        boxShadow:'0 0 0 1px rgba(251,191,36,.1),0 28px 90px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.04)'}}>
      <div className="ambi-grid"/>
      <div className="scan"/>
      {/* deep atmosphere */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 85% at 72% 52%,rgba(110,30,200,.28) 0%,transparent 62%),' +
                   'radial-gradient(ellipse 32% 42% at 86% 8%,rgba(251,191,36,.12) 0%,transparent 52%)'}}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <Particles accent="#fbbf24" count={10}/>
        <Particles accent="#a855f7" count={8}/>
      </div>
      {/* floating case images */}
      <img src={vtechImg} alt="" className="hfa" style={{position:'absolute',right:'27%',top:'4%',width:128,pointerEvents:'none',
        filter:'drop-shadow(0 0 26px rgba(168,85,247,.9)) drop-shadow(0 12px 38px rgba(0,0,0,.95))'}}/>
      <img src={roseImg}  alt="" className="hfb" style={{position:'absolute',right:'7%', top:'10%',width:146,pointerEvents:'none',
        filter:'drop-shadow(0 0 26px rgba(251,191,36,.82)) drop-shadow(0 12px 38px rgba(0,0,0,.95))'}}/>
      <img src={irishImg} alt="" className="hfc" style={{position:'absolute',right:'17%',bottom:'6%',width:108,pointerEvents:'none',
        filter:'drop-shadow(0 0 20px rgba(251,191,36,.7)) drop-shadow(0 10px 34px rgba(0,0,0,.95))'}}/>
      {/* deco shapes */}
      <div className="hfa" style={{position:'absolute',right:'45%',top:'8%',width:48,height:48,
        background:'radial-gradient(circle at 35% 35%,#e9d5ff,#7c3aed)',
        clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
        filter:'drop-shadow(0 0 16px rgba(168,85,247,.9))',animationDelay:'.4s'}}/>
      <div className="hfc" style={{position:'absolute',right:'51%',bottom:'13%',width:38,height:38,
        background:'radial-gradient(circle at 35% 30%,#fde68a,#b45309)',borderRadius:'50%',
        filter:'drop-shadow(0 0 12px rgba(251,191,36,.9))',animationDelay:'1s'}}/>
      {/* content */}
      <div style={{position:'relative',zIndex:10,padding:'46px 48px'}}>
        <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.2}}
          style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:18,
            background:'rgba(251,191,36,.07)',border:'1px solid rgba(251,191,36,.2)',
            borderRadius:100,padding:'4px 14px 4px 10px'}}>
          <div style={{position:'relative',width:7,height:7}}>
            <div className="live-ring" style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(251,191,36,.4)'}}/>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#fbbf24',boxShadow:'0 0 10px #fbbf24'}}/>
          </div>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:'.18em',color:'rgba(251,191,36,.7)',textTransform:'uppercase'}}>Live Now</span>
        </motion.div>
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          transition={{delay:.25,duration:.82,ease:[.22,1,.36,1]}}
          style={{margin:0,lineHeight:1.08,marginBottom:12}}>
          <span style={{display:'block',fontSize:'clamp(28px,3.8vw,44px)',fontWeight:900,color:'#fff',
            textShadow:'0 2px 24px rgba(0,0,0,.6)'}}>Welcome To</span>
          <span className="title-grad" style={{display:'block',fontSize:'clamp(32px,4.4vw,50px)',fontWeight:900}}>Amethystgg!</span>
        </motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}}
          style={{fontSize:13,color:'rgba(255,255,255,.38)',lineHeight:1.7,marginBottom:30,maxWidth:310,fontWeight:400}}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{color:'#fbbf24',fontWeight:700}}>amazing rewards.</span>
        </motion.p>
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.52}}
          style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'12px 24px',borderRadius:12,border:'none',cursor:'pointer',
                fontSize:14,fontWeight:800,color:'#000',fontFamily:'Nunito,sans-serif',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)',
                boxShadow:'0 0 38px rgba(251,191,36,.48),0 4px 18px rgba(0,0,0,.5)'}}>
              <Trophy style={{width:15,height:15}}/> View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'12px 24px',borderRadius:12,cursor:'pointer',
                fontSize:14,fontWeight:800,color:'rgba(251,191,36,.88)',fontFamily:'Nunito,sans-serif',
                background:'rgba(251,191,36,.07)',border:'1px solid rgba(251,191,36,.22)'}}>
              Open Cases <ChevronRight style={{width:15,height:15}}/>
            </motion.button>
          </Link>
        </motion.div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:1.5,
        background:'linear-gradient(90deg,transparent,rgba(251,191,36,.55),rgba(168,85,247,.45),transparent)',pointerEvents:'none'}}/>
    </motion.div>
  );
}

/* ══ GAME DATA ══ */
const GAMES = [
  {
    name:'Battles', page:'Battles', icon:Swords, size:'lg',
    img: battlesImg,
    accent:'#c084fc',
    // colour wash on hover — purple-gold
    overlay:'linear-gradient(145deg,rgba(192,132,252,.22) 0%,rgba(251,191,36,.12) 60%,rgba(76,29,149,.18) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#c084fc 20%,#fbbf24 50%,#c084fc 80%,transparent)',
    shadowDefault:'0 0 0 1px rgba(255,255,255,.06), 0 16px 48px rgba(0,0,0,.9)',
    shadowHover:  '0 0 0 1.5px rgba(192,132,252,.6), 0 20px 56px rgba(0,0,0,.9), 0 0 48px rgba(192,132,252,.24), 0 0 100px rgba(251,191,36,.08)',
    tag:'HOT', tagBg:'linear-gradient(135deg,#fbbf24,#f59e0b)', tagColor:'#000',
  },
  {
    name:'Cases', page:'Cases', icon:Box, size:'lg',
    img: casesImg,
    accent:'#fbbf24',
    overlay:'linear-gradient(145deg,rgba(251,191,36,.2) 0%,rgba(192,132,252,.1) 60%,rgba(120,50,0,.18) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#fbbf24 20%,#c084fc 50%,#fbbf24 80%,transparent)',
    shadowDefault:'0 0 0 1px rgba(255,255,255,.06), 0 16px 48px rgba(0,0,0,.9)',
    shadowHover:  '0 0 0 1.5px rgba(251,191,36,.6), 0 20px 56px rgba(0,0,0,.9), 0 0 48px rgba(251,191,36,.24), 0 0 100px rgba(192,132,252,.08)',
    tag:'NEW', tagBg:'#7c3aed', tagColor:'#fff',
  },
  {
    name:'Coinflip', page:'Coinflip', icon:RotateCcw, size:'sm',
    img: coinflipImg,
    accent:'#fbbf24',
    overlay:'linear-gradient(145deg,rgba(251,191,36,.2) 0%,rgba(124,58,237,.14) 55%,rgba(76,29,149,.16) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#fbbf24 20%,#a855f7 50%,#fbbf24 80%,transparent)',
    shadowDefault:'0 0 0 1px rgba(255,255,255,.06), 0 12px 36px rgba(0,0,0,.9)',
    shadowHover:  '0 0 0 1.5px rgba(251,191,36,.55), 0 14px 40px rgba(0,0,0,.9), 0 0 38px rgba(251,191,36,.2), 0 0 80px rgba(168,85,247,.08)',
  },
  {
    name:'Crash', page:'Crash', icon:Zap, size:'sm',
    img: crashImg,
    accent:'#a855f7',
    overlay:'linear-gradient(145deg,rgba(168,85,247,.24) 0%,rgba(251,191,36,.12) 55%,rgba(76,29,149,.2) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#a855f7 20%,#fbbf24 50%,#a855f7 80%,transparent)',
    shadowDefault:'0 0 0 1px rgba(255,255,255,.06), 0 12px 36px rgba(0,0,0,.9)',
    shadowHover:  '0 0 0 1.5px rgba(168,85,247,.58), 0 14px 40px rgba(0,0,0,.9), 0 0 38px rgba(168,85,247,.22), 0 0 80px rgba(251,191,36,.08)',
    tag:'LIVE', tagBg:'rgba(124,58,237,.9)', tagColor:'#fff',
  },
];

/* ══ GAME CARD ══ */
function GameCard({ g, i, height }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{opacity:0,y:28,scale:.95}}
      animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.08+i*.09,duration:.68,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl(g.page)}>
        <div
          className="gc-card"
          onMouseEnter={()=>setHov(true)}
          onMouseLeave={()=>setHov(false)}
          style={{ height, boxShadow: hov ? g.shadowHover : g.shadowDefault }}>

          {/* full-cover bg image: purple-tinted grey → full colour */}
          <img src={g.img} alt={g.name} className="gc-img"/>

          {/* permanent bottom vignette */}
          <div className="gc-vignette"/>

          {/* coloured glow overlay — fades in */}
          <div className="gc-overlay" style={{background:g.overlay}}/>

          {/* sheen sweep on hover */}
          <div className="gc-sheen"/>

          {/* top accent bar */}
          <div className="gc-bar" style={{background:g.barGrad}}/>

          {/* label */}
          <div style={{
            position:'absolute',bottom:0,left:0,right:0,zIndex:10,
            padding: height > 200 ? '32px 22px 20px' : '22px 18px 15px',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              {/* icon pill */}
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width: height>200?32:28, height: height>200?32:28,
                borderRadius: height>200?10:8,
                background:`linear-gradient(135deg,${g.accent}20,${g.accent}45)`,
                border:`1px solid ${g.accent}50`,
                backdropFilter:'blur(8px)',
                transition:'transform .45s ease',
                transform: hov ? 'rotate(360deg)' : 'rotate(0deg)',
                flexShrink:0,
              }}>
                <g.icon style={{width:height>200?15:13,height:height>200?15:13,color:g.accent}}/>
              </div>
              <span style={{
                fontSize:height>200?18:15, fontWeight:900, color:'#fff',
                letterSpacing:'.01em',
                textShadow:'0 2px 16px rgba(0,0,0,.9), 0 0 40px rgba(0,0,0,.6)',
              }}>{g.name}</span>
              {g.tag && (
                <span className={g.tag==='LIVE'?'badge-live':''} style={{
                  fontSize:9,fontWeight:800,letterSpacing:'.15em',textTransform:'uppercase',
                  color:g.tagColor, background:g.tagBg, borderRadius:6, padding:'2px 9px',
                  flexShrink:0,
                }}>
                  {g.tag}
                </span>
              )}
            </div>
          </div>

          {/* hover corner accent dot */}
          <div style={{
            position:'absolute',top:14,right:16,zIndex:9,
            width:5,height:5,borderRadius:'50%',
            background:g.accent,
            boxShadow:`0 0 10px 3px ${g.accent}`,
            opacity: hov ? .9 : 0,
            transition:'opacity .35s ease',
          }}/>

        </div>
      </Link>
    </motion.div>
  );
}

/* ══ FEATURED SLOT ══ */
function FeaturedSlot() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{opacity:0,y:24,scale:.95}} animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.44,duration:.66,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl('Cases')}>
        <div
          className="gc-card"
          onMouseEnter={()=>setHov(true)}
          onMouseLeave={()=>setHov(false)}
          style={{
            height:163,
            background:'linear-gradient(145deg,#060015 0%,#0f0030 55%,#030010 100%)',
            boxShadow: hov
              ? '0 0 0 1.5px rgba(251,191,36,.55), 0 14px 40px rgba(0,0,0,.9), 0 0 38px rgba(251,191,36,.2), 0 0 80px rgba(192,132,252,.09)'
              : '0 0 0 1px rgba(255,255,255,.06), 0 12px 36px rgba(0,0,0,.9)',
          }}>

          {/* ambient glow */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,
            background:'radial-gradient(ellipse 75% 65% at 75% 38%,rgba(251,191,36,.12) 0%,transparent 62%)'}}/>

          {/* hover overlay */}
          <div style={{
            position:'absolute',inset:0,zIndex:3,borderRadius:18,pointerEvents:'none',
            background:'linear-gradient(145deg,rgba(251,191,36,.18) 0%,rgba(192,132,252,.14) 55%,rgba(109,40,217,.18) 100%)',
            opacity:hov?1:0, transition:'opacity .48s ease',
          }}/>
          {/* top bar */}
          <div style={{
            position:'absolute',top:0,left:0,right:0,height:2,zIndex:9,
            background:'linear-gradient(90deg,transparent,#fbbf24 20%,#c084fc 50%,#fbbf24 80%,transparent)',
            transform:hov?'scaleX(1)':'scaleX(0)', opacity:hov?1:0,
            transformOrigin:'left', transition:'transform .42s cubic-bezier(.4,0,.2,1), opacity .3s ease',
          }}/>

          <img src={vtechImg} alt="" className="hfa" style={{position:'absolute',right:6,top:-4,width:88,zIndex:5,
            filter:'drop-shadow(0 0 18px rgba(168,85,247,.8)) drop-shadow(0 7px 22px rgba(0,0,0,.95))'}}/>
          <img src={irishImg} alt="" className="hfc" style={{position:'absolute',right:58,top:42,width:60,zIndex:5,opacity:.92,
            filter:'drop-shadow(0 0 14px rgba(251,191,36,.72)) drop-shadow(0 5px 16px rgba(0,0,0,.95))'}}/>

          <div className="gc-vignette"/>

          <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:10,padding:'22px 18px 15px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{
                  display:'flex',alignItems:'center',justifyContent:'center',
                  width:28,height:28,borderRadius:8,
                  background:'rgba(251,191,36,.15)',border:'1px solid rgba(251,191,36,.35)',
                  backdropFilter:'blur(8px)',
                  transition:'transform .45s ease',
                  transform:hov?'rotate(360deg)':'rotate(0deg)',
                }}>
                  <Star style={{width:13,height:13,color:'#fbbf24'}}/>
                </div>
                <span style={{fontSize:15,fontWeight:900,color:'#fff',
                  textShadow:'0 2px 12px rgba(0,0,0,.9)'}}>Featured Cases</span>
              </div>
              <div style={{transition:'transform .25s ease',transform:hov?'translateX(4px)':'translateX(0)'}}>
                <ChevronRight style={{width:15,height:15,color:'rgba(251,191,36,.65)'}}/>
              </div>
            </div>
          </div>

          <div style={{
            position:'absolute',top:14,right:16,zIndex:9,
            width:5,height:5,borderRadius:'50%',
            background:'#fbbf24',boxShadow:'0 0 10px 3px #fbbf24',
            opacity:hov?.9:0,transition:'opacity .35s ease',
          }}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══ SECTION HEAD ══ */
function SectionHead({ label, icon: Icon }) {
  return (
    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:.28}}
      style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
      <div style={{width:3,height:22,borderRadius:3,
        background:'linear-gradient(to bottom,#fbbf24,#a855f7)',
        boxShadow:'0 0 12px rgba(251,191,36,.4)'}}/>
      <Icon style={{width:16,height:16,color:'#fbbf24'}}/>
      <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>{label}</span>
    </motion.div>
  );
}

/* ══ MAIN ══ */
export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',background:'#04000a'}}>
      <div style={{position:'relative',width:52,height:52}}>
        <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid #fbbf24',animation:'spin 1s linear infinite'}}/>
        <div style={{position:'absolute',inset:7,borderRadius:'50%',border:'2px solid #a855f7',animation:'spinr .72s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#fbbf24',boxShadow:'0 0 16px #fbbf24'}}/>
        </div>
      </div>
    </div>
  );

  const lgGames = GAMES.filter(g=>g.size==='lg');
  const smGames = GAMES.filter(g=>g.size==='sm');

  return (
    <div className="lv" style={{
      background:'#03000c',
      backgroundImage:
        'radial-gradient(ellipse 65% 42% at 12% 0%,rgba(90,20,190,.16) 0%,transparent 62%),' +
        'radial-gradient(ellipse 50% 35% at 88% 100%,rgba(190,120,0,.1) 0%,transparent 55%)',
      minHeight:'100vh', padding:'24px 0 90px',
      /* relative so PageGems absolute children are clipped */
      position:'relative', overflow:'hidden',
    }}>
      <style>{CSS}</style>

      {/* Gems live inside this relative container, no longer fixed */}
      <PageGems/>

      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:34}}>
        <HeroBanner/>
        <section>
          <SectionHead label="Magic Games" icon={Zap}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            {lgGames.map((g,i)=><GameCard key={g.name} g={g} i={i} height={224}/>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {smGames.map((g,i)=><GameCard key={g.name} g={g} i={i+2} height={168}/>)}
            <FeaturedSlot/>
          </div>
        </section>
      </div>
    </div>
  );
}