import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Zap, Send, Crown, Shield, Smile, X, Sparkles, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import UserStatsModal from './UserStatsModal';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

:root {
  --bg:          #09000f;
  --surface:     #110018;
  --surface2:    #1c0030;
  --border:      rgba(139,92,246,.13);
  --border-gold: rgba(251,191,36,.3);
  --gold:        #fbbf24;
  --gold-soft:   rgba(251,191,36,.12);
  --purple:      #a855f7;
  --purple-mid:  #c084fc;
  --purple-soft: rgba(168,85,247,.12);
  --text:        #f0e6ff;
  --text-dim:    rgba(240,230,255,.5);
  --text-faint:  rgba(240,230,255,.2);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lc {
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  position: relative;
}

/* ─── Tab bar ─── */
.lc-tabbar {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  position: relative;
}

.lc-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 13px 0 11px;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--text-faint);
  transition: color .18s, border-color .18s, background .18s;
  position: relative;
}
.lc-tab:hover { color: var(--text-dim); background: rgba(255,255,255,.02); }

.lc-tab.t-chat {
  color: var(--gold);
  border-bottom-color: var(--gold);
  background: var(--gold-soft);
}
.lc-tab.t-drops {
  color: var(--purple-mid);
  border-bottom-color: var(--purple);
  background: var(--purple-soft);
}

/* tab icon container */
.tab-icon {
  width: 22px; height: 22px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: background .18s;
}
.lc-tab.t-chat  .tab-icon { background: rgba(251,191,36,.18); }
.lc-tab.t-drops .tab-icon { background: rgba(168,85,247,.18); }
.lc-tab:not(.t-chat):not(.t-drops) .tab-icon { background: rgba(255,255,255,.05); }

.lc-close {
  width: 36px;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  color: var(--text-faint);
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s;
  flex-shrink: 0;
}
.lc-close:hover { color: var(--text-dim); background: rgba(255,255,255,.03); }

/* live dot */
@keyframes pulseDot {
  0%,100% { opacity:1; transform:scale(1); }
  50%     { opacity:.35; transform:scale(.6); }
}
.live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--purple);
  box-shadow: 0 0 7px var(--purple);
  animation: pulseDot 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

/* ─── Messages ─── */
.lc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lc-messages::-webkit-scrollbar { width: 3px; }
.lc-messages::-webkit-scrollbar-thumb {
  background: rgba(168,85,247,.18);
  border-radius: 3px;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}

/* Avatar */
.msg-avatar {
  width: 30px; height: 30px;
  border-radius: 9px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 700;
  color: #fff;
  position: relative;
}
/* gradient ring — doubles as border */
.msg-avatar::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(168,85,247,.3);
  pointer-events: none;
}

.msg-content { flex: 1; min-width: 0; }

.msg-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.msg-level {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(168,85,247,.12);
  border: 1px solid rgba(168,85,247,.22);
  color: var(--purple-mid);
  flex-shrink: 0;
  letter-spacing: .04em;
}

.msg-name {
  font-size: 11.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  background: none; border: none; cursor: pointer; padding: 0;
  color: var(--text-dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 105px;
  transition: color .13s;
}
.msg-name:hover { color: var(--text); }
.msg-name.me    { color: var(--gold); }

.msg-badge {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}
.badge-owner { background: rgba(251,191,36,.15); }
.badge-admin { background: rgba(192,132,252,.15); }
.badge-mod   { background: rgba(96,165,250,.15);  }

.msg-time {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: var(--text-faint);
  flex-shrink: 0;
  letter-spacing: .03em;
}

.msg-bubble {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--text-dim);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px 9px 9px 9px;
  padding: 8px 11px;
  word-break: break-word;
}

/* ─── Input bar ─── */
.lc-inputbar {
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.lc-inputrow {
  display: flex;
  gap: 6px;
  align-items: center;
}

.msg-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}
.msg-input::placeholder { color: var(--text-faint); }
.msg-input:focus { border-color: rgba(168,85,247,.45); }
.msg-input:disabled { opacity: .35; cursor: not-allowed; }

.emoji-btn {
  width: 30px; height: 30px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-faint);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: all .14s;
}
.emoji-btn:hover { border-color: rgba(168,85,247,.35); color: var(--purple-mid); }

.send-btn {
  width: 36px; height: 36px;
  border-radius: 7px;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: opacity .15s, transform .15s;
  box-shadow: 0 2px 10px rgba(251,191,36,.25);
}
.send-btn:hover:not(:disabled) { opacity: .88; transform: scale(1.05); }
.send-btn:disabled { opacity: .28; cursor: not-allowed; box-shadow: none; }

/* ─── Emoji picker ─── */
.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px); right: 0;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(5,1fr);
  gap: 3px;
  width: 162px;
  box-shadow: 0 8px 32px rgba(0,0,0,.75);
  z-index: 100;
}
.emoji-picker button {
  font-size: 16px; padding: 4px 2px;
  border: none; background: transparent; cursor: pointer;
  border-radius: 5px; transition: background .12s;
}
.emoji-picker button:hover { background: rgba(168,85,247,.15); }

/* ─── Drop items ─── */
.drop-list {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px;
}
.drop-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px 11px 14px;
  border-radius: 10px;
  background: var(--surface);
  position: relative; overflow: hidden;
}
.drop-rarity-bar {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 3px 0 0 3px;
}
.drop-img-wrap {
  width: 40px; height: 40px;
  border-radius: 9px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.drop-name {
  font-size: 12px; font-weight: 600;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 3px;
}
.drop-sub {
  display: flex; align-items: center; gap: 5px;
}
.drop-rarity-label {
  font-family: 'DM Mono', monospace;
  font-size: 9px; font-weight: 500;
  text-transform: uppercase; letter-spacing: .06em;
}
.drop-sep {
  font-size: 8px; color: var(--text-faint);
}
.drop-case {
  font-family: 'DM Mono', monospace;
  font-size: 9px; color: var(--text-faint);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 80px;
}
.drop-value {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0;
}
.drop-coin {
  width: 13px; height: 13px; border-radius: 50%;
  background: linear-gradient(135deg,#fbbf24,#f59e0b);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(251,191,36,.3);
}
.drop-price {
  font-family: 'DM Mono', monospace;
  font-size: 12px; font-weight: 500;
  color: var(--gold);
}

/* ─── Drops scroll area ─── */
.drops-scroll {
  flex: 1; overflow-y: auto;
}
.drops-scroll::-webkit-scrollbar { width: 3px; }
.drops-scroll::-webkit-scrollbar-thumb {
  background: rgba(168,85,247,.15); border-radius: 3px;
}

/* ─── Empty ─── */
.lc-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px;
  padding: 40px 20px;
}
.lc-empty-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(168,85,247,.08);
  border: 1px solid rgba(168,85,247,.15);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.lc-empty p {
  font-family: 'DM Mono', monospace;
  font-size: 11px; color: var(--text-faint);
  letter-spacing: .03em; text-align: center;
}
.lc-empty p.sub { font-size: 10px; color: rgba(240,230,255,.1); }
`;

const EMOJIS = ['😀','😂','😍','🔥','💯','👑','🎉','🎮','⚡','✨','🌙','💎','🚀','👻','🤔','😎','🤖','🎲','💰','🏆'];

const RARITY = {
  common:    { color:'#9ca3af', glow:'rgba(156,163,175,.25)' },
  uncommon:  { color:'#34d399', glow:'rgba(52,211,153,.3)'   },
  rare:      { color:'#60a5fa', glow:'rgba(96,165,250,.35)'  },
  epic:      { color:'#c084fc', glow:'rgba(192,132,252,.4)'  },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.45)'  },
};
const rs = r => RARITY[r?.toLowerCase()] || RARITY.common;

// Deterministic avatar gradient from username
const avatarGrad = (name='') => {
  const h = [...(name||'?')].reduce((a,c) => a + c.charCodeAt(0), 0);
  const hues = [[262,40],[220,60],[160,50],[30,60]];
  const [h1,h2] = hues[h % hues.length];
  return `linear-gradient(135deg,hsl(${h1},70%,40%),hsl(${h2+h1},75%,55%))`;
};

function EmojiPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button type="button" className="emoji-btn" onClick={() => setOpen(v=>!v)}>
        <Smile style={{ width:14, height:14 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="emoji-picker"
            initial={{ opacity:0, scale:.88, y:4 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:.88 }}
            transition={{ duration:.14 }}
          >
            {EMOJIS.map(e=>(
              <button key={e} type="button" onClick={()=>{ onPick(e); setOpen(false); }}>{e}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveChat({ onClose }) {
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [user,         setUser]         = useState(null);
  const [tab,          setTab]          = useState('chat');
  const [recentDrops,  setRecentDrops]  = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles,    setUserRoles]    = useState({});
  const bottomRef = useRef(null);

  const enrichDrops = async (rawDrops) => {
    const itemIds = [...new Set(rawDrops.map(d=>d.item_id).filter(Boolean))];
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
      base44.functions.invoke('getAllUserRoles').then(res => setUserRoles(res.data||{})).catch(()=>{});
    }).catch(()=>{});

    base44.entities.ChatMessage.list('-created_date', 50).then(msgs => {
      setMessages(msgs.reverse().map(m => ({
        id:m.id, user:m.user_name, avatar_url:m.avatar_url,
        level:m.level, text:m.text, time:'recent',
      })));
    });

    const unsubChat = base44.entities.ChatMessage.subscribe(event => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, {
          id:event.data.id, user:event.data.user_name,
          avatar_url:event.data.avatar_url, level:event.data.level,
          text:event.data.text, time:'now',
        }]);
      }
    });

    base44.entities.UserInventory.list('-created_date', 20).then(async data => {
      const drops = data.filter(i => i.status==='owned' && ['case_opening','battle_win'].includes(i.source));
      setRecentDrops(await enrichDrops(drops));
    });

    const unsubInv = base44.entities.UserInventory.subscribe(async event => {
      if (event.type==='create' && ['case_opening','battle_win'].includes(event.data.source)) {
        const [enriched] = await enrichDrops([event.data]);
        setRecentDrops(prev => [enriched,...prev].slice(0,30));
      }
    });

    return () => { unsubChat(); unsubInv(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const displayName = user.is_anonymous
      ? `Anonymous #${user.id?.slice(-4)||'????'}`
      : (user.username || user.full_name || 'Player');
    try {
      await base44.entities.ChatMessage.create({
        user_name:displayName, user_email:user.email,
        avatar_url:user.is_anonymous ? null : (user.avatar_url||null),
        level:user.level||1, text:input.trim(),
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

      {/* ── Tab bar ── */}
      <div className="lc-tabbar">
        <button
          className={`lc-tab${tab==='chat' ? ' t-chat' : ''}`}
          onClick={() => setTab('chat')}
        >
          <span className="tab-icon">
            <MessageCircle style={{ width:13, height:13 }} />
          </span>
          Chat
        </button>

        <button
          className={`lc-tab${tab==='drops' ? ' t-drops' : ''}`}
          onClick={() => setTab('drops')}
        >
          {tab==='drops' && <div className="live-dot" />}
          <span className="tab-icon">
            <Zap style={{ width:13, height:13 }} />
          </span>
          Live Drops
        </button>

        {onClose && (
          <button className="lc-close" onClick={onClose}>
            <X style={{ width:13, height:13 }} />
          </button>
        )}
      </div>

      {/* ── Chat ── */}
      {tab === 'chat' && (<>
        <div className="lc-messages">
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const role = userRoles[msg.user];
              return (
                <motion.div
                  key={msg.id}
                  className="msg-row"
                  initial={{ opacity:0, y:6 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:.18 }}
                >
                  {/* Avatar */}
                  <div
                    className="msg-avatar"
                    style={{ background: msg.avatar_url ? '#000' : avatarGrad(msg.user) }}
                  >
                    {msg.avatar_url
                      ? <img src={msg.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : msg.user?.[0]?.toUpperCase()
                    }
                  </div>

                  <div className="msg-content">
                    <div className="msg-meta">
                      <span className="msg-level">{msg.level}</span>

                      <button
                        className={`msg-name${msg.isMe ? ' me' : ''}`}
                        onClick={() => setSelectedUser(msg)}
                      >
                        {msg.user}
                      </button>

                      {role === 'owner' && (
                        <span className="msg-badge badge-owner">
                          <Crown style={{ width:9, height:9, color:'#fbbf24' }} />
                        </span>
                      )}
                      {role === 'admin' && (
                        <span className="msg-badge badge-admin">
                          <Crown style={{ width:9, height:9, color:'#c084fc' }} />
                        </span>
                      )}
                      {role === 'mod' && (
                        <span className="msg-badge badge-mod">
                          <Shield style={{ width:9, height:9, color:'#60a5fa' }} />
                        </span>
                      )}

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

        <form onSubmit={handleSend} className="lc-inputbar">
          <div className="lc-inputrow">
            <input
              className="msg-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={user ? 'Say something…' : 'Sign in to chat'}
              disabled={!user}
            />
            <EmojiPicker onPick={emoji => setInput(v => v+emoji)} />
            <button type="submit" className="send-btn" disabled={!input.trim()||!user}>
              <Send style={{ width:14, height:14, color:'#000' }} />
            </button>
          </div>
        </form>
      </>)}

      {/* ── Live Drops ── */}
      {tab === 'drops' && (
        <div className="drops-scroll">
          {recentDrops.length === 0 ? (
            <div className="lc-empty">
              <div className="lc-empty-icon">
                <Sparkles style={{ width:20, height:20, color:'rgba(168,85,247,.5)' }} />
              </div>
              <p>No drops yet</p>
              <p className="sub">Open cases to see drops here</p>
            </div>
          ) : (
            <div className="drop-list">
              {recentDrops.map((drop, i) => {
                const r = rs(drop.rarity);
                const imgSrc = drop.item_image_url || null;
                return (
                  <motion.div
                    key={drop.id || i}
                    className="drop-item"
                    style={{ border:`1px solid ${r.color}20` }}
                    initial={{ opacity:0, x:12 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*.03, duration:.2 }}
                  >
                    {/* Rarity bar */}
                    <div
                      className="drop-rarity-bar"
                      style={{
                        background:`linear-gradient(to bottom,${r.color},${r.color}44)`,
                        boxShadow:`0 0 8px ${r.color}`,
                      }}
                    />

                    {/* Image */}
                    <div
                      className="drop-img-wrap"
                      style={{
                        background:`${r.color}10`,
                        border:`1px solid ${r.color}25`,
                        boxShadow:`0 0 12px ${r.glow}`,
                      }}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={drop.item_name||''}
                          style={{ width:'100%', height:'100%', objectFit:'contain' }}
                          onError={e => {
                            e.currentTarget.style.display='none';
                            e.currentTarget.nextSibling.style.display='flex';
                          }}
                        />
                      ) : null}
                      <div style={{
                        width:'100%', height:'100%',
                        display: imgSrc ? 'none' : 'flex',
                        alignItems:'center', justifyContent:'center',
                      }}>
                        <Package style={{ width:17, height:17, color:r.color }} />
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="drop-name">{drop.item_name}</div>
                      <div className="drop-sub">
                        <span className="drop-rarity-label" style={{ color:r.color }}>
                          {drop.rarity}
                        </span>
                        {drop.source_case && (<>
                          <span className="drop-sep">·</span>
                          <span className="drop-case">{drop.source_case}</span>
                        </>)}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="drop-value">
                      <div className="drop-coin">
                        <span style={{ fontSize:7, fontWeight:700, color:'#000' }}>$</span>
                      </div>
                      <span className="drop-price">{drop.value?.toLocaleString()}</span>
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