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
      const entries = await base44.entities.LeaderboardEntry.list('-total_wagered', 10);
setTop10(entries);
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

        <TabsContent value="all-time" className="space-y-6">
          {/* Top 3 Cinematic Podium */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent rounded-3xl blur-2xl" />
            <div className="relative flex justify-center items-end gap-2 px-4 pt-12 pb-8">
              {[1, 0, 2].map((rank) => {
                const u = top10[rank];
                if (!u) return null;
                const style = getPodiumStyle(rank);
                const medal = ['🥇', '🥈', '🥉'][rank];
                return (
                  <motion.div
                    key={rank}
                    initial={{ opacity: 0, y: 40, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: rank * 0.15, duration: 0.6, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    {/* Medal */}
                    <div className="text-4xl mb-2">{medal}</div>
                    
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${style.color} overflow-hidden flex items-center justify-center mb-4 shadow-2xl border-4 border-white/20`}
                    >
                      {u.avatar_url && u.avatar_url !== 'null'
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-3xl font-black text-white">{u.full_name?.[0]?.toUpperCase() || '?'}</span>}
                    </motion.div>

                    {/* Name & Level */}
                    <p className="text-sm font-bold text-white text-center max-w-[120px] truncate">{u.is_anonymous ? `Anon #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">Level {u.level || 1}</p>

                    {/* Wagers */}
                    <div className="text-[10px] text-white/60 mt-1 text-center">
                      <p>Wagered</p>
                      <p className="text-violet-300 font-bold">${(userWagers[u.id] || 0).toLocaleString()}</p>
                    </div>

                    {/* Podium */}
                    <div className={`${style.width} ${style.height} rounded-t-3xl bg-gradient-to-b ${style.color} flex items-end justify-center pb-3 mt-4 shadow-2xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <span className="text-2xl font-black text-white/90 relative z-10">#{rank + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Top 10 List */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> Top 10
            </h3>
            {top10.slice(3).map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (i + 3) * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-violet-500/30 transition-colors"
              >
                <span className="text-lg font-bold text-violet-400 w-8 text-center">#{i + 4}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 overflow-hidden flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {u.avatar_url && u.avatar_url !== 'null'
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.full_name?.[0]?.toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.is_anonymous ? `Anonymous #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
                  <p className="text-[10px] text-white/40">Wagered: ${(userWagers[u.id] || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-violet-500/10 rounded-lg px-3 py-1.5 flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">Lv {u.level || 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {/* Weekly Podium */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-3xl blur-2xl" />
            <div className="relative flex justify-center items-end gap-2 px-4 pt-12 pb-8">
              {[1, 0, 2].map((rank) => {
                const u = weeklyUsers[rank];
                if (!u) return null;
                const style = getPodiumStyle(rank);
                const medal = ['🔥', '⚡', '💫'][rank];
                return (
                  <motion.div
                    key={`weekly-${rank}`}
                    initial={{ opacity: 0, y: 40, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: rank * 0.15, duration: 0.6, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    {/* Medal */}
                    <div className="text-4xl mb-2">{medal}</div>
                    
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${style.color} overflow-hidden flex items-center justify-center mb-4 shadow-2xl border-4 border-white/20`}
                    >
                      {u.avatar_url && u.avatar_url !== 'null'
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-3xl font-black text-white">{u.full_name?.[0]?.toUpperCase() || '?'}</span>}
                    </motion.div>

                    {/* Name & Level */}
                    <p className="text-sm font-bold text-white text-center max-w-[120px] truncate">{u.is_anonymous ? `Anon #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">Level {u.level || 1}</p>

                    {/* Wagers */}
                    <div className="text-[10px] text-white/60 mt-1 text-center">
                      <p>This Week</p>
                      <p className="text-amber-300 font-bold">${(userWagers[u.id] || 0).toLocaleString()}</p>
                    </div>

                    {/* Podium */}
                    <div className={`${style.width} ${style.height} rounded-t-3xl bg-gradient-to-b ${style.color} flex items-end justify-center pb-3 mt-4 shadow-2xl relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <span className="text-2xl font-black text-white/90 relative z-10">#{rank + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly Reward Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-8"
            >
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">Weekly Rewards</span>
                </div>
                <p className="text-[10px] text-white/60">Top 3 earn bonus coins next Sunday</p>
              </div>
            </motion.div>
          </div>

          {/* Weekly Top 10 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" /> This Week
            </h3>
            {weeklyUsers.slice(3).map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (i + 3) * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-amber-500/30 transition-colors"
              >
                <span className="text-lg font-bold text-amber-400 w-8 text-center">#{i + 4}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 overflow-hidden flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {u.avatar_url && u.avatar_url !== 'null'
                    ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (u.full_name?.[0]?.toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.is_anonymous ? `Anonymous #${u.id?.slice(-4)}` : (u.username || u.full_name || 'Player')}</p>
                  <p className="text-[10px] text-white/40">This week: ${(userWagers[u.id] || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-lg px-3 py-1.5 flex-shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Lv {u.level || 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}