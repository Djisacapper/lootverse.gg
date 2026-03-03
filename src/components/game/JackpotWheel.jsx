import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLAYER_COLORS = [
  '#fbbf24', '#a855f7', '#3b82f6', '#10b981',
  '#f97316', '#ec4899', '#06b6d4', '#84cc16',
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');

.jw-root { font-family: 'Nunito', sans-serif; }

@keyframes jw-outer-ring {
  0%,100% { box-shadow: 0 0 0 3px rgba(251,191,36,.2), 0 0 40px rgba(251,191,36,.15), 0 0 80px rgba(251,191,36,.06); }
  50%     { box-shadow: 0 0 0 3px rgba(251,191,36,.45), 0 0 60px rgba(251,191,36,.3),  0 0 120px rgba(251,191,36,.12); }
}
.jw-ring-glow { animation: jw-outer-ring 2s ease-in-out infinite; }

@keyframes jw-pointer-bounce {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%     { transform: translateX(-50%) translateY(-4px); }
}
.jw-pointer { animation: jw-pointer-bounce 1s ease-in-out infinite; }

@keyframes jw-p-rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  8%   { opacity: 1; }
  90%  { opacity: .5; }
  100% { transform: translateY(-80px) translateX(var(--dx)); opacity: 0; }
}
.jw-pt {
  position: absolute; border-radius: 50%; pointer-events: none;
  animation: jw-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes jw-winner-pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.jw-winner-pop { animation: jw-winner-pop .65s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes jw-badge-glow {
  0%,100% { box-shadow: 0 0 0 1px rgba(251,191,36,.2), 0 0 20px rgba(251,191,36,.15); }
  50%     { box-shadow: 0 0 0 1px rgba(251,191,36,.5), 0 0 40px rgba(251,191,36,.35); }
}
.jw-badge-active { animation: jw-badge-glow 1.8s ease-in-out infinite; }

@keyframes jw-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.jw-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:jw-scan 7s linear infinite; pointer-events:none;
}

@keyframes jw-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
}
`;

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 10 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 20}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 40}px`,
    }))
  ).current;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="jw-pt" style={{
          left: p.left, bottom: p.bottom, width: p.size, height: p.size,
          background: accent, boxShadow: `0 0 ${p.size * 4}px ${accent}`,
          '--d': p.d, '--dl': p.dl, '--dx': p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Draw the wheel onto a canvas ──────────────────────────────── */
function drawWheel(canvas, segments, rotationDeg) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;

  ctx.clearRect(0, 0, size, size);

  const total = segments.reduce((s, g) => s + g.pct, 0) || 1;
  let startAngle = (rotationDeg * Math.PI) / 180;

  segments.forEach((seg, i) => {
    const sliceAngle = (seg.pct / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    // Slice fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    // Slice border
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner shine arc
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255,255,255,.12)');
    grad.addColorStop(1, 'rgba(0,0,0,.0)');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Label — only if slice is wide enough
    if (sliceAngle > 0.18) {
      const labelR = radius * 0.68;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(midAngle + Math.PI / 2);

      const maxW = Math.max(30, radius * sliceAngle * 0.55);
      ctx.font = `bold ${Math.min(13, Math.max(9, sliceAngle * 18))}px Nunito,sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowBlur = 4;

      const name = seg.name.length > 9 ? seg.name.slice(0, 8) + '…' : seg.name;
      ctx.fillText(name, 0, 0);
      ctx.restore();
    }

    startAngle = endAngle;
  });

  // Center hub
  const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
  hubGrad.addColorStop(0, '#2a003a');
  hubGrad.addColorStop(0.6, '#1a0030');
  hubGrad.addColorStop(1, '#0d0018');
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,.5)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Hub dot
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(251,191,36,.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function JackpotWheel({ teamList, players, playerTotals, onWinner }) {
  const allPi = teamList.flat();
  const grandTotal = allPi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0) || 1;

  const playerTeamMap = {};
  teamList.forEach((mi, ti) => mi.forEach(pi => { playerTeamMap[pi] = ti; }));

  const segments = allPi.map((pi, idx) => {
    const val = playerTotals[pi] || 0;
    return {
      pi,
      ti: playerTeamMap[pi],
      pct: Math.max(val / grandTotal, 0.03), // min 3% so tiny shares still visible
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      name: players[pi]?.name || `P${pi + 1}`,
      value: val,
    };
  });

  // Normalise pcts back to 1 after clamping
  const pctSum = segments.reduce((s, g) => s + g.pct, 0);
  segments.forEach(g => { g.pct = g.pct / pctSum; });

  // Pick winner weighted by original value
  const winnerRef = useRef(null);
  if (!winnerRef.current) {
    const r = Math.random();
    let acc = 0;
    let picked = segments[segments.length - 1];
    for (const seg of segments) {
      acc += (playerTotals[seg.pi] || 0) / grandTotal;
      if (r < acc) { picked = seg; break; }
    }
    winnerRef.current = picked;
  }
  const winner = winnerRef.current;

  // Compute target rotation so the winner segment lands under the top pointer (angle = -90deg = top)
  const spinRotationsRef = useRef(null);
  if (!spinRotationsRef.current) {
    // Find cumulative start angle of winner segment (in 0..1 of full circle)
    let cumPct = 0;
    for (const seg of segments) {
      if (seg.pi === winner.pi) {
        // center of winner slice
        const midPct = cumPct + seg.pct / 2;
        // We want midPct * 360 to end at 270deg (top) after spinning
        // startAngle offset is -90deg (top of canvas = -PI/2)
        // extra full rotations for drama
        const extraSpins = 5 + Math.floor(Math.random() * 3);
        const landDeg = 270 - midPct * 360;
        spinRotationsRef.current = extraSpins * 360 + landDeg;
        break;
      }
      cumPct += seg.pct;
    }
    if (!spinRotationsRef.current) spinRotationsRef.current = 5 * 360 + 270;
  }

  const WHEEL_SIZE = 340;
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const SPIN_DURATION = 5500; // ms
  const [currentDeg, setCurrentDeg] = useState(-90);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  // Easing: starts fast, decelerates dramatically at end
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setSpinning(true);
      startTimeRef.current = performance.now();

      const initialDeg = -90;
      const finalDeg = initialDeg + spinRotationsRef.current;

      function tick(now) {
        const elapsed = now - startTimeRef.current;
        const t = Math.min(elapsed / SPIN_DURATION, 1);
        const deg = initialDeg + easeOut(t) * spinRotationsRef.current;
        setCurrentDeg(deg);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          setCurrentDeg(finalDeg);
          setSpinning(false);
          setDone(true);
          if (!firedRef.current) {
            firedRef.current = true;
            setTimeout(() => onWinner(winner.ti), 800);
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => {
      clearTimeout(startTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Redraw canvas whenever degree changes
  useEffect(() => {
    if (canvasRef.current) {
      drawWheel(canvasRef.current, segments, currentDeg);
    }
  }, [currentDeg]);

  return (
    <div className="jw-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <style>{CSS}</style>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-.01em' }}>
            🎰 Jackpot Spin
          </span>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#a855f7,#fbbf24)' }} />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 700 }}>
          {done ? '🎉 We have a winner!' : spinning ? 'Spinning…' : 'Get ready…'}
        </p>
      </div>

      {/* Wheel container */}
      <div style={{ position: 'relative', width: WHEEL_SIZE, height: WHEEL_SIZE }}>

        {/* Outer glow ring */}
        <div className="jw-ring-glow" style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          background: 'transparent',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Decorative outer ring */}
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: '3px solid rgba(251,191,36,.2)',
          background: 'linear-gradient(135deg,rgba(251,191,36,.08),rgba(168,85,247,.08))',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          style={{
            borderRadius: '50%',
            display: 'block',
            position: 'relative', zIndex: 1,
            filter: spinning ? 'drop-shadow(0 0 20px rgba(251,191,36,.4))' : done ? 'drop-shadow(0 0 30px rgba(251,191,36,.6))' : 'none',
            transition: 'filter .5s',
          }}
        />

        {/* Top pointer arrow */}
        <div className="jw-pointer" style={{
          position: 'absolute', top: -14, left: '50%',
          zIndex: 10, pointerEvents: 'none',
        }}>
          {/* Arrow shape */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '22px solid #fbbf24',
            filter: 'drop-shadow(0 0 8px rgba(251,191,36,.9))',
            transform: 'translateX(-50%)',
          }} />
        </div>

        {/* Bottom pointer */}
        <div style={{
          position: 'absolute', bottom: -14, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderBottom: '22px solid rgba(251,191,36,.45)',
          filter: 'drop-shadow(0 0 6px rgba(251,191,36,.5))',
        }} />

        {/* Winner overlay on done */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, pointerEvents: 'none',
              }}>
              <div style={{
                background: 'rgba(4,0,10,.82)',
                borderRadius: '50%',
                width: 110, height: 110,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4,
                border: `2px solid ${winner.color}`,
                boxShadow: `0 0 30px ${winner.color}80`,
              }}
                className="jw-winner-pop">
                <span style={{ fontSize: 22 }}>👑</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: winner.color, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {winner.name}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 700 }}>wins!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player segments badges */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
        padding: '14px 16px', width: '100%', maxWidth: 400,
      }}>
        <div className="jw-scan" />
        <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.16em', marginBottom: 10 }}>
          Win Chances
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {segments.map((seg) => {
            const realPct = Math.round(((playerTotals[seg.pi] || 0) / grandTotal) * 100);
            const isWinner = done && seg.pi === winner.pi;
            return (
              <div
                key={seg.pi}
                className={isWinner ? 'jw-badge-active' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 10,
                  background: `${seg.color}18`,
                  border: `1px solid ${isWinner ? seg.color : seg.color + '44'}`,
                  boxShadow: isWinner ? `0 0 20px ${seg.color}50` : 'none',
                  transition: 'all .3s',
                }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0, boxShadow: `0 0 6px ${seg.color}` }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{seg.name}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: seg.color }}>{realPct}%</span>
                {isWinner && <span style={{ fontSize: 11 }}>👑</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}