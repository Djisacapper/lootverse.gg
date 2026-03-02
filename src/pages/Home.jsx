import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Box, Swords, Coins, TrendingUp, Zap, Gift, Award, ChevronRight, Trophy, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Particle Canvas Background ───────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '0,217,255' : '255,0,110',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,217,255,${0.06 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" />;
}

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rotateX: -y * 14, rotateY: x * 14 });
  };

  const handleLeave = () => setTilt({ rotateX: 0, rotateY: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Glitch Text ──────────────────────────────────────────────────────────────
function GlitchText({ text, className = '' }) {
  return (
    <span className={`relative inline-block ${className}`} style={{ fontFamily: '"Bebas Neue", "Black Han Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .glitch { position: relative; }
        .glitch::before, .glitch::after {
          content: attr(data-text);
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: transparent;
        }
        .glitch::before {
          left: 2px; text-shadow: -2px 0 #ff006e;
          animation: glitch1 3s infinite linear alternate-reverse;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        }
        .glitch::after {
          left: -2px; text-shadow: -2px 0 #00d9ff;
          animation: glitch2 2s infinite linear alternate-reverse;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
        }
        @keyframes glitch1 {
          0%,100% { transform: translate(0); opacity: 0; }
          20%,40% { transform: translate(-2px, 1px); opacity: 1; }
          60%,80% { transform: translate(2px, -1px); opacity: 1; }
        }
        @keyframes glitch2 {
          0%,100% { transform: translate(0); opacity: 0; }
          30%,50% { transform: translate(2px, -1px); opacity: 1; }
          70%,90% { transform: translate(-2px, 1px); opacity: 1; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(0,217,255,0.2); box-shadow: 0 0 0 rgba(0,217,255,0); }
          50% { border-color: rgba(0,217,255,0.6); box-shadow: 0 0 30px rgba(0,217,255,0.15); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(-4px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #00d9ff, #ff006e, #9d4edd, #00d9ff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .card-pulse { animation: borderPulse 2s ease-in-out infinite; }
        .float-anim { animation: float 6s ease-in-out infinite; }
        .game-card-large:hover .card-video { opacity: 1; }
        .game-card-large:hover .card-overlay { opacity: 0.4; }
        .scanline {
          position: absolute; width: 100%; height: 2px;
          background: linear-gradient(transparent, rgba(0,217,255,0.15), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }
      `}</style>
      <span data-text={text} className="glitch">{text}</span>
    </span>
  );
}

// ─── Large Game Card ──────────────────────────────────────────────────────────
function LargeGameCard({ card, index }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const handleEnter = () => {
    setHovered(true);
    if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); }
  };
  const handleLeave = () => {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div
            className="game-card-large relative overflow-hidden rounded-2xl cursor-pointer"
            style={{
              height: 220,
              border: `1px solid ${card.accent}30`,
              background: `linear-gradient(135deg, ${card.accent}18 0%, #0d0d1a 60%, #060610 100%)`,
              transition: 'border-color 0.3s, box-shadow 0.3s',
              boxShadow: hovered ? `0 0 60px ${card.accent}25, 0 20px 60px rgba(0,0,0,0.5)` : '0 4px 30px rgba(0,0,0,0.4)',
              borderColor: hovered ? `${card.accent}60` : `${card.accent}25`,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            {/* Scanline */}
            <div className="scanline" />

            {/* Background image */}
            {card.img && (
              <div
                className="card-overlay absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                style={{ backgroundImage: `url(${card.img})`, opacity: 0.12 }}
              />
            )}

            {/* Video */}
            {card.video && (
              <video
                ref={videoRef}
                className="card-video absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-opacity duration-500"
                muted playsInline preload="auto"
                src={card.video}
                style={{ opacity: hovered ? 0.35 : 0 }}
              />
            )}

            {/* Top-right corner decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20" style={{
              background: `radial-gradient(circle at 100% 0%, ${card.accent}, transparent 70%)`
            }} />

            {/* Animated corner lines */}
            <svg className="absolute top-0 right-0 w-16 h-16" style={{ opacity: hovered ? 0.8 : 0.3, transition: 'opacity 0.3s' }}>
              <line x1="100%" y1="0" x2="70%" y2="0" stroke={card.accent} strokeWidth="1" />
              <line x1="100%" y1="0" x2="100%" y2="30%" stroke={card.accent} strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-16 h-16" style={{ opacity: hovered ? 0.8 : 0.3, transition: 'opacity 0.3s' }}>
              <line x1="0" y1="100%" x2="30%" y2="100%" stroke={card.accent} strokeWidth="1" />
              <line x1="0" y1="100%" x2="0" y2="70%" stroke={card.accent} strokeWidth="1" />
            </svg>

            {/* Emoji / Icon */}
            <motion.div
              className="absolute top-5 right-6 text-7xl select-none"
              animate={{ scale: hovered ? 1.2 : 1, rotate: hovered ? 5 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ filter: `drop-shadow(0 0 20px ${card.accent}80)` }}
            >
              {card.emoji}
            </motion.div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Tag */}
              <div
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest mb-3"
                style={{
                  backgroundColor: `${card.accent}20`,
                  color: card.accent,
                  border: `1px solid ${card.accent}40`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: card.accent }} />
                {card.name}
              </div>
              <p className="text-[#8899aa] text-sm font-medium">{card.desc}</p>

              {/* Hover CTA */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
                transition={{ duration: 0.2 }}
                className="mt-3 flex items-center gap-2 text-xs font-semibold"
                style={{ color: card.accent }}
              >
                Play Now <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Small Game Card ──────────────────────────────────────────────────────────
function SmallGameCard({ card, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard>
        <Link to={createPageUrl(card.page)}>
          <div
            className="relative overflow-hidden rounded-xl cursor-pointer"
            style={{
              height: 140,
              border: `1px solid ${card.accent}25`,
              background: `linear-gradient(135deg, ${card.accent}15 0%, #0d0d1a 70%)`,
              transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
              boxShadow: hovered ? `0 0 40px ${card.accent}20, 0 10px 40px rgba(0,0,0,0.4)` : '0 4px 20px rgba(0,0,0,0.3)',
              borderColor: hovered ? `${card.accent}50` : `${card.accent}20`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300"
              style={{ opacity: hovered ? 1 : 0, background: `radial-gradient(circle at 50% 50%, ${card.accent}10, transparent 70%)` }}
            />
            <div className="absolute top-0 right-0 w-20 h-20"
              style={{ background: `radial-gradient(circle at 100% 0%, ${card.accent}30, transparent 70%)` }}
            />

            <motion.div
              className="absolute top-3 right-3 text-4xl select-none"
              animate={{ scale: hovered ? 1.25 : 1, y: hovered ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ filter: `drop-shadow(0 0 12px ${card.accent}60)` }}
            >
              {card.emoji}
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider mb-1.5"
                style={{ backgroundColor: `${card.accent}25`, color: card.accent, border: `1px solid ${card.accent}30` }}
              >
                {card.name}
              </div>
              <p className="text-[#667788] text-[10px] leading-tight">{card.desc}</p>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Active Players', value: '12,847', icon: Flame, color: '#ff006e' },
  { label: 'Cases Opened Today', value: '94,203', icon: Box, color: '#00d9ff' },
  { label: 'Total Paid Out', value: '$4.2M', icon: Coins, color: '#ffd700' },
  { label: 'Live Battles', value: '341', icon: Swords, color: '#9d4edd' },
];

// ─── Game Data ────────────────────────────────────────────────────────────────
const GAME_CARDS = [
  {
    name: 'Battles', desc: 'PvP case battles — highest value wins', page: 'Battles', size: 'large',
    accent: '#00d9ff', emoji: '⚔️',
    img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80',
    video: '/assets/battles-DoAezb8E.mp4',
  },
  {
    name: 'Cases', desc: 'Unbox premium items', page: 'Cases', size: 'large',
    accent: '#ff006e', emoji: '📦',
    img: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&q=80',
  },
  { name: 'Coinflip', desc: '1v1 winner takes all', page: 'Coinflip', size: 'small', accent: '#9d4edd', emoji: '🪙' },
  { name: 'Upgrade', desc: 'Risk items for better loot', page: 'Upgrade', size: 'small', accent: '#00d9ff', emoji: '⬆️' },
  { name: 'Crash', desc: 'Cash out before it crashes', page: 'Crash', size: 'small', accent: '#ff006e', emoji: '📈' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4).then(setFeaturedCases);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-[#00d9ff]/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-[#00d9ff] animate-spin" />
          <div className="absolute inset-2 rounded-full border-b-2 border-[#ff006e] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
    );
  }

  const largeCards = GAME_CARDS.filter(g => g.size === 'large');
  const smallCards = GAME_CARDS.filter(g => g.size === 'small');

  return (
    <div className="space-y-8" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl card-pulse"
        style={{
          background: 'linear-gradient(135deg, #0d0d1f 0%, #141428 40%, #0a0a18 100%)',
          minHeight: 260,
          border: '1px solid rgba(0,217,255,0.15)',
        }}
      >
        <ParticleField />

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,217,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Left glow streak */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-24 rounded-full"
          style={{ background: 'linear-gradient(to bottom, transparent, #00d9ff, transparent)' }}
        />

        {/* Floating orbs */}
        <div className="absolute right-16 top-8 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.08) 0%, transparent 70%)' }}
        />
        <div className="absolute right-32 bottom-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,0,110,0.06) 0%, transparent 70%)' }}
        />

        {/* Floating icons art */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 float-anim">
          {[
            { Icon: Swords, color: '#00d9ff', bg: 'rgba(0,217,255,0.1)', size: 80, shadow: '0 0 30px rgba(0,217,255,0.3)', delay: 0 },
            { Icon: Box, color: '#ff006e', bg: 'rgba(255,0,110,0.1)', size: 56, shadow: '0 0 20px rgba(255,0,110,0.3)', delay: '-1s' },
            { Icon: TrendingUp, color: '#9d4edd', bg: 'rgba(157,78,221,0.1)', size: 64, shadow: '0 0 24px rgba(157,78,221,0.3)', delay: '-2s' },
          ].map(({ Icon, color, bg, size, shadow, delay }, i) => (
            <div key={i} className="flex items-center justify-center rounded-2xl"
              style={{
                width: size, height: size,
                background: bg,
                border: `1px solid ${color}30`,
                boxShadow: shadow,
                backdropFilter: 'blur(10px)',
                animation: `float 6s ease-in-out infinite`,
                animationDelay: delay,
                marginTop: i === 1 ? -20 : i === 2 ? 16 : 0,
              }}
            >
              <Icon style={{ width: size * 0.4, height: size * 0.4, color }} />
            </div>
          ))}
        </div>

        {/* Hero text */}
        <div className="relative z-10 p-8 md:p-12 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" />
            <span className="text-[#00d9ff] text-[11px] font-bold uppercase tracking-[0.2em]">Lootverse Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white leading-none mb-3" style={{ letterSpacing: '-0.02em' }}>
            OPEN.<br />
            <span className="shimmer-text">WIN BIG.</span><br />
            <span style={{ color: '#ffffff99', fontSize: '0.7em' }}>REPEAT.</span>
          </h1>

          <p className="text-[#667799] text-sm mb-8 max-w-sm leading-relaxed">
            The ultimate loot platform. Open cases, crush battles, and flip your way to the top of the leaderboard.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-black"
                style={{
                  background: 'linear-gradient(135deg, #00d9ff, #0099bb)',
                  boxShadow: '0 0 30px rgba(0,217,255,0.35), 0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Trophy className="w-4 h-4" /> Leaderboard
              </motion.button>
            </Link>
            <Link to={createPageUrl('Rewards')}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-[#00d9ff]"
                style={{
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Gift className="w-4 h-4" /> Free Rewards
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Live Stats ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: 'linear-gradient(135deg, #0f0f1e, #0a0a16)',
              border: `1px solid ${stat.color}20`,
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full"
              style={{ background: `radial-gradient(circle at 100% 0%, ${stat.color}15, transparent 70%)` }}
            />
            <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
            <div className="text-xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>{stat.value}</div>
            <div className="text-[10px] text-[#556677] font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Games Section ────────────────────────────── */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-[#00d9ff] to-[#ff006e]" />
            <Zap className="w-4 h-4 text-[#ff006e]" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">Game Modes</h2>
          </div>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(0,217,255,0.2), transparent)' }} />
          <span className="text-[10px] text-[#334455] font-mono uppercase tracking-widest">LIVE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
        </motion.div>

        {/* Large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {largeCards.map((card, i) => <LargeGameCard key={card.name} card={card} index={i} />)}
        </div>

        {/* Small cards */}
        <div className="grid grid-cols-3 gap-4">
          {smallCards.map((card, i) => <SmallGameCard key={card.name} card={card} index={i} />)}
        </div>
      </div>

      {/* ── Featured Cases ───────────────────────────── */}
      {featuredCases.length > 0 && (
        <div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mb-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-[#ff006e] to-[#9d4edd]" />
              <Star className="w-4 h-4 text-[#ffd700]" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">Featured Cases</h2>
            </div>
            <Link to={createPageUrl('Cases')}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-1 text-xs font-semibold text-[#00d9ff] hover:text-[#ff006e] transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <TiltCard>
                  <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                    <div className="relative overflow-hidden rounded-xl p-5 text-center cursor-pointer group"
                      style={{
                        background: 'linear-gradient(135deg, #0f0f20, #0a0a18)',
                        border: '1px solid rgba(0,217,255,0.12)',
                        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(135deg, rgba(0,217,255,0.06), rgba(255,0,110,0.04))' }}
                      />
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,217,255,0.12), rgba(255,0,110,0.08))',
                          border: '1px solid rgba(0,217,255,0.2)',
                        }}
                      >
                        <Box className="w-8 h-8 text-[#00d9ff]" />
                      </div>
                      <h3 className="text-xs font-bold text-white mb-1 truncate">{c.name}</h3>
                      <p className="text-xs font-black text-[#ff006e]">{c.price?.toLocaleString()} coins</p>
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
