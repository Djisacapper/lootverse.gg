import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Crown, Zap, Gem, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import JackpotWheel from './JackpotWheel';

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];
const PLAYER_COLORS = ['#8b5cf6','#3b82f6','#ef4444','#10b981','#f59e0b','#ec4899','#06b6d4','#84cc16'];

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
function VerticalSpinner({ items, winnerItem, onDone, fast }) {
  const ITEM_H = 80;
  const WIN_POS = 28;
  const TOTAL = 36;
  const VISIBLE_H = 240;
  const duration = fast ? 1.4 : 3.0;

  const strip = useRef(
    Array.from({ length: TOTAL }, (_, i) =>
      i === WIN_POS ? winnerItem : items[Math.floor(Math.random() * items.length)]
    )
  ).current;

  const targetY = -(WIN_POS * ITEM_H - VISIBLE_H / 2 + ITEM_H / 2);

  useEffect(() => {
    const spinMs = fast ? 1500 : 3100;
    const t = setTimeout(onDone, spinMs);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#08080f]" style={{ height: VISIBLE_H }}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ height: ITEM_H, background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(245,158,11,0.5)', borderBottom: '1px solid rgba(245,158,11,0.5)' }} />
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, #08080f 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, #08080f 0%, transparent 100%)' }} />

      <motion.div
        className="absolute left-0 right-0 top-0 flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{ duration, ease: [0.04, 0.82, 0.165, 1] }}
      >
        {strip.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 flex-shrink-0" style={{ height: ITEM_H }}>
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

/* ─── Item Chip ──────────────────────────────────────────────────────────────── */
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

/* ─── Player Column ──────────────────────────────────────────────────────────── */
// spinPhase: 'idle' | 'spinning' | 'magic_overlay' | 'magic_spin' | 'done'
function PlayerColumn({ player, playerColor, isWinner, wonItems, spinPhase, caseItems, spinnerKey, spinnerItem, magicItem, onSpinDone, onMagicSpinDone, fast, showPct, pct, grandTotal }) {
  if (!player) return null;
  
  const total = wonItems.reduce((s, it) => s + (it?.value || 0), 0);
  const isMagic = !!magicItem;

  const TOP_RARITIES = ['epic', 'legendary'];
    const topItems = caseItems.filter(it => TOP_RARITIES.includes(it.rarity));
    const magicCaseItems = topItems.length > 0 ? topItems : caseItems;

  return (
    <div
      className={`relative flex-1 min-w-0 flex flex-col rounded-2xl border transition-all duration-500
        ${isWinner ? 'border-amber-400/60 shadow-lg shadow-amber-400/10' : ''}
        ${isMagic && spinPhase !== 'idle' ? 'shadow-lg shadow-cyan-400/20' : ''}`}
      style={{
        borderColor: isWinner ? undefined : (isMagic && spinPhase !== 'idle') ? 'rgba(56,189,248,0.5)' : playerColor + '55',
        background: isWinner ? 'rgba(245,158,11,0.05)' : (playerColor + '0d'),
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: playerColor + '33', color: playerColor, border: `2px solid ${playerColor}66` }}>
          {player.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{player.name}</p>
          {player.isBot && <p className="text-[9px] font-semibold" style={{ color: playerColor }}>BOT</p>}
        </div>
        {isWinner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
      </div>

      <p className="text-xl font-black text-amber-400 text-center py-1">{total.toLocaleString()}</p>

      {/* Jackpot percentage bar */}
      {showPct && grandTotal > 0 && (
        <div className="px-3 pb-1">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold" style={{ color: playerColor }}>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: playerColor }}
              initial={{ width: '0%' }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Spinner area */}
      {(spinPhase === 'spinning' || spinPhase === 'magic_spin') && caseItems.length > 0 && (() => {
        const TOP_RARITIES = ['epic', 'legendary'];
        const topItems = caseItems.filter(it => TOP_RARITIES.includes(it.rarity));
        
        let spinPool = caseItems;
        let winItem = spinnerItem;
        
        if (spinPhase === 'magic_spin') {
          spinPool = topItems.length > 0 ? topItems : caseItems;
          winItem = magicItem;
        }

        return (
          <div className="px-2 pb-2 flex-shrink-0">
            {spinPhase === 'magic_spin' && (
              <div className="text-center mb-1">
                <span className="text-[10px] font-bold text-cyan-300 tracking-widest uppercase">✦ Magic Spin ✦</span>
              </div>
            )}
            <VerticalSpinner
              key={`${spinnerKey}-${spinPhase}`}
              items={spinPool}
              winnerItem={winItem}
              onDone={spinPhase === 'magic_spin' ? onMagicSpinDone : onSpinDone}
              fast={fast}
            />
          </div>
        );
      })()}

      {/* Won items display */}
      {wonItems.length > 0 && (
        <div className="px-2 pb-3 space-y-1 max-h-32 overflow-y-auto">
          {wonItems.map((item, i) => (
            <ItemChip key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Battle Arena ──────────────────────────────────────────────────────────── */
export default function BattleArena({ battle, selectedCases, players, teams, modeLabel, battleModes = {}, userEmail, onClose, onReward, onJoin, onAddBot, onFillBots, onStart, balance = 0 }) {
  const totalRounds = selectedCases.length;
  const teamList = teams || [players.map((_, i) => i)];
  const isWaiting = battle?.status === 'waiting';

  const modes       = battleModes && typeof battleModes === 'object' ? battleModes : {};
  const isCrazy     = modes.crazy     === true;
  const isTerminal  = modes.terminal  === true;
  const isGroup     = modes.group     === true;
  const isMagicSpin = modes.magic_spin === true;
  const isFastMode  = modes.fast_mode  === true;
  const isJackpot   = modes.jackpot   === true;

  const [phase, setPhase]               = useState('countdown');
  const [countdown, setCountdown]       = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [playerItems, setPlayerItems]   = useState(players.map(() => []));
  const [done, setDone]                 = useState(false);
  const [jackpotPhase, setJackpotPhase] = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti]   = useState(false);

  // Per-player spin phase: 'idle' | 'spinning' | 'magic_spin'
  const [playerPhases, setPlayerPhases] = useState(players.map(() => 'idle'));

  const allRolled   = useRef(null);
  // Track how many players have fully completed this round (including any magic spin)
  const roundDoneCount = useRef(0);
  const currentRoundRef = useRef(0);
  const rewardGiven = useRef(false);

  const rollWithMagicSpin = (caseItems) => {
    const item = rollItem(caseItems) || { name: 'Nothing', value: 0, rarity: 'common', image_url: null };
    if (!isMagicSpin) return { item, isMagic: false };
    const topItems = caseItems.filter(it => ['epic', 'legendary'].includes(it.rarity));
    if (topItems.length > 0 && Math.random() < 0.20) {
      return { item: rollItem(topItems) || item, isMagic: true };
    }
    return { item, isMagic: false };
  };

  useEffect(() => {
    allRolled.current = selectedCases.map(c =>
      players.map(() => rollWithMagicSpin(c.items || []))
    );
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('spinning'); launchRound(0); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const launchRound = (round) => {
    roundDoneCount.current = 0;
    currentRoundRef.current = round;
    setCurrentRound(round);
    // All players start spinning simultaneously
    setPlayerPhases(players.map(() => 'spinning'));
  };

  // Called when a player's NORMAL spin animation ends
  const handleNormalSpinDone = (pi) => {
    const round = currentRoundRef.current;
    const rolled = allRolled.current[round];

    if (rolled[pi].isMagic) {
      // This player triggered magic spin → go straight to magic spin (no overlay)
      setPlayerPhases(prev => {
        const next = [...prev];
        next[pi] = 'magic_spin';
        return next;
      });
    } else {
      // Normal finish for this player
      markPlayerRoundDone(pi, round);
    }
  };

  // Called when the magic spin animation ends
  const handleMagicSpinDone = (pi) => {
    const round = currentRoundRef.current;
    markPlayerRoundDone(pi, round);
  };

  // Marks one player as fully done for this round
  const markPlayerRoundDone = (pi, round) => {
    const rolled = allRolled.current[round];
    // Add this player's item to their won list
    setPlayerItems(prev => {
      const next = [...prev];
      next[pi] = [...next[pi], rolled[pi].item];
      return next;
    });
    setPlayerPhases(prev => {
      const next = [...prev];
      next[pi] = 'idle';
      return next;
    });

    roundDoneCount.current += 1;
    // Only advance when ALL players are done
    if (roundDoneCount.current >= players.length) {
      if (round + 1 >= totalRounds) {
        setTimeout(() => {
          if (isJackpot) setJackpotPhase(true);
          else finishBattle();
        }, isFastMode ? 1200 : 2500);
      } else {
        setTimeout(() => launchRound(round + 1), isFastMode ? 1500 : 4500);
      }
    }
  };

  const getPlayerTotal = (pi) => {
    if (!allRolled.current) return 0;
    if (isTerminal) {
      const lastRound = allRolled.current[totalRounds - 1];
      return lastRound?.[pi]?.item?.value || 0;
    }
    return allRolled.current.reduce((s, r) => s + (r[pi]?.item?.value || 0), 0);
  };

  const getTeamTotal = (mi) => {
    if (mi.length === 0) return 0;
    return mi.reduce((s, pi) => s + getPlayerTotal(pi), 0) / mi.length;
  };

  const finishBattle = (forcedWinnerTi = null) => {
    let winIdx;
    if (forcedWinnerTi !== null) {
      winIdx = forcedWinnerTi;
    } else if (isGroup) {
      winIdx = -1;
    } else {
      const teamVals = teamList.map(mi => getTeamTotal(mi));
      winIdx = isCrazy
        ? teamVals.indexOf(Math.min(...teamVals))
        : teamVals.indexOf(Math.max(...teamVals));
    }
    setWinnerTeamIdx(winIdx);
    setDone(true);
    setJackpotPhase(false);

    if (!rewardGiven.current) {
      rewardGiven.current = true;
      const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
      const userPi   = players.findIndex(p => p.email === userEmail);
      if (isGroup) {
        const share = Math.floor(totalPot / players.length);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        onReward && onReward(share);
      } else {
        const userWins = winIdx >= 0 && teamList[winIdx]?.includes(userPi);
        if (userWins) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          onReward && onReward(totalPot);
        }
      }
    }
  };

  const playerTotals = playerItems.map(items => items.reduce((s, it) => s + (it?.value || 0), 0));
  const teamTotals   = teamList.map(mi => mi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0));
  const totalPot     = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);

  const allPlayerIndices = teamList.flat();
  const playerColorMap = {};
  allPlayerIndices.forEach((pi, idx) => { playerColorMap[pi] = PLAYER_COLORS[idx % PLAYER_COLORS.length]; });

  const grandPlayerTotal = playerTotals.reduce((s, v) => s + v, 0);
  const caseItems = (selectedCases[currentRound] || selectedCases[0])?.items || [];

  let payoutLabel = '';
  if (done) {
    if (isGroup) {
      payoutLabel = `Everyone gets ${Math.floor(totalPot / players.length).toLocaleString()} coins`;
    } else if (winnerTeamIdx >= 0) {
      const winnerCount = teamList[winnerTeamIdx]?.length || 1;
      payoutLabel = `Each winner gets ${Math.floor(totalPot / winnerCount).toLocaleString()} coins`;
    }
  }

  const activeModes = [
    isCrazy     && { icon: '🎭', label: 'Crazy', color: '#ec4899' },
    isTerminal  && { icon: '⚡', label: 'Terminal', color: '#f59e0b' },
    isGroup     && { icon: '🔄', label: 'Group', color: '#10b981' },
    isMagicSpin && { icon: '✨', label: 'Magic Spin', color: '#8b5cf6' },
    isFastMode  && { icon: '⚡', label: 'Fast', color: '#06b6d4' },
    isJackpot   && { icon: '👑', label: 'Jackpot', color: '#f59e0b' },
  ].filter(Boolean);

  // Auto-start when all slots are filled
  React.useEffect(() => {
    if (!isWaiting) return;
    const maxPlayers = battle?.max_players || 2;
    const filledCount = (players || []).filter(p => p && p.email).length;
    const isCreator = battle?.creator_email === userEmail;
    if (isCreator && filledCount >= maxPlayers) {
      onStart && onStart();
    }
  }, [players?.length, isWaiting]);

  // If waiting, render arena-style lobby matching the battle grid exactly
  if (isWaiting) {
    const maxPlayers = battle.max_players || 2;
    const isCreator = battle.creator_email === userEmail;
    const hasJoined = players.some(p => p && p.email === userEmail && !p.isBot);
    const filledCount = players.filter(p => p && p.email).length;
    const emptySlots = maxPlayers - filledCount;
    const allFilled = filledCount >= maxPlayers;

    // Use teams config to determine team sizes, fallback to splitting evenly
    const waitingTeamList = teams && teams.length > 0
      ? teams
      : [Array.from({ length: Math.ceil(maxPlayers / 2) }, (_, i) => i),
         Array.from({ length: Math.floor(maxPlayers / 2) }, (_, i) => i + Math.ceil(maxPlayers / 2))];

    // Build slot info: player at global index or empty
    const getSlot = (globalIdx) => {
      return globalIdx < players.length
        ? { filled: true, player: players[globalIdx] }
        : { filled: false };
    };

    return (
      <div className="space-y-4">
        {/* Header — identical to battle header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-white/40">{modeLabel || '1v1'}</p>
            <p className="text-sm font-bold text-white/60">
              Battle cost <span className="text-amber-400">{(battle.entry_cost * maxPlayers)?.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex-1" />
          {isCreator && (
            <Button
              onClick={onFillBots}
              disabled={allFilled}
              className="bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              <Bot className="w-4 h-4 mr-1.5" /> Fill with Bots
            </Button>
          )}
          <span className="text-sm text-white/40 font-medium">
            {filledCount}/{maxPlayers} players
          </span>
        </div>

        {/* Team grid — same structure as battle arena */}
        <div className="flex gap-2 items-start overflow-x-auto max-w-full">
          {waitingTeamList.map((memberIndices, ti) => (
            <React.Fragment key={ti}>
              <div className="flex-1 min-w-0 space-y-2">
                {waitingTeamList.length > 1 && (
                  <div className="text-center">
                    <span className="text-xs font-bold px-3 py-0.5 rounded-full"
                      style={{ background: TEAM_COLORS[ti] + '33', color: TEAM_COLORS[ti] }}>
                      Team {ti + 1}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  {memberIndices.map((globalIdx) => {
                    const slot = getSlot(globalIdx);
                    const color = PLAYER_COLORS[globalIdx % PLAYER_COLORS.length];
                    const isEmptySlot = !slot.filled;
                    const canJoin = isEmptySlot && !hasJoined && !isCreator;

                    return (
                      <div
                        key={globalIdx}
                        className="flex-1 min-w-[100px] flex flex-col rounded-2xl border transition-all duration-300"
                        style={{
                          borderColor: isEmptySlot ? 'rgba(255,255,255,0.08)' : color + '55',
                          background: isEmptySlot ? 'rgba(255,255,255,0.02)' : color + '0d',
                          minHeight: 180,
                        }}
                      >
                        {slot.filled ? (
                          /* ── Filled slot ── */
                          <div className="flex flex-col items-center justify-center flex-1 gap-2 px-2 py-4">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                              style={{ background: color + '33', border: `2px solid ${color}88` }}>
                              {slot.player.isBot ? <Bot className="w-5 h-5" style={{ color }} /> : <User className="w-5 h-5" style={{ color }} />}
                            </div>
                            <div className="text-center w-full px-1">
                              <p className="text-sm font-bold text-white truncate">{slot.player.name}</p>
                              {slot.player.isBot && (
                                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>BOT</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-400/30">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              <span className="text-[10px] font-bold text-green-400">Ready</span>
                            </div>
                          </div>
                        ) : (
                          /* ── Empty slot ── */
                          <div className="flex flex-col items-center justify-center flex-1 gap-2 px-2 py-4">
                            <Loader2 className="w-8 h-8 text-white/15 animate-spin" />
                            <p className="text-[10px] text-white/25 font-medium text-center">Waiting for player...</p>
                            {/* Non-creator visitor: Join button */}
                            {canJoin && (
                              <Button
                                onClick={() => onJoin()}
                                disabled={battle.entry_cost > balance}
                                size="sm"
                                className="h-7 px-4 text-xs bg-blue-500 hover:bg-blue-400 rounded-lg mt-1"
                              >
                                Join
                              </Button>
                            )}
                            {/* Creator: add bot to this slot */}
                            {isCreator && (
                              <Button
                                onClick={onAddBot}
                                size="sm"
                                className="h-7 px-3 text-xs bg-white/[0.08] hover:bg-white/15 text-white/60 hover:text-white rounded-lg border border-white/10 mt-1"
                              >
                                <Bot className="w-3 h-3 mr-1" /> Add Bot
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {ti < waitingTeamList.length - 1 && (
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

  return (
    <div className="space-y-4 relative max-w-full overflow-hidden">
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
        {activeModes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {activeModes.map(m => (
              <span key={m.label} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: m.color + '22', color: m.color, border: `1px solid ${m.color}44` }}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
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

      {/* ── Mode notices ── */}
      {isTerminal && !done && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400/80">Terminal mode — only the <strong>last round</strong> determines the winner.</p>
        </div>
      )}

      {isCrazy && !done && (
        <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-400/20 rounded-xl px-3 py-2">
          <span className="text-sm">🎭</span>
          <p className="text-xs text-pink-400/80">Crazy mode — the player with the <strong>lowest</strong> total wins!</p>
        </div>
      )}
      {isGroup && !done && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2">
          <span className="text-sm">🔄</span>
          <p className="text-xs text-green-400/80">Group mode — all profit is split equally among all players.</p>
        </div>
      )}

      {/* ── Jackpot Wheel ── */}
      {jackpotPhase && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <JackpotWheel
            teamList={teamList}
            players={players}
            playerTotals={players.map((_, pi) => getPlayerTotal(pi))}
            onWinner={(winnerTi) => setTimeout(() => finishBattle(winnerTi), 800)}
          />
        </motion.div>
      )}

      {/* ── Battle Over Banner ── */}
      {done && (
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5 text-center">
          <p className="text-2xl font-black text-white mb-1">🏆 The battle is over!</p>
          {payoutLabel && <p className="text-sm text-green-400 font-semibold mb-4">{payoutLabel}</p>}
          <div className="flex justify-center gap-8 flex-wrap">
            {teamList.map((mi, ti) => {
              const isW = isGroup || ti === winnerTeamIdx;
              return (
                <div key={ti} className={`flex flex-col items-center gap-2 ${isW ? '' : 'opacity-35'}`}>
                  <div className="flex gap-4">
                    {mi.map(pi => (
                      <div key={pi} className="flex flex-col items-center gap-1">
                        {isW && <span className="text-2xl">{isGroup ? '🎁' : '👑'}</span>}
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                          style={{ background: TEAM_COLORS[ti] + '33', border: `2px solid ${TEAM_COLORS[ti]}88` }}>
                          {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-xs text-white/60">{players[pi]?.name}</p>
                        <p className="text-sm font-bold text-amber-400">{playerTotals[pi]?.toLocaleString()}</p>
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

      {/* ── Countdown ── */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/85 gap-8">
            <div className="flex gap-4 flex-wrap justify-center">
              {allPlayerIndices.map((pi, idx) => {
                const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                return (
                  <motion.div key={pi}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black"
                      style={{ background: color + '33', border: `3px solid ${color}`, color }}>
                      {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-xs font-bold text-white/80">{players[pi]?.name}</span>
                    <div className="w-10 h-2 rounded-full" style={{ background: color }} />
                  </motion.div>
                );
              })}
            </div>
            <motion.div key={countdown}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-[9rem] font-black text-white drop-shadow-2xl select-none leading-none">
              {countdown === 0 ? '🎲' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player Grid ── */}
      <div className="flex gap-2 items-start overflow-x-auto max-w-full">
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
                {mi.map(pi => {
                  const round = currentRoundRef.current;
                  const rolled = allRolled.current?.[round]?.[pi];
                  return (
                    <PlayerColumn
                      key={pi}
                      player={players[pi]}
                      playerColor={playerColorMap[pi]}
                      isWinner={done && (isGroup || ti === winnerTeamIdx)}
                      wonItems={playerItems[pi] || []}
                      spinPhase={playerPhases[pi]}
                      caseItems={caseItems}
                      spinnerKey={`${currentRound}-${pi}`}
                      spinnerItem={rolled?.item}
                      magicItem={rolled?.isMagic ? rolled.item : null}
                      onSpinDone={() => handleNormalSpinDone(pi)}
                      onMagicSpinDone={() => handleMagicSpinDone(pi)}
                      fast={isFastMode}
                      pct={grandPlayerTotal > 0 ? (playerTotals[pi] || 0) / grandPlayerTotal : 0}
                      grandTotal={grandPlayerTotal}
                      showPct={isJackpot}
                    />
                  );
                })}
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