import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Award, Trophy, TrendingUp, Zap, Crown, Flame, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [top10, setTop10] = useState([]);
  const [weeklyUsers, setWeeklyUsers] = useState([]);
  const [userWagers, setUserWagers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allUsers = await base44.entities.User.list('-level', 100);
      setUsers(allUsers.slice(0, 10));
      setTop10(allUsers.slice(0, 10));
      // Weekly leaderboard is same as level-based (you can modify to use timestamp if needed)
      setWeeklyUsers(allUsers.slice(0, 10));

      // Fetch wager data for each user
      const wagers = {};
      for (const u of allUsers.slice(0, 10)) {
        const transactions = await base44.entities.Transaction.filter({ user_email: u.email }, '', 100);
        const totalWagered = transactions.reduce((sum, t) => {
          if (['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type)) {
            return sum + Math.abs(t.amount);
          }
          return sum;
        }, 0);
        wagers[u.id] = totalWagered;
      }
      setUserWagers(wagers);
      setLoading(false);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setLoading(false);
    }
  };

  const getPodiumStyle = (rank) => {
    const styles = {
      0: { color: 'from-yellow-400 via-yellow-500 to-amber-600', height: 'h-40', width: 'w-28', iconSize: 'w-10 h-10' },
      1: { color: 'from-slate-300 via-slate-400 to-slate-600', height: 'h-32', width: 'w-24', iconSize: 'w-8 h-8' },
      2: { color: 'from-orange-300 via-orange-400 to-orange-600', height: 'h-28', width: 'w-20', iconSize: 'w-7 h-7' },
    };
    return styles[rank] || styles[2];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-2">🏆 LEADERBOARD</h1>
        <p className="text-white/40 text-sm">Compete, climb, and earn exclusive rewards</p>
      </div>

      <Tabs defaultValue="all-time" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="all-time" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 rounded-lg">
            <Crown className="w-3.5 h-3.5 mr-1.5" /> All-Time
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg">
            <Flame className="w-3.5 h-3.5 mr-1.5" /> Weekly
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 overflow-hidden flex items-center justify-center text-sm font-bold text-white">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.full_name?.[0]?.toUpperCase() || '?')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{u.is_anonymous ? `Anonymous #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
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