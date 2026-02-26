import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

/* ─── Confetti ─────────────────────────────────────────────────────────────── */
function ConfettiEffect({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      r: Math.random() * 8 + 4,
      color: ['#f59e0b','#8b5cf6','#06b6d4','#10b981','#ef4444','#ec4899'][Math.floor(Math.random()*6)],
      vx: (Math.random()-.5)*4, vy: Math.random()*4+2,
      angle: Math.random()*360, va: (Math.random()-.5)*6,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.angle+=p.va;
        if (p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const t = setTimeout(()=>cancelAnimationFrame(frame), 4500);
    return ()=>{ cancelAnimationFrame(frame); clearTimeout(t); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-50" />;
}

/* ─── Vertical Spinner ──────────────────────────────────────────────────────── */
function VerticalSpinner({ items, winnerItem, onDone }) {
  const ITEM_H = 80;
  const WIN_POS = 28;
  const TOTAL = 36;
  const VISIBLE_H = 240;

  // Build the strip once per mount
  const strip = useRef(
    Array.from({ length: TOTAL }, (_, i) =>
      i === WIN_POS ? winnerItem : items[Math.floor(Math.random() * items.length)]
    )
  ).current;

  const targetY = -(WIN_POS * ITEM_H - VISIBLE_H / 2 + ITEM_H / 2);

  useEffect(() => {
    const t = setTimeout(onDone, 3300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#08080f]"
      style={{ height: VISIBLE_H }}
    >
      {/* highlight band at center */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ height: ITEM_H, background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(245,158,11,0.5)', borderBottom: '1px solid rgba(245,158,11,0.5)' }} />
      {/* fade top */}
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, #08080f 0%, transparent 100%)' }} />
      {/* fade bottom */}
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, #08080f 0%, transparent 100%)' }} />

      <motion.div
        className="absolute left-0 right-0 top-0 flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{ duration: 3.0, ease: [0.04, 0.82, 0.165, 1] }}
      >
        {strip.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 flex-shrink-0"
            style={{ height: ITEM_H }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
              {item?.image_url
                ? <img src={item.image_url} alt={item?.name} className="w-11 h-11 object-contain" />
                : <span className="text-2xl">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/80 font-medium truncate">{item?.name || '—'}</p>
              <p className="text-xs text-amber-400 font-bold">{item?.value?.toLocaleString() || 0}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Won Item chip ─────────────────────────────────────────────────────────── */
function ItemChip({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${getRarityBorder(item?.rarity)} bg-white/[0.02]`}
    >
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
        {item?.image_url
          ? <img src={item.image_url} alt={item.name} className="w-6 h-6 object-contain" />
          : <span className="text-xs">📦</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/70 truncate">{item?.name}</p>
        <p className="text-[10px] text-amber-400 font-bold">{item?.value?.toLocaleString()}</p>
      </div>
    </motion.div>
  );
}

/* ─── Player Column ─────────────────────────────────────────────────────────── */
function PlayerColumn({ player, teamColor, isWinner, wonItems, isSpinning, caseItems, spinnerKey, spinnerItem, onSpinDone }) {
  const total = wonItems.reduce((s, it) => s + (it?.value || 0), 0);

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col rounded-2xl border transition-all duration-500
        ${isWinner ? 'border-amber-400/60 shadow-lg shadow-amber-400/10' : ''}`}
      style={{
        borderColor: isWinner ? undefined : teamColor + '44',
        background: isWinner ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: teamColor + '30', color: teamColor }}>
          {player.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{player.name}</p>
          {player.isBot && <p className="text-[9px] font-semibold" style={{ color: teamColor }}>BOT</p>}
        </div>
        {isWinner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
      </div>

      {/* Total */}
      <p className="text-xl font-black text-amber-400 text-center py-1">{total.toLocaleString()}</p>

      {/* Vertical Spinner — only during active spin */}
      {isSpinning && caseItems.length > 0 && (
        <div className="px-2 pb-2">
          <VerticalSpinner
            key={spinnerKey}
            items={caseItems}
            winnerItem={spinnerItem}
            onDone={onSpinDone}
          />
        </div>
      )}

      {/* Won items */}
      <div className="px-2 pb-3 space-y-1">
        {wonItems.map((item, i) => <ItemChip key={i} item={item} />)}
      </div>
    </div>
  );
}

/* ─── Battle Arena ──────────────────────────────────────────────────────────── */
export default function BattleArena({ battle, selectedCases, players, teams, modeLabel, battleModes = {}, userEmail, onClose, onReward }) {
  const totalRounds = selectedCases.length;
  const teamList = teams || [players.map((_, i) => i)];

  const [phase, setPhase]           = useState('countdown'); // countdown | spinning | between | done
  const [countdown, setCountdown]   = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [spinning, setSpinning]     = useState(false);
  const [spinners, setSpinners]     = useState([]);          // per-player winning item for current round
  const [playerItems, setPlayerItems] = useState(players.map(() => []));
  const [done, setDone]             = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti]   = useState(false);

  const allRolled   = useRef(null);
  const spinsDone   = useRef(0);
  const rewardGiven = useRef(false);

  // Pre-roll all items upfront
  useEffect(() => {
    allRolled.current = selectedCases.map(c =>
      players.map(() => rollItem(c.items || []) || { name: 'Nothing', value: 0, rarity: 'common', image_url: null })
    );
  }, []);

  // Countdown tick
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('spinning'); launchRound(0); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const launchRound = (round) => {
    spinsDone.current = 0;
    setCurrentRound(round);
    setSpinners(allRolled.current[round]);
    setSpinning(true);
  };

  const handleSpinDone = () => {
    spinsDone.current += 1;
    if (spinsDone.current < players.length) return;
    // All spinners finished
    const round = currentRound;
    const rolled = allRolled.current[round];
    setPlayerItems(prev => prev.map((items, pi) => [...items, rolled[pi]]));
    setSpinning(false);

    if (round + 1 >= totalRounds) {
      setTimeout(() => finishBattle(), 2500);
    } else {
      setTimeout(() => launchRound(round + 1), 4500);
    }
  };

  const finishBattle = () => {
    // Calculate winner
    const computeTeamValue = (memberIdxs) =>
      memberIdxs.reduce((sum, pi) =>
        sum + allRolled.current.reduce((s, r) => s + (r[pi]?.value || 0), 0), 0);

    let teamValues = teamList.map(computeTeamValue);

    // Battle mode: Crazy = lowest wins
    if (battleModes.crazy) {
      const minVal = Math.min(...teamValues);
      setWinnerTeamIdx(teamValues.indexOf(minVal));
    } else {
      const maxVal = Math.max(...teamValues);
      setWinnerTeamIdx(teamValues.indexOf(maxVal));
    }
    setDone(true);

    if (!rewardGiven.current) {
      rewardGiven.current = true;
      const winIdx = battleModes.crazy
        ? teamValues.indexOf(Math.min(...teamValues))
        : teamValues.indexOf(Math.max(...teamValues));
      const userPi = players.findIndex(p => p.email === userEmail);
      const userWins = teamList[winIdx]?.includes(userPi);
      if (userWins) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        // Total pot = all players × total case prices
        const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
        onReward && onReward(totalPot);
      }
    }
  };

  // Derived values
  const playerTotals = playerItems.map(items => items.reduce((s, it) => s + (it?.value || 0), 0));
  const teamTotals   = teamList.map(mi => mi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0));
  const totalPot     = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
  const payoutPerWinner = done && winnerTeamIdx !== null
    ? Math.floor(totalPot / Math.max(teamList[winnerTeamIdx]?.length || 1, 1))
    : 0;

  const caseItems = (selectedCases[currentRound] || selectedCases[0])?.items || [];

  return (
    <div className="space-y-4 relative">
      <ConfettiEffect active={showConfetti} />

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-white/40">{modeLabel || '1v1'}</p>
          <p className="text-sm font-bold text-white/60">
            Battle cost <span className="text-amber-400">{totalPot.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex-1" />
        {/* Round dots */}
        <div className="flex items-center gap-1">
          {selectedCases.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300
              ${i < currentRound ? 'w-5 bg-violet-500'
                : i === currentRound ? 'w-5 bg-amber-400'
                : 'w-2 bg-white/10'}`} />
          ))}
        </div>
        <p className="text-xs font-bold text-white/50">
          Rounds {done ? totalRounds : currentRound + 1}/{totalRounds}
        </p>
      </div>

      {/* ── Countdown overlay ── */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75">
            <motion.div key={countdown}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-[10rem] font-black text-white drop-shadow-2xl select-none">
              {countdown === 0 ? '🎲' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Battle Over Banner ── */}
      {done && (
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5 text-center">
          <p className="text-2xl font-black text-white mb-4">🏆 The battle is over!</p>
          <div className="flex justify-center gap-8 flex-wrap">
            {teamList.map((mi, ti) => {
              const isW = ti === winnerTeamIdx;
              return (
                <div key={ti} className={`flex flex-col items-center gap-2 ${isW ? '' : 'opacity-40'}`}>
                  {isW && (
                    <p className="text-xs text-green-400 font-bold">
                      Each winner earns <span className="text-white font-black">{payoutPerWinner.toLocaleString()}</span> coins
                    </p>
                  )}
                  <div className="flex gap-4">
                    {mi.map(pi => (
                      <div key={pi} className="flex flex-col items-center gap-1">
                        {isW && <span className="text-2xl">👑</span>}
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                          style={{ background: TEAM_COLORS[ti] + '33', border: `2px solid ${TEAM_COLORS[ti]}88` }}>
                          {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-xs text-white/60">{players[pi]?.name}</p>
                        <p className="text-sm font-bold text-amber-400">{playerTotals[pi]?.toLocaleString()}</p>
                        {isW && <p className="text-xs font-bold text-green-400">+{payoutPerWinner.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAM_COLORS[ti] }}>
                    {teamList.length > 1 ? `Team ${ti+1}: ` : ''}{teamTotals[ti]?.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-5">
            <Button onClick={onClose} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-12 h-11">
              Done
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Player grid ── */}
      {/* All teams side by side; within each team, players are side by side */}
      <div className="flex gap-2 items-start">
        {teamList.map((mi, ti) => (
          <React.Fragment key={ti}>
            <div className="flex-1 min-w-0 space-y-2">
              {teamList.length > 1 && (
                <div className="text-center">
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full"
                    style={{ background: TEAM_COLORS[ti] + '33', color: TEAM_COLORS[ti] }}>
                    Team {ti + 1}{done ? ` · ${teamTotals[ti]?.toLocaleString()}` : ''}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                {mi.map(pi => (
                  <PlayerColumn
                    key={pi}
                    player={players[pi]}
                    teamColor={TEAM_COLORS[ti]}
                    isWinner={done && ti === winnerTeamIdx}
                    wonItems={playerItems[pi] || []}
                    isSpinning={spinning}
                    caseItems={caseItems}
                    spinnerKey={`${currentRound}-${pi}`}
                    spinnerItem={spinners[pi]}
                    onSpinDone={handleSpinDone}
                  />
                ))}
              </div>
            </div>
            {ti < teamList.length - 1 && (
              <div className="flex items-start justify-center pt-10 px-1">
                <span className="text-white/20 font-black text-sm">VS</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}