import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Box, Swords, Coins, TrendingUp, Zap, Gift, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GAME_CARDS = [
  {
    name: 'Battles',
    desc: 'PvP case battles — highest value wins',
    page: 'Battles',
    size: 'large',
    gradient: 'from-purple-900 via-indigo-900 to-[#0d0d1f]',
    accent: '#a855f7',
    emoji: '⚔️',
    img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&q=80',
  },
  {
    name: 'Cases',
    desc: 'Unbox premium items',
    page: 'Cases',
    size: 'large',
    gradient: 'from-violet-900 via-purple-900 to-[#0d0d1f]',
    accent: '#8b5cf6',
    emoji: '📦',
    img: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&q=80',
  },
  {
    name: 'Coinflip',
    desc: '1v1 winner takes all',
    page: 'Coinflip',
    size: 'small',
    gradient: 'from-yellow-900 via-amber-900 to-[#0d0d1f]',
    accent: '#f59e0b',
    emoji: '🪙',
  },
  {
    name: 'Upgrade',
    desc: 'Risk items for better loot',
    page: 'Upgrade',
    size: 'small',
    gradient: 'from-green-900 via-emerald-900 to-[#0d0d1f]',
    accent: '#22c55e',
    emoji: '⬆️',
  },
  {
    name: 'Crash',
    desc: 'Cash out before it crashes',
    page: 'Crash',
    size: 'small',
    gradient: 'from-red-900 via-rose-900 to-[#0d0d1f]',
    accent: '#ef4444',
    emoji: '📈',
  },
];

export default function Home() {
  const { user, loading } = useWallet();
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

  const largCards = GAME_CARDS.filter(g => g.size === 'large');
  const smallCards = GAME_CARDS.filter(g => g.size === 'small');

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.07]"
        style={{ background: 'linear-gradient(135deg, #1a0a3a 0%, #0f0f2a 50%, #0a1a3a 100%)', minHeight: 220 }}
      >
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating coin art */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 opacity-60">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-pulse-slow">
            <span className="text-3xl font-black text-white/90">$</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/30" style={{ marginTop: -30 }}>
            <span className="text-lg font-black text-white/90">✦</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30" style={{ marginTop: 20 }}>
            <Box className="w-7 h-7 text-white/80" />
          </div>
        </div>

        <div className="relative z-10 p-8 md:p-10 max-w-lg">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-3">Welcome to Lootverse</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
            Open Cases.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400">Win Big!</span>
          </h1>
          <p className="text-white/40 text-sm mb-6 max-w-sm">
            Step into a world of luck and excitement where every spin and bet brings you closer to amazing rewards.
          </p>
          <div className="flex gap-3">
            <Link to={createPageUrl('Leaderboard')}>
              <Button className="bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 rounded-lg h-10 px-5 text-sm font-semibold shadow-lg shadow-violet-500/30">
                <Award className="w-4 h-4 mr-2" /> View Leaderboard
              </Button>
            </Link>
            <Link to={createPageUrl('Rewards')}>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg h-10 px-5 text-sm">
                <Gift className="w-4 h-4 mr-2" /> Rewards
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Magic Games */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white">Magic Games</h2>
        </div>

        {/* Large 2-col top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {largCards.map((card, i) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={createPageUrl(card.page)}>
                <div
                  className="relative overflow-hidden rounded-xl border border-white/[0.07] h-44 flex items-end p-5 group cursor-pointer transition-all hover:border-white/15 hover:scale-[1.01]"
                  style={{ background: `linear-gradient(135deg, ${card.accent}22 0%, #0d0d20 70%)` }}
                >
                  {/* BG image */}
                  {card.img && (
                    <div
                      className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center"
                      style={{ backgroundImage: `url(${card.img})` }}
                    />
                  )}
                  {/* Glow */}
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30"
                    style={{ backgroundColor: card.accent }}
                  />
                  {/* Big emoji art */}
                  <div className="absolute top-4 right-5 text-6xl opacity-70 group-hover:scale-110 transition-transform">
                    {card.emoji}
                  </div>
                  <div className="relative z-10">
                    <div
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ backgroundColor: card.accent + '25', color: card.accent }}
                    >
                      {card.name}
                    </div>
                    <p className="text-white/50 text-xs">{card.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Small 3-col bottom row */}
        <div className="grid grid-cols-3 gap-3">
          {smallCards.map((card, i) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 + i * 0.06 }}
            >
              <Link to={createPageUrl(card.page)}>
                <div
                  className="relative overflow-hidden rounded-xl border border-white/[0.07] h-32 flex items-end p-4 group cursor-pointer transition-all hover:border-white/15 hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg, ${card.accent}22 0%, #0d0d20 70%)` }}
                >
                  <div
                    className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-25"
                    style={{ backgroundColor: card.accent }}
                  />
                  <div className="absolute top-3 right-3 text-4xl opacity-60 group-hover:scale-110 transition-transform">
                    {card.emoji}
                  </div>
                  <div className="relative z-10">
                    <div
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase mb-1"
                      style={{ backgroundColor: card.accent + '25', color: card.accent }}
                    >
                      {card.name}
                    </div>
                    <p className="text-white/40 text-[10px] leading-tight">{card.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Cases */}
      {featuredCases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white">Featured Cases</h2>
            </div>
            <Link to={createPageUrl('Cases')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredCases.map((c) => (
              <Link key={c.id} to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-xl p-4 text-center group cursor-pointer transition-all hover:scale-[1.02]">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-white/[0.06] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Box className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-white mb-1 truncate">{c.name}</h3>
                  <p className="text-[11px] font-bold text-amber-400">{c.price?.toLocaleString()} coins</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}