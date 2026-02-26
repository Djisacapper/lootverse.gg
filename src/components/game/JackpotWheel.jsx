import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const PLAYER_COLORS = [
  '#8b5cf6', '#3b82f6', '#ef4444', '#10b981',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
];

// teamList: [[pi,pi,...], [pi,pi,...]] — teams by player indices
// players: [{name,...}] indexed by pi
// playerTotals: [value, value, ...] indexed by pi
// onWinner(teamIndex) called after spin
export default function JackpotWheel({ teamList, players, playerTotals, onWinner }) {
  const allPi = teamList.flat();
  const grandTotal = allPi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0) || 1;

  // Map player index → team index
  const playerTeamMap = {};
  teamList.forEach((mi, ti) => mi.forEach(pi => { playerTeamMap[pi] = ti; }));

  // One segment per player, sized by their share of total value
  const segments = allPi.map((pi, idx) => {
    const val = playerTotals[pi] || 0;
    return {
      pi,
      ti: playerTeamMap[pi],
      pct: val / grandTotal,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      name: players[pi]?.name || `P${pi + 1}`,
      value: val,
    };
  });

  const VIEWPORT_W = 600;
  const STRIP_REPS = 12;
  const STRIP_W = VIEWPORT_W * 2; // one loop = 1200px

  // Build the repeating strip
  const strip = [];
  let curX = 0;
  for (let rep = 0; rep < STRIP_REPS; rep++) {
    for (const seg of segments) {
      const w = Math.max(seg.pct * STRIP_W, 6);
      strip.push({ ...seg, x: curX, w, rep });
      curX += w;
    }
  }
  const totalStripW = curX;

  // Pick winner weighted by value percentage — compute once on mount
  const winnerSeg = useRef(null);
  if (!winnerSeg.current) {
    const r = Math.random();
    let acc = 0;
    let picked = segments[segments.length - 1];
    for (const seg of segments) {
      acc += seg.pct;
      if (r < acc) { picked = seg; break; }
    }
    winnerSeg.current = picked;
  }
  const winner = winnerSeg.current;

  // Land on winner's segment in 3rd-from-last repetition
  const landingXRef = useRef(null);
  if (!landingXRef.current) {
    const matches = strip.filter(s => s.pi === winner.pi);
    const target = matches[Math.max(0, matches.length - 3)];
    const offset = (Math.random() - 0.5) * (target?.w || 40) * 0.4;
    landingXRef.current = target ? target.x + target.w / 2 + offset : totalStripW / 2;
  }
  const landingX = landingXRef.current;

  // Translate so landingX aligns with the center pointer
  const targetX = -(landingX - VIEWPORT_W / 2);

  const [started, setStarted] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const startT = setTimeout(() => setStarted(true), 300);
    const endT = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onWinner(winnerSeg.ti);
      }
    }, 6200);
    return () => { clearTimeout(startT); clearTimeout(endT); };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-center text-white font-bold text-base tracking-wide">🎰 Jackpot Spin — determining winner...</p>

      {/* Spin reel */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-[#05050d]"
        style={{ height: 88, width: '100%', maxWidth: VIEWPORT_W, margin: '0 auto' }}
      >
        {/* Top & bottom pointer arrows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0"
          style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '16px solid #f59e0b' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0"
          style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '16px solid #f59e0b' }} />
        {/* Center line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-px w-[2px] bg-amber-400 z-20 shadow-lg" style={{ boxShadow: '0 0 8px #f59e0b' }} />

        {/* Edge fade */}
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #05050d 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #05050d 0%, transparent 100%)' }} />

        <motion.div
          className="absolute top-0 left-0 flex h-full"
          style={{ width: totalStripW }}
          initial={{ x: 0 }}
          animate={started ? { x: targetX } : { x: 0 }}
          transition={{ duration: 5.5, ease: [0.02, 0.92, 0.15, 1] }}
        >
          {strip.map((seg, i) => (
            <div
              key={i}
              className="h-full flex-shrink-0 flex items-center justify-center border-r border-black/30"
              style={{ width: seg.w, background: seg.color + 'cc' }}
            >
              {seg.w > 30 && (
                <span
                  className="text-[9px] font-bold text-white drop-shadow text-center leading-tight select-none"
                  style={{ maxWidth: seg.w - 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}
                >
                  {seg.name}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Per-player percentage badges */}
      <div className="flex gap-2 flex-wrap justify-center">
        {segments.map((seg) => (
          <div
            key={seg.pi}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 border"
            style={{ background: seg.color + '1a', borderColor: seg.color + '44' }}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs font-semibold text-white/90">{seg.name}</span>
            <span className="text-xs font-black" style={{ color: seg.color }}>
              {Math.round(seg.pct * 100)}%
            </span>
            <span className="text-[10px] text-white/40">({seg.value.toLocaleString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
}