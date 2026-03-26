import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLAYER_COLORS = [
  '#fbbf24', '#a855f7', '#3b82f6', '#10b981',
  '#f97316', '#ec4899', '#06b6d4', '#84cc16',
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Rajdhani:wght@600;700;900&display=swap');
.jw-root { font-family: 'Nunito', sans-serif; }

@keyframes jw-strip-glow {
  0%,100% { box-shadow: 0 0 20px rgba(245,200,66,.2), inset 0 0 20px rgba(0,0,0,.5); }
  50%     { box-shadow: 0 0 40px rgba(245,200,66,.45), inset 0 0 20px rgba(0,0,0,.5); }
}
.jw-strip-glow { animation: jw-strip-glow 1.4s ease-in-out infinite; }

@keyframes jw-winner-pop {
  0%   { transform: scale(0.4) translateY(10px); opacity: 0; }
  65%  { transform: scale(1.1) translateY(-3px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.jw-winner-pop { animation: jw-winner-pop .6s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes jw-badge-win {
  0%,100% { box-shadow: 0 0 0 1px var(--c), 0 0 16px var(--c); }
  50%     { box-shadow: 0 0 0 2px var(--c), 0 0 32px var(--c); }
}
.jw-badge-win { animation: jw-badge-win 1.6s ease-in-out infinite; }

@keyframes jw-pointer-pulse {
  0%,100% { filter: drop-shadow(0 0 6px rgba(245,200,66,.8)); }
  50%     { filter: drop-shadow(0 0 16px rgba(245,200,66,1)); }
}
.jw-pointer-pulse { animation: jw-pointer-pulse .9s ease-in-out infinite; }

@keyframes jw-scan {
  0%   { top: 0; opacity: 0; }
  5%   { opacity: .4; }
  95%  { opacity: .4; }
  100% { top: 100%; opacity: 0; }
}
.jw-scan {
  position: absolute; left: 0; right: 0; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(245,200,66,.6), transparent);
  animation: jw-scan 3s linear infinite;
}

.jw-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,.08);
  background: rgba(10,5,30,.9);
  transition: border-color .2s;
  position: relative;
  overflow: hidden;
}
.jw-card.winner-card {
  border-color: rgba(245,200,66,.7) !important;
  background: rgba(20,12,0,.95) !important;
}
`;

/* ─── Avatar circle ──────────────────────────────────────────────── */
function PlayerAvatar({ player, color, size = 52 }) {
  const [loaded, setLoaded] = useState(false);
  const url = player?.avatar_url;
  const initial = (player?.name || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 12px ${color}40`,
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 900, color }}>{initial}</span>
      {url && (
        <img src={url} alt="" onLoad={() => setLoaded(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .2s' }} />
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function JackpotWheel({ teamList, players, playerTotals, onWinner, winnerTeamIndex, isCrazy = false }) {
  const allPIs = teamList.flat();
  const grandTotal = allPIs.reduce((s, pi) => s + (playerTotals[pi] || 0), 0) || 1;

  // Build segments — one per player (not per team, for visual clarity)
  const segments = allPIs.map((pi, idx) => ({
    pi,
    ti: teamList.findIndex(mi => mi.includes(pi)),
    pct: Math.max((playerTotals[pi] || 0) / grandTotal, 0.04),
    color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
    name: players[pi]?.name || `P${pi + 1}`,
    value: playerTotals[pi] || 0,
  }));
  // Normalize pcts
  const pctSum = segments.reduce((s, g) => s + g.pct, 0);
  segments.forEach(g => { g.pct = g.pct / pctSum; });

  // Determine winner player index from the pre-computed winnerTeamIndex
  // If winnerTeamIndex is provided (from BattleArena, respecting crazy/terminal),
  // pick the highest/lowest scorer within that team
  const winnerSegRef = useRef(null);
  if (!winnerSegRef.current) {
    let winSeg;
    if (typeof winnerTeamIndex === 'number' && winnerTeamIndex >= 0) {
      // Use the externally determined winning team, pick the best player in it
      const teamPIs = teamList[winnerTeamIndex] || [];
      const teamSegs = segments.filter(s => teamPIs.includes(s.pi));
      if (teamSegs.length > 0) {
        winSeg = isCrazy
          ? teamSegs.reduce((a, b) => a.value < b.value ? a : b)
          : teamSegs.reduce((a, b) => a.value > b.value ? a : b);
      }
    }
    if (!winSeg) {
      // Fallback: weighted random by actual values
      const r = Math.random();
      let acc = 0;
      winSeg = segments[segments.length - 1];
      for (const seg of segments) {
        acc += (playerTotals[seg.pi] || 0) / grandTotal;
        if (r < acc) { winSeg = seg; break; }
      }
    }
    winnerSegRef.current = winSeg;
  }
  const winner = winnerSegRef.current;

  // Strip layout: each card is CARD_W wide
  const CARD_W = 130;
  const CARD_H = 160;
  const STRIP_VIEW_W = 540; // visible window width
  const GAP = 10;
  const CARD_STRIDE = CARD_W + GAP;

  // Build a long repeated strip for smooth scrolling feel
  const REPEATS = 6;
  const stripItems = [];
  for (let r = 0; r < REPEATS; r++) {
    segments.forEach(seg => stripItems.push({ ...seg, key: `${r}-${seg.pi}` }));
  }

  // Target: winner card centered in view on the last repetition
  const winnerIdx = stripItems.findLastIndex(s => s.pi === winner.pi);
  const centerOffset = STRIP_VIEW_W / 2 - CARD_W / 2;
  const targetX = -(winnerIdx * CARD_STRIDE - centerOffset);

  const SPIN_MS = 5200;
  const [translateX, setTranslateX] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const rafRef = useRef(null);
  const t0Ref = useRef(null);
  const firedRef = useRef(false);

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  useEffect(() => {
    const delay = setTimeout(() => {
      setSpinning(true);
      t0Ref.current = performance.now();
      const startX = 0;
      const totalDist = targetX; // will be negative (scrolling left)

      function tick(now) {
        const t = Math.min((now - t0Ref.current) / SPIN_MS, 1);
        const x = startX + easeOut(t) * totalDist;
        setTranslateX(x);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setSpinning(false);
          setDone(true);
          if (!firedRef.current) {
            firedRef.current = true;
            setTimeout(() => onWinner(winner.ti), 800);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => {
      clearTimeout(delay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const realPcts = segments.map(seg => ({
    ...seg,
    realPct: Math.round(((playerTotals[seg.pi] || 0) / grandTotal) * 100),
  }));

  return (
    <div className="jw-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <style>{CSS}</style>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#f5c842,#9d6fff)' }} />
          <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '.08em' }}>
            👑 JACKPOT SPIN
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 700 }}>
          {done ? '🎉 Winner determined!' : spinning ? 'Spinning…' : 'Get ready…'}
        </p>
        {isCrazy && (
          <p style={{ fontSize: 10, color: '#f472b6', fontWeight: 700, marginTop: 2 }}>
            🎭 Crazy mode — lowest scorer wins
          </p>
        )}
      </div>

      {/* Strip container */}
      <div style={{ position: 'relative', width: '100%', maxWidth: STRIP_VIEW_W }}>

        {/* Top & bottom pointers */}
        <div className="jw-pointer-pulse" style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, pointerEvents: 'none',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '18px solid #f5c842',
        }} />
        <div className="jw-pointer-pulse" style={{
          position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, pointerEvents: 'none',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderBottom: '18px solid #f5c842',
        }} />

        {/* Center highlight line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: CARD_W + 4, zIndex: 5, pointerEvents: 'none',
          border: `2px solid ${done ? '#f5c842' : 'rgba(245,200,66,.3)'}`,
          borderRadius: 16,
          boxShadow: done ? '0 0 30px rgba(245,200,66,.4)' : 'none',
          transition: 'border-color .5s, box-shadow .5s',
          background: 'rgba(245,200,66,.03)',
        }} />

        {/* Viewport */}
        <div style={{
          overflow: 'hidden',
          borderRadius: 18,
          background: 'linear-gradient(145deg,#07041a,#0d0822,#04010e)',
          border: '1px solid rgba(157,111,255,.2)',
          boxShadow: '0 0 60px rgba(0,0,0,.8)',
          position: 'relative',
        }}>
          <div className="jw-scan" />

          {/* Left / Right fade masks */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, zIndex: 10, pointerEvents: 'none',
            background: 'linear-gradient(to right,rgba(7,4,26,1),transparent)',
          }} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, zIndex: 10, pointerEvents: 'none',
            background: 'linear-gradient(to left,rgba(7,4,26,1),transparent)',
          }} />

          {/* Scrolling strip */}
          <div style={{
            display: 'flex',
            gap: GAP,
            padding: `14px ${GAP}px`,
            transform: `translateX(${translateX}px)`,
            willChange: 'transform',
          }}>
            {stripItems.map((seg, i) => {
              const isWinnerCard = done && seg.pi === winner.pi && i === winnerIdx;
              return (
                <div
                  key={seg.key}
                  className={`jw-card${isWinnerCard ? ' winner-card' : ''}`}
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderColor: `${seg.color}35`,
                    background: isWinnerCard ? `rgba(20,12,0,.95)` : `rgba(10,5,30,.9)`,
                    boxShadow: isWinnerCard ? `0 0 30px ${seg.color}50, inset 0 0 20px ${seg.color}10` : 'none',
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    borderRadius: '14px 14px 0 0',
                    background: `linear-gradient(90deg,transparent,${seg.color},transparent)`,
                  }} />

                  <PlayerAvatar player={players[seg.pi]} color={seg.color} size={48} />

                  <div style={{ textAlign: 'center', padding: '0 8px' }}>
                    <p style={{
                      fontSize: 12, fontWeight: 800, color: '#f0eaff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: CARD_W - 16,
                    }}>
                      {seg.name}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: seg.color, marginTop: 2 }}>
                      {seg.value.toLocaleString()}
                    </p>
                    <p style={{
                      fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.25)',
                      textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2,
                    }}>
                      {Math.round(((playerTotals[seg.pi] || 0) / grandTotal) * 100)}% chance
                    </p>
                  </div>

                  {isWinnerCard && (
                    <div className="jw-winner-pop" style={{
                      position: 'absolute', top: -10, right: -10,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#f5c842,#f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, boxShadow: '0 0 16px rgba(245,200,66,.6)',
                    }}>
                      👑
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Win chances row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 500 }}>
        {realPcts.map(seg => {
          const isWin = done && seg.pi === winner.pi;
          return (
            <div
              key={seg.pi}
              className={isWin ? 'jw-badge-win' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 11px', borderRadius: 9,
                background: `${seg.color}12`,
                border: `1px solid ${isWin ? seg.color : seg.color + '35'}`,
                '--c': `${seg.color}55`,
                transition: 'border-color .3s',
              }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>{seg.name}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: seg.color }}>{seg.realPct}%</span>
              {isWin && <span style={{ fontSize: 11 }}>👑</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}