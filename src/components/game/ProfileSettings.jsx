import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Loader2, CheckCircle2, EyeOff, Eye, AlertCircle, X } from 'lucide-react';

export default function ProfileSettings({ user, onSaved }) {
  const [username, setUsername] = useState(user?.username || user?.full_name || '');
  const [isAnonymous, setIsAnonymous] = useState(user?.is_anonymous || false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarPreview, setAvatarPreview] = useState(null); // local blob preview before upload finishes
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const saveTimeout = useRef(null);

  const displayName = isAnonymous
    ? `Anonymous #${user?.id?.slice(-4) || '????'}`
    : (username.trim() || user?.full_name || 'User');

  const initials = displayName[0]?.toUpperCase() || '?';

  // Show local preview immediately, upload in background
  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant preview — no waiting for network
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);
    setUploadProgress(0);
    setError('');

    // Fake progress ticks so it feels alive
    const ticker = setInterval(() => {
      setUploadProgress(p => Math.min(p + Math.random() * 18, 85));
    }, 180);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearInterval(ticker);
      setUploadProgress(100);
      setAvatarUrl(file_url);
      setAvatarPreview(null); // swap to real URL
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      clearInterval(ticker);
      setAvatarPreview(null);
      URL.revokeObjectURL(localUrl);
      setError('Image upload failed. Please try again.');
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleSave = async () => {
    if (saving || uploading) return;
    if (!isAnonymous && !username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      username: isAnonymous ? (user?.username || user?.full_name) : username.trim(),
      avatar_url: avatarUrl,
      is_anonymous: isAnonymous,
    };

    try {
      await base44.auth.updateMe(payload);
      setSaved(true);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => setSaved(false), 2500);

      // Push updated display name up to parent so bottom-left shows username, not email
      if (onSaved) {
        onSaved({
          ...user,
          ...payload,
          // Ensure display_name used in sidebar is the new username
          display_name: isAnonymous ? `Anonymous #${user?.id?.slice(-4) || '????'}` : username.trim(),
        });
      }
    } catch (err) {
      setError('Could not save changes. Please try again.');
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatarPreview || avatarUrl;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
      className="space-y-5"
    >

      {/* ── Avatar ─────────────────────────────────────────── */}
      <section>
        <Label>Profile Picture</Label>

        <div className="flex items-center gap-5 mt-3">
          {/* Avatar ring */}
          <div className="relative flex-shrink-0">
            <div
              className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex items-center justify-center select-none"
              style={{
                background: currentAvatar
                  ? 'transparent'
                  : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
                boxShadow: '0 0 0 2px rgba(139,92,246,0.4), 0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  style={{ filter: uploading ? 'brightness(0.5)' : 'none', transition: 'filter 0.2s' }}
                />
              ) : (
                <span className="text-2xl font-bold text-white tracking-tight">{initials}</span>
              )}

              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                  <span className="text-[10px] text-white font-semibold">{Math.round(uploadProgress)}%</span>
                </div>
              )}

              {/* Progress bar at bottom */}
              {uploading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div
                    className="h-full bg-violet-400 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: '0 2px 8px rgba(124,58,237,0.6)',
              }}
              title="Change profile picture"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              {uploading ? 'Uploading…' : 'Tap the camera icon to change your photo'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Username ───────────────────────────────────────── */}
      <section>
        <Label>Username</Label>
        <div className="mt-2 relative">
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            maxLength={24}
            disabled={isAnonymous}
            placeholder="Choose a username…"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed pr-14"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.7)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums"
            style={{ color: username.length > 20 ? '#f87171' : 'rgba(255,255,255,0.25)' }}
          >
            {username.length}/24
          </span>
        </div>
        <p className="text-[11px] text-white/30 mt-1.5 pl-0.5">
          Shown in chat, battles, and leaderboards — not your email
        </p>
      </section>

      {/* ── Anonymous Mode ─────────────────────────────────── */}
      <section
        className="rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setIsAnonymous(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isAnonymous ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)' }}
          >
            {isAnonymous
              ? <EyeOff className="w-4 h-4 text-violet-400" />
              : <Eye className="w-4 h-4 text-white/50" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Anonymous Mode</p>
            <p className="text-[11px] text-white/40 mt-0.5">
              Display as "Anonymous #{user?.id?.slice(-4) || '????'}" everywhere
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div
          className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-200"
          style={{ background: isAnonymous ? '#7c3aed' : 'rgba(255,255,255,0.12)' }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
            style={{ left: isAnonymous ? '22px' : '2px' }}
          />
        </div>
      </section>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Save ───────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #16a34a, #22c55e)'
            : saving || uploading
              ? 'rgba(124,58,237,0.4)'
              : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          boxShadow: saved
            ? '0 4px 20px rgba(34,197,94,0.3)'
            : saving ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
        }}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved && <CheckCircle2 className="w-4 h-4" />}
        <span>
          {uploading ? 'Waiting for upload…' : saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </span>
      </button>

    </div>
  );
}

// ── tiny helper ─────────────────────────────────────────────
function Label({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
      {children}
    </p>
  );
}