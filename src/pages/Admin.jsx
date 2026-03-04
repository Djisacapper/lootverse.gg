import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, Search, DollarSign, Ban, Trash2, Activity, AlertCircle, CheckCircle2, Loader2, Box, Plus, X, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [caseName, setCaseName] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [casePrice, setCasePrice] = useState('');
  const [caseCategory, setCaseCategory] = useState('standard');
  const [caseImage, setCaseImage] = useState(null);
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemRarity, setItemRarity] = useState('common');
  const [itemValue, setItemValue] = useState('');
  const [itemDropRate, setItemDropRate] = useState('');
  const [itemImages, setItemImages] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');


  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (currentUser?.role !== 'admin') {
      setMessage('Access denied. Admin only.');
      return;
    }
    loadAllUsers();
  };

  const loadAllUsers = async () => {
    const users = await base44.entities.User.list('', 100);
    setAllUsers(users);
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    setLoading(true);
    try {
      const newBalance = Math.max(0, parseInt(balanceAmount));
      await base44.entities.User.update(selectedUser.id, { balance: newBalance });
      setSelectedUser({ ...selectedUser, balance: newBalance });
      addActivityLog(`Adjusted ${selectedUser.full_name}'s balance to ${newBalance}`);
      setBalanceAmount('');
      setMessage('Balance updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating balance');
    }
    setLoading(false);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const newStatus = !selectedUser.is_banned;
      await base44.entities.User.update(selectedUser.id, { is_banned: newStatus });
      setSelectedUser({ ...selectedUser, is_banned: newStatus });
      addActivityLog(`${newStatus ? 'Banned' : 'Unbanned'} ${selectedUser.full_name}`);
      setMessage(newStatus ? 'User banned' : 'User unbanned');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating ban status');
    }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !window.confirm(`Delete ${selectedUser.full_name}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await base44.entities.User.delete(selectedUser.id);
      addActivityLog(`Deleted user ${selectedUser.full_name}`);
      setAllUsers(allUsers.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      setMessage('User deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error deleting user');
    }
    setLoading(false);
  };

  const handleChangeRole = async (newRole) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await base44.entities.User.update(selectedUser.id, { role: newRole });
      setSelectedUser({ ...selectedUser, role: newRole });
      addActivityLog(`Changed ${selectedUser.full_name}'s role to ${newRole}`);
      setMessage(`User role changed to ${newRole}`);
      setTimeout(() => setMessage(''), 3000);
      loadAllUsers();
    } catch (err) {
      setMessage('Error changing role');
    }
    setLoading(false);
  };

  const addActivityLog = (action) => {
    setActivityLog([
      { timestamp: new Date().toLocaleTimeString(), action },
      ...activityLog.slice(0, 19)
    ]);
  };

  const handleAddItemImage = (file) => {
    if (!file) return;
    setItemImages([...itemImages, file]);
  };

  const handleRemoveItemImage = (index) => {
    setItemImages(itemImages.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!itemName || !itemValue || !itemDropRate) return;
    setItems([...items, {
      name: itemName,
      rarity: itemRarity,
      value: parseInt(itemValue),
      drop_rate: parseInt(itemDropRate),
      image_files: itemImages
    }]);
    setItemName('');
    setItemValue('');
    setItemDropRate('');
    setItemImages([]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateCase = async () => {
    if (!caseName || !casePrice || items.length === 0) {
      setMessage('Please fill in all required fields and add at least one item');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = null;
      if (caseImage) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: caseImage });
        imageUrl = uploadRes.file_url;
      }
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        let image = null;
        if (item.image_files && item.image_files.length > 0) {
          const uploadRes = await base44.integrations.Core.UploadFile({ file: item.image_files[0] });
          image = uploadRes.file_url;
        }
        return {
  name: item.name,
  rarity: item.rarity,
  value: item.value,
  drop_rate: item.drop_rate,
  image: image,
  image_url: image,
  image_urls: image ? [image] : [],
};
      }));
      await base44.entities.CaseTemplate.create({
        name: caseName,
        description: caseDescription,
        price: parseInt(casePrice),
        category: caseCategory,
        image_url: imageUrl,
        items: itemsWithImages,
        is_active: true
      });
      addActivityLog(`Created new case: ${caseName}`);
      setMessage('Case created successfully!');
      setCaseName('');
      setCaseDescription('');
      setCasePrice('');
      setItems([]);
      setCaseImage(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error creating case');
      console.error(err);
    }
    setLoading(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Access Denied</p>
          <p className="text-white/50 text-sm">Admin panel is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-white/40 text-sm">Manage users, balance, and platform activity</p>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border flex items-center gap-2 ${
            message.includes('Error')
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}
        >
          {message.includes('Error')
            ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="users" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 rounded-lg">
            <Search className="w-3.5 h-3.5 mr-1.5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="cases" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 rounded-lg">
            <Box className="w-3.5 h-3.5 mr-1.5" /> Create Cases
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300 rounded-lg">
            <Trophy className="w-3.5 h-3.5 mr-1.5" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 rounded-lg">
            <Activity className="w-3.5 h-3.5 mr-1.5" /> Activity Log
          </TabsTrigger>
        </TabsList>

        {/* ── USER MANAGEMENT TAB ── */}
        <TabsContent value="users" className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-white/40">No users found</div>
              ) : (
                filteredUsers.map(u => (
                  <motion.button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`w-full text-left glass rounded-lg p-3 border transition-all ${
                      selectedUser?.id === u.id
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-white/5 hover:border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                        {u.avatar_url && u.avatar_url !== 'null'
                          ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          : u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.full_name}</p>
                        <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                      </div>
                      {u.is_banned && <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 space-y-4"
              >
                <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
                      {selectedUser.avatar_url && selectedUser.avatar_url !== 'null'
                        ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                        : selectedUser.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white">{selectedUser.full_name}</p>
                      <p className="text-sm text-white/60">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${
                          selectedUser.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {selectedUser.is_banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                          {selectedUser.role || 'user'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-lg p-3">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Balance</p>
                      <p className="text-lg font-bold text-amber-400 mt-1">${(selectedUser.balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Level</p>
                      <p className="text-lg font-bold text-violet-400 mt-1">{selectedUser.level || 1}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80">Adjust Balance</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter new balance"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                      <Button
                        onClick={handleAdjustBalance}
                        disabled={loading || !balanceAmount}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80">Role Management</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['user', 'mod', 'admin'].map((role) => (
                        <Button
                          key={role}
                          onClick={() => handleChangeRole(role)}
                          disabled={loading}
                          className={`text-xs ${
                            selectedUser.role === role
                              ? role === 'admin' ? 'bg-red-500 hover:bg-red-600'
                                : role === 'mod' ? 'bg-purple-500 hover:bg-purple-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                              : role === 'admin' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                                : role === 'mod' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300'
                                : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                          }`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleBanUser}
                      disabled={loading}
                      className={selectedUser.is_banned ? 'bg-green-500 hover:bg-green-600 flex-1' : 'bg-red-500 hover:bg-red-600 flex-1'}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                      {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                    </Button>
                    <Button onClick={handleDeleteUser} disabled={loading} className="bg-destructive hover:bg-destructive/90 flex-1">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="lg:col-span-2 glass rounded-xl p-8 border border-white/5 flex items-center justify-center text-center min-h-[400px]">
                <div>
                  <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">Select a user to manage</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── CASES TAB ── */}
        <TabsContent value="cases" className="space-y-4">
          <div className="glass rounded-xl p-6 border border-white/5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Create New Case</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-semibold text-white/80 block mb-2">Case Name</label>
                  <Input placeholder="e.g. Celestial Case" value={caseName} onChange={(e) => setCaseName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white/80 block mb-2">Description</label>
                  <Input placeholder="Short description" value={caseDescription} onChange={(e) => setCaseDescription(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-white/80 block mb-2">Price</label>
                    <Input type="number" placeholder="100" value={casePrice} onChange={(e) => setCasePrice(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/80 block mb-2">Category</label>
                    <select value={caseCategory} onChange={(e) => setCaseCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
                      {['budget', 'standard', 'premium', 'legendary', 'event'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white/80 block mb-2">Case Image</label>
                    <Input type="file" accept="image/*" onChange={(e) => setCaseImage(e.target.files?.[0] || null)} className="bg-white/5 border-white/10 text-white/60 text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Items</h3>
                <div className="bg-white/[0.02] rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    <Input placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                    <select value={itemRarity} onChange={(e) => setItemRarity(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
                      {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                    <Input type="number" placeholder="Value" value={itemValue} onChange={(e) => setItemValue(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                    <Input type="number" placeholder="Drop %" value={itemDropRate} onChange={(e) => setItemDropRate(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                    <Input type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(file => handleAddItemImage(file)); }} className="bg-white/5 border-white/10 text-white/60 text-xs" />
                  </div>
                  {itemImages.length > 0 && (
                    <div>
                      <p className="text-xs text-white/60 mb-2">{itemImages.length} image(s) added</p>
                      <div className="flex gap-2 flex-wrap">
                        {itemImages.map((img, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                            <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                            <button onClick={() => handleRemoveItemImage(idx)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button onClick={handleAddItem} disabled={!itemName || !itemValue || !itemDropRate} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-white/50">{item.rarity} • ${item.value} • {item.drop_rate}%</p>
                          </div>
                          <Button onClick={() => handleRemoveItem(idx)} size="sm" className="bg-red-500/20 hover:bg-red-500/30 text-red-400">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        {item.image_files?.length > 0 && (
                          <div className="flex gap-2">
                            {item.image_files.map((img, imgIdx) => (
                              <img key={imgIdx} src={URL.createObjectURL(img)} alt={`${item.name}-${imgIdx}`} className="w-10 h-10 rounded object-cover border border-white/10" />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleCreateCase} disabled={loading || !caseName || !casePrice || items.length === 0} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Box className="w-4 h-4 mr-2" />}
              Create Case
            </Button>
          </div>
        </TabsContent>

        {/* ── LEADERBOARD SYNC TAB ── */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="glass rounded-xl p-6 border border-white/5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-yellow-400 mb-1">Sync Leaderboard</h2>
              <p className="text-white/40 text-sm">
                This reads all user + transaction data (admin only) and writes the top 10 into the public
                <span className="text-yellow-300 font-mono text-xs mx-1">LeaderboardEntry</span>
                entity so regular users can see it.
              </p>
            </div>

            {syncMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border text-sm font-medium ${
                  syncMessage.startsWith('✅')
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {syncMessage}
              </motion.div>
            )}

            <Button
              onClick={handleSyncLeaderboard}
              disabled={syncLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-3"
            >
              {syncLoading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing...</>
                : <><RefreshCw className="w-4 h-4 mr-2" /> Sync Leaderboard Now</>
              }
            </Button>

            <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
              <p className="text-xs text-white/40 leading-relaxed">
                💡 <strong className="text-white/60">Tip:</strong> Run this sync periodically (daily or weekly) to keep the leaderboard fresh.
                In the future you can automate this with a scheduled base44 function if it becomes available on your plan.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── ACTIVITY TAB ── */}
        <TabsContent value="activity" className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <p className="text-white/60 text-sm">
              {activityLog.length === 0 ? 'No admin actions yet' : `Showing ${activityLog.length} recent actions`}
            </p>
          </div>
          <div className="space-y-2">
            {activityLog.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No activity logged yet</p>
              </div>
            ) : (
              activityLog.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-lg p-3 border border-white/5 flex items-center justify-between"
                >
                  <p className="text-sm text-white">{log.action}</p>
                  <p className="text-xs text-white/40">{log.timestamp}</p>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}