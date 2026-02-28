import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Zap, Send, Crown, Shield, Badge } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import UserStatsModal from './UserStatsModal';

const MOCK_MESSAGES = [
  { id: 1, user: 'ShadowKing', level: 9, text: 'just hit legendary on celestial!!', time: '2m' },
  { id: 2, user: 'xXProGamerXx', level: 4, text: 'gn everyone 🌙', time: '3m' },
  { id: 3, user: 'LuckyDrop', level: 12, text: 'anyone doing battles?', time: '4m' },
  { id: 4, user: 'VoidSlayer', level: 7, text: 'this site is actually insane', time: '5m' },
  { id: 5, user: 'NeonRacer', level: 2, text: 'free cases when?? 😂', time: '6m' },
  { id: 6, user: 'CrystalBlade', level: 18, text: 'crash is rigged lol jk', time: '7m' },
  { id: 7, user: 'StarForge', level: 5, text: 'just lost everything on upgrade rip', time: '8m' },
];

export default function LiveChat() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('chat'); // 'chat' | 'drops'
  const [recentDrops, setRecentDrops] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Fetch all users for role info
      base44.asServiceRole.entities.User.list().then(users => {
        const roles = {};
        users.forEach(u => {
          roles[u.full_name] = u.role;
        });
        setUserRoles(roles);
      }).catch(() => {});
    }).catch(() => {});
    
    base44.entities.UserInventory.list('-created_date', 10).then(d => setRecentDrops(d.filter(i => i.status === 'owned' && ['case_opening', 'battle_win'].includes(i.source))));

    const unsubInventory = base44.entities.UserInventory.subscribe((event) => {
      if (event.type === 'create' && ['case_opening', 'battle_win'].includes(event.data.source)) {
        setRecentDrops(prev => [event.data, ...prev].slice(0, 10));
      }
    });
    return unsubInventory;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const newMsg = {
      id: Date.now(),
      user: user.full_name || 'Player',
      level: user.level || 1,
      text: input.trim(),
      time: 'now',
      isMe: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b15] border-l border-white/[0.06]">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors
            ${tab === 'chat' ? 'text-white border-b-2 border-violet-500' : 'text-white/30 hover:text-white/60'}`}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </button>
        <button
          onClick={() => setTab('drops')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors
            ${tab === 'drops' ? 'text-white border-b-2 border-amber-500' : 'text-white/30 hover:text-white/60'}`}
        >
          <Zap className="w-3.5 h-3.5" /> Live Drops
        </button>
      </div>

      {tab === 'chat' ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5">
                    {msg.user[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 rounded px-1">{msg.level}</span>
                      <button
                        onClick={() => setSelectedUser(msg)}
                        className={`text-[11px] font-semibold hover:text-violet-300 transition-colors ${msg.isMe ? 'text-violet-300' : 'text-white/70'}`}
                      >
                        {msg.user}
                      </button>
                      {userRoles[msg.user] === 'admin' && <Crown className="w-3 h-3 text-amber-400" title="Admin" />}
                      {userRoles[msg.user] === 'owner' && <Crown className="w-3.5 h-3.5 text-yellow-500" title="Owner" />}
                      {userRoles[msg.user] === 'mod' && <Shield className="w-3 h-3 text-blue-400" title="Moderator" />}
                      <span className="text-[9px] text-white/20 ml-auto">{msg.time}</span>
                    </div>
                    <p className="text-[12px] text-white/60 leading-relaxed break-words">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg border border-white/[0.07] px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter message..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none"
              />
              <button type="submit" className="text-white/30 hover:text-violet-400 transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {recentDrops.length === 0 ? (
            <p className="text-white/20 text-xs text-center pt-8">No drops yet</p>
          ) : (
            recentDrops.map((drop, i) => (
              <motion.div
                key={drop.id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5 bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (RARITY_COLORS[drop.rarity] || '#9ca3af') + '22', border: `1px solid ${(RARITY_COLORS[drop.rarity] || '#9ca3af')}44` }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: RARITY_COLORS[drop.rarity] || '#9ca3af' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/80 truncate">{drop.item_name}</p>
                  <p className="text-[10px] text-white/30">{drop.source_case || 'case'}</p>
                </div>
                <span className="text-[11px] font-bold text-amber-400">{drop.value?.toLocaleString()}</span>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}