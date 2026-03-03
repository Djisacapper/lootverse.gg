import React, { useState, useRef } from 'react';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, CheckCircle, CreditCard, Gift, Zap, Star, Sparkles } from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.dp-root { font-family: 'Nunito', sans-serif; }

@keyframes dp-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.6; }
  95% { opacity:.6; }
  100%{ top:100%; opacity:0; }
}
.dp-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.2),transparent);
  animation:dp-scan 6s linear infinite; pointer-events:none;
}

@keyframes dp-hex-pulse {
  0%,100% { opacity:.025; }
  50%     { opacity:.055; }
}
.dp-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.04) 1px, transparent 1px);
  background-size:32px 32px;
  animation:dp-hex-pulse 4s ease-in-out infinite;
}

@keyframes dp-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.dp-shim { position:relative; overflow:hidden; }
.dp-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.06),transparent);
  animation:dp-shimmer 5s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes dp-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.5; }
  100% { transform:translateY(-100px) translateX(var(--dx)); opacity:0; }
}
.dp-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:dp-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes dp-coin-spin {
  0%   { transform:rotateY(0deg); }
  100% { transform:rotateY(360deg); }
}
.dp-coin-spin { animation:dp-coin-spin 3s linear infinite; }

@keyframes dp-balance-glow {
  0%,100% { text-shadow:0 0 20px rgba(251,191,36,.4), 0 0 60px rgba(251,191,36,.15); }
  50%     { text-shadow:0 0 40px rgba(251,191,36,.8), 0 0 100px rgba(251,191,36,.3); }
}
.dp-balance { animation:dp-balance-glow 2.5s ease-in-out infinite; }

@keyframes dp-ring-ping {
  0%   { transform:scale(1); opacity:.7; }
  100% { transform:scale(2.4); opacity:0; }
}
.dp-ring { animation:dp-ring-ping 1.8s ease-out infinite; }

@keyframes dp-success-pop {
  0%   { transform:scale(.5) rotate(-10deg); opacity:0; }
  60%  { transform:scale(1.15) rotate(3deg); }
  100% { transform:scale(1) rotate(0deg); opacity:1; }
}
.dp-success-pop { animation:dp-success-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes dp-float-coin {
  0%,100% { transform:translateY(0) rotate(-6deg); }
  50%     { transform:translateY(-14px) rotate(6deg); }
}
.dp-float-a { animation:dp-float-coin 5s ease-in-out infinite; }
.dp-float-b { animation:dp-float-coin 7s ease-in-out infinite 1.2s; }
.dp-float-c { animation:dp-float-coin 6s ease-in-out infinite 2.5s; }

@keyframes dp-progress-fill {
  from { width:0%; }
  to   { width:var(--w); }
}

.dp-input { transition:border-color .2s, box-shadow .2s; }
.dp-input:focus {
  outline:none;
  border-color:rgba(251,191,36,.5) !important;
  box-shadow:0 0 0 3px rgba(251,191,36,.1), 0 0 20px rgba(251,191,36,.1) !important;
}
.dp-input::-webkit-outer-spin-button,
.dp-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }
`;

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

const XP_TIERS = [
  { min:0,     max:500,   label:'Starter',  color:'#60a5fa', icon:'⚡' },
  { min:500,   max:1000,  label:'Bronze',   color:'#f97316', icon:'🔥' },
  { min:1000,  max:2500,  label:'Silver',   color:'#94a3b8', icon:'⭐' },
  { min:2500,  max:5000,  label:'Gold',     color:'#fbbf24', icon:'👑' },
  { min:5000,  max:10000, label:'Diamond',  color:'#c084fc', icon:'💎' },
  { min:10000, max:Infinity, label:'Legendary', color:'#f43f5e', icon:'🌟' },
];

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 14 }) {
  const pts = useRef(
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
        <div key={p.id} className="dp-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Floating Coin Deco ─────────────────────────────────────────── */
function FloatingCoin({ size, emoji, floatClass, style }) {
  return (
    <div className={floatClass} style={{
      position:'absolute', pointerEvents:'none',
      width:size, height:size, borderRadius:'50%',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size * .45,
      ...style,
    }}>
      {emoji}
    </div>
  );
}

/* ─── Quick Amount Button ────────────────────────────────────────── */
function QuickBtn({ v, active, onClick }) {
  const tier = XP_TIERS.find(t => v >= t.min && v < t.max) || XP_TIERS[0];

  return (
    <motion.button
      whileHover={{ scale:1.06, y:-2 }}
      whileTap={{ scale:.95 }}
      onClick={() => onClick(v)}
      style={{
        position:'relative', overflow:'hidden', padding:'14px 8px',
        borderRadius:14, cursor:'pointer', fontFamily:'Nunito,sans-serif',
        background: active
          ? `linear-gradient(135deg,${tier.color}25,${tier.color}12)`
          : 'rgba(255,255,255,.04)',
        border:`1px solid ${active ? `${tier.color}55` : 'rgba(255,255,255,.07)'}`,
        boxShadow: active ? `0 0 24px ${tier.color}30, inset 0 1px 0 ${tier.color}20` : 'none',
        transition:'all .18s',
        display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      }}>
      {active && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,transparent,${tier.color},transparent)`,
        }} />
      )}
      <span style={{ fontSize:10 }}>{tier.icon}</span>
      <span style={{
        fontSize:13, fontWeight:900,
        color: active ? tier.color : 'rgba(255,255,255,.45)',
      }}>{v.toLocaleString()}</span>
      {active && (
        <span style={{
          fontSize:8, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase',
          color: tier.color, opacity:.7,
        }}>{tier.label}</span>
      )}
    </motion.button>
  );
}

/* ─── XP Preview Bar ─────────────────────────────────────────────── */
function XpPreview({ amount }) {
  const xp = Math.floor(amount / 50);
  const tier = XP_TIERS.find(t => amount >= t.min && amount < t.max) || XP_TIERS[XP_TIERS.length - 1];
  const pct = Math.min(100, ((amount - tier.min) / (tier.max - tier.min)) * 100);

  return (
    <div style={{
      padding:'12px 16px', borderRadius:12,
      background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
      display:'flex', alignItems:'center', gap:14,
    }}>
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background:`${tier.color}18`, border:`1px solid ${tier.color}30`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>
        {tier.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.12em' }}>
            XP Reward
          </span>
          <span style={{ fontSize:12, fontWeight:900, color:tier.color }}>+{xp} XP</span>
        </div>
        <div style={{
          height:4, borderRadius:4,
          background:'rgba(255,255,255,.06)', overflow:'hidden',
        }}>
          <motion.div
            animate={{ width:`${pct}%` }}
            transition={{ duration:.6, ease:[.22,1,.36,1] }}
            style={{
              height:'100%', borderRadius:4,
              background:`linear-gradient(90deg,${tier.color}99,${tier.color})`,
              boxShadow:`0 0 8px ${tier.color}80`,
            }}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:3 }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontWeight:700 }}>{tier.label} tier</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontWeight:700 }}>
            {tier.max === Infinity ? '∞' : `${tier.max.toLocaleString()} max`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Deposit() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [amount, setAmount]       = useState(1000);
  const [depositing, setDepositing] = useState(false);
  const [success, setSuccess]     = useState(false);

  const handleDeposit = async () => {
    if (amount <= 0 || depositing) return;
    setDepositing(true);
    await new Promise(r => setTimeout(r, 1500));
    await updateBalance(amount, 'deposit', `Deposited ${amount} coins`);
    await addXp(Math.floor(amount / 50));
    setDepositing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  const canDeposit = amount > 0 && !depositing;

  return (
    <div className="dp-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:520, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Page Title ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:3, height:26, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Coins style={{ width:20, height:20, color:'#fbbf24' }} />
            <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:0 }}>Deposit</h1>
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.3)', marginLeft:13, fontWeight:600 }}>
            Add coins to your balance and earn XP rewards
          </p>
        </motion.div>

        {/* ── Balance Hero Card ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:20,
            background:'linear-gradient(135deg,#080010 0%,#120025 45%,#1a0040 75%,#080012 100%)',
            border:'1px solid rgba(251,191,36,.18)',
            boxShadow:'0 0 0 1px rgba(251,191,36,.06), 0 32px 80px rgba(0,0,0,.85), 0 0 120px rgba(251,191,36,.1)',
            padding:'32px 28px',
            minHeight:160,
          }}>

          <div className="dp-scan" />
          <div className="dp-hex" />
          <Particles accent="#fbbf24" count={12} />
          <Particles accent="#a855f7" count={8} />

          {/* Radial glow */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 70% 80% at 80% 50%,rgba(251,191,36,.12) 0%,transparent 60%)',
          }} />

          {/* Floating coin decos */}
          <FloatingCoin size={52} emoji="🪙" floatClass="dp-float-a"
            style={{ right:28, top:'10%', opacity:.35, filter:'drop-shadow(0 0 14px rgba(251,191,36,.6))' }} />
          <FloatingCoin size={34} emoji="💰" floatClass="dp-float-b"
            style={{ right:76, top:'52%', opacity:.25, filter:'drop-shadow(0 0 10px rgba(251,191,36,.5))' }} />
          <FloatingCoin size={26} emoji="⭐" floatClass="dp-float-c"
            style={{ right:20, bottom:'14%', opacity:.2, filter:'drop-shadow(0 0 8px rgba(251,191,36,.4))' }} />

          <div style={{ position:'relative', zIndex:2 }}>
            <p style={{
              fontSize:10, fontWeight:800, color:'rgba(255,255,255,.3)',
              textTransform:'uppercase', letterSpacing:'.18em', marginBottom:10,
            }}>Current Balance</p>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              {/* Live indicator */}
              <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
                <div className="dp-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(251,191,36,.45)' }} />
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 8px #fbbf24' }} />
              </div>
              <span className="dp-balance" style={{
                fontSize:42, fontWeight:900, lineHeight:1,
                background:'linear-gradient(90deg,#fef3c7,#fbbf24 40%,#f59e0b)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                {(balance || 0).toLocaleString()}
              </span>
              <span style={{ fontSize:14, fontWeight:700, color:'rgba(251,191,36,.5)', alignSelf:'flex-end', paddingBottom:4 }}>coins</span>
            </div>

            <p style={{ fontSize:12, color:'rgba(255,255,255,.25)', fontWeight:600 }}>
              {user?.username || 'Player'} · Lv {user?.level || 1}
            </p>
          </div>

          {/* Bottom accent */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.6),rgba(168,85,247,.4),transparent)',
          }} />
        </motion.div>

        {/* ── Deposit Card ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.18 }}
          className="dp-shim"
          style={{
            position:'relative', overflow:'hidden', borderRadius:20,
            background:'linear-gradient(145deg,#080012,#100022,#04000a)',
            border:'1px solid rgba(251,191,36,.15)',
            boxShadow:'0 0 0 1px rgba(251,191,36,.06), 0 24px 60px rgba(0,0,0,.85)',
            padding:'26px 24px',
          }}>

          <div className="dp-scan" />

          {/* Top accent */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)',
          }} />

          {/* Section header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
            <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Plus style={{ width:16, height:16, color:'#fbbf24' }} />
            <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Add Coins</span>
          </div>

          {/* Quick amounts */}
          <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.3)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:10 }}>
            Select Amount
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
            {QUICK_AMOUNTS.map(v => (
              <QuickBtn key={v} v={v} active={amount === v} onClick={setAmount} />
            ))}
          </div>

          {/* Custom input */}
          <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.3)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:8 }}>
            Custom Amount
          </p>
          <div style={{ position:'relative', marginBottom:16 }}>
            <div style={{
              position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
              fontSize:16, pointerEvents:'none',
            }}>🪙</div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              className="dp-input"
              style={{
                width:'100%', padding:'12px 14px 12px 40px',
                borderRadius:12, border:'1px solid rgba(255,255,255,.1)',
                background:'rgba(255,255,255,.05)', color:'#fff',
                fontSize:16, fontWeight:800, fontFamily:'Nunito,sans-serif',
                boxSizing:'border-box',
              }}
              min={1}
            />
          </div>

          {/* XP preview */}
          <div style={{ marginBottom:20 }}>
            <XpPreview amount={amount} />
          </div>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity:0, y:8, scale:.95 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-8, scale:.95 }}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'14px 16px', borderRadius:12, marginBottom:16,
                  background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.25)',
                  boxShadow:'0 0 30px rgba(34,197,94,.1)',
                }}>
                <div className="dp-success-pop">
                  <CheckCircle style={{ width:22, height:22, color:'#4ade80', flexShrink:0 }} />
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:900, color:'#4ade80', marginBottom:1 }}>
                    Deposit Successful!
                  </p>
                  <p style={{ fontSize:11, color:'rgba(74,222,128,.6)', fontWeight:600 }}>
                    +{amount.toLocaleString()} coins added · +{Math.floor(amount/50)} XP earned
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: canDeposit ? 1.02 : 1, y: canDeposit ? -2 : 0 }}
            whileTap={{ scale: canDeposit ? .97 : 1 }}
            onClick={handleDeposit}
            disabled={!canDeposit}
            style={{
              width:'100%', height:52, borderRadius:14, border:'none',
              cursor: canDeposit ? 'pointer' : 'not-allowed',
              background: canDeposit
                ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)'
                : 'rgba(255,255,255,.06)',
              color: canDeposit ? '#000' : 'rgba(255,255,255,.2)',
              fontSize:15, fontWeight:900, fontFamily:'Nunito,sans-serif',
              boxShadow: canDeposit ? '0 0 50px rgba(251,191,36,.5), 0 4px 24px rgba(0,0,0,.5)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              transition:'all .22s',
              position:'relative', overflow:'hidden',
            }}>
            {canDeposit && (
              <div style={{
                position:'absolute', top:0, left:0, right:0, bottom:0,
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)',
                animation:'dp-shimmer 3s ease-in-out infinite',
              }} />
            )}
            {depositing ? (
              <>
                <div style={{
                  width:18, height:18, borderRadius:'50%',
                  border:'2px solid rgba(0,0,0,.3)', borderTopColor:'#000',
                  animation:'spin 1s linear infinite',
                }} />
                Processing…
              </>
            ) : (
              <>
                <CreditCard style={{ width:18, height:18 }} />
                Deposit {amount > 0 ? amount.toLocaleString() : ''} Coins
              </>
            )}
          </motion.button>

          <p style={{ fontSize:10, color:'rgba(255,255,255,.18)', textAlign:'center', marginTop:12, fontWeight:600 }}>
            Demo mode — coins are added instantly for testing
          </p>
        </motion.div>

        {/* ── Bonus Tiers Card ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.28 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18,
            background:'linear-gradient(145deg,#080010,#0e001e,#04000a)',
            border:'1px solid rgba(251,191,36,.12)',
            padding:'20px 22px',
          }}>

          <div className="dp-scan" />

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Gift style={{ width:15, height:15, color:'#fbbf24' }} />
            <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>Deposit Bonus Tiers</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {XP_TIERS.slice(0, 5).map((tier, i) => {
              const isActive = amount >= tier.min && amount < tier.max;
              return (
                <motion.div
                  key={tier.label}
                  initial={{ opacity:0, x:-12 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:.35 + i * .06 }}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', borderRadius:12,
                    background: isActive ? `${tier.color}10` : 'rgba(255,255,255,.03)',
                    border: `1px solid ${isActive ? `${tier.color}35` : 'rgba(255,255,255,.06)'}`,
                    boxShadow: isActive ? `0 0 20px ${tier.color}18` : 'none',
                    transition:'all .3s',
                  }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{tier.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:800, color: isActive ? tier.color : 'rgba(255,255,255,.5)' }}>
                        {tier.label}
                      </span>
                      {isActive && (
                        <span style={{
                          fontSize:8, fontWeight:800, padding:'1px 6px', borderRadius:20,
                          background:`${tier.color}25`, color:tier.color, border:`1px solid ${tier.color}40`,
                          letterSpacing:'.1em', textTransform:'uppercase',
                        }}>Active</span>
                      )}
                    </div>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:600 }}>
                      {tier.min.toLocaleString()} – {tier.max === Infinity ? '∞' : tier.max.toLocaleString()} coins
                    </span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span style={{ fontSize:13, fontWeight:900, color: isActive ? tier.color : 'rgba(255,255,255,.3)' }}>
                      +{Math.floor(tier.min / 50 || 1)} XP
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p style={{ fontSize:10, color:'rgba(255,255,255,.2)', marginTop:14, fontWeight:600, textAlign:'center' }}>
            Higher deposits unlock better rakeback rates and exclusive rewards
          </p>
        </motion.div>

      </div>
    </div>
  );
}