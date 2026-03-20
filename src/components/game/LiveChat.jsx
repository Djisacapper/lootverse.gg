import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Zap, Send, Crown, Shield, Smile, X, Sparkles, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import UserStatsModal from './UserStatsModal';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

:root {
  --bg:         #09000f;
  --surface:    #110018;
  --surface2:   #1a0028;
  --border:     rgba(139,92,246,.14);
  --border-h:   rgba(251,191,36,.35);
  --gold:       #fbbf24;
  --purple:     #a855f7;
  --purple-mid: #c084fc;
  --text:       #f0e6ff;
  --text-dim:   rgba(240,230,255,.45);
  --text-faint: rgba(240,230,255,.2);
}

* { box-sizing: border-box; }

.lc {
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

/* ── Tabs ── */
.lc-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.lc-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 11px 0;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-faint);
  transition: color .15s, border-color .15s;
}
.lc-tab:hover { color: var(--text-dim); }
.lc-tab.active-chat {
  color: var(--gold);
  border-bottom-color: var(--gold);
}
.lc-tab.active-drops {
  color: var(--purple-mid);
  border-bottom-color: var(--purple);
}

.lc-close {
  width: 30px; height: 30px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  background: transparent;
  color: var(--text-faint);
  display: flex; align-items: center; justify-content: center;
  margin: 0 8px;
  transition: all .15s;
  flex-shrink: 0;
}
.lc-close:hover {
  border-color: rgba(168,85,247,.4);
  color: var(--text-dim);
}

/* ── Live dot ── */
@keyframes pulseDot {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:.4; transform:scale(.65); }
}
.live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--purple);
  box-shadow: 0 0 6px var(--purple);
  animation: pulseDot 1.4s ease-in-out infinite;
}

/* ── Messages area ── */
.lc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lc-messages::-webkit-scrollbar { width: 3px; }
.lc-messages::-webkit-scrollbar-thumb {
  background: rgba(168,85,247,.15);
  border-radius: 3px;
}

/* ── Message bubble ── */
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.msg-avatar {
  width: 26px; height: 26px;
  border-radius: 7px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #fbbf24);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  color: #fff;
  border: 1px solid rgba(168,85,247,.25);
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}

.msg-level {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(168,85,247,.15);
  border: 1px solid rgba(168,85,247,.25);
  color: var(--purple-mid);
  flex-shrink: 0;
}

.msg-name {
  font-size: 11px;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-dim);
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 110px;
  transition: color .14s;
}
.msg-name:hover { color: var(--text); }
.msg-name.is-me { color: var(--gold); }

.msg-time {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: var(--text-faint);
  flex-shrink: 0;
}

.msg-bubble {
  font-size: 11px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-dim);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0 8px 8px 8px;
  padding: 7px 10px;
  word-break: break-word;
}

/* ── Input ── */
.lc-input-area {
  padding: 10px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.lc-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.msg-input {
  flex: 1;
  height: 34px;
  padding: 0 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}
.msg-input::placeholder { color: var(--text-faint); }
.msg-input:focus { border-color: rgba(168,85,247,.45); }
.msg-input:disabled { opacity: .4; cursor: not-allowed; }

.emoji-trigger {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-faint);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .14s;
}
.emoji-trigger:hover {
  border-color: rgba(168,85,247,.35);
  color: var(--text-dim);
}

.send-btn {
  width: 32px; height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: opacity .15s, transform .15s;
}
.send-btn:hover:not(:disabled) {
  opacity: .88;
  transform: scale(1.06);
}
.send-btn:disabled { opacity: .3; cursor: not-allowed; }

/* ── Emoji picker ── */
.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  width: 158px;
  box-shadow: 0 8px 32px rgba(0,0,0,.7);
  z-index: 100;
}
.emoji-picker button {
  font-size: 16px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 5px;
  transition: background .12s;
}
.emoji-picker button:hover { background: rgba(168,85,247,.15); }

/* ── Drop items ── */
.drop-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface);
  position: relative;
  overflow: hidden;
  transition: border-color .15s;
}

/* ── Empty state ── */
.lc-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
}
.lc-empty p {
  margin: 0;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: .03em;
}
`;

const EMOJIS = ['😀','😂','😍','🔥','💯','👑','🎉','🎮','⚡','✨','🌙','💎','🚀','👻','🤔','😎','🤖','🎲','💰','🏆'];

const RARITY = {
  common:    { color: '#9ca3af', glow: 'rgba(156,163,175,.3)'  },
  uncommon:  { color: '#34d399', glow: 'rgba(52,211,153,.35)'  },
  rare:      { color: '#60a5fa', glow: 'rgba(96,165,250,.4)'   },
  epic:      { color: '#c084fc', glow: 'rgba(192,132,252,.45)' },
  legendary: { color: '#fbbf24', glow: 'rgba(251,191,36,.5)'   },
};
const rs = r => RARITY[r?.toLowerCase()] || RARITY.common;

function EmojiPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        className="emoji-trigger"
        onClick={() => setOpen(v => !v)}
      >
        <Smile style={{ width: 13, height: 13 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="emoji-picker"
            initial={{ opacity: 0, scale: .88, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .88 }}
            transition={{ duration: .14 }}
          >
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => { onPick(e); setOpen(false); }}>
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveChat({ onClose }) {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [user,        setUser]        = useState(null);
  const [tab,         setTab]         = useState('chat');
  const [recentDrops, setRecentDrops] = useState([]);
  const [selectedUser,setSelectedUser]= useState(null);
  const [userRoles,   setUserRoles]   = useState({});
  const bottomRef = useRef(null);

  const enrichDrops = async (rawDrops) => {
    const itemIds = [...new Set(rawDrops.map(d => d.item_id).filter(Boolean))];
    let itemMap = {};
    if (itemIds.length > 0) {
      try {
        const items = await base44.entities.Item.filter({ id: itemIds });
        items.forEach(item => { itemMap[item.id] = item; });
      } catch {}
    }
    return rawDrops.map(d => {
      const item = itemMap[d.item_id] || {};
      return {
        ...d,
        item_image_url: d.item_image_url || item.image_url || item.image || null,
        item_name:      d.item_name      || item.name      || 'Unknown Item',
        rarity:         d.rarity         || item.rarity    || 'common',
        value:          d.value          ?? item.value     ?? 0,
      };
    });
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.functions.invoke('getAllUserRoles').then(res => setUserRoles(res.data || {})).catch(() => {});
    }).catch(() => {});

    base44.entities.ChatMessage.list('-created_date', 50).then(msgs => {
      setMessages(msgs.reverse().map(m => ({
        id: m.id, user: m.user_name, avatar_url: m.avatar_url,
        level: m.level, text: m.text, time: 'recent',
      })));
    });

    const unsubChat = base44.entities.ChatMessage.subscribe(event => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, {
          id: event.data.id, user: event.data.user_name,
          avatar_url: event.data.avatar_url, level: event.data.level,
          text: event.data.text, time: 'now',
        }]);
      }
    });

    base44.entities.UserInventory.list('-created_date', 20).then(async data => {
      const drops = data.filter(i =>
        i.status === 'owned' && ['case_opening', 'battle_win'].includes(i.source)
      );
      const enriched = await enrichDrops(drops);
      setRecentDrops(enriched);
    });

    const unsubInv = base44.entities.UserInventory.subscribe(async event => {
      if (event.type === 'create' && ['case_opening', 'battle_win'].includes(event.data.source)) {
        const [enriched] = await enrichDrops([event.data]);
        setRecentDrops(prev => [enriched, ...prev].slice(0, 30));
      }
    });

    return () => { unsubChat(); unsubInv(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const displayName = user.is_anonymous
      ? `Anonymous #${user.id?.slice(-4) || '????'}`
      : (user.username || user.full_name || 'Player');
    try {
      await base44.entities.ChatMessage.create({
        user_name: displayName, user_email: user.email,
        avatar_url: user.is_anonymous ? null : (user.avatar_url || null),
        level: user.level || 1, text: input.trim(),
      });
      setInput('');
    } catch {}
  };

  return (
    <div className="lc">
      <style>{CSS}</style>

      {selectedUser && (
        <UserStatsModal
          userName={selectedUser.user}
          userEmail={selectedUser.user}
          onClose={() => setSelectedUser(null)}
          currentUser={user}
        />
      )}

      {/* Tabs */}
      <div className="lc-tabs">
        <button
          className={`lc-tab${tab === 'chat' ? ' active-chat' : ''}`}
          onClick={() => setTab('chat')}
        >
          <MessageCircle style={{ width: 12, height: 12 }} />
          Chat
        </button>

        <button
          className={`lc-tab${tab === 'drops' ? ' active-drops' : ''}`}
          onClick={() => setTab('drops')}
        >
          {tab === 'drops' && <div className="live-dot" />}
          <Zap style={{ width: 12, height: 12 }} />
          Live Drops
        </button>

        {onClose && (
          <button className="lc-close" onClick={onClose}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <>
          <div className="lc-messages">
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const role = userRoles[msg.user];
                return (
                  <motion.div
                    key={msg.id}
                    className="msg-row"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .18 }}
                  >
                    <div className="msg-avatar">
                      {msg.avatar_url
                        ? <img src={msg.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : msg.user?.[0]?.toUpperCase()
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="msg-meta">
                        <span className="msg-level">{msg.level}</span>

                        <button
                          className={`msg-name${msg.isMe ? ' is-me' : ''}`}
                          onClick={() => setSelectedUser(msg)}
                        >
                          {msg.user}
                        </button>

                        {role === 'owner' && <Crown style={{ width: 10, height: 10, color: '#fbbf24', flexShrink: 0 }} />}
                        {role === 'admin' && <Crown style={{ width: 10, height: 10, color: '#c084fc', flexShrink: 0 }} />}
                        {role === 'mod'   && <Shield style={{ width: 10, height: 10, color: '#60a5fa', flexShrink: 0 }} />}

                        <span className="msg-time">{msg.time}</span>
                      </div>

                      <div className="msg-bubble">{msg.text}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="lc-input-area">
            <div className="lc-input-row">
              <input
                className="msg-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={user ? 'Say something…' : 'Sign in to chat'}
                disabled={!user}
              />
              <EmojiPicker onPick={emoji => setInput(v => v + emoji)} />
              <button type="submit" className="send-btn" disabled={!input.trim() || !user}>
                <Send style={{ width: 13, height: 13, color: '#000' }} />
              </button>
            </div>
          </form>
        </>
      )}

      {/* Live Drops Tab */}
      {tab === 'drops' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {recentDrops.length === 0 ? (
            <div className="lc-empty">
              <Sparkles style={{ width: 26, height: 26, color: 'rgba(168,85,247,.2)' }} />
              <p>No drops yet</p>
              <p style={{ fontSize: 10 }}>Open cases to see drops here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {recentDrops.map((drop, i) => {
                const r = rs(drop.rarity);
                const imgSrc = drop.item_image_url || null;

                return (
                  <motion.div
                    key={drop.id || i}
                    className="drop-item"
                    style={{ border: `1px solid ${r.color}22` }}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * .03, duration: .2 }}
                  >
                    {/* Rarity left bar */}
                    <div style={{
                      position: 'absolute',
                      left: 0, top: 0, bottom: 0,
                      width: 2,
                      borderRadius: '2px 0 0 2px',
                      background: `linear-gradient(to bottom, ${r.color}, ${r.color}44)`,
                      boxShadow: `0 0 6px ${r.color}`,
                    }} />

                    {/* Item image */}
                    <div style={{
                      width: 38, height: 38,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: `${r.color}12`,
                      border: `1px solid ${r.color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={drop.item_name || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{
                        width: '100%', height: '100%',
                        display: imgSrc ? 'none' : 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Package style={{ width: 16, height: 16, color: r.color }} />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 11, fontWeight: 600,
                        color: 'rgba(240,230,255,.85)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {drop.item_name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9, fontWeight: 500,
                          color: r.color,
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                        }}>
                          {drop.rarity}
                        </span>
                        {drop.source_case && (
                          <>
                            <span style={{ fontSize: 8, color: 'rgba(240,230,255,.15)' }}>·</span>
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: 'rgba(240,230,255,.25)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: 80,
                            }}>
                              {drop.source_case}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Value */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{
                          width: 11, height: 11, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 6, fontWeight: 700, color: '#000' }}>$</span>
                        </div>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 12, fontWeight: 500,
                          color: '#fbbf24',
                        }}>
                          {drop.value?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}