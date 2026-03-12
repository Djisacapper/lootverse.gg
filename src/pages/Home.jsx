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

/* ══════════ CSS ══════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.lv { font-family: 'Nunito', sans-serif; }

/* gem floats */
@keyframes gf1 { 0%,100%{transform:translateY(0px) rotate(0deg) scale(1)} 30%{transform:translateY(-28px) rotate(12deg) scale(1.06)} 70%{transform:translateY(-10px) rotate(-8deg) scale(.97)} }
@keyframes gf2 { 0%,100%{transform:translateY(0px) rotate(0deg)} 40%{transform:translateY(-34px) rotate(-14deg) scale(1.08)} 75%{transform:translateY(-12px) rotate(7deg)} }
@keyframes gf3 { 0%,100%{transform:translateY(0px) rotate(0deg)} 35%{transform:translateY(-20px) rotate(18deg)} 70%{transform:translateY(-8px) rotate(-10deg)} }
@keyframes gf4 { 0%,100%{transform:translateY(0px) rotate(0deg) scale(1)} 45%{transform:translateY(-24px) rotate(-9deg) scale(1.05)} }
@keyframes gf5 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-30px) rotate(20deg)} }
@keyframes gf6 { 0%,100%{transform:translateY(0px) rotate(0deg) scale(1)} 38%{transform:translateY(-18px) rotate(-15deg) scale(1.07)} 72%{transform:translateY(-6px) rotate(10deg)} }
.gfa { animation: gf1  7s  ease-in-out infinite; }
.gfb { animation: gf2  9s  ease-in-out infinite 1.1s; }
.gfc { animation: gf3  6.5s ease-in-out infinite 2.3s; }
.gfd { animation: gf4  8.5s ease-in-out infinite 0.6s; }
.gfe { animation: gf5  11s ease-in-out infinite 1.8s; }
.gff { animation: gf6  7.8s ease-in-out infinite 3.2s; }
.gfg { animation: gf1  10s ease-in-out infinite 0.3s; }
.gfh { animation: gf2  8.2s ease-in-out infinite 4s; }
.gfi { animation: gf3  9.5s ease-in-out infinite 2s; }
.gfj { animation: gf4  6.8s ease-in-out infinite 1.5s; }

/* gem inner shimmer */
@keyframes gem-shimmer { 0%,100%{opacity:.35;transform:rotate(0deg) scale(.8)} 50%{opacity:.85;transform:rotate(180deg) scale(1.15)} }
.gs { animation: gem-shimmer 3s ease-in-out infinite; }

/* hero case floats */
@keyframes hf1 { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-18px) rotate(-1deg)} }
@keyframes hf2 { 0%,100%{transform:translateY(0) rotate(3deg)} 50%{transform:translateY(-24px) rotate(6deg)} }
@keyframes hf3 { 0%,100%{transform:translateY(0) rotate(2deg)} 42%{transform:translateY(-14px) rotate(-3deg)} }
.hfa { animation: hf1 6s ease-in-out infinite; }
.hfb { animation: hf2 8s ease-in-out infinite .9s; }
.hfc { animation: hf3 7s ease-in-out infinite 1.5s; }

/* particles */
@keyframes ptcl { 0%{transform:translateY(0) translateX(0);opacity:0} 8%{opacity:1} 88%{opacity:.5} 100%{transform:translateY(var(--py)) translateX(var(--px));opacity:0} }
.pt { position:absolute; border-radius:50%; pointer-events:none; animation:ptcl var(--pd) ease-out infinite var(--pdl); }

/* live dot */
@keyframes live-pulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.5);opacity:0} }
.live-ring { animation:live-pulse 1.8s ease-out infinite; }

/* scan line */
@keyframes scan { 0%{top:-1px;opacity:0} 4%{opacity:.6} 92%{opacity:.3} 100%{top:100%;opacity:0} }
.scan { position:absolute;left:0;right:0;height:1px;pointer-events:none;z-index:4;
  background:linear-gradient(90deg,transparent,rgba(251,191,36,.18),rgba(200,140,255,.15),transparent);
  animation:scan 9s linear infinite; }

/* grid */
.ambi-grid { position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(251,191,36,.033) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,.033) 1px,transparent 1px);
  background-size:38px 38px; }

/* hero gradient title */
@keyframes grad-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
.title-grad {
  background:linear-gradient(90deg,#fbbf24,#f59e0b,#e879f9,#c084fc,#818cf8,#fbbf24);
  background-size:300% 100%;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  animation:grad-shift 5s ease-in-out infinite;
  filter:drop-shadow(0 0 22px rgba(251,191,36,.3));
}

/* card shimmer */
@keyframes shim-x { 0%{transform:translateX(-120%) skewX(-14deg)} 100%{transform:translateX(500%) skewX(-14deg)} }
.cshim { position:relative; overflow:hidden; }
.cshim::before { content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:20;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.045) 45%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.045) 55%,transparent);
  width:28%; animation:shim-x var(--sx,7s) ease-in-out infinite var(--sdl,0s); }

/* glow border pulse */
@keyframes bp { 0%,100%{box-shadow:var(--bs)} 50%{box-shadow:var(--bsh)} }
.cbp { animation:bp 3.5s ease-in-out infinite; }

/* spinner */
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes spinr { to{transform:rotate(-360deg)} }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

/* ══════════ GEM SVG COMPONENTS ══════════ */

function GemDiamond({ size, c1, c2, glow, style, className }) {
  const id = useRef(`d${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{
      position:'fixed', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.3}px ${glow}) drop-shadow(0 ${size*.12}px ${size*.36}px rgba(0,0,0,.7))`,
      ...style, zIndex:0,
    }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="55%" stopColor={c2} stopOpacity=".85"/><stop offset="100%" stopColor={c1} stopOpacity=".7"/>
          </linearGradient>
          <linearGradient id={`${id}b`} x1="15%" y1="0%" x2="65%" y2="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,.72)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id={`${id}c`} cx="36%" cy="28%" r="48%">
            <stop offset="0%" stopColor="rgba(255,255,255,.55)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <polygon points="50,4 96,38 76,96 24,96 4,38" fill={`url(#${id}a)`}/>
        <polygon points="50,4 96,38 50,46" fill={`url(#${id}b)`} opacity=".55"/>
        <polygon points="50,4 4,38 50,46" fill="rgba(255,255,255,.08)"/>
        <polygon points="96,38 76,96 50,66 50,46" fill="rgba(0,0,0,.2)"/>
        <polygon points="4,38 24,96 50,66 50,46" fill="rgba(255,255,255,.06)"/>
        <polygon points="50,46 50,66 76,96 24,96" fill="rgba(0,0,0,.12)"/>
        <ellipse cx="37" cy="25" rx="13" ry="8" fill={`url(#${id}c)`} className="gs"/>
        <circle cx="50" cy="4" r="2.8" fill="rgba(255,255,255,.95)"/>
        <circle cx="20" cy="50" r="1.5" fill="rgba(255,255,255,.45)"/>
      </svg>
    </div>
  );
}

function GemOctagon({ size, c1, c2, glow, style, className }) {
  const id = useRef(`o${Math.random().toString(36).slice(2,7)}`).current;
  const pts = "50,4 82,18 96,50 82,82 50,96 18,82 4,50 18,18";
  return (
    <div className={className} style={{
      position:'fixed', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.28}px ${glow}) drop-shadow(0 ${size*.1}px ${size*.3}px rgba(0,0,0,.75))`,
      ...style, zIndex:0,
    }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </linearGradient>
          <radialGradient id={`${id}b`} cx="34%" cy="28%" r="44%">
            <stop offset="0%" stopColor="rgba(255,255,255,.6)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <polygon points={pts} fill={`url(#${id}a)`}/>
        <polygon points="50,4 82,18 50,34 18,18" fill="rgba(255,255,255,.14)"/>
        <polygon points="82,18 96,50 66,50 50,34" fill="rgba(255,255,255,.07)"/>
        <polygon points="4,50 18,18 50,34 50,66" fill="rgba(255,255,255,.05)"/>
        <polygon points="50,34 66,50 82,82 18,82 34,50" fill="rgba(0,0,0,.14)"/>
        <ellipse cx="36" cy="30" rx="13" ry="8" fill={`url(#${id}b)`} className="gs"/>
        <circle cx="50" cy="4" r="2.2" fill="rgba(255,255,255,.9)"/>
        <circle cx="96" cy="50" r="1.6" fill="rgba(255,255,255,.55)"/>
      </svg>
    </div>
  );
}

function GemTeardrop({ size, c1, c2, glow, style, className }) {
  const id = useRef(`t${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{
      position:'fixed', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.32}px ${glow}) drop-shadow(0 ${size*.1}px ${size*.28}px rgba(0,0,0,.7))`,
      ...style, zIndex:0,
    }}>
      <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <linearGradient id={`${id}a`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </linearGradient>
          <radialGradient id={`${id}b`} cx="37%" cy="28%" r="42%">
            <stop offset="0%" stopColor="rgba(255,255,255,.65)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <path d="M50,5 C22,5 5,22 5,42 C5,72 50,106 50,106 C50,106 95,72 95,42 C95,22 78,5 50,5 Z" fill={`url(#${id}a)`}/>
        <path d="M50,5 C22,5 5,22 5,42 L50,44 L95,42 C95,22 78,5 50,5 Z" fill="rgba(255,255,255,.11)"/>
        <path d="M5,42 L50,44 L50,106 C28,86 5,64 5,42 Z" fill="rgba(255,255,255,.06)"/>
        <ellipse cx="36" cy="29" rx="14" ry="9" fill={`url(#${id}b)`} className="gs"/>
        <circle cx="50" cy="5" r="2.6" fill="rgba(255,255,255,.9)"/>
      </svg>
    </div>
  );
}

function GemRound({ size, c1, c2, glow, style, className }) {
  const id = useRef(`r${Math.random().toString(36).slice(2,7)}`).current;
  return (
    <div className={className} style={{
      position:'fixed', width:size, height:size, pointerEvents:'none',
      filter:`drop-shadow(0 0 ${size*.4}px ${glow}) drop-shadow(0 ${size*.1}px ${size*.3}px rgba(0,0,0,.7))`,
      ...style, zIndex:0,
    }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
        <defs>
          <radialGradient id={`${id}a`} cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
          </radialGradient>
          <radialGradient id={`${id}b`} cx="32%" cy="26%" r="38%">
            <stop offset="0%" stopColor="rgba(255,255,255,.72)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}a)`}/>
        {[0,45,90,135].map(a=>{const r=a*Math.PI/180;return<line key={a} x1="50" y1="50" x2={50+47*Math.cos(r)} y2={50+47*Math.sin(r)} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>;})}
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
        <circle cx="50" cy="50" r="14" fill="rgba(0,0,0,.15)"/>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}b)`}/>
        <circle cx="33" cy="26" r="7" fill="rgba(255,255,255,.45)"/>
        <circle cx="62" cy="64" r="3" fill="rgba(255,255,255,.2)"/>
      </svg>
    </div>
  );
}

/* ══════════ PAGE GEMS (fixed, floating around the page) ══════════ */
function PageGems() {
  return (
    <>
      {/* Left side */}
      <GemDiamond size={72}  c1="#e9d5ff" c2="#6d28d9" glow="rgba(167,139,250,.8)"  className="gfa" style={{left:'1%',   top:'8%'}}/>
      <GemRound   size={44}  c1="#fde68a" c2="#d97706" glow="rgba(251,191,36,.75)"  className="gfc" style={{left:'2%',   top:'26%'}}/>
      <GemTeardrop size={56} c1="#f9a8d4" c2="#9d174d" glow="rgba(236,72,153,.7)"   className="gfe" style={{left:'0%',   top:'50%'}}/>
      <GemOctagon size={38}  c1="#bbf7d0" c2="#15803d" glow="rgba(74,222,128,.7)"   className="gfb" style={{left:'3%',   top:'72%'}}/>
      <GemRound   size={28}  c1="#c084fc" c2="#7c3aed" glow="rgba(192,132,252,.7)"  className="gfd" style={{left:'1%',   top:'88%'}}/>

      {/* Right side */}
      <GemOctagon size={68}  c1="#fbbf24" c2="#b45309" glow="rgba(251,191,36,.82)"  className="gfb" style={{right:'1%',  top:'6%'}}/>
      <GemTeardrop size={48} c1="#a78bfa" c2="#4c1d95" glow="rgba(139,92,246,.78)"  className="gfd" style={{right:'2%',  top:'24%'}}/>
      <GemDiamond size={60}  c1="#fde68a" c2="#a16207" glow="rgba(251,191,36,.78)"  className="gff" style={{right:'0%',  top:'48%'}}/>
      <GemRound   size={36}  c1="#e879f9" c2="#7e22ce" glow="rgba(232,121,249,.72)" className="gfg" style={{right:'3%',  top:'68%'}}/>
      <GemTeardrop size={50} c1="#bfdbfe" c2="#1d4ed8" glow="rgba(96,165,250,.72)"  className="gfh" style={{right:'1%',  top:'84%'}}/>

      {/* Top scattered */}
      <GemRound   size={32}  c1="#fde68a" c2="#b45309" glow="rgba(251,191,36,.65)"  className="gfc" style={{left:'8%',   top:'2%'}}/>
      <GemDiamond size={42}  c1="#c084fc" c2="#6d28d9" glow="rgba(192,132,252,.7)"  className="gfi" style={{left:'22%',  top:'-1%'}}/>
      <GemOctagon size={30}  c1="#f9a8d4" c2="#9d174d" glow="rgba(236,72,153,.65)"  className="gfj" style={{right:'20%', top:'1%'}}/>
      <GemRound   size={36}  c1="#bbf7d0" c2="#15803d" glow="rgba(74,222,128,.65)"  className="gfb" style={{right:'10%', top:'-2%'}}/>
    </>
  );
}

/* ══════════ PARTICLES ══════════ */
function Particles({ accent, count = 12 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id:i, left:`${5+Math.random()*90}%`, bottom:`${Math.random()*20}%`,
    size:1.4+Math.random()*2.6, pd:`${3+Math.random()*5}s`,
    pdl:`${-Math.random()*6}s`, px:`${(Math.random()-.5)*50}px`,
    py:`-${55+Math.random()*85}px`,
  }))).current;
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {pts.map(p=>(
        <div key={p.id} className="pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--pd':p.pd,'--pdl':p.pdl,'--px':p.px,'--py':p.py,
        }}/>
      ))}
    </div>
  );
}

/* ══════════ HERO ══════════ */
function HeroBanner() {
  return (
    <motion.div
      initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
      transition={{duration:.8,ease:[.22,1,.36,1]}}
      style={{
        position:'relative', overflow:'hidden', borderRadius:20,
        background:'linear-gradient(125deg,#050010 0%,#0e0025 35%,#1a0040 65%,#08001a 100%)',
        minHeight:255,
        boxShadow:'0 0 0 1px rgba(251,191,36,.12),0 24px 80px rgba(0,0,0,.9),0 0 100px rgba(120,40,200,.18)',
      }}>
      <div className="ambi-grid"/>
      <div className="scan"/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 65% 90% at 74% 55%,rgba(120,40,200,.24) 0%,transparent 60%),radial-gradient(ellipse 35% 45% at 88% 8%,rgba(251,191,36,.14) 0%,transparent 50%)'}}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <Particles accent="#fbbf24" count={10}/>
        <Particles accent="#a855f7" count={8}/>
      </div>
      {/* floating case images */}
      <img src={vtechImg} alt="" className="hfa" style={{position:'absolute',right:'28%',top:'5%',width:130,pointerEvents:'none',
        filter:'drop-shadow(0 0 28px rgba(168,85,247,.9)) drop-shadow(0 14px 40px rgba(0,0,0,.95))'}}/>
      <img src={roseImg} alt="" className="hfb" style={{position:'absolute',right:'8%',top:'11%',width:148,pointerEvents:'none',
        filter:'drop-shadow(0 0 28px rgba(251,191,36,.8)) drop-shadow(0 14px 40px rgba(0,0,0,.95))'}}/>
      <img src={irishImg} alt="" className="hfc" style={{position:'absolute',right:'18%',bottom:'7%',width:110,pointerEvents:'none',
        filter:'drop-shadow(0 0 22px rgba(251,191,36,.7)) drop-shadow(0 12px 36px rgba(0,0,0,.95))'}}/>
      {/* small deco shapes near the cases */}
      <div className="hfa" style={{position:'absolute',right:'46%',top:'9%',width:52,height:52,
        background:'radial-gradient(circle at 35% 35%,#e9d5ff,#7c3aed)',
        clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
        filter:'drop-shadow(0 0 18px rgba(168,85,247,.9))',animationDelay:'.4s'}}/>
      <div className="hfc" style={{position:'absolute',right:'52%',bottom:'14%',width:42,height:42,
        background:'radial-gradient(circle at 35% 30%,#fde68a,#b45309)',borderRadius:'50%',
        filter:'drop-shadow(0 0 14px rgba(251,191,36,.9))',animationDelay:'1s'}}/>
      {/* content */}
      <div style={{position:'relative',zIndex:10,padding:'44px 44px'}}>
        <motion.div initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:.2}}
          style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:16,
            background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.22)',
            borderRadius:100,padding:'4px 14px 4px 10px'}}>
          <div style={{position:'relative',width:7,height:7}}>
            <div className="live-ring" style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(251,191,36,.45)'}}/>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#fbbf24',boxShadow:'0 0 10px #fbbf24'}}/>
          </div>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:'.18em',color:'rgba(251,191,36,.75)',textTransform:'uppercase'}}>Live Now</span>
        </motion.div>

        <motion.h1 initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
          transition={{delay:.26,duration:.85,ease:[.22,1,.36,1]}}
          style={{margin:0,lineHeight:1.1,marginBottom:10}}>
          <span style={{display:'block',fontSize:'clamp(30px,4vw,46px)',fontWeight:900,color:'#fff'}}>Welcome To</span>
          <span className="title-grad" style={{display:'block',fontSize:'clamp(34px,4.5vw,52px)',fontWeight:900}}>Amethystgg!</span>
        </motion.h1>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.42}}
          style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.65,marginBottom:28,maxWidth:320,fontWeight:400}}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{color:'#fbbf24',fontWeight:700}}>amazing rewards.</span>
        </motion.p>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.54}}
          style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'11px 22px',borderRadius:12,border:'none',cursor:'pointer',
                fontSize:14,fontWeight:800,color:'#000',fontFamily:'Nunito,sans-serif',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)',
                boxShadow:'0 0 40px rgba(251,191,36,.5),0 4px 20px rgba(0,0,0,.5)'}}>
              <Trophy style={{width:15,height:15}}/> View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'11px 22px',borderRadius:12,cursor:'pointer',
                fontSize:14,fontWeight:800,color:'rgba(251,191,36,.9)',fontFamily:'Nunito,sans-serif',
                background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.25)'}}>
              Open Cases <ChevronRight style={{width:15,height:15}}/>
            </motion.button>
          </Link>
        </motion.div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:1.5,
        background:'linear-gradient(90deg,transparent,rgba(251,191,36,.6),rgba(168,85,247,.5),transparent)',pointerEvents:'none'}}/>
    </motion.div>
  );
}

/* ══════════ GAME CARD DATA ══════════ */
const GAMES = [
  {
    name:'Battles',page:'Battles',icon:Swords,size:'lg',
    bg:'linear-gradient(145deg,#08001a 0%,#150040 45%,#0a0020 100%)',
    accent:'#c084fc', glowColor:'rgba(192,132,252,.3)',
    caseImg:vtechImg,
    caseGlow:'drop-shadow(0 0 30px rgba(192,132,252,.88)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    bs:'0 0 0 1px rgba(192,132,252,.13),0 20px 60px rgba(0,0,0,.8)',
    bsh:'0 0 0 1px rgba(192,132,252,.32),0 20px 60px rgba(0,0,0,.8),0 0 70px rgba(192,132,252,.18)',
    tag:'HOT',tagBg:'linear-gradient(135deg,#fbbf24,#f59e0b)',tagColor:'#000',
  },
  {
    name:'Cases',page:'Cases',icon:Box,size:'lg',
    bg:'linear-gradient(145deg,#0d0800 0%,#1e1200 45%,#0d0600 100%)',
    accent:'#fbbf24', glowColor:'rgba(251,191,36,.3)',
    caseImg:roseImg,
    caseGlow:'drop-shadow(0 0 30px rgba(251,191,36,.92)) drop-shadow(0 14px 44px rgba(0,0,0,.95))',
    bs:'0 0 0 1px rgba(251,191,36,.12),0 20px 60px rgba(0,0,0,.8)',
    bsh:'0 0 0 1px rgba(251,191,36,.3),0 20px 60px rgba(0,0,0,.8),0 0 70px rgba(251,191,36,.17)',
    tag:'NEW',tagBg:'#7c3aed',tagColor:'#fff',
  },
  {
    name:'Coinflip',page:'Coinflip',icon:RotateCcw,size:'sm',
    bg:'linear-gradient(145deg,#060010 0%,#10002c 55%,#04000c 100%)',
    accent:'#fbbf24', glowColor:'rgba(251,191,36,.24)',
    caseImg:irishImg,
    caseGlow:'drop-shadow(0 0 22px rgba(251,191,36,.88)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
    bs:'0 0 0 1px rgba(251,191,36,.1),0 14px 44px rgba(0,0,0,.8)',
    bsh:'0 0 0 1px rgba(251,191,36,.26),0 14px 44px rgba(0,0,0,.8),0 0 55px rgba(251,191,36,.14)',
  },
  {
    name:'Crash',page:'Crash',icon:Zap,size:'sm',
    bg:'linear-gradient(145deg,#060008 0%,#100020 55%,#030008 100%)',
    accent:'#a855f7', glowColor:'rgba(168,85,247,.26)',
    caseImg:roseImg,
    caseGlow:'drop-shadow(0 0 22px rgba(168,85,247,.88)) drop-shadow(0 10px 32px rgba(0,0,0,.95))',
    bs:'0 0 0 1px rgba(168,85,247,.1),0 14px 44px rgba(0,0,0,.8)',
    bsh:'0 0 0 1px rgba(168,85,247,.26),0 14px 44px rgba(0,0,0,.8),0 0 55px rgba(168,85,247,.15)',
    tag:'LIVE',tagBg:'rgba(124,58,237,.85)',tagColor:'#fff',
  },
];

/* ══════════ LARGE GAME CARD ══════════ */
function LgGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  const ref = useRef();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, {stiffness:160,damping:20});
  const sy = useSpring(my, {stiffness:160,damping:20});

  const handleMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX-r.left)/r.width-.5)*22);
    my.set(((e.clientY-r.top)/r.height-.5)*22);
  };
  const handleLeave = () => { mx.set(0); my.set(0); setHov(false); };

  return (
    <motion.div
      initial={{opacity:0,y:28,scale:.96}}
      animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.12+i*.1,duration:.75,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl(g.page)}>
        <motion.div
          ref={ref} className="cshim cbp"
          onMouseEnter={()=>setHov(true)} onMouseLeave={handleLeave} onMouseMove={handleMove}
          whileHover={{y:-6,scale:1.015}}
          transition={{type:'spring',stiffness:280,damping:22}}
          style={{
            position:'relative',overflow:'hidden',borderRadius:18,cursor:'pointer',height:218,
            background:g.bg,
            '--bs':g.bs,'--bsh':g.bsh,
            '--sx':'6.5s','--sdl':`${i*.9}s`,
          }}>

          {/* inner grid */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,
            backgroundImage:`linear-gradient(${g.accent}06 1px,transparent 1px),linear-gradient(90deg,${g.accent}06 1px,transparent 1px)`,
            backgroundSize:'32px 32px'}}/>

          {/* radial atmosphere — follows mouse subtly */}
          <motion.div
            style={{
              position:'absolute',inset:-60,pointerEvents:'none',zIndex:1,
              background:`radial-gradient(ellipse 55% 55% at calc(50% + ${sx.get()}px) calc(50% + ${sy.get()}px), ${g.glowColor} 0%, transparent 65%)`,
              x: sx, y: sy,
            }}
            animate={{opacity:hov?1:.35}} transition={{duration:.5}}/>

          {hov && <Particles accent={g.accent} count={13}/>}

          {/* case image with parallax */}
          <motion.img src={g.caseImg} alt={g.name}
            animate={{
              scale: hov?1.12:1,
              y: hov?-14:0,
              rotate: hov?5:0,
              x: hov ? mx.get()*.06 : 0,
            }}
            transition={{type:'spring',stiffness:160,damping:16}}
            style={{position:'absolute',right:14,top:'50%',marginTop:-78,width:156,
              pointerEvents:'none',userSelect:'none',filter:g.caseGlow,zIndex:5}}/>

          {/* bottom gradient info bar */}
          <div style={{
            position:'absolute',bottom:0,left:0,right:0,zIndex:8,
            background:'linear-gradient(to top,rgba(0,0,0,.96) 0%,rgba(0,0,0,.65) 45%,transparent 100%)',
            padding:'26px 20px 16px',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <motion.div animate={{rotate:hov?360:0}} transition={{duration:.55,ease:'easeInOut'}}
                style={{display:'flex',alignItems:'center',justifyContent:'center',
                  width:30,height:30,borderRadius:9,
                  background:`linear-gradient(135deg,${g.accent}22,${g.accent}44)`,
                  border:`1px solid ${g.accent}44`}}>
                <g.icon style={{width:14,height:14,color:g.accent}}/>
              </motion.div>
              <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>{g.name}</span>
              {g.tag && (
                <span style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',
                  color:g.tagColor,background:g.tagBg,borderRadius:6,padding:'2px 8px',
                  boxShadow:g.tag==='HOT'?'0 0 14px rgba(251,191,36,.6)':undefined}}>{g.tag}</span>
              )}
            </div>
          </div>

          {/* top accent line — animates in on hover */}
          <motion.div
            animate={{scaleX:hov?1:.2,opacity:hov?1:0}}
            transition={{duration:.38,ease:[.22,1,.36,1]}}
            style={{position:'absolute',top:0,left:0,right:0,height:2,zIndex:9,transformOrigin:'center',
              background:`linear-gradient(90deg,transparent,${g.accent},rgba(251,191,36,.8),${g.accent},transparent)`}}/>

          {/* corner glint */}
          <motion.div animate={{opacity:hov?.7:0}} transition={{duration:.3}}
            style={{position:'absolute',top:12,right:16,zIndex:9,
              width:6,height:6,borderRadius:'50%',
              background:'#fff',boxShadow:`0 0 12px 4px ${g.accent}`}}/>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ══════════ SMALL GAME CARD ══════════ */
function SmGameCard({ g, i }) {
  const [hov, setHov] = useState(false);
  const ref = useRef();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx,{stiffness:160,damping:20});
  const sy = useSpring(my,{stiffness:160,damping:20});

  const handleMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX-r.left)/r.width-.5)*18);
    my.set(((e.clientY-r.top)/r.height-.5)*18);
  };
  const handleLeave = () => { mx.set(0); my.set(0); setHov(false); };

  return (
    <motion.div
      initial={{opacity:0,y:22,scale:.95}}
      animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.28+i*.09,duration:.65,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl(g.page)}>
        <motion.div
          ref={ref} className="cshim"
          onMouseEnter={()=>setHov(true)} onMouseLeave={handleLeave} onMouseMove={handleMove}
          whileHover={{y:-6,scale:1.018}}
          transition={{type:'spring',stiffness:280,damping:22}}
          style={{
            position:'relative',overflow:'hidden',borderRadius:18,cursor:'pointer',height:163,
            background:g.bg,
            boxShadow:hov?g.bsh:g.bs,
            transition:'box-shadow .35s ease',
            '--sx':'7.5s','--sdl':`${(i+2)*.8}s`,
          }}>

          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,
            backgroundImage:`linear-gradient(${g.accent}05 1px,transparent 1px),linear-gradient(90deg,${g.accent}05 1px,transparent 1px)`,
            backgroundSize:'26px 26px'}}/>

          <motion.div
            style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,
              background:`radial-gradient(ellipse 70% 70% at calc(75% + ${sx.get()}px) calc(35% + ${sy.get()}px), ${g.glowColor} 0%, transparent 60%)`,
              x:sx,y:sy}}
            animate={{opacity:hov?1:.35}} transition={{duration:.5}}/>

          {hov && <Particles accent={g.accent} count={9}/>}

          <motion.img src={g.caseImg} alt={g.name}
            animate={{scale:hov?1.18:1,y:hov?-10:0,rotate:hov?7:0}}
            transition={{type:'spring',stiffness:200,damping:18}}
            style={{position:'absolute',right:9,top:5,width:116,
              pointerEvents:'none',userSelect:'none',filter:g.caseGlow,zIndex:5}}/>

          <div style={{
            position:'absolute',bottom:0,left:0,right:0,zIndex:8,
            background:'linear-gradient(to top,rgba(0,0,0,.96) 0%,rgba(0,0,0,.65) 48%,transparent 100%)',
            padding:'18px 16px 13px',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <motion.div animate={{rotate:hov?360:0}} transition={{duration:.5,ease:'easeInOut'}}
                style={{display:'flex',alignItems:'center',justifyContent:'center',
                  width:26,height:26,borderRadius:7,
                  background:`linear-gradient(135deg,${g.accent}22,${g.accent}44)`,
                  border:`1px solid ${g.accent}40`}}>
                <g.icon style={{width:12,height:12,color:g.accent}}/>
              </motion.div>
              <span style={{fontSize:15,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>{g.name}</span>
              {g.tag && (
                <span style={{fontSize:9,fontWeight:800,letterSpacing:'.14em',textTransform:'uppercase',
                  color:g.tagColor,background:g.tagBg,borderRadius:5,padding:'2px 7px',
                  boxShadow:'0 0 10px rgba(124,58,237,.45)'}}>{g.tag}</span>
              )}
            </div>
          </div>

          <motion.div
            animate={{scaleX:hov?1:.2,opacity:hov?1:0}}
            transition={{duration:.35,ease:[.22,1,.36,1]}}
            style={{position:'absolute',top:0,left:0,right:0,height:2,zIndex:9,transformOrigin:'center',
              background:`linear-gradient(90deg,transparent,${g.accent},rgba(251,191,36,.7),${g.accent},transparent)`}}/>

          <motion.div animate={{opacity:hov?.7:0}} transition={{duration:.3}}
            style={{position:'absolute',top:10,right:12,zIndex:9,
              width:5,height:5,borderRadius:'50%',
              background:'#fff',boxShadow:`0 0 10px 3px ${g.accent}`}}/>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ══════════ FEATURED CASES SLOT ══════════ */
function FeaturedSlot() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{opacity:0,y:22,scale:.95}} animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.46,duration:.65,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl('Cases')}>
        <motion.div className="cshim"
          onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
          whileHover={{y:-6,scale:1.018}}
          transition={{type:'spring',stiffness:280,damping:22}}
          style={{
            position:'relative',overflow:'hidden',borderRadius:18,cursor:'pointer',height:163,
            background:'linear-gradient(145deg,#07001a 0%,#120035 55%,#04000d 100%)',
            boxShadow:hov
              ?'0 0 0 1px rgba(251,191,36,.28),0 14px 44px rgba(0,0,0,.8),0 0 55px rgba(251,191,36,.16)'
              :'0 0 0 1px rgba(251,191,36,.12),0 14px 44px rgba(0,0,0,.8)',
            transition:'box-shadow .35s ease',
            '--sx':'8s','--sdl':'1.4s',
          }}>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,
            background:'radial-gradient(ellipse 80% 70% at 78% 35%,rgba(251,191,36,.18) 0%,transparent 60%)'}}/>
          {hov && <Particles accent="#fbbf24" count={9}/>}

          <img src={vtechImg} alt="" className="hfa" style={{position:'absolute',right:4,top:-6,width:90,zIndex:5,
            filter:'drop-shadow(0 0 20px rgba(168,85,247,.8)) drop-shadow(0 8px 24px rgba(0,0,0,.95))'}}/>
          <img src={irishImg} alt="" className="hfc" style={{position:'absolute',right:55,top:40,width:62,zIndex:5,opacity:.9,
            filter:'drop-shadow(0 0 16px rgba(251,191,36,.75)) drop-shadow(0 6px 18px rgba(0,0,0,.95))'}}/>

          <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:8,
            background:'linear-gradient(to top,rgba(0,0,0,.96) 0%,rgba(0,0,0,.65) 48%,transparent 100%)',
            padding:'18px 16px 13px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <motion.div animate={{rotate:hov?360:0}} transition={{duration:.5,ease:'easeInOut'}}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',
                    width:26,height:26,borderRadius:7,
                    background:'rgba(251,191,36,.18)',border:'1px solid rgba(251,191,36,.35)'}}>
                  <Star style={{width:12,height:12,color:'#fbbf24'}}/>
                </motion.div>
                <span style={{fontSize:15,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>Featured Cases</span>
              </div>
              <motion.div animate={{x:hov?3:0}} transition={{duration:.25}}>
                <ChevronRight style={{width:14,height:14,color:'rgba(251,191,36,.6)'}}/>
              </motion.div>
            </div>
          </div>

          <motion.div animate={{scaleX:hov?1:.2,opacity:hov?1:0}} transition={{duration:.35,ease:[.22,1,.36,1]}}
            style={{position:'absolute',top:0,left:0,right:0,height:2,zIndex:9,transformOrigin:'center',
              background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)'}}/>
          <motion.div animate={{opacity:hov?.7:0}} transition={{duration:.3}}
            style={{position:'absolute',top:10,right:12,zIndex:9,
              width:5,height:5,borderRadius:'50%',background:'#fff',boxShadow:'0 0 10px 3px #fbbf24'}}/>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ══════════ SECTION HEADER ══════════ */
function SectionHead({ label, icon: Icon, accent='#fbbf24' }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}}
      style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
      <div style={{width:3,height:22,borderRadius:3,background:'linear-gradient(to bottom,#fbbf24,#a855f7)'}}/>
      <Icon style={{width:16,height:16,color:accent}}/>
      <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>{label}</span>
    </motion.div>
  );
}

/* ══════════ MAIN ══════════ */
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
      background:'#04000a',
      backgroundImage:'radial-gradient(ellipse 70% 45% at 15% 0%,rgba(100,30,200,.14) 0%,transparent 60%),radial-gradient(ellipse 55% 38% at 85% 100%,rgba(200,130,10,.09) 0%,transparent 55%)',
      minHeight:'100vh', padding:'20px 0 80px', position:'relative',
    }}>
      <style>{CSS}</style>

      {/* PAGE GEMS — fixed, floating outside cards around the edges */}
      <PageGems/>

      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:32}}>
        <HeroBanner/>

        <section>
          <SectionHead label="Magic Games" icon={Zap}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            {lgGames.map((g,i)=><LgGameCard key={g.name} g={g} i={i}/>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {smGames.map((g,i)=><SmGameCard key={g.name} g={g} i={i}/>)}
            <FeaturedSlot/>
          </div>
        </section>
      </div>
    </div>
  );
}