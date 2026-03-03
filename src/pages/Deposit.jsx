import React, { useState, useRef } from 'react';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, CheckCircle, CreditCard, FlaskConical } from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.dp-root { font-family: 'Nunito', sans-serif; }

@keyframes dp-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.55; }
  95% { opacity:.55; }
  100%{ top:100%; opacity:0; }
}
.dp-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:dp-scan 7s linear infinite; pointer-events:none;
}

@keyframes dp-hex-pulse {
  0%,100% { opacity:.022; }
  50%     { opacity:.05; }
}
.dp-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.04) 1px, transparent 1px);
  background-size:32px 32px;
  animation:dp-hex-pulse 5s ease-in-out infinite;
}

@keyframes dp-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.dp-shim { position:relative; overflow:hidden; }
.dp-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.055),transparent);
  animation:dp-shimmer 5s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes dp-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.45; }
  100% { transform:translateY(-100px) translateX(var(--dx)); opacity:0; }
}
.dp-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:dp-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes dp-balance-glow {
  0%,100% { text-shadow:0 0 20px rgba(251,191,36,.35), 0 0 60px rgba(251,191,36,.12); }
  50%     { text-shadow:0 0 40px rgba(251,191,36,.75), 0 0 100px rgba(251,191,36,.28); }
}
.dp-balance { animation:dp-balance-glow 2.8s ease-in-out infinite; }

@keyframes dp-ring-ping {
  0%   { transform:scale(1); opacity:.7; }
  100% { transform:scale(2.5); opacity:0; }
}
.dp-ring { animation:dp-ring-ping 1.9s ease-out infinite; }

@keyframes dp-float-a {
  0%,100% { transform:translateY(0) rotate(-5deg); }
  50%     { transform:translateY(-12px) rotate(5deg); }
}
@keyframes dp-float-b {
  0%,100% { transform:translateY(0) rotate(4deg); }
  50%     { transform:translateY(-16px) rotate(-4deg); }
}
@keyframes dp-float-c {
  0%,100% { transform:translateY(0) rotate(-3deg); }
  50%     { transform:translateY(-9px) rotate(6deg); }
}
.dp-fa { animation:dp-float-a 5s ease-in-out infinite; }
.dp-fb { animation:dp-float-b 7s ease-in-out infinite 1.2s; }
.dp-fc { animation:dp-float-c 6s ease-in-out infinite 2.5s; }

@keyframes dp-beta-pulse {
  0%,100% { box-shadow:0 0 0 1px rgba(168,85,247,.28), 0 0 14px rgba(168,85,247,.18); }
  50%     { box-shadow:0 0 0 1px rgba(168,85,247,.5),  0 0 28px rgba(168,85,247,.35); }
}
.dp-beta { animation:dp-beta-pulse 2.5s ease-in-out infinite; }

.dp-input { transition:border-color .2s, box-shadow .2s; }
.dp-input:focus {
  outline:none;
  border-color:rgba(251,191,36,.5) !important;
  box-shadow:0 0 0 3px rgba(251,191,36,.09), 0 0 20px rgba(251,191,36,.1) !important;
}
.dp-input::-webkit-outer-spin-button,
.dp-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }

@keyframes spin { to { transform:rotate(360deg); } }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }
`;

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 12 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 22}%`,
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

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Deposit() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [amount, setAmount]         = useState(1000);
  const [depositing, setDepositing] = useState(false);
  const [success, setSuccess]       = useState(false);

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

      <div style={{ maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* ── Page header ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:26, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <Coins style={{ width:20, height:20, color:'#fbbf24' }} />
              <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:0 }}>Deposit</h1>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.28)', marginLeft:13, fontWeight:600 }}>
              Add coins to your balance
            </p>
          </div>

          {/* Beta badge */}
          <div className="dp-beta" style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'7px 14px', borderRadius:12,
            background:'rgba(168,85,247,.1)',
            border:'1px solid rgba(168,85,247,.28)',
          }}>
            <FlaskConical style={{ width:14, height:14, color:'#c084fc' }} />
            <span style={{ fontSize:11, fontWeight:900, color:'#c084fc', letterSpacing:'.12em', textTransform:'uppercase' }}>Beta</span>
          </div>
        </motion.div>

        {/* ── Balance card ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:20,
            background:'linear-gradient(135deg,#070010 0%,#110022 45%,#190038 75%,#07000f 100%)',
            border:'1px solid rgba(251,191,36,.16)',
            boxShadow:'0 0 0 1px rgba(251,191,36,.05), 0 28px 70px rgba(0,0,0,.85), 0 0 100px rgba(251,191,36,.09)',
            padding:'28px 26px 24px',
          }}>

          <div className="dp-scan" />
          <div className="dp-hex" />
          <Particles accent="#fbbf24" count={10} />
          <Particles accent="#a855f7" count={6} />

          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 65% 75% at 82% 50%,rgba(251,191,36,.1) 0%,transparent 58%)',
          }} />

          {/* Floating decos */}
          <div className="dp-fa" style={{ position:'absolute', right:26, top:'8%', fontSize:38, opacity:.28, pointerEvents:'none', filter:'drop-shadow(0 0 14px rgba(251,191,36,.6))' }}>🪙</div>
          <div className="dp-fb" style={{ position:'absolute', right:72, top:'50%', fontSize:24, opacity:.17, pointerEvents:'none', filter:'drop-shadow(0 0 10px rgba(251,191,36,.5))' }}>💰</div>
          <div className="dp-fc" style={{ position:'absolute', right:18, bottom:'10%', fontSize:20, opacity:.14, pointerEvents:'none', filter:'drop-shadow(0 0 8px rgba(168,85,247,.5))' }}>✨</div>

          <div style={{ position:'relative', zIndex:2 }}>
            <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.28)', textTransform:'uppercase', letterSpacing:'.2em', marginBottom:12 }}>
              Current Balance
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
                <div className="dp-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(251,191,36,.4)' }} />
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 8px #fbbf24' }} />
              </div>
              <span className="dp-balance" style={{
                fontSize:44, fontWeight:900, lineHeight:1,
                background:'linear-gradient(90deg,#fef3c7,#fbbf24 45%,#f59e0b)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                {(balance || 0).toLocaleString()}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:'rgba(251,191,36,.45)', alignSelf:'flex-end', paddingBottom:5 }}>
                coins
              </span>
            </div>
            <p style={{ fontSize:11, color:'rgba(255,255,255,.22)', fontWeight:700 }}>
              {user?.username || 'Player'}
            </p>
          </div>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.55),rgba(168,85,247,.4),transparent)',
          }} />
        </motion.div>

        {/* ── Deposit form card ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.16 }}
          className="dp-shim"
          style={{
            position:'relative', overflow:'hidden', borderRadius:20,
            background:'linear-gradient(145deg,#070010,#0e0020,#03000a)',
            border:'1px solid rgba(251,191,36,.12)',
            boxShadow:'0 0 0 1px rgba(251,191,36,.04), 0 20px 55px rgba(0,0,0,.82)',
            padding:'24px 22px 22px',
          }}>

          <div className="dp-scan" />
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)',
          }} />

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Plus style={{ width:15, height:15, color:'#fbbf24' }} />
            <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>Add Coins</span>
          </div>

          {/* Quick amounts */}
          <p style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:10 }}>
            Quick Select
          </p>
          <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
            {QUICK_AMOUNTS.map(v => {
              const active = amount === v;
              return (
                <motion.button
                  key={v}
                  whileHover={{ scale:1.06, y:-2 }}
                  whileTap={{ scale:.95 }}
                  onClick={() => setAmount(v)}
                  style={{
                    padding:'8px 16px', borderRadius:10, cursor:'pointer',
                    fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:900,
                    background: active ? 'rgba(251,191,36,.15)' : 'rgba(255,255,255,.04)',
                    border:`1px solid ${active ? 'rgba(251,191,36,.45)' : 'rgba(255,255,255,.07)'}`,
                    color: active ? '#fbbf24' : 'rgba(255,255,255,.38)',
                    boxShadow: active ? '0 0 18px rgba(251,191,36,.2)' : 'none',
                    position:'relative', overflow:'hidden',
                    transition:'all .16s',
                  }}>
                  {active && (
                    <div style={{
                      position:'absolute', top:0, left:0, right:0, height:1,
                      background:'linear-gradient(90deg,transparent,#fbbf24,transparent)',
                    }} />
                  )}
                  {v.toLocaleString()}
                </motion.button>
              );
            })}
          </div>

          {/* Custom input */}
          <p style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:8 }}>
            Custom Amount
          </p>
          <div style={{ position:'relative', marginBottom:22 }}>
            <div style={{
              position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
              fontSize:15, pointerEvents:'none', lineHeight:1,
            }}>🪙</div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              className="dp-input"
              style={{
                width:'100%', padding:'13px 14px 13px 40px', borderRadius:12,
                border:'1px solid rgba(255,255,255,.09)',
                background:'rgba(255,255,255,.04)', color:'#fff',
                fontSize:17, fontWeight:800, fontFamily:'Nunito,sans-serif',
                boxSizing:'border-box',
              }}
              min={1}
            />
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
                  padding:'13px 15px', borderRadius:12, marginBottom:16,
                  background:'rgba(34,197,94,.07)', border:'1px solid rgba(34,197,94,.22)',
                  boxShadow:'0 0 28px rgba(34,197,94,.08)',
                }}>
                <CheckCircle style={{ width:20, height:20, color:'#4ade80', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:900, color:'#4ade80', marginBottom:1 }}>Deposit Successful!</p>
                  <p style={{ fontSize:11, color:'rgba(74,222,128,.55)', fontWeight:600 }}>
                    +{amount.toLocaleString()} coins added to your balance
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
              width:'100%', height:50, borderRadius:13, border:'none',
              cursor: canDeposit ? 'pointer' : 'not-allowed',
              background: canDeposit
                ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)'
                : 'rgba(255,255,255,.05)',
              color: canDeposit ? '#000' : 'rgba(255,255,255,.18)',
              fontSize:15, fontWeight:900, fontFamily:'Nunito,sans-serif',
              boxShadow: canDeposit ? '0 0 50px rgba(251,191,36,.45), 0 4px 24px rgba(0,0,0,.5)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              transition:'all .2s', position:'relative', overflow:'hidden',
            }}>
            {canDeposit && (
              <div style={{
                position:'absolute', top:0, left:0, right:0, bottom:0,
                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)',
                animation:'dp-shimmer 3s ease-in-out infinite',
              }} />
            )}
            {depositing ? (
              <>
                <div style={{
                  width:17, height:17, borderRadius:'50%',
                  border:'2px solid rgba(0,0,0,.25)', borderTopColor:'#000',
                  animation:'spin 1s linear infinite', flexShrink:0,
                }} />
                Processing…
              </>
            ) : (
              <>
                <CreditCard style={{ width:17, height:17 }} />
                {amount > 0 ? `Deposit ${amount.toLocaleString()} Coins` : 'Enter an amount'}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* ── Beta notice ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.24 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:16,
            background:'rgba(168,85,247,.06)',
            border:'1px solid rgba(168,85,247,.18)',
            padding:'16px 18px',
            display:'flex', alignItems:'flex-start', gap:14,
          }}>
          <div className="dp-scan" />
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:'rgba(168,85,247,.14)', border:'1px solid rgba(168,85,247,.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 18px rgba(168,85,247,.2)',
          }}>
            <FlaskConical style={{ width:16, height:16, color:'#c084fc' }} />
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:900, color:'#c084fc', marginBottom:4 }}>
              Beta — coins are free 🎉
            </p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:600, lineHeight:1.6 }}>
              No real money involved. All deposits are simulated and added instantly while we're in beta. Enjoy the free coins and help us test!
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}