import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BatteryCharging, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet as WalletIcon, 
  Globe, 
  Loader2, 
  RefreshCw, 
  X, 
  Search, 
  CheckCircle2,
  Navigation,
  MapPin,
  FileText,
  Trash2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import listingService from '../../services/listingService';
import type { EnergyListing } from '../../services/listingService';
import orderService from '../../services/orderService';
import type { Order, OrderRequest } from '../../services/orderService';
import authService from '../../services/authService';
import OrderTrackingMap from '../../components/OrderTrackingMap';

const BuyerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'browse' | 'orders' | 'wallet'>('browse');
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);

  // Backend data
  const [listings, setListings] = useState<EnergyListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Simulation location (Default to Bangalore center: 12.9716, 77.5946)
  const [simLat, setSimLat] = useState<number>(12.9716);
  const [simLon, setSimLon] = useState<number>(77.5946);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(1.00);
  const [maxDistance, setMaxDistance] = useState<number>(45);
  const [batteryTypeFilter, setBatteryTypeFilter] = useState<string>('ALL');

  // UI status
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // checkout modal
  const [checkoutListing, setCheckoutListing] = useState<EnergyListing | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  // wallet topup modal
  const [walletActionOpen, setWalletActionOpen] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [pubListings, myOrders, balanceData, txList] = await Promise.all([
        listingService.getPublicListings(),
        orderService.getBuyerOrders(),
        authService.getWalletBalance(),
        authService.getTransactions()
      ]);
      setListings(pubListings);
      setOrders(myOrders);
      setWalletBalance(balanceData.balance);
      setTransactions(txList);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error syncing data with energy node.');
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

  // Helper: Haversine Formula for distance
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // --- Search & Filters logic ---
  const filteredListings = listings.filter((listing) => {
    // 1. Search Query
    const matchedSearch =
      listing.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.description && listing.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      listing.battery.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Max Price
    const matchedPrice = listing.pricePerKwh <= maxPrice;

    // 3. Proximity distance
    const distance = getDistanceKm(simLat, simLon, listing.latitude || 12.9716, listing.longitude || 77.5946);
    const matchedDistance = distance <= maxDistance;

    // 4. Battery Type
    const matchedType =
      batteryTypeFilter === 'ALL' ||
      listing.battery.batteryType.toUpperCase() === batteryTypeFilter.toUpperCase();

    return matchedSearch && matchedPrice && matchedDistance && matchedType;
  });

  // --- Rent / Checkout Handlers ---
  const handleOpenRentCheckout = (listing: EnergyListing) => {
    const distance = getDistanceKm(simLat, simLon, listing.latitude || 12.9716, listing.longitude || 77.5946);
    if (listing.deliveryRadiusKm > 0 && distance > listing.deliveryRadiusKm) {
      triggerToast('error', `This seller only delivers within a ${listing.deliveryRadiusKm} km radius. Your current simulated range is ${distance} km.`);
      return;
    }
    setCheckoutListing(listing);
    setDeliveryAddress('');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutListing) return;

    if (!deliveryAddress.trim()) {
      triggerToast('error', 'Delivery address is required.');
      return;
    }

    const priceOfEnergy = checkoutListing.pricePerKwh * checkoutListing.battery.currentChargeKwh;
    const distanceVal = getDistanceKm(simLat, simLon, checkoutListing.latitude || 12.9716, checkoutListing.longitude || 77.5946);
    const calcDeliveryFee = 2.0 + distanceVal * 0.5;
    const totalOrderCost = priceOfEnergy + calcDeliveryFee;

    if (walletBalance < totalOrderCost) {
      triggerToast('error', `Insufficient wallet balance. Total amount required is $${totalOrderCost.toFixed(2)}, but you only have $${walletBalance.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload: OrderRequest = {
        listingId: checkoutListing.id,
        deliveryAddress: deliveryAddress,
        deliveryLatitude: simLat,
        deliveryLongitude: simLon,
      };

      await orderService.createOrder(payload);
      triggerToast('success', 'Order created successfully! Escrow payment locked.');
      setCheckoutListing(null);
      setActiveTab('orders');
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerToast('error', err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order? Paid funds will be refunded immediately.')) return;
    try {
      setLoading(true);
      await orderService.cancelOrder(orderId);
      triggerToast('success', 'Order cancelled and wallet balance refunded successfully.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerToast('error', err.response?.data?.message || 'Failed to cancel order.');
      setLoading(false);
    }
  };

  const handleRequestReturn = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to request a return for this battery pack?')) return;
    try {
      setLoading(true);
      await orderService.requestReturn(orderId);
      triggerToast('success', 'Return request created. A delivery agent will pick up the battery pack shortly.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      triggerToast('error', err.response?.data?.message || 'Failed to request return.');
      setLoading(false);
    }
  };

  // --- Wallet Helpers ---
  const handleWalletFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(walletAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerToast('error', 'Please enter a valid amount greater than $0.');
      return;
    }

    try {
      setSubmitting(true);
      if (walletActionOpen === 'deposit') {
        await authService.deposit(amountNum);
        triggerToast('success', `Deposited $${amountNum.toFixed(2)} successfully!`);
      } else {
        await authService.withdraw(amountNum);
        triggerToast('success', `Withdrew $${amountNum.toFixed(2)} successfully!`);
      }
      setWalletActionOpen(null);
      setWalletAmount('');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Wallet transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalKwhPurchased = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.energyAmountKwh, 0);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'RETURNED'
  ).length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex">

      {/* Decorative Radial Background Glimmers */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[35rem] h-[35rem] bg-teal-500/5 rounded-full blur-[8rem] pointer-events-none" />

      {/* ── SIDEBAR PANEL ── */}
      <aside className="w-68 min-h-screen bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between fixed top-0 left-0 bottom-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-[#020617] w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block text-white">PowerShare</span>
              <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider block">Demand Station</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 mt-4">
            {[
              { id: 'browse', label: 'Explore Grid Map', icon: Globe },
              { id: 'orders', label: 'My Rental Orders', icon: BatteryCharging, badge: orders.length },
              { id: 'wallet', label: 'Escrow Wallet', icon: WalletIcon },
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
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold transition-all border active:scale-95 group ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-455' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card Bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.fullName?.[0]?.toUpperCase() ?? 'B'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate leading-tight">{user?.fullName}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Energy Buyer</p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 hover:border-rose-950 hover:bg-rose-500/5 hover:text-rose-400 rounded-xl text-xs font-semibold text-slate-500 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="ml-68 flex-1 p-8 min-h-screen relative z-10">

        {/* Alerts toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)}>
                <X className="w-4 h-4 text-emerald-400 hover:text-emerald-355" />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)}>
                <X className="w-4 h-4 text-rose-400 hover:text-rose-355" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Demand Station Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Locate active off-grid storage, query cells pricing, and sign escrow rentals.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* --- STAT CARD GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Rentals</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{activeOrdersCount}</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Energy Exchanged</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{totalKwhPurchased.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kWh</span></p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Escrow Ledger Funds</span>
            <p className="text-2xl font-bold tracking-tight text-emerald-450 font-mono">${walletBalance.toFixed(2)}</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Radius Range Limit</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{maxDistance} <span className="text-xs text-slate-500 font-normal">km</span></p>
          </div>
        </div>

        {/* loading spinner state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/10 backdrop-blur-sm border border-slate-800/80 rounded-3xl">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Mapping regional cell nodes network...</p>
          </div>
        ) : (
          <div>

            {/* BROWSE PANEL */}
            {activeTab === 'browse' && (
              <div className="space-y-8">
                
                {/* 1. Proximity Location & Search Filters Controls */}
                <div className="bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl space-y-6">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Simulated coordinates */}
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        Simulate Device GPS Coordinates
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Latitude</label>
                          <input 
                            type="number" 
                            value={simLat} 
                            step="0.0001"
                            onChange={(e) => setSimLat(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050816] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Longitude</label>
                          <input 
                            type="number" 
                            value={simLon} 
                            step="0.0001"
                            onChange={(e) => setSimLon(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050816] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter fields */}
                    <div className="lg:col-span-2 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-emerald-505" />
                        Search Grid Inventory
                      </span>
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search listed cell models, local seller names, battery type..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 border-t border-slate-850/60 text-xs">
                    
                    {/* Price Range Slider */}
                    <div>
                      <div className="flex justify-between font-bold text-slate-400 mb-2">
                        <span>Max Price Limit:</span>
                        <span className="text-emerald-450 font-mono font-bold">${maxPrice.toFixed(2)}/kWh</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.10" 
                        max="1.50" 
                        step="0.05"
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Proximity Slider */}
                    <div>
                      <div className="flex justify-between font-bold text-slate-400 mb-2">
                        <span>Search Distance:</span>
                        <span className="text-emerald-455 font-mono font-bold">{maxDistance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        step="5"
                        value={maxDistance} 
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Chemistry Dropdown */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-2">Battery Chemistry Specifications:</label>
                      <select 
                        value={batteryTypeFilter}
                        onChange={(e) => setBatteryTypeFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ALL">All Chemistries</option>
                        <option value="LIFEPO4">LiFePO4</option>
                        <option value="LITHIUM-ION">Lithium-ion</option>
                        <option value="SOLID STATE">Solid State</option>
                        <option value="LEAD ACID">Lead Acid</option>
                      </select>
                    </div>

                  </div>

                </div>

                {/* 2. Listings Results Grid */}
                {filteredListings.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-md font-bold mb-1 text-white">No Energy Cells Found Nearby</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Adjust your device GPS coords, increase range threshold, or modify filters to locate nearby nodes.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => {
                      const distance = getDistanceKm(simLat, simLon, listing.latitude || 12.9716, listing.longitude || 77.5946);
                      const isTooFar = listing.deliveryRadiusKm > 0 && distance > listing.deliveryRadiusKm;

                      return (
                        <div 
                          key={listing.id}
                          className="bg-[#0b0f19] border border-slate-850 hover:border-slate-800 rounded-3xl p-5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group"
                        >
                          <div>
                            {/* Seller name, score, distance */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-400 capitalize block w-max mb-1.5">
                                  {listing.battery.batteryType}
                                </span>
                                <h3 className="font-extrabold text-white text-base tracking-tight">{listing.battery.name}</h3>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl border flex items-center gap-1 ${
                                isTooFar 
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                <Navigation className="w-3 h-3 rotate-45" />
                                {distance} km away
                              </span>
                            </div>

                            {/* Battery stats */}
                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-850/60 my-4 text-xs">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Usable Charge</p>
                                <p className="font-bold text-white font-mono mt-0.5">{listing.battery.currentChargeKwh} kWh</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tariff price</p>
                                <p className="font-bold text-emerald-450 font-mono mt-0.5">${listing.pricePerKwh.toFixed(2)}/kWh</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cell diagnostics</p>
                                <p className="font-bold text-white font-mono mt-0.5">{(listing.battery.healthRating * 100).toFixed(0)}% SOH</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Max Logistics</p>
                                <p className="font-bold text-white font-mono mt-0.5">{listing.deliveryRadiusKm} km radius</p>
                              </div>
                            </div>

                            {/* Seller descriptions */}
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                              {listing.description || 'Monitored smart cells. Clean solar panels setup with automatic surge protection modules.'}
                            </p>

                            <div className="flex items-center gap-2 mb-5 bg-slate-950 p-2 rounded-xl border border-slate-850">
                              <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-400 uppercase">
                                {listing.sellerName[0]}
                              </span>
                              <span className="text-xs text-slate-400">Listed by: <b className="text-[#10b981] font-semibold">{listing.sellerName}</b></span>
                            </div>
                          </div>

                          <button 
                            disabled={isTooFar}
                            onClick={() => handleOpenRentCheckout(listing)}
                            className={`w-full font-bold p-3.5 text-xs tracking-wide uppercase rounded-xl transition-all duration-200 active:scale-95 ${
                              isTooFar
                                ? 'bg-slate-950 border border-slate-805 text-slate-655 cursor-not-allowed shadow-none'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-[#020617] shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20'
                            }`}
                          >
                            {isTooFar ? 'Radius Limit Exceeded' : 'Checkout Battery Rent'}
                          </button>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* MY ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                <h3 className="text-xl font-bold text-white mb-6">Your Rental Orders Ledger</h3>

                {orders.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <BatteryCharging className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Orders Found</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                      Explore the local grid map to checkout and order local battery packs.
                    </p>
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors"
                    >
                      Browse Grid
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isPending = order.status === 'PENDING';
                      const isTracking = trackingOrderId === order.id;
                      return (
                        <div key={order.id} className="bg-[#0b0f19] border border-slate-850 hover:border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-mono text-xs font-bold text-[#10b981]">Order #{order.id}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                                  order.status === 'PENDING'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : order.status === 'ACCEPTED'
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                    : order.status === 'DISPATCHED'
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                    : order.status === 'COMPLETED'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : order.status === 'RETURN_PENDING'
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                    : order.status === 'RETURNED'
                                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                    : 'bg-slate-950 border-slate-850 text-slate-500'
                                }`}>
                                  {order.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-white text-lg tracking-tight mb-0.5">{order.batteryName}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mb-4">SN: {order.serialNumber}</p>
                              
                              <div className="grid grid-cols-3 gap-6 text-xs text-slate-400">
                                <div>
                                  <p className="text-slate-500 font-medium">Agreement Price</p>
                                  <p className="font-bold text-white font-mono mt-0.5">${order.pricePerKwh.toFixed(2)}/kWh</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-medium">Secured capacity</p>
                                  <p className="font-bold text-white font-mono mt-0.5">{order.energyAmountKwh} kWh</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-medium font-mono text-[10px]">Logistics Protocol</p>
                                  <p className="font-bold text-white mt-0.5">Escrow Courier</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t border-slate-850/65 lg:border-none pt-4 lg:pt-0 gap-4">
                              <div className="text-left lg:text-right">
                                <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-widest">Locked Escrow Payout</p>
                                <p className="text-xl font-mono font-black text-emerald-450 leading-tight mt-0.5">${order.totalAmount.toFixed(2)}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">(${(order.pricePerKwh * order.energyAmountKwh).toFixed(2)} energy + ${order.deliveryFee.toFixed(2)} logistics)</p>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {isPending && (
                                  <button 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="border border-slate-800 hover:border-rose-900 bg-slate-950 text-rose-500 py-2 px-4 rounded-xl text-xs font-bold hover:bg-rose-955/20 active:scale-95 transition-all text-center flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Cancel Order
                                  </button>
                                )}

                                {order.status === 'COMPLETED' && (
                                  <button 
                                    onClick={() => handleRequestReturn(order.id)}
                                    className="border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 py-2 px-4 rounded-xl text-xs font-bold hover:bg-emerald-950/40 active:scale-95 transition-all text-center"
                                  >
                                    Return Packaging Pack
                                  </button>
                                )}

                                {['ACCEPTED', 'DISPATCHED', 'COMPLETED', 'RETURN_PENDING', 'RETURNED'].includes(order.status) && (
                                  <button 
                                    onClick={() => setTrackingOrderId(isTracking ? null : order.id)}
                                    className={`py-2 px-4 rounded-xl text-xs font-bold active:scale-95 transition-all text-center border flex items-center gap-1.5 ${
                                      isTracking 
                                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-455' 
                                        : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300'
                                    }`}
                                  >
                                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                                    {isTracking ? 'Close Tracking' : 'Track Delivery'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {isTracking && (
                            <div className="mt-3 border-t border-slate-850/50 pt-5">
                              <OrderTrackingMap
                                orderId={order.id}
                                sellerName={order.sellerName}
                                sellerLatitude={order.sellerLatitude ?? 12.9716}
                                sellerLongitude={order.sellerLongitude ?? 77.5946}
                                buyerName={order.buyerName}
                                buyerLatitude={order.deliveryLatitude ?? 12.9816}
                                buyerLongitude={order.deliveryLongitude ?? 77.6046}
                                onClose={() => setTrackingOrderId(null)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* WALLET INTEGRATIONS PANEL */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Balance display & actions */}
                <div className="bg-[#0b0f19] border border-slate-800/80 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-sm">
                  <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-emerald-500/3 rounded-full blur-[4rem] pointer-events-none" />
                  
                  <div>
                    <span className="text-xs font-semibold text-[#64748b] uppercase tracking-widest block mb-2">Escrow Fund Balance</span>
                    <h3 className="text-4xl sm:text-5xl font-black text-emerald-450 tracking-tight font-mono">${walletBalance.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Secured buyer funds are locked during transit and only released to the Micro-sellers upon courier confirmation.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button 
                      onClick={() => setWalletActionOpen('deposit')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold p-3.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Deposit Funds
                    </button>
                    <button 
                      onClick={() => setWalletActionOpen('withdraw')}
                      className="bg-slate-950 border border-slate-800 hover:bg-slate-900/60 text-white font-bold p-3.5 rounded-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Payout Funds
                    </button>
                  </div>
                </div>

                {/* Wallet Transactions History Table */}
                <div className="lg:col-span-2 bg-[#0b0f19]/80 border border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-6">Secured Ledger Transactions</h3>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs">
                      <WalletIcon className="w-12 h-12 mx-auto mb-4 text-[#1e293b]/60" />
                      No wallet transactions have been recorded.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-2xl hover:border-slate-800 transition-colors">
                          <div className="flex items-center gap-4">
                            {tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? (
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 flex-shrink-0">
                                <ArrowUpRight className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455 flex-shrink-0">
                                <ArrowDownLeft className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-white text-xs leading-snug">{tx.description || 'Adjustment'}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          
                          <span className={`font-mono font-bold text-xs ${
                            tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
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

        {/* ── MODAL: TOP-UP/WITHDRAWAL FORM ── */}
        <AnimatePresence>
          {walletActionOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
              >
                
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold tracking-tight text-white capitalize">
                    {walletActionOpen === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                  </h4>
                  <button 
                    onClick={() => setWalletActionOpen(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-[#64748b] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleWalletFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Amount ($ USD)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      className="w-full bg-[#050816] border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500 focus:outline-none text-xl"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#020617] font-bold p-3.5 rounded-xl text-center shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-xs uppercase tracking-wider mt-2"
                  >
                    {submitting ? 'Confirming Ledger Transaction...' : walletActionOpen === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                  </button>
                </form>

              </motion.div>
            </div>
          )}

          {/* ── MODAL: ORDER checkout CONFIRMation ── */}
          {checkoutListing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
              >
                
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Order Invoice Details
                  </h4>
                  <button 
                    onClick={() => setCheckoutListing(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-[#64748b] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-5 text-xs">
                  
                  {/* Energy details recap */}
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-2 font-medium">
                    <div className="flex justify-between text-slate-400">
                      <span>Usable Cell Model:</span>
                      <span className="text-white font-semibold">{checkoutListing.battery.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Agreement Tariff:</span>
                      <span className="text-white font-mono">${checkoutListing.pricePerKwh.toFixed(2)}/kWh</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pack capacity:</span>
                      <span className="text-white font-mono">{checkoutListing.battery.currentChargeKwh} kWh</span>
                    </div>
                  </div>

                  {/* Calculations row */}
                  <div className="p-4 border-y border-slate-850/60 space-y-2.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Tariff Subtotal:</span>
                      <span className="font-mono text-white text-xs font-semibold">${(checkoutListing.pricePerKwh * checkoutListing.battery.currentChargeKwh).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Dynamic Logistics Fee:</span>
                      <span className="font-mono text-white text-xs font-semibold">
                        ${(2.0 + getDistanceKm(simLat, simLon, checkoutListing.latitude || 12.9716, checkoutListing.longitude || 77.5946) * 0.5).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-white pt-2.5 border-t border-dashed border-slate-800">
                      <span>Total Invoice Due (Locked in Escrow):</span>
                      <span className="font-mono text-[#10b981] text-base">
                        ${((checkoutListing.pricePerKwh * checkoutListing.battery.currentChargeKwh) + (2.0 + getDistanceKm(simLat, simLon, checkoutListing.latitude || 12.9716, checkoutListing.longitude || 77.5946) * 0.5)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Delivery address input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Delivery Physical Address</label>
                    <textarea 
                      required
                      placeholder="e.g. 562, Elite Park Lane, Outer Ring Road, Bangalore"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Submit / Checkout release buttons */}
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#10b981] hover:bg-emerald-450 disabled:opacity-50 text-[#020617] font-bold p-3.5 rounded-xl text-center shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-xs uppercase tracking-wider"
                  >
                    {submitting ? 'Confirming Escrow Ledger...' : 'Rent Cell Pack and lock funds'}
                  </button>

                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
};

export default BuyerDashboard;
