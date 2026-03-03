import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, TrendingUp, Gift, ChevronDown, Zap, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.rf { font-family: 'Nunito', sans-serif; }

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

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.08), 0 8px 32px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.22), 0 8px 32px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.1); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(380%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:20%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:shim 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes spin-loader { to { transform:rotate(360deg); } }

.btn-gold {
  position:relative; overflow:hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
}
.btn-gold:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
.btn-gold:active:not(:disabled){ transform: scale(.97); }
.btn-gold::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
  transform:skewX(-15deg); transition:left .5s;
}
.btn-gold:hover::after { left:120%; }

.tier-card {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), border-color .22s;
}
.tier-card:hover { transform: translateY(-2px) scale(1.02); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const TIERS = [
  { name: 'Bronze',   commission: 2.5,  maxDeposited: 25000,   color: '#cd7f32', glow: 'rgba(205,127,50,.4)'  },
  { name: 'Silver',   commission: 5.0,  maxDeposited: 100000,  color: '#c0c0c0', glow: 'rgba(192,192,192,.4)' },
  { name: 'Gold',     commission: 7.5,  maxDeposited: 500000,  color: '#fbbf24', glow: 'rgba(251,191,36,.5)'  },
  { name: 'Diamond',  commission: 10,   maxDeposited: Infinity, color: '#a855f7', glow: 'rgba(168,85,247,.5)'  },
];

function getTier(d) { return TIERS.find(t => d < t.maxDeposited) || TIERS[TIERS.length - 1]; }

function generateCode(name, email) {
  const base = (name || email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
  return `${base}${Math.floor(Math.random() * 999)}`;
}

/* ── Stat card ── */
function StatCard({ label, value, accent = '#fbbf24', delay = 0, children }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="shim" style={{
        position:'relative', overflow:'hidden', borderRadius:12,
        background:'linear-gradient(145deg,#07000f,#0e001a)',
        border:'1px solid rgba(251,191,36,.08)',
        padding:'14px 16px',
        boxShadow:'0 4px 20px rgba(0,0,0,.6)',
      }}>
      <div className="scan" />
      <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'.08em', textTransform:'uppercase' }}>{label}</p>
      {children || (
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{
            width:18, height:18, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 8px rgba(251,191,36,.45)',
          }}>
            <span style={{ fontSize:8, fontWeight:900, color:'#000' }}>$</span>
          </div>
          <span style={{ fontSize:22, fontWeight:900, color:accent }}>{value}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function Referrals() {
  const { user, reload: reloadUser } = useWallet();
  const [referrals,  setReferrals]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [codeInput,  setCodeInput]  = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTiers,  setShowTiers]  = useState(false);
  const [claiming,   setClaiming]   = useState(false);
  const [timeRange,  setTimeRange]  = useState('All');

  useEffect(() => {
    if (!user) return;
    if (!user.affiliate_code) {
      const code = generateCode(user.full_name, user.email);
      base44.auth.updateMe({ affiliate_code: code }).then(() => reloadUser?.());
    } else {
      setCodeInput(user.affiliate_code);
    }
    base44.entities.Referral.filter({ referrer_email: user.email }).then(data => {
      setReferrals(data || []);
      setLoading(false);
    });
  }, [user?.email]);

  useEffect(() => {
    if (user?.affiliate_code) setCodeInput(user.affiliate_code);
  }, [user?.affiliate_code]);

  const totalDeposited = user?.total_deposited || 0;
  const totalEarnings  = user?.affiliate_earnings || 0;
  const claimable      = user?.affiliate_earnings_claimable || 0;
  const tier      = getTier(totalDeposited);
  const nextTier  = TIERS[TIERS.indexOf(tier) + 1];
  const tierPct   = nextTier ? Math.min((totalDeposited / tier.maxDeposited) * 100, 100) : 100;
  const affiliateLink = user?.affiliate_code ? `${window.location.origin}?ref=${user.affiliate_code}` : '';

  const handleSaveCode = async () => {
    if (!codeInput.trim() || codeInput === user?.affiliate_code) return;
    setSavingCode(true);
    await base44.auth.updateMe({ affiliate_code: codeInput.trim().toLowerCase().replace(/\s+/g, '') });
    await reloadUser?.();
    setSavingCode(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user?.affiliate_code || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClaim = async () => {
    if (claimable <= 0) return;
    setClaiming(true);
    await base44.auth.updateMe({ balance: (user.balance || 0) + claimable, affiliate_earnings_claimable: 0 });
    await reloadUser?.();
    setClaiming(false);
  };

  const chartData = referrals.length > 0
    ? referrals.map((r, i) => ({ name: `Ref ${i+1}`, earnings: r.earnings || 0 }))
    : [{ name: '-', earnings: 0 }];

  if (!user) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:'#04000a' }}>
      <div style={{ position:'relative', width:40, height:40 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #fbbf24', animation:'spin-loader 1s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <div className="rf" style={{ background:'#04000a', minHeight:'100vh', marginLeft:-24, marginRight:-24, padding:'22px 18px 80px' }}>
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
            }}>Affiliates</h1>
            <p style={{ margin:0, fontSize:10, color:'rgba(251,191,36,.4)', fontWeight:600 }}>
              Earn by referring new players
            </p>
          </div>
        </div>
        <div style={{ height:2, borderRadius:2, background:'linear-gradient(90deg,#fbbf24,#a855f7,transparent)', width:130 }} />
      </motion.div>

      {/* ── Tier banner ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
        className="shim gold-glow" style={{
          position:'relative', overflow:'hidden', borderRadius:14,
          background:'linear-gradient(145deg,#0a0010,#14002a)',
          border:`1px solid ${tier.color}30`,
          padding:'16px',
          marginBottom:12,
          boxShadow:`0 0 40px ${tier.glow.replace('.5','.1').replace('.4','.08')}`,
        }}>
        <div className="scan" />
        {/* Ambient glow */}
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', pointerEvents:'none', background:`radial-gradient(circle,${tier.glow.replace('.5','.12').replace('.4','.1')} 0%,transparent 70%)` }} />

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {/* Tier icon */}
          <div style={{
            width:52, height:52, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg,${tier.color}25,${tier.color}10)`,
            border:`1px solid ${tier.color}40`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 20px ${tier.glow.replace('.5','.3').replace('.4','.25')}`,
          }}>
            <Star style={{ width:22, height:22, color:tier.color }} />
          </div>

          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{
                fontSize:16, fontWeight:900, color:tier.color,
                textShadow:`0 0 14px ${tier.glow.replace('.5','.4').replace('.4','.35')}`,
              }}>{tier.name}</span>
              <span style={{
                fontSize:9, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase',
                padding:'2px 7px', borderRadius:100,
                background:`${tier.color}18`, border:`1px solid ${tier.color}35`,
                color:tier.color,
              }}>{tier.commission}% commission</span>
            </div>
            {/* Progress bar */}
            <div style={{ height:4, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden', marginBottom:4 }}>
              <div style={{
                height:'100%', width:`${tierPct}%`, borderRadius:99,
                background:`linear-gradient(90deg,${tier.color}88,${tier.color})`,
                boxShadow:`0 0 8px ${tier.glow.replace('.5','.5').replace('.4','.4')}`,
                transition:'width .7s ease',
              }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontWeight:600 }}>{totalDeposited.toLocaleString()} deposited</span>
              <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontWeight:600 }}>{nextTier ? `${tier.maxDeposited.toLocaleString()} for ${nextTier.name}` : 'MAX TIER'}</span>
            </div>
          </div>
        </div>

        {/* View tiers toggle */}
        <button onClick={() => setShowTiers(v => !v)} style={{
          width:'100%', marginTop:12, padding:'8px 0', borderRadius:9, border:'none', cursor:'pointer',
          background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)',
          fontSize:11, fontWeight:700, fontFamily:'Nunito,sans-serif', color:'rgba(255,255,255,.35)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all .2s',
        }}>
          View All Tiers
          <ChevronDown style={{ width:13, height:13, transform: showTiers ? 'rotate(180deg)' : 'none', transition:'transform .2s' }} />
        </button>

        <AnimatePresence>
          {showTiers && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              style={{ overflow:'hidden', marginTop:10 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {TIERS.map(t => (
                  <div key={t.name} className="tier-card" style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'8px 12px', borderRadius:9,
                    background: t.name === tier.name ? `${t.color}12` : 'rgba(255,255,255,.02)',
                    border:`1px solid ${t.name === tier.name ? t.color+'30' : 'rgba(255,255,255,.05)'}`,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:t.color, boxShadow:`0 0 6px ${t.color}` }} />
                      <span style={{ fontSize:12, fontWeight:800, color: t.name === tier.name ? t.color : 'rgba(255,255,255,.5)' }}>{t.name}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color: t.name === tier.name ? '#fbbf24' : 'rgba(255,255,255,.3)' }}>{t.commission}%</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,.2)', fontWeight:600 }}>
                        {t.maxDeposited === Infinity ? '∞' : `up to ${t.maxDeposited.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Referral code + link ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
        className="shim" style={{
          position:'relative', overflow:'hidden', borderRadius:14,
          background:'linear-gradient(145deg,#07000f,#0e001a)',
          border:'1px solid rgba(251,191,36,.08)', padding:'14px',
          marginBottom:12,
        }}>
        <div className="scan" />
        <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', letterSpacing:'.06em', textTransform:'uppercase' }}>Your Referral Code</p>

        {/* Code row */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            style={{
              flex:1, height:38, padding:'0 12px',
              background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.18)',
              borderRadius:9, outline:'none', fontSize:13, fontWeight:800,
              fontFamily:'Nunito,sans-serif', color:'#fbbf24', boxSizing:'border-box',
            }}
          />
          <button className="btn-gold" onClick={handleSaveCode} disabled={savingCode || codeInput === user?.affiliate_code} style={{
            height:38, padding:'0 16px', borderRadius:9, border:'none', cursor:'pointer',
            background: codeInput !== user?.affiliate_code ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.06)',
            border: codeInput !== user?.affiliate_code ? 'none' : '1px solid rgba(255,255,255,.08)',
            color: codeInput !== user?.affiliate_code ? '#000' : 'rgba(255,255,255,.25)',
            fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', transition:'all .3s',
          }}>
            {savingCode ? '…' : 'Save'}
          </button>
          <button onClick={handleCopyCode} style={{
            width:38, height:38, borderRadius:9, border:'1px solid rgba(251,191,36,.18)',
            background:'rgba(251,191,36,.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color: copied ? '#4ade80' : 'rgba(251,191,36,.6)', transition:'color .2s',
          }}>
            {copied ? <Check style={{ width:14, height:14 }} /> : <Copy style={{ width:14, height:14 }} />}
          </button>
        </div>

        {/* Full link row */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{
            flex:1, height:34, padding:'0 10px',
            background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)',
            borderRadius:9, display:'flex', alignItems:'center', overflow:'hidden',
          }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {affiliateLink}
            </span>
          </div>
          <button className="btn-gold" onClick={handleCopyLink} style={{
            height:34, padding:'0 14px', borderRadius:9, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#a855f7,#7c3aed)', color:'#fff',
            fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif',
            display:'flex', alignItems:'center', gap:5,
          }}>
            {copiedLink ? <Check style={{ width:12, height:12 }} /> : <Copy style={{ width:12, height:12 }} />}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </motion.div>

      {/* ── Stats grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <StatCard label="Total Referrals" delay={.12}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Users style={{ width:16, height:16, color:'rgba(168,85,247,.7)' }} />
            <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>{referrals.length}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:700 }}>users</span>
          </div>
        </StatCard>

        <StatCard label="Total Deposited" value={totalDeposited.toLocaleString()} delay={.14} />

        <StatCard label="Total Earnings" value={totalEarnings.toLocaleString()} delay={.16} />

        {/* Claimable — special */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.18 }}
          className="shim" style={{
            position:'relative', overflow:'hidden', borderRadius:12,
            background: claimable > 0 ? 'linear-gradient(145deg,#0a1200,#0f1a00)' : 'linear-gradient(145deg,#07000f,#0e001a)',
            border:`1px solid ${claimable > 0 ? 'rgba(74,222,128,.2)' : 'rgba(251,191,36,.08)'}`,
            padding:'14px 16px',
            boxShadow: claimable > 0 ? '0 0 20px rgba(74,222,128,.08)' : 'none',
          }}>
          <div className="scan" />
          <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color: claimable > 0 ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.3)', letterSpacing:'.08em', textTransform:'uppercase' }}>Available</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{
                width:18, height:18, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 8px rgba(251,191,36,.45)',
              }}>
                <span style={{ fontSize:8, fontWeight:900, color:'#000' }}>$</span>
              </div>
              <span style={{ fontSize:20, fontWeight:900, color: claimable > 0 ? '#4ade80' : 'rgba(255,255,255,.25)' }}>
                {claimable.toLocaleString()}
              </span>
            </div>
            <button className="btn-gold" onClick={handleClaim} disabled={claimable <= 0 || claiming} style={{
              height:30, padding:'0 12px', borderRadius:8, border:'none',
              cursor: claimable > 0 ? 'pointer' : 'not-allowed',
              background: claimable > 0 ? 'linear-gradient(135deg,#4ade80,#16a34a)' : 'rgba(255,255,255,.05)',
              color: claimable > 0 ? '#000' : 'rgba(255,255,255,.2)',
              fontSize:11, fontWeight:900, fontFamily:'Nunito,sans-serif',
              boxShadow: claimable > 0 ? '0 0 16px rgba(74,222,128,.3)' : 'none',
              transition:'all .3s',
            }}>
              {claiming ? '…' : 'Claim'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Earnings chart ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.22 }}
        className="shim gold-glow" style={{
          position:'relative', overflow:'hidden', borderRadius:14,
          background:'linear-gradient(145deg,#07000f,#0e001a)',
          border:'1px solid rgba(251,191,36,.08)', padding:'14px',
          marginBottom:12,
        }}>
        <div className="scan" />

        {/* Chart header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <TrendingUp style={{ width:13, height:13, color:'#fbbf24' }} />
            <span style={{ fontSize:13, fontWeight:900, color:'rgba(255,255,255,.7)' }}>Earnings Over Time</span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {['1D','7D','1M','All'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{
                padding:'3px 9px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:10, fontWeight:800, fontFamily:'Nunito,sans-serif', transition:'all .2s',
                background: timeRange===r ? 'rgba(251,191,36,.15)' : 'transparent',
                color: timeRange===r ? '#fbbf24' : 'rgba(255,255,255,.25)',
                boxShadow: timeRange===r ? 'inset 0 0 0 1px rgba(251,191,36,.2)' : 'none',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Big earnings number */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:'linear-gradient(135deg,rgba(251,191,36,.2),rgba(168,85,247,.15))',
            border:'1px solid rgba(251,191,36,.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:7, fontWeight:900, color:'#000' }}>$</span>
            </div>
          </div>
          <span style={{ fontSize:24, fontWeight:900, color:'#fbbf24' }}>{totalEarnings.toLocaleString()}</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.25)', fontWeight:600 }}>total earned</span>
        </div>

        {referrals.length === 0 ? (
          <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.15)', fontWeight:600 }}>No earnings data yet — share your link!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip contentStyle={{
                background:'#0e001a', border:'1px solid rgba(251,191,36,.2)',
                borderRadius:8, color:'#fbbf24', fontSize:11, fontFamily:'Nunito,sans-serif',
              }} />
              <Area type="monotone" dataKey="earnings" stroke="#fbbf24" fill="url(#earningsGrad)" strokeWidth={2}
                style={{ filter:'drop-shadow(0 0 4px rgba(251,191,36,.5))' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── Referred users ── */}
      {referrals.length > 0 && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.26 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:14,
            background:'linear-gradient(145deg,#07000f,#0e001a)',
            border:'1px solid rgba(251,191,36,.08)',
          }}>
          <div className="scan" />

          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px 10px', borderBottom:'1px solid rgba(251,191,36,.06)' }}>
            <div style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Users style={{ width:13, height:13, color:'#fbbf24' }} />
            <span style={{ fontSize:13, fontWeight:900, color:'rgba(255,255,255,.7)' }}>Referred Users</span>
            <span style={{
              marginLeft:'auto', fontSize:10, fontWeight:700,
              color:'rgba(251,191,36,.5)', background:'rgba(251,191,36,.08)',
              border:'1px solid rgba(251,191,36,.15)', borderRadius:100, padding:'1px 8px',
            }}>{referrals.length}</span>
          </div>

          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {referrals.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * .03 }}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                  borderBottom:'1px solid rgba(255,255,255,.03)',
                }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background:'rgba(168,85,247,.12)', border:'1px solid rgba(168,85,247,.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:800, color:'#c084fc',
                }}>
                  {r.referred_email?.[0]?.toUpperCase() || '?'}
                </div>
                <span style={{ flex:1, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.referred_email}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{
                    width:13, height:13, borderRadius:'50%',
                    background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    <span style={{ fontSize:6, fontWeight:900, color:'#000' }}>$</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24' }}>
                    {(r.earnings || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}