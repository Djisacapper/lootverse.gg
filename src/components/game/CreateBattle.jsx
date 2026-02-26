import React, { useState } from 'react';
import { ArrowLeft, Plus, X, ChevronDown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CasePickerModal from './CasePickerModal';
import { getRarityColor } from './useWallet';

const MODES = [
  { label: '1v1', total: 2 },
  { label: '1v1v1', total: 3 },
  { label: '1v1v1v1', total: 4 },
  { label: '1v1v1v1v1', total: 5 },
  { label: '2v2', total: 4 },
  { label: '3v3', total: 6 },
  { label: '2v2v2', total: 6 },
];

const BATTLE_MODES = [
  { key: 'crazy', icon: '🎭', label: 'Crazy', desc: 'Lowest amount pulled out of the battle wins!' },
  { key: 'terminal', icon: '⚡', label: 'Terminal', desc: 'Only the last case will determine the winner.' },
  { key: 'jackpot', icon: '👑', label: 'Jackpot', desc: 'Winner is determined by a jackpot spin based on unboxed values!' },
  { key: 'group', icon: '🔄', label: 'Group', desc: 'All the profit at the end will split among all players.' },
  { key: 'magic_spin', icon: '✨', label: 'Magic Spin', desc: 'High tier items will be hidden behind a magic spin.' },
  { key: 'fast_mode', icon: '⚡', label: 'Fast Mode', desc: 'Faster gameplay with reduced animation times.' },
];

export default function CreateBattle({ cases, balance, onBack, onCreate }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [modeLabel, setModeLabel] = useState('1v1');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [battleModes, setBattleModes] = useState({});

  const totalCost = selectedCases.reduce((sum, c) => sum + c.price, 0);
  const selectedMode = MODES.find(m => m.label === modeLabel) || MODES[0];

  const handleAddCase = (c) => setSelectedCases(prev => [...prev, c]);
  const handleRemoveCase = (i) => setSelectedCases(prev => prev.filter((_, idx) => idx !== i));
  const toggleBattleMode = (key) => setBattleModes(prev => ({ ...prev, [key]: !prev[key] }));

  const handleCreate = () => {
    if (selectedCases.length === 0 || totalCost > balance) return;
    onCreate({ selectedCases, mode: selectedMode, battleModes });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">Create Battle</h1>

        {/* Total value */}
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <span>Total value</span>
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
              <span className="text-[8px] font-black text-black">$</span>
            </div>
            {totalCost.toLocaleString()}
          </div>
        </div>

        {/* Mode selector */}
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
                <button
                  key={m.label}
                  onClick={() => { setModeLabel(m.label); setShowModeDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                    ${modeLabel === m.label ? 'bg-pink-500 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreate}
          disabled={selectedCases.length === 0 || totalCost > balance}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl font-bold px-6 disabled:opacity-40"
        >
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
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 w-[110px] hover:border-white/20 transition-all">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRarityColor(rarity)} flex items-center justify-center overflow-hidden`}>
                    {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                  </div>
                  <p className="text-[10px] text-white/60 text-center leading-tight">{c.name}</p>
                  <p className="text-[10px] text-amber-400 font-bold">{c.price?.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRemoveCase(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}
          {/* Add Cases tile */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-[110px] h-[142px] bg-white/[0.02] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-violet-400/40 hover:bg-violet-500/5 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white/30" />
            </div>
            <span className="text-xs text-white/30">Add Cases</span>
          </button>
        </div>
      </div>

      {/* Battle Mode */}
      <div className="bg-[#12121c] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-base font-bold text-white mb-4">Battle mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BATTLE_MODES.map(m => (
            <div
              key={m.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
                ${battleModes[m.key] ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
              onClick={() => toggleBattleMode(m.key)}
            >
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

      <CasePickerModal open={showPicker} onOpenChange={setShowPicker} cases={cases} onAddCase={handleAddCase} />
    </div>
  );
}