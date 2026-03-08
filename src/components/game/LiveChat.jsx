import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Zap, Send, Crown, Shield, Smile, X, Sparkles, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import UserStatsModal from './UserStatsModal';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.lc { font-family: 'Nunito', sans-serif; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; } 95%{ opacity:1; }
  100%{ top:100%; opacity:0; }
}
.lc-scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.15),transparent);
  animation:scan 7s linear infinite; pointer-events:none;
}

@keyframes pulse-dot {
  0%,100%{ opacity:1; transform:scale(1); }
  50%    { opacity:.5; transform:scale(.7); }
}
.live-dot { animation: pulse-dot 1.4s ease-in-out infinite; }

@keyframes drop-slide {
  0%  { transform: translateX(16px); opacity:0; }
  100%{ transform: translateX(0);    opacity:1; }
}

.msg-input {
  background: rgba(251,191,36,.05);
  border: 1px solid rgba(251,191,36,.12);
  border-radius: 10px;
  outline: none;
  width: 100%;
  padding: 9px 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px; font-weight: 600;
  color: rgba(255,255,255,.8);
  transition: border-color .2s;
  box-sizing: border-box;
}
.msg-input:focus { border-color: rgba(251,191,36,.28); }
.msg-input::placeholder { color: rgba(255,255,255,.2); }

.send-btn {
  width: 32px; height: 32px; border-radius: 9px; border: none; cursor: pointer;
  background: linear-gradient(135deg,#fbbf24,#f59e0b);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 14px rgba(251,191,36,.4);
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
  flex-shrink: 0;
}
.send-btn:hover { transform: scale(1.1); box-shadow: 0 0 20px rgba(251,191,36,.55); }
.send-btn:active { transform: scale(.94); }
.send-btn:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; transform:none; }

.emoji-btn:hover { background: rgba(251,191,36,.1) !important; }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(251,191,36,.12); border-radius: 3px; }
`;

const EMOJIS = ['😀','😂','😍','🔥','💯','👑','🎉','🎮','⚡','✨','🌙','💎','🚀','👻','🤔','😎','🤖','🎲','💰','🏆'];

const RARITY = {
  common:    { color:'#9ca3af', glow:'rgba(156,163,175,.3)'  },
  uncommon:  { color:'#34d399', glow:'rgba(52,211,153,.35)'  },
  rare:      { color:'#60a5fa', glow:'rgba(96,165,250,.4)'   },
  epic:      { color:'#c084fc', glow:'rgba(192,132,252,.45)' },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.5)'   },
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
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button
        type="button"
        className="emoji-btn"
        onClick={() => setOpen(v => !v)}
        style={{
          width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,.07)',
          cursor:'pointer', background:'rgba(255,255,255,.04)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'rgba(255,255,255,.3)', transition:'all .2s',
        }}>
        <Smile style={{ width:13, height:13 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:.88, y:4 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:.88 }}
            style={{
              position:'absolute', bottom:'calc(100% + 8px)', right:0,
              background:'linear-gradient(145deg,#0e001a,#140025)',
              border:'1px solid rgba(251,191,36,.15)',
              borderRadius:12, padding:10, zIndex:100,
              display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:3,
              width:160, boxShadow:'0 8px 32px rgba(0,0,0,.7)',
            }}>
            {EMOJIS.map(e => (
              <button
                key={e} type="button"
                onClick={() => { onPick(e); setOpen(false); }}
                style={{ fontSize:16, padding:'4px 2px', border:'none', background:'transparent', cursor:'pointer', borderRadius:6, transition:'background .15s' }}>
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
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [user,         setUser]         = useState(null);
  const [tab,          setTab]          = useState('chat');
  const [recentDrops,  setRecentDrops]  = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles,    setUserRoles]    = useState({});
  const bottomRef = useRef(null);

  // Enrich inventory drops with Item entity image/name/rarity data
  const enrichDrops = async (rawDrops) => {
    const itemIds = [...new Set(rawDrops.map(d => d.item_id).filter(Boolean))];
    let itemMap = {};
    if (itemIds.length > 0) {
      try {
        const items = await base44.entities.Item.filter({ id: itemIds });
        items.forEach(item => { itemMap[item.id] = item; });
      } catch {
        // silently fall back — drops will just show Package icon
      }
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

    // Load recent drops then enrich with Item entity for images
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
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
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
    <div className="lc" style={{
      display:'flex', flexDirection:'column', height:'100%',
      background:'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
      position:'relative', overflow:'hidden',
    }}>
      <style>{CSS}</style>
      <div className="lc-scan" />

      {selectedUser && (
        <UserStatsModal
          userName={selectedUser.user}
          userEmail={selectedUser.user}
          onClose={() => setSelectedUser(null)}
          currentUser={user}
        />
      )}

      {/* ── Header tabs ── */}
      <div style={{ position:'relative', zIndex:3, borderBottom:'1px solid rgba(251,191,36,.08)', background:'rgba(0,0,0,.2)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)' }} />
        <div style={{ display:'flex', alignItems:'center', padding:'0 4px' }}>

          <button onClick={() => setTab('chat')} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            padding:'11px 0', border:'none', cursor:'pointer', background:'transparent',
            borderBottom: tab==='chat' ? '2px solid #fbbf24' : '2px solid transparent',
            color: tab==='chat' ? '#fbbf24' : 'rgba(255,255,255,.28)',
            fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', transition:'all .2s',
          }}>
            <MessageCircle style={{ width:13, height:13 }} />
            Chat
          </button>

          <button onClick={() => setTab('drops')} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            padding:'11px 0', border:'none', cursor:'pointer', background:'transparent',
            borderBottom: tab==='drops' ? '2px solid #a855f7' : '2px solid transparent',
            color: tab==='drops' ? '#c084fc' : 'rgba(255,255,255,.28)',
            fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', transition:'all .2s',
          }}>
            {tab==='drops' && (
              <div className="live-dot" style={{ width:5, height:5, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 6px #a855f7' }} />
            )}
            <Zap style={{ width:13, height:13 }} />
            Live Drops
          </button>

          {onClose && (
            <button onClick={onClose} style={{
              width:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 6px', transition:'all .2s', flexShrink:0,
            }}>
              <X style={{ width:13, height:13 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Chat Tab ── */}
      {tab === 'chat' && (
        <>
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 6px', display:'flex', flexDirection:'column', gap:10 }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const role = userRoles[msg.user];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity:0, y:6 }}
                    animate={{ opacity:1, y:0 }}
                    style={{ display:'flex', alignItems:'flex-start', gap:8 }}>

                    {/* Avatar */}
                    <div style={{
                      width:26, height:26, borderRadius:8, flexShrink:0,
                      background:'linear-gradient(135deg,#fbbf24,#a855f7)',
                      overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:900, color:'#000',
                      border:'1px solid rgba(251,191,36,.2)',
                    }}>
                      {msg.avatar_url
                        ? <img src={msg.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : msg.user?.[0]?.toUpperCase()}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                        <span style={{
                          fontSize:8, fontWeight:900, padding:'1px 4px', borderRadius:4,
                          background:'rgba(168,85,247,.2)', border:'1px solid rgba(168,85,247,.3)',
                          color:'#c084fc', flexShrink:0,
                        }}>{msg.level}</span>

                        <button onClick={() => setSelectedUser(msg)} style={{
                          fontSize:11, fontWeight:800, background:'none', border:'none', cursor:'pointer', padding:0,
                          color: msg.isMe ? '#fbbf24' : 'rgba(255,255,255,.65)',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          maxWidth:110, fontFamily:'Nunito,sans-serif', transition:'color .15s',
                        }}>{msg.user}</button>

                        {role === 'owner' && <Crown style={{ width:10, height:10, color:'#fbbf24', flexShrink:0 }} />}
                        {role === 'admin' && <Crown style={{ width:10, height:10, color:'#c084fc', flexShrink:0 }} />}
                        {role === 'mod'   && <Shield style={{ width:10, height:10, color:'#60a5fa', flexShrink:0 }} />}

                        <span style={{ marginLeft:'auto', fontSize:8, fontWeight:600, color:'rgba(255,255,255,.18)', flexShrink:0 }}>
                          {msg.time}
                        </span>
                      </div>

                      <div style={{
                        fontSize:11, fontWeight:600, lineHeight:1.5,
                        color:'rgba(255,255,255,.6)',
                        background:'rgba(255,255,255,.03)',
                        border:'1px solid rgba(255,255,255,.05)',
                        borderRadius:'0 8px 8px 8px',
                        padding:'6px 9px', wordBreak:'break-word',
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding:'10px', borderTop:'1px solid rgba(251,191,36,.07)',
            background:'rgba(0,0,0,.2)',
          }}>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input
                className="msg-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={user ? 'Say something…' : 'Sign in to chat'}
                disabled={!user}
              />
              <EmojiPicker onPick={emoji => setInput(v => v + emoji)} />
              <button type="submit" className="send-btn" disabled={!input.trim() || !user}>
                <Send style={{ width:13, height:13, color:'#000' }} />
              </button>
            </div>
          </form>
        </>
      )}

      {/* ── Live Drops Tab ── */}
      {tab === 'drops' && (
        <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
          {recentDrops.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:50 }}>
              <Sparkles style={{ width:28, height:28, color:'rgba(251,191,36,.15)', margin:'0 auto 10px', display:'block' }} />
              <p style={{ fontSize:11, color:'rgba(255,255,255,.15)', fontWeight:600 }}>No drops yet</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,.1)', fontWeight:600 }}>Open cases to see drops here</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {recentDrops.map((drop, i) => {
                const r = rs(drop.rarity);
                const imgSrc = drop.item_image_url || null;

                return (
                  <motion.div
                    key={drop.id || i}
                    initial={{ opacity:0, x:14 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * .03 }}
                    style={{
                      display:'flex', alignItems:'center', gap:9,
                      padding:'9px 10px', borderRadius:11,
                      background:'linear-gradient(145deg,#07000f,#0e001a)',
                      border:`1px solid ${r.color}20`,
                      position:'relative', overflow:'hidden',
                    }}>

                    {/* Left rarity bar */}
                    <div style={{
                      position:'absolute', left:0, top:0, bottom:0, width:2, borderRadius:'2px 0 0 2px',
                      background:`linear-gradient(to bottom,${r.color},${r.color}44)`,
                      boxShadow:`0 0 6px ${r.color}`,
                    }} />

                    {/* Item image or fallback icon */}
                    <div style={{
                      width:38, height:38, borderRadius:9, flexShrink:0,
                      background:`${r.color}15`, border:`1px solid ${r.color}30`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      overflow:'hidden',
                      boxShadow:`0 0 10px ${r.glow}`,
                    }}>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={drop.item_name || ''}
                          style={{ width:'100%', height:'100%', objectFit:'contain' }}
                          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{
                        width:'100%', height:'100%',
                        display: imgSrc ? 'none' : 'flex',
                        alignItems:'center', justifyContent:'center',
                      }}>
                        <Package style={{ width:16, height:16, color:r.color }} />
                      </div>
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {drop.item_name}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:r.color, textTransform:'uppercase', letterSpacing:'.08em' }}>
                          {drop.rarity}
                        </span>
                        {drop.source_case && (
                          <>
                            <span style={{ fontSize:8, color:'rgba(255,255,255,.15)' }}>·</span>
                            <span style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,.25)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }}>
                              {drop.source_case}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Value */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <div style={{
                          width:11, height:11, borderRadius:'50%',
                          background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:'0 0 5px rgba(251,191,36,.4)',
                        }}>
                          <span style={{ fontSize:6, fontWeight:900, color:'#000' }}>$</span>
                        </div>
                        <span style={{ fontSize:12, fontWeight:900, color:'#fbbf24' }}>
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