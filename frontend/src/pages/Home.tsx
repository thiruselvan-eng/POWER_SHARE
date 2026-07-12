// src/pages/Home.tsx
// Public landing page with premium dark luxury design, Stripe-like hero glow, and refined typography.

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  MapPin,
  TrendingUp,
  Shield,
  Sun,
  Star,
  ArrowRight,
  BatteryCharging,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';

const features = [
  { icon: Sun, title: 'Solar-Powered Clean Energy', description: 'PowerShare inventory is charged entirely via solar, wind, or other eco-friendly local sources.' },
  { icon: MapPin, title: 'Proximity GPS Search', description: 'Zero in on nearby energy cells within your current delivery radius using hyper-local matching.' },
  { icon: Zap, title: 'On-Demand Distribution', description: 'Rent charged battery packs and have them dispatched to your location by courier in hours.' },
  { icon: BatteryCharging, title: 'Circular Exchange Loop', description: 'Trade depleted battery packs for fully charged ones seamlessly, keeping your site online.' },
  { icon: TrendingUp, title: 'Dynamic Tariff Pricing', description: 'Algorithmic rate suggestions based on battery state-of-health, capacity, and current demand.' },
  { icon: Shield, title: 'Escrow Payout Protection', description: 'Funds remain locked securely in smart escrow accounts until secure delivery confirmation.' },
];

const steps = [
  { n: '01', title: 'Register Battery Pack', description: 'Solar owners index battery pack profiles with capacity, serial, and chemistry diagnostic specifications.' },
  { n: '02', title: 'Discover Local Listings', description: 'Buyers query the grid map dynamically by simulated GPS coords, current tariff, and range.' },
  { n: '03', title: 'Courier Dispatch', description: 'Logistics partners claim orders, pick up fully charged units, and broadcast real-time GPS.' },
  { n: '04', title: 'Circular Recycle Swap', description: 'Receive your pack, run escrow completion, and return empty batteries to balance the loop.' },
];

const stats = [
  { label: 'Energy Exchanged', value: '1.4M+ kWh' },
  { label: 'Active Nodes', value: '9,200+' },
  { label: 'Logistics Courier Network', value: '450+' },
  { label: 'CO₂ Emissions Prevented', value: '4.2k Tons' },
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-white relative">
      
      {/* Background Orbs & Radial Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[50rem] bg-gradient-to-b from-emerald-500/10 via-blue-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30rem] -left-40 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 -right-40 w-[50rem] h-[50rem] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Overlay decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ── Header Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-900 bg-[#020617]/70 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-[#020617] w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-350">
              PowerShare
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how" className="hover:text-white transition-colors">Process</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900/50">
              Sign In
            </Link>
            <Link to="/register" className="relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#020617] font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section className="pt-36 pb-24 px-6 relative max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wide">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            De-centralized Energy Logistics Network
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] text-white">
            Peer-to-Peer
            <br />
            <span className="bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-300">
              Clean Energy Grid.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            PowerShare facilitates standard physical battery pack exchanges. Monitored solar collectors link directly with buyers needing decentralized grid support.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-[#020617] font-extrabold px-8 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all group"
            >
              Start Trading Energy
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#how" 
              className="w-full sm:w-auto h-12 flex items-center justify-center gap-2 text-slate-350 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-950/20 backdrop-blur-sm px-8 rounded-xl font-semibold transition-all active:scale-95"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Floating Cards (Mock interactive indicators) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 flex justify-center gap-4 flex-wrap max-w-5xl mx-auto"
        >
          {[
            { icon: Layers, label: 'Solar Charged', sub: 'Active battery packs' },
            { icon: Cpu, label: 'State-of-Health Diagnostic', sub: 'Real-time telemetry' },
            { icon: MapPin, label: 'Proximity GPS Range', sub: 'Autonomous route pools' },
            { icon: Shield, label: 'Escrow Vault Secure', sub: 'Total payout security' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 text-left min-w-[240px] hover:border-emerald-500/25 hover:bg-slate-900/60 transition-all duration-350 backdrop-blur-sm"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500/15 to-emerald-400/5 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold tracking-tight">{card.label}</p>
                  <p className="text-[#64748b] text-[11px] font-semibold mt-0.5">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Stats Section ── */}
      <section id="stats" className="py-20 px-6 border-y border-slate-900 bg-slate-900/10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-1.5"
            >
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono tracking-tight">
                {s.value}
              </p>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Process: How it works ── */}
      <section id="how" className="py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-3">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Protocol Lifecycle</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">How PowerShare Balances Clean Energy</h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Four simple phases connecting micro-generators with energy buyers and transport couriers securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 relative hover:border-slate-700/80 transition-colors backdrop-blur-sm group"
            >
              <span className="text-emerald-500/10 group-hover:text-emerald-500/20 text-6xl font-black absolute top-4 right-6 transition-colors font-mono">{step.n}</span>
              <h3 className="text-white font-extrabold text-lg mt-10 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features List ── */}
      <section id="features" className="py-28 px-6 bg-slate-900/20 border-t border-slate-900 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-3">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest">Core Infrastructure</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">End-To-End Renewable Logistics</h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              Packed with premium dashboard utilities, automated escrow ledgers, and live telemetry integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 hover:border-emerald-500/20 transition-all group hover:bg-slate-900/60"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4 transition-colors text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-white text-base font-extrabold mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Call To Action (CTA) ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            Ready to secure your <span className="bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">energy independence?</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Unlock new revenues as a solar owner, or obtain portable renewable power. Register your PowerShare node free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link to="/register" className="h-12 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-[#020617] font-extrabold px-8 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all">
              Join PowerShare Network
            </Link>
            <Link to="/login" className="h-12 flex items-center justify-center border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 text-slate-350 hover:text-white font-bold px-8 rounded-xl transition-all active:scale-95">
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900/80 bg-[#020617]/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="text-[#020617] w-4 h-4 fill-current" />
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">PowerShare Grid</span>
          </div>
          <p className="text-slate-600 text-xs font-semibold">
            © {new Date().getFullYear()} PowerShare Inc. All rights reserved. Regional peer exchange network.
          </p>
          <div className="flex gap-6 text-xs text-slate-500 font-semibold">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Charter</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Exchange</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Logistics API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
