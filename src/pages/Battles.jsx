import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, rollItem, getRarityColor } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Trophy, Users, CheckCircle, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateBattle from '../components/game/CreateBattle';
import BattleArena from '../components/game/BattleArena';

const BOT_NAMES = ['Alpha', 'Blitz', 'Cipher', 'Delta', 'Echo', 'Forge', 'Ghost', 'Havoc', 'Inferno', 'Jester'];



export default function Battles() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [battles, setBattles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'create' | 'arena'
  const [view, setView] = useState('list');
  const [arenaData, setArenaData] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [, setTick] = useState(0);
  const arenaDataRef = React.useRef(null);

  useEffect(() => {
    loadBattles();
    base44.entities.CaseTemplate.list().then(all => setCases(all.filter(c => c.is_active !== false)));
    const unsub = base44.entities.CaseBattle.subscribe(() => loadBattles());
    // Re-render every second so expiry countdowns update in real-time
    const ticker = setInterval(() => setTick(t => t + 1), 1000);
    return () => { unsub(); clearInterval(ticker); };
  }, []);

  const loadBattles = async () => {
    const data = await base44.entities.CaseBattle.list('-created_date', 20);
    setBattles(data);
    setLoading(false);
  };

  // Called from CreateBattle when user hits "Create Battle"
  const handleCreate = async ({ selectedCases, modeLabel, teams, players, battleModes, totalPlayers }) => {
    if (!user || selectedCases.length === 0) return;
    const totalCost = selectedCases.reduce((s, c) => s + c.price, 0);
    if (totalCost > balance) return;

    const firstName = selectedCases[0].name;
    const caseName = selectedCases.length === 1 ? firstName : `${firstName} +${selectedCases.length - 1} more`;

    await updateBalance(-totalCost, 'battle_entry', `Created battle: ${caseName}`);

    const filledPlayers = players.map(p => ({ email: p.email, name: p.name, isBot: p.isBot, total_value: 0, items_won: [] }));
    const maxPlayers = totalPlayers;

    // Only start immediately if every slot has a bot or player filled in CreateBattle
    const allFilled = filledPlayers.length >= maxPlayers && filledPlayers.every(p => p.email);
    const status = allFilled ? 'in_progress' : 'waiting';

    const battle = await base44.entities.CaseBattle.create({
      creator_email: user.email,
      case_template_id: selectedCases[0].id,
      case_name: caseName,
      rounds: selectedCases.length,
      max_players: maxPlayers,
      entry_cost: totalCost,
      status,
      battle_modes: battleModes,
      mode_label: modeLabel,
      teams_config: JSON.stringify(teams),
      players: filledPlayers,
    });

    const selectedCasesArr = [...selectedCases];
    const newArenaData = { battle, selectedCases: selectedCasesArr, teams, modeLabel, battleModes };
    arenaDataRef.current = newArenaData;
    setArenaData(newArenaData);
    setView('arena');
    loadBattles();
  };

  // Called when user joins an existing waiting battle
  const handleJoin = async (battle) => {
    if (battle.entry_cost > balance) return;
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (!caseTemplate) return;

    await updateBalance(-battle.entry_cost, 'battle_entry', `Joined battle: ${battle.case_name}`);

    // Add player to first empty slot
    const updatedPlayers = [...(battle.players || [])];
    const emptySlotIdx = updatedPlayers.findIndex(p => !p.email || p.email === '');
    const joinerSlot = { email: user.email, name: user.full_name || 'Player', isBot: false, total_value: 0, items_won: [] };
    if (emptySlotIdx >= 0) {
      updatedPlayers[emptySlotIdx] = joinerSlot;
    } else {
      updatedPlayers.push(joinerSlot);
    }

    const rounds = battle.rounds || 1;
    const selectedCasesArr = Array.from({ length: rounds }, () => caseTemplate);

    await base44.entities.CaseBattle.update(battle.id, { players: updatedPlayers });

    // Show arena to joined player
    const teams = battle.teams_config ? JSON.parse(battle.teams_config) : [updatedPlayers.map((_, i) => i)];
    const joinArenaData = { 
      battle: { ...battle, players: updatedPlayers },
      selectedCases: selectedCasesArr, 
      teams,
      modeLabel: battle.mode_label || '1v1',
      battleModes: battle.battle_modes || {}
    };
    arenaDataRef.current = joinArenaData;
    setArenaData(joinArenaData);
    setView('arena');
    loadBattles();
  };

  const makeBot = () => ({
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    email: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}@system`,
    isBot: true,
    total_value: 0,
    items_won: []
  });

  // Centralized function to update arena state & ref together
  const updateArena = (updatedBattle) => {
    setArenaData(prev => {
      if (!prev) return prev;
      const next = { ...prev, battle: updatedBattle };
      arenaDataRef.current = next;
      return next;
    });
  };

  // Add one bot to the next empty slot
  const handleAddBotToArena = async () => {
    const current = arenaDataRef.current;
    if (!current) return;
    const battle = current.battle;
    if (!battle?.id) return;
    const maxPlayers = battle.max_players || 2;
    const existingPlayers = (battle.players || []).filter(p => p && p.email);
    if (existingPlayers.length >= maxPlayers) return;

    const updatedPlayers = [...existingPlayers, makeBot()];
    const allFilled = updatedPlayers.length >= maxPlayers;
    const patch = { players: updatedPlayers, ...(allFilled ? { status: 'in_progress' } : {}) };

    await base44.entities.CaseBattle.update(battle.id, patch);
    updateArena({ ...battle, ...patch });
    loadBattles();
  };

  // Fill ALL empty slots with bots and start immediately
  const handleFillBots = async () => {
    const current = arenaDataRef.current;
    if (!current) return;
    const battle = current.battle;
    if (!battle?.id) return;
    const maxPlayers = battle.max_players || 2;
    const existingPlayers = (battle.players || []).filter(p => p && p.email);
    const updatedPlayers = [...existingPlayers];
    while (updatedPlayers.length < maxPlayers) {
      updatedPlayers.push(makeBot());
    }
    const patch = { players: updatedPlayers, status: 'in_progress' };

    await base44.entities.CaseBattle.update(battle.id, patch);
    updateArena({ ...battle, ...patch });
    loadBattles();
  };

  // Called from BattleArena when it detects the battle updated in DB
  const handleBattleUpdated = (updatedBattle) => {
    const caseTemplate = cases.find(c => c.id === updatedBattle.case_template_id);
    if (!caseTemplate) return;
    const rounds = updatedBattle.rounds || 1;
    const selectedCasesArr = Array.from({ length: rounds }, () => caseTemplate);
    const teams = updatedBattle.teams_config ? JSON.parse(updatedBattle.teams_config) : [(updatedBattle.players || []).map((_, i) => i)];
    const newData = {
      battle: updatedBattle,
      selectedCases: selectedCasesArr,
      teams,
      modeLabel: updatedBattle.mode_label || '1v1',
      battleModes: updatedBattle.battle_modes || {},
    };
    arenaDataRef.current = newData;
    setArenaData(newData);
    loadBattles();
  };

  // Watch / spectate an in-progress battle
  const handleWatch = (battle) => {
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (!caseTemplate) return;
    const rounds = battle.rounds || 1;
    const selectedCasesArr = Array.from({ length: rounds }, () => caseTemplate);
    const players = battle.players || [];
    const teams = battle.teams_config ? JSON.parse(battle.teams_config) : [players.map((_, i) => i)];
    const battleModes = battle.battle_modes || {};
    const modeLabel = battle.mode_label || '1v1';
    setArenaData({ battle, selectedCases: selectedCasesArr, players, teams, modeLabel, battleModes, spectate: true });
    setView('arena');
  };

  // Called from BattleArena when battle finishes — payout is already the correct per-winner amount
  const handleArenaReward = async (payout) => {
    if (!user) return;
    if (!arenaData?.spectate) {
      await updateBalance(payout, 'battle_win', `Won battle — ${payout.toLocaleString()} coins`);
      await addXp(150);
    }
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
    const arenaBattle = arenaData.battle;
    const arenaPlayers = arenaBattle?.players || [];
    const arenaStatus = arenaBattle?.status || 'waiting';

    return (
      <BattleArena
        key={`${arenaBattle?.id}-${arenaStatus}-${arenaPlayers.length}`}
        battle={arenaBattle}
        selectedCases={arenaData.selectedCases}
        players={arenaPlayers}
        teams={arenaData.teams}
        modeLabel={arenaData.modeLabel}
        battleModes={arenaData.battleModes || {}}
        userEmail={user?.email}
        balance={balance}
        onClose={() => setView('list')}
        onReward={handleArenaReward}
        onJoin={() => arenaBattle && handleJoin(arenaBattle)}
        onAddBot={handleAddBotToArena}
        onFillBots={handleFillBots}
        onBattleUpdated={handleBattleUpdated}
      />
    );
  }

  const waitingBattles = battles.filter(b => b.status === 'waiting' || b.status === 'in_progress');

  // Completed battles: only show those finished within the last 1 minute
  const ONE_MIN_MS = 1 * 60 * 1000;
  const completedBattles = battles.filter(b => {
    if (b.status !== 'completed') return false;
    const updatedAt = b.updated_date ? new Date(b.updated_date).getTime() : 0;
    return Date.now() - updatedAt < ONE_MIN_MS;
  });

  const sortedWaitingBattles = [...waitingBattles].sort((a, b) => {
    if (sortBy === 'price_desc') return (b.entry_cost || 0) - (a.entry_cost || 0);
    if (sortBy === 'price_asc') return (a.entry_cost || 0) - (b.entry_cost || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Swords className="w-7 h-7" /> Battles
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg pl-3 pr-8 hover:border-white/20 transition-all"
            >
              <option value="recent">Sort By: Recent</option>
              <option value="price_desc">Sort By: Price Descending</option>
              <option value="price_asc">Sort By: Price Ascending</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          <Button
            onClick={() => setView('create')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Battle
          </Button>
        </div>
      </div>

      {/* Open Battles List */}
      {waitingBattles.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Swords className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No open battles right now</p>
          <p className="text-white/20 text-xs mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWaitingBattles.map((b) => {
            const caseTemplate = cases.find(c => c.id === b.case_template_id);
            const items = caseTemplate?.items || [];
            const isCreator = b.creator_email === user?.email;
            const isLive = b.status === 'in_progress';
            
            return (
              <div key={b.id} className="glass border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Rounds & Mode */}
                  <div className="flex items-center gap-3 min-w-fit">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-bold text-white">{b.rounds} Rounds</span>
                        {b.battle_modes?.crazy && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">Crazy</span>}
                        {b.battle_modes?.jackpot && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">Jackpot</span>}
                        {!b.battle_modes?.crazy && !b.battle_modes?.jackpot && <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">Normal mode</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {(b.players || []).slice(0, 4).map((p, i) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {p.name?.[0] || '?'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Case Items */}
                  <div className="flex items-center gap-2 min-w-fit flex-shrink-0">
                    {items.slice(0, Math.min(5, b.rounds || 1)).map((item, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden"
                        style={{ backgroundImage: `url('${item.image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                    ))}
                  </div>

                  {/* Right: Stats & Action */}
                  <div className="flex items-center gap-4 min-w-fit ml-auto">
                    <div className="text-right flex flex-col gap-1">
                      <span className="text-xs text-white/40">{b.players?.length || 1}/{b.max_players || 2} Rounds</span>
                      <span className="text-xs text-white/30">Total value</span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs">💰</span>
                        <span className="font-bold text-white">{b.entry_cost?.toLocaleString()}</span>
                      </div>
                    </div>
                    {isLive ? (
                      <Button
                        onClick={() => handleWatch(b)}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white rounded-lg min-w-max"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Watch
                      </Button>
                    ) : !isCreator ? (
                      <Button
                        onClick={() => handleJoin(b)}
                        disabled={b.entry_cost > balance}
                        size="sm"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg min-w-max"
                      >
                        Join Battle
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const rounds = b.rounds || 1;
                          const caseTemplate = cases.find(c => c.id === b.case_template_id);
                          const selectedCasesArr = caseTemplate ? Array.from({ length: rounds }, () => caseTemplate) : [];
                          const teams = b.teams_config ? JSON.parse(b.teams_config) : [b.players?.map((_, i) => i) || []];
                          const viewData = { battle: b, selectedCases: selectedCasesArr, teams, modeLabel: b.mode_label || '1v1', battleModes: b.battle_modes || {} };
                          arenaDataRef.current = viewData;
                          setArenaData(viewData);
                          setView('arena');
                        }}
                        size="sm"
                        className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg min-w-max"
                      >
                        View Battle
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}