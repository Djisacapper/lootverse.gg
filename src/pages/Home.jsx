import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import WalletBar from '../components/game/WalletBar';
import LiveFeed from '../components/game/LiveFeed';
import { motion } from 'framer-motion';
import { Box, Swords, Coins, TrendingUp, Zap, Gift, Award, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GAME_MODES = [
  { name: 'Cases', desc: 'Open cases & win items', icon: Box, page: 'Cases', gradient: 'from-violet-600 to-indigo-600', glow: 'glow-purple' },
  { name: 'Battles', desc: 'PvP case battles', icon: Swords, page: 'Battles', gradient: 'from-red-500 to-rose-600', glow: '' },
  { name: 'Coinflip', desc: '1v1 coin flip', icon: Coins, page: 'Coinflip', gradient: 'from-amber-500 to-orange-600', glow: 'glow-gold' },
  { name: 'Crash', desc: 'Ride the multiplier', icon: TrendingUp, page: 'Crash', gradient: 'from-green-500 to-emerald-600', glow: 'glow-green' },
  { name: 'Upgrade', desc: 'Risk it for more', icon: Zap, page: 'Upgrade', gradient: 'from-cyan-500 to-blue-600', glow: '' },
];

export default function Home() {
  const { user, balance, level, xpProgress, loading } = useWallet();
  const [featuredCases, setFeaturedCases] = useState([]);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }, '-created_date', 4).then(setFeaturedCases);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-[#12121a] to-indigo-600/20 border border-white/5 p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-widest text-amber-400/80 font-medium">Welcome back, {user?.full_name || 'Player'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Open. Win. <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Dominate.</span>
          </h1>
          <p className="text-white/40 text-lg mb-8 max-w-xl">
            The next-gen case opening platform. Fair odds, epic rewards, and intense PvP battles.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('Cases')}>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-12 px-6 text-base">
                <Box className="w-5 h-5 mr-2" /> Open Cases
              </Button>
            </Link>
            <Link to={createPageUrl('Rewards')}>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12 px-6 text-base">
                <Gift className="w-5 h-5 mr-2" /> Daily Rewards
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Wallet */}
      <WalletBar balance={balance} level={level} xpProgress={xpProgress} />

      {/* Live Feed */}
      <LiveFeed />

      {/* Game Modes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Game Modes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_MODES.map((mode, i) => (
            <motion.div
              key={mode.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={createPageUrl(mode.page)}>
                <div className={`glass glass-hover rounded-2xl p-5 text-center group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${mode.glow}`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <mode.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{mode.name}</h3>
                  <p className="text-[11px] text-white/30">{mode.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Cases */}
      {featuredCases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Featured Cases</h2>
            <Link to={createPageUrl('Cases')} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCases.map((c) => (
              <Link key={c.id} to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                <div className="glass glass-hover rounded-2xl p-4 text-center group cursor-pointer transition-all hover:scale-[1.02]">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <Box className="w-10 h-10 text-violet-400" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{c.name}</h3>
                  <p className="text-xs text-amber-400 font-medium">{c.price?.toLocaleString()} coins</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}