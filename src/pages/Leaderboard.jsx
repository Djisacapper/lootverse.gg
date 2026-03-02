import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, Crown, Flame, Gift, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Leaderboard() {
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the syncLeaderboard function which runs with service role (no 403)
      const result = await base44.functions.invoke('syncLeaderboard', {});
      // result.entries is the top 10 array returned by the function
      setTop10(result?.entries || result?.data?.entries || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumStyle = (rank) => {
    const styles = {
      0: { color: 'from-yellow-400 via-yellow-500 to-amber-600', height: 'h-40', width: 'w-28' },
      1: { color: 'from-slate-300 via-slate-400 to-slate-600', height: 'h-32', width: 'w-24' },
      2: { color: 'from-orange-300 via-orange-400 to-orange-600', height: 'h-28', width: 'w-20' },
    };
    return styles[rank] || styles[2];
  };

  const getAvatar = (u, large = false) => {
    if (u.avatar_url && u.avatar_url !== 'null') {
      return <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />;
    }
    return (
      <span className={`${large ? 'text-3xl' : 'text-sm'} font-black text-white`}>
        {u.username?.[0]?.toUpperCase() || '?'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white/70 text-sm">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (top10.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Trophy className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">No players on the leaderboard yet.</p>
        <p className="text-white/20 text-xs">Check back soon!</p>
      </div>
    );
  }

  const PodiumSection = ({ users, wagerLabel = 'Wagered', wagerColor = 'text-violet-300', medals = ['🥇', '🥈', '🥉'] }) => (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent rounded-3xl blur-2xl" />
      <div className="relative flex justify-center items-end gap-2 px-4 pt-12 pb-8">
        {[1, 0, 2].map((rank) => {
          const u = users[rank];
          if (!u) return null;
          const style = getPodiumStyle(rank);
          return (
            <motion.div
              key={rank}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: rank * 0.15, duration: 0.6, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <div className="text-4xl mb-2">{medals[rank]}</div>
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${style.color} overflow-hidden flex items-center justify-center mb-4 shadow-2xl border-4 border-white/20`}
              >
                {getAvatar(u, true)}
              </motion.div>
              <p className="text-sm font-bold text-white text-center max-w-[120px] truncate">
                {u.username || 'Player'}
              </p>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">Level {u.level || 1}</p>
              <div className="text-[10px] text-white/60 mt-1 text-center">
                <p>{wagerLabel}</p>
                <p className={`${wagerColor} font-bold`}>${(u.total_wagered || 0).toLocaleString()}</p>
              </div>
              <div className={`${style.width} ${style.height} rounded-t-3xl bg-gradient-to-b ${style.color} flex items-end justify-center pb-3 mt-4 shadow-2xl relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="text-2xl font-black text-white/90 relative z-10">#{rank + 1}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

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
          <PodiumSection users={top10} wagerLabel="Wagered" wagerColor="text-violet-300" medals={['🥇', '🥈', '🥉']} />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> Top 10
            </h3>
            {top10.slice(3).map((u, i) => (
              <motion.div
                key={u.user_email || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (i + 3) * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-violet-500/30 transition-colors"
              >
                <span className="text-lg font-bold text-violet-400 w-8 text-center">#{i + 4}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 overflow-hidden flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {getAvatar(u)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.username || 'Player'}</p>
                  <p className="text-[10px] text-white/40">Wagered: ${(u.total_wagered || 0).toLocaleString()}</p>
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
          <PodiumSection users={top10} wagerLabel="This Week" wagerColor="text-amber-300" medals={['🔥', '⚡', '💫']} />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl px-6 py-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">Weekly Rewards</span>
              </div>
              <p className="text-[10px] text-white/60">Top 3 earn bonus coins next Sunday</p>
            </div>
          </motion.div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" /> This Week
            </h3>
            {top10.slice(3).map((u, i) => (
              <motion.div
                key={u.user_email || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (i + 3) * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-amber-500/30 transition-colors"
              >
                <span className="text-lg font-bold text-amber-400 w-8 text-center">#{i + 4}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 overflow-hidden flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {getAvatar(u)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.username || 'Player'}</p>
                  <p className="text-[10px] text-white/40">This week: ${(u.total_wagered || 0).toLocaleString()}</p>
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