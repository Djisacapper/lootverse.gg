import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ChevronDown, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CasePickerModal from './CasePickerModal';
import { getRarityColor } from './useWallet';

// Parse mode to get teams array: "2v2" -> [2,2], "1v1v1" -> [1,1,1]
export function parseMode(modeLabel) {
  return modeLabel.split('v').map(Number);
}

const MODES = [
  { label: '1v1' },
  { label: '1v1v1' },
  { label: '1v1v1v1' },
  { label: '1v1v1v1v1' },
  { label: '2v2' },
  { label: '3v3' },
  { label: '2v2v2' },
];

const BATTLE_MODES = [
  { key: 'crazy', icon: '🎭', label: 'Crazy', desc: 'Lowest amount pulled out of the battle wins!' },
  { key: 'terminal', icon: '⚡', label: 'Terminal', desc: 'Only the last case will determine the winner.' },
  { key: 'jackpot', icon: '👑', label: 'Jackpot', desc: 'Winner is determined by a jackpot spin based on unboxed values!' },
  { key: 'group', icon: '🔄', label: 'Group', desc: 'All the profit at the end will split among all players.' },
  { key: 'magic_spin', icon: '✨', label: 'Magic Spin', desc: 'High tier items will be hidden behind a magic spin.' },
  { key: 'fast_mode', icon: '⚡', label: 'Fast Mode', desc: 'Faster gameplay with reduced animation times.' },
];

const BOT_NAMES = ['CrateBot', 'LootBot', 'RNG_Pro', 'ShadowBot', 'CryptoBot', 'NightBot'];
const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

export default function CreateBattle({ cases, balance, user, onBack, onCreate }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [modeLabel, setModeLabel] = useState('1v1');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [battleModes, setBattleModes] = useState({});

  const totalCost = selectedCases.reduce((sum, c) => sum + c.price, 0);
  const teamSizes = parseMode(modeLabel);
  const totalPlayers = teamSizes.reduce((a, b) => a + b, 0);

  // Slot state: array of length totalPlayers. slot 0 is always the user.
  // Each slot: null (empty) or { name, email, isBot }
  const makeUserSlot = (u) => u ? { name: u.username || u.full_name || 'You', email: u.email, avatar_url: u.avatar_url || null, isBot: false } : null;

  const [slots, setSlots] = useState(() => {
    const s = Array(totalPlayers).fill(null);
    if (user) s[0] = makeUserSlot(user);
    return s;
  });

  // Seed slot 0 with the current user whenever user loads
  useEffect(() => {
    if (!user) return;
    setSlots(prev => {
      const n = [...prev];
      n[0] = makeUserSlot(user);
      return n;
    });
  }, [user?.email, user?.avatar_url, user?.username, user?.full_name]);

  // When mode changes rebuild slots
  const handleModeChange = (label) => {
    setModeLabel(label);
    const sizes = label.split('v').map(Number);
    const total = sizes.reduce((a, b) => a + b, 0);
    const s = Array(total).fill(null);
    if (user) s[0] = makeUserSlot(user);
    setSlots(s);
    setShowModeDropdown(false);
  };

  const fillWithBots = () => {
    const usedNames = new Set();
    setSlots(prev => prev.map((slot, i) => {
      if (slot) return slot;
      let name;
      do { name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (usedNames.has(name));
      usedNames.add(name);
      return { name, email: `bot_${i}@system`, isBot: true };
    }));
  };

  const removeSlot = (i) => {
    if (i === 0) return; // can't remove self
    setSlots(prev => { const n = [...prev]; n[i] = null; return n; });
  };

  const toggleBattleMode = (key) => setBattleModes(prev => ({ ...prev, [key]: !prev[key] }));

  // Build teams array for arena: [[0,1],[2,3]] for 2v2
  const buildTeams = () => {
    const teams = [];
    let idx = 0;
    for (const size of teamSizes) {
      teams.push(Array.from({ length: size }, (_, j) => idx + j));
      idx += size;
    }
    return teams;
  };

  const addBot = (slotIdx) => {
    const usedNames = new Set(slots.filter(Boolean).map(s => s.name));
    let name;
    do { name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (usedNames.has(name));
    setSlots(prev => {
      const n = [...prev];
      n[slotIdx] = { name, email: `bot_${slotIdx}_${Date.now()}@system`, isBot: true };
      return n;
    });
  };

  const handleCreate = () => {
    if (selectedCases.length === 0 || totalCost > balance) return;
    // Only pass slots that are actually filled — empty slots stay empty (waiting for real players)
    const players = slots.map(s => s ? s : null).filter(Boolean);
    onCreate({ selectedCases, modeLabel, teams: buildTeams(), players, battleModes, totalPlayers });
  };

  const allFilled = slots.every(s => s !== null);
  const canCreate = selectedCases.length > 0 && totalCost <= balance && slots[0] !== null;

  // Get team index for a slot index
  const getTeamIdx = (slotIdx) => {
    let idx = 0;
    for (let ti = 0; ti < teamSizes.length; ti++) {
      if (slotIdx < idx + teamSizes[ti]) return ti;
      idx += teamSizes[ti];
    }
    return 0;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">Create Battle</h1>

        <div className="flex items-center gap-1.5 text-sm text-white/50 flex-wrap">
          <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
            <span className="text-[8px] font-black text-black">$</span>
          </div>
          <span>Battle cost</span>
          <span className="text-amber-400 font-bold">{totalCost.toLocaleString()}</span>
          {/* Active mode icons */}
          {Object.entries(battleModes).filter(([,v]) => v).map(([key]) => {
            const MODE_META = { crazy: '🎭', terminal: '⚡', jackpot: '👑', group: '🔄', magic_spin: '✨', fast_mode: '💨' };
            return MODE_META[key] ? (
              <span key={key} title={key.replace('_',' ')} className="text-base leading-none">{MODE_META[key]}</span>
            ) : null;
          })}
        </div>

        {/* Mode dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            Players: <span className="font-bold">{modeLabel}</span>
            <ChevronDown className="w-4 h-4 text-white/40" />
          </button>
          {showModeDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden z-50 min-w-[140px] shadow-2xl">
              {MODES.map(m => (
                <button key={m.label} onClick={() => handleModeChange(m.label)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                    ${modeLabel === m.label ? 'bg-pink-500 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleCreate} disabled={!canCreate}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl font-bold px-6 disabled:opacity-40">
          <Plus className="w-4 h-4 mr-1.5" /> Create Battle
        </Button>
      </div>

      {/* Selected Cases */}
      <div className="bg-[#12121c] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Selected Cases</h2>
          {selectedCases.length > 0 && (
            <span className="text-xs text-white/40 bg-white/5 rounded-full px-2.5 py-1">
              {selectedCases.length} case{selectedCases.length !== 1 ? 's' : ''} · {selectedCases.length} round{selectedCases.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedCases.map((c, i) => {
            const rarity = c.price >= 5000 ? 'legendary' : c.price >= 1000 ? 'epic' : c.price >= 500 ? 'rare' : c.price >= 100 ? 'uncommon' : 'common';
            return (
              <div key={i} className="relative group">
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 w-[100px]">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRarityColor(rarity)} flex items-center justify-center overflow-hidden`}>
                    {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                  </div>
                  <p className="text-[10px] text-white/60 text-center leading-tight truncate w-full">{c.name}</p>
                  <p className="text-[10px] text-amber-400 font-bold">{c.price?.toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedCases(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}
          <button onClick={() => setShowPicker(true)}
            className="w-[100px] h-[130px] bg-white/[0.02] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-violet-400/40 hover:bg-violet-500/5 transition-all">
            <Plus className="w-6 h-6 text-white/30" />
            <span className="text-xs text-white/30">Add Cases</span>
          </button>
        </div>
      </div>

      {/* Players / Teams */}
      <div className="bg-[#12121c] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Players</h2>
          {!allFilled && (
            <button onClick={fillWithBots}
              className="flex items-center gap-1.5 text-xs text-purple-400 border border-purple-400/30 rounded-lg px-3 py-1.5 hover:bg-purple-500/10 transition-all">
              <Bot className="w-3.5 h-3.5" /> Fill with Bots
            </button>
          )}
        </div>
        <div className="flex gap-4 flex-wrap">
          {teamSizes.map((size, ti) => {
            const startIdx = teamSizes.slice(0, ti).reduce((a, b) => a + b, 0);
            const color = TEAM_COLORS[ti];
            return (
              <div key={ti} className="flex-1 min-w-[120px]">
                <p className="text-xs font-bold mb-2" style={{ color }}>{`Team ${ti + 1}`}</p>
                <div className="space-y-2">
                  {Array.from({ length: size }, (_, j) => {
                    const slotIdx = startIdx + j;
                    const slot = slots[slotIdx];
                    return (
                      <div key={slotIdx}
                        className="flex items-center gap-2 p-2 rounded-xl border transition-all"
                        style={{ borderColor: slot ? color + '44' : 'rgba(255,255,255,0.06)', background: slot ? color + '11' : 'rgba(255,255,255,0.02)' }}>
                        {slot ? (
                          <>
                            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: color + '33', color }}>
                              {slot.isBot ? '🤖' : slot.avatar_url
                                ? <img src={slot.avatar_url} alt="" className="w-full h-full object-cover" />
                                : slot.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">{slot.name}</p>
                              {slot.isBot && <p className="text-[9px]" style={{ color }}>BOT</p>}
                            </div>
                            {slotIdx !== 0 && (
                              <button onClick={() => removeSlot(slotIdx)} className="text-white/20 hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center gap-2 text-white/20">
                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </div>
                            <span className="text-xs">Empty slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle Mode */}
      <div className="bg-[#12121c] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-base font-bold text-white mb-4">Battle mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BATTLE_MODES.map(m => (
            <div key={m.key} onClick={() => toggleBattleMode(m.key)} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
              ${battleModes[m.key] ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
              <span className="text-xl mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{m.label}</p>
                <p className="text-[11px] text-white/35 mt-0.5 leading-tight">{m.desc}</p>
              </div>
              <div className={`w-9 h-5 rounded-full flex-shrink-0 mt-0.5 transition-all relative ${battleModes[m.key] ? 'bg-violet-500' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${battleModes[m.key] ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalCost > balance && (
        <p className="text-center text-red-400 text-sm">Insufficient balance — need {totalCost.toLocaleString()} coins</p>
      )}

      <CasePickerModal open={showPicker} onOpenChange={setShowPicker} cases={cases} onAddCase={(c) => setSelectedCases(prev => [...prev, c])} />
    </div>
  );
}