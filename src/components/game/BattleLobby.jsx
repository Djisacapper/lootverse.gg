import React, { useState } from 'react';
import { ArrowLeft, Users, Bot, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const BOT_NAMES = ['Alpha', 'Blitz', 'Cipher', 'Delta', 'Echo', 'Forge', 'Ghost', 'Havoc', 'Inferno', 'Jester'];
const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

export default function BattleLobby({ battle, cases, teams, user, onBack, onStart, onAddBot }) {
  const maxPlayers = battle.max_players || 2;
  const players = battle.players || [];
  const emptySlots = maxPlayers - players.length;
  const isCreator = battle.creator_email === user?.email;
  const isFull = emptySlots === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{battle.case_name}</h1>
          <p className="text-sm text-white/40">{battle.rounds} rounds • Entry: {battle.entry_cost?.toLocaleString()} coins</p>
        </div>
      </div>

      {/* Lobby Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-white/5">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase">Players</p>
            <p className="text-2xl font-bold text-white">{players.length}/{maxPlayers}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase">Mode</p>
            <p className="text-sm text-white font-semibold">{battle.mode_label || '1v1'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase">Status</p>
            <p className={`text-sm font-semibold ${isFull ? 'text-green-400' : 'text-amber-400'}`}>
              {isFull ? 'Ready' : `${emptySlots} slot${emptySlots !== 1 ? 's' : ''} open`}
            </p>
          </div>
        </div>

        {/* Player Slots */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase mb-3">Players</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Current players */}
            {players.map((player, idx) => {
              const teamIdx = teams ? teams.findIndex(t => t.includes(idx)) : 0;
              const teamColor = TEAM_COLORS[teamIdx % TEAM_COLORS.length];
              return (
                <motion.div key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: teamColor + '33', color: teamColor, border: `2px solid ${teamColor}66` }}>
                    {player.isBot ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                    {player.isBot && <p className="text-[10px] text-white/40">BOT</p>}
                    {player.email === user?.email && <p className="text-[10px] text-amber-400 font-semibold">YOU</p>}
                  </div>
                  {player.email === battle.creator_email && (
                    <Badge className="bg-white/10 text-white/60 border-white/10 text-[10px]">Creator</Badge>
                  )}
                </motion.div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <motion.div key={`empty-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/10 bg-white/[0.01]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Users className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/30">Empty Slot</p>
                </div>
                {isCreator && (
                  <Button
                    onClick={() => onAddBot(idx)}
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Bot
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={onBack} variant="outline" className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {isCreator && (
          <Button
            onClick={onStart}
            disabled={!isFull}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl disabled:opacity-40 flex-1 md:flex-none"
          >
            {isFull ? 'Start Battle' : `Waiting for ${emptySlots} more player${emptySlots !== 1 ? 's' : ''}...`}
          </Button>
        )}
      </div>

      {/* Info */}
      {!isCreator && (
        <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
          <p className="text-sm text-blue-400">Waiting for the creator to start the battle...</p>
        </div>
      )}
    </div>
  );
}