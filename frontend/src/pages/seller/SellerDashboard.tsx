import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, Edit2, Battery as BatteryIcon, 
  BatteryCharging, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Wallet as WalletIcon, Globe, MapPin, Loader2, Sparkles, RefreshCw, X 
} from 'lucide-react';
import batteryService from '../../services/batteryService';
import type { Battery, BatteryRequest } from '../../services/batteryService';
import listingService from '../../services/listingService';
import type { EnergyListing, EnergyListingRequest } from '../../services/listingService';
import authService from '../../services/authService';
import orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';

const SellerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batteries' | 'listings' | 'orders' | 'wallet'>('overview');
  
  // Data States
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [listings, setListings] = useState<EnergyListing[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modals
  const [batteryModalOpen, setBatteryModalOpen] = useState(false);
  const [editingBattery, setEditingBattery] = useState<Battery | null>(null);
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<EnergyListing | null>(null);
  const [walletActionOpen, setWalletActionOpen] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>('');

  // Forms
  const [batteryForm, setBatteryForm] = useState<BatteryRequest>({
    name: '',
    capacityKwh: 5.0,
    voltage: 48,
    batteryType: 'LiFePO4',
    currentChargeKwh: 4.8,
    healthRating: 98,
    serialNumber: '',
  });

  const [listingForm, setListingForm] = useState<EnergyListingRequest>({
    batteryId: 0,
    pricePerKwh: 0.25,
    deliveryRadiusKm: 15,
    description: '',
    active: true
  });

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [batList, listList, balanceData, txList, orderList] = await Promise.all([
        batteryService.getSellerBatteries(),
        listingService.getSellerListings(),
        authService.getWalletBalance(),
        authService.getTransactions(),
        orderService.getSellerOrders()
      ]);
      setBatteries(batList);
      setListings(listList);
      setWalletBalance(balanceData.balance);
      setTransactions(txList);
      setSellerOrders(orderList);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to load seller data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show auto-dismiss notifications (toasts)
  const triggerNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // --- Battery Handlers ---
  const handleOpenAddBattery = () => {
    setEditingBattery(null);
    setBatteryForm({
      name: '',
      capacityKwh: 5.0,
      voltage: 48,
      batteryType: 'LiFePO4',
      currentChargeKwh: 4.5,
      healthRating: 98,
      serialNumber: 'PS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    });
    setBatteryModalOpen(true);
  };

  const handleOpenEditBattery = (bat: Battery) => {
    setEditingBattery(bat);
    setBatteryForm({
      name: bat.name,
      capacityKwh: bat.capacityKwh,
      voltage: bat.voltage,
      batteryType: bat.batteryType,
      currentChargeKwh: bat.currentChargeKwh,
      healthRating: bat.healthRating * 100, // Display as percent
      serialNumber: bat.serialNumber,
    });
    setBatteryModalOpen(true);
  };

  const handleBatterySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batteryForm.currentChargeKwh > batteryForm.capacityKwh) {
      triggerNotification('error', 'Current charge cannot exceed maximum capacity.');
      return;
    }
    
    try {
      setSubmitting(true);
      const payload = {
        ...batteryForm,
        healthRating: batteryForm.healthRating / 100, // Store as fraction
      };

      if (editingBattery) {
        await batteryService.updateBattery(editingBattery.id, payload);
        triggerNotification('success', 'Battery configuration updated successfully!');
      } else {
        await batteryService.createBattery(payload);
        triggerNotification('success', 'New battery added to inventory!');
      }
      setBatteryModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to save battery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBattery = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this battery? Removing this battery will also delete any associated active listing.')) return;
    try {
      setLoading(true);
      await batteryService.deleteBattery(id);
      triggerNotification('success', 'Battery successfully removed.');
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to delete battery.');
      setLoading(false);
    }
  };

  // --- Listing Handlers ---
  const handleOpenAddListing = () => {
    // Find first available battery that is NOT currently listed
    const listedBatteryIds = listings.map(l => l.battery.id);
    const availableBatteries = batteries.filter(b => b.status === 'AVAILABLE' && !listedBatteryIds.includes(b.id));

    if (availableBatteries.length === 0) {
      triggerNotification('error', 'You must have an available, unlisted battery in your inventory to create a listing.');
      return;
    }

    setEditingListing(null);
    setListingForm({
      batteryId: availableBatteries[0].id,
      pricePerKwh: 0.28,
      deliveryRadiusKm: 10,
      description: '',
      active: true
    });
    setListingModalOpen(true);
  };

  const handleOpenEditListing = (listing: EnergyListing) => {
    setEditingListing(listing);
    setListingForm({
      batteryId: listing.battery.id,
      pricePerKwh: listing.pricePerKwh,
      deliveryRadiusKm: listing.deliveryRadiusKm,
      description: listing.description || '',
      active: listing.active
    });
    setListingModalOpen(true);
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingListing) {
        await listingService.updateListing(editingListing.id, listingForm);
        triggerNotification('success', 'Energy listing updated.');
      } else {
        await listingService.createListing(listingForm);
        triggerNotification('success', 'Energy listing created successfully! It is now live.');
      }
      setListingModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to save energy listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Delete this listing? It will remove your energy offer from the public search.')) return;
    try {
      setLoading(true);
      await listingService.deleteListing(id);
      triggerNotification('success', 'Listing deleted.');
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to delete listing.');
      setLoading(false);
    }
  };

  // Toggle active listing status quickly
  const handleToggleListingActive = async (listing: EnergyListing) => {
    try {
      const updated = {
        batteryId: listing.battery.id,
        pricePerKwh: listing.pricePerKwh,
        deliveryRadiusKm: listing.deliveryRadiusKm,
        description: listing.description || '',
        active: !listing.active
      };
      await listingService.updateListing(listing.id, updated);
      triggerNotification('success', `Listing is now ${!listing.active ? 'active' : 'inactive'}.`);
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to update listing.');
    }
  };

  // --- Wallet Helpers ---
  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(walletAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerNotification('error', 'Please enter a valid amount greater than $0.');
      return;
    }

    try {
      setSubmitting(true);
      if (walletActionOpen === 'deposit') {
        await authService.deposit(amountNum);
        triggerNotification('success', `Successfully deposited $${amountNum.toFixed(2)} to wallet!`);
      } else {
        await authService.withdraw(amountNum);
        triggerNotification('success', `Successfully withdrew $${amountNum.toFixed(2)} to linked account!`);
      }
      setWalletActionOpen(null);
      setWalletAmount('');
      fetchData();
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalCapacity = batteries.reduce((acc, b) => acc + b.capacityKwh, 0);
  const avgSOH = batteries.length > 0 
    ? (batteries.reduce((acc, b) => acc + b.healthRating, 0) / batteries.length) * 100 
    : 0;
  const activeListingsCount = listings.filter(l => l.active).length;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans antialiased selection:bg-emerald-500 selection:text-[#020617]">
      
      {/* ── Background Glow Elements ── */}
      <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-emerald-700/5 rounded-full blur-[8rem] pointer-events-none" />

      {/* ── Dashboard Base Layout ── */}
      <div className="max-w-[85rem] mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Seller Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Energy Marketplace Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your clean energy cell inventory, monitor diagnostics, and configure public list pricing.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 active:scale-95 transition-all text-slate-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleOpenAddBattery}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 font-bold text-[#020617] px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-xs uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" /> Add Battery Pack
            </button>
          </div>
        </div>

        {/* --- TOASTER / ALERT BANNER --- */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/80 hover:text-emerald-300">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400/80 hover:text-rose-300">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STAT DETAILS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stored Capacity</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <BatteryIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{totalCapacity.toFixed(1)} <span className="text-sm font-normal text-slate-400">kWh</span></p>
            <p className="text-xs text-slate-400 mt-1">{batteries.length} total packs registered</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Diagnostics</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <BatteryCharging className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{avgSOH.toFixed(1)}% <span className="text-sm font-normal text-slate-400">SOH</span></p>
            <p className="text-xs text-emerald-500 mt-1">Excellent chemistry rating</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Active Listings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{activeListingsCount} <span className="text-xs font-normal text-slate-400">offers</span></p>
            <p className="text-xs text-slate-400 mt-1">{listings.length - activeListingsCount} listings in standby</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Wallet Funds</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <WalletIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-400">${walletBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Escrow secure ledger</p>
          </div>

        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex border-b border-slate-800 gap-2 mb-8 overflow-x-auto pb-1.5 scrollbar-thin">
          {[
            { id: 'overview', label: 'Marketplace Overview', icon: Sparkles },
            { id: 'batteries', label: 'Battery Packs (' + batteries.length + ')', icon: BatteryIcon },
            { id: 'listings', label: 'Energy Listings (' + listings.length + ')', icon: Globe },
            { id: 'orders', label: 'Incoming Orders (' + sellerOrders.length + ')', icon: BatteryCharging },
            { id: 'wallet', label: 'Earnings Wallet', icon: WalletIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap active:scale-95 duration-150 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500/60 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --- TAB VIEW AREA --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-800/40 rounded-3xl bg-slate-900/10 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Syncing with platform energy grid...</p>
          </div>
        ) : (
          <div>
            
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* How to trade section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/20 border border-slate-800/80 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[20rem] h-[15rem] bg-emerald-500/3 rounded-full blur-[5rem] pointer-events-none" />
                    
                    <h3 className="text-xl font-bold mb-2 text-white">Grid Monetization Tips</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Earn passive income by sharing stored energy. Connect battery cells charged from residential solar panels or off-grid wind turbines to local buyers who need grid backups, emergency power, or flexible battery packs.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                        <span className="text-sm font-semibold text-emerald-400 block mb-1">1. Register Cells</span>
                        <span className="text-xs text-slate-500">Provide capacity in kWh, serial number, and Chemistry specs.</span>
                      </div>

                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                        <span className="text-sm font-semibold text-emerald-400 block mb-1">2. Post Energy listing</span>
                        <span className="text-xs text-slate-500">Set customized pricing rates, coordinates, and local radius.</span>
                      </div>

                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
                        <span className="text-sm font-semibold text-emerald-400 block mb-1">3. Deliver & Earn</span>
                        <span className="text-xs text-slate-500">Dispatch fully charged packs. Buyers replace with returned empty cells.</span>
                      </div>

                    </div>
                  </div>

                  {/* Listings Map Proximity Guide */}
                  <div className="bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl">
                    <h3 className="text-lg font-bold mb-4">Proximity Range Guide</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-gray-900 rounded-2xl text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Listing Delivery Radius</p>
                          <p className="text-xs text-slate-500">Determines how far couriers will travel to deliver packs.</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-mono font-semibold bg-emerald-500/5 border border-emerald-500/15 py-1 px-3 rounded-lg">
                        15 km avg. radius
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right panel: Recent Wallet ledger */}
                <div className="bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                    <button 
                      onClick={() => setActiveTab('wallet')}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      View Wallet
                    </button>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      <WalletIcon className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      No recent ledger entries found.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {transactions.slice(0, 5).map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-950/60 border border-gray-900 rounded-xl">
                          <div className="flex items-center gap-3">
                            {tx.transactionType === 'DEPOSIT' ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-white">{tx.description || 'Adjustment'}</p>
                              <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${
                            tx.transactionType === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.transactionType === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* BATTERIES LISTING PANEL */}
            {activeTab === 'batteries' && (
              <div>
                {batteries.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <BatteryIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Batteries Registered</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                      Create physical battery profiles to represent your clean cells so they can be associated with listing rates.
                    </p>
                    <button 
                      onClick={handleOpenAddBattery}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Configure First Battery Pack
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batteries.map((bat) => {
                      const isListed = listings.some(l => l.battery.id === bat.id);
                      return (
                        <div 
                          key={bat.id}
                          className="bg-[#0b0f19]/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-white text-lg tracking-tight mb-0.5">{bat.name}</h4>
                                <span className="text-[10px] text-slate-500 font-mono tracking-wide">SN: {bat.serialNumber}</span>
                              </div>
                              
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                bat.status === 'AVAILABLE' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : bat.status === 'RENTED'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}>
                                {bat.status}
                              </span>
                            </div>

                            {/* Battery stats row */}
                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-800/40 mb-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-500">Gross Capacity</p>
                                <p className="font-semibold text-white">{bat.capacityKwh} kWh</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Voltage</p>
                                <p className="font-semibold text-white">{bat.voltage} V</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Current Charge</p>
                                <p className="font-semibold text-emerald-400">{bat.currentChargeKwh} kWh</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Battery Type</p>
                                <p className="font-semibold text-white">{bat.batteryType}</p>
                              </div>
                            </div>

                            {/* Health Diagnostic Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">State of Health (SOH)</span>
                                <span className="text-emerald-400 font-semibold">{(bat.healthRating * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${bat.healthRating * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/20">
                            <span className="text-xs text-slate-500">
                              {isListed ? (
                                <span className="text-emerald-400/80 flex items-center gap-1">
                                  <Globe className="w-3.5 h-3.5" /> Listed for sale
                                </span>
                              ) : (
                                'Not listed'
                              )}
                            </span>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleOpenEditBattery(bat)}
                                className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBattery(bat.id)}
                                className="p-2 border border-slate-800 hover:border-rose-900 bg-slate-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* LISTINGS PANEL */}
            {activeTab === 'listings' && (
              <div>
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Active Market Listings</h3>
                  <button 
                    onClick={handleOpenAddListing}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Post Energy Listing
                  </button>
                </div>

                {listings.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Energy Listings Posted</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                      Offer energy stored in your batteries to buyers in your local delivery radius by listing a cell.
                    </p>
                    <button 
                      onClick={handleOpenAddListing}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Post Your First Energy Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <div 
                        key={listing.id}
                        className={`bg-[#0b0f19]/80 border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                          listing.active ? 'border-slate-800 hover:border-emerald-500/20' : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-white text-lg tracking-tight mb-0.5">{listing.battery.name} Listing</h4>
                              <p className="text-xs text-emerald-400 font-semibold tracking-wider font-mono">${listing.pricePerKwh.toFixed(2)}/kWh</p>
                            </div>
                            <button
                              onClick={() => handleToggleListingActive(listing)}
                              className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                listing.active
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}
                            >
                              {listing.active ? 'Active' : 'Paused/Inactive'}
                            </button>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-lg border border-gray-900 font-sans">
                            {listing.description || 'No custom description provided. High-performance solar cells charged under strict safety configurations.'}
                          </p>

                          <div className="space-y-2 py-3 border-t border-gray-900 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Unused energy</span>
                              <span className="text-white font-bold">{listing.battery.currentChargeKwh} kWh ({((listing.battery.currentChargeKwh / listing.battery.capacityKwh) * 100).toFixed(0)}% charge)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Service Coverage</span>
                              <span className="text-white font-bold">{listing.deliveryRadiusKm} km radius</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Battery SOH</span>
                              <span className="text-emerald-400 font-bold">{(listing.battery.healthRating * 100).toFixed(0)}% SOH</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-805">
                          <button 
                            onClick={() => handleOpenEditListing(listing)}
                            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1.5 px-3"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-2 border border-slate-800 hover:border-rose-900 bg-slate-950 text-slate-400 hover:text-rose-450 rounded-lg transition-colors text-xs flex items-center gap-1.5 px-3"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* INCOMING ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Incoming Rental Orders</h3>
                  <span className="text-xs text-slate-500">
                    {sellerOrders.filter(o => o.status === 'PENDING').length} pending review
                  </span>
                </div>

                {sellerOrders.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <BatteryCharging className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Orders Received Yet</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      Make sure your energy listings are active and visible to buyers in your service radius.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerOrders.map((order) => {
                      const nextAction: { label: string; status: Order['status'] } | null =
                        order.status === 'PENDING'   ? { label: 'Accept Order',    status: 'ACCEPTED' } :
                        order.status === 'ACCEPTED'  ? { label: 'Mark Dispatched', status: 'DISPATCHED' } :
                        order.status === 'DISPATCHED'? { label: 'Mark Completed',  status: 'COMPLETED' } :
                        null;

                      return (
                        <div
                          key={order.id}
                          className="bg-[#0b0f19]/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-xs font-semibold text-emerald-400">Order #{order.id}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                order.status === 'PENDING'    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                order.status === 'ACCEPTED'   ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                order.status === 'DISPATCHED' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                order.status === 'COMPLETED'  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                'bg-slate-950 border-slate-800 text-slate-500'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-white text-base mb-1">{order.batteryName}</h4>
                            <p className="text-[10px] font-mono text-slate-500 mb-3">SN: {order.serialNumber}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                              <div>
                                <p className="text-slate-600">Buyer</p>
                                <p className="font-semibold text-white">{order.buyerName}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Energy</p>
                                <p className="font-semibold text-white font-mono">{order.energyAmountKwh} kWh</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Rate</p>
                                <p className="font-semibold text-white font-mono">${order.pricePerKwh.toFixed(2)}/kWh</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Delivery</p>
                                <p className="font-semibold text-white truncate max-w-[120px]" title={order.deliveryAddress}>
                                  {order.deliveryAddress}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 border-t border-gray-900 md:border-none pt-4 md:pt-0">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500">Invoice Total</p>
                              <p className="text-xl font-black font-mono text-emerald-400">${order.totalAmount.toFixed(2)}</p>
                              <p className="text-[9px] text-slate-600">${(order.pricePerKwh * order.energyAmountKwh).toFixed(2)} + ${order.deliveryFee.toFixed(2)} shipping</p>
                            </div>

                            {nextAction && (
                              <button
                                onClick={async () => {
                                  try {
                                    await orderService.updateSellerOrderStatus(order.id, nextAction.status);
                                    triggerNotification('success', `Order #${order.id} marked as ${nextAction.status}.`);
                                    fetchData();
                                  } catch (err: any) {
                                    triggerNotification('error', err.response?.data?.message || 'Status update failed.');
                                  }
                                }}
                                className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                              >
                                {nextAction.label}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WALLET ACTIONS PANEL */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Balance display & actions */}
                <div className="bg-[#0b0f19]/80 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                  <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-emerald-500/3 rounded-full blur-[4rem] pointer-events-none" />
                  
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Wallet Funds Balance</span>
                    <h3 className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight font-mono">${walletBalance.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-2">All deposits/earnings are protected by platform escrow until orders complete successfully.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button 
                      onClick={() => setWalletActionOpen('deposit')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold p-3.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Top Up Balance
                    </button>
                    <button 
                      onClick={() => setWalletActionOpen('withdraw')}
                      className="bg-slate-950 border border-slate-800/80 hover:bg-[#0b0f19]/80 text-white font-semibold p-3.5 rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Withdraw Funds
                    </button>
                  </div>
                </div>

                {/* Complete wallet ledger list */}
                <div className="lg:col-span-2 bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold mb-4">Complete Ledger Ledger History</h3>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">
                      <WalletIcon className="w-12 h-12 mx-auto mb-4 text-gray-850" />
                      No wallet transactions have been recorded.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950/60 border border-gray-900 rounded-xl hover:border-slate-800 transition-colors">
                          <div className="flex items-center gap-4">
                            {tx.transactionType === 'DEPOSIT' ? (
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ArrowUpRight className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                                <ArrowDownLeft className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white text-sm">{tx.description || 'Adjustment'}</p>
                              <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          
                          <span className={`font-mono font-bold ${
                            tx.transactionType === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.transactionType === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── MODAL: DEP/WITHDRAWS ── */}
        <AnimatePresence>
          {walletActionOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
              >
                
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold tracking-tight text-white capitalize">
                    {walletActionOpen === 'deposit' ? 'Top up Wallet Balance' : 'Withdraw Funds to Bank'}
                  </h4>
                  <button 
                    onClick={() => setWalletActionOpen(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleWalletAction} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Amount ($ USD)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500 focus:outline-none text-xl"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#020617] font-bold p-4 rounded-xl text-center shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-sm"
                  >
                    {submitting ? 'Processing Ledger...' : walletActionOpen === 'deposit' ? 'Add Funds now' : 'Withdraw funds now'}
                  </button>
                </form>

              </motion.div>
            </div>
          )}

          {/* ── MODAL: BATTERY POPUP ── */}
          {batteryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    {editingBattery ? 'Edit Battery Pack configuration' : 'Register New Battery Pack'}
                  </h4>
                  <button onClick={() => setBatteryModalOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleBatterySubmit} className="space-y-4 text-sm">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Battery Model Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. EcoFlow Delta Pro 3"
                        value={batteryForm.name}
                        onChange={(e) => setBatteryForm({...batteryForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Serial Number</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. PS-84918451"
                        value={batteryForm.serialNumber}
                        onChange={(e) => setBatteryForm({...batteryForm, serialNumber: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Capacity (kWh)</label>
                      <input 
                        type="number"
                        step="0.1"
                        required
                        value={batteryForm.capacityKwh}
                        onChange={(e) => setBatteryForm({...batteryForm, capacityKwh: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Current Charge (kWh)</label>
                      <input 
                        type="number"
                        step="0.1"
                        required
                        value={batteryForm.currentChargeKwh}
                        onChange={(e) => setBatteryForm({...batteryForm, currentChargeKwh: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Voltage (V)</label>
                      <input 
                        type="number"
                        step="1"
                        required
                        value={batteryForm.voltage}
                        onChange={(e) => setBatteryForm({...batteryForm, voltage: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Battery Chemistry</label>
                      <select 
                        value={batteryForm.batteryType}
                        onChange={(e) => setBatteryForm({...batteryForm, batteryType: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:bg-slate-900"
                      >
                        <option value="LiFePO4">LiFePO4 (Lithium Iron Phosphate)</option>
                        <option value="Lithium-ion">Lithium-ion</option>
                        <option value="Lead Acid">Lead Acid</option>
                        <option value="Solid State">Solid State</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">State of Health (SOH %)</label>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        required
                        placeholder="e.g. 98"
                        value={batteryForm.healthRating}
                        onChange={(e) => setBatteryForm({...batteryForm, healthRating: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#020617] font-bold p-3.5 rounded-xl text-center shadow-lg transition-all text-sm mt-4 active:scale-95"
                  >
                    {submitting ? 'Saving battery metrics...' : editingBattery ? 'Update Battery Pack' : 'Register Battery Pack'}
                  </button>

                </form>
              </motion.div>
            </div>
          )}

          {/* ── MODAL: ENERGY LISTING POPUP ── */}
          {listingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
              >
                
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    {editingListing ? 'Configure Energy Listing' : 'Publish New Energy Listing'}
                  </h4>
                  <button onClick={() => setListingModalOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleListingSubmit} className="space-y-4 text-sm">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Select Battery Pack</label>
                    {editingListing ? (
                      <input 
                        type="text"
                        disabled
                        value={editingListing.battery.name}
                        className="w-full bg-slate-950 border border-slate-800/80 text-slate-500 rounded-xl px-4 py-2.5"
                      />
                    ) : (
                      <select 
                        value={listingForm.batteryId}
                        onChange={(e) => setListingForm({...listingForm, batteryId: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:bg-slate-900"
                      >
                        {(() => {
                          const listedBatteryIds = listings.map(l => l.battery.id);
                          return batteries
                            .filter(b => b.status === 'AVAILABLE' && !listedBatteryIds.includes(b.id))
                            .map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.currentChargeKwh} kWh available)</option>
                            ));
                        })()}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Price ($ per kWh)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={listingForm.pricePerKwh}
                        onChange={(e) => setListingForm({...listingForm, pricePerKwh: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Radius Coverage (km)</label>
                      <input 
                        type="number"
                        step="1"
                        required
                        value={listingForm.deliveryRadiusKm}
                        onChange={(e) => setListingForm({...listingForm, deliveryRadiusKm: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Energy Source / Description</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. Charged from 10kW residential rooftop solar panel array on a sunny afternoon."
                      value={listingForm.description}
                      onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 py-1">
                    <input 
                      type="checkbox"
                      id="active"
                      checked={listingForm.active}
                      onChange={(e) => setListingForm({...listingForm, active: e.target.checked})}
                      className="w-4 h-4 accent-emerald-500 bg-slate-950 border-slate-800 rounded"
                    />
                    <label htmlFor="active" className="text-xs font-semibold text-slate-400 select-none cursor-pointer">Make listing active now for buyers</label>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#020617] font-bold p-3.5 rounded-xl text-center shadow-lg transition-all text-sm mt-4 active:scale-95"
                  >
                    {submitting ? 'Publishing listing...' : editingListing ? 'Save Configurations' : 'Publish Energy Listing'}
                  </button>

                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SellerDashboard;


