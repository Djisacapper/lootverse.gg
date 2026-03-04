import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Copy, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../Portal';
import { safeAvatarUrl } from './usePlayerAvatars';

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');

.usm-root { font-family: 'Outfit', sans-serif; }
.usm-title { font-family: 'Rajdhani', sans-serif; }

@keyframes usm-scan {
  0%   { top: -1px; opacity: 0; }
  5%   { opacity: .6; }
  95%  { opacity: .6; }
  100% { top: 100%; opacity: 0; }
}
.usm-scan {
  position: absolute; left: 0; right: 0; height: 1px; z-index: 10; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(245,200,66,.25), transparent);
  animation: usm-scan 7s linear infinite;
}

@keyframes usm-noise-drift { 0%,100% { opacity:.03; } 50% { opacity:.055; } }
.usm-noise {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px; mix-blend-mode: overlay;
  animation: usm-noise-drift 5s ease-in-out infinite;
}

@keyframes usm-avatar-ring {
  0%,100% { box-shadow: 0 0 0 2px rgba(245,200,66,.25), 0 0 20px rgba(245,200,66,.1); }
  50%     { box-shadow: 0 0 0 3px rgba(245,200,66,.45), 0 0 35px rgba(245,200,66,.2); }
}
.usm-avatar-ring { animation: usm-avatar-ring 2.5s ease-in-out infinite; }

@keyframes usm-level-glow {
  0%,100% { text-shadow: 0 0 8px rgba(245,200,66,.4); }
  50%     { text-shadow: 0 0 18px rgba(245,200,66,.8), 0 0 30px rgba(245,200,66,.3); }
}
.usm-level { animation: usm-level-glow 2s ease-in-out infinite; }

.usm-input {
  width: 100%; background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 10px 14px;
  color: #f0eaff; font-family: 'Outfit', sans-serif;
  font-size: 14px; font-weight: 600;
  outline: none; transition: border-color .2s, background .2s;
  box-sizing: border-box;
}
.usm-input::placeholder { color: rgba(240,234,255,.25); }
.usm-input:focus { border-color: rgba(245,200,66,.4); background: rgba(245,200,66,.05); }
.usm-input::-webkit-inner-spin-button,
.usm-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.usm-tip-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
  background: linear-gradient(135deg, #f5c842, #e8a800);
  color: #0a0600; font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 800;
  box-shadow: 0 0 24px rgba(245,200,66,.3), 0 4px 12px rgba(0,0,0,.4);
  transition: transform .18s, box-shadow .18s, opacity .18s;
  white-space: nowrap; flex-shrink: 0;
}
.usm-tip-btn:hover:not(:disabled) { transform: translateY(-1px) scale(1.03); box-shadow: 0 0 36px rgba(245,200,66,.45), 0 6px 16px rgba(0,0,0,.5); }
.usm-tip-btn:active:not(:disabled) { transform: scale(.98); }
.usm-tip-btn:disabled { opacity: .4; cursor: not-allowed; }

.usm-copy-btn {
  background: none; border: none; cursor: pointer; padding: 3px 5px;
  border-radius: 5px; color: rgba(240,234,255,.3);
  transition: color .18s, background .18s;
}
.usm-copy-btn:hover { color: rgba(245,200,66,.8); background: rgba(245,200,66,.08); }

.usm-close-btn {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px; cursor: pointer; padding: 6px;
  color: rgba(240,234,255,.4); transition: background .18s, color .18s, border-color .18s;
}
.usm-close-btn:hover { background: rgba(245,200,66,.1); border-color: rgba(245,200,66,.25); color: #f5c842; }

@keyframes usm-spin { to { transform: rotate(360deg); } }
@keyframes usm-pulse { 0%,100% { opacity:.5; } 50% { opacity:.2; } }
`;

/* ─── Stable Avatar ───────────────────────────────────────────────── */
const StableAvatar = ({ url, name, size }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const safe    = safeAvatarUrl(url);
  const urlRef  = useRef(safe);
  useEffect(() => {
    if (urlRef.current !== safe) { urlRef.current = safe; setLoaded(false); setErr(false); }
  }, [safe]);
  const initial = name?.[0]?.toUpperCase() || '?';
  return (
    <div className="usm-avatar-ring" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, position: 'relative', background: 'linear-gradient(135deg,#f5c842,#9d6fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 900, color: '#000', position: 'relative', zIndex: 1 }}>{initial}</span>
      {safe && !err && (
        <img
          src={safe} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, opacity: loaded ? 1 : 0, transition: 'opacity .22s' }}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
};

/* ─── Toast ───────────────────────────────────────────────────────── */
const Toast = ({ msg, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: .95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: .95 }}
    style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, padding: '10px 20px', borderRadius: 12,
      background: type === 'error' ? 'rgba(255,78,106,.15)' : 'rgba(0,229,160,.12)',
      border: `1px solid ${type === 'error' ? 'rgba(255,78,106,.35)' : 'rgba(0,229,160,.35)'}`,
      color: type === 'error' ? '#ff4e6a' : '#00e5a0',
      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
      backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      fontFamily: 'Outfit, sans-serif',
    }}
  >{msg}</motion.div>
);

/* ─── Main Modal ──────────────────────────────────────────────────── */
export default function UserStatsModal({ userName, userEmail, onClose, currentUser }) {
  // profileData = the target user's info (who we're viewing)
  const [profileData, setProfileData] = useState(null);
  // liveMe = fresh fetch of the logged-in user so balance is never stale
  const [liveMe,      setLiveMe]      = useState(currentUser || null);
  const [loading,     setLoading]     = useState(true);
  const [tipAmount,   setTipAmount]   = useState('');
  const [tipping,     setTipping]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Fetch target user profile ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Try the getPlayerStats function first
        const res = await base44.functions.invoke('getPlayerStats', { userEmail });
        if (!cancelled && res?.data) {
          setProfileData(res.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('getPlayerStats failed, falling back to entity filter:', e);
      }

      // Fallback: fetch user directly from entity by email
      try {
        const users = await base44.entities.User.filter({ email: userEmail });
        if (!cancelled && users?.[0]) {
          setProfileData(users[0]);
        }
      } catch (e) {
        console.error('Fallback user fetch also failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userEmail]);

  /* ── Always fetch fresh "me" so balance is live, not stale from props ── */
  useEffect(() => {
    base44.auth.me().then(me => { if (me) setLiveMe(me); }).catch(() => {});
  }, []);

  const handleCopyId = () => {
    const id = profileData?.id;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleTip = async () => {
    // Re-fetch sender balance right before sending to guarantee it's current
    let freshMe;
    try {
      freshMe = await base44.auth.me();
      setLiveMe(freshMe);
    } catch {
      freshMe = liveMe;
    }

    if (!freshMe) { showToast('Not logged in', 'error'); return; }
    if ((freshMe.level || 0) < 5) { showToast('Reach level 5 to tip players', 'error'); return; }

    const amount = parseInt(tipAmount, 10);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    if ((freshMe.balance || 0) < amount) {
      showToast(`Insufficient balance — you have ${(freshMe.balance || 0).toLocaleString()} coins`, 'error');
      return;
    }

    setTipping(true);
    try {
      // 1. Deduct sender
      await base44.auth.updateMe({ balance: freshMe.balance - amount });

      // 2. Credit recipient via direct fetch — base44 invoke uses wrong URL path
      try {
        const payload = {
          recipientEmail: profileData?.email || userEmail,
          amount: amount,
          senderName: freshMe.full_name || freshMe.email?.split('@')[0] || 'Someone',
        };
        const resp = await fetch('https://practical-robo-rush-win.base44.app/api/functions/processTip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const result = await resp.json();
        if (!resp.ok || result?.error) throw new Error(result?.error || 'Server error');
      } catch (serverErr) {
        // Refund sender if server step failed
        await base44.auth.updateMe({ balance: freshMe.balance });
        throw serverErr;
      }

      // Refresh our local balance display
      base44.auth.me().then(me => { if (me) setLiveMe(me); }).catch(() => {});

      showToast(`Sent ${amount.toLocaleString()} coins to ${userName}!`);
      setTipAmount('');
      setTimeout(onClose, 1600);
    } catch (err) {
      console.error('Tip error:', err);
      showToast(err?.message || 'Failed to send tip', 'error');
    } finally {
      setTipping(false);
    }
  };

  // Display values — fall back to props so profile always shows something
  const displayName   = profileData?.full_name || userName || userEmail?.split('@')[0] || '?';
  const displayLevel  = profileData?.level  || 1;
  const displayAvatar = profileData?.avatar_url;
  const shortId       = profileData?.id ? '#' + profileData.id.slice(-6).toUpperCase() : null;
  const isSelf        = (liveMe?.email && (profileData?.email || userEmail)) && liveMe.email === (profileData?.email || userEmail);
  // Default locked (level ?? 0) so tip input never flashes before liveMe loads
  const meLevel       = liveMe?.level ?? 0;
  const levelLock     = !isSelf && meLevel < 5;

  return (
    <Portal>
      <style>{CSS}</style>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(3,0,13,.78)', backdropFilter: 'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
        <motion.div
          initial={{ scale: .94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: .94, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="usm-root"
          style={{
            pointerEvents: 'auto', width: '100%', maxWidth: 380,
            borderRadius: 20, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(160deg, #0d0a1e 0%, #080518 50%, #06030f 100%)',
            border: '1px solid rgba(245,200,66,.18)',
            boxShadow: '0 0 0 1px rgba(245,200,66,.06), 0 0 80px rgba(157,111,255,.12), 0 24px 60px rgba(0,0,0,.7)',
          }}
        >
          <div className="usm-scan" />
          <div className="usm-noise" />
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #f5c842, #9d6fff, transparent)' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 2 }}>
            <span className="usm-title" style={{ fontSize: 14, fontWeight: 700, color: 'rgba(240,234,255,.5)', letterSpacing: '.18em', textTransform: 'uppercase' }}>Player Profile</span>
            <button className="usm-close-btn" onClick={onClose}><X style={{ width: 14, height: 14 }} /></button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 18px 22px', position: 'relative', zIndex: 2 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,.06)', animation: 'usm-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 120, height: 14, borderRadius: 8, background: 'rgba(255,255,255,.06)', animation: 'usm-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 80, height: 10, borderRadius: 8, background: 'rgba(255,255,255,.04)', animation: 'usm-pulse 1.5s ease-in-out infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Avatar + Identity — always renders using prop fallbacks ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <StableAvatar url={displayAvatar} name={displayName} size={76} />

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#f0eaff', letterSpacing: '.01em', marginBottom: 6 }}>{displayName}</p>

                    {/* Level badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(245,200,66,.1)', border: '1px solid rgba(245,200,66,.25)', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,200,66,.6)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Level</span>
                      <span className="usm-level usm-title" style={{ fontSize: 18, fontWeight: 700, color: '#f5c842', lineHeight: 1 }}>{displayLevel}</span>
                    </div>

                    {/* ID */}
                    {shortId && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'rgba(240,234,255,.22)', fontWeight: 600, letterSpacing: '.06em' }}>{shortId}</span>
                        <button className="usm-copy-btn" onClick={handleCopyId} title="Copy ID">
                          {copied ? <Check style={{ width: 11, height: 11, color: '#00e5a0' }} /> : <Copy style={{ width: 11, height: 11 }} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Tip section ── */}
                {!isSelf && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
                      <span className="usm-title" style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,234,255,.22)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Send Tip</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
                    </div>

                    {levelLock ? (
                      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: 'rgba(240,234,255,.3)', fontWeight: 600 }}>🔒 Reach <span style={{ color: '#f5c842' }}>Level 5</span> to tip players</p>
                        <p style={{ fontSize: 10, color: 'rgba(240,234,255,.18)', fontWeight: 500, marginTop: 4 }}>Your level: <span style={{ color: '#c084fc' }}>{meLevel}</span> / 5 required</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="number"
                            className="usm-input"
                            value={tipAmount}
                            onChange={e => setTipAmount(e.target.value)}
                            placeholder="Enter amount…"
                            min="1"
                          />
                          <button
                            className="usm-tip-btn"
                            onClick={handleTip}
                            disabled={tipping || !tipAmount || parseInt(tipAmount, 10) <= 0}
                          >
                            {tipping
                              ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'usm-spin .7s linear infinite' }} /> Sending</>
                              : <><Send style={{ width: 13, height: 13 }} /> Send</>}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(240,234,255,.28)', fontWeight: 500, textAlign: 'right' }}>
                          Your balance: <span style={{ color: '#f5c842', fontWeight: 700 }}>{(liveMe?.balance || 0).toLocaleString()}</span> coins
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(157,111,255,.2), transparent)' }} />
        </motion.div>
      </div>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
    </Portal>
  );
}