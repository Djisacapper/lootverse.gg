import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, Eye, ChevronDown } from 'lucide-react';
import CreateBattle from '../components/game/CreateBattle';
import BattleArena from '../components/game/BattleArena';
import { commitEosBlock, resolveAndCommitRolls } from '../components/game/useprovablyfair';
/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.bt-root { font-family: 'Nunito', sans-serif; }

@keyframes bt-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.bt-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.15),transparent);
  animation:bt-scan 7s linear infinite; pointer-events:none;
}

@keyframes bt-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.bt-shim { position:relative; overflow:hidden; }
.bt-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:bt-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes bt-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.5; }
  100% { transform:translateY(-80px) translateX(var(--dx)); opacity:0; }
}
.bt-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:bt-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes bt-live-ping {
  0%   { transform:scale(1); opacity:.8; }
  100% { transform:scale(2.8); opacity:0; }
}
.bt-live-ring { animation:bt-live-ping 1.6s ease-out infinite; }

@keyframes bt-hex-pulse {
  0%,100% { opacity:.025; }
  50%     { opacity:.055; }
}
.bt-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.04) 1px, transparent 1px);
  background-size:32px 32px;
  animation:bt-hex-pulse 5s ease-in-out infinite;
}

@keyframes bt-glow {
  0%,100% { box-shadow:0 0 0 1px rgba(251,191,36,.1), 0 16px 50px rgba(0,0,0,.75), 0 0 40px rgba(251,191,36,.08); }
  50%     { box-shadow:0 0 0 1px rgba(251,191,36,.22), 0 16px 50px rgba(0,0,0,.75), 0 0 70px rgba(251,191,36,.18); }
}
.bt-glow { animation:bt-glow 3.5s ease-in-out infinite; }

@keyframes bt-swords {
  0%,100% { transform:rotate(-8deg) scale(1); }
  50%     { transform:rotate(8deg) scale(1.08); }
}
.bt-swords-idle { animation:bt-swords 3s ease-in-out infinite; }

@keyframes bt-vs-pulse {
  0%,100% { transform:scale(1); opacity:.7; }
  50%     { transform:scale(1.12); opacity:1; }
}
.bt-vs { animation:bt-vs-pulse 2s ease-in-out infinite; }

.bt-select {
  appearance:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.7);
  font-family:'Nunito',sans-serif;
  font-weight:700; font-size:12px;
  padding:8px 32px 8px 12px;
  border-radius:10px; outline:none;
  transition:border-color .2s;
}
.bt-select:hover { border-color:rgba(251,191,36,.35); }
.bt-select:focus { border-color:rgba(251,191,36,.45); }
.bt-select option { background:#0d000a; color:#fff; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }
`;

const BOT_NAMES = ['Alpha','Blitz','Cipher','Delta','Echo','Forge','Ghost','Havoc','Inferno','Jester'];

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 10 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 20}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 40}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="bt-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Player Avatar ─────────────────────────────────────────────── */
function Avatar({ avatarUrl, name, size = 32, bot = false }) {
  const safe = safeAvatarUrl(avatarUrl);
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      background: bot
        ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
        : 'linear-gradient(135deg,#7c3aed,#4338ca)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38, fontWeight:800, color:'#fff',
      border:`2px solid rgba(251,191,36,.2)`,
      boxShadow:'0 0 12px rgba(168,85,247,.3)',
    }}>
      {safe
        ? <img src={safe} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : bot ? '🤖' : (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

/* ─── Mode Badge ─────────────────────────────────────────────────── */
function ModeBadge({ label, color, bg, border }) {
  return (
    <span style={{
      fontSize:9, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase',
      padding:'2px 8px', borderRadius:20,
      background: bg, color, border:`1px solid ${border}`,
    }}>{label}</span>
  );
}

/* ─── Battle Row Card ────────────────────────────────────────────── */
function BattleRow({ battle: b, user, balance, cases, onJoin, onWatch, onView, index }) {
  const [hov, setHov] = useState(false);
  const caseTemplate = cases.find(c => c.id === b.case_template_id);
  const isCreator = b.creator_email === user?.email;
  const isLive = b.status === 'in_progress';
  const filledPlayers = (b.players || []).filter(p => p?.email);
  const totalSlots = b.max_players || 2;
  const emptySlots = Math.max(0, totalSlots - filledPlayers.length);

  return (
    <motion.div
      initial={{ opacity:0, y:18, scale:.98 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay: index * .055, duration:.5, ease:[.22,1,.36,1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="bt-shim"
      style={{
        position:'relative', overflow:'hidden', borderRadius:16,
        background:'linear-gradient(145deg,#080012 0%,#10001e 60%,#040009 100%)',
        border:`1px solid ${hov ? 'rgba(251,191,36,.22)' : 'rgba(255,255,255,.07)'}`,
        boxShadow: hov
          ? '0 0 0 1px rgba(251,191,36,.14), 0 20px 60px rgba(0,0,0,.8), 0 0 50px rgba(251,191,36,.1)'
          : '0 8px 32px rgba(0,0,0,.65)',
        transition:'border-color .25s, box-shadow .3s',
      }}>

      <div className="bt-scan" />
      {hov && <Particles accent="#fbbf24" count={7} />}

      {/* Top accent bar */}
      <div style={{
        height:2,
        background: isLive
          ? 'linear-gradient(90deg,transparent,#a855f7,#fbbf24,transparent)'
          : hov
            ? 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)'
            : 'linear-gradient(90deg,transparent,rgba(251,191,36,.2),rgba(168,85,247,.2),transparent)',
        transition:'background .3s',
      }} />

      <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>

        {/* ── Col 1: Mode + Players ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:130 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:900, color:'#fff' }}>{b.rounds} Round{b.rounds !== 1 ? 's' : ''}</span>
            <span style={{
              fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:20, letterSpacing:'.12em', textTransform:'uppercase',
              background: b.mode_label === '2v2' ? 'rgba(96,165,250,.15)' : 'rgba(251,191,36,.12)',
              color:       b.mode_label === '2v2' ? '#60a5fa' : '#fbbf24',
              border:      b.mode_label === '2v2' ? '1px solid rgba(96,165,250,.3)' : '1px solid rgba(251,191,36,.25)',
            }}>{b.mode_label || '1v1'}</span>
            {b.battle_modes?.crazy  && <ModeBadge label="Crazy"  color="#c084fc" bg="rgba(168,85,247,.15)"  border="rgba(168,85,247,.3)" />}
            {b.battle_modes?.jackpot && <ModeBadge label="Jackpot" color="#fbbf24" bg="rgba(251,191,36,.12)" border="rgba(251,191,36,.25)" />}
            {!b.battle_modes?.crazy && !b.battle_modes?.jackpot && (
              <ModeBadge label="Normal" color="rgba(255,255,255,.35)" bg="rgba(255,255,255,.05)" border="rgba(255,255,255,.1)" />
            )}
            {isLive && (
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ position:'relative', width:7, height:7 }}>
                  <div className="bt-live-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(168,85,247,.5)' }} />
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7' }} />
                </div>
                <span style={{ fontSize:9, fontWeight:800, color:'#c084fc', letterSpacing:'.14em', textTransform:'uppercase' }}>Live</span>
              </div>
            )}
          </div>

          {/* Players avatars */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {filledPlayers.map((p, i) => (
              <Avatar key={i} avatarUrl={p.avatar_url} name={p.name} size={28} bot={p.isBot} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                width:28, height:28, borderRadius:'50%', flexShrink:0,
                background:'rgba(255,255,255,.04)',
                border:'2px dashed rgba(255,255,255,.12)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ color:'rgba(255,255,255,.18)', fontSize:12 }}>?</span>
              </div>
            ))}
            <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:700, marginLeft:4 }}>
              {filledPlayers.length}/{totalSlots}
            </span>
          </div>
        </div>

        {/* ── Col 2: Case preview ── */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0 }}>
          {caseTemplate
            ? Array.from({ length: Math.min(5, b.rounds || 1) }).map((_, i) => {
                const imageUrl = caseTemplate.image_url || caseTemplate.image || null;
                return (
                  <motion.div
                    key={i}
                    animate={{ y: hov ? -3 : 0 }}
                    transition={{ delay: i * .04, type:'spring', stiffness:200, damping:16 }}
                    style={{
                      width:46, height:46, borderRadius:10, flexShrink:0,
                      background: imageUrl ? `url('${imageUrl}') center/cover` : 'rgba(255,255,255,.06)',
                      border:'1px solid rgba(255,255,255,.1)',
                      boxShadow: hov ? '0 4px 16px rgba(0,0,0,.6)' : '0 2px 8px rgba(0,0,0,.5)',
                      transition:'box-shadow .25s',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}
                  >
                    {!imageUrl && (
                      <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, textAlign:'center', padding:'0 4px', lineHeight:1.2 }}>
                        {caseTemplate.name?.[0] || '?'}
                      </span>
                    )}
                  </motion.div>
                );
              })
            : (
              <div style={{
                padding:'6px 12px', borderRadius:10,
                background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
              }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:700 }}>{b.case_name || 'Case'}</span>
              </div>
            )}
          {b.rounds > 5 && (
            <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:800 }}>+{b.rounds - 5}</span>
          )}
        </div>

        {/* ── Col 3: Cost + Action ── */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginLeft:'auto', flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
            <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.12em', fontWeight:700 }}>Entry</span>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:14, fontWeight:900, color:'#fbbf24' }}>{b.entry_cost?.toLocaleString()}</span>
              <span style={{ fontSize:10, color:'rgba(251,191,36,.5)', fontWeight:700 }}>coins</span>
            </div>
          </div>

          {isLive ? (
            <motion.button
              whileHover={{ scale:1.05, y:-1 }} whileTap={{ scale:.96 }}
              onClick={() => onWatch(b)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'9px 16px', borderRadius:10, border:'1px solid rgba(168,85,247,.35)',
                background:'rgba(168,85,247,.1)', color:'#c084fc',
                fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer',
                transition:'background .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(168,85,247,.2)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(168,85,247,.1)'}>
              <Eye style={{ width:14, height:14 }} /> Watch
            </motion.button>
          ) : !isCreator ? (
            <motion.button
              whileHover={{ scale:1.05, y:-1 }} whileTap={{ scale:.96 }}
              onClick={() => onJoin(b)}
              disabled={b.entry_cost > balance}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'9px 18px', borderRadius:10, border:'none', cursor: b.entry_cost > balance ? 'not-allowed' : 'pointer',
                background: b.entry_cost > balance
                  ? 'rgba(255,255,255,.05)'
                  : 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fde68a 100%)',
                color: b.entry_cost > balance ? 'rgba(255,255,255,.2)' : '#000',
                fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif',
                boxShadow: b.entry_cost > balance ? 'none' : '0 0 28px rgba(251,191,36,.4)',
                transition:'opacity .2s',
              }}>
              <Swords style={{ width:14, height:14 }} /> Join
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:.96 }}
              onClick={() => onView(b)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'9px 16px', borderRadius:10,
                background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
                color:'rgba(255,255,255,.5)', fontSize:12, fontWeight:800,
                fontFamily:'Nunito,sans-serif', cursor:'pointer', transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.09)'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
              <Eye style={{ width:14, height:14 }} /> View
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────── */
function EmptyState({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:20,
        background:'linear-gradient(145deg,#080012,#100020,#04000a)',
        border:'1px solid rgba(255,255,255,.07)',
        padding:'64px 20px', textAlign:'center',
        display:'flex', flexDirection:'column', alignItems:'center', gap:20,
      }}>
      <Particles accent="#fbbf24" count={14} />
      <Particles accent="#a855f7" count={10} />
      <div className="bt-swords-idle">
        <Swords style={{ width:52, height:52, color:'rgba(251,191,36,.25)' }} />
      </div>
      <div style={{ position:'relative', zIndex:2 }}>
        <p style={{ fontSize:18, fontWeight:800, color:'rgba(255,255,255,.45)', marginBottom:6 }}>No open battles</p>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.2)' }}>Be the first to start a battle!</p>
      </div>
      <motion.button
        whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.96 }}
        onClick={onCreate}
        style={{
          position:'relative', zIndex:2,
          display:'flex', alignItems:'center', gap:8,
          padding:'12px 28px', borderRadius:12, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
          color:'#000', fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
          boxShadow:'0 0 40px rgba(251,191,36,.45)',
        }}>
        <Plus style={{ width:16, height:16 }} /> Create Battle
      </motion.button>
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function Skeleton({ i }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * .08 }}
      style={{
        height:82, borderRadius:16,
        background:'linear-gradient(145deg,#0a0016,#120022)',
        border:'1px solid rgba(255,255,255,.05)',
        overflow:'hidden', position:'relative',
      }}>
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.03) 50%,transparent 100%)',
        animation:'bt-shimmer 2s ease-in-out infinite',
      }} />
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Battles() {
  const { user: walletUser, balance, updateBalance, addXp } = useWallet();
  useRequireAuth();
  const [freshUser, setFreshUser] = React.useState(null);
  const arenaDataRef = React.useRef(null);

  React.useEffect(() => {
    base44.auth.me().then(setFreshUser).catch(() => {});
    const iv = setInterval(() => base44.auth.me().then(setFreshUser).catch(() => {}), 3000);
    return () => clearInterval(iv);
  }, []);

  const user = React.useMemo(() => {
    if (!walletUser && !freshUser) return null;
    return { ...(walletUser || {}), ...(freshUser || {}) };
  }, [walletUser, freshUser]);

  const [battles, setBattles] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [arenaData, setArenaData] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [, setTick] = useState(0);

  useEffect(() => {
    loadBattles();
    base44.entities.CaseTemplate.list().then(all => setCases(all.filter(c => c.is_active !== false)));
    const unsub = base44.entities.CaseBattle.subscribe(() => loadBattles());
    const ticker = setInterval(() => setTick(t => t + 1), 1000);
    return () => { unsub(); clearInterval(ticker); };
  }, []);

  const loadBattles = async () => {
    const data = await base44.entities.CaseBattle.list('-created_date', 20);
    setBattles(data);
    setLoading(false);
  };

  const handleCreate = async ({ selectedCases, modeLabel, teams, players, battleModes, totalPlayers }) => {
    if (!user || selectedCases.length === 0) return;
    const totalCost = selectedCases.reduce((s, c) => s + c.price, 0);
    if (totalCost > balance) return;
    const firstName = selectedCases[0].name;
    const caseName = selectedCases.length === 1 ? firstName : `${firstName} +${selectedCases.length - 1} more`;
    await updateBalance(-totalCost, 'battle_entry', `Created battle: ${caseName}`);
    let latestUser = user;
    try { latestUser = await base44.auth.me() || user; } catch {}
    const filledPlayers = players.map(p => ({
      email: p.email,
      name: p.isBot ? p.name : (latestUser.username || latestUser.full_name || p.name),
      avatar_url: p.isBot ? null : (latestUser.avatar_url || p.avatar_url || null),
      isBot: p.isBot, total_value: 0, items_won: []
    }));
    const allFilled = filledPlayers.length >= totalPlayers && filledPlayers.every(p => p.email);
    const status = allFilled ? 'in_progress' : 'waiting';
    const battle = await base44.entities.CaseBattle.create({
      creator_email: user.email, case_template_id: selectedCases[0].id,
      case_name: caseName, rounds: selectedCases.length, max_players: totalPlayers,
      entry_cost: totalCost, status, battle_modes: battleModes,
      mode_label: modeLabel, teams_config: JSON.stringify(teams), players: filledPlayers,
    });

    // ── ADDED: commit to future EOS block immediately ──
    await commitEosBlock(battle.id);

    // If all slots are already filled (e.g. all bots), resolve rolls now
    if (allFilled) {
      await resolveAndCommitRolls(battle, [...selectedCases], filledPlayers, battleModes);
    }
    // ── END ADDED ──

    const newArenaData = { battle, selectedCases: [...selectedCases], teams, modeLabel, battleModes };
    arenaDataRef.current = newArenaData;
    setArenaData(newArenaData);
    setView('arena');
    loadBattles();
  };

  const handleJoin = async (battle) => {
    if (battle.entry_cost > balance) return;
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (!caseTemplate) return;
    await updateBalance(-battle.entry_cost, 'battle_entry', `Joined battle: ${battle.case_name}`);
    const updatedPlayers = [...(battle.players || [])];
    const emptySlotIdx = updatedPlayers.findIndex(p => !p.email || p.email === '');
    let latestUser = user;
    try { latestUser = await base44.auth.me() || user; } catch {}
    const joinerSlot = { email: latestUser.email, name: latestUser.username || latestUser.full_name || 'Player', avatar_url: latestUser.avatar_url || null, isBot: false, total_value: 0, items_won: [] };
    if (emptySlotIdx >= 0) updatedPlayers[emptySlotIdx] = joinerSlot;
    else updatedPlayers.push(joinerSlot);
    const selectedCasesArr = Array.from({ length: battle.rounds || 1 }, () => caseTemplate);
    await base44.entities.CaseBattle.update(battle.id, { players: updatedPlayers });

    // ── ADDED: last player joined — resolve EOS block + commit all rolls ──
    const allFilled = updatedPlayers.filter(p => p?.email).length >= (battle.max_players || 2);
    if (allFilled) {
      await resolveAndCommitRolls(
        { ...battle, players: updatedPlayers },
        selectedCasesArr,
        updatedPlayers,
        battle.battle_modes || {}
      );
    }
    // ── END ADDED ──

    const teams = battle.teams_config ? JSON.parse(battle.teams_config) : [updatedPlayers.map((_, i) => i)];
    const joinArenaData = { battle: { ...battle, players: updatedPlayers }, selectedCases: selectedCasesArr, teams, modeLabel: battle.mode_label || '1v1', battleModes: battle.battle_modes || {} };
    arenaDataRef.current = joinArenaData;
    setArenaData(joinArenaData);
    setView('arena');
    loadBattles();
  };

  const makeBot = () => ({
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    email: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}@system`,
    isBot: true, total_value: 0, items_won: []
  });

  const updateArena = (updatedBattle) => {
    setArenaData(prev => {
      if (!prev) return prev;
      const next = { ...prev, battle: updatedBattle };
      arenaDataRef.current = next;
      return next;
    });
  };

  const handleAddBotToArena = async () => {
    const current = arenaDataRef.current;
    if (!current?.battle?.id) return;
    const battle = current.battle;
    const maxPlayers = battle.max_players || 2;
    const existingPlayers = (battle.players || []).filter(p => p?.email);
    if (existingPlayers.length >= maxPlayers) return;
    const updatedPlayers = [...existingPlayers, makeBot()];
    const allFilled = updatedPlayers.length >= maxPlayers;
    const patch = { players: updatedPlayers, ...(allFilled ? { status: 'in_progress' } : {}) };
    await base44.entities.CaseBattle.update(battle.id, patch);

    // ── ADDED: if now full, resolve rolls ──
    if (allFilled) {
      const caseTemplate = cases.find(c => c.id === battle.case_template_id);
      if (caseTemplate) {
        const selectedCasesArr = Array.from({ length: battle.rounds || 1 }, () => caseTemplate);
        await resolveAndCommitRolls(
          { ...battle, ...patch },
          selectedCasesArr,
          updatedPlayers,
          battle.battle_modes || {}
        );
      }
    }
    // ── END ADDED ──

    updateArena({ ...battle, ...patch });
    loadBattles();
  };

  const handleFillBots = async () => {
    const current = arenaDataRef.current;
    if (!current?.battle?.id) return;
    const battle = current.battle;
    const maxPlayers = battle.max_players || 2;
    const existingPlayers = (battle.players || []).filter(p => p?.email);
    const updatedPlayers = [...existingPlayers];
    while (updatedPlayers.length < maxPlayers) updatedPlayers.push(makeBot());
    const patch = { players: updatedPlayers, status: 'in_progress' };
    await base44.entities.CaseBattle.update(battle.id, patch);

    // ── ADDED: all bots filled — resolve rolls now ──
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (caseTemplate) {
      const selectedCasesArr = Array.from({ length: battle.rounds || 1 }, () => caseTemplate);
      await resolveAndCommitRolls(
        { ...battle, ...patch },
        selectedCasesArr,
        updatedPlayers,
        battle.battle_modes || {}
      );
    }
    // ── END ADDED ──

    updateArena({ ...battle, ...patch });
    loadBattles();
  };

  const handleBattleUpdated = (updatedBattle) => {
    const caseTemplate = cases.find(c => c.id === updatedBattle.case_template_id);
    if (!caseTemplate) return;
    const selectedCasesArr = Array.from({ length: updatedBattle.rounds || 1 }, () => caseTemplate);
    const teams = updatedBattle.teams_config ? JSON.parse(updatedBattle.teams_config) : [(updatedBattle.players || []).map((_, i) => i)];
    const newData = { battle: updatedBattle, selectedCases: selectedCasesArr, teams, modeLabel: updatedBattle.mode_label || '1v1', battleModes: updatedBattle.battle_modes || {} };
    arenaDataRef.current = newData;
    setArenaData(newData);
    loadBattles();
  };

  const handleWatch = (battle) => {
    const caseTemplate = cases.find(c => c.id === battle.case_template_id);
    if (!caseTemplate) return;
    const selectedCasesArr = Array.from({ length: battle.rounds || 1 }, () => caseTemplate);
    const players = battle.players || [];
    const teams = battle.teams_config ? JSON.parse(battle.teams_config) : [players.map((_, i) => i)];
    setArenaData({ battle, selectedCases: selectedCasesArr, players, teams, modeLabel: battle.mode_label || '1v1', battleModes: battle.battle_modes || {}, spectate: true });
    setView('arena');
  };

  const handleViewOwnBattle = (b) => {
    const caseTemplate = cases.find(c => c.id === b.case_template_id);
    const selectedCasesArr = caseTemplate ? Array.from({ length: b.rounds || 1 }, () => caseTemplate) : [];
    const teams = b.teams_config ? JSON.parse(b.teams_config) : [b.players?.map((_, i) => i) || []];
    const viewData = { battle: b, selectedCases: selectedCasesArr, teams, modeLabel: b.mode_label || '1v1', battleModes: b.battle_modes || {} };
    arenaDataRef.current = viewData;
    setArenaData(viewData);
    setView('arena');
  };

  const handleArenaReward = async (payout) => {
    if (!user) return;
    if (!arenaData?.spectate) {
      await updateBalance(payout, 'battle_win', `Won battle — ${payout.toLocaleString()} coins`);
      await addXp(150);
    }
    if (arenaData?.battle?.id) {
      await base44.entities.CaseBattle.update(arenaData.battle.id, { status: 'completed' });
    }
    loadBattles();
  };

  /* ── Delegate to sub-views ── */
  if (view === 'create') {
    return (
      <CreateBattle cases={cases} balance={balance} user={user}
        onBack={() => setView('list')} onCreate={handleCreate} />
    );
  }

  if (view === 'arena' && arenaData) {
    const arenaBattle = arenaData.battle;
    const arenaPlayers = arenaBattle?.players || [];
    const arenaStatus = arenaBattle?.status || 'waiting';
    return (
      <BattleArena
        key={`${arenaBattle?.id}-${arenaStatus}-${arenaPlayers.length}`}
        battle={arenaBattle} selectedCases={arenaData.selectedCases}
        players={arenaPlayers} teams={arenaData.teams}
        modeLabel={arenaData.modeLabel} battleModes={arenaData.battleModes || {}}
        userEmail={user?.email} balance={balance}
        onClose={() => setView('list')} onReward={handleArenaReward}
        onJoin={() => arenaBattle && handleJoin(arenaBattle)}
        onAddBot={handleAddBotToArena} onFillBots={handleFillBots}
        onBattleUpdated={handleBattleUpdated}
      />
    );
  }

  const waitingBattles = battles.filter(b => b.status === 'waiting' || b.status === 'in_progress');
  const ONE_MIN_MS = 60 * 1000;
  const completedBattles = battles.filter(b =>
    b.status === 'completed' &&
    Date.now() - new Date(b.updated_date || 0).getTime() < ONE_MIN_MS
  );

  const sortedBattles = [...waitingBattles].sort((a, b) => {
    if (sortBy === 'price_desc') return (b.entry_cost || 0) - (a.entry_cost || 0);
    if (sortBy === 'price_asc')  return (a.entry_cost || 0) - (b.entry_cost || 0);
    return 0;
  });

  const liveBattles   = sortedBattles.filter(b => b.status === 'in_progress');
  const openBattles   = sortedBattles.filter(b => b.status === 'waiting');

  return (
    <div className="bt-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:28 }}>

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18,
            background:'linear-gradient(120deg,#04000a 0%,#0e0020 40%,#160040 70%,#080010 100%)',
            border:'1px solid rgba(251,191,36,.12)',
            boxShadow:'0 0 0 1px rgba(251,191,36,.06), 0 32px 80px rgba(0,0,0,.85), 0 0 100px rgba(168,85,247,.1)',
            padding:'30px 32px',
            minHeight:130,
          }}>
          <div className="bt-scan" />
          <div className="bt-hex" />
          <Particles accent="#fbbf24" count={8} />
          <Particles accent="#a855f7" count={6} />

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 50% 80% at 85% 50%,rgba(168,85,247,.18) 0%,transparent 60%)',
          }} />

          <div className="bt-swords-idle" style={{
            position:'absolute', right:32, top:'50%', transform:'translateY(-50%)',
            opacity:.18, pointerEvents:'none',
          }}>
            <Swords style={{ width:80, height:80, color:'#fbbf24' }} />
          </div>

          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:3, height:26, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <Swords style={{ width:20, height:20, color:'#fbbf24' }} />
              <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:0 }}>Battles</h1>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.35)', fontWeight:600, marginLeft:13 }}>
              Open cases against opponents · Winner takes the pot
            </p>
          </div>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.5),transparent)',
          }} />
        </motion.div>

        {/* ── Toolbar ── */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.15 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Swords style={{ width:15, height:15, color:'#fbbf24' }} />
            <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Open Lobbies</span>
            {openBattles.length > 0 && (
              <span style={{
                fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20,
                background:'rgba(251,191,36,.15)', color:'#fbbf24',
                border:'1px solid rgba(251,191,36,.3)',
              }}>{openBattles.length}</span>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ position:'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bt-select">
                <option value="recent">Recent</option>
                <option value="price_desc">Price ↓</option>
                <option value="price_asc">Price ↑</option>
              </select>
              <ChevronDown style={{
                position:'absolute', right:9, top:'50%', transform:'translateY(-50%)',
                width:13, height:13, color:'rgba(255,255,255,.4)', pointerEvents:'none',
              }} />
            </div>

            <motion.button
              whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:.96 }}
              onClick={() => setView('create')}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'10px 20px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fde68a 100%)',
                color:'#000', fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
                boxShadow:'0 0 30px rgba(251,191,36,.45)',
              }}>
              <Plus style={{ width:16, height:16 }} /> Create Battle
            </motion.button>
          </div>
        </motion.div>

        {/* ── Live Battles ── */}
        <AnimatePresence>
          {liveBattles.length > 0 && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ position:'relative', width:8, height:8 }}>
                  <div className="bt-live-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(168,85,247,.5)' }} />
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:900, color:'#c084fc', letterSpacing:'.06em' }}>LIVE BATTLES</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {liveBattles.map((b, i) => (
                  <BattleRow key={b.id} battle={b} user={user} balance={balance} cases={cases} index={i}
                    onJoin={handleJoin} onWatch={handleWatch} onView={handleViewOwnBattle} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Open Battles ── */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} i={i} />)}
          </div>
        ) : openBattles.length === 0 && liveBattles.length === 0 ? (
          <EmptyState onCreate={() => setView('create')} />
        ) : openBattles.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {openBattles.map((b, i) => (
              <BattleRow key={b.id} battle={b} user={user} balance={balance} cases={cases} index={i}
                onJoin={handleJoin} onWatch={handleWatch} onView={handleViewOwnBattle} />
            ))}
          </div>
        ) : null}

      </div>
    </div>
  );
}