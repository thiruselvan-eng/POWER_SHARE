// src/pages/delivery/DeliveryDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Navigation, 
  DollarSign, 
  RefreshCw, 
  Award, 
  Compass, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import deliveryService from '../../services/deliveryService';
import type { AvailablePickup, DeliveryAssignment } from '../../services/deliveryService';
import authService from '../../services/authService';
import OrderTrackingMap from '../../components/OrderTrackingMap';

const DeliveryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'wallet'>('available');

  // Node data
  const [available, setAvailable] = useState<AvailablePickup[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Simulation states
  const [simulatingId, setSimulatingId] = useState<number | null>(null);
  const [simProgress, setSimProgress] = useState<number>(0);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const [availList, myAssigns, walletData] = await Promise.all([
        deliveryService.getAvailable(),
        deliveryService.getMyAssignments(),
        authService.getWalletBalance(),
      ]);

      setAvailable(availList);
      setAssignments(myAssigns);
      setWalletBalance(walletData.balance);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error syncing delivery data with node.');
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

  // --- Handlers ---
  const handleClaim = async (orderId: number) => {
    try {
      setSubmitting(true);
      await deliveryService.claimOrder(orderId);
      triggerToast('success', 'Order claimed successfully! Transport route is now online.');
      setActiveTab('active');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to claim shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    assignmentId: number,
    newStatus: DeliveryAssignment['deliveryStatus'],
    note?: string
  ) => {
    try {
      setSubmitting(true);
      
      // Get current location (fallback to defaults if GPS simulation is idle)
      const currentAssign = assignments.find((a) => a.assignmentId === assignmentId);
      const lat = currentAssign?.currentLatitude;
      const lng = currentAssign?.currentLongitude;

      await deliveryService.updateStatus(assignmentId, newStatus, note, lat, lng);
      triggerToast('success', `Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to update delivery status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Run Real-time GPS Geolocation Simulation
  const handleSimulateGPS = async (assignment: DeliveryAssignment) => {
    if (simulatingId) {
      triggerToast('error', 'A simulation is already in progress.');
      return;
    }

    const startLat = assignment.deliveryStatus === 'RETURN_PICKED_UP' 
      ? (assignment.deliveryLatitude ?? 12.9816) 
      : (assignment.sellerLatitude ?? 12.9716);
    const startLng = assignment.deliveryStatus === 'RETURN_PICKED_UP' 
      ? (assignment.deliveryLongitude ?? 77.6046) 
      : (assignment.sellerLongitude ?? 77.5946);
    const endLat = assignment.deliveryStatus === 'RETURN_PICKED_UP' 
      ? (assignment.sellerLatitude ?? 12.9716) 
      : (assignment.deliveryLatitude ?? 12.9816);
    const endLng = assignment.deliveryStatus === 'RETURN_PICKED_UP' 
      ? (assignment.sellerLongitude ?? 77.5946) 
      : (assignment.deliveryLongitude ?? 77.6046);

    setSimulatingId(assignment.assignmentId);
    setSimProgress(0);
    triggerToast('success', 'Starting active driver GPS broadcast...');

    let currentStep = 0;
    const totalSteps = 8;

    const interval = setInterval(async () => {
      currentStep++;
      const ratio = currentStep / totalSteps;
      setSimProgress(Math.round(ratio * 100));

      const mockLat = startLat + (endLat - startLat) * ratio;
      const mockLng = startLng + (endLng - startLng) * ratio;

      try {
        await deliveryService.updateLocation(assignment.assignmentId, mockLat, mockLng);
      } catch (err) {
        console.error('Error during GPS step sync:', err);
      }

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setSimulatingId(null);
        setSimProgress(0);
        triggerToast('success', 'Arrival simulated target coordinates successfully!');
        fetchData();
      }
    }, 1500);
  };

  const activeAssigns = assignments.filter(
    (a) => a.deliveryStatus !== 'DELIVERED' && a.deliveryStatus !== 'RETURNED' && a.deliveryStatus !== 'FAILED'
  );

  const completedAssigns = assignments.filter(
    (a) => a.deliveryStatus === 'DELIVERED' || a.deliveryStatus === 'RETURNED'
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans antialiased flex">

      {/* Side Glowing Orbs */}
      <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-[8rem] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[35rem] h-[35rem] bg-indigo-700/5 rounded-full blur-[8rem] pointer-events-none" />

      {/* ── SIDEBAR PANEL ── */}
      <aside className="w-68 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed top-0 left-0 bottom-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Truck className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">PowerShare</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Logistics Hub</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 mt-4">
            {[
              { id: 'available', label: `Available Route Pools (${available.length})`, icon: Compass },
              { id: 'active', label: `Active Deliveries (${activeAssigns.length})`, icon: Navigation },
              { id: 'wallet', label: 'Earnings Ledger', icon: DollarSign },
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
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
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

        {/* Profile Card component */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center font-black text-sm">
              {user?.fullName?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user?.fullName}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Courier Dispatcher</p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="w-full text-center py-2 border border-slate-800/80 hover:border-rose-900 hover:text-rose-455 rounded-xl text-xs font-semibold text-slate-500 transition-all active:scale-95"
          >
            Deploy Account Exit
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ── */}
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

        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Decentralized Courier Node</h1>
            <p className="text-slate-400 text-sm mt-1">Claim local cell distribution dispatches, simulate GPS, and withdraw transport rewards.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 active:scale-95 transition-all animate-none"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Available Routes</span>
            <p className="text-2xl font-bold tracking-tight text-white">{available.length} pools</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">In Logistics</span>
            <p className="text-2xl font-bold tracking-tight text-amber-400">{activeAssigns.length} assigned</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Delivery Wallet</span>
            <p className="text-2xl font-bold tracking-tight text-emerald-400">${walletBalance.toFixed(2)}</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">Logistics Score</span>
            <p className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              100% SOH <Award className="w-5 h-5 text-emerald-450" />
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-28 bg-slate-900/10 backdrop-blur-sm border border-slate-800/80 rounded-3xl">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Mapping regional cell grid networks...</p>
          </div>
        )}

        {!loading && (
          <div>
            {/* 1. AVAILABLE ROUTE TAB */}
            {activeTab === 'available' && (
              <div>
                <h3 className="text-lg font-bold mb-6">Available Logistics Dispatches</h3>

                {available.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-gray-855 rounded-3xl bg-slate-900/10">
                    <Compass className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold mb-1 text-white">Grid is fully balanced</h3>
                    <p className="text-gray-550 text-sm max-w-sm mx-auto">
                      All battery placements have been completed. Check back shortly as new listings and return recyclings spawn.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-none">
                    {available.map((item) => {
                      const isReturn = item.orderStatus === 'RETURN_PENDING';
                      return (
                        <div 
                          key={item.orderId}
                          className="bg-[#0b0f19]/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-800 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-mono text-xs text-amber-450 font-bold">Order #{item.orderId}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                                isReturn 
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                {isReturn ? 'Recycle Return Collection' : 'Initial Order Delivery'}
                              </span>
                            </div>

                            <h4 className="text-lg font-extrabold text-white mb-1.5">{item.batteryName}</h4>
                            <p className="text-xs text-slate-500 font-mono mb-4">Serial Number: {item.serialNumber}</p>

                            <div className="bg-slate-950/60 p-4 border border-gray-855 rounded-xl space-y-3 mb-5 text-xs text-slate-400">
                              <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] mt-0.5">A</div>
                                <div>
                                  <p className="font-semibold text-white">Origin Station (Collect)</p>
                                  <p className="text-slate-500 mt-0.5">{isReturn ? item.buyerName : item.sellerName}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2 border-t border-gray-900/80 pt-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-[10px] mt-0.5">B</div>
                                <div>
                                  <p className="font-semibold text-white">Destination Station (Deliver)</p>
                                  <p className="text-slate-500 mt-0.5">{isReturn ? `${item.sellerName} (${item.sellerPhone})` : item.deliveryAddress}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                              <div>
                                <span className="text-[10px] text-gray-550 block">Transport Distance</span>
                                <span className="text-sm font-bold text-white font-mono">{item.distanceKm.toFixed(1)} km</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-550 block">Incentive Reward Fee</span>
                                <span className="text-sm font-black text-emerald-400 font-mono">${item.deliveryFee.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            disabled={submitting}
                            onClick={() => handleClaim(item.orderId)}
                            className="bg-amber-500 hover:bg-amber-400 text-white font-bold p-3 text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all text-center"
                          >
                            Accept Logistics Claim
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. ACTIVE LOGISTICS TAB */}
            {activeTab === 'active' && (
              <div className="space-y-8">
                <h3 className="text-lg font-bold">Active Logistics Missions</h3>

                {activeAssigns.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-gray-855 rounded-3xl bg-slate-900/10">
                    <Navigation className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Active Tasks</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                      Claim an available route from the grid lists to start transport navigation.
                    </p>
                    <button 
                      onClick={() => setActiveTab('available')}
                      className="bg-amber-500 hover:bg-amber-405 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors"
                    >
                      View Available Claims
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeAssigns.map((assignment) => {
                      const isExpanded = expandedId === assignment.assignmentId;
                      const isSim = simulatingId === assignment.assignmentId;
                      const isReturnFlow = assignment.orderStatus === 'RETURN_PENDING';

                      return (
                        <div 
                          key={assignment.assignmentId}
                          className="bg-[#0b0f19]/80 border border-slate-800 rounded-3xl p-6 space-y-5"
                        >
                          {/* Top Row Overview Card */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-950 pb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-xs text-amber-450 font-bold">Order #{assignment.orderId}</span>
                                <span className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-amber-400">
                                  {assignment.deliveryStatus.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <h4 className="text-xl font-black text-white">{assignment.batteryName}</h4>
                              <p className="text-xs text-slate-500 mt-1">Destination: <b className="text-slate-400">{isReturnFlow ? assignment.sellerName : assignment.deliveryAddress}</b></p>
                            </div>

                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => setExpandedId(isExpanded ? null : assignment.assignmentId)}
                                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
                              >
                                {isExpanded ? 'Hide Map Route' : 'Show Map & Navigate'}
                              </button>
                            </div>
                          </div>

                          {/* Expansion Panel showing route map and status buttons */}
                          {isExpanded && (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
                              
                              {/* Left Map View */}
                              <div className="xl:col-span-2">
                                <OrderTrackingMap
                                  orderId={assignment.orderId}
                                  sellerName={assignment.sellerName}
                                  sellerLatitude={assignment.sellerLatitude ?? 12.9716}
                                  sellerLongitude={assignment.sellerLongitude ?? 77.5946}
                                  buyerName={assignment.buyerName}
                                  buyerLatitude={assignment.deliveryLatitude ?? 12.9816}
                                  buyerLongitude={assignment.deliveryLongitude ?? 77.6046}
                                  onClose={() => setExpandedId(null)}
                                />
                              </div>

                              {/* Right status control panel */}
                              <div className="bg-slate-950/60 p-6 border border-gray-855 rounded-3xl flex flex-col justify-between min-h-[400px]">
                                
                                <div className="space-y-5">
                                  <div>
                                    <h5 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Controls</h5>
                                    <h4 className="text-lg font-bold text-white mt-1">Lodge Progress Update</h4>
                                  </div>

                                  {/* Step Progress indicators */}
                                  <div className="space-y-4 text-xs font-semibold">
                                    
                                    {/* Action Buttons based on deliveryStatus */}
                                    {assignment.deliveryStatus === 'ASSIGNED' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(assignment.assignmentId, isReturnFlow ? 'RETURN_PICKED_UP' : 'PICKED_UP', 'Picked up cell at base')}
                                        className="w-full bg-emerald-500 hover:bg-emerald-405 text-[#020617] font-bold p-3.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                                      >
                                        <Truck className="w-4 h-4" /> Pick Up Battery Pack
                                      </button>
                                    )}

                                    {['PICKED_UP', 'ASSIGNED'].includes(assignment.deliveryStatus) && !isReturnFlow && (
                                      <button 
                                        disabled={assignment.deliveryStatus === 'ASSIGNED'}
                                        onClick={() => handleUpdateStatus(assignment.assignmentId, 'IN_TRANSIT', 'Leaving warehouse')}
                                        className={`w-full font-bold p-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-2 ${
                                          assignment.deliveryStatus === 'ASSIGNED'
                                            ? 'bg-slate-900 border border-slate-800/80 text-slate-700 cursor-not-allowed'
                                            : 'bg-indigo-500 hover:bg-indigo-400 text-white active:scale-95 shadow-lg shadow-indigo-500/10'
                                        }`}
                                      >
                                        <Navigation className="w-4 h-4" /> Depart / Set In Transit
                                      </button>
                                    )}

                                    {/* transit GPS simulation trigger */}
                                    {(assignment.deliveryStatus === 'IN_TRANSIT' || (isReturnFlow && assignment.deliveryStatus === 'RETURN_PICKED_UP')) && (
                                      <div className="bg-slate-900 border border-amber-500/20 p-5 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="font-extrabold text-white text-xs">{isSim ? 'Broadcasting live coordinates...' : 'GPS Geolocation simulator'}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Stream live simulated points over WebSocket</p>
                                          </div>
                                          {!isSim && (
                                            <button 
                                              onClick={() => handleSimulateGPS(assignment)}
                                              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white p-2.5 rounded-xl transition-all active:scale-95"
                                            >
                                              <Play className="w-4 h-4 fill-current" />
                                            </button>
                                          )}
                                        </div>

                                        {isSim && (
                                          <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-mono">
                                              <span className="text-amber-450">Interpolating route...</span>
                                              <span>{simProgress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                              <div 
                                                className="bg-amber-500 h-full transition-all duration-300"
                                                style={{ width: `${simProgress}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Action complete triggers */}
                                    {assignment.deliveryStatus === 'IN_TRANSIT' && !isReturnFlow && (
                                      <button 
                                        onClick={() => handleUpdateStatus(assignment.assignmentId, 'DELIVERED', 'Delivered to buyer door')}
                                        className="w-full bg-emerald-500 hover:bg-emerald-405 text-[#020617] font-bold p-3.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Drop-off / Complete Delivery
                                      </button>
                                    )}

                                    {assignment.deliveryStatus === 'RETURN_PICKED_UP' && isReturnFlow && (
                                      <button 
                                        onClick={() => handleUpdateStatus(assignment.assignmentId, 'RETURNED', 'Returned and verified by seller')}
                                        className="w-full bg-emerald-500 hover:bg-emerald-450 text-[#020617] font-bold p-3.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                                      >
                                        <RotateCcw className="w-4 h-4" /> Safe Return to Seller Station
                                      </button>
                                    )}

                                  </div>
                                </div>

                                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-2xl text-[10px] text-slate-500 space-y-2 mt-6">
                                  <div className="flex justify-between">
                                    <span>Pickup Address:</span>
                                    <span className="text-white font-bold">{isReturnFlow ? 'Buyer Address' : 'Seller Station'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Address:</span>
                                    <span className="text-white font-bold truncate max-w-[120px]">{isReturnFlow ? 'Seller Base' : 'Buyer Address'}</span>
                                  </div>
                                </div>

                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. LEDGER HISTORY TAB */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* balance */}
                <div className="bg-[#0b0f19] border border-slate-800/80 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                  <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-emerald-700/3 rounded-full blur-[4rem] pointer-events-none" />
                  
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Transport Earnings Wallet</span>
                    <h3 className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">${walletBalance.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-2">Earn flat delivery fees instantly on completed drop-offs and recycling returns.</p>
                  </div>
                  
                  <button 
                    disabled={walletBalance <= 0}
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        await authService.withdraw(walletBalance);
                        triggerToast('success', `Withdrew $${walletBalance.toFixed(2)} to bank account!`);
                        fetchData();
                      } catch (err: any) {
                        triggerToast('error', err.response?.data?.message || 'Payout failed');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className={`w-full font-bold p-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
                      walletBalance <= 0
                        ? 'bg-slate-950 border border-slate-800/80 text-slate-700 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-[#020617] shadow-lg active:scale-95 shadow-emerald-500/10'
                    }`}
                  >
                    Withdraw All Earnings
                  </button>
                </div>

                {/* Ledgers table */}
                <div className="lg:col-span-2 bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-slate-500" /> Completed Job Logs
                  </h3>

                  {completedAssigns.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs">
                      No jobs have been completed yet.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {completedAssigns.map((ca) => (
                        <div key={ca.assignmentId} className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl hover:border-slate-800 transition-all flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-white">{ca.batteryName}</span>
                              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] uppercase font-black">{ca.deliveryStatus}</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Order #{ca.orderId} • Delivered on {ca.deliveredAt ? new Date(ca.deliveredAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-emerald-400 font-bold font-mono text-sm block">+$5.00</span>
                            <span className="text-[9px] text-slate-600">Incentive Code</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};

export default DeliveryDashboard;


