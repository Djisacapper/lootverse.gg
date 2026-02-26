import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Each player gets a unique color
const PLAYER_COLORS = [
  '#8b5cf6', '#3b82f6', '#ef4444', '#10b981',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
];

export default function JackpotWheel({ teamList, players, onWinner }) {
  // Build per-player totals from the teamTotals passed via teamList player indices
  // We receive teamList: [[pi, pi], [pi, pi]] and players: [{name, email}, ...]
  // We need per-player values — passed via the playerValues prop
  // Actually we receive teamTotals per team. We need to split per player.
  // The parent passes teamTotals as team averages now. We need raw per-player values.
  // Re-derive: accept playerTotals prop instead.
  // This component now expects: playerTotals (array indexed by player index)
  const { playerTotals = [] } = JackpotWheel._props || {};
  return null;
}

// ── Actual export ────────────────────────────────────────────────────────────
export function JackpotWheelInner({ teamList, players, playerTotals, onWinner }) {
  const grandTotal = playerTotals.reduce((s, v) => s + (v || 0), 0) || 1;

  // Build one segment per PLAYER (not team) so each player has their own color & %
  // We need to map player index → team index so we know which team wins
  const playerTeamMap = {};
  teamList.forEach((mi, ti) => mi.forEach(pi => { playerTeamMap[pi] = ti; }));

  // Flatten all players in order
  const allPlayerIndices = teamList.flat();

  const segments = allPlayerIndices.map((pi, idx) => {
    const val = playerTotals[pi] || 0;
    const pct = val / grandTotal;
    return {
      pi,
      ti: playerTeamMap[pi],
      pct,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      name: players[pi]?.name || `P${pi + 1}`,
      value: val,
    };
  });

  const VIEWPORT_W = 600;
  const STRIP_REPS = 10; // repeat strip 10 times so spin has room
  const STRIP_W = VIEWPORT_W * 2; // one full loop = 2x viewport width

  // Build the repeating strip
  const strip = [];
  let curX = 0;
  for (let rep = 0; rep < STRIP_REPS; rep++) {
    for (const seg of segments) {
      const w = Math.max(seg.pct * STRIP_W, 4); // min 4px so tiny segments are visible
      strip.push({ ...seg, x: curX, w, rep });
      curX += w;
    }
  }
  const totalStripW = curX;

  // Determine winner weighted by value
  const winnerRef = useRef(() => {
    const r = Math.random();
    let acc = 0;
    for (const seg of segments) {
      acc += seg.pct;
      if (r < acc) return seg;
    }
    return segments[segments.length - 1];
  });
  const winnerSeg = useRef(winnerRef.current()).current;

  // Find landing position: center of the winner's segment in the LAST repetition
  const landingX = useRef(() => {
    // Find last occurrence of the winner player in the strip
    const matches = strip.filter(s => s.pi === winnerSeg.pi);
    // Pick second-to-last occurrence so it's not cut off
    const target = matches[matches.length - 2] || matches[matches.length - 1];
    if (!target) return totalStripW / 2;
    // Center of that segment
    return target.x + target.w / 2;
  }).current;

  // The pointer sits at VIEWPORT_W/2. We need to translate so landingX lands at pointer.
  const targetX = -(landingX - VIEWPORT_W / 2);

  const [spun, setSpun] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    setSpun(true);
    const t = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onWinner(winnerSeg.ti);
      }
    }, 5800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-center text-white font-bold text-base">🎰 Jackpot Spin</p>

      {/* Spin wheel */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-[#05050d]"
        style={{ height: 90, width: '100%', maxWidth: VIEWPORT_W, margin: '0 auto' }}>

        {/* Top pointer arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0"
          style={{ borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '14px solid #f59e0b' }} />
        {/* Bottom pointer arrow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0"
          style={{ borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '14px solid #f59e0b' }} />
        {/* Center line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-px w-0.5 bg-amber-400/80 z-20" />

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #05050d 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #05050d 0%, transparent 100%)' }} />

        <motion.div
          className="absolute top-0 left-0 flex h-full"
          style={{ width: totalStripW }}
          initial={{ x: 0 }}
          animate={spun ? { x: targetX } : { x: 0 }}
          transition={{ duration: 5.2, ease: [0.03, 0.9, 0.18, 1] }}
        >
          {strip.map((seg, i) => (
            <div
              key={i}
              className="h-full flex-shrink-0 flex items-center justify-center border-r border-black/40"
              style={{ width: seg.w, background: seg.color + 'cc' }}
            >
              {seg.w > 35 && (
                <span className="text-[9px] font-bold text-white drop-shadow px-0.5 text-center leading-tight truncate" style={{ maxWidth: seg.w - 4 }}>
                  {seg.name}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Per-player percentage breakdown */}
      <div className="flex gap-2 flex-wrap justify-center">
        {segments.map((seg, idx) => (
          <div key={seg.pi} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 border border-white/10"
            style={{ background: seg.color + '18' }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs font-semibold text-white/90">{seg.name}</span>
            <span className="text-xs font-black" style={{ color: seg.color }}>{Math.round(seg.pct * 100)}%</span>
            <span className="text-[10px] text-white/40">({seg.value.toLocaleString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
}