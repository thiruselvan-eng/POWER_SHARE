// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  FileText, 
  RefreshCw, 
  Search, 
  Award, 
  ListFilter, 
  Check, 
  X,
  Loader2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import type { AdminStats, AdminUser } from '../../services/adminService';
import type { Order } from '../../services/orderService';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'users' | 'orders'>('overview');

  // Core Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const [statsData, usersList, ordersList] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getOrders(),
      ]);

      setStats(statsData);
      setUsers(usersList);
      setOrders(ordersList);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error fetching system metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleVerify = async (userId: number, verified: boolean) => {
    try {
      setActionLoadingId(userId);
      await adminService.verifyUser(userId, verified);
      triggerToast('success', `User credentials verification toggled successfully!`);
      // Update local state to avoid full reload
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified } : u));
      // Re-fetch stats in background
      adminService.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter calculations
  const unverifiedQueueList = users.filter(
    u => !u.verified && u.role !== 'ROLE_ADMIN'
  );

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesVerified = userStatusFilter === 'ALL' || 
                            (userStatusFilter === 'VERIFIED' && u.verified) ||
                            (userStatusFilter === 'UNVERIFIED' && !u.verified);
                            
    return matchesSearch && matchesRole && matchesVerified;
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.batteryName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.buyerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.sellerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.id.toString().includes(orderSearch);
                          
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans antialiased flex">

      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-indigo-500/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[35rem] h-[35rem] bg-emerald-500/5 rounded-full blur-[8rem] pointer-events-none" />

      {/* ── SIDEBAR PANEL ── */}
      <aside className="w-68 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed top-0 left-0 bottom-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
              <Shield className="text-white w-5 h-5 animate-none" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">PowerShare</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Admin Console</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 mt-4">
            {[
              { id: 'overview', label: 'Grid Performance', icon: Activity },
              { id: 'queue', label: `Verification Queue (${unverifiedQueueList.length})`, icon: Award },
              { id: 'users', label: 'User Index Directory', icon: Users },
              { id: 'orders', label: 'Audit Order Ledgers', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-550/20 text-indigo-400 font-bold'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Details */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-9 h-9 bg-indigo-600/10 border border-indigo-650/20 text-indigo-455 rounded-full flex items-center justify-center font-black text-sm">
              {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user?.fullName || 'Super Administrator'}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Root Platform Officer</p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="w-full text-center py-2 border border-slate-800/80 hover:border-rose-900 hover:text-rose-455 rounded-xl text-xs font-semibold text-gray-550 transition-all active:scale-95"
          >
            Deploy Account Exit
          </button>
        </div>
      </aside>

      {/* ── WORKSPACE ── */}
      <main className="ml-68 flex-1 p-8 min-h-screen relative z-10">

        {/* Alerts toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">System Infrastructure Console</h1>
            <p className="text-slate-400 text-sm mt-1">Audit escrow flows, verify seller credentials, and inspect peer-to-peer energy transactions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-3 bg-slate-900 border border-gray-855 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 border border-slate-800/80 rounded-3xl bg-gray-905/30 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Aggregating blockchain and database states...</p>
          </div>
        )}

        {!loading && (
          <div>
            
            {/* 1. GRID OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                
                {/* Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Registered Sellers</span>
                      <p className="text-3xl font-bold tracking-tight text-white">{stats.totalSellers} nodes</p>
                      <p className="text-xs text-gray-550 mt-1">Unverified queue: {stats.totalUnverifiedUsers}</p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Energy Throughput</span>
                      <p className="text-3xl font-bold tracking-tight text-emerald-400">{stats.totalEnergyTransferredKwh.toFixed(1)} kWh</p>
                      <p className="text-xs text-gray-550 mt-1">Completed orders: {stats.totalOrdersCount}</p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-gray-550 uppercase tracking-widest block mb-2">Platform Escrow</span>
                      <p className="text-3xl font-bold tracking-tight text-indigo-400 font-mono">${stats.activeEscrowAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-550 mt-1">Total financial volume: ${stats.totalFinancialThroughput.toFixed(2)}</p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-gray-550 uppercase tracking-widest block mb-2">Delivery Force</span>
                      <p className="text-3xl font-bold tracking-tight text-white">{stats.totalDeliveryPartners} active</p>
                      <p className="text-xs text-gray-550 mt-1">Avg logistics score: 100%</p>
                    </div>

                  </div>
                )}

                {/* Health & Logs widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Health checks */}
                  <div className="bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl space-y-6">
                    <h3 className="text-base font-bold flex items-center gap-2 text-white">
                      <Activity className="w-4 h-4 text-indigo-500" /> Platform Infrastructure Diagnostics
                    </h3>

                    <div className="space-y-4">
                      {[
                        { label: 'Relational Database (PostgreSQL)', desc: 'Grid indexes + Schema normalization', healthy: true },
                        { label: 'Live Dispatcher Socket (WebSockets)', desc: 'Online at /ws/tracking', healthy: true },
                        { label: 'Escrow Ledger Protocol', desc: 'Secure wallet transactions logging', healthy: true },
                        { label: 'Spring Boot REST Gateway', desc: 'Running on Java 21 JDK JVM', healthy: true },
                      ].map((s, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/80 border border-gray-900 rounded-2xl flex items-start justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-white leading-tight">{s.label}</p>
                            <p className="text-slate-500 text-[10px] mt-1">{s.desc}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-md font-bold text-[9px] uppercase">
                            Operational
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary of pending users */}
                  <div className="lg:col-span-2 bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-500" /> Action Required: Verification Requests
                      </h3>
                      
                      {unverifiedQueueList.length === 0 ? (
                        <div className="text-center py-14 text-xs text-slate-500">
                          <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-500" />
                          No pending credentials verification requests. All sellers and delivery agents verified.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                          {unverifiedQueueList.slice(0, 3).map(u => (
                            <div key={u.id} className="p-4 bg-slate-950/60 border border-gray-900 rounded-2xl flex items-center justify-between text-xs transition-colors hover:border-slate-800">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white">{u.fullName}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                    u.role === 'ROLE_SELLER' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {u.role.replace('ROLE_', '')}
                                  </span>
                                </div>
                                <p className="text-gray-550 text-[10px] font-mono">{u.email} • Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                              </div>

                              <button
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleVerify(u.id, true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] active:scale-95 transition-all flex items-center gap-1"
                              >
                                {actionLoadingId === u.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Approve Verify
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {unverifiedQueueList.length > 3 && (
                      <button
                        onClick={() => setActiveTab('queue')}
                        className="w-full text-center border border-gray-855 hover:border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-all mt-4"
                      >
                        View All {unverifiedQueueList.length} Pending Requests
                      </button>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* 2. VERIFICATION QUEUE TAB */}
            {activeTab === 'queue' && (
              <div>
                <h3 className="text-lg font-bold mb-6">Credential Verification Requests</h3>

                {unverifiedQueueList.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <Award className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-none" />
                    <h3 className="text-lg font-bold mb-1 text-white">Verification Queue is Empty</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      All platform service providers have been fully credentialed. New user signups needing approvals will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {unverifiedQueueList.map(u => (
                      <div key={u.id} className="bg-[#0b0f19]/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">NODE ID: #{u.id}</span>
                              <h4 className="font-extrabold text-white text-lg mt-0.5">{u.fullName}</h4>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              u.role === 'ROLE_SELLER' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              {u.role.replace('ROLE_', '')}
                            </span>
                          </div>

                          <div className="bg-slate-950 p-4 border border-gray-900 rounded-xl space-y-2 mb-6 text-xs text-slate-400">
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span className="text-white font-semibold font-mono">{u.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Phone:</span>
                              <span className="text-white font-semibold font-mono">{u.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Registration Date:</span>
                              <span className="text-white font-semibold">{new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Registered location:</span>
                              <span className="text-white font-semibold truncate max-w-[170px]">{u.address || 'GPS Coordinates only'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleVerify(u.id, true)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3 text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          {actionLoadingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve and Authorize Node
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. USER INDEX DIRECTORY TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                
                {/* Search & Filter Toolbar */}
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search users by name, email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder:text-gray-550 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Filter Selects */}
                  <div className="flex items-center gap-3">
                    
                    <div className="flex items-center gap-2 text-xs">
                      <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-500">Role:</span>
                      <select 
                        value={userRoleFilter} 
                        onChange={e => setUserRoleFilter(e.target.value)}
                        className="bg-gray-955 border border-slate-800 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="ROLE_BUYER">Buyers</option>
                        <option value="ROLE_SELLER">Sellers</option>
                        <option value="ROLE_DELIVERY">Couriers</option>
                        <option value="ROLE_ADMIN">Admins</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Status:</span>
                      <select 
                        value={userStatusFilter} 
                        onChange={e => setUserStatusFilter(e.target.value)}
                        className="bg-gray-955 border border-slate-800 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none"
                      >
                        <option value="ALL">All Status</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="UNVERIFIED">Unverified</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Users List Grid */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-gray-855 rounded-3xl bg-slate-900/10">
                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-lg mb-1">No matching users</h3>
                    <p className="text-slate-500 text-xs">Refine your search parameters or select different roles.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(u => (
                      <div 
                        key={u.id}
                        className={`bg-slate-900/40 border rounded-2xl p-5 hover:border-slate-800 transition-colors flex flex-col justify-between ${
                          u.role === 'ROLE_ADMIN' ? 'border-slate-800' : 'border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-extrabold text-white text-base leading-snug">{u.fullName}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                            
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              u.role === 'ROLE_SELLER' ? 'bg-emerald-500/10 text-emerald-400' : 
                              u.role === 'ROLE_DELIVERY' ? 'bg-amber-500/10 text-amber-400' :
                              u.role === 'ROLE_ADMIN' ? 'bg-indigo-500/10 text-indigo-400' :
                              'bg-indigo-500/10 text-indigo-300'
                            }`}>
                              {u.role.replace('ROLE_', '')}
                            </span>
                          </div>

                          <div className="space-y-1.5 py-3 border-t border-gray-900 text-xs text-slate-500">
                            <p>Phone: <b className="text-white font-mono">{u.phone || 'N/A'}</b></p>
                            <p className="truncate">Address: <b className="text-white" title={u.address}>{u.address || 'N/A'}</b></p>
                            <p>Joined: <b className="text-white">{new Date(u.createdAt).toLocaleDateString()}</b></p>
                            {u.latitude && u.longitude && (
                              <p className="text-[10px] text-slate-600 font-mono">GPS: {u.latitude.toFixed(4)}, {u.longitude.toFixed(4)}</p>
                            )}
                          </div>
                        </div>

                        {u.role !== 'ROLE_ADMIN' && (
                          <div className="flex items-center justify-between gap-3 border-t border-gray-905 pt-4 mt-3">
                            <span className="text-xs text-slate-500">
                              Status: <b className={u.verified ? 'text-emerald-450' : 'text-rose-455'}>{u.verified ? 'Verified Node' : 'Suspended/Pending'}</b>
                            </span>

                            <button
                              disabled={actionLoadingId === u.id}
                              onClick={() => handleVerify(u.id, !u.verified)}
                              className={`font-semibold px-3 py-1.5 rounded-lg text-[10px] transition-all flex items-center gap-1 active:scale-95 ${
                                u.verified
                                  ? 'bg-rose-500/10 hover:bg-rose-505/20 text-rose-400'
                                  : 'bg-emerald-500/10 hover:bg-emerald-505/20 text-emerald-400'
                              }`}
                            >
                              {actionLoadingId === u.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                u.verified ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                              )}
                              {u.verified ? 'Revoke Verify' : 'Grant Verify'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* 4. ORDERS AUDIT LEDGER TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                {/* Search & Filter Toolbar */}
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search audits by battery, buyer, seller or order id..."
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder:text-gray-550 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Filter select */}
                  <div className="flex items-center gap-2 text-xs">
                    <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-gray-550">Order Status:</span>
                    <select 
                      value={orderStatusFilter} 
                      onChange={e => setOrderStatusFilter(e.target.value)}
                      className="bg-gray-955 border border-slate-800 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="RETURN_PENDING">RETURN_PENDING</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                </div>

                {/* Audit Grid */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-gray-855 rounded-3xl bg-slate-900/10">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-lg mb-1">No Orders Match</h3>
                    <p className="text-slate-500 text-xs shadow-none">Modify filter selections to audit other transactions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map(o => {
                      const isActive = ['PENDING', 'ACCEPTED', 'DISPATCHED', 'RETURN_PENDING'].includes(o.status);
                      return (
                        <div key={o.id} className="bg-[#0b0f19]/80 border border-slate-800 p-5 rounded-2xl hover:border-slate-800 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-5 text-xs">
                          
                          {/* Order description */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-indigo-400 font-mono">Order #{o.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                o.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' : 
                                o.status === 'RETURNED' ? 'bg-orange-500/10 text-orange-450 border border-orange-500/15' :
                                o.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/15' :
                                'bg-indigo-505/10 text-indigo-400 border border-indigo-500/15'
                              }`}>
                                {o.status}
                              </span>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[9px] text-amber-500 font-semibold leading-none">
                                  <Lock className="w-3 h-3" /> Funds Locked in Escrow
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-extrabold text-white mt-1 leading-snug">{o.batteryName}</h4>
                            <p className="text-gray-550 text-[10px] font-mono">Serial: {o.serialNumber} • Created: {new Date(o.createdAt).toLocaleString()}</p>
                          </div>

                          {/* Actors */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-4 bg-slate-950/60 border border-gray-900 rounded-xl xl:max-w-md w-full">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wide">Buyer Station</p>
                              <p className="font-bold text-white mt-0.5">{o.buyerName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wide">Seller Station</p>
                              <p className="font-bold text-white mt-0.5">{o.sellerName}</p>
                            </div>
                          </div>

                          {/* Financials */}
                          <div className="flex items-center gap-6 xl:text-right">
                            <div>
                              <p className="text-[10px] text-gray-550 block">Incentive Delivery Fee</p>
                              <span className="font-bold text-white font-mono">${o.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-550 block">Total Transaction Cost</p>
                              <span className="font-black text-emerald-400 font-mono text-sm">${o.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;


