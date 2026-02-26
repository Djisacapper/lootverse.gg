import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, rollItem, getRarityColor } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Trophy, Users } from 'lucide-react';
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

  // List view
  const waitingBattles = battles.filter(b => b.status === 'waiting' || b.status === 'in_progress');
  const completedBattles = battles.filter(b => b.status === 'completed').slice(0, 5);

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
    </div>
  );
}