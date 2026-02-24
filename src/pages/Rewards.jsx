import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Gift, Star, Zap, Flame, Calendar, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';

const STREAK_REWARDS = [
  { day: 1, coins: 50, label: 'Day 1' },
  { day: 2, coins: 100, label: 'Day 2' },
  { day: 3, coins: 150, label: 'Day 3' },
  { day: 4, coins: 200, label: 'Day 4' },
  { day: 5, coins: 300, label: 'Day 5' },
  { day: 6, coins: 500, label: 'Day 6' },
  { day: 7, coins: 1000, label: 'Day 7', special: true },
];

export default function Rewards() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [lastReward, setLastReward] = useState(null);
  const [streak, setStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadRewards();
  }, [user]);

  const loadRewards = async () => {
    const rewards = await base44.entities.DailyReward.filter(
      { user_email: user.email },
      '-created_date',
      1
    );
    if (rewards.length > 0) {
      const last = rewards[0];
      setLastReward(last);
      setStreak(last.streak || 0);
      const lastDate = moment(last.claimed_date || last.created_date).startOf('day');
      const today = moment().startOf('day');
      const diff = today.diff(lastDate, 'days');
      setCanClaim(diff >= 1);
      if (diff > 1) setStreak(0); // streak broken
    } else {
      setCanClaim(true);
      setStreak(0);
    }
  };

  const handleClaim = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);

    const newStreak = canClaim && lastReward && moment().diff(moment(lastReward.claimed_date || lastReward.created_date).startOf('day'), 'days') === 1
      ? (streak % 7) + 1
      : 1;

    const reward = STREAK_REWARDS.find(r => r.day === newStreak) || STREAK_REWARDS[0];

    await base44.entities.DailyReward.create({
      user_email: user.email,
      reward_type: 'coins',
      reward_value: reward.coins,
      streak: newStreak,
      claimed_date: moment().format('YYYY-MM-DD'),
    });

    await updateBalance(reward.coins, 'daily_reward', `Daily reward Day ${newStreak}: ${reward.coins} coins`);
    await addXp(25);

    setStreak(newStreak);
    setCanClaim(false);
    setClaiming(false);
    setClaimed(true);
  };

  const currentDay = canClaim ? (streak % 7) + 1 : streak;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Daily Rewards</h1>
        <p className="text-white/40 text-sm">Come back every day to earn coins and maintain your streak</p>
      </div>

      {/* Streak Header */}
      <div className="glass rounded-3xl p-6 border border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-orange-400" />
          <span className="text-xl font-bold text-white">{streak} Day Streak</span>
        </div>
        <p className="text-white/30 text-sm mb-6">
          {canClaim ? 'Your daily reward is ready!' : 'Come back tomorrow for your next reward'}
        </p>

        {/* Streak Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {STREAK_REWARDS.map((reward) => {
            const isClaimed = reward.day <= streak && !canClaim;
            const isNext = reward.day === currentDay && canClaim;
            const isLocked = reward.day > currentDay || (reward.day === currentDay && !canClaim && reward.day > streak);

            return (
              <motion.div
                key={reward.day}
                whileHover={{ scale: 1.05 }}
                className={`rounded-xl p-3 border transition-all relative
                  ${isNext ? 'border-amber-400/40 bg-amber-500/10 glow-gold' : ''}
                  ${isClaimed ? 'border-green-500/20 bg-green-500/5' : ''}
                  ${!isNext && !isClaimed ? 'border-white/5 bg-white/[0.02]' : ''}
                `}
              >
                {reward.special && (
                  <Star className="w-3 h-3 text-amber-400 absolute top-1 right-1" />
                )}
                <div className="flex flex-col items-center gap-1">
                  {isClaimed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : isLocked && !isNext ? (
                    <Lock className="w-5 h-5 text-white/10" />
                  ) : (
                    <Gift className={`w-5 h-5 ${isNext ? 'text-amber-400' : 'text-white/20'}`} />
                  )}
                  <span className="text-[10px] text-white/40">{reward.label}</span>
                  <span className={`text-xs font-bold ${isNext ? 'text-amber-400' : isClaimed ? 'text-green-400' : 'text-white/20'}`}>
                    {reward.coins}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Claim Button */}
        {claimed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-6 py-3 rounded-xl border border-green-500/20"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Claimed! +{STREAK_REWARDS.find(r => r.day === streak)?.coins || 50} coins</span>
          </motion.div>
        ) : (
          <Button
            onClick={handleClaim}
            disabled={!canClaim || claiming}
            className={`h-12 px-8 rounded-xl text-base ${
              canClaim
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {claiming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Gift className="w-5 h-5 mr-2" />
            )}
            {canClaim ? `Claim Day ${currentDay} Reward` : 'Come Back Tomorrow'}
          </Button>
        )}
      </div>
    </div>
  );
}