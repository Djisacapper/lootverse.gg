import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLAYER_COLORS = [
  '#fbbf24', '#a855f7', '#3b82f6', '#10b981',
  '#f97316', '#ec4899', '#06b6d4', '#84cc16',
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
.jw-root { font-family: 'Nunito', sans-serif; }

@keyframes jw-winner-pop {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  65%  { transform: scale(1.12) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.jw-winner-pop { animation: jw-winner-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes jw-badge-win {
  0%,100% { box-shadow: 0 0 0 1px var(--c), 0 0 16px var(--c); }
  50%     { box-shadow: 0 0 0 2px var(--c), 0 0 32px var(--c); }
}
.jw-badge-win { animation: jw-badge-win 1.6s ease-in-out infinite; }

@keyframes jw-pointer-pulse {
  0%,100% { filter: drop-shadow(0 0 6px rgba(251,191,36,.7)); }
  50%     { filter: drop-shadow(0 0 14px rgba(251,191,36,1)); }
}
.jw-pointer-pulse { animation: jw-pointer-pulse 1s ease-in-out infinite; }
`;

/* ─── Canvas draw ────────────────────────────────────────────────── */
function drawWheel(canvas, segments, rotationDeg) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  ctx.clearRect(0, 0, size, size);

  const total = segments.reduce((s, g) => s + g.pct, 0) || 1;
  let startAngle = (rotationDeg * Math.PI) / 180;

  // Draw slices
  segments.forEach(seg => {
    const sliceAngle = (seg.pct / total) * 2 * Math.PI;
    const endAngle   = startAngle + sliceAngle;
    const midAngle   = startAngle + sliceAngle / 2;

    // Fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    // Divider
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle light edge on slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    const shine = ctx.createLinearGradient(
      cx + Math.cos(midAngle) * radius * .3,
      cy + Math.sin(midAngle) * radius * .3,
      cx + Math.cos(midAngle) * radius,
      cy + Math.sin(midAngle) * radius,
    );
    shine.addColorStop(0, 'rgba(255,255,255,.1)');
    shine.addColorStop(1, 'rgba(0,0,0,.0)');
    ctx.fillStyle = shine;
    ctx.fill();

    // Label
    if (sliceAngle > 0.15) {
      const labelR = radius * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = `800 ${Math.min(12, Math.max(8, sliceAngle * 16))}px Nunito,sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.9)';
      ctx.shadowBlur = 5;
      const label = seg.name.length > 8 ? seg.name.slice(0, 7) + '…' : seg.name;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    startAngle = endAngle;
  });

  // Outer border ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(251,191,36,.3)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Center hub
  const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  hubGrad.addColorStop(0, '#200030');
  hubGrad.addColorStop(1, '#0a0015');
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hub center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function JackpotWheel({ teamList, players, playerTotals, onWinner }) {
  const allPi      = teamList.flat();
  const grandTotal = allPi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0) || 1;

  const playerTeamMap = {};
  teamList.forEach((mi, ti) => mi.forEach(pi => { playerTeamMap[pi] = ti; }));

  const segments = allPi.map((pi, idx) => {
    const val = playerTotals[pi] || 0;
    return {
      pi,
      ti: playerTeamMap[pi],
      pct: Math.max(val / grandTotal, 0.04),
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      name: players[pi]?.name || `P${pi + 1}`,
      value: val,
    };
  });
  const pctSum = segments.reduce((s, g) => s + g.pct, 0);
  segments.forEach(g => { g.pct = g.pct / pctSum; });

  // Pick winner (weighted by real values)
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

  // Target rotation: winner's slice mid lands at top (-90°)
  const spinAmountRef = useRef(null);
  if (!spinAmountRef.current) {
    let cumPct = 0;
    for (const seg of segments) {
      if (seg.pi === winner.pi) {
        const midPct  = cumPct + seg.pct / 2;
        const landDeg = 270 - midPct * 360;
        spinAmountRef.current = (5 + Math.floor(Math.random() * 3)) * 360 + landDeg;
        break;
      }
      cumPct += seg.pct;
    }
    if (!spinAmountRef.current) spinAmountRef.current = 5 * 360 + 270;
  }

  const WHEEL_SIZE   = 300;
  const SPIN_MS      = 5500;
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const t0Ref        = useRef(null);
  const firedRef     = useRef(false);

  const [deg, setDeg]         = useState(-90);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone]       = useState(false);

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  useEffect(() => {
    const delay = setTimeout(() => {
      setSpinning(true);
      t0Ref.current = performance.now();
      const spin = spinAmountRef.current;

      function tick(now) {
        const t   = Math.min((now - t0Ref.current) / SPIN_MS, 1);
        const d   = -90 + easeOut(t) * spin;
        setDeg(d);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setSpinning(false);
          setDone(true);
          if (!firedRef.current) {
            firedRef.current = true;
            setTimeout(() => onWinner(winner.ti), 700);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }, 350);

    return () => {
      clearTimeout(delay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, segments, deg);
  }, [deg]);

  return (
    <div className="jw-root" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
      <style>{CSS}</style>

      {/* Title */}
      <div style={{ textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:3 }}>
          <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
          <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>🎰 Jackpot Spin</span>
        </div>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:700 }}>
          {done ? '🎉 Winner determined!' : spinning ? 'Spinning…' : 'Get ready…'}
        </p>
      </div>

      {/* Wheel */}
      <div style={{ position:'relative', width:WHEEL_SIZE, height:WHEEL_SIZE }}>

        {/* Single top pointer — sits outside the wheel */}
        <div
          className="jw-pointer-pulse"
          style={{
            position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)',
            zIndex:10, pointerEvents:'none',
            width:0, height:0,
            borderLeft:'9px solid transparent',
            borderRight:'9px solid transparent',
            borderTop:'20px solid #fbbf24',
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          style={{
            borderRadius:'50%',
            display:'block',
            boxShadow: done
              ? `0 0 0 2px rgba(251,191,36,.4), 0 0 50px rgba(251,191,36,.2)`
              : `0 0 0 2px rgba(251,191,36,.15), 0 0 30px rgba(0,0,0,.6)`,
            transition:'box-shadow .6s',
          }}
        />

        {/* Winner hub overlay */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity:0, scale:.6 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ type:'spring', stiffness:200, damping:18 }}
              style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                zIndex:20, pointerEvents:'none',
              }}>
              <div style={{
                width:96, height:96, borderRadius:'50%',
                background:'rgba(4,0,10,.88)',
                border:`2px solid ${winner.color}`,
                boxShadow:`0 0 24px ${winner.color}70`,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:3,
              }}>
                <span style={{ fontSize:20 }}>👑</span>
                <span style={{
                  fontSize:11, fontWeight:900, color:winner.color,
                  maxWidth:80, overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap', textAlign:'center',
                }}>
                  {winner.name}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Win chances row */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', maxWidth:340 }}>
        {segments.map(seg => {
          const realPct  = Math.round(((playerTotals[seg.pi] || 0) / grandTotal) * 100);
          const isWinner = done && seg.pi === winner.pi;
          return (
            <div
              key={seg.pi}
              className={isWinner ? 'jw-badge-win' : ''}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 11px', borderRadius:9,
                background:`${seg.color}15`,
                border:`1px solid ${isWinner ? seg.color : seg.color + '40'}`,
                '--c': `${seg.color}60`,
                transition:'border-color .3s',
              }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:seg.color, flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.8)' }}>{seg.name}</span>
              <span style={{ fontSize:11, fontWeight:900, color:seg.color }}>{realPct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}