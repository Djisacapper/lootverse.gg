import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Gift, Star, Check, Info, Trophy } from 'lucide-react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.rw { font-family: 'Nunito', sans-serif; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; } 95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:scan 6s linear infinite; pointer-events:none;
}

@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(380%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:20%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:shim 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.08), 0 8px 32px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.22), 0 8px 32px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.1); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

@keyframes spin-loader { to { transform: rotate(360deg); } }

@keyframes countdown-pulse {
  0%,100% { opacity:.7; }
  50%     { opacity:1; }
}
.countdown { animation: countdown-pulse 1s ease-in-out infinite; }

@keyframes claim-pop {
  0%  { transform: scale(.85); opacity:0; }
  60% { transform: scale(1.05); }
  100%{ transform: scale(1); opacity:1; }
}
.claim-pop { animation: claim-pop .4s cubic-bezier(.34,1.56,.64,1) forwards; }

.btn-gold {
  position:relative; overflow:hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
}
.btn-gold:hover:not(:disabled) { transform: translateY(-2px) scale(1.04); }
.btn-gold:active:not(:disabled){ transform: scale(.97); }
.btn-gold::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
  transform:skewX(-15deg); transition:left .5s;
}
.btn-gold:hover::after { left:120%; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const COOLDOWNS = {
  daily:   24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

function formatTimeLeft(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 24) return `${Math.ceil(ms / 86400000)}d left`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const RAKEBACK_TIERS = [
  {
    key: 'instant', label: 'Instant', sublabel: 'Always available',
    color: '#c084fc', glow: 'rgba(192,132,252,.45)',
    bg: 'linear-gradient(145deg,#1a0030,#2a0050)',
    border: 'rgba(192,132,252,.2)',
    icon: Zap,
  },
  {
    key: 'daily', label: 'Daily', sublabel: '24h cooldown',
    color: '#60a5fa', glow: 'rgba(96,165,250,.4)',
    bg: 'linear-gradient(145deg,#00101a,#001a2a)',
    border: 'rgba(96,165,250,.2)',
    icon: Clock,
  },
  {
    key: 'weekly', label: 'Weekly', sublabel: '7 day cooldown',
    color: '#fbbf24', glow: 'rgba(251,191,36,.45)',
    bg: 'linear-gradient(145deg,#0f0800,#1a0d00)',
    border: 'rgba(251,191,36,.2)',
    icon: Star,
  },
  {
    key: 'monthly', label: 'Monthly', sublabel: '30 day cooldown',
    color: '#a855f7', glow: 'rgba(168,85,247,.45)',
    bg: 'linear-gradient(145deg,#10001a,#1a0030)',
    border: 'rgba(168,85,247,.2)',
    icon: Trophy,
  },
];

function CoinIcon({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 8px rgba(251,191,36,.5)',
    }}>
      <span style={{ fontSize: size * 0.5, fontWeight: 900, color: '#000' }}>$</span>
    </div>
  );
}

export default function Rewards() {
  const { user, reload: reloadUser, updateBalance } = useWallet();
  useRequireAuth();
  const [refCode,    setRefCode]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rakeback,   setRakeback]   = useState({ instant:0, daily:0, weekly:0, monthly:0 });
  const [claiming,   setClaiming]   = useState({});
  const [now,        setNow]        = useState(Date.now());
  const [claimedKey, setClaimedKey] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    setRakeback({
      instant: user.rakeback_instant || 0,
      daily:   user.rakeback_daily   || 0,
      weekly:  user.rakeback_weekly  || 0,
      monthly: user.rakeback_monthly || 0,
    });
  }, [user]);

  const getCooldownLeft = (key) => {
    if (key === 'instant') return 0;
    const claimedAt = user?.[`rakeback_${key}_claimed_at`];
    if (!claimedAt) return 0;
    return Math.max(0, COOLDOWNS[key] - (now - new Date(claimedAt).getTime()));
  };

  const totalClaimed    = user?.total_rakeback_claimed || 0;
  const totalClaimable  = Object.values(rakeback).reduce((a, b) => a + b, 0);
  const alreadyHasCode  = !!user?.referred_by;

  const handleClaimRefCode = async () => {
    if (!refCode.trim() || !user) return;
    const code = refCode.trim().toLowerCase();
    if (user.affiliate_code && code === user.affiliate_code.toLowerCase()) return;
    setSubmitting(true);
    try {
      const users    = await base44.entities.User.list();
      const referrer = users.find(u => u.affiliate_code?.toLowerCase() === code);
      if (!referrer) { setSubmitting(false); return; }
      await base44.auth.updateMe({ referred_by: code });
      await base44.entities.Referral.create({
        referrer_email: referrer.email, referred_email: user.email, earnings: 0, status: 'active',
      });
      await reloadUser?.();
      setRefCode('');
    } catch {}
    setSubmitting(false);
  };

  const handleClaimRakeback = async (key) => {
    const amount = rakeback[key];
    if (!amount || amount <= 0 || getCooldownLeft(key) > 0) return;
    setClaiming(c => ({ ...c, [key]: true }));
    const updates = {
      [`rakeback_${key}`]: 0,
      total_rakeback_claimed: (user?.total_rakeback_claimed || 0) + amount,
    };
    if (key !== 'instant') updates[`rakeback_${key}_claimed_at`] = new Date().toISOString();
    await base44.auth.updateMe(updates);
    await updateBalance(amount, 'daily_reward', `${key} rakeback claimed`);
    await reloadUser?.();
    setRakeback(r => ({ ...r, [key]: 0 }));
    setClaiming(c => ({ ...c, [key]: false }));
    setClaimedKey(key);
    setTimeout(() => setClaimedKey(null), 2000);
  };

  return (
    <div className="rw" style={{ background:'#04000a', minHeight:'100vh', marginLeft:-24, marginRight:-24, padding:'22px 18px 80px' }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:'linear-gradient(135deg,rgba(251,191,36,.2),rgba(168,85,247,.2))',
            border:'1px solid rgba(251,191,36,.22)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Gift style={{ width:14, height:14, color:'#fbbf24' }} />
          </div>
          <div>
            <h1 style={{
              margin:0, fontSize:20, fontWeight:900, lineHeight:1,
              background:'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc 75%,#a855f7)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>Rewards</h1>
            <p style={{ margin:0, fontSize:10, color:'rgba(251,191,36,.4)', fontWeight:600 }}>
              Claim rakeback & apply referral codes
            </p>
          </div>
        </div>
        <div style={{ height:2, borderRadius:2, background:'linear-gradient(90deg,#fbbf24,#a855f7,transparent)', width:130 }} />
      </motion.div>

      {/* ── Hero banner ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
        className="shim" style={{
          position:'relative', overflow:'hidden', borderRadius:16,
          background:'linear-gradient(135deg,#0a0018 0%,#150030 50%,#08000f 100%)',
          border:'1px solid rgba(168,85,247,.2)',
          padding:'20px 18px',
          marginBottom:12,
          boxShadow:'0 0 60px rgba(168,85,247,.08), 0 12px 40px rgba(0,0,0,.6)',
        }}>
        <div className="scan" />

        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)' }} />

        {/* Ambient */}
        <div style={{ position:'absolute', top:-30, right:-20, width:150, height:150, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle,rgba(168,85,247,.12) 0%,transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-20, left:20, width:100, height:100, borderRadius:'50%', pointerEvents:'none', background:'radial-gradient(circle,rgba(251,191,36,.08) 0%,transparent 70%)' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ marginBottom:14 }}>
            <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:900, color:'#fff', lineHeight:1.2 }}>
              Earn up to{' '}
              <span style={{
                background:'linear-gradient(90deg,#fbbf24,#f59e0b)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>5% back</span>{' '}
              on every bet
            </h2>
            <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:600, lineHeight:1.5 }}>
              Rakeback rewards distributed across instant, daily, weekly & monthly pools.
            </p>
          </div>

          {/* Ref code section */}
          {alreadyHasCode ? (
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 14px', borderRadius:10,
              background:'rgba(74,222,128,.08)', border:'1px solid rgba(74,222,128,.2)',
            }}>
              <Check style={{ width:14, height:14, color:'#4ade80', flexShrink:0 }} />
              <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontWeight:700 }}>Referral code applied:</span>
              <span style={{ fontSize:12, fontWeight:900, color:'#4ade80' }}>{user.referred_by}</span>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ position:'relative', flex:1 }}>
                <input
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  placeholder="Enter referral code…"
                  style={{
                    width:'100%', height:40, padding:'0 36px 0 12px',
                    background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
                    borderRadius:10, outline:'none', fontSize:12, fontWeight:700,
                    fontFamily:'Nunito,sans-serif', color:'rgba(255,255,255,.8)',
                    boxSizing:'border-box',
                  }}
                />
                <Info style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'rgba(255,255,255,.2)', pointerEvents:'none' }} />
              </div>
              <button className="btn-gold" onClick={handleClaimRefCode} disabled={!refCode.trim() || submitting} style={{
                height:40, padding:'0 16px', borderRadius:10, border:'none',
                cursor: refCode.trim() ? 'pointer' : 'not-allowed',
                background: refCode.trim() ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.06)',
                color: refCode.trim() ? '#000' : 'rgba(255,255,255,.2)',
                fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif',
                boxShadow: refCode.trim() ? '0 0 20px rgba(251,191,36,.35)' : 'none',
                transition:'all .3s', flexShrink:0,
              }}>
                {submitting ? '…' : 'Apply Code'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
        {[
          { label:'Total Claimed', value: totalClaimed, delay:.08 },
          { label:'Total Pending', value: 0,            delay:.1  },
          { label:'Claimable Now', value: totalClaimable, delay:.12, green: true },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:s.delay }}
            className="shim" style={{
              position:'relative', overflow:'hidden', borderRadius:12,
              background: s.green && totalClaimable > 0
                ? 'linear-gradient(145deg,#0a1200,#0f1a00)'
                : 'linear-gradient(145deg,#07000f,#0e001a)',
              border:`1px solid ${s.green && totalClaimable > 0 ? 'rgba(74,222,128,.2)' : 'rgba(251,191,36,.07)'}`,
              padding:'12px 14px',
            }}>
            <div className="scan" />
            <p style={{ margin:'0 0 6px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color: s.green && totalClaimable > 0 ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.3)' }}>
              {s.label}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <CoinIcon size={14} />
              <span style={{ fontSize:16, fontWeight:900, color: s.green && totalClaimable > 0 ? '#4ade80' : '#fff' }}>
                {s.value.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Rakeback section header ── */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.14 }}
        style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
        <Zap style={{ width:13, height:13, color:'#fbbf24' }} />
        <span style={{ fontSize:13, fontWeight:900, color:'rgba(255,255,255,.7)' }}>Rakeback Pools</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:600 }}>— a % of every bet returned</span>
      </motion.div>

      {/* ── Rakeback cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {RAKEBACK_TIERS.map((tier, i) => {
          const amount      = rakeback[tier.key] || 0;
          const cooldown    = getCooldownLeft(tier.key);
          const onCooldown  = cooldown > 0;
          const canClaim    = amount > 0 && !onCooldown;
          const isClaiming  = claiming[tier.key];
          const justClaimed = claimedKey === tier.key;
          const Icon        = tier.icon;

          return (
            <motion.div key={tier.key}
              initial={{ opacity:0, y:14, scale:.96 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ delay:.16 + i * .05, duration:.45, ease:[.22,1,.36,1] }}
              className="shim" style={{
                position:'relative', overflow:'hidden', borderRadius:14,
                background: tier.bg,
                border:`1px solid ${canClaim ? tier.border : 'rgba(255,255,255,.05)'}`,
                padding:'16px 14px',
                boxShadow: canClaim ? `0 0 30px ${tier.glow.replace('.45','.08').replace('.4','.08')}` : 'none',
                transition:'border-color .3s, box-shadow .3s',
              }}>
              <div className="scan" />

              {/* Ambient glow */}
              <div style={{
                position:'absolute', top:-20, right:-10, width:80, height:80, borderRadius:'50%', pointerEvents:'none',
                background:`radial-gradient(circle,${tier.glow.replace('.45','.12').replace('.4','.1')} 0%,transparent 70%)`,
              }} />

              {/* Top: icon + label */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14, position:'relative', zIndex:1 }}>
                <div style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  background:`${tier.color}18`, border:`1px solid ${tier.color}35`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 0 14px ${tier.glow.replace('.45','.25').replace('.4','.2')}`,
                }}>
                  <Icon style={{ width:16, height:16, color:tier.color }} />
                </div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:900, color:'#fff' }}>{tier.label}</p>
                  <p style={{ margin:0, fontSize:9, fontWeight:600, color:'rgba(255,255,255,.3)' }}>{tier.sublabel}</p>
                </div>
              </div>

              {/* Amount */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, position:'relative', zIndex:1 }}>
                <CoinIcon size={18} />
                <span style={{
                  fontSize:22, fontWeight:900,
                  color: amount > 0 ? tier.color : 'rgba(255,255,255,.2)',
                  textShadow: amount > 0 ? `0 0 14px ${tier.glow.replace('.45','.4').replace('.4','.35')}` : 'none',
                  transition:'color .3s',
                }}>{amount.toLocaleString()}</span>
              </div>

              {/* Claim / cooldown button */}
              <div style={{ position:'relative', zIndex:1 }}>
                {justClaimed ? (
                  <div className="claim-pop" style={{
                    width:'100%', padding:'9px 0', borderRadius:10,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    background:'rgba(74,222,128,.15)', border:'1px solid rgba(74,222,128,.3)',
                  }}>
                    <Check style={{ width:13, height:13, color:'#4ade80' }} />
                    <span style={{ fontSize:12, fontWeight:900, color:'#4ade80' }}>Claimed!</span>
                  </div>
                ) : onCooldown ? (
                  <div style={{
                    width:'100%', padding:'9px 0', borderRadius:10, textAlign:'center',
                    background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)',
                  }}>
                    <span className="countdown" style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.3)' }}>
                      ⏳ {formatTimeLeft(cooldown)}
                    </span>
                  </div>
                ) : (
                  <button className="btn-gold" onClick={() => handleClaimRakeback(tier.key)}
                    disabled={!canClaim || isClaiming} style={{
                      width:'100%', padding:'9px 0', borderRadius:10, border:'none',
                      cursor: canClaim ? 'pointer' : 'not-allowed',
                      background: canClaim
                        ? `linear-gradient(135deg,${tier.color},${tier.color}99)`
                        : 'rgba(255,255,255,.05)',
                      color: canClaim ? (tier.key === 'weekly' ? '#000' : '#fff') : 'rgba(255,255,255,.2)',
                      fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif',
                      boxShadow: canClaim ? `0 0 20px ${tier.glow.replace('.45','.3').replace('.4','.25')}` : 'none',
                      transition:'all .3s',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    }}>
                    {isClaiming
                      ? <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,.25)', borderTopColor:'#fff', animation:'spin-loader 1s linear infinite' }} />
                      : <Zap style={{ width:12, height:12 }} />
                    }
                    {isClaiming ? '…' : canClaim ? 'Claim Now' : 'Nothing to claim'}
                  </button>
                )}
              </div>

              {/* Hover top line */}
              <div style={{
                position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg,transparent,${tier.color},transparent)`,
                opacity: canClaim ? 1 : 0,
                transition:'opacity .3s',
                pointerEvents:'none',
              }} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}