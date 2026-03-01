import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Award, Trophy, TrendingUp, Zap, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [topWins, setTopWins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = await base44.entities.User.list('-level', 20);
    setUsers(allUsers);

    const wins = await base44.entities.UserInventory.list('-value', 10);
    setTopWins(wins);
    setLoading(false);
  };

  const podiumColors = [
    'from-amber-400 to-amber-600',
    'from-zinc-300 to-zinc-500',
    'from-orange-400 to-orange-600',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-white/40 text-sm">Top players and biggest wins</p>
      </div>

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="levels" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 rounded-lg">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Top Levels
          </TabsTrigger>
          <TabsTrigger value="wins" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg">
            <Trophy className="w-3.5 h-3.5 mr-1.5" /> Biggest Wins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels">
          {/* Top 3 Podium */}
          <div className="flex justify-center items-end gap-4 mb-6 pt-8">
            {[1, 0, 2].map((rank) => {
              const u = users[rank];
              if (!u) return null;
              const heights = ['h-32', 'h-24', 'h-20'];
              return (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rank * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${podiumColors[rank]} overflow-hidden flex items-center justify-center mb-2 shadow-lg`}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-lg font-bold text-white">{u.full_name?.[0]?.toUpperCase() || '?'}</span>}
                  </div>
                  <p className="text-sm font-semibold text-white mb-1 max-w-[100px] truncate text-center">{u.is_anonymous ? `Anon #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
                  <p className="text-xs text-violet-400 font-semibold mb-2">Level {u.level || 1}</p>
                  <div className={`w-24 ${heights[rank]} rounded-t-xl bg-gradient-to-b ${podiumColors[rank]} flex items-center justify-center`}>
                    {rank === 0 && <Crown className="w-8 h-8 text-white/80" />}
                    {rank !== 0 && <span className="text-2xl font-bold text-white/80">#{rank + 1}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rest of list */}
          <div className="space-y-2">
            {users.slice(3).map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5"
              >
                <span className="text-sm font-bold text-white/30 w-8 text-center">#{i + 4}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-sm font-bold text-white">
                  {u.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{u.full_name || 'Player'}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-violet-500/10 rounded-lg px-3 py-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">Lv {u.level || 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wins">
          <div className="space-y-2">
            {topWins.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5"
              >
                <span className="text-sm font-bold text-white/30 w-8 text-center">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.item_name}</p>
                  <p className="text-[11px] text-white/30">from {item.source_case || item.source}</p>
                </div>
                <p className="text-lg font-bold text-amber-400">{item.value?.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}