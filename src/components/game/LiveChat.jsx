import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Zap, Send, Crown, Shield, Badge, Smile, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import UserStatsModal from './UserStatsModal';

const EMOJIS = ['😀', '😂', '😍', '🔥', '💯', '👑', '🎉', '🎮', '⚡', '✨', '🌙', '💎', '🚀', '👻', '🤔', '😎', '🤖', '🎲', '💰', '🏆'];

const EmojiPicker = ({ onEmojiClick, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
    <button
    type="button"
    onClick={() => setOpen(!open)}
    className={`text-[#b0a89f]/50 hover:text-[#d4af37] smooth-transition ${className}`}
    >
    <Smile className="w-3.5 h-3.5" />
    </button>
    {open && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute bottom-full right-0 mb-2 bg-[#1a1815] border border-[#d4af37]/20 rounded-lg p-2 grid grid-cols-5 gap-1 w-40 shadow-lg"
    >
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onEmojiClick(emoji);
                setOpen(false);
              }}
              className="text-lg hover:bg-[#d4af37]/10 rounded p-1 smooth-transition"
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const MOCK_MESSAGES = [
  { id: 1, user: 'ShadowKing', level: 9, text: 'just hit legendary on celestial!!', time: '2m' },
  { id: 2, user: 'xXProGamerXx', level: 4, text: 'gn everyone 🌙', time: '3m' },
  { id: 3, user: 'LuckyDrop', level: 12, text: 'anyone doing battles?', time: '4m' },
  { id: 4, user: 'VoidSlayer', level: 7, text: 'this site is actually insane', time: '5m' },
  { id: 5, user: 'NeonRacer', level: 2, text: 'free cases when?? 😂', time: '6m' },
  { id: 6, user: 'CrystalBlade', level: 18, text: 'crash is rigged lol jk', time: '7m' },
  { id: 7, user: 'StarForge', level: 5, text: 'just lost everything on upgrade rip', time: '8m' },
];

export default function LiveChat({ onClose }) {
  const [messages, setMessages] = useState([]);
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
      // Fetch user roles via backend function
      base44.functions.invoke('getAllUserRoles').then(res => {
        setUserRoles(res.data || {});
      }).catch(() => {});
    }).catch(() => {});
    
    // Fetch initial messages
    base44.entities.ChatMessage.list('-created_date', 50).then(msgs => {
      setMessages(msgs.reverse().map(m => ({
        id: m.id,
        user: m.user_name,
        avatar_url: m.avatar_url,
        level: m.level,
        text: m.text,
        time: 'recent'
      })));
    });

    // Subscribe to new messages
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, {
          id: event.data.id,
          user: event.data.user_name,
          avatar_url: event.data.avatar_url,
          level: event.data.level,
          text: event.data.text,
          time: 'now'
        }]);
      }
    });
    
    base44.entities.UserInventory.list('-created_date', 10).then(d => setRecentDrops(d.filter(i => i.status === 'owned' && ['case_opening', 'battle_win'].includes(i.source))));

    const unsubInventory = base44.entities.UserInventory.subscribe((event) => {
      if (event.type === 'create' && ['case_opening', 'battle_win'].includes(event.data.source)) {
        setRecentDrops(prev => [event.data, ...prev].slice(0, 10));
      }
    });
    
    return () => {
      unsubChat();
      unsubInventory();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const displayName = user.is_anonymous
      ? `Anonymous #${user.id?.slice(-4) || '????'}`
      : (user.username || user.full_name || 'Player');
    try {
      await base44.entities.ChatMessage.create({
        user_name: displayName,
        user_email: user.email,
        avatar_url: user.is_anonymous ? null : (user.avatar_url || null),
        level: user.level || 1,
        text: input.trim()
      });
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] border-l border-[#00d9ff]/10">
      {selectedUser && <UserStatsModal userName={selectedUser.user} userEmail={selectedUser.user} onClose={() => setSelectedUser(null)} currentUser={user} />}
      {/* Tabs Header */}
      <div className="flex border-b border-[#00d9ff]/10 items-center justify-between">
        <div className="flex flex-1">
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold smooth-transition
              ${tab === 'chat' ? 'text-[#00d9ff] border-b-2 border-[#00d9ff]' : 'text-[#a0a0b0] hover:text-[#00d9ff]'}`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setTab('drops')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold smooth-transition
              ${tab === 'drops' ? 'text-[#ff006e] border-b-2 border-[#ff006e]' : 'text-[#a0a0b0] hover:text-[#00d9ff]'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Live Drops
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-[#a0a0b0] hover:text-[#ff006e] smooth-transition mr-1"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] overflow-hidden flex items-center justify-center text-[9px] font-bold text-[#0a0805] flex-shrink-0 mt-0.5">
                    {msg.avatar_url
                      ? <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      : msg.user[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold bg-[#d4af37]/20 text-[#f4c430] rounded px-1">{msg.level}</span>
                      <button
                        onClick={() => setSelectedUser(msg)}
                        className={`text-[11px] font-semibold hover:text-[#f4c430] smooth-transition ${msg.isMe ? 'text-[#d4af37]' : 'text-[#b0a89f]'}`}
                      >
                        {msg.user}
                      </button>
                      {userRoles[msg.user] === 'admin' && <Crown className="w-3 h-3 text-[#f4c430]" title="Admin" />}
                      {userRoles[msg.user] === 'owner' && <Crown className="w-3.5 h-3.5 text-[#d4af37]" title="Owner" />}
                      {userRoles[msg.user] === 'mod' && <Shield className="w-3 h-3 text-[#b8860b]" title="Moderator" />}
                      <span className="text-[9px] text-[#b0a89f]/40 ml-auto">{msg.time}</span>
                    </div>
                    <p className="text-[12px] text-[#b0a89f] leading-relaxed break-words">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#d4af37]/10">
            <div className="flex items-center gap-2 bg-[#1a1815] rounded-lg border border-[#d4af37]/15 px-3 py-2 smooth-transition hover:border-[#d4af37]/30">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter message..."
                className="flex-1 bg-transparent text-xs text-[#fafaf8] placeholder:text-[#b0a89f]/40 outline-none"
              />
              <EmojiPicker onEmojiClick={(emoji) => setInput(input + emoji)} />
              <button type="submit" className="text-[#b0a89f] hover:text-[#d4af37] smooth-transition">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {recentDrops.length === 0 ? (
            <p className="text-[#b0a89f]/30 text-xs text-center pt-8">No drops yet</p>
          ) : (
            recentDrops.map((drop, i) => (
              <motion.div
                key={drop.id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5 bg-[#1a1815] rounded-lg p-2.5 border border-[#d4af37]/10"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (RARITY_COLORS[drop.rarity] || '#b0a89f') + '20', border: `1px solid ${(RARITY_COLORS[drop.rarity] || '#b0a89f')}40` }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: RARITY_COLORS[drop.rarity] || '#b0a89f' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#fafaf8] truncate">{drop.item_name}</p>
                  <p className="text-[10px] text-[#b0a89f]/50">{drop.source_case || 'case'}</p>
                </div>
                <span className="text-[11px] font-bold text-[#f4c430]">{drop.value?.toLocaleString()}</span>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}