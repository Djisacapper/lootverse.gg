import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Swords, TrendingUp, Zap, Gift, ChevronRight, Trophy, Star, Sparkles, Box } from 'lucide-react';
import irishImg from '../assets/Luck_Of_The_Irish.png';
import roseImg  from '../assets/Rose_Love.png';
import vtechImg from '../assets/V-Tech.png';

/* ─────────────────────────────────────────────────────────────
   PALETTE  deep midnight + jewel accents (easy on eyes)
   emerald #10b981 · rose #f43f5e · amber #f59e0b
   sky #38bdf8 · violet #8b5cf6
───────────────────────────────────────────────────────────── */

// Real case images — imported from src/assets/
const CASE_IMGS = {
  irish: irishImg,
  rose:  roseImg,
  vtech: vtechImg,
};

// Floating case elevator config — each case has position + animation offset
const FLOATING_CASES = [
  { src: CASE_IMGS.vtech,  w: 110, style: { right: '4%',  top: '8%'  }, delay: 0,    duration: 7  },
  { src: CASE_IMGS.irish,  w: 90,  style: { right: '18%', top: '40%' }, delay: -2.5, duration: 9  },
  { src: CASE_IMGS.rose,   w: 100, style: { right: '6%',  top: '58%' }, delay: -4,   duration: 8  },
  { src: CASE_IMGS.vtech,  w: 72,  style: { right: '28%', top: '12%' }, delay: -1.5, duration: 11 },
  { src: CASE_IMGS.irish,  w: 80,  style: { right: '32%', top: '65%' }, delay: -3,   duration: 10 },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .lv-root { font-family: 'DM Sans', sans-serif; }
  .lv-head  { font-family: 'Syne', sans-serif; }

  /* Ambient orbs */
  @keyframes drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(26px,-16px) scale(1.06); }
    66%      { transform: translate(-16px,12px) scale(0.95); }
  }
  @keyframes driftB {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-20px,16px) scale(1.05); }
    70%     { transform: translate(16px,-10px) scale(0.97); }
  }
  .orb-a { animation: drift  14s ease-in-out infinite; }
  .orb-b { animation: driftB 18s ease-in-out infinite; }
  .orb-c { animation: drift  22s ease-in-out infinite reverse; }

  /* Case elevator float */
  @keyframes case-float {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    25%      { transform: translateY(-14px) rotate(1.5deg); }
    75%      { transform: translateY(-7px) rotate(-1deg); }
  }

  /* Hero title glow sweep — single colour, not rainbow */
  @keyframes glow-sweep {
    0%   { text-shadow: 0 0 40px rgba(16,185,129,0); }
    50%  { text-shadow: 0 0 60px rgba(16,185,129,0.35), 0 0 120px rgba(16,185,129,0.15); }
    100% { text-shadow: 0 0 40px rgba(16,185,129,0); }
  }
  .hero-title-accent {
    color: #10b981;
    animation: glow-sweep 4s ease-in-out infinite;
  }

  @keyframes scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateY(1400%); opacity: 0; }
  }
  .scan-line {
    position: absolute; left: 0; width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent);
    animation: scan 6s ease-in-out infinite;
    pointer-events: none; z-index: 10;
  }

  @keyframes glow-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
  .dot-pulse { animation: glow-pulse 2s ease-in-out infinite; }

  /* Glass */
  .glass {
    background: rgba(10,14,24,0.78);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  /* Organic radius variants */
  .r-a    { border-radius: 28px 10px 28px 10px; }
  .r-b    { border-radius: 10px 28px 10px 28px; }
  .r-pill { border-radius: 36px; }
  .r-soft { border-radius: 20px; }

  /* Stripe texture */
  .stripe {
    background-image: repeating-linear-gradient(
      -55deg, transparent, transparent 22px,
      rgba(255,255,255,0.012) 22px, rgba(255,255,255,0.012) 23px
    );
  }

  .card-t { transition: all 0.4s cubic-bezier(0.34,1.46,0.64,1); }

  /* Hover glows per accent */
  .h-em:hover { box-shadow: 0 0 0 1px rgba(16,185,129,.5), 0 24px 60px rgba(16,185,129,.14); transform: translateY(-4px); }
  .h-ro:hover { box-shadow: 0 0 0 1px rgba(244,63,94,.5),  0 24px 60px rgba(244,63,94,.14);  transform: translateY(-4px); }
  .h-am:hover { box-shadow: 0 0 0 1px rgba(245,158,11,.5), 0 24px 60px rgba(245,158,11,.14); transform: translateY(-4px); }
  .h-sk:hover { box-shadow: 0 0 0 1px rgba(56,189,248,.5), 0 24px 60px rgba(56,189,248,.14); transform: translateY(-4px); }
  .h-vi:hover { box-shadow: 0 0 0 1px rgba(139,92,246,.5), 0 24px 60px rgba(139,92,246,.14); transform: translateY(-4px); }

  .b-em { box-shadow: 0 0 0 1px rgba(16,185,129,.18), 0 6px 28px rgba(16,185,129,.06); }
  .b-ro { box-shadow: 0 0 0 1px rgba(244,63,94,.18),  0 6px 28px rgba(244,63,94,.06); }
  .b-am { box-shadow: 0 0 0 1px rgba(245,158,11,.18), 0 6px 28px rgba(245,158,11,.06); }
  .b-sk { box-shadow: 0 0 0 1px rgba(56,189,248,.18), 0 6px 28px rgba(56,189,248,.06); }
  .b-vi { box-shadow: 0 0 0 1px rgba(139,92,246,.18), 0 6px 28px rgba(139,92,246,.06); }

  /* Case image hover glow */
  .case-img-glow { filter: drop-shadow(0 8px 24px rgba(0,0,0,0.6)); transition: filter 0.3s; }
  .case-img-glow:hover { filter: drop-shadow(0 12px 36px rgba(56,189,248,0.35)); }

  /* Dot grid */
  .dot-grid {
    background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
    background-size: 30px 30px;
  }
`;

// ─── Tilt Card ────────────────────────────────────────────────────────────────
function TiltCard({ children }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    setTilt({ rotateX: -y * 9, rotateY: x * 9 });
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt({ rotateX:0, rotateY:0 })}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={{ type:'spring', stiffness:240, damping:26 }}
      style={{ transformStyle:'preserve-3d', perspective:900 }}>
      {children}
    </motion.div>
  );
}

// ─── Floating Case Elevator ───────────────────────────────────────────────────
function CaseElevator() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {FLOATING_CASES.map((c, i) => (
        <motion.img
          key={i}
          src={c.src}
          alt=""
          className="absolute case-img-glow select-none"
          style={{ width: c.w, ...c.style, opacity: 0.88 }}
          animate={{ y: [0, -16, -8, 0], rotate: [0, 1.5, -1, 0] }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Ambient Mesh Orbs ────────────────────────────────────────────────────────
function HeroMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb-a absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full"
        style={{ background:'radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 70%)' }} />
      <div className="orb-b absolute -top-10 right-0 w-80 h-80 rounded-full"
        style={{ background:'radial-gradient(circle, rgba(56,189,248,.09) 0%, transparent 70%)' }} />
      <div className="orb-c absolute -bottom-12 left-1/3 w-72 h-72 rounded-full"
        style={{ background:'radial-gradient(circle, rgba(139,92,246,.07) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 dot-grid" />
      <div className="absolute inset-0" style={{
        backgroundImage:'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,.01) 40px, rgba(255,255,255,.01) 41px)',
      }} />
    </div>
  );
}

// ─── Game Card Data ───────────────────────────────────────────────────────────
const CARDS = [
  {
    name:'Battles', desc:'PvP case battles — highest value wins', page:'Battles', size:'large',
    accent:'#10b981', bc:'b-em', hc:'h-em', shape:'r-a',
    mesh:'radial-gradient(ellipse at 75% 20%, rgba(16,185,129,.15) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(56,189,248,.08) 0%, transparent 50%)',
    img:'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80',
    video:'/assets/battles-DoAezb8E.mp4',
    caseImg: CASE_IMGS.vtech,
  },
  {
    name:'Cases', desc:'Unbox premium items and discover rare loot', page:'Cases', size:'large',
    accent:'#f43f5e', bc:'b-ro', hc:'h-ro', shape:'r-b',
    mesh:'radial-gradient(ellipse at 20% 20%, rgba(244,63,94,.15) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(245,158,11,.08) 0%, transparent 50%)',
    img:'https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&q=80',
    caseImg: CASE_IMGS.rose,
  },
  { name:'Coinflip', desc:'1v1 winner takes all',       page:'Coinflip', size:'small', accent:'#f59e0b', bc:'b-am', hc:'h-am', shape:'r-a', caseImg: CASE_IMGS.irish },
  { name:'Upgrade',  desc:'Risk items for better loot', page:'Upgrade',  size:'small', accent:'#38bdf8', bc:'b-sk', hc:'h-sk', shape:'r-b', caseImg: CASE_IMGS.vtech },
  { name:'Crash',    desc:'Cash out before it crashes', page:'Crash',    size:'small', accent:'#8b5cf6', bc:'b-vi', hc:'h-vi', shape:'r-a', caseImg: CASE_IMGS.rose  },
];

// ─── Large Game Card ──────────────────────────────────────────────────────────
function LargeCard({ card, index }) {
  const [hov, setHov] = useState(false);
  const vRef = useRef(null);
  const onEnter = () => { setHov(true);  if (vRef.current) { vRef.current.currentTime=0; vRef.current.play().catch(()=>{}); } };
  const onLeave = () => { setHov(false); if (vRef.current) { vRef.current.pause(); vRef.current.currentTime=0; } };

  return (
    <motion.div initial={{ opacity:0, y:26 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:index*0.12, duration:0.7, ease:[0.22,1,0.36,1] }}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`relative overflow-hidden glass stripe ${card.shape} ${card.bc} ${card.hc} card-t cursor-pointer`}
            style={{ height:236, background:`${card.mesh}, rgba(10,14,24,0.82)` }}
            onMouseEnter={onEnter} onMouseLeave={onLeave}>

            <div className="scan-line" />

            {/* BG image */}
            {card.img && <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{ backgroundImage:`url(${card.img})`, opacity: hov ? 0.13 : 0.05 }} />}

            {/* Video */}
            {card.video && <video ref={vRef} muted playsInline preload="auto" src={card.video}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: hov ? 0.28 : 0 }} />}

            {/* Glow blob */}
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none transition-opacity duration-500"
              style={{ background:`radial-gradient(circle, ${card.accent}28, transparent 70%)`, opacity: hov ? 1 : 0.35 }} />

            {/* Corner brackets */}
            <svg className="absolute top-0 right-0 w-12 h-12 transition-opacity duration-300" style={{ opacity: hov ? 1 : 0.2 }}>
              <line x1="100%" y1="0" x2="60%" y2="0" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="100%" y1="0" x2="100%" y2="40%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-12 h-12 transition-opacity duration-300" style={{ opacity: hov ? 1 : 0.2 }}>
              <line x1="0" y1="100%" x2="40%" y2="100%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="100%" x2="0" y2="60%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            {/* Case image — replaces emoji */}
            <motion.img
              src={card.caseImg}
              alt={card.name}
              className="absolute select-none pointer-events-none"
              style={{ width: 120, right: 12, top: '50%', marginTop: -56, filter:`drop-shadow(0 8px 32px ${card.accent}60)` }}
              animate={{ scale: hov ? 1.12 : 1, y: hov ? -8 : 0, rotate: hov ? 4 : 0 }}
              transition={{ type:'spring', stiffness:240, damping:18 }}
            />

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6"
              style={{ background:'linear-gradient(to top, rgba(5,8,16,.94) 0%, transparent 100%)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ background:`${card.accent}18`, color:card.accent, border:`1px solid ${card.accent}35` }}>
                <span className="dot-pulse w-1.5 h-1.5 rounded-full" style={{ background:card.accent }} />
                {card.name}
              </div>
              <p className="text-[#4a6878] text-xs font-light leading-relaxed">{card.desc}</p>
              <motion.div animate={{ opacity: hov?1:0, x: hov?0:-8 }} transition={{ duration:0.22 }}
                className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color:card.accent }}>
                Enter now <ChevronRight className="w-3 h-3" />
              </motion.div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Small Game Card ──────────────────────────────────────────────────────────
function SmallCard({ card, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:0.22+index*0.08, duration:0.6, ease:[0.22,1,0.36,1] }}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`relative overflow-hidden glass stripe ${card.shape} ${card.bc} ${card.hc} card-t cursor-pointer`}
            style={{ height:152, background:`radial-gradient(ellipse at 80% 15%, ${card.accent}13, transparent 60%), rgba(10,14,24,0.82)` }}
            onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>

            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none transition-opacity duration-500"
              style={{ background:`radial-gradient(circle, ${card.accent}22, transparent 70%)`, opacity: hov?1:0.45 }} />

            {/* Case image — replaces emoji */}
            <motion.img
              src={card.caseImg}
              alt={card.name}
              className="absolute select-none pointer-events-none"
              style={{ width: 80, right: 6, top: 8, filter:`drop-shadow(0 4px 18px ${card.accent}50)` }}
              animate={{ scale: hov?1.18:1, y: hov?-4:0 }}
              transition={{ type:'spring', stiffness:300, damping:20 }}
            />

            <div className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background:'linear-gradient(to top, rgba(5,8,16,.9) 0%, transparent 100%)' }}>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-1"
                style={{ background:`${card.accent}18`, color:card.accent, border:`1px solid ${card.accent}30` }}>
                {card.name}
              </div>
              <p className="text-[#3a5060] text-[10px] leading-snug">{card.desc}</p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4)
      .then(setFeaturedCases).catch(() => setFeaturedCases([]));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border border-[#10b981]/20" />
          <div className="absolute inset-0 rounded-full border-t border-[#10b981] animate-spin" />
          <div className="absolute inset-1 rounded-full border-b border-[#f43f5e] animate-spin"
            style={{ animationDuration:'.75s', animationDirection:'reverse' }} />
        </div>
      </div>
    );
  }

  const largeCards = CARDS.filter(c => c.size === 'large');
  const smallCards = CARDS.filter(c => c.size === 'small');

  return (
    <div className="lv-root space-y-10 pb-14">
      <style>{CSS}</style>

      {/* ── Hero ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, y:18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.85, ease:[0.22,1,0.36,1] }}
        className="relative overflow-hidden r-pill"
        style={{
          background:'linear-gradient(145deg, #0b1220 0%, #0e1830 55%, #07090e 100%)',
          minHeight: 320,
          boxShadow:'0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.55)',
        }}
      >
        <HeroMesh />

        {/* Floating case elevator — right half */}
        <CaseElevator />

        {/* Soft right-side fade so cases blend into background */}
        <div className="absolute inset-y-0 right-0 w-2/3 pointer-events-none"
          style={{ background:'linear-gradient(to left, transparent 0%, transparent 40%, rgba(7,9,14,0.0) 100%)' }} />

        {/* Text — left side, z above cases */}
        <div className="relative z-10 p-8 md:p-14 max-w-lg">
          <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
            className="flex items-center gap-2.5 mb-6">
            <Sparkles className="w-3.5 h-3.5" style={{ color:'#10b981' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color:'#10b981' }}>Lootverse</span>
            <span className="w-1 h-1 rounded-full bg-[#10b981] dot-pulse" />
            <span className="text-[10px] font-medium" style={{ color:'#1f4a35' }}>Live Now</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.28, duration:0.8 }}
            className="lv-head font-black text-white leading-none mb-5"
            style={{ fontSize:'clamp(44px,6vw,72px)', letterSpacing:'-0.03em' }}>
            OPEN CASES.<br />
            <span className="hero-title-accent">WIN BIG.</span><br />
            <span style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.62em', fontWeight:700 }}>EVERY TIME.</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.46 }}
            className="text-sm mb-8 max-w-xs leading-relaxed font-light italic"
            style={{ color:'#3a5568' }}>
            Premium loot. Real battles. Every unbox is a chance to change the game.
          </motion.p>

          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.56 }}
            className="flex gap-3 flex-wrap">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white r-soft"
                style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 0 36px rgba(16,185,129,.28), 0 4px 18px rgba(0,0,0,.35)' }}>
                <Trophy className="w-4 h-4" /> Leaderboard
              </motion.button>
            </Link>
            <Link to={createPageUrl('Cases')}>
              <motion.button whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold r-soft"
                style={{ background:'rgba(16,185,129,0.08)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)', backdropFilter:'blur(16px)' }}>
                Open Cases <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom fade out */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background:'linear-gradient(to top, rgba(7,9,14,0.6), transparent)' }} />
      </motion.div>

      {/* ── Game Modes ───────────────────────────── */}
      <div>
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}
          className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-6 rounded-full" style={{ background:'linear-gradient(to bottom,#10b981,#38bdf8)' }} />
            <Zap className="w-4 h-4" style={{ color:'#f59e0b' }} />
            <h2 className="lv-head text-sm font-bold text-white uppercase tracking-widest">Game Modes</h2>
          </div>
          <div className="flex-1 h-px" style={{ background:'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {largeCards.map((card,i) => <LargeCard key={card.name} card={card} index={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {smallCards.map((card,i) => <SmallCard key={card.name} card={card} index={i} />)}
        </div>
      </div>

      {/* ── Featured Cases ───────────────────────── */}
      {featuredCases.length > 0 && (
        <div>
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-0.5 h-6 rounded-full" style={{ background:'linear-gradient(to bottom,#f43f5e,#8b5cf6)' }} />
              <Star className="w-4 h-4" style={{ color:'#f59e0b' }} />
              <h2 className="lv-head text-sm font-bold text-white uppercase tracking-widest">Featured Cases</h2>
            </div>
            <Link to={createPageUrl('Cases')}>
              <motion.span whileHover={{ x:3 }} className="flex items-center gap-1 text-xs font-medium" style={{ color:'#2a3f50' }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </motion.span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c,i) => (
              <motion.div key={c.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.5+i*0.09 }}>
                <TiltCard>
                  <Link to={createPageUrl('CaseOpen')+`?id=${c.id}`}>
                    <div className="relative overflow-hidden glass stripe r-a b-sk h-sk card-t cursor-pointer p-5 text-center"
                      style={{ background:'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,.09), transparent 65%), rgba(10,14,24,.82)' }}>
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                        style={{ background:'linear-gradient(135deg,rgba(56,189,248,.13),rgba(139,92,246,.09))', border:'1px solid rgba(56,189,248,.18)', boxShadow:'0 4px 20px rgba(56,189,248,.09)' }}>
                        <Box className="w-7 h-7" style={{ color:'#38bdf8' }} />
                      </div>
                      <h3 className="text-xs font-semibold text-white mb-1 truncate">{c.name}</h3>
                      <p className="text-[11px] font-bold" style={{ color:'#f43f5e' }}>{c.price?.toLocaleString()} coins</p>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}