import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, Search, DollarSign, Ban, Trash2, Activity, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

  const addActivityLog = (action) => {
    setActivityLog([
      { timestamp: new Date().toLocaleTimeString(), action },
      ...activityLog.slice(0, 19)
    ]);
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
          exit={{ opacity: 0, y: -10 }}
          className={`p-3 rounded-lg border flex items-center gap-2 ${
            message.includes('Error') 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}
        >
          {message.includes('Error') ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="users" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 rounded-lg">
            <Search className="w-3.5 h-3.5 mr-1.5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 rounded-lg">
            <Activity className="w-3.5 h-3.5 mr-1.5" /> Activity Log
          </TabsTrigger>
        </TabsList>

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
            {/* User List */}
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
                      {u.is_banned && (
                        <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* User Details & Actions */}
            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 space-y-4"
              >
                <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                  {/* User Info */}
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
                          selectedUser.is_banned
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {selectedUser.is_banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                          {selectedUser.role || 'user'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
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

                  {/* Balance Adjustment */}
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleBanUser}
                      disabled={loading}
                      className={selectedUser.is_banned
                        ? 'bg-green-500 hover:bg-green-600 flex-1'
                        : 'bg-red-500 hover:bg-red-600 flex-1'
                      }
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Ban className="w-4 h-4 mr-2" />
                      )}
                      {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                    </Button>
                    <Button
                      onClick={handleDeleteUser}
                      disabled={loading}
                      className="bg-destructive hover:bg-destructive/90 flex-1"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
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

        <TabsContent value="activity" className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <p className="text-white/60 text-sm">
              {activityLog.length === 0
                ? 'No admin actions yet'
                : `Showing ${activityLog.length} recent actions`}
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