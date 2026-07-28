import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, Trash2, Edit2, Battery as BatteryIcon,
  BatteryCharging, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Wallet as WalletIcon, Globe, MapPin, Loader2, Sparkles, RefreshCw, X, LogOut, CheckCircle2, DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import listingService from '../../services/listingService';
import type { EnergyListing, EnergyListingRequest } from '../../services/listingService';
import orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';
import authService from '../../services/authService';
import MapLocationPicker from '../../components/MapLocationPicker';
import type { LocationData } from '../../components/MapLocationPicker';

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'wallet'>('listings');

  // Data States
  const [listings, setListings] = useState<EnergyListing[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [listingModalOpen, setListingModalOpen] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<EnergyListing | null>(null);

  const [walletActionOpen, setWalletActionOpen] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>('');

  // Form State for Unified Listing
  const [form, setForm] = useState<EnergyListingRequest>({
    batteryName: '',
    batteryType: 'LiFePO4',
    capacityKwh: 10.0,
    availableEnergyKwh: 8.5,
    healthRating: 95,
    batteryStatus: 'AVAILABLE',
    serialNumber: '',
    imageUrl: '',

    pricePerKwh: 12.50,
    minPurchaseKwh: 1.0,

    sellerLatitude: 12.9716,
    sellerLongitude: 77.5946,
    sellerAddress: 'MG Road, Indiranagar, Bengaluru, Karnataka',
    sellerArea: 'Indiranagar',
    sellerCity: 'Bengaluru',
    sellerState: 'Karnataka',
    sellerPincode: '560038',

    deliveryAvailable: true,
    maxDeliveryDistanceKm: 15,
    deliveryChargePerKm: 5.0,
    estimatedDeliveryTime: '1-2 Hours',

    availableFrom: new Date().toISOString().split('T')[0],
    availableUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],

    description: '',
    sellerContact: (user as any)?.phone || '',
    active: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [listList, orderList, balanceData, txList] = await Promise.all([
        listingService.getSellerListings(),
        orderService.getSellerOrders(),
        authService.getWalletBalance(),
        authService.getTransactions(),
      ]);
      setListings(listList);
      setSellerOrders(orderList);
      setWalletBalance(balanceData.balance);
      setTransactions(txList);
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

  const triggerToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // --- Handlers ---

  const handleOpenAddListing = () => {
    setEditingListing(null);
    setForm({
      batteryName: '',
      batteryType: 'LiFePO4',
      capacityKwh: 10.0,
      availableEnergyKwh: 8.5,
      healthRating: 95,
      batteryStatus: 'AVAILABLE',
      serialNumber: 'PS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      imageUrl: '',

      pricePerKwh: 12.50,
      minPurchaseKwh: 1.0,

      sellerLatitude: 12.9716,
      sellerLongitude: 77.5946,
      sellerAddress: 'MG Road, Indiranagar, Bengaluru, Karnataka',
      sellerArea: 'Indiranagar',
      sellerCity: 'Bengaluru',
      sellerState: 'Karnataka',
      sellerPincode: '560038',

      deliveryAvailable: true,
      maxDeliveryDistanceKm: 15,
      deliveryChargePerKm: 5.0,
      estimatedDeliveryTime: '1-2 Hours',

      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],

      description: '',
      sellerContact: (user as any)?.phone || '',
      active: true,
    });
    setListingModalOpen(true);
  };

  const handleOpenEditListing = (listing: EnergyListing) => {
    setEditingListing(listing);
    setForm({
      batteryName: listing.batteryName,
      batteryType: listing.batteryType,
      capacityKwh: listing.capacityKwh,
      availableEnergyKwh: listing.availableEnergyKwh,
      healthRating: listing.healthRating,
      batteryStatus: listing.batteryStatus,
      serialNumber: listing.serialNumber,
      imageUrl: listing.imageUrl || '',

      pricePerKwh: listing.pricePerKwh,
      minPurchaseKwh: listing.minPurchaseKwh,

      sellerLatitude: listing.sellerLatitude || 12.9716,
      sellerLongitude: listing.sellerLongitude || 77.5946,
      sellerAddress: listing.sellerAddress || '',
      sellerArea: listing.sellerArea || '',
      sellerCity: listing.sellerCity || '',
      sellerState: listing.sellerState || '',
      sellerPincode: listing.sellerPincode || '',

      deliveryAvailable: listing.deliveryAvailable,
      maxDeliveryDistanceKm: listing.maxDeliveryDistanceKm,
      deliveryChargePerKm: listing.deliveryChargePerKm,
      estimatedDeliveryTime: listing.estimatedDeliveryTime || '',

      availableFrom: listing.availableFrom || '',
      availableUntil: listing.availableUntil || '',

      description: listing.description || '',
      sellerContact: listing.sellerContact || '',
      active: listing.active,
    });
    setListingModalOpen(true);
  };

  const handleLocationSelect = (data: LocationData) => {
    setForm((prev) => ({
      ...prev,
      sellerLatitude: data.latitude,
      sellerLongitude: data.longitude,
      sellerAddress: data.fullAddress,
      sellerArea: data.area,
      sellerCity: data.city,
      sellerState: data.state,
      sellerPincode: data.pincode,
    }));
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.availableEnergyKwh > form.capacityKwh) {
      triggerToast('error', 'Available energy cannot exceed maximum capacity.');
      return;
    }
    if (form.minPurchaseKwh && form.minPurchaseKwh > form.availableEnergyKwh) {
      triggerToast('error', 'Minimum purchase quantity cannot exceed available energy.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingListing) {
        await listingService.updateListing(editingListing.id, form);
        triggerToast('success', 'Battery listing updated successfully!');
      } else {
        await listingService.createListing(form);
        triggerToast('success', 'New battery listing published to marketplace!');
      }
      setListingModalOpen(false);
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Delete this listing? It will remove your offer from the marketplace.')) return;
    try {
      setLoading(true);
      await listingService.deleteListing(id);
      triggerToast('success', 'Listing deleted.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to delete listing.');
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, status: Order['status']) => {
    try {
      setLoading(true);
      await orderService.updateSellerOrderStatus(orderId, status);
      triggerToast('success', `Order status updated to ${status}.`);
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to update order.');
      setLoading(false);
    }
  };

  // Wallet Deposit/Withdrawal
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
        triggerToast('success', `Deposited ₹${amountNum.toFixed(2)} to wallet!`);
      } else {
        await authService.withdraw(amountNum);
        triggerToast('success', `Withdrew ₹${amountNum.toFixed(2)} from wallet!`);
      }
      setWalletActionOpen(null);
      setWalletAmount('');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const totalAvailableEnergy = listings.reduce((acc, l) => acc + l.availableEnergyKwh, 0);
  const activeListingsCount = listings.filter((l) => l.active).length;
  const pendingOrdersCount = sellerOrders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans antialiased selection:bg-emerald-500 selection:text-[#020617]">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-teal-500/5 rounded-full blur-[8rem] pointer-events-none" />

      <div className="max-w-[85rem] mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Seller Control Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Seller Energy Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Publish battery energy offers, set map coordinates, and manage buyer orders.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                {user?.fullName?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <span className="text-xs text-slate-300 font-semibold truncate max-w-[140px]">{user?.fullName}</span>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 active:scale-95 transition-all text-slate-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-rose-900 hover:bg-rose-500/5 hover:text-rose-400 text-slate-400 px-4 py-3 rounded-xl active:scale-95 transition-all text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>

            <button
              onClick={handleOpenAddListing}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 font-bold text-slate-950 px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-xs uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" /> Create Battery Listing
            </button>
          </div>
        </div>

        {/* Toaster / Alerts */}
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
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center justify-between"
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Available Energy</span>
            <p className="text-2xl font-bold tracking-tight text-white">{totalAvailableEnergy.toFixed(1)} <span className="text-sm font-normal text-slate-400">kWh</span></p>
            <p className="text-xs text-slate-400 mt-1">{listings.length} listings in catalog</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Live Active Listings</span>
            <p className="text-2xl font-bold tracking-tight text-white">{activeListingsCount} <span className="text-sm font-normal text-slate-400">offers</span></p>
            <p className="text-xs text-emerald-400 mt-1">Visible to all buyers</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pending Orders</span>
            <p className="text-2xl font-bold tracking-tight text-amber-400">{pendingOrdersCount} <span className="text-sm font-normal text-slate-400">orders</span></p>
            <p className="text-xs text-slate-400 mt-1">Awaiting seller acceptance</p>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Wallet Earnings</span>
            <p className="text-2xl font-bold tracking-tight text-emerald-400">₹{walletBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Escrow secure ledger (INR)</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 mb-8 overflow-x-auto pb-1.5 scrollbar-thin">
          {[
            { id: 'listings', label: `My Battery Listings (${listings.length})`, icon: Globe },
            { id: 'orders', label: `Incoming Orders (${sellerOrders.length})`, icon: BatteryCharging, badge: pendingOrdersCount },
            { id: 'wallet', label: 'Earnings Wallet', icon: WalletIcon },
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab View Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-800/40 rounded-3xl bg-slate-900/10 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Syncing with platform energy grid...</p>
          </div>
        ) : (
          <div>
            {/* MY BATTERY LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div>
                {listings.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Battery Listings Created</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                      Add a battery listing to start selling clean stored energy to local buyers.
                    </p>
                    <button
                      onClick={handleOpenAddListing}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Create Your First Battery Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`bg-[#0b0f19] border rounded-3xl p-5 transition-all flex flex-col justify-between ${
                          listing.active ? 'border-slate-800 hover:border-emerald-500/30' : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <div>
                          {/* Image preview */}
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              alt={listing.batteryName}
                              className="w-full h-40 object-cover rounded-2xl mb-4 border border-slate-800"
                            />
                          ) : (
                            <div className="w-full h-40 bg-slate-950 border border-slate-850 rounded-2xl mb-4 flex items-center justify-center text-slate-700">
                              <BatteryIcon className="w-12 h-12" />
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-wider block w-max mb-1">
                                {listing.batteryType}
                              </span>
                              <h3 className="font-extrabold text-white text-lg tracking-tight">{listing.batteryName}</h3>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold text-base">₹{listing.pricePerKwh.toFixed(2)}/kWh</span>
                          </div>

                          {/* Battery Details */}
                          <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-850 my-3 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Capacity</span>
                              <span className="font-bold text-white">{listing.capacityKwh} kWh</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Available Energy</span>
                              <span className="font-bold text-emerald-400">{listing.availableEnergyKwh} kWh</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Health Rating</span>
                              <span className="font-bold text-white">{listing.healthRating}% SOH</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Status</span>
                              <span className="font-bold text-amber-400">{listing.batteryStatus}</span>
                            </div>
                          </div>

                          {/* Location & Delivery */}
                          <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-850">
                            <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="truncate">{listing.sellerAddress || `${listing.sellerCity}, ${listing.sellerState}`}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Delivery Offered:</span>
                              <span className={listing.deliveryAvailable ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                {listing.deliveryAvailable ? `Yes (max ${listing.maxDeliveryDistanceKm} km)` : 'Pickup Only'}
                              </span>
                            </div>
                            {listing.deliveryAvailable && (
                              <div className="flex justify-between text-[11px]">
                                <span>Delivery Fee:</span>
                                <span className="font-mono text-white">₹{listing.deliveryChargePerKm}/km</span>
                              </div>
                            )}
                          </div>

                          {listing.description && (
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                              {listing.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            listing.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-500'
                          }`}>
                            {listing.active ? 'Active on Marketplace' : 'Paused'}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditListing(listing)}
                              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="p-2 border border-slate-800 hover:border-rose-900 bg-slate-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INCOMING ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-6">Incoming Buyer Orders</h3>

                {sellerOrders.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    <BatteryCharging className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1 text-white">No Orders Received</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Orders placed by energy buyers will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerOrders.map((order) => (
                      <div key={order.id} className="bg-[#0b0f19] border border-slate-850 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                          <p className="text-xs text-slate-400 mt-1">Buyer: <b className="text-white">{order.buyerName}</b></p>
                          {order.buyerAddress && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              {order.buyerAddress}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-6 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-850">
                            <div>
                              <span className="text-slate-500">Requested Energy</span>
                              <p className="font-bold text-white font-mono">{order.energyAmountKwh} kWh</p>
                            </div>
                            <div>
                              <span className="text-slate-500">Price Rate</span>
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
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Escrow Value</span>
                            <p className="text-2xl font-black text-emerald-400 font-mono">₹{order.totalAmount.toFixed(2)}</p>
                          </div>

                          <div className="flex gap-2">
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'ACCEPTED')}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                                >
                                  Accept Order
                                </button>
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                                  className="bg-slate-950 border border-slate-800 hover:border-rose-900 text-rose-400 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {order.status === 'ACCEPTED' && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order.id, 'COMPLETED')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed & Release Funds
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-[#0b0f19] border border-slate-800 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                  <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-emerald-500/5 rounded-full blur-[4rem] pointer-events-none" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Escrow Fund Balance</span>
                    <h3 className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight font-mono">₹{walletBalance.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Earnings from completed energy sales are deposited directly into your platform wallet.
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
                      <ArrowDownLeft className="w-4 h-4" /> Withdraw Earnings
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6">Recent Ledger Transactions</h3>
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

        {/* --- UNIFIED BATTERY LISTING MODAL --- */}
        <AnimatePresence>
          {listingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      {editingListing ? 'Edit Battery Listing' : 'Publish New Battery Listing'}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Configure battery specifications, INR pricing rate, map location, and delivery terms.</p>
                  </div>
                  <button onClick={() => setListingModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleListingSubmit} className="space-y-6">
                  {/* SECTION 1: BASIC BATTERY INFO */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <BatteryIcon className="w-4 h-4" /> Section 1: Basic Battery Specifications
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Battery Name / Model *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tesla Powerwall 2"
                          value={form.batteryName}
                          onChange={(e) => setForm({ ...form, batteryName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Battery Chemistry / Type *</label>
                        <select
                          value={form.batteryType}
                          onChange={(e) => setForm({ ...form, batteryType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="LiFePO4">LiFePO4 (LFP)</option>
                          <option value="Lithium-ion">Lithium-ion (NMC)</option>
                          <option value="Solid State">Solid State</option>
                          <option value="Lead Acid">Lead Acid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Status *</label>
                        <select
                          value={form.batteryStatus}
                          onChange={(e) => setForm({ ...form, batteryStatus: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="CHARGING">CHARGING</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="SOLD_OUT">SOLD OUT</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Capacity (kWh) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={form.capacityKwh}
                          onChange={(e) => setForm({ ...form, capacityKwh: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Available Energy (kWh) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={form.availableEnergyKwh}
                          onChange={(e) => setForm({ ...form, availableEnergyKwh: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Health Rating (% SOH) *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={form.healthRating}
                          onChange={(e) => setForm({ ...form, healthRating: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Serial Number</label>
                        <input
                          type="text"
                          value={form.serialNumber}
                          onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                          placeholder="Auto-generated if empty"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PRICING (INR) */}
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Section 2: Pricing (INR ₹)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Price per kWh (₹) *</label>
                        <input
                          type="number"
                          step="0.50"
                          required
                          value={form.pricePerKwh}
                          onChange={(e) => setForm({ ...form, pricePerKwh: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Minimum Purchase Quantity (kWh)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={form.minPurchaseKwh}
                          onChange={(e) => setForm({ ...form, minPurchaseKwh: parseFloat(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex justify-between items-center">
                      <span>Total Potential Listing Value:</span>
                      <span className="font-bold font-mono text-sm">₹{(form.availableEnergyKwh * form.pricePerKwh).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* SECTION 3: MAP LOCATION SELECTION */}
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Section 3: Interactive Location Selection
                    </h4>

                    <MapLocationPicker
                      initialLat={form.sellerLatitude}
                      initialLng={form.sellerLongitude}
                      initialAddress={form.sellerAddress}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>

                  {/* SECTION 4: DELIVERY OPTIONS */}
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Section 4: Delivery Options
                    </h4>

                    <div className="flex items-center gap-3 mb-2">
                      <label className="text-xs text-slate-300 font-semibold">Delivery Available?</label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, deliveryAvailable: !form.deliveryAvailable })}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          form.deliveryAvailable
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {form.deliveryAvailable ? 'YES — Delivery Available' : 'NO — Buyer Pickup Only'}
                      </button>
                    </div>

                    {form.deliveryAvailable && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-300 font-semibold mb-1">Max Delivery Distance (km)</label>
                          <input
                            type="number"
                            value={form.maxDeliveryDistanceKm}
                            onChange={(e) => setForm({ ...form, maxDeliveryDistanceKm: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-300 font-semibold mb-1">Delivery Charge per km (₹)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={form.deliveryChargePerKm}
                            onChange={(e) => setForm({ ...form, deliveryChargePerKm: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-300 font-semibold mb-1">Estimated Delivery Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 1-2 Hours"
                            value={form.estimatedDeliveryTime}
                            onChange={(e) => setForm({ ...form, estimatedDeliveryTime: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 5: AVAILABILITY & ADDITIONAL INFO */}
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Section 5: Availability & Additional Info
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Available From</label>
                        <input
                          type="date"
                          value={form.availableFrom}
                          onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Available Until</label>
                        <input
                          type="date"
                          value={form.availableUntil}
                          onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Battery Image URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Seller Phone / Contact</label>
                        <input
                          type="text"
                          value={form.sellerContact}
                          onChange={(e) => setForm({ ...form, sellerContact: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details on battery condition, charging history, solar panel specs..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* MODAL ACTIONS */}
                  <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      onClick={() => setListingModalOpen(false)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingListing ? 'Update Listing' : 'Publish Listing'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- WALLET DEPOSIT/WITHDRAW MODAL --- */}
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
      </div>
    </div>
  );
};

export default SellerDashboard;
