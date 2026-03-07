import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Swords, X, RotateCcw, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.cf-root { font-family: 'Nunito', sans-serif; }

@keyframes cf-spin { to { transform: rotate(360deg); } }
@keyframes cf-pulse-ring {
  0%  { transform: scale(1);   opacity: .7; }
  100%{ transform: scale(2.6); opacity: 0;  }
}
@keyframes cf-shimmer {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(350%)  skewX(-15deg); }
}
.cf-shim { position: relative; overflow: hidden; }
.cf-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.06),transparent);
  animation:cf-shimmer 5s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes cf-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.6; }
  95% { opacity:.6; }
  100%{ top:100%; opacity:0; }
}
.cf-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:cf-scan 6s linear infinite; pointer-events:none;
}

@keyframes cf-float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-10px); }
}
.cf-float { animation: cf-float 3s ease-in-out infinite; }

@keyframes cf-glow-pulse {
  0%,100% { box-shadow: 0 0 0 1px rgba(251,191,36,.12), 0 16px 50px rgba(0,0,0,.7), 0 0 50px rgba(251,191,36,.12); }
  50%     { box-shadow: 0 0 0 1px rgba(251,191,36,.28), 0 16px 50px rgba(0,0,0,.7), 0 0 80px rgba(251,191,36,.28); }
}
.cf-card-glow { animation: cf-glow-pulse 3s ease-in-out infinite; }

@keyframes cf-p-rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  8%   { opacity: 1; }
  90%  { opacity: .5; }
  100% { transform: translateY(-90px) translateX(var(--dx)); opacity: 0; }
}
.cf-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation: cf-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes cf-coin-idle {
  0%,100% { transform: rotateY(0deg) translateY(0px); }
  25%     { transform: rotateY(8deg)  translateY(-3px); }
  75%     { transform: rotateY(-8deg) translateY(-3px); }
}
.cf-coin-idle { animation: cf-coin-idle 4s ease-in-out infinite; }

@keyframes cf-win-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.cf-win-pop { animation: cf-win-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes cf-border-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1e1a00; border-radius: 4px; }

.cf-input:focus { outline: none; border-color: rgba(251,191,36,.45) !important; box-shadow: 0 0 0 3px rgba(251,191,36,.08); }
.cf-input::-webkit-outer-spin-button,
.cf-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

/* ─── Particles ─────────────────────────────────────────────────── */
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

/* ─── 3-D Coin ───────────────────────────────────────────────────── */
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
        {/* Heads */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, #fef3c7, #fbbf24 45%, #92400e)',
          boxShadow: '0 0 32px rgba(251,191,36,.7), 0 0 80px rgba(251,191,36,.3), inset -4px -4px 14px rgba(0,0,0,.35), inset 4px 4px 12px rgba(255,255,255,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs,
        }}>👑</div>
        {/* Tails */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, #ddd6fe, #7c3aed 50%, #1e1b4b)',
          boxShadow: '0 0 32px rgba(168,85,247,.65), 0 0 70px rgba(168,85,247,.25), inset -4px -4px 14px rgba(0,0,0,.35), inset 4px 4px 12px rgba(255,255,255,.3)',
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
      border: '2px solid rgba(251,191,36,.25)',
      boxShadow: '0 0 16px rgba(168,85,247,.35)',
    }}>
      {safe
        ? <img src={safe} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

/* ─── Game Card ─────────────────────────────────────────────────── */
function GameCard({ game, user, balance, onJoin, onAddBot }) {
  const [hov, setHov] = useState(false);
  const isOwn = game.creator_email === user?.email;
  const opponentSide = game.creator_side === 'heads' ? 'tails' : 'heads';
  const pot = game.bet_amount * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .5, ease: [.22, 1, .36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="cf-shim"
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16, cursor: 'pointer',
        background: 'linear-gradient(145deg,#080010 0%,#100025 60%,#04000d 100%)',
        border: `1px solid ${hov ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.07)'}`,
        boxShadow: hov
          ? '0 0 0 1px rgba(251,191,36,.18), 0 20px 60px rgba(0,0,0,.8), 0 0 60px rgba(251,191,36,.18)'
          : '0 8px 32px rgba(0,0,0,.7)',
        transition: 'border-color .25s, box-shadow .3s',
      }}>

      <div className="cf-scan" />
      {hov && <Particles accent="#fbbf24" count={8} />}

      {/* Top gradient bar */}
      <div style={{
        height: 2,
        background: hov
          ? 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)'
          : 'linear-gradient(90deg,transparent,rgba(251,191,36,.25),rgba(168,85,247,.25),transparent)',
        transition: 'background .3s',
      }} />

      <div style={{ padding: '18px 18px 16px' }}>
        {/* Players row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>

          {/* Creator */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <CoinDisplay side={game.creator_side} size="sm" idle />
            <PlayerAvatar avatarUrl={game.creator_avatar_url} name={game.creator_name} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {game.creator_name}
            </p>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 20,
              background: game.creator_side === 'heads' ? 'rgba(251,191,36,.15)' : 'rgba(168,85,247,.15)',
              color: game.creator_side === 'heads' ? '#fbbf24' : '#c084fc',
              border: `1px solid ${game.creator_side === 'heads' ? 'rgba(251,191,36,.3)' : 'rgba(168,85,247,.3)'}`,
            }}>
              {game.creator_side}
            </span>
          </div>

          {/* VS + Pot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.18)', letterSpacing: '.2em' }}>VS</span>
            <div style={{
              background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)',
              borderRadius: 12, padding: '8px 14px', textAlign: 'center',
              boxShadow: '0 0 20px rgba(251,191,36,.08)',
            }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 2 }}>Pot</p>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{pot.toLocaleString()}</p>
              <p style={{ fontSize: 8, color: 'rgba(251,191,36,.4)', marginTop: 1 }}>coins</p>
            </div>
          </div>

          {/* Opponent slot */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <CoinDisplay side={opponentSide} size="sm" idle />
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.04)',
              border: '2px dashed rgba(255,255,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 16 }}>?</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>Waiting...</p>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 20,
              background: opponentSide === 'heads' ? 'rgba(251,191,36,.12)' : 'rgba(168,85,247,.12)',
              color: opponentSide === 'heads' ? 'rgba(251,191,36,.6)' : 'rgba(192,132,252,.6)',
              border: `1px solid ${opponentSide === 'heads' ? 'rgba(251,191,36,.2)' : 'rgba(168,85,247,.2)'}`,
            }}>
              {opponentSide}
            </span>
          </div>
        </div>

        {/* Action */}
        {isOwn ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>Waiting for opponent…</span>
            </div>
            <button
              onClick={() => onAddBot(game)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 38, padding: '0 14px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.3)',
                color: '#c084fc', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito,sans-serif',
                transition: 'background .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,.1)'}
            >
              🤖 Bot
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: .97 }}
            onClick={() => onJoin(game)}
            disabled={game.bet_amount > balance}
            style={{
              width: '100%', height: 38, borderRadius: 10,
              background: game.bet_amount > balance
                ? 'rgba(255,255,255,.06)'
                : 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)',
              border: 'none', cursor: game.bet_amount > balance ? 'not-allowed' : 'pointer',
              color: game.bet_amount > balance ? 'rgba(255,255,255,.25)' : '#000',
              fontSize: 13, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: game.bet_amount > balance ? 'none' : '0 0 30px rgba(251,191,36,.4)',
              transition: 'opacity .2s',
            }}>
            <Swords style={{ width: 14, height: 14 }} />
            Join · {game.bet_amount.toLocaleString()} coins
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Quick amount button ────────────────────────────────────────── */
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

function QuickBtn({ v, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }}
      onClick={() => onClick(v)}
      style={{
        padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 800,
        fontFamily: 'Nunito,sans-serif', cursor: 'pointer',
        background: active ? 'rgba(251,191,36,.18)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${active ? 'rgba(251,191,36,.45)' : 'rgba(255,255,255,.07)'}`,
        color: active ? '#fbbf24' : 'rgba(255,255,255,.4)',
        boxShadow: active ? '0 0 16px rgba(251,191,36,.2)' : 'none',
        transition: 'all .18s',
      }}>
      {v.toLocaleString()}
    </motion.button>
  );
}

/* ─── Create Panel ──────────────────────────────────────────────── */
function CreatePanel({ balance, onClose, onCreate }) {
  const [amount, setAmount] = useState(1000);
  const [side, setSide] = useState('heads');
  const [vsBot, setVsBot] = useState(false);
  const canCreate = amount > 0 && amount <= balance;

  const SideBtn = ({ s }) => (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: .96 }}
      onClick={() => setSide(s)}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '18px 12px', borderRadius: 14, cursor: 'pointer',
        background: side === s
          ? s === 'heads' ? 'rgba(251,191,36,.1)' : 'rgba(168,85,247,.1)'
          : 'rgba(255,255,255,.03)',
        border: `1px solid ${side === s
          ? s === 'heads' ? 'rgba(251,191,36,.45)' : 'rgba(168,85,247,.45)'
          : 'rgba(255,255,255,.07)'}`,
        boxShadow: side === s
          ? s === 'heads' ? '0 0 30px rgba(251,191,36,.15)' : '0 0 30px rgba(168,85,247,.15)'
          : 'none',
        fontFamily: 'Nunito,sans-serif', transition: 'all .2s',
      }}>
      <CoinDisplay side={s} size="md" idle={side === s} />
      <span style={{
        fontSize: 13, fontWeight: 800, textTransform: 'capitalize',
        color: side === s ? (s === 'heads' ? '#fbbf24' : '#c084fc') : 'rgba(255,255,255,.3)',
      }}>{s}</span>
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: .98 }}
      transition={{ duration: .35, ease: [.22, 1, .36, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18,
        background: 'linear-gradient(145deg,#08000e,#120028,#05000e)',
        border: '1px solid rgba(251,191,36,.2)',
        boxShadow: '0 0 0 1px rgba(251,191,36,.08), 0 24px 60px rgba(0,0,0,.85), 0 0 80px rgba(251,191,36,.1)',
        padding: '22px 22px 20px',
        marginBottom: 20,
      }}>

      <div className="cf-scan" />
      <Particles accent="#fbbf24" count={10} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
          <RotateCcw style={{ width: 16, height: 16, color: '#fbbf24' }} />
          <span style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Create Coinflip</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: .9 }}
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}>
          <X style={{ width: 15, height: 15 }} />
        </motion.button>
      </div>

      {/* Opponent */}
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.35)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8, position: 'relative', zIndex: 2 }}>Opponent</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, position: 'relative', zIndex: 2 }}>
        {[{ label: '👤 Real Player', val: false, accent: '#60a5fa' }, { label: '🤖 vs Bot', val: true, accent: '#c084fc' }].map(({ label, val, accent }) => (
          <motion.button
            key={String(val)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }}
            onClick={() => setVsBot(val)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 800, fontFamily: 'Nunito,sans-serif',
              background: vsBot === val ? `${accent}18` : 'rgba(255,255,255,.04)',
              border: `1px solid ${vsBot === val ? `${accent}50` : 'rgba(255,255,255,.07)'}`,
              color: vsBot === val ? accent : 'rgba(255,255,255,.35)',
              boxShadow: vsBot === val ? `0 0 24px ${accent}20` : 'none',
              transition: 'all .2s',
            }}>
            {label}
          </motion.button>
        ))}
      </div>

      {/* Side */}
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.35)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 10, position: 'relative', zIndex: 2 }}>Pick your side</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <SideBtn s="heads" />
        <SideBtn s="tails" />
      </div>

      {/* Amount */}
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.35)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8, position: 'relative', zIndex: 2 }}>Bet amount</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10, position: 'relative', zIndex: 2 }}>
        {QUICK_AMOUNTS.map(v => <QuickBtn key={v} v={v} active={amount === v} onClick={setAmount} />)}
      </div>
      <div style={{ position: 'relative', zIndex: 2, marginBottom: 6 }}>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="cf-input"
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
            boxSizing: 'border-box',
          }}
          min={1} max={balance}
        />
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', marginBottom: 18, position: 'relative', zIndex: 2 }}>
        Balance: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{balance?.toLocaleString()}</span> coins
      </p>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: canCreate ? 1.02 : 1, y: canCreate ? -2 : 0 }}
        whileTap={{ scale: canCreate ? .97 : 1 }}
        onClick={() => onCreate(amount, side, vsBot)}
        disabled={!canCreate}
        style={{
          width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: canCreate ? 'pointer' : 'not-allowed',
          background: canCreate
            ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)'
            : 'rgba(255,255,255,.06)',
          color: canCreate ? '#000' : 'rgba(255,255,255,.2)',
          fontSize: 14, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
          boxShadow: canCreate ? '0 0 40px rgba(251,191,36,.45), 0 4px 20px rgba(0,0,0,.5)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          position: 'relative', zIndex: 2, transition: 'all .2s',
        }}>
        {vsBot ? '🤖' : '🎲'} {vsBot ? 'Play vs Bot' : 'Create Game'} · Win {(amount * 2).toLocaleString()} coins
      </motion.button>
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
        background: 'rgba(4,0,10,.9)',
        backdropFilter: 'blur(16px)',
      }}>
      {/* Radial glow bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: won
          ? 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(251,191,36,.12) 0%,transparent 70%)'
          : 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(168,85,247,.1) 0%,transparent 70%)',
      }} />
      <Particles accent={won ? '#fbbf24' : '#a855f7'} count={20} />

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 2 }}>

        {/* Coin */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <CoinDisplay side={flipResult?.result} size="lg" spinning />
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 34, fontWeight: 900,
            background: 'linear-gradient(135deg,#fff 0%,rgba(255,255,255,.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {flipResult?.result === 'heads' ? '👑 Heads!' : '🔱 Tails!'}
          </div>
          <div className={won ? 'cf-win-pop' : ''} style={{
            fontSize: 26, fontWeight: 900,
            color: won ? '#fbbf24' : '#c084fc',
            textShadow: won ? '0 0 40px rgba(251,191,36,.8)' : '0 0 40px rgba(168,85,247,.6)',
          }}>
            {won
              ? `+${(flipResult.game.bet_amount * 2).toLocaleString()} coins!`
              : 'Better luck next time!'}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>
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
        textAlign: 'center', padding: '60px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
      <div className="cf-float">
        <CoinDisplay side="heads" size="lg" idle />
      </div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>No active games</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)' }}>Be the first to flip the coin!</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
        onClick={onCreate}
        style={{
          padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
          color: '#000', fontSize: 14, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
          boxShadow: '0 0 40px rgba(251,191,36,.45)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <Plus style={{ width: 16, height: 16 }} />
        Create Game
      </motion.button>
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{
      borderRadius: 16, height: 200,
      background: 'linear-gradient(145deg,#0c0018,#140030)',
      border: '1px solid rgba(255,255,255,.05)',
      animation: 'cf-shimmer-bg 1.8s ease-in-out infinite',
    }} />
  );
}

const BOT_NAMES = ['CoinBot', 'FlipMaster', 'LuckyBot', 'RNGod', 'ShadowBot', 'CryptoBot'];

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Coinflip() {
  const { user, balance, updateBalance, addXp, addRakeback } = useWallet();
  useRequireAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [flipping, setFlipping] = useState(null);
  const [flipResult, setFlipResult] = useState(null);

  useEffect(() => {
    loadGames();
    const unsub = base44.entities.CoinflipGame.subscribe(() => loadGames());
    return unsub;
  }, []);

  const loadGames = async () => {
    const data = await base44.entities.CoinflipGame.filter({ status: 'waiting' }, '-created_date', 20);
    setGames(data);
    setLoading(false);
  };

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
    const winnerEmail = result === game.creator_side ? game.creator_email : user.email;
    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });
    setTimeout(async () => {
      await base44.entities.CoinflipGame.update(game.id, {
        opponent_email: user.email, opponent_name: user.full_name || 'Anonymous',
        status: 'completed', result, winner_email: winnerEmail,
      });
      if (winnerEmail === user.email) {
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

      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <RotateCcw style={{ width: 18, height: 18, color: '#fbbf24' }} />
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-.01em' }}>Coinflip</h1>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginLeft: 13, fontWeight: 600 }}>Pick a side · Winner takes all</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: .96 }}
            onClick={() => setShowCreate(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: showCreate
                ? 'rgba(251,191,36,.08)'
                : 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)',
              border: showCreate ? '1px solid rgba(251,191,36,.3)' : 'none',
              color: showCreate ? '#fbbf24' : '#000',
              fontSize: 14, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
              boxShadow: showCreate ? 'none' : '0 0 30px rgba(251,191,36,.4)',
            }}>
            <Plus style={{ width: 16, height: 16 }} />
            {showCreate ? 'Cancel' : 'Create'}
          </motion.button>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }}
          style={{
            display: 'flex', gap: 10,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
          }}>
          {[
            { icon: RotateCcw, label: 'Active Games', val: games.length, color: '#fbbf24' },
            { icon: Zap, label: 'Your Balance', val: `${balance?.toLocaleString()} coins`, color: '#a855f7' },
            { icon: Trophy, label: 'Min Bet', val: '100 coins', color: '#60a5fa' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
              <div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 1 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{val}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Create Panel */}
        <AnimatePresence>
          {showCreate && (
            <CreatePanel balance={balance} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
          )}
        </AnimatePresence>

        {/* Section label */}
        {!loading && games.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Swords style={{ width: 15, height: 15, color: '#fbbf24' }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Open Lobbies</span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(251,191,36,.15)', color: '#fbbf24',
              border: '1px solid rgba(251,191,36,.3)',
            }}>{games.length}</span>
          </motion.div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * .06 }}>
                <GameCard
                  game={game}
                  user={user}
                  balance={balance}
                  onJoin={handleJoin}
                  onAddBot={handleAddBot}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Flip Overlay */}
      <AnimatePresence>
        {flipping && flipResult && (
          <FlipOverlay flipResult={flipResult} user={user} />
        )}
      </AnimatePresence>
    </div>
  );
}