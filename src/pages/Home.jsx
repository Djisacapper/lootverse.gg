import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Gift, ChevronRight, Trophy, Star, Sparkles, Box, Swords, TrendingUp } from 'lucide-react';

/* ─── Image URLs ─────────────────────────────────────────────
   Uses new URL() so Vite handles filenames with spaces/special
   chars correctly from src/assets/
──────────────────────────────────────────────────────────── */
const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href;
const roseImg  = new URL('../assets/Rose Love.png',         import.meta.url).href;
const vtechImg = new URL('../assets/V-Tech.png',            import.meta.url).href;

/* ─── CSS ────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

  .lv { font-family: 'Outfit', sans-serif; }
  .lv-h { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }

  /* ── Keyframes ── */
  @keyframes orb1 {
    0%,100% { transform: translate(0,0)    scale(1);    }
    40%     { transform: translate(40px,-30px) scale(1.1); }
    70%     { transform: translate(-20px,20px) scale(0.93); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0)      scale(1);    }
    35%     { transform: translate(-30px,25px) scale(1.08); }
    65%     { transform: translate(25px,-20px) scale(0.95); }
  }
  @keyframes orb3 {
    0%,100% { transform: translate(0,0)    scale(1);    }
    50%     { transform: translate(20px,30px) scale(1.05); }
  }
  .o1 { animation: orb1 16s ease-in-out infinite; }
  .o2 { animation: orb2 20s ease-in-out infinite; }
  .o3 { animation: orb3 24s ease-in-out infinite reverse; }

  @keyframes float-a {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    30%     { transform: translateY(-18px) rotate(2deg);  }
    70%     { transform: translateY(-9px)  rotate(-1.5deg); }
  }
  @keyframes float-b {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    40%     { transform: translateY(-12px) rotate(-2deg); }
    80%     { transform: translateY(-20px) rotate(1deg);  }
  }
  @keyframes float-c {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    25%     { transform: translateY(-22px) rotate(1.5deg); }
    60%     { transform: translateY(-8px)  rotate(-2deg);  }
  }
  @keyframes float-d {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    45%     { transform: translateY(-15px) rotate(2.5deg); }
    75%     { transform: translateY(-25px) rotate(-1deg);  }
  }
  @keyframes float-e {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    55%     { transform: translateY(-10px) rotate(-2deg); }
    85%     { transform: translateY(-18px) rotate(1.5deg);}
  }
  .fa { animation: float-a 7s  ease-in-out infinite; }
  .fb { animation: float-b 9s  ease-in-out infinite; }
  .fc { animation: float-c 8s  ease-in-out infinite; }
  .fd { animation: float-d 11s ease-in-out infinite; }
  .fe { animation: float-e 10s ease-in-out infinite; }

  @keyframes scan {
    0%   { top: -2px; opacity:0; }
    5%   { opacity:1; }
    95%  { opacity:1; }
    100% { top: 100%; opacity:0; }
  }
  .scan { position:absolute; left:0; right:0; height:1px;
    background: linear-gradient(90deg,transparent,rgba(56,189,248,.5),transparent);
    animation: scan 5s ease-in-out infinite; pointer-events:none; z-index:5; }

  @keyframes title-breathe {
    0%,100% { text-shadow: 0 0 0px rgba(16,185,129,0); }
    50%     { text-shadow: 0 0 80px rgba(16,185,129,.4), 0 0 160px rgba(16,185,129,.15); }
  }
  .title-em { color:#10b981; animation: title-breathe 3.5s ease-in-out infinite; }

  @keyframes border-pulse {
    0%,100% { opacity:.3; }
    50%     { opacity:.8; }
  }
  .bp { animation: border-pulse 2.5s ease-in-out infinite; }

  @keyframes shimmer-move {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  .card-shimmer::after {
    content:''; position:absolute; top:0; left:0; width:40%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent);
    animation: shimmer-move 4s ease-in-out infinite;
    pointer-events:none;
  }

  @keyframes dot-glow { 0%,100%{opacity:.3} 50%{opacity:1} }
  .dg { animation: dot-glow 2s ease-in-out infinite; }

  /* Glass */
  .glass { backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }

  /* Radius variants — organic, non-blocky */
  .ra  { border-radius: 24px 8px 24px 8px; }
  .rb  { border-radius: 8px 24px 8px 24px; }
  .rp  { border-radius: 32px; }
  .rs  { border-radius: 18px; }

  /* Diagonal stripe texture */
  .tex {
    background-image: repeating-linear-gradient(
      -52deg, transparent, transparent 20px,
      rgba(255,255,255,.011) 20px, rgba(255,255,255,.011) 21px
    );
  }

  /* Card transition */
  .ct { transition: box-shadow .35s ease, transform .35s cubic-bezier(.34,1.46,.64,1), border-color .35s ease; }

  /* Per-accent hover */
  .hv-em:hover { box-shadow:0 0 0 1px rgba(16,185,129,.55), 0 20px 60px rgba(16,185,129,.16); transform:translateY(-5px); }
  .hv-ro:hover { box-shadow:0 0 0 1px rgba(244,63,94,.55),  0 20px 60px rgba(244,63,94,.16);  transform:translateY(-5px); }
  .hv-am:hover { box-shadow:0 0 0 1px rgba(245,158,11,.55), 0 20px 60px rgba(245,158,11,.16); transform:translateY(-5px); }
  .hv-sk:hover { box-shadow:0 0 0 1px rgba(56,189,248,.55), 0 20px 60px rgba(56,189,248,.16); transform:translateY(-5px); }
  .hv-vi:hover { box-shadow:0 0 0 1px rgba(139,92,246,.55), 0 20px 60px rgba(139,92,246,.16); transform:translateY(-5px); }

  /* Dot grid bg */
  .dotgrid {
    background-image: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* Case image drop shadow */
  .case-shadow { filter: drop-shadow(0 12px 30px rgba(0,0,0,.7)); }
`;

/* ─── Data ──────────────────────────────────────────────── */
const CARDS = [
  { name:'Battles',  desc:'PvP case battles — highest value wins',  page:'Battles',  size:'lg', accent:'#10b981', hv:'hv-em', img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80', caseImg: vtechImg, video:'/assets/battles-DoAezb8E.mp4' },
  { name:'Cases',    desc:'Unbox premium items, discover rare loot', page:'Cases',    size:'lg', accent:'#f43f5e', hv:'hv-ro', img: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&q=80', caseImg: roseImg  },
  { name:'Coinflip', desc:'1v1 — winner takes all',                  page:'Coinflip', size:'sm', accent:'#f59e0b', hv:'hv-am', caseImg: irishImg },
  { name:'Upgrade',  desc:'Risk items for better loot',              page:'Upgrade',  size:'sm', accent:'#38bdf8', hv:'hv-sk', caseImg: vtechImg },
  { name:'Crash',    desc:'Cash out before it crashes',              page:'Crash',    size:'sm', accent:'#8b5cf6', hv:'hv-vi', caseImg: roseImg  },
];

const FLOAT_CASES = [
  { src: vtechImg,  cls:'fa', w: 130, right:'3%',  top:'5%',  opacity:.92 },
  { src: irishImg,  cls:'fc', w: 100, right:'20%', top:'42%', opacity:.85 },
  { src: roseImg,   cls:'fb', w: 115, right:'5%',  top:'55%', opacity:.90 },
  { src: vtechImg,  cls:'fd', w:  78, right:'30%', top:'8%',  opacity:.75 },
  { src: irishImg,  cls:'fe', w:  88, right:'34%', top:'62%', opacity:.70 },
];

/* ─── Tilt Card ─────────────────────────────────────────── */
function TiltCard({ children }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx:0, ry:0 });
  const move = e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setT({ rx: -((e.clientY-r.top)/r.height-.5)*10, ry: ((e.clientX-r.left)/r.width-.5)*10 });
  };
  return (
    <motion.div ref={ref} onMouseMove={move} onMouseLeave={()=>setT({rx:0,ry:0})}
      animate={{ rotateX:t.rx, rotateY:t.ry }}
      transition={{ type:'spring', stiffness:220, damping:24 }}
      style={{ transformStyle:'preserve-3d', perspective:900 }}>
      {children}
    </motion.div>
  );
}

/* ─── Hero Background ───────────────────────────────────── */
function HeroBG() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ambient colour orbs */}
      <div className="o1 absolute -top-32 -left-24 w-[500px] h-[500px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(16,185,129,.13) 0%,transparent 68%)'}}/>
      <div className="o2 absolute top-0 right-0 w-[380px] h-[380px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(56,189,248,.10) 0%,transparent 68%)'}}/>
      <div className="o3 absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 68%)'}}/>
      {/* Fine dot grid */}
      <div className="absolute inset-0 dotgrid"/>
      {/* Diagonal lines */}
      <div className="absolute inset-0" style={{
        backgroundImage:'repeating-linear-gradient(-45deg,transparent,transparent 48px,rgba(255,255,255,.009) 48px,rgba(255,255,255,.009) 49px)'
      }}/>
    </div>
  );
}

/* ─── Floating Cases ────────────────────────────────────── */
function FloatingCases() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Gradient mask so cases fade on the left edge near text */}
      <div className="absolute inset-0" style={{
        background:'linear-gradient(to right, rgba(8,10,18,1) 0%, rgba(8,10,18,.7) 30%, transparent 55%)'
      }}/>
      {FLOAT_CASES.map((c,i) => (
        <img key={i} src={c.src} alt="" className={`absolute case-shadow select-none ${c.cls}`}
          style={{ width:c.w, right:c.right, top:c.top, opacity:c.opacity, zIndex:2 }}
        />
      ))}
    </div>
  );
}

/* ─── Large Game Card ───────────────────────────────────── */
function LgCard({ card, i }) {
  const [hov, setHov] = useState(false);
  const vRef = useRef(null);
  const onIn  = () => { setHov(true);  vRef.current?.play().catch(()=>{}); };
  const onOut = () => { setHov(false); if(vRef.current){vRef.current.pause();vRef.current.currentTime=0;} };
  const a = card.accent;

  return (
    <motion.div initial={{opacity:0,y:32}} animate={{opacity:1,y:0}}
      transition={{delay:i*.13,duration:.75,ease:[.22,1,.36,1]}}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`card-shimmer relative overflow-hidden ra glass tex ct cursor-pointer ${card.hv}`}
            style={{ height:240,
              background:`radial-gradient(ellipse at 80% 15%,${a}1a 0%,transparent 55%),
                          radial-gradient(ellipse at 10% 90%,${a}0d 0%,transparent 50%),
                          rgba(9,12,22,.85)`,
              border:`1px solid ${a}28`,
              boxShadow:`0 0 0 1px ${a}18, 0 8px 40px rgba(0,0,0,.45)`,
            }}
            onMouseEnter={onIn} onMouseLeave={onOut}>

            <div className="scan"/>

            {/* BG photo */}
            {card.img && <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{backgroundImage:`url(${card.img})`,opacity:hov?.14:.05}}/>}

            {/* Video */}
            {card.video && <video ref={vRef} muted playsInline preload="auto" src={card.video}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{opacity:hov?.32:0}}/>}

            {/* Colour glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none transition-opacity duration-500"
              style={{background:`radial-gradient(circle,${a}30,transparent 70%)`,opacity:hov?1:.3}}/>

            {/* Corner accents */}
            <svg className="absolute top-0 right-0 w-14 h-14 bp">
              <line x1="100%" y1="0" x2="55%" y2="0"   stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="100%" y1="0" x2="100%" y2="45%" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-14 h-14 bp" style={{animationDelay:'.8s'}}>
              <line x1="0" y1="100%" x2="45%" y2="100%" stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="100%" x2="0" y2="55%"   stroke={a} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            {/* Case image */}
            <motion.img src={card.caseImg} alt={card.name}
              className="absolute case-shadow select-none pointer-events-none"
              style={{width:130, right:16, top:'50%', marginTop:-65, filter:`drop-shadow(0 8px 32px ${a}70)`}}
              animate={{scale:hov?1.12:1, y:hov?-8:0, rotate:hov?5:0}}
              transition={{type:'spring',stiffness:220,damping:18}}/>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6"
              style={{background:`linear-gradient(to top, rgba(5,7,15,.96) 0%, rgba(5,7,15,.5) 60%, transparent 100%)`}}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{background:`${a}18`,color:a,border:`1px solid ${a}38`}}>
                <span className="dg w-1.5 h-1.5 rounded-full" style={{background:a}}/>
                {card.name}
              </div>
              <p className="text-[#3d5870] text-xs font-light">{card.desc}</p>
              <motion.div animate={{opacity:hov?1:0,x:hov?0:-10}} transition={{duration:.2}}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold" style={{color:a}}>
                Play Now <ChevronRight className="w-3 h-3"/>
              </motion.div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ─── Small Game Card ───────────────────────────────────── */
function SmCard({ card, i }) {
  const [hov, setHov] = useState(false);
  const a = card.accent;
  return (
    <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
      transition={{delay:.24+i*.09,duration:.65,ease:[.22,1,.36,1]}}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`card-shimmer relative overflow-hidden rb glass tex ct cursor-pointer ${card.hv}`}
            style={{ height:158,
              background:`radial-gradient(ellipse at 85% 10%,${a}16 0%,transparent 58%), rgba(9,12,22,.85)`,
              border:`1px solid ${a}22`,
              boxShadow:`0 0 0 1px ${a}14, 0 6px 28px rgba(0,0,0,.4)`,
            }}
            onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>

            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none transition-opacity duration-500"
              style={{background:`radial-gradient(circle,${a}25,transparent 70%)`,opacity:hov?1:.4}}/>

            {/* Case image */}
            <motion.img src={card.caseImg} alt={card.name}
              className="absolute case-shadow select-none pointer-events-none"
              style={{width:86, right:8, top:10, filter:`drop-shadow(0 4px 18px ${a}55)`}}
              animate={{scale:hov?1.18:1, y:hov?-5:0}}
              transition={{type:'spring',stiffness:280,damping:20}}/>

            <div className="absolute bottom-0 left-0 right-0 p-4"
              style={{background:`linear-gradient(to top,rgba(5,7,15,.94) 0%,transparent 100%)`}}>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-1 text-[9px] font-bold uppercase tracking-wider"
                style={{background:`${a}18`,color:a,border:`1px solid ${a}2e`}}>
                {card.name}
              </div>
              <p className="text-[#2e4555] text-[10px] leading-snug">{card.desc}</p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ─── Section Header ────────────────────────────────────── */
function SectionHeader({ label, gradFrom, gradTo, icon: Icon, iconColor, right }) {
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.3}}
      className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-6 rounded-full" style={{background:`linear-gradient(to bottom,${gradFrom},${gradTo})`}}/>
        <Icon className="w-4 h-4" style={{color:iconColor}}/>
        <h2 className="lv-h text-base text-white tracking-widest">{label}</h2>
      </div>
      {right}
    </motion.div>
  );
}

/* ─── Main ──────────────────────────────────────────────── */
export default function Home() {
  const { loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({is_active:true},'-created_date',4)
      .then(setFeaturedCases).catch(()=>setFeaturedCases([]));
  },[]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border border-[#10b981]/15"/>
        <div className="absolute inset-0 rounded-full border-t-2 border-[#10b981] animate-spin"/>
        <div className="absolute inset-1 rounded-full border-b-2 border-[#f43f5e] animate-spin"
          style={{animationDuration:'.7s',animationDirection:'reverse'}}/>
        <div className="absolute inset-2 rounded-full border-l border-[#8b5cf6] animate-spin"
          style={{animationDuration:'1.4s'}}/>
      </div>
    </div>
  );

  const lgCards = CARDS.filter(c=>c.size==='lg');
  const smCards = CARDS.filter(c=>c.size==='sm');

  return (
    <div className="lv space-y-10 pb-16" style={{background:'#07080f',minHeight:'100vh'}}>
      <style>{CSS}</style>

      {/* ════════ HERO ════════════════════════════════ */}
      <motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
        transition={{duration:.9,ease:[.22,1,.36,1]}}
        className="relative overflow-hidden rp"
        style={{
          minHeight:340,
          background:'linear-gradient(150deg,#0b1321 0%,#0d1b2e 45%,#08090f 100%)',
          boxShadow:'0 0 0 1px rgba(255,255,255,.04), 0 48px 96px rgba(0,0,0,.6)',
        }}>

        <HeroBG/>
        <FloatingCases/>

        {/* Text block — sits above everything */}
        <div className="relative z-10 p-8 md:p-14 max-w-[520px]">

          {/* Live badge */}
          <motion.div initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:.18}}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
            style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.22)'}}>
            <Sparkles className="w-3 h-3" style={{color:'#10b981'}}/>
            <span className="text-[10px] font-semibold uppercase tracking-[.22em]" style={{color:'#10b981'}}>Lootverse</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] dg"/>
            <span className="text-[10px]" style={{color:'#1c4a30'}}>Live</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
            transition={{delay:.28,duration:.85}}
            className="lv-h text-white leading-none mb-4"
            style={{fontSize:'clamp(48px,7vw,82px)'}}>
            OPEN CASES.<br/>
            <span className="title-em">WIN BIG.</span><br/>
            <span style={{color:'rgba(255,255,255,.2)',fontSize:'.58em'}}>EVERY TIME.</span>
          </motion.h1>

          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.46}}
            className="text-sm leading-relaxed mb-8 font-light"
            style={{color:'#304555',maxWidth:280}}>
            Premium loot. Real battles.<br/>Every unbox could change everything.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.58}}
            className="flex flex-wrap gap-3">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}
                className="lv-h flex items-center gap-2 px-7 py-3.5 text-white rs"
                style={{
                  fontSize:16,
                  background:'linear-gradient(135deg,#10b981 0%,#059669 100%)',
                  boxShadow:'0 0 40px rgba(16,185,129,.32),0 4px 20px rgba(0,0,0,.4)',
                }}>
                <Trophy className="w-4 h-4"/> LEADERBOARD
              </motion.button>
            </Link>
            <Link to={createPageUrl('Cases')}>
              <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}
                className="lv-h flex items-center gap-2 px-7 py-3.5 rs"
                style={{
                  fontSize:16,
                  background:'rgba(16,185,129,.07)',
                  color:'#10b981',
                  border:'1px solid rgba(16,185,129,.28)',
                  backdropFilter:'blur(16px)',
                }}>
                OPEN CASES <ChevronRight className="w-4 h-4"/>
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
          style={{background:'linear-gradient(to top,rgba(7,8,15,.8),transparent)'}}/>
      </motion.section>

      {/* ════════ GAME MODES ══════════════════════════ */}
      <section>
        <SectionHeader label="GAME MODES" gradFrom="#10b981" gradTo="#38bdf8"
          icon={Zap} iconColor="#f59e0b"/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {lgCards.map((c,i)=><LgCard key={c.name} card={c} i={i}/>)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {smCards.map((c,i)=><SmCard key={c.name} card={c} i={i}/>)}
        </div>
      </section>

      {/* ════════ FEATURED CASES ══════════════════════ */}
      {featuredCases.length > 0 && (
        <section>
          <SectionHeader label="FEATURED CASES" gradFrom="#f43f5e" gradTo="#8b5cf6"
            icon={Star} iconColor="#f59e0b"
            right={
              <Link to={createPageUrl('Cases')}>
                <motion.span whileHover={{x:4}} className="flex items-center gap-1 text-xs font-medium"
                  style={{color:'#253545'}}>
                  View all <ChevronRight className="w-3.5 h-3.5"/>
                </motion.span>
              </Link>
            }/>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c,i) => (
              <motion.div key={c.id} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
                transition={{delay:.5+i*.1}}>
                <TiltCard>
                  <Link to={createPageUrl('CaseOpen')+`?id=${c.id}`}>
                    <div className="card-shimmer relative overflow-hidden ra glass tex ct hv-sk cursor-pointer p-5 text-center"
                      style={{
                        background:'radial-gradient(ellipse at 50% 0%,rgba(56,189,248,.1),transparent 65%),rgba(9,12,22,.85)',
                        border:'1px solid rgba(56,189,248,.18)',
                        boxShadow:'0 0 0 1px rgba(56,189,248,.1)',
                      }}>
                      <div className="w-14 h-14 rs mx-auto mb-3 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                        style={{
                          background:'linear-gradient(135deg,rgba(56,189,248,.14),rgba(139,92,246,.10))',
                          border:'1px solid rgba(56,189,248,.2)',
                          boxShadow:'0 4px 24px rgba(56,189,248,.1)',
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