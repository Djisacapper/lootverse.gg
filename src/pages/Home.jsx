import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Trophy, Swords, Box, RotateCcw, Zap, ArrowUpRight } from 'lucide-react';

const vtechImg    = 'https://i.imgur.com/doYHRMp.png';
const roseImg     = 'https://i.imgur.com/WVoUpzN.png';
const irishImg    = 'https://i.imgur.com/7KIsUqY.png';
const battlesImg  = 'https://i.imgur.com/vHp8zbU.png';
const casesImg    = 'https://i.imgur.com/WXw330m.png';
const coinflipImg = 'https://i.imgur.com/3AUD8Vu.png';
const crashImg    = 'https://i.imgur.com/53dgn4r.png';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.hv-root {
  font-family: 'DM Sans', sans-serif;
  background: #08000f;
  min-height: 100vh;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}

/* grain overlay — adds tactile texture, kills the "clean AI render" feel */
.hv-root::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.032;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px;
}

.hv-root > * { position: relative; z-index: 1; }

.hv-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 100px;
}

/* ── HERO ── */
.hero {
  position: relative;
  padding: 72px 0 60px;
  overflow: hidden;
}

/* editorial left rule — anchors the text column */
.hero-rule {
  position: absolute;
  left: -1px;
  top: 60px;
  bottom: 60px;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #fbbf24 20%, #a855f7 70%, transparent);
  opacity: 0.7;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(251,191,36,0.65);
  margin-bottom: 22px;
}

.hero-eyebrow-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 8px rgba(251,191,36,0.8);
}

/* big, confident — no animated gradients */
.hero-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(52px, 7.5vw, 88px);
  font-weight: 800;
  line-height: 0.93;
  letter-spacing: -0.035em;
  color: #fff;
}

.hero-h1-accent {
  color: #fbbf24;
  display: block;
}

.hero-sub {
  font-size: 14px;
  font-weight: 300;
  font-style: italic;
  color: rgba(255,255,255,0.32);
  line-height: 1.75;
  max-width: 300px;
  margin: 20px 0 38px;
}

.hero-sub strong {
  font-style: normal;
  font-weight: 500;
  color: rgba(255,255,255,0.55);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-gold {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: #fbbf24;
  color: #0a0008;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
}
.btn-gold:hover { background: #fcd34d; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 20px;
  background: transparent;
  color: rgba(255,255,255,0.38);
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  text-decoration: none;
}
.btn-ghost:hover {
  border-color: rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.62);
}

/* item showcase — layered depth, no floating animation circus */
.hero-items {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-48%);
  display: flex;
  align-items: flex-end;
  pointer-events: none;
}

.hero-item--side2 img {
  width: 95px;
  opacity: 0.28;
  margin-bottom: -14px;
  filter: drop-shadow(0 12px 32px rgba(0,0,0,0.85));
}
.hero-item--side1 img {
  width: 135px;
  opacity: 0.52;
  margin-bottom: -6px;
  filter: drop-shadow(0 16px 44px rgba(0,0,0,0.85));
}
.hero-item--main img {
  width: 230px;
  filter: drop-shadow(0 24px 64px rgba(0,0,0,0.92)) drop-shadow(0 0 48px rgba(168,85,247,0.25));
}

/* ── STATS ── */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid rgba(255,255,255,0.055);
  border-radius: 5px;
  overflow: hidden;
  margin: 52px 0 48px;
  background: rgba(255,255,255,0.012);
}

.stat-cell {
  padding: 20px 26px;
  border-right: 1px solid rgba(255,255,255,0.055);
}
.stat-cell:last-child { border-right: none; }

.stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.025em;
  line-height: 1;
}
.stat-num span { color: #fbbf24; }

.stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.24);
  margin-top: 5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
}

/* ── SECTION HEADER ── */
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.28);
}

/* ── GAME GRID — intentionally asymmetric ── */
.games-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.game-card {
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  text-decoration: none;
  background: #0c0016;
  /* no glow, no box-shadow theater */
}

.game-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.65s cubic-bezier(0.2, 0, 0, 1), filter 0.45s ease;
  filter: grayscale(0.55) brightness(0.4) contrast(1.06);
  will-change: transform;
}
.game-card:hover .game-card__img {
  transform: scale(1.055);
  filter: grayscale(0) brightness(0.58) saturate(1.08);
}

.game-card__fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(3,0,10,0.97) 0%, rgba(3,0,10,0.45) 32%, transparent 58%);
  z-index: 2;
}

/* subtle left accent on hover */
.game-card__accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  z-index: 4;
  transform: scaleY(0);
  transform-origin: bottom center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.game-card:hover .game-card__accent-bar { transform: scaleY(1); }

.game-card__body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding: 18px 18px 16px;
}

.game-card__title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 9px;
}

.game-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  background: rgba(255,255,255,0.05);
  flex-shrink: 0;
}

.game-card__arrow {
  margin-left: auto;
  opacity: 0;
  transform: translate(-3px, 3px);
  transition: opacity 0.18s, transform 0.18s;
}
.game-card:hover .game-card__arrow { opacity: 1; transform: translate(0, 0); }

.game-card__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.game-card__online {
  font-size: 10px;
  color: rgba(255,255,255,0.26);
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 5px;
}

.game-card__online-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
}

.live-tag {
  font-family: 'Syne', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
}

/* card sizing — asymmetric layout */
.gc-battles  { min-height: 420px; grid-row: span 2; }
.gc-cases    { height: 200px; }
.gc-coinflip { height: 200px; }
.gc-crash    { height: 160px; grid-column: span 2; }

/* font size per card size */
.gc-battles .game-card__title  { font-size: 26px; }
.gc-cases .game-card__title,
.gc-coinflip .game-card__title { font-size: 19px; }
.gc-crash .game-card__title    { font-size: 19px; }

/* ── RECENT WINS ── */
.wins-section { margin-top: 52px; }

.wins-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.wins-title {
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.22);
}

.wins-list { display: flex; flex-direction: column; }

.win-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(255,255,255,0.038);
}
.win-row:last-child { border-bottom: none; }

.win-user { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 300; }
.win-user strong { font-weight: 500; color: rgba(255,255,255,0.65); }
.win-item { font-size: 11px; color: rgba(255,255,255,0.22); }
.win-amount {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: -0.01em;
}

/* ── LOADING ── */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.loading-bar-track {
  width: 100px;
  height: 1px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
}
.loading-bar-fill {
  height: 100%;
  background: #fbbf24;
  animation: lf 1.3s cubic-bezier(0.4,0,0.2,1) infinite;
}
@keyframes lf {
  0%   { width: 0; margin-left: 0; }
  50%  { width: 55%; margin-left: 22%; }
  100% { width: 0; margin-left: 100%; }
}
.loading-label {
  font-family: 'Syne', sans-serif;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.15);
  margin-top: 12px;
  text-align: center;
}

/* ── RESPONSIVE ── */
@media (max-width: 680px) {
  .hero-items { display: none; }
  .hero-h1 { font-size: 48px; }
  .games-grid { grid-template-columns: 1fr; }
  .gc-battles  { grid-row: span 1; min-height: 260px; }
  .gc-crash    { grid-column: span 1; }
  .stats-strip { grid-template-columns: repeat(3, 1fr); }
}
`;

const GAMES = [
  {
    id: 'battles',
    name: 'Battles',
    page: 'Battles',
    Icon: Swords,
    img: battlesImg,
    accent: '#c084fc',
    online: '1,204',
    cardClass: 'gc-battles',
    live: false,
  },
  {
    id: 'cases',
    name: 'Cases',
    page: 'Cases',
    Icon: Box,
    img: casesImg,
    accent: '#fbbf24',
    online: '3,841',
    cardClass: 'gc-cases',
    live: false,
  },
  {
    id: 'coinflip',
    name: 'Coinflip',
    page: 'Coinflip',
    Icon: RotateCcw,
    img: coinflipImg,
    accent: '#fbbf24',
    online: '687',
    cardClass: 'gc-coinflip',
    live: false,
  },
  {
    id: 'crash',
    name: 'Crash',
    page: 'Crash',
    Icon: Zap,
    img: crashImg,
    accent: '#a855f7',
    online: '5,122',
    cardClass: 'gc-crash',
    live: true,
  },
];

const WINS = [
  { user: 'phantom_x',  item: 'Dragon Lore FN',    amount: '$1,240.00', game: 'Cases'   },
  { user: 'nox__',      item: 'AK-47 Redline FN',   amount: '$380.00',  game: 'Cases'   },
  { user: 'drift.io',   item: 'Battle Win',          amount: '$220.00',  game: 'Battles' },
  { user: 'kr1spy',     item: 'AWP Asiimov FT',      amount: '$155.00',  game: 'Cases'   },
  { user: 'velox',      item: 'Crash ×4.21',         amount: '$93.00',   game: 'Crash'   },
];

function GameCard({ game, index }) {
  return (
    <motion.div
      className={game.cardClass}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.065, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={createPageUrl(game.page)} className="game-card" style={{ height: '100%' }}>
        <img src={game.img} alt={game.name} className="game-card__img" />
        <div className="game-card__fade" />
        <div className="game-card__accent-bar" style={{ background: game.accent }} />
        <div className="game-card__body">
          <div className="game-card__title">
            <div className="game-card__icon">
              <game.Icon size={13} color={game.accent} />
            </div>
            {game.name}
            {game.live && (
              <span
                className="live-tag"
                style={{ background: `${game.accent}18`, color: game.accent, border: `1px solid ${game.accent}28` }}
              >
                Live
              </span>
            )}
            <ArrowUpRight size={14} className="game-card__arrow" style={{ color: game.accent }} />
          </div>
          <div className="game-card__sub">
            <span className="game-card__online">
              <span className="game-card__online-dot" style={{ background: game.accent, opacity: 0.7 }} />
              {game.online} playing
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();

  if (loading) return (
    <div className="hv-root loading-screen">
      <style>{CSS}</style>
      <div>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
        <div className="loading-label">Loading</div>
      </div>
    </div>
  );

  return (
    <div className="hv-root">
      <style>{CSS}</style>
      <div className="hv-shell">

        {/* ── HERO ── */}
        <div className="hero">
          <div className="hero-rule" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-eyebrow">
              <div className="hero-eyebrow-dot" />
              Amethystgg
            </div>
            <h1 className="hero-h1">
              Win<br />
              <span className="hero-h1-accent">legendary</span><br />
              drops.
            </h1>
            <p className="hero-sub">
              Cases, battles, coinflips — every round is a shot at <strong>something rare.</strong>
            </p>
            <div className="hero-actions">
              <Link to={createPageUrl('Cases')}>
                <motion.div className="btn-gold" whileTap={{ scale: 0.97 }}>
                  Open a Case <ArrowUpRight size={12} />
                </motion.div>
              </Link>
              <Link to={createPageUrl('Leaderboard')}>
                <div className="btn-ghost">
                  <Trophy size={11} /> Leaderboard
                </div>
              </Link>
            </div>
          </motion.div>

          {/* item showcase — stacked depth, no floating/rotating */}
          <div className="hero-items">
            <div className="hero-item--side2"><img src={irishImg} alt="" /></div>
            <div className="hero-item--side1"><img src={vtechImg} alt="" /></div>
            <div className="hero-item--main" ><img src={roseImg}  alt="" /></div>
          </div>
        </div>

        {/* ── STATS ── */}
        <motion.div
          className="stats-strip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.55 }}
        >
          <div className="stat-cell">
            <div className="stat-num">12,<span>041</span></div>
            <div className="stat-label">Online now</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">$<span>2.4M</span></div>
            <div className="stat-label">Won today</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num"><span>340K</span>+</div>
            <div className="stat-label">Total users</div>
          </div>
        </motion.div>

        {/* ── GAMES ── */}
        <div className="section-head">
          <span className="section-title">Games</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>4 modes</span>
        </div>

        <div className="games-grid">
          {GAMES.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
        </div>

        {/* ── RECENT WINS ── */}
        <motion.div
          className="wins-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.55 }}
        >
          <div className="wins-header">
            <span className="wins-title">Recent wins</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', letterSpacing: '0.08em' }}>last hour</span>
          </div>
          <div className="wins-list">
            {WINS.map((w, i) => (
              <div className="win-row" key={i}>
                <div className="win-user"><strong>{w.user}</strong> opened {w.game}</div>
                <div className="win-item">{w.item}</div>
                <div className="win-amount">{w.amount}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}