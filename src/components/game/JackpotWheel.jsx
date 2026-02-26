import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

// Jackpot wheel — horizontal strip where each team gets a segment sized by their % of pot
export default function JackpotWheel({ teamList, teamTotals, players, onWinner }) {
  const total = teamTotals.reduce((a, b) => a + b, 0) || 1;
  const segments = teamList.map((mi, ti) => ({
    ti,
    pct: teamTotals[ti] / total,
    color: TEAM_COLORS[ti],
    label: mi.length === 1 ? players[mi[0]]?.name : `Team ${ti + 1}`,
    names: mi.map(pi => players[pi]?.name).join(' & '),
  }));

  // Build a long repeated strip so we can spin into it
  const STRIP_COUNT = 8; // repeat segments 8 times
  const STRIP_W = 800;   // total width of one loop
  const strip = [];
  let x = 0;
  for (let rep = 0; rep < STRIP_COUNT; rep++) {
    for (const seg of segments) {
      const w = seg.pct * STRIP_W;
      strip.push({ ...seg, x, w });
      x += w;
    }
  }
  const totalStripW = x;

  // Pick winner based on pct (weighted random, pre-determined)
  const winnerRef = useRef(() => {
    const r = Math.random();
    let acc = 0;
    for (const seg of segments) {
      acc += seg.pct;
      if (r <= acc) return seg.ti;
    }
    return segments[segments.length - 1].ti;
  });
  const winnerTi = useRef(winnerRef.current()).current;

  // Find a good landing x inside the last loop for the winning segment
  const landingX = useRef(() => {
    const loopStart = (STRIP_COUNT - 1) * STRIP_W;
    let cx = 0;
    for (const seg of segments) {
      if (seg.ti === winnerTi) {
        // center of this segment in last loop
        return loopStart + cx + seg.pct * STRIP_W / 2;
      }
      cx += seg.pct * STRIP_W;
    }
    return loopStart + STRIP_W / 2;
  }).current;

  // The pointer is at center of viewport (400px). We need to scroll so that landingX is at 400.
  const targetTranslate = -(landingX - 400);

  const [fired, setFired] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!fired) { setFired(true); onWinner(winnerTi); }
    }, 5500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-center text-white/60 text-sm font-semibold">🎰 Jackpot Spin — determining winner...</p>
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-[#08080f]" style={{ height: 80 }}>
        {/* Pointer */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-400 z-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 z-20"
          style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '12px solid #f59e0b' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 z-20"
          style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '12px solid #f59e0b' }} />

        <motion.div
          className="absolute top-0 left-0 flex h-full"
          style={{ width: totalStripW }}
          initial={{ x: 0 }}
          animate={{ x: targetTranslate }}
          transition={{ duration: 5.0, ease: [0.05, 0.85, 0.2, 1] }}
        >
          {strip.map((seg, i) => (
            <div key={i} className="h-full flex items-center justify-center flex-shrink-0 border-r border-black/30"
              style={{ width: seg.w, background: seg.color + 'cc' }}>
              {seg.w > 40 && (
                <div className="text-center px-1">
                  <p className="text-[10px] font-bold text-white truncate">{seg.label}</p>
                  <p className="text-[9px] text-white/70">{Math.round(seg.pct * 100)}%</p>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
      {/* Percent display */}
      <div className="flex gap-2 flex-wrap justify-center">
        {segments.map(seg => (
          <div key={seg.ti} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <p className="text-[11px] text-white/70">{seg.names}</p>
            <p className="text-[11px] font-bold text-white">{Math.round(seg.pct * 100)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}