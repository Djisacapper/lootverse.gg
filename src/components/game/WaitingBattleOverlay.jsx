import React from 'react';
import { Plus, Users, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const BOT_NAMES = ['Alpha', 'Blitz', 'Cipher', 'Delta', 'Echo', 'Forge', 'Ghost', 'Havoc', 'Inferno', 'Jester'];
const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

export default function WaitingBattleOverlay({ battle, teams, user, balance, onJoin, onAddBot, onStart, onClose }) {
  const maxPlayers = battle.max_players || 2;
  const players = battle.players || [];
  const emptySlots = maxPlayers - players.length;
  const isCreator = battle.creator_email === user?.email;
  const isFull = emptySlots === 0;
  const hasJoined = players.some(p => p.email === user?.email);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl border border-white/10 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">{battle.case_name}</h2>
          <p className="text-sm text-white/40">{battle.rounds} rounds • Entry: {battle.entry_cost?.toLocaleString()} coins</p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-white/40 uppercase mb-1">Players</p>
            <p className="text-2xl font-bold text-white">{players.length}/{maxPlayers}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] text-white/40 uppercase mb-1">Status</p>
            <p className={`text-sm font-bold ${isFull ? 'text-green-400' : 'text-amber-400'}`}>
              {isFull ? 'Ready' : `${emptySlots} open`}
            </p>
          </div>
        </div>

        {/* Player Slots */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-white/40 uppercase">Players</p>
          <div className="space-y-2">
            {/* Current players */}
            {players.map((player, idx) => {
              const teamIdx = teams ? teams.findIndex(t => t.includes(idx)) : 0;
              const teamColor = TEAM_COLORS[teamIdx % TEAM_COLORS.length];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: teamColor + '33', color: teamColor }}
                  >
                    {player.isBot ? '🤖' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{player.name}</p>
                    {player.email === user?.email && <p className="text-[9px] text-amber-400 font-semibold">YOU</p>}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <motion.div
                key={`empty-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.01] border border-dashed border-white/10"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white/20 flex-shrink-0">
                  <Users className="w-3 h-3" />
                </div>
                <p className="text-xs text-white/30 flex-1">Empty Slot</p>
                {isCreator && (
                  <Button
                    onClick={() => onAddBot()}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[10px] h-6 px-2"
                  >
                    <Plus className="w-2.5 h-2.5 mr-1" /> Bot
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!hasJoined && !isCreator && (
            <Button
              onClick={() => onJoin()}
              disabled={battle.entry_cost > balance}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl"
            >
              Join Battle
            </Button>
          )}

          {isCreator && (
            <Button
              onClick={() => onStart()}
              disabled={!isFull}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl disabled:opacity-40"
            >
              {isFull ? 'Start Battle' : `Waiting for ${emptySlots} more...`}
            </Button>
          )}

          {!isCreator && hasJoined && (
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
              <p className="text-xs text-blue-400">Waiting for creator to start...</p>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full rounded-xl"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}