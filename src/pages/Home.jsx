import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Box, Swords, TrendingUp, Zap, Gift, ChevronRight, Trophy, Star, Sparkles } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   PALETTE: Deep midnight base + jewel-tone accents
   emerald #10b981 · rose #f43f5e · amber #f59e0b
   sky #38bdf8 · violet #8b5cf6
   Feel: fluid, glassy, organic — soft on eyes, rich depth
───────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .lv-root { font-family: 'DM Sans', sans-serif; }
  .lv-head  { font-family: 'Syne', sans-serif; }

  @keyframes drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(28px,-18px) scale(1.07); }
    66%      { transform: translate(-18px,14px) scale(0.96); }
  }
  @keyframes driftB {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-22px,18px) scale(1.05); }
    70%     { transform: translate(18px,-12px) scale(0.98); }
  }
  .orb-a { animation: drift  14s ease-in-out infinite; }
  .orb-b { animation: driftB 18s ease-in-out infinite; }
  .orb-c { animation: drift  22s ease-in-out infinite reverse; }

  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  .shimmer {
    background: linear-gradient(90deg,#f59e0b,#f43f5e,#8b5cf6,#38bdf8,#10b981,#f59e0b);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 6s linear infinite;
  }

  @keyframes float-slow {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  .float-slow { animation: float-slow 7s ease-in-out infinite; }

  @keyframes scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(1200%); opacity: 0; }
  }
  .scan-line {
    position: absolute; left: 0; width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.35), transparent);
    animation: scan 6s ease-in-out infinite;
    pointer-events: none; z-index: 10;
  }

  @keyframes glow-pulse {
    0%,100% { opacity: .45; }
    50%      { opacity: 1; }
  }
  .dot-pulse { animation: glow-pulse 2s ease-in-out infinite; }

  /* Glass surface */
  .glass {
    background: rgba(11,15,26,0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  /* Organic (non-blocky) radius variants */
  .r-organic-a { border-radius: 28px 10px 28px 10px; }
  .r-organic-b { border-radius: 10px 28px 10px 28px; }
  .r-pill      { border-radius: 32px; }
  .r-soft      { border-radius: 20px; }

  /* Diagonal stripe texture — subtle */
  .stripe {
    background-image: repeating-linear-gradient(
      -55deg, transparent, transparent 22px,
      rgba(255,255,255,0.013) 22px, rgba(255,255,255,0.013) 23px
    );
  }

  /* Smooth card transitions */
  .card-t { transition: all 0.4s cubic-bezier(0.34,1.46,0.64,1); }

  /* Per-accent hover shadows */
  .h-emerald:hover { box-shadow: 0 0 0 1px rgba(16,185,129,.5), 0 24px 64px rgba(16,185,129,.14); transform: translateY(-4px); }
  .h-rose:hover    { box-shadow: 0 0 0 1px rgba(244,63,94,.5),  0 24px 64px rgba(244,63,94,.14);  transform: translateY(-4px); }
  .h-amber:hover   { box-shadow: 0 0 0 1px rgba(245,158,11,.5), 0 24px 64px rgba(245,158,11,.14); transform: translateY(-4px); }
  .h-sky:hover     { box-shadow: 0 0 0 1px rgba(56,189,248,.5), 0 24px 64px rgba(56,189,248,.14); transform: translateY(-4px); }
  .h-violet:hover  { box-shadow: 0 0 0 1px rgba(139,92,246,.5), 0 24px 64px rgba(139,92,246,.14); transform: translateY(-4px); }

  .b-emerald { box-shadow: 0 0 0 1px rgba(16,185,129,.2),  0 8px 32px rgba(16,185,129,.07); }
  .b-rose    { box-shadow: 0 0 0 1px rgba(244,63,94,.2),   0 8px 32px rgba(244,63,94,.07); }
  .b-amber   { box-shadow: 0 0 0 1px rgba(245,158,11,.2),  0 8px 32px rgba(245,158,11,.07); }
  .b-sky     { box-shadow: 0 0 0 1px rgba(56,189,248,.2),  0 8px 32px rgba(56,189,248,.07); }
  .b-violet  { box-shadow: 0 0 0 1px rgba(139,92,246,.2),  0 8px 32px rgba(139,92,246,.07); }
`;

// ─── Tilt Card ────────────────────────────────────────────────────────────────
function TiltCard({ children }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rotateX: -y * 9, rotateY: x * 9 });
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      style={{ transformStyle: 'preserve-3d', perspective: 900 }}>
      {children}
    </motion.div>
  );
}

// ─── Game Data ────────────────────────────────────────────────────────────────
const CARDS = [
  {
    name: 'Battles', desc: 'PvP case battles — highest value wins', page: 'Battles', size: 'large',
    accent: '#10b981', bc: 'b-emerald', hc: 'h-emerald', shape: 'r-organic-a',
    emoji: '⚔️',
    mesh: 'radial-gradient(ellipse at 75% 20%, rgba(16,185,129,.16) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(56,189,248,.09) 0%, transparent 50%)',
    img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80',
    video: '/assets/battles-DoAezb8E.mp4',
  },
  {
    name: 'Cases', desc: 'Unbox premium items and discover rare loot', page: 'Cases', size: 'large',
    accent: '#f43f5e', bc: 'b-rose', hc: 'h-rose', shape: 'r-organic-b',
    emoji: '📦',
    mesh: 'radial-gradient(ellipse at 20% 20%, rgba(244,63,94,.16) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(245,158,11,.09) 0%, transparent 50%)',
    img: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&q=80',
  },
  { name: 'Coinflip', desc: '1v1 winner takes all',       page: 'Coinflip', size: 'small', accent: '#f59e0b', bc: 'b-amber',  hc: 'h-amber',  shape: 'r-organic-a', emoji: '🪙' },
  { name: 'Upgrade',  desc: 'Risk items for better loot', page: 'Upgrade',  size: 'small', accent: '#38bdf8', bc: 'b-sky',    hc: 'h-sky',    shape: 'r-organic-b', emoji: '⬆️' },
  { name: 'Crash',    desc: 'Cash out before it crashes', page: 'Crash',    size: 'small', accent: '#8b5cf6', bc: 'b-violet', hc: 'h-violet', shape: 'r-organic-a', emoji: '📈' },
];

// ─── Large Card ───────────────────────────────────────────────────────────────
function LargeCard({ card, index }) {
  const [hov, setHov] = useState(false);
  const vRef = useRef(null);
  const onEnter = () => { setHov(true);  if (vRef.current) { vRef.current.currentTime = 0; vRef.current.play().catch(() => {}); } };
  const onLeave = () => { setHov(false); if (vRef.current) { vRef.current.pause(); vRef.current.currentTime = 0; } };

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.22,1,0.36,1] }}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`relative overflow-hidden glass stripe ${card.shape} ${card.bc} ${card.hc} card-t cursor-pointer`}
            style={{ height: 234, background: `${card.mesh}, rgba(11,15,26,0.82)` }}
            onMouseEnter={onEnter} onMouseLeave={onLeave}>

            <div className="scan-line" />

            {/* BG image */}
            {card.img && <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{ backgroundImage: `url(${card.img})`, opacity: hov ? 0.14 : 0.06 }} />}

            {/* Video */}
            {card.video && <video ref={vRef} muted playsInline preload="auto" src={card.video}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: hov ? 0.28 : 0 }} />}

            {/* Glow blob */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${card.accent}28, transparent 70%)`, opacity: hov ? 1 : 0.4 }} />

            {/* Corner brackets */}
            <svg className="absolute top-0 right-0 w-12 h-12 transition-opacity duration-300" style={{ opacity: hov ? 1 : 0.2 }}>
              <line x1="100%" y1="0" x2="60%" y2="0" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="100%" y1="0" x2="100%" y2="40%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-12 h-12 transition-opacity duration-300" style={{ opacity: hov ? 1 : 0.2 }}>
              <line x1="0" y1="100%" x2="40%" y2="100%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="100%" x2="0" y2="60%" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            {/* Emoji */}
            <motion.div className="absolute top-6 right-6 text-[64px] select-none leading-none"
              animate={{ scale: hov ? 1.18 : 1, y: hov ? -5 : 0, rotate: hov ? 8 : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={{ filter: `drop-shadow(0 6px 28px ${card.accent}80)` }}>
              {card.emoji}
            </motion.div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6"
              style={{ background: 'linear-gradient(to top, rgba(6,9,18,.92) 0%, transparent 100%)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ background: `${card.accent}18`, color: card.accent, border: `1px solid ${card.accent}35` }}>
                <span className="dot-pulse w-1.5 h-1.5 rounded-full" style={{ background: card.accent }} />
                {card.name}
              </div>
              <p className="text-[#5a7890] text-xs font-light leading-relaxed">{card.desc}</p>
              <motion.div animate={{ opacity: hov ? 1 : 0, x: hov ? 0 : -8 }} transition={{ duration: 0.22 }}
                className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: card.accent }}>
                Enter now <ChevronRight className="w-3 h-3" />
              </motion.div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Small Card ───────────────────────────────────────────────────────────────
function SmallCard({ card, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 + index * 0.08, duration: 0.6, ease: [0.22,1,0.36,1] }}>
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div className={`relative overflow-hidden glass stripe ${card.shape} ${card.bc} ${card.hc} card-t cursor-pointer`}
            style={{ height: 150, background: `radial-gradient(ellipse at 80% 15%, ${card.accent}14, transparent 60%), rgba(11,15,26,0.82)` }}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>

            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${card.accent}22, transparent 70%)`, opacity: hov ? 1 : 0.5 }} />

            <motion.div className="absolute top-4 right-4 text-4xl select-none leading-none"
              animate={{ scale: hov ? 1.22 : 1, y: hov ? -4 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ filter: `drop-shadow(0 3px 18px ${card.accent}70)` }}>
              {card.emoji}
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: 'linear-gradient(to top, rgba(6,9,18,.88) 0%, transparent 100%)' }}>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-1"
                style={{ background: `${card.accent}18`, color: card.accent, border: `1px solid ${card.accent}30` }}>
                {card.name}
              </div>
              <p className="text-[#445566] text-[10px] leading-snug">{card.desc}</p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Hero Mesh Background ─────────────────────────────────────────────────────
function HeroMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb-a absolute -top-24 -left-16 w-[440px] h-[440px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.11) 0%, transparent 70%)' }} />
      <div className="orb-b absolute top-0 right-0 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,.09) 0%, transparent 70%)' }} />
      <div className="orb-c absolute -bottom-8 left-1/3 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,.07) 0%, transparent 70%)' }} />
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />
      {/* Subtle diagonal lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,.012) 40px, rgba(255,255,255,.012) 41px)',
      }} />
    </div>
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
            style={{ animationDuration: '.75s', animationDirection: 'reverse' }} />
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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22,1,0.36,1] }}
        className="relative overflow-hidden r-pill"
        style={{
          background: 'linear-gradient(145deg, #0c1220 0%, #0f1830 55%, #08090f 100%)',
          minHeight: 290,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.5)',
        }}
      >
        <HeroMesh />

        {/* Floating icon cluster — right side */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 float-slow">
          {[
            { Icon: Swords,      c: '#10b981', bg: 'rgba(16,185,129,.1)',  s: 76, ml: 0 },
            { Icon: Box,         c: '#f43f5e', bg: 'rgba(244,63,94,.1)',   s: 54, ml: 28 },
            { Icon: TrendingUp,  c: '#8b5cf6', bg: 'rgba(139,92,246,.1)', s: 62, ml: 8 },
          ].map(({ Icon, c, bg, s, ml }, i) => (
            <div key={i} className="flex items-center justify-center r-soft"
              style={{
                width: s, height: s, background: bg,
                border: `1px solid ${c}22`,
                boxShadow: `0 0 36px ${c}18`,
                backdropFilter: 'blur(16px)',
                marginLeft: ml,
              }}>
              <Icon style={{ width: s * 0.4, height: s * 0.4, color: c }} />
            </div>
          ))}
        </div>

        {/* Text block */}
        <div className="relative z-10 p-8 md:p-14 max-w-xl">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2.5 mb-5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#10b981' }}>Lootverse</span>
            <span className="w-1 h-1 rounded-full bg-[#10b981] dot-pulse" />
            <span className="text-[10px] font-medium" style={{ color: '#2a5a3a' }}>Live Now</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.75 }}
            className="lv-head text-5xl md:text-[68px] font-black text-white leading-none mb-4"
            style={{ letterSpacing: '-0.03em' }}>
            OPEN.<br />
            <span className="shimmer">WIN EVERYTHING.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
            className="text-[#4a6070] text-sm mb-8 max-w-xs leading-relaxed font-light italic">
            Premium loot. Real battles. Every unbox is a chance to change the game.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
            className="flex gap-3 flex-wrap">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white r-soft"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 36px rgba(16,185,129,.28), 0 4px 18px rgba(0,0,0,.3)' }}>
                <Trophy className="w-4 h-4" /> Leaderboard
              </motion.button>
            </Link>
            <Link to={createPageUrl('Rewards')}>
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-medium r-soft"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#6a8a9a', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
                <Gift className="w-4 h-4" /> Free Rewards
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Game Modes ───────────────────────────── */}
      <div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom,#10b981,#38bdf8)' }} />
            <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h2 className="lv-head text-sm font-bold text-white uppercase tracking-widest">Game Modes</h2>
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {largeCards.map((card, i) => <LargeCard key={card.name} card={card} index={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {smallCards.map((card, i) => <SmallCard key={card.name} card={card} index={i} />)}
        </div>
      </div>

      {/* ── Featured Cases ───────────────────────── */}
      {featuredCases.length > 0 && (
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-0.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom,#f43f5e,#8b5cf6)' }} />
              <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <h2 className="lv-head text-sm font-bold text-white uppercase tracking-widest">Featured Cases</h2>
            </div>
            <Link to={createPageUrl('Cases')}>
              <motion.span whileHover={{ x: 3 }} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#334455' }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </motion.span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.09 }}>
                <TiltCard>
                  <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                    <div className="relative overflow-hidden glass stripe r-organic-a b-sky h-sky card-t cursor-pointer p-5 text-center"
                      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,.1), transparent 65%), rgba(11,15,26,.82)' }}>
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,.13),rgba(139,92,246,.09))', border: '1px solid rgba(56,189,248,.18)', boxShadow: '0 4px 22px rgba(56,189,248,.09)' }}>
                        <Box className="w-7 h-7" style={{ color: '#38bdf8' }} />
                      </div>
                      <h3 className="text-xs font-semibold text-white mb-1 truncate">{c.name}</h3>
                      <p className="text-[11px] font-bold" style={{ color: '#f43f5e' }}>{c.price?.toLocaleString()} coins</p>
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