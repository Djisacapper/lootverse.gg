import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, rollItem, getRarityColor } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Trophy, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CasePickerModal from '../components/game/CasePickerModal';

export default function Battles() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [battles, setBattles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);

  useEffect(() => {
    loadBattles();
    base44.entities.CaseTemplate.filter({ is_active: true }).then(setCases);
    const unsub = base44.entities.CaseBattle.subscribe(() => loadBattles());
    return unsub;
  }, []);

  const loadBattles = async () => {
    const data = await base44.entities.CaseBattle.list('-created_date', 20);
    setBattles(data);
    setLoading(false);
  };

  const handleAddCase = (c) => {
    setSelectedCases(prev => [...prev, c]);
  };

  const handleRemoveCase = (index) => {
    setSelectedCases(prev => prev.filter((_, i) => i !== index));
  };

  const totalCost = selectedCases.reduce((sum, c) => sum + c.price, 0);

  const handleCreate = async () => {
    if (selectedCases.length === 0) return;
    if (totalCost > balance) return;

    const firstName = selectedCases[0].name;
    const caseName = selectedCases.length === 1 ? firstName : `${firstName} +${selectedCases.length - 1} more`;

    await updateBalance(-totalCost, 'battle_entry', `Created battle with ${caseName}`);

    await base44.entities.CaseBattle.create({
      creator_email: user.email,
      case_template_id: selectedCases[0].id,
      case_name: caseName,
      rounds: selectedCases.length,
      max_players: 2,
      entry_cost: totalCost,
      status: 'waiting',
      players: [{
        email: user.email,
        name: user.full_name || 'Player',
        total_value: 0,
        items_won: [],
      }],
    });

    setShowCreate(false);
    setSelectedCases([]);
    loadBattles();
  };

  const handleJoin = async (battle) => {
    if (battle.entry_cost > balance) return;

    const selectedCase = cases.find(c => c.id === battle.case_template_id);
    if (!selectedCase) return;

    await updateBalance(-battle.entry_cost, 'battle_entry', `Joined battle ${battle.case_name}`);

    // Simulate rounds for both players
    const p1Items = [];
    const p2Items = [];
    let p1Total = 0;
    let p2Total = 0;

    for (let i = 0; i < battle.rounds; i++) {
      const item1 = rollItem(selectedCase.items || []);
      const item2 = rollItem(selectedCase.items || []);
      if (item1) { p1Items.push({ name: item1.name, value: item1.value, rarity: item1.rarity }); p1Total += item1.value; }
      if (item2) { p2Items.push({ name: item2.name, value: item2.value, rarity: item2.rarity }); p2Total += item2.value; }
    }

    const existingPlayers = battle.players || [];
    const winnerEmail = p1Total >= p2Total ? existingPlayers[0]?.email : user.email;
    const totalPot = battle.entry_cost * 2;

    const updatedPlayers = [
      { ...existingPlayers[0], total_value: p1Total, items_won: p1Items },
      { email: user.email, name: user.full_name || 'Player', total_value: p2Total, items_won: p2Items },
    ];

    await base44.entities.CaseBattle.update(battle.id, {
      status: 'completed',
      players: updatedPlayers,
      winner_email: winnerEmail,
    });

    if (winnerEmail === user.email) {
      await updateBalance(totalPot, 'battle_win', `Won battle for ${totalPot}`);
      await addXp(150);
    }

    setActiveBattle({
      ...battle,
      players: updatedPlayers,
      winner_email: winnerEmail,
    });

    loadBattles();
  };

  const waitingBattles = battles.filter(b => b.status === 'waiting');
  const completedBattles = battles.filter(b => b.status === 'completed').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Case Battles</h1>
          <p className="text-white/40 text-sm">PvP case opening — highest total value wins</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Battle
        </Button>
      </div>

      {/* Active Battle Result */}
      <AnimatePresence>
        {activeBattle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Battle Result</h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveBattle(null)} className="text-white/40">
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {activeBattle.players?.map((p, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${p.email === activeBattle.winner_email ? 'border-amber-400/40 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {p.email === activeBattle.winner_email && <Trophy className="w-4 h-4 text-amber-400" />}
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400 mb-3">{p.total_value?.toLocaleString()} coins</p>
                  <div className="space-y-1">
                    {p.items_won?.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <div className={`w-4 h-4 rounded bg-gradient-to-br ${getRarityColor(item.rarity)}`} />
                        <span className="text-white/60">{item.name}</span>
                        <span className="text-amber-400/60 ml-auto">{item.value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting Battles */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Open Battles ({waitingBattles.length})
        </h3>
        {waitingBattles.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <Swords className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">No open battles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {waitingBattles.map((b) => (
              <div key={b.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-red-400/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{b.case_name}</p>
                    <p className="text-[11px] text-white/30">{b.rounds} rounds</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/30">Entry Cost</p>
                    <p className="text-lg font-bold text-amber-400">{b.entry_cost?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Users className="w-3.5 h-3.5" />
                    {b.players?.length || 1}/{b.max_players || 2} players
                  </div>
                  {b.creator_email !== user?.email ? (
                    <Button
                      onClick={() => handleJoin(b)}
                      disabled={b.entry_cost > balance}
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl"
                    >
                      <Swords className="w-3.5 h-3.5 mr-1.5" /> Join
                    </Button>
                  ) : (
                    <Badge className="bg-white/5 text-white/30 border-white/10">Your Battle</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      {completedBattles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Recent Battles</h3>
          <div className="space-y-2">
            {completedBattles.map((b) => (
              <div key={b.id} className="glass rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-white/60">{b.case_name} · {b.rounds}R</span>
                <span className="text-amber-400 font-semibold">{(b.entry_cost * 2)?.toLocaleString()} pot</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) setSelectedCases([]); }}>
        <DialogContent className="bg-[#13131e] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Battle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-white/50 mb-2 block">Selected Cases ({selectedCases.length} rounds)</label>
              <div className="grid grid-cols-4 gap-2 min-h-[80px]">
                {selectedCases.map((c, i) => (
                  <div key={i} className="relative bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleRemoveCase(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                    </div>
                    <p className="text-[9px] text-white/50 text-center leading-tight truncate w-full text-center">{c.name}</p>
                  </div>
                ))}
                <button
                  onClick={() => setShowCasePicker(true)}
                  className="bg-white/[0.03] border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-1 py-3 hover:border-violet-400/40 hover:bg-violet-500/5 transition-all min-h-[80px]"
                >
                  <Plus className="w-5 h-5 text-white/30" />
                  <span className="text-[10px] text-white/30">Add Cases</span>
                </button>
              </div>
            </div>

            {selectedCases.length > 0 && (
              <p className="text-sm text-white/40">
                Entry cost: <span className="text-amber-400 font-semibold">{totalCost.toLocaleString()} coins</span>
                {totalCost > balance && <span className="text-red-400 ml-2">(insufficient balance)</span>}
              </p>
            )}

            <Button
              onClick={handleCreate}
              disabled={selectedCases.length === 0 || totalCost > balance}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl h-12"
            >
              Create Battle · {selectedCases.length} round{selectedCases.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Case Picker Modal */}
      <CasePickerModal
        open={showCasePicker}
        onOpenChange={setShowCasePicker}
        cases={cases}
        onAddCase={(c) => { handleAddCase(c); }}
      />
    </div>
  );
}