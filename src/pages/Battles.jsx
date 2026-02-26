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
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [rounds, setRounds] = useState(3);
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

  const handleCreate = async () => {
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (!selectedCase) return;
    const cost = selectedCase.price * rounds;
    if (cost > balance) return;

    await updateBalance(-cost, 'battle_entry', `Created battle with ${selectedCase.name}`);

    await base44.entities.CaseBattle.create({
      creator_email: user.email,
      case_template_id: selectedCaseId,
      case_name: selectedCase.name,
      rounds,
      max_players: 2,
      entry_cost: cost,
      status: 'waiting',
      players: [{
        email: user.email,
        name: user.full_name || 'Player',
        total_value: 0,
        items_won: [],
      }],
    });

    setShowCreate(false);
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#16161f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Battle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-white/50 mb-2 block">Select Case</label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="Choose a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.price} coins)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/50 mb-2 block">Rounds</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${rounds === r ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
                  >
                    {r}R
                  </button>
                ))}
              </div>
            </div>
            {selectedCaseId && (
              <p className="text-sm text-white/40">
                Entry cost: <span className="text-amber-400 font-semibold">
                  {((cases.find(c => c.id === selectedCaseId)?.price || 0) * rounds).toLocaleString()} coins
                </span>
              </p>
            )}
            <Button
              onClick={handleCreate}
              disabled={!selectedCaseId}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl h-12"
            >
              Create Battle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}