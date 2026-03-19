import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Swords, X, RotateCcw, Trophy, Zap } from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.cf-root { font-family: 'Nunito', sans-serif; }

/* grain texture */
.cf-root::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.022;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px;
}

/* coin idle bob — kept, it's tasteful */
@keyframes cf-coin-idle {
  0%,100% { transform: translateY(0px) rotateY(0deg); }
  50%     { transform: translateY(-7px) rotateY(6deg); }
}
.cf-coin-idle { animation: cf-coin-idle 3.5s ease-in-out infinite; }

/* win pop */
@keyframes cf-win-pop {
  0%  { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.12); }
  100%{ transform: scale(1); opacity: 1; }
}
.cf-win-pop { animation: cf-win-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

/* float for empty state */
@keyframes cf-float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-10px); }
}
.cf-float { animation: cf-float 3s ease-in-out infinite; }

/* particles — only used in flip overlay */
@keyframes cf-p-rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  8%   { opacity: 1; }
  90%  { opacity: .5; }
  100% { transform: translateY(-90px) translateX(var(--dx)); opacity: 0; }
}
.cf-pt {
  position: absolute; border-radius: 50%; pointer-events: none;
  animation: cf-p-rise var(--d) ease-out infinite var(--dl);
}

/* input */
.cf-input:focus { outline: none; border-color: rgba(251,191,36,.45) !important; box-shadow: 0 0 0 3px rgba(251,191,36,.08); }
.cf-input::-webkit-outer-spin-button,
.cf-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* card hover accent — left bar slides up */
.cf-card-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #fbbf24, #a855f7);
  transform: scaleY(0);
  transform-origin: bottom center;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  border-radius: 0 2px 2px 0;
}
.cf-card:hover .cf-card-bar { transform: scaleY(1); }

/* card base */
.cf-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(145deg, #080012 0%, #0e001e 60%, #060010 100%);
  border: 1px solid rgba(255,255,255,.07);
  transition: border-color .22s ease, box-shadow .22s ease, transform .22s ease;
}
.cf-card:hover {
  border-color: rgba(251,191,36,.2);
  box-shadow: 0 16px 48px rgba(0,0,0,.85), 0 0 40px rgba(251,191,36,.1);
  transform: translateY(-3px);
}

/* side chip — no filled pill, just a subtle outline text */
.side-chip {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid;
  background: transparent;
  font-family: 'Nunito', sans-serif;
}

/* quick amount btn */
.quick-btn {
  padding: 8px 0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.38);
  transition: background .16s, border-color .16s, color .16s;
}
.quick-btn:hover {
  background: rgba(251,191,36,.08);
  border-color: rgba(251,191,36,.25);
  color: rgba(251,191,36,.8);
}
.quick-btn.active {
  background: rgba(251,191,36,.16);
  border-color: rgba(251,191,36,.4);
  color: #fbbf24;
}

/* skeleton pulse */
@keyframes sk-pulse {
  0%,100% { opacity: .4; }
  50%     { opacity: .7; }
}
.cf-skeleton { animation: sk-pulse 1.8s ease-in-out infinite; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,.15); border-radius: 4px; }
`;

/* ─── Particles — ONLY used in flip overlay ─────────────────────── */
function Particles({ accent, count = 12 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 18}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3.5 + Math.random() * 4.5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 38}px`,
    }))
  ).current;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="cf-pt" style={{
          left: p.left, bottom: p.bottom,
          width: p.size, height: p.size,
          background: accent,
          boxShadow: `0 0 ${p.size * 4}px ${accent}`,
          '--d': p.d, '--dl': p.dl, '--dx': p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── 3-D Coin — unchanged, it's good ───────────────────────────── */
function CoinDisplay({ side, size = 'md', spinning = false, idle = false }) {
  const sizeMap = { sm: 44, md: 68, lg: 110 };
  const px = sizeMap[size];
  const fs = { sm: '1.2rem', md: '1.7rem', lg: '2.8rem' }[size];
  const landAngle = side === 'tails' ? 180 : 0;
  const spinEnd = 1440 + landAngle;

  return (
    <div style={{ width: px, height: px, perspective: px * 6, flexShrink: 0 }}>
      <motion.div
        animate={spinning ? { rotateY: [0, spinEnd] } : { rotateY: landAngle }}
        transition={spinning ? { duration: 2.4, ease: [0.25, 0.1, 0.25, 1] } : { duration: 0 }}
        className={idle && !spinning ? 'cf-coin-idle' : ''}
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, #fef3c7, #fbbf24 45%, #92400e)',
          boxShadow: '0 0 28px rgba(251,191,36,.65), inset -4px -4px 14px rgba(0,0,0,.35), inset 4px 4px 12px rgba(255,255,255,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs,
        }}>👑</div>
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, #ddd6fe, #7c3aed 50%, #1e1b4b)',
          boxShadow: '0 0 28px rgba(168,85,247,.6), inset -4px -4px 14px rgba(0,0,0,.35), inset 4px 4px 12px rgba(255,255,255,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs,
        }}>🔱</div>
      </motion.div>
    </div>
  );
}

/* ─── Player Avatar ─────────────────────────────────────────────── */
function PlayerAvatar({ avatarUrl, name, size = 36 }) {
  const safe = safeAvatarUrl(avatarUrl);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'linear-gradient(135deg,#7c3aed,#4338ca)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#fff',
      border: '2px solid rgba(168,85,247,.3)',
    }}>
      {safe
        ? <img src={safe} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

/* ─── Game Card ─────────────────────────────────────────────────── */
function GameCard({ game, user, balance, onJoin, onAddBot }) {
  const isOwn = game.creator_email === user?.email;
  const opponentSide = game.creator_side === 'heads' ? 'tails' : 'heads';
  const pot = game.bet_amount * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
      className="cf-card"
    >
      {/* left accent bar — slides up on hover via CSS */}
      <div className="cf-card-bar" />

      <div style={{ padding: '16px 16px 14px' }}>

        {/* ── Players row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>

          {/* Creator side */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <CoinDisplay side={game.creator_side} size="sm" idle />
            <PlayerAvatar avatarUrl={game.creator_avatar_url} name={game.creator_name} size={32} />
            <p style={{
              fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,.55)',
              maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', textAlign: 'center',
            }}>
              {game.creator_name}
            </p>
            <span className="side-chip" style={{
              color: game.creator_side === 'heads' ? '#fbbf24' : '#c084fc',
              borderColor: game.creator_side === 'heads' ? 'rgba(251,191,36,.3)' : 'rgba(168,85,247,.3)',
            }}>
              {game.creator_side}
            </span>
          </div>

          {/* Center — VS + pot */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '10px 12px',
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 10,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 900,
              color: 'rgba(255,255,255,.16)',
              letterSpacing: '.22em',
            }}>VS</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: 16, fontWeight: 900, color: '#fbbf24',
                lineHeight: 1, letterSpacing: '-.01em',
              }}>
                {pot.toLocaleString()}
              </p>
              <p style={{ fontSize: 8, color: 'rgba(251,191,36,.38)', marginTop: 2, letterSpacing: '.08em' }}>
                COINS
              </p>
            </div>
          </div>

          {/* Opponent slot */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <CoinDisplay side={opponentSide} size="sm" idle />
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,.03)',
              border: '2px dashed rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(255,255,255,.18)', fontSize: 14 }}>?</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.2)' }}>Open</p>
            <span className="side-chip" style={{
              color: opponentSide === 'heads' ? 'rgba(251,191,36,.5)' : 'rgba(192,132,252,.5)',
              borderColor: opponentSide === 'heads' ? 'rgba(251,191,36,.2)' : 'rgba(168,85,247,.2)',
            }}>
              {opponentSide}
            </span>
          </div>
        </div>

        {/* ── Action ── */}
        {isOwn ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, background: 'rgba(255,255,255,.025)',
              border: '1px solid rgba(255,255,255,.05)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>
                Awaiting opponent…
              </span>
            </div>
            <button
              onClick={() => onAddBot(game)}
              style={{
                height: 36, padding: '0 13px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(168,85,247,.08)',
                border: '1px solid rgba(168,85,247,.25)',
                color: '#c084fc', fontSize: 12, fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
                transition: 'background .16s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,.08)'}
            >
              🤖 Bot
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: .97 }}
            onClick={() => onJoin(game)}
            disabled={game.bet_amount > balance}
            style={{
              width: '100%', height: 36, borderRadius: 8,
              background: game.bet_amount > balance
                ? 'rgba(255,255,255,.05)'
                : 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)',
              border: game.bet_amount > balance ? '1px solid rgba(255,255,255,.08)' : 'none',
              cursor: game.bet_amount > balance ? 'not-allowed' : 'pointer',
              color: game.bet_amount > balance ? 'rgba(255,255,255,.22)' : '#000',
              fontSize: 13, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: game.bet_amount > balance ? 'none' : '0 0 24px rgba(251,191,36,.35)',
              transition: 'opacity .18s',
            }}>
            <Swords style={{ width: 13, height: 13 }} />
            Join · {game.bet_amount.toLocaleString()} coins
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Quick amount button ────────────────────────────────────────── */
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

/* ─── Create Panel ──────────────────────────────────────────────── */
function CreatePanel({ balance, onClose, onCreate }) {
  const [amount, setAmount] = useState(1000);
  const [side, setSide] = useState('heads');
  const [vsBot, setVsBot] = useState(false);
  const canCreate = amount > 0 && amount <= balance;

  const SideBtn = ({ s }) => {
    const active = side === s;
    const isGold = s === 'heads';
    return (
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: .96 }}
        onClick={() => setSide(s)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
          background: active
            ? (isGold ? 'rgba(251,191,36,.08)' : 'rgba(168,85,247,.08)')
            : 'rgba(255,255,255,.025)',
          border: `1px solid ${active
            ? (isGold ? 'rgba(251,191,36,.38)' : 'rgba(168,85,247,.38)')
            : 'rgba(255,255,255,.07)'}`,
          fontFamily: 'Nunito, sans-serif',
          transition: 'all .18s',
        }}>
        <CoinDisplay side={s} size="md" idle={active} />
        <span style={{
          fontSize: 12, fontWeight: 800, textTransform: 'capitalize',
          color: active ? (isGold ? '#fbbf24' : '#c084fc') : 'rgba(255,255,255,.28)',
        }}>{s}</span>
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: .98 }}
      transition={{ duration: .32, ease: [.22, 1, .36, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        background: 'linear-gradient(145deg, #080012 0%, #100022 60%, #06000e 100%)',
        border: '1px solid rgba(251,191,36,.18)',
        boxShadow: '0 20px 60px rgba(0,0,0,.8)',
        padding: '20px 20px 18px',
        marginBottom: 20,
      }}>

      {/* top accent line — static, no sweep */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #fbbf24 30%, #a855f7 70%, transparent)',
        opacity: .7,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18, position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif' }}>
            Create Coinflip
          </span>
        </div>
        <motion.button
          whileHover={{ rotate: 90 }} whileTap={{ scale: .9 }}
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }}>
          <X style={{ width: 13, height: 13 }} />
        </motion.button>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Opponent type */}
        <p style={{
          fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.3)',
          letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8,
        }}>Opponent</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[
            { label: '👤 Real Player', val: false, color: '#60a5fa' },
            { label: '🤖 vs Bot',      val: true,  color: '#c084fc' },
          ].map(({ label, val, color }) => (
            <motion.button
              key={String(val)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
              onClick={() => setVsBot(val)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
                background: vsBot === val ? `${color}14` : 'rgba(255,255,255,.03)',
                border: `1px solid ${vsBot === val ? `${color}45` : 'rgba(255,255,255,.07)'}`,
                color: vsBot === val ? color : 'rgba(255,255,255,.3)',
                transition: 'all .16s',
              }}>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Side */}
        <p style={{
          fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.3)',
          letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10,
        }}>Pick your side</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <SideBtn s="heads" />
          <SideBtn s="tails" />
        </div>

        {/* Amount */}
        <p style={{
          fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.3)',
          letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8,
        }}>Bet amount</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 6, marginBottom: 10,
        }}>
          {QUICK_AMOUNTS.map(v => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`quick-btn${amount === v ? ' active' : ''}`}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>

        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="cf-input"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.09)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
            marginBottom: 8,
          }}
          min={1} max={balance}
        />

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', marginBottom: 16 }}>
          Balance:{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{balance?.toLocaleString()}</span>
          {' '}coins
        </p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: canCreate ? 1.02 : 1, y: canCreate ? -1 : 0 }}
          whileTap={{ scale: canCreate ? .97 : 1 }}
          onClick={() => onCreate(amount, side, vsBot)}
          disabled={!canCreate}
          style={{
            width: '100%', height: 44, borderRadius: 10,
            border: 'none', cursor: canCreate ? 'pointer' : 'not-allowed',
            background: canCreate
              ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)'
              : 'rgba(255,255,255,.05)',
            color: canCreate ? '#000' : 'rgba(255,255,255,.2)',
            fontSize: 14, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
            boxShadow: canCreate ? '0 0 32px rgba(251,191,36,.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all .18s',
          }}>
          {vsBot ? '🤖' : '🎲'}{' '}
          {vsBot ? 'Play vs Bot' : 'Create Game'} · Win {(amount * 2).toLocaleString()}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Flip Overlay ──────────────────────────────────────────────── */
function FlipOverlay({ flipResult, user }) {
  const won = flipResult?.winnerEmail === user?.email;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,0,10,.92)',
        backdropFilter: 'blur(18px)',
      }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: won
          ? 'radial-gradient(ellipse 55% 45% at 50% 50%,rgba(251,191,36,.1) 0%,transparent 70%)'
          : 'radial-gradient(ellipse 55% 45% at 50% 50%,rgba(168,85,247,.08) 0%,transparent 70%)',
      }} />
      <Particles accent={won ? '#fbbf24' : '#a855f7'} count={20} />

      <div style={{
        textAlign: 'center', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28, position: 'relative', zIndex: 2,
      }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <CoinDisplay side={flipResult?.result} size="lg" spinning />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 32, fontWeight: 900, color: '#fff',
          }}>
            {flipResult?.result === 'heads' ? '👑 Heads!' : '🔱 Tails!'}
          </div>
          <div className={won ? 'cf-win-pop' : ''} style={{
            fontSize: 24, fontWeight: 900,
            color: won ? '#fbbf24' : '#c084fc',
            textShadow: won ? '0 0 32px rgba(251,191,36,.7)' : '0 0 32px rgba(168,85,247,.55)',
          }}>
            {won
              ? `+${(flipResult.game.bet_amount * 2).toLocaleString()} coins!`
              : 'Better luck next time!'}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,.38)', fontWeight: 700 }}>
            {won ? '🎉 You won!' : '😔 You lost'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────── */
function EmptyState({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: 'center', padding: '56px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
      <div className="cf-float">
        <CoinDisplay side="heads" size="lg" idle />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,.42)', marginBottom: 5 }}>
          No open lobbies
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', fontWeight: 400 }}>
          Be the first to flip the coin
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: .96 }}
        onClick={onCreate}
        style={{
          padding: '11px 26px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
          color: '#000', fontSize: 13, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 0 32px rgba(251,191,36,.4)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
        <Plus style={{ width: 14, height: 14 }} />
        Create Game
      </motion.button>
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="cf-skeleton" style={{
      borderRadius: 14, height: 190,
      background: 'linear-gradient(145deg, #0a0016, #120028)',
      border: '1px solid rgba(255,255,255,.04)',
    }} />
  );
}

const BOT_NAMES = ['CoinBot', 'FlipMaster', 'LuckyBot', 'RNGod', 'ShadowBot', 'CryptoBot'];

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Coinflip() {
  const { user, balance, updateBalance, addXp, addRakeback, reload } = useWallet();
  useRequireAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [flipping, setFlipping] = useState(null);
  const [flipResult, setFlipResult] = useState(null);
  const paidOut = React.useRef(new Set());

  const loadGames = async () => {
    const data = await base44.entities.CoinflipGame.filter({ status: 'waiting' }, '-created_date', 20);
    setGames(data);
    setLoading(false);
  };

  const collectMyCreatorWins = React.useCallback(async () => {
    if (!user?.email) return;
    try {
      const myCreatedGames = await base44.entities.CoinflipGame.filter(
        { status: 'completed', creator_email: user.email },
        '-created_date', 50
      );
      for (const g of myCreatedGames) {
        if (g.opponent_email === 'bot@system') continue;
        if (g.winner_email !== user.email) continue;
        if (paidOut.current.has(g.id)) continue;
        paidOut.current.add(g.id);
        await updateBalance(g.bet_amount * 2, 'coinflip_win', `Won coinflip vs ${g.opponent_name || 'opponent'} for ${g.bet_amount * 2}`);
        await addXp(50);
      }
    } catch (_) {}
  }, [user?.email, updateBalance, addXp]);

  useEffect(() => {
    if (!user?.email) return;
    loadGames();
    collectMyCreatorWins();
    const unsub = base44.entities.CoinflipGame.subscribe(() => {
      loadGames();
      collectMyCreatorWins();
    });
    return unsub;
  }, [user?.email, collectMyCreatorWins]);

  const handleCreate = async (amount, side, vsBot = false) => {
    if (amount <= 0 || amount > balance) return;
    await updateBalance(-amount, 'coinflip_bet', `Created coinflip for ${amount}`);
    addRakeback(amount);
    const freshUser = await base44.auth.me().catch(() => user);
    const creatorName = freshUser?.username || freshUser?.full_name || 'Anonymous';
    const creatorAvatar = safeAvatarUrl(freshUser?.avatar_url);

    if (vsBot) {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const winnerEmail = result === side ? freshUser.email : 'bot@system';
      const game = await base44.entities.CoinflipGame.create({
        creator_email: freshUser.email, creator_name: creatorName,
        creator_avatar_url: creatorAvatar, creator_side: side,
        bet_amount: amount, opponent_email: 'bot@system', opponent_name: botName,
        status: 'completed', result, winner_email: winnerEmail,
      });
      if (game?.id) paidOut.current.add(game.id);
      setShowCreate(false);
      setFlipping(game.id);
      setFlipResult({ result, winnerEmail, game: { ...game, bet_amount: amount } });
      setTimeout(async () => {
        if (winnerEmail === freshUser.email) {
          await updateBalance(amount * 2, 'coinflip_win', `Won coinflip vs bot for ${amount * 2}`);
          await addXp(50);
        }
        setTimeout(() => { setFlipping(null); setFlipResult(null); loadGames(); }, 2500);
      }, 2000);
    } else {
      await base44.entities.CoinflipGame.create({
        creator_email: freshUser.email, creator_name: creatorName,
        creator_avatar_url: creatorAvatar, creator_side: side,
        bet_amount: amount, status: 'waiting',
      });
      setShowCreate(false);
      loadGames();
    }
  };

  const handleJoin = async (game) => {
    if (game.bet_amount > balance) return;
    await updateBalance(-game.bet_amount, 'coinflip_bet', `Joined coinflip for ${game.bet_amount}`);
    addRakeback(game.bet_amount);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const creatorWon = result === game.creator_side;
    const winnerEmail = creatorWon ? game.creator_email : user.email;
    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });
    setTimeout(async () => {
      await base44.entities.CoinflipGame.update(game.id, {
        opponent_email: user.email,
        opponent_name: user.full_name || user.username || 'Anonymous',
        status: 'completed', result, winner_email: winnerEmail,
      });
      if (creatorWon) {
        paidOut.current.add(game.id);
      } else {
        paidOut.current.add(game.id);
        await updateBalance(game.bet_amount * 2, 'coinflip_win', `Won coinflip for ${game.bet_amount * 2}`);
        await addXp(50);
      }
      setTimeout(() => { setFlipping(null); setFlipResult(null); loadGames(); }, 2500);
    }, 2000);
  };

  const handleAddBot = async (game) => {
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerEmail = result === game.creator_side ? game.creator_email : 'bot@system';
    paidOut.current.add(game.id);
    await base44.entities.CoinflipGame.update(game.id, {
      opponent_email: 'bot@system', opponent_name: botName,
      status: 'completed', result, winner_email: winnerEmail,
    });
    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });
    setTimeout(async () => {
      if (winnerEmail === user.email) {
        await updateBalance(game.bet_amount * 2, 'coinflip_win', `Won coinflip vs bot for ${game.bet_amount * 2}`);
        await addXp(50);
      }
      setTimeout(() => { setFlipping(null); setFlipResult(null); loadGames(); }, 2500);
    }, 2000);
  };

  return (
    <div className="cf-root" style={{ background: '#04000a', minHeight: '100vh', padding: '20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <h1 style={{
                fontSize: 26, fontWeight: 900, color: '#fff', margin: 0,
                letterSpacing: '-.02em', fontFamily: 'Nunito, sans-serif',
              }}>Coinflip</h1>
            </div>
            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,.3)', marginLeft: 13,
              fontWeight: 400, letterSpacing: '.01em',
            }}>
              Pick a side · Winner takes all
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: .96 }}
            onClick={() => setShowCreate(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
              background: showCreate
                ? 'rgba(251,191,36,.07)'
                : 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)',
              border: showCreate ? '1px solid rgba(251,191,36,.28)' : 'none',
              color: showCreate ? '#fbbf24' : '#000',
              fontSize: 13, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
              boxShadow: showCreate ? 'none' : '0 0 24px rgba(251,191,36,.38)',
              transition: 'all .18s',
            }}>
            <Plus style={{ width: 14, height: 14 }} />
            {showCreate ? 'Cancel' : 'Create'}
          </motion.button>
        </motion.div>

        {/* ── Stats bar — no icon boxes, clean row ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .12 }}
          style={{
            display: 'flex', gap: 0,
            borderRadius: 12,
            background: 'rgba(255,255,255,.025)',
            border: '1px solid rgba(255,255,255,.055)',
            overflow: 'hidden',
          }}>
          {[
            { label: 'Active Games', val: games.length, accent: '#fbbf24' },
            { label: 'Your Balance', val: `${balance?.toLocaleString()}`, accent: '#a855f7' },
            { label: 'Min Bet',      val: '100',                          accent: '#60a5fa' },
          ].map(({ label, val, accent }, i, arr) => (
            <div key={label} style={{
              flex: 1, padding: '12px 16px',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
            }}>
              <p style={{
                fontSize: 9, fontWeight: 700,
                color: 'rgba(255,255,255,.25)',
                textTransform: 'uppercase', letterSpacing: '.14em',
                marginBottom: 4,
              }}>{label}</p>
              <p style={{
                fontSize: 15, fontWeight: 900,
                color: accent,
                letterSpacing: '-.01em',
                fontFamily: 'Nunito, sans-serif',
              }}>{val}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Create Panel ── */}
        <AnimatePresence>
          {showCreate && (
            <CreatePanel balance={balance} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
          )}
        </AnimatePresence>

        {/* ── Section label ── */}
        {!loading && games.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: '.01em' }}>
              Open Lobbies
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '1px 8px', borderRadius: 4,
              background: 'rgba(251,191,36,.1)',
              color: 'rgba(251,191,36,.7)',
              border: '1px solid rgba(251,191,36,.22)',
              fontFamily: 'Nunito, sans-serif',
            }}>{games.length}</span>
          </motion.div>
        )}

        {/* ── Games ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(278px,1fr))', gap: 10 }}>
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * .055 }}>
                <GameCard game={game} user={user} balance={balance} onJoin={handleJoin} onAddBot={handleAddBot} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Flip Overlay ── */}
      <AnimatePresence>
        {flipping && flipResult && (
          <FlipOverlay flipResult={flipResult} user={user} />
        )}
      </AnimatePresence>
    </div>
  );
}