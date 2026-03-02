import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Gift, ChevronRight, Trophy, Star, Sparkles, Box, Swords, TrendingUp } from 'lucide-react';

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href;
const roseImg = new URL('../assets/Rose Love.png', import.meta.url).href;
const vtechImg = new URL('../assets/V-Tech.png', import.meta.url).href;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.lv { font-family: 'Outfit', sans-serif; }
.lv-h { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.06em; }

/* ── Orb Animations ── */
@keyframes orb1 {
  0%,100% { transform: translate(0,0) scale(1); }
  40%      { transform: translate(60px,-40px) scale(1.15); }
  70%      { transform: translate(-30px,30px) scale(0.9); }
}
@keyframes orb2 {
  0%,100% { transform: translate(0,0) scale(1); }
  35%     { transform: translate(-40px,35px) scale(1.1); }
  65%     { transform: translate(35px,-25px) scale(0.92); }
}
@keyframes orb3 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(25px,40px) scale(1.08); }
}
.o1 { animation: orb1 18s ease-in-out infinite; }
.o2 { animation: orb2 22s ease-in-out infinite; }
.o3 { animation: orb3 26s ease-in-out infinite reverse; }
.o4 { animation: orb1 14s ease-in-out infinite reverse; }

/* ── Float Animations ── */
@keyframes float-a {
  0%,100% { transform: translateY(0px) rotate(-2deg); }
  30%     { transform: translateY(-22px) rotate(3deg); }
  70%     { transform: translateY(-10px) rotate(-1deg); }
}
@keyframes float-b {
  0%,100% { transform: translateY(0px) rotate(2deg); }
  40%     { transform: translateY(-16px) rotate(-3deg); }
  80%     { transform: translateY(-28px) rotate(1deg); }
}
@keyframes float-c {
  0%,100% { transform: translateY(0px) rotate(-1deg); }
  25%     { transform: translateY(-26px) rotate(2.5deg); }
  60%     { transform: translateY(-12px) rotate(-2deg); }
}
@keyframes float-d {
  0%,100% { transform: translateY(0px) rotate(3deg); }
  45%     { transform: translateY(-18px) rotate(-2deg); }
  75%     { transform: translateY(-30px) rotate(1.5deg); }
}
@keyframes float-e {
  0%,100% { transform: translateY(0px) rotate(-2deg); }
  55%     { transform: translateY(-14px) rotate(2deg); }
  85%     { transform: translateY(-22px) rotate(-1.5deg); }
}
.fa { animation: float-a 7s ease-in-out infinite; }
.fb { animation: float-b 9s ease-in-out infinite; }
.fc { animation: float-c 8s ease-in-out infinite; }
.fd { animation: float-d 11s ease-in-out infinite; }
.fe { animation: float-e 10s ease-in-out infinite; }

/* ── Scan line ── */
@keyframes scan {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.scan {
  position: absolute; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,.6), transparent);
  animation: scan 5s ease-in-out infinite;
  pointer-events: none; z-index: 5;
}

/* ── Title glow ── */
@keyframes title-breathe {
  0%,100% { text-shadow: 0 0 0px rgba(16,185,129,0); }
  50%     { text-shadow: 0 0 100px rgba(16,185,129,.5), 0 0 200px rgba(16,185,129,.2); }
}
.title-em { color: #10b981; animation: title-breathe 3.5s ease-in-out infinite; }

/* ── Border pulse ── */
@keyframes border-pulse { 0%,100% { opacity:.25; } 50% { opacity:.9; } }
.bp { animation: border-pulse 2.5s ease-in-out infinite; }

/* ── Shimmer ── */
@keyframes shimmer-move {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
.card-shimmer { position: relative; }
.card-shimmer::after {
  content: '';
  position: absolute; top: 0; left: 0; width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.055), transparent);
  animation: shimmer-move 4.5s ease-in-out infinite;
  pointer-events: none; border-radius: inherit;
}

/* ── Dot glow ── */
@keyframes dot-glow { 0%,100%{opacity:.3} 50%{opacity:1} }
.dg { animation: dot-glow 2s ease-in-out infinite; }

/* ── Pulse ring ── */
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
.pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}

/* ── Glass ── */
.glass {
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
}

/* ── Border radius variants ── */
.ra { border-radius: 20px 6px 20px 6px; }
.rb { border-radius: 6px 20px 6px 20px; }
.rp { border-radius: 28px; }
.rs { border-radius: 14px; }

/* ── Texture ── */
.tex {
  background-image: repeating-linear-gradient(
    -52deg, transparent, transparent 22px,
    rgba(255,255,255,.012) 22px, rgba(255,255,255,.012) 23px
  );
}

/* ── Dot grid ── */
.dotgrid {
  background-image: radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
  background-size: 30px 30px;
}

/* ── Card hover ── */
.ct { transition: box-shadow .35s ease, transform .35s cubic-bezier(.34,1.46,.64,1), border-color .35s ease; }
.hv-em:hover { box-shadow: 0 0 0 1px rgba(16,185,129,.6), 0 24px 70px rgba(16,185,129,.2); transform: translateY(-6px); }
.hv-ro:hover { box-shadow: 0 0 0 1px rgba(244,63,94,.6), 0 24px 70px rgba(244,63,94,.2); transform: translateY(-6px); }
.hv-am:hover { box-shadow: 0 0 0 1px rgba(245,158,11,.6), 0 24px 70px rgba(245,158,11,.2); transform: translateY(-6px); }
.hv-sk:hover { box-shadow: 0 0 0 1px rgba(56,189,248,.6), 0 24px 70px rgba(56,189,248,.2); transform: translateY(-6px); }
.hv-vi:hover { box-shadow: 0 0 0 1px rgba(139,92,246,.6), 0 24px 70px rgba(139,92,246,.2); transform: translateY(-6px); }

/* ── Case drop shadow ── */
.case-shadow { filter: drop-shadow(0 16px 40px rgba(0,0,0,.85)) drop-shadow(0 4px 12px rgba(0,0,0,.6)); }

/* ── Floating case glow ── */
.case-glow-green { filter: drop-shadow(0 0 20px rgba(16,185,129,.45)) drop-shadow(0 16px 40px rgba(0,0,0,.8)); }
.case-glow-rose  { filter: drop-shadow(0 0 20px rgba(244,63,94,.4)) drop-shadow(0 16px 40px rgba(0,0,0,.8)); }
.case-glow-amber { filter: drop-shadow(0 0 20px rgba(245,158,11,.4)) drop-shadow(0 16px 40px rgba(0,0,0,.8)); }
.case-glow-sky   { filter: drop-shadow(0 0 20px rgba(56,189,248,.35)) drop-shadow(0 16px 40px rgba(0,0,0,.8)); }
.case-glow-vi    { filter: drop-shadow(0 0 20px rgba(139,92,246,.4)) drop-shadow(0 16px 40px rgba(0,0,0,.8)); }

/* ── Gradient text ── */
.grad-text-em { background: linear-gradient(135deg,#10b981,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.grad-text-sk { background: linear-gradient(135deg,#38bdf8,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* ── No scrollbar on body ── */
.lv::-webkit-scrollbar { display: none; }
`;

/* ── Data ── */
const CARDS = [
  { name:'Battles', desc:'PvP case battles — highest value wins', page:'Battles', size:'lg', accent:'#10b981', hv:'hv-em', caseImg: vtechImg, caseGlow:'case-glow-green', video:'/assets/battles-DoAezb8E.mp4' },
  { name:'Cases', desc:'Unbox premium items, discover rare loot', page:'Cases', size:'lg', accent:'#f43f5e', hv:'hv-ro', caseImg: roseImg, caseGlow:'case-glow-rose' },
  { name:'Coinflip', desc:'1v1 — winner takes all', page:'Coinflip', size:'sm', accent:'#f59e0b', hv:'hv-am', caseImg: irishImg, caseGlow:'case-glow-amber' },
  { name:'Upgrade', desc:'Risk items for better loot', page:'Upgrade', size:'sm', accent:'#38bdf8', hv:'hv-sk', caseImg: vtechImg, caseGlow:'case-glow-sky' },
  { name:'Crash', desc:'Cash out before it crashes', page:'Crash', size:'sm', accent:'#8b5cf6', hv:'hv-vi', caseImg: roseImg, caseGlow:'case-glow-vi' },
];

const FLOAT_CASES = [
  { src: vtechImg, cls:'fa', glow:'case-glow-green', w: 160, right:'4%',  top:'4%',  opacity: 1,   zIndex:4 },
  { src: roseImg,  cls:'fb', glow:'case-glow-rose',  w: 130, right:'22%', top:'48%', opacity: 0.95, zIndex:3 },
  { src: irishImg, cls:'fc', glow:'case-glow-amber', w: 118, right:'6%',  top:'58%', opacity: 0.9,  zIndex:4 },
  { src: vtechImg, cls:'fd', glow:'case-glow-sky',   w: 90,  right:'32%', top:'6%',  opacity: 0.8,  zIndex:2 },
  { src: irishImg, cls:'fe', glow:'case-glow-amber', w: 100, right:'36%', top:'64%', opacity: 0.75, zIndex:2 },
];

/* ── Tilt Card ── */
function TiltCard({ children }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx:0, ry:0 });
  const move = e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setT({ rx: -((e.clientY-r.top)/r.height-.5)*12, ry: ((e.clientX-r.left)/r.width-.5)*12 });
  };
  return (
    <motion.div ref={ref} onMouseMove={move} onMouseLeave={()=>setT({rx:0,ry:0})}
      animate={{ rotateX:t.rx, rotateY:t.ry }}
      transition={{ type:'spring', stiffness:200, damping:22 }}
      style={{ transformStyle:'preserve-3d', perspective:1000 }}>
      {children}
    </motion.div>
  );
}

/* ── Hero Background ── */
function HeroBG() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="o1 absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full"
        style={{background:'radial-gradient(circle, rgba(16,185,129,.18) 0%, rgba(16,185,129,.06) 40%, transparent 70%)'}}/>
      <div className="o2 absolute -top-20 right-0 w-[480px] h-[480px] rounded-full"
        style={{background:'radial-gradient(circle, rgba(56,189,248,.14) 0%, rgba(56,189,248,.04) 40%, transparent 70%)'}}/>
      <div className="o3 absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{background:'radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 70%)'}}/>
      <div className="o4 absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full"
        style={{background:'radial-gradient(circle, rgba(244,63,94,.08) 0%, transparent 70%)'}}/>
      <div className="absolute inset-0 dotgrid"/>
      <div className="absolute inset-0" style={{
        backgroundImage:'repeating-linear-gradient(-45deg,transparent,transparent 48px,rgba(255,255,255,.006) 48px,rgba(255,255,255,.006) 49px)'
      }}/>
    </div>
  );
}

/* ── Floating Cases ── */
function FloatingCases() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Stronger gradient fade so cases are fully visible on right */}
      <div className="absolute inset-0" style={{
        background:'linear-gradient(to right, rgba(8,10,18,1) 0%, rgba(8,10,18,.85) 28%, rgba(8,10,18,.3) 48%, transparent 62%)'
      }}/>
      {FLOAT_CASES.map((c,i) => (
        <img
          key={i}
          src={c.src}
          alt=""
          className={`absolute select-none ${c.cls} ${c.glow}`}
          style={{
            width: c.w,
            right: c.right,
            top: c.top,
            opacity: c.opacity,
            zIndex: c.zIndex,
          }}
        />
      ))}
    </div>
  );
}

/* ── Large Game Card ── */
function LgCard({ card, i }) {
  const [hov, setHov] = useState(false);
  const vRef = useRef(null);
  const onIn = () => { setHov(true); vRef.current?.play().catch(()=>{}); };
  const onOut = () => { setHov(false); if(vRef.current){vRef.current.pause();vRef.current.currentTime=0;} };
  const a = card.accent;

  return (
    <motion.div
      initial={{opacity:0,y:40}}
      animate={{opacity:1,y:0}}
      transition={{delay:i*.14,duration:.8,ease:[.22,1,.36,1]}}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div
            className={`card-shimmer relative overflow-hidden ra glass tex ct cursor-pointer ${card.hv}`}
            style={{
              height: 260,
              background: `
                radial-gradient(ellipse at 75% 10%, ${a}25 0%, transparent 55%),
                radial-gradient(ellipse at 10% 95%, ${a}12 0%, transparent 50%),
                linear-gradient(160deg, rgba(12,16,28,.96) 0%, rgba(7,9,18,.98) 100%)
              `,
              border: `1px solid ${a}35`,
              boxShadow: `0 0 0 1px ${a}18, 0 12px 50px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)`,
            }}
            onMouseEnter={onIn}
            onMouseLeave={onOut}>

            <div className="scan"/>

            {/* Video overlay */}
            {card.video && (
              <video ref={vRef} muted playsInline preload="auto" src={card.video}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{opacity: hov ? .28 : 0}}/>
            )}

            {/* Colour glow blob */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none transition-opacity duration-500"
              style={{background:`radial-gradient(circle, ${a}40 0%, transparent 65%)`, opacity: hov ? 1 : .35}}/>

            {/* Corner SVG accents */}
            <svg className="absolute top-0 right-0 w-16 h-16 bp">
              <line x1="100%" y1="0" x2="50%" y2="0" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="100%" y1="0" x2="100%" y2="50%" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-16 h-16 bp" style={{animationDelay:'.9s'}}>
              <line x1="0" y1="100%" x2="50%" y2="100%" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="100%" x2="0" y2="50%" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            {/* Case image — large, visible, with glow */}
            <motion.img
              src={card.caseImg}
              alt={card.name}
              className={`absolute select-none pointer-events-none ${card.caseGlow}`}
              style={{
                width: 160,
                right: 24,
                top: '50%',
                marginTop: -80,
              }}
              animate={{
                scale: hov ? 1.14 : 1,
                y: hov ? -12 : 0,
                rotate: hov ? 6 : 0,
                filter: hov
                  ? `drop-shadow(0 0 40px ${a}90) drop-shadow(0 20px 50px rgba(0,0,0,.9))`
                  : `drop-shadow(0 0 20px ${a}55) drop-shadow(0 16px 40px rgba(0,0,0,.85))`,
              }}
              transition={{type:'spring',stiffness:200,damping:18}}
            />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6"
              style={{background:`linear-gradient(to top, rgba(5,7,16,.98) 0%, rgba(5,7,16,.75) 55%, transparent 100%)`}}>

              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{background:`${a}20`, color:a, border:`1px solid ${a}45`}}>
                <span className="dg w-1.5 h-1.5 rounded-full" style={{background:a, boxShadow:`0 0 8px ${a}`}}/>
                {card.name}
              </div>

              <p className="text-[#4a6070] text-xs font-light leading-relaxed">{card.desc}</p>

              <motion.div
                animate={{opacity: hov ? 1 : 0, x: hov ? 0 : -12}}
                transition={{duration:.22}}
                className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                style={{color:a}}>
                Play Now <ChevronRight className="w-3.5 h-3.5"/>
              </motion.div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ── Small Game Card ── */
function SmCard({ card, i }) {
  const [hov, setHov] = useState(false);
  const a = card.accent;

  return (
    <motion.div
      initial={{opacity:0,y:28}}
      animate={{opacity:1,y:0}}
      transition={{delay:.28+i*.1,duration:.7,ease:[.22,1,.36,1]}}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div
            className={`card-shimmer relative overflow-hidden rb glass tex ct cursor-pointer ${card.hv}`}
            style={{
              height: 170,
              background: `
                radial-gradient(ellipse at 80% 10%, ${a}20 0%, transparent 55%),
                linear-gradient(160deg, rgba(12,16,28,.96) 0%, rgba(7,9,18,.98) 100%)
              `,
              border: `1px solid ${a}28`,
              boxShadow: `0 0 0 1px ${a}14, 0 8px 32px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.03)`,
            }}
            onMouseEnter={()=>setHov(true)}
            onMouseLeave={()=>setHov(false)}>

            {/* Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none transition-opacity duration-500"
              style={{background:`radial-gradient(circle, ${a}35 0%, transparent 65%)`, opacity: hov ? 1 : .4}}/>

            {/* Case image — large enough to be clearly visible */}
            <motion.img
              src={card.caseImg}
              alt={card.name}
              className={`absolute select-none pointer-events-none ${card.caseGlow}`}
              style={{
                width: 106,
                right: 10,
                top: 8,
              }}
              animate={{
                scale: hov ? 1.2 : 1,
                y: hov ? -8 : 0,
                rotate: hov ? 5 : 0,
              }}
              transition={{type:'spring',stiffness:260,damping:20}}
            />

            <div className="absolute bottom-0 left-0 right-0 p-4"
              style={{background:`linear-gradient(to top, rgba(5,7,16,.98) 0%, rgba(5,7,16,.6) 60%, transparent 100%)`}}>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-1.5 text-[9px] font-bold uppercase tracking-wider"
                style={{background:`${a}22`, color:a, border:`1px solid ${a}40`}}>
                <span className="dg w-1 h-1 rounded-full" style={{background:a}}/>
                {card.name}
              </div>
              <p className="text-[#3d5060] text-[10px] leading-snug">{card.desc}</p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ── Section Header ── */
function SectionHeader({ label, gradFrom, gradTo, icon: Icon, iconColor, right }) {
  return (
    <motion.div
      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.32}}
      className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-7 rounded-full" style={{background:`linear-gradient(to bottom,${gradFrom},${gradTo})`}}/>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{background:`${gradFrom}18`, border:`1px solid ${gradFrom}30`}}>
          <Icon className="w-3.5 h-3.5" style={{color:iconColor}}/>
        </div>
        <h2 className="lv-h text-base text-white tracking-widest">{label}</h2>
      </div>
      {right}
    </motion.div>
  );
}

/* ── Main ── */
export default function Home() {
  const { loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({is_active:true},'-created_date',4)
      .then(setFeaturedCases).catch(()=>setFeaturedCases([]));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]" style={{background:'#07080f'}}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border border-[#10b981]/10"/>
        <div className="absolute inset-0 rounded-full border-t-2 border-[#10b981] animate-spin"/>
        <div className="absolute inset-1 rounded-full border-b-2 border-[#f43f5e] animate-spin" style={{animationDuration:'.75s',animationDirection:'reverse'}}/>
        <div className="absolute inset-2.5 rounded-full border-l border-[#8b5cf6] animate-spin" style={{animationDuration:'1.5s'}}/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{boxShadow:'0 0 12px #10b981'}}/>
        </div>
      </div>
    </div>
  );

  const lgCards = CARDS.filter(c=>c.size==='lg');
  const smCards = CARDS.filter(c=>c.size==='sm');

  return (
    <div className="lv space-y-10 pb-20" style={{background:'#07080f', minHeight:'100vh'}}>
      <style>{CSS}</style>

      {/* ══════════ HERO ══════════════════════════════════ */}
      <motion.section
        initial={{opacity:0,y:24}}
        animate={{opacity:1,y:0}}
        transition={{duration:.95,ease:[.22,1,.36,1]}}
        className="relative overflow-hidden rp"
        style={{
          minHeight: 380,
          background: 'linear-gradient(155deg, #0c1525 0%, #0e1e35 38%, #090b14 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,.045), 0 60px 120px rgba(0,0,0,.65)',
        }}>

        <HeroBG/>
        <FloatingCases/>

        {/* Text block */}
        <div className="relative z-10 p-8 md:p-14 max-w-[560px]">

          {/* Live badge */}
          <motion.div
            initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:.2}}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7"
            style={{background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.28)'}}>
            <Sparkles className="w-3 h-3" style={{color:'#10b981'}}/>
            <span className="text-[10px] font-bold uppercase tracking-[.25em]" style={{color:'#10b981'}}>Lootverse</span>
            <div className="relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] dg" style={{boxShadow:'0 0 8px #10b981'}}/>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#10b981] pulse-ring"/>
            </div>
            <span className="text-[10px] font-medium" style={{color:'rgba(16,185,129,.5)'}}>LIVE</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
            transition={{delay:.3,duration:.9}}
            className="lv-h text-white leading-none mb-5"
            style={{fontSize:'clamp(52px,7.5vw,90px)'}}>
            OPEN CASES.<br/>
            <span className="title-em">WIN BIG.</span><br/>
            <span style={{color:'rgba(255,255,255,.18)', fontSize:'.55em', letterSpacing:'.1em'}}>EVERY TIME.</span>
          </motion.h1>

          <motion.p
            initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}}
            className="text-sm leading-relaxed mb-9 font-light"
            style={{color:'#3a5568', maxWidth:300}}>
            Premium loot. Real battles.<br/>Every unbox could change everything.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.62}}
            className="flex flex-wrap gap-3">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}
                className="lv-h flex items-center gap-2 px-8 py-3.5 text-white rs"
                style={{
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
                  boxShadow: '0 0 50px rgba(16,185,129,.4), 0 4px 24px rgba(0,0,0,.5)',
                }}>
                <Trophy className="w-4 h-4"/>
                LEADERBOARD
              </motion.button>
            </Link>
            <Link to={createPageUrl('Cases')}>
              <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}
                className="lv-h flex items-center gap-2 px-8 py-3.5 rs"
                style={{
                  fontSize: 15,
                  background: 'rgba(16,185,129,.08)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,.32)',
                  backdropFilter: 'blur(20px)',
                }}>
                OPEN CASES
                <ChevronRight className="w-4 h-4"/>
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{background:'linear-gradient(to top, rgba(7,8,15,.9), transparent)'}}/>
      </motion.section>

      {/* ══════════ GAME MODES ════════════════════════════ */}
      <section className="px-0">
        <SectionHeader
          label="GAME MODES"
          gradFrom="#10b981" gradTo="#38bdf8"
          icon={Zap} iconColor="#f59e0b"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {lgCards.map((c,i)=><LgCard key={c.name} card={c} i={i}/>)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {smCards.map((c,i)=><SmCard key={c.name} card={c} i={i}/>)}
        </div>
      </section>

      {/* ══════════ FEATURED CASES ════════════════════════ */}
      {featuredCases.length > 0 && (
        <section>
          <SectionHeader
            label="FEATURED CASES"
            gradFrom="#f43f5e" gradTo="#8b5cf6"
            icon={Star} iconColor="#f59e0b"
            right={
              <Link to={createPageUrl('Cases')}>
                <motion.span whileHover={{x:5}}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{color:'#2a3d4e'}}>
                  View all <ChevronRight className="w-3.5 h-3.5"/>
                </motion.span>
              </Link>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c,i) => (
              <motion.div key={c.id}
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                transition={{delay:.5+i*.1}}>
                <TiltCard>
                  <Link to={`${createPageUrl('CaseOpen')}?id=${c.id}`}>
                    <div className="card-shimmer relative overflow-hidden ra glass tex ct hv-sk cursor-pointer p-5 text-center"
                      style={{
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,.12), transparent 65%), linear-gradient(160deg,rgba(12,16,28,.96),rgba(7,9,18,.98))',
                        border: '1px solid rgba(56,189,248,.2)',
                        boxShadow: '0 0 0 1px rgba(56,189,248,.1), 0 8px 32px rgba(0,0,0,.5)',
                      }}>
                      <div className="w-14 h-14 rs mx-auto mb-3 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg,rgba(56,189,248,.16),rgba(139,92,246,.12))',
                          border: '1px solid rgba(56,189,248,.25)',
                          boxShadow: '0 4px 24px rgba(56,189,248,.14)',
                        }}>
                        <Box className="w-7 h-7" style={{color:'#38bdf8'}}/>
                      </div>
                      <h3 className="text-xs font-semibold text-white mb-1 truncate">{c.name}</h3>
                      <p className="text-[11px] font-bold" style={{color:'#f43f5e'}}>{c.price?.toLocaleString()} coins</p>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}