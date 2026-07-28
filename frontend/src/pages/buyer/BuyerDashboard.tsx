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
  Trash2,
  LogOut,
  Filter,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import listingService from '../../services/listingService';
import type { EnergyListing, MarketplaceSearchRequest } from '../../services/listingService';
import orderService from '../../services/orderService';
import type { Order, OrderRequest } from '../../services/orderService';
import authService from '../../services/authService';

const BuyerDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Tab states
  const [activeTab, setActiveTab] = useState<'browse' | 'orders' | 'wallet'>('browse');

  // Backend data
  const [listings, setListings] = useState<EnergyListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Buyer GPS Coordinates (Default: Bengaluru center 12.9716, 77.5946)
  const [buyerLat, setBuyerLat] = useState<number>(12.9716);
  const [buyerLon, setBuyerLon] = useState<number>(77.5946);
  const [buyerAddress, setBuyerAddress] = useState<string>('Koramangala, Bengaluru');

  // Professional Search Filters State (NO SLIDERS)
  const [filters, setFilters] = useState<MarketplaceSearchRequest>({
    query: '',
    batteryType: '',
    minCapacityKwh: undefined,
    maxCapacityKwh: undefined,
    minPricePerKwh: undefined,
    maxPricePerKwh: undefined,
    minHealthPct: undefined,
    deliveryAvailable: false,
    maxDeliveryDistanceKm: undefined,
    sortBy: 'newest',
  });

  // UI Status
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout modal state
  const [checkoutListing, setCheckoutListing] = useState<EnergyListing | null>(null);
  const [requestedKwh, setRequestedKwh] = useState<number>(2.0);
  const [deliveryRequired, setDeliveryRequired] = useState<boolean>(true);
  const [checkoutAddress, setCheckoutAddress] = useState<string>('');

  // Wallet topup modal
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
        authService.getTransactions(),
      ]);
      setListings(pubListings);
      setOrders(myOrders);
      setWalletBalance(balanceData.balance);
      setTransactions(txList);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error syncing data with marketplace.');
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

  // Haversine Formula for distance calculation
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Detect Buyer Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      triggerToast('error', 'Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuyerLat(pos.coords.latitude);
        setBuyerLon(pos.coords.longitude);
        setBuyerAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`);
        triggerToast('success', 'Buyer coordinates updated via Geolocation.');
      },
      () => triggerToast('error', 'Failed to get location.'),
      { enableHighAccuracy: true }
    );
  };

  // Filter listings on frontend
  const filteredListings = listings.filter((l) => {
    // 1. Text Search Query
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchName = l.batteryName.toLowerCase().includes(q);
      const matchSeller = l.sellerName.toLowerCase().includes(q);
      const matchCity = (l.sellerCity || '').toLowerCase().includes(q);
      const matchDesc = (l.description || '').toLowerCase().includes(q);
      if (!matchName && !matchSeller && !matchCity && !matchDesc) return false;
    }

    // 2. Battery Type
    if (filters.batteryType && l.batteryType.toLowerCase() !== filters.batteryType.toLowerCase()) {
      return false;
    }

    // 3. Capacity Range
    if (filters.minCapacityKwh !== undefined && l.capacityKwh < filters.minCapacityKwh) return false;
    if (filters.maxCapacityKwh !== undefined && l.capacityKwh > filters.maxCapacityKwh) return false;

    // 4. Price Range
    if (filters.minPricePerKwh !== undefined && l.pricePerKwh < filters.minPricePerKwh) return false;
    if (filters.maxPricePerKwh !== undefined && l.pricePerKwh > filters.maxPricePerKwh) return false;

    // 5. Health Rating
    if (filters.minHealthPct !== undefined && l.healthRating < filters.minHealthPct) return false;

    // 6. Delivery Filter & Distance Check
    const dist = calculateDistanceKm(buyerLat, buyerLon, l.sellerLatitude || 12.9716, l.sellerLongitude || 77.5946);
    if (filters.deliveryAvailable && (!l.deliveryAvailable || (l.maxDeliveryDistanceKm > 0 && dist > l.maxDeliveryDistanceKm))) {
      return false;
    }
    if (filters.maxDeliveryDistanceKm !== undefined && dist > filters.maxDeliveryDistanceKm) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'price_asc') return a.pricePerKwh - b.pricePerKwh;
    if (filters.sortBy === 'price_desc') return b.pricePerKwh - a.pricePerKwh;
    if (filters.sortBy === 'capacity_desc') return b.capacityKwh - a.capacityKwh;
    if (filters.sortBy === 'health_desc') return b.healthRating - a.healthRating;
    return b.id - a.id; // newest
  });

  const handleResetFilters = () => {
    setFilters({
      query: '',
      batteryType: '',
      minCapacityKwh: undefined,
      maxCapacityKwh: undefined,
      minPricePerKwh: undefined,
      maxPricePerKwh: undefined,
      minHealthPct: undefined,
      deliveryAvailable: false,
      maxDeliveryDistanceKm: undefined,
      sortBy: 'newest',
    });
  };

  // --- Rent / Checkout Handlers ---
  const handleOpenRentCheckout = (listing: EnergyListing) => {
    const dist = calculateDistanceKm(buyerLat, buyerLon, listing.sellerLatitude || 12.9716, listing.sellerLongitude || 77.5946);
    if (listing.deliveryAvailable && listing.maxDeliveryDistanceKm > 0 && dist > listing.maxDeliveryDistanceKm) {
      triggerToast('error', `Seller delivers only up to ${listing.maxDeliveryDistanceKm} km. You are ${dist} km away.`);
      return;
    }
    setCheckoutListing(listing);
    setRequestedKwh(listing.minPurchaseKwh || 1.0);
    setDeliveryRequired(listing.deliveryAvailable);
    setCheckoutAddress(buyerAddress);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutListing) return;

    if (requestedKwh <= 0) {
      triggerToast('error', 'Please enter a valid energy quantity.');
      return;
    }
    if (checkoutListing.minPurchaseKwh && requestedKwh < checkoutListing.minPurchaseKwh) {
      triggerToast('error', `Minimum purchase requirement is ${checkoutListing.minPurchaseKwh} kWh.`);
      return;
    }
    if (requestedKwh > checkoutListing.availableEnergyKwh) {
      triggerToast('error', `Requested energy exceeds available energy of ${checkoutListing.availableEnergyKwh} kWh.`);
      return;
    }

    const dist = calculateDistanceKm(buyerLat, buyerLon, checkoutListing.sellerLatitude || 12.9716, checkoutListing.sellerLongitude || 77.5946);
    const energyCost = checkoutListing.pricePerKwh * requestedKwh;
    const deliveryCharge = (deliveryRequired && checkoutListing.deliveryChargePerKm) ? dist * checkoutListing.deliveryChargePerKm : 0;
    const totalOrderCost = energyCost + deliveryCharge;

    if (walletBalance < totalOrderCost) {
      triggerToast('error', `Insufficient wallet balance. Total amount required is ₹${totalOrderCost.toFixed(2)}, but your wallet has ₹${walletBalance.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload: OrderRequest = {
        listingId: checkoutListing.id,
        energyAmountKwh: requestedKwh,
        deliveryRequired,
        buyerAddress: checkoutAddress,
        buyerLatitude: buyerLat,
        buyerLongitude: buyerLon,
      };

      await orderService.createOrder(payload);
      triggerToast('success', 'Order created successfully! Escrow payment locked in INR.');
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
    if (!window.confirm('Cancel this order? Escrow funds will be refunded to your wallet.')) return;
    try {
      setLoading(true);
      await orderService.cancelOrder(orderId);
      triggerToast('success', 'Order cancelled and funds refunded.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to cancel order.');
      setLoading(false);
    }
  };

  // Wallet Handlers
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(walletAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerToast('error', 'Please enter a valid amount in ₹.');
      return;
    }

    try {
      setSubmitting(true);
      if (walletActionOpen === 'deposit') {
        await authService.deposit(amountNum);
        triggerToast('success', `Deposited ₹${amountNum.toFixed(2)} successfully!`);
      } else {
        await authService.withdraw(amountNum);
        triggerToast('success', `Withdrew ₹${amountNum.toFixed(2)} successfully!`);
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
    (o) => o.status === 'PENDING' || o.status === 'ACCEPTED'
  ).length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex">
      {/* Radial Background Glimmers */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[35rem] h-[35rem] bg-teal-500/5 rounded-full blur-[8rem] pointer-events-none" />

      {/* SIDEBAR PANEL */}
      <aside className="w-68 min-h-screen bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between fixed top-0 left-0 bottom-0 z-30">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-slate-950 w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block text-white">PowerShare</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Buyer Marketplace</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 mt-4">
            {[
              { id: 'browse', label: 'Explore Marketplace', icon: Globe },
              { id: 'orders', label: 'My Energy Orders', icon: BatteryCharging, badge: orders.length },
              { id: 'wallet', label: 'Escrow Wallet (₹)', icon: WalletIcon },
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
                      isSelected ? 'bg-emerald-500/20 text-emerald-455' : 'bg-slate-800 text-slate-400'
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

      {/* MAIN CONTENT WORKSPACE */}
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
                <X className="w-4 h-4 text-emerald-400 hover:text-emerald-300" />
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
                <X className="w-4 h-4 text-rose-400 hover:text-rose-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Buyer Marketplace</h1>
            <p className="text-slate-400 text-sm mt-1">Locate active battery cells, compare INR pricing, and order clean energy directly.</p>
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

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Orders</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{activeOrdersCount}</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Energy Bought</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{totalKwhPurchased.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kWh</span></p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Wallet Ledger</span>
            <p className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">₹{walletBalance.toFixed(2)}</p>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Marketplace Listings</span>
            <p className="text-2xl font-bold tracking-tight text-white font-mono">{filteredListings.length} <span className="text-xs text-slate-500 font-normal">matched</span></p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/10 backdrop-blur-sm border border-slate-800/80 rounded-3xl">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Querying regional energy listings...</p>
          </div>
        ) : (
          <div>
            {/* BROWSE MARKETPLACE TAB */}
            {activeTab === 'browse' && (
              <div className="space-y-8">
                {/* BUYER LOCATION HEADER BAR */}
                <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Buyer GPS Location</span>
                      <p className="text-xs font-semibold text-white truncate max-w-md">{buyerAddress}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDetectLocation}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                    Detect Current Location
                  </button>
                </div>

                {/* PROFESSIONAL SEARCH FILTER PANEL (NO SLIDERS) */}
                <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-400" /> Marketplace Search Filters
                    </h3>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                    </button>
                  </div>

                  {/* Search Query Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search battery name, seller name, city, or description..."
                      value={filters.query}
                      onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Filter Grid Controls (Professional Form Inputs) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Battery Type Dropdown */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Battery Type</label>
                      <select
                        value={filters.batteryType}
                        onChange={(e) => setFilters({ ...filters, batteryType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">All Battery Chemistries</option>
                        <option value="LiFePO4">LiFePO4</option>
                        <option value="Lithium-ion">Lithium-ion</option>
                        <option value="Solid State">Solid State</option>
                        <option value="Lead Acid">Lead Acid</option>
                      </select>
                    </div>

                    {/* Price Range Inputs (₹) */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Price per kWh (₹)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={filters.minPricePerKwh ?? ''}
                          onChange={(e) => setFilters({ ...filters, minPricePerKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="Max ₹"
                          value={filters.maxPricePerKwh ?? ''}
                          onChange={(e) => setFilters({ ...filters, maxPricePerKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Capacity Range Inputs (kWh) */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Capacity (kWh)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min kWh"
                          value={filters.minCapacityKwh ?? ''}
                          onChange={(e) => setFilters({ ...filters, minCapacityKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="Max kWh"
                          value={filters.maxCapacityKwh ?? ''}
                          onChange={(e) => setFilters({ ...filters, maxCapacityKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Sort By Dropdown */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Sort Results By</label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="newest">Recently Added</option>
                        <option value="price_asc">Lowest Price per kWh</option>
                        <option value="price_desc">Highest Price per kWh</option>
                        <option value="capacity_desc">Highest Capacity</option>
                        <option value="health_desc">Highest Battery Health</option>
                      </select>
                    </div>
                  </div>

                  {/* Secondary Filter Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-850 text-xs">
                    <div className="flex items-center gap-6">
                      {/* Delivery Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={filters.deliveryAvailable}
                          onChange={(e) => setFilters({ ...filters, deliveryAvailable: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                        />
                        Delivery Available Only
                      </label>

                      {/* Min Health Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Min Health %:</span>
                        <input
                          type="number"
                          placeholder="e.g. 90"
                          value={filters.minHealthPct ?? ''}
                          onChange={(e) => setFilters({ ...filters, minHealthPct: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono">
                      Showing {filteredListings.length} of {listings.length} listings
                    </span>
                  </div>
                </div>

                {/* LISTINGS GRID */}
                {filteredListings.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-md font-bold mb-1 text-white">No Energy Batteries Found</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
                      No listings match your current filters. Try resetting search criteria or adjusting location.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => {
                      const dist = calculateDistanceKm(buyerLat, buyerLon, listing.sellerLatitude || 12.9716, listing.sellerLongitude || 77.5946);
                      const isTooFar = listing.deliveryAvailable && listing.maxDeliveryDistanceKm > 0 && dist > listing.maxDeliveryDistanceKm;

                      return (
                        <div
                          key={listing.id}
                          className="bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all flex flex-col justify-between relative group shadow-sm"
                        >
                          <div>
                            {/* Image */}
                            {listing.imageUrl ? (
                              <img
                                src={listing.imageUrl}
                                alt={listing.batteryName}
                                className="w-full h-40 object-cover rounded-2xl mb-4 border border-slate-850"
                              />
                            ) : (
                              <div className="w-full h-40 bg-slate-950 border border-slate-850 rounded-2xl mb-4 flex items-center justify-center text-slate-700">
                                <BatteryCharging className="w-12 h-12" />
                              </div>
                            )}

                            {/* Header info */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-wider block w-max mb-1">
                                  {listing.batteryType}
                                </span>
                                <h3 className="font-extrabold text-white text-base tracking-tight">{listing.batteryName}</h3>
                              </div>
                              <span className="text-emerald-400 font-mono font-black text-lg">₹{listing.pricePerKwh.toFixed(2)}<span className="text-xs font-normal text-slate-500">/kWh</span></span>
                            </div>

                            {/* Distance Tag */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl border flex items-center gap-1 ${
                                isTooFar
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              }`}>
                                <Navigation className="w-3 h-3 rotate-45" />
                                {dist} km away
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">
                                Location: {listing.sellerCity || listing.sellerArea || 'Local Seller'}
                              </span>
                            </div>

                            {/* Battery Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-850 my-3 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 font-semibold block">Usable Energy</span>
                                <span className="font-bold text-emerald-400 font-mono">{listing.availableEnergyKwh} kWh</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-semibold block">Gross Capacity</span>
                                <span className="font-bold text-white font-mono">{listing.capacityKwh} kWh</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-semibold block">Health Rating</span>
                                <span className="font-bold text-white font-mono">{listing.healthRating}% SOH</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-semibold block">Status</span>
                                <span className="font-bold text-amber-400">{listing.batteryStatus}</span>
                              </div>
                            </div>

                            {/* Delivery Info */}
                            <div className="space-y-1 text-xs text-slate-400 mb-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                              <div className="flex justify-between text-[11px]">
                                <span>Delivery Available:</span>
                                <span className={listing.deliveryAvailable ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                  {listing.deliveryAvailable ? `Yes (max ${listing.maxDeliveryDistanceKm} km)` : 'Pickup Only'}
                                </span>
                              </div>
                              {listing.minPurchaseKwh && (
                                <div className="flex justify-between text-[11px]">
                                  <span>Min Purchase:</span>
                                  <span className="font-mono text-white">{listing.minPurchaseKwh} kWh</span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {listing.description && (
                              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                                {listing.description}
                              </p>
                            )}

                            {/* Seller profile pill */}
                            <div className="flex items-center gap-2 mb-4 bg-slate-950 p-2 rounded-xl border border-slate-850">
                              <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-[10px] font-black text-emerald-400 uppercase">
                                {listing.sellerName[0]}
                              </span>
                              <span className="text-xs text-slate-400">Seller: <b className="text-emerald-400 font-semibold">{listing.sellerName}</b></span>
                            </div>
                          </div>

                          <button
                            disabled={isTooFar}
                            onClick={() => handleOpenRentCheckout(listing)}
                            className={`w-full font-bold p-3.5 text-xs tracking-wide uppercase rounded-xl transition-all duration-200 active:scale-95 ${
                              isTooFar
                                ? 'bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10'
                            }`}
                          >
                            {isTooFar ? 'Distance Exceeds Delivery Limit' : 'Buy Energy'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MY ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-6">Your Energy Purchases & Orders</h3>

                {orders.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <BatteryCharging className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Orders Found</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                      Explore the marketplace to order clean stored energy.
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-[#0b0f19] border border-slate-850 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">Order #{order.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              order.status === 'PENDING'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : order.status === 'ACCEPTED'
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                : order.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-white text-lg">{order.batteryName}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Seller: <b className="text-white">{order.sellerName}</b></p>
                          {order.sellerAddressSnapshot && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              Seller Address: {order.sellerAddressSnapshot}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-6 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-850">
                            <div>
                              <span className="text-slate-500">Purchased Energy</span>
                              <p className="font-bold text-white font-mono">{order.energyAmountKwh} kWh</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Rate (INR)</span>
                              <p className="font-bold text-emerald-400 font-mono">₹{order.pricePerKwh.toFixed(2)}/kWh</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Delivery Fee</span>
                              <p className="font-bold text-white font-mono">₹{order.deliveryFee.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between border-t lg:border-t-0 border-slate-850 pt-4 lg:pt-0 gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Amount Paid</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono">₹{order.totalAmount.toFixed(2)}</p>
                          </div>

                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="border border-slate-800 hover:border-rose-900 bg-slate-950 text-rose-400 py-2 px-4 rounded-xl text-xs font-bold hover:bg-rose-950/20 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ESCROW WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-[#0b0f19] border border-slate-800 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                  <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-emerald-500/5 rounded-full blur-[4rem] pointer-events-none" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Escrow Fund Balance</span>
                    <h3 className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight font-mono">₹{walletBalance.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Secured buyer funds are locked during transit and only released to sellers upon order completion.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                      onClick={() => setWalletActionOpen('deposit')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Deposit Funds
                    </button>
                    <button
                      onClick={() => setWalletActionOpen('withdraw')}
                      className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white font-bold p-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Payout Funds
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6">Secured Ledger Transactions</h3>
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No recent ledger entries found.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                          <div className="flex items-center gap-3">
                            {tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                                <ArrowDownLeft className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-white">{tx.description || 'Transaction'}</p>
                              <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${
                            tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.transactionType === 'DEPOSIT' || tx.transactionType === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
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

        {/* --- CHECKOUT / BUY MODAL (CUSTOM KWH SELECTION) --- */}
        <AnimatePresence>
          {checkoutListing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-white text-lg">Checkout Energy Order</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{checkoutListing.batteryName} ({checkoutListing.batteryType})</p>
                  </div>
                  <button onClick={() => setCheckoutListing(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Quantity selector */}
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">
                      Required Energy Amount (kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={checkoutListing.minPurchaseKwh || 0.5}
                      max={checkoutListing.availableEnergyKwh}
                      required
                      value={requestedKwh}
                      onChange={(e) => setRequestedKwh(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Available: {checkoutListing.availableEnergyKwh} kWh | Min Purchase: {checkoutListing.minPurchaseKwh || 1} kWh
                    </span>
                  </div>

                  {/* Delivery checkbox */}
                  {checkoutListing.deliveryAvailable && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliveryRequired}
                          onChange={(e) => setDeliveryRequired(e.target.checked)}
                          className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-800 focus:ring-0"
                        />
                        Require Delivery to Address (+₹{((calculateDistanceKm(buyerLat, buyerLon, checkoutListing.sellerLatitude || 12.9716, checkoutListing.sellerLongitude || 77.5946)) * (checkoutListing.deliveryChargePerKm || 0)).toFixed(2)})
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      placeholder="Enter full delivery address"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Calculation summary breakdown */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Energy Cost ({requestedKwh} kWh × ₹{checkoutListing.pricePerKwh}):</span>
                      <span>₹{(requestedKwh * checkoutListing.pricePerKwh).toFixed(2)}</span>
                    </div>
                    {deliveryRequired && (
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery Fee ({calculateDistanceKm(buyerLat, buyerLon, checkoutListing.sellerLatitude || 12.9716, checkoutListing.sellerLongitude || 77.5946)} km):</span>
                        <span>₹{(calculateDistanceKm(buyerLat, buyerLon, checkoutListing.sellerLatitude || 12.9716, checkoutListing.sellerLongitude || 77.5946) * (checkoutListing.deliveryChargePerKm || 0)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-emerald-400 pt-2 border-t border-slate-800 font-sans">
                      <span>Total Amount:</span>
                      <span className="font-mono">₹{((requestedKwh * checkoutListing.pricePerKwh) + (deliveryRequired ? calculateDistanceKm(buyerLat, buyerLon, checkoutListing.sellerLatitude || 12.9716, checkoutListing.sellerLongitude || 77.5946) * (checkoutListing.deliveryChargePerKm || 0) : 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Locking Escrow Order...' : 'Confirm Order & Pay Escrow (INR)'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DEPOSIT / WITHDRAW MODAL */}
        <AnimatePresence>
          {walletActionOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-extrabold text-white text-lg capitalize">{walletActionOpen} Wallet Funds</h3>
                  <button onClick={() => setWalletActionOpen(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleWalletSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1.5">Amount in ₹ (INR)</label>
                    <input
                      type="number"
                      step="100"
                      min="1"
                      required
                      placeholder="e.g. 1000"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wide transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : `Confirm ${walletActionOpen}`}
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
