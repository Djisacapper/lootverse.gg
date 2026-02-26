import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, rollItem, getRarityColor } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Trophy, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateBattle from '../components/game/CreateBattle';
import BattleArena from '../components/game/BattleArena';



export default function Battles() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [battles, setBattles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'create' | 'arena'
  const [view, setView] = useState('list');
  const [arenaData, setArenaData] = useState(null);

  useEffect(() => {
    loadBattles();
    base44.entities.CaseTemplate.list().then(all => setCases(all.filter(c => c.is_active !== false)));
    const unsub = base44.entities.CaseBattle.subscribe(() => loadBattles());
    return unsub;
  }, []);

  const loadBattles = async () => {
    const data = await base44.entities.CaseBattle.list('-created_date', 20);
    setBattles(data);
    setLoading(false);
  };

  // Called from CreateBattle when user hits "Create Battle"
  const handleCreate = async ({ selectedCases, modeLabel, teams, players, battleModes }) => {
    if (!user || selectedCases.length === 0) return;
    const totalCost = selectedCases.reduce((s, c) => s + c.price, 0);
    if (totalCost > balance) return;

    const firstName = selectedCases[0].name;
    const caseName = selectedCases.length === 1 ? firstName : `${firstName} +${selectedCases.length - 1} more`;

    await updateBalance(-totalCost, 'battle_entry', `Created battle: ${caseName}`);

    const battle = await base44.entities.CaseBattle.create({
      creator_email: user.email,
      case_template_id: selectedCases[0].id,
      case_name: caseName,
      rounds: selectedCases.length,
      max_players: players.length,
      entry_cost: totalCost,
      status: 'in_progress',
      players: players.map(p => ({ email: p.email, name: p.name, total_value: 0, items_won: [] })),
    });

    setArenaData({ battle, selectedCases, players, teams, modeLabel, battleModes });
    setView('arena');
    loadBattles();
  };

  // Called when user joins an existing waiting battle
  const handleJoin = async (battle) => {
    if (battle.entry_cost > balance) return;
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (!caseTemplate) return;

    await updateBalance(-battle.entry_cost, 'battle_entry', `Joined battle: ${battle.case_name}`);

    const rounds = battle.rounds || 1;
    const selectedCases = Array.from({ length: rounds }, () => caseTemplate);
    const creator = battle.players?.[0] || { email: battle.creator_email, name: 'Player 1' };
    const players = [
      { ...creator, isBot: false },
      { name: user.full_name || 'You', email: user.email, isBot: false },
    ];

    await base44.entities.CaseBattle.update(battle.id, { status: 'in_progress' });

    setArenaData({ battle, selectedCases, players, mode: { total: 2, label: '1v1' } });
    setView('arena');
  };

  // Called from BattleArena when battle finishes
  const handleArenaReward = async (totalPot) => {
    if (!user) return;
    await updateBalance(totalPot, 'battle_win', `Won battle — ${totalPot} coins`);
    await addXp(150);
    if (arenaData?.battle?.id) {
      await base44.entities.CaseBattle.update(arenaData.battle.id, { status: 'completed' });
    }
    loadBattles();
  };

  if (view === 'create') {
    return (
      <CreateBattle
        cases={cases}
        balance={balance}
        user={user}
        onBack={() => setView('list')}
        onCreate={handleCreate}
      />
    );
  }

  if (view === 'arena' && arenaData) {
    return (
      <BattleArena
        battle={arenaData.battle}
        selectedCases={arenaData.selectedCases}
        players={arenaData.players}
        teams={arenaData.teams}
        modeLabel={arenaData.modeLabel}
        battleModes={arenaData.battleModes || {}}
        userEmail={user?.email}
        onClose={() => setView('list')}
        onReward={handleArenaReward}
      />
    );
  }

  // List view — tab state
  const [tab, setTab] = useState('open');

  const waitingBattles = battles.filter(b => b.status === 'waiting' || b.status === 'in_progress');

  // Completed battles: only show those finished within the last 3 minutes
  const THREE_MIN_MS = 3 * 60 * 1000;
  const completedBattles = battles.filter(b => {
    if (b.status !== 'completed') return false;
    const updatedAt = b.updated_date ? new Date(b.updated_date).getTime() : 0;
    return Date.now() - updatedAt < THREE_MIN_MS;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Case Battles</h1>
          <p className="text-white/40 text-sm">PvP case opening — highest total value wins</p>
        </div>
        <Button
          onClick={() => setView('create')}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Battle
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setTab('open')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'open' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <Swords className="w-4 h-4" /> Open
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'open' ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-white/30'}`}>
            {waitingBattles.length}
          </span>
        </button>
        <button
          onClick={() => setTab('finished')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'finished' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <CheckCircle className="w-4 h-4" /> Finished
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'finished' ? 'bg-green-500/30 text-green-300' : 'bg-white/5 text-white/30'}`}>
            {completedBattles.length}
          </span>
        </button>
      </div>

      {/* Open Battles Tab */}
      {tab === 'open' && (
        <AnimatePresence mode="wait">
          <motion.div key="open" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {waitingBattles.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl">
                <Swords className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">No open battles right now</p>
                <p className="text-white/20 text-xs mt-1">Create one to get started</p>
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
          </motion.div>
        </AnimatePresence>
      )}

      {/* Finished Battles Tab */}
      {tab === 'finished' && (
        <AnimatePresence mode="wait">
          <motion.div key="finished" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {completedBattles.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl">
                <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">No recently finished battles</p>
                <p className="text-white/20 text-xs mt-1">Finished battles disappear after 3 minutes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedBattles.map((b) => {
                  const pot = (b.entry_cost || 0) * (b.max_players || 2);
                  const elapsed = Date.now() - new Date(b.updated_date).getTime();
                  const remaining = Math.max(0, THREE_MIN_MS - elapsed);
                  const secLeft = Math.ceil(remaining / 1000);
                  return (
                    <div key={b.id} className="glass rounded-2xl p-5 border border-white/5 border-green-400/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{b.case_name}</p>
                          <p className="text-[11px] text-white/30">{b.rounds} rounds · {b.max_players || 2} players</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/30">Total Pot</p>
                          <p className="text-lg font-bold text-amber-400">{pot.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-green-400/80">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                        <span className="text-[10px] text-white/25">Expires in {secLeft}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}