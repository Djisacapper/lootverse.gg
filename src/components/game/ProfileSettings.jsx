import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Loader, Check, EyeOff } from 'lucide-react';

export default function ProfileSettings({ user, onSaved }) {
  const [username, setUsername] = useState(user?.username || user?.full_name || '');
  const [isAnonymous, setIsAnonymous] = useState(user?.is_anonymous || false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        username: username.trim() || user?.full_name,
        avatar_url: avatarUrl,
        is_anonymous: isAnonymous,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  const displayName = isAnonymous ? `Anonymous #${user?.id?.slice(-4) || '????'}` : (username || user?.full_name);

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Profile Picture</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{(username || user?.full_name || '?')[0]?.toUpperCase()}</span>
              )}
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
              {uploading ? <Loader className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="text-sm text-white font-medium">{displayName}</p>
            <p className="text-xs text-white/40 mt-1">Click the camera to upload a new photo</p>
          </div>
        </div>
      </div>

      {/* Username */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Username</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
          disabled={isAnonymous}
          placeholder="Enter a username..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-colors disabled:opacity-40"
        />
        <p className="text-[10px] text-white/30 mt-1.5">This name shows in chat, battles, and all games</p>
      </div>

      {/* Anonymous Mode */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Anonymous Mode</p>
              <p className="text-[11px] text-white/40 mt-0.5">Show as "Anonymous #{user?.id?.slice(-4) || '????'}" everywhere</p>
            </div>
          </div>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${isAnonymous ? 'bg-violet-500' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${isAnonymous ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
          ${saved ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50'}`}
      >
        {saving ? <Loader className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}