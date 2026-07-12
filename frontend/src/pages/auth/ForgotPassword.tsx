// src/pages/auth/ForgotPassword.tsx
// Premium dark-mode forgot password page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    // TODO: call /api/auth/forgot-password once backend endpoint is added
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden group">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a55_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0f172a55_1.5px,transparent_1.5px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-[#020617] w-5 h-5 fill-current" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">PowerShare</span>
          </div>

          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-white text-2xl font-extrabold tracking-tight">Reset password</h1>
                <p className="text-slate-400 text-sm mt-1">
                  We'll send a credential recovery link
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-slate-355 text-xs font-semibold uppercase tracking-wider mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@powershare.com"
                      className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-660 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-bold py-3.5 rounded-xl text-xs tracking-wide uppercase transition-all duration-200 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                >
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="text-emerald-450 w-8 h-8" />
              </div>
              <h2 className="text-white text-xl font-extrabold tracking-tight mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                We've dispatched a reset link to <span className="text-white font-bold">{email}</span>.
                Inspect your inbox or spam folder in a moment.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-emerald-455 hover:text-emerald-400 text-xs font-bold transition-colors"
              >
                Try different email address
              </button>
            </motion.div>
          )}

          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-350 text-xs font-semibold mt-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
