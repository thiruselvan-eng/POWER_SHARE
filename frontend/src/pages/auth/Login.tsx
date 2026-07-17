// src/pages/auth/Login.tsx
// Premium dark-mode login page with refined design and Lucide icons

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, ShieldAlert } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { demoService } from '../../services/demoService';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleDemoSignIn = (role: 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY' | 'ROLE_ADMIN') => {
    const user = demoService.signInDemoUser(role);
    login(user);
    const roleMap: Record<string, string> = {
      ROLE_BUYER: '/buyer',
      ROLE_SELLER: '/seller',
      ROLE_DELIVERY: '/delivery',
      ROLE_ADMIN: '/admin',
    };
    navigate(roleMap[role] || '/');
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setServerError('');
    try {
      const user = await authService.login(data);
      login(user);
      // Role-based redirect
      const roleMap: Record<string, string> = {
        ROLE_BUYER: '/buyer',
        ROLE_SELLER: '/seller',
        ROLE_DELIVERY: '/delivery',
        ROLE_ADMIN: '/admin',
      };
      navigate(roleMap[user.role] || '/');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden group">
      {/* Background glow & subtle patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a55_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0f172a55_1.5px,transparent_1.5px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
      >
        {/* Glow behind container */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Card */}
        <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-[#020617] w-5 h-5 fill-current" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">PowerShare</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to build or query green grids</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@powershare.com"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-655 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-355 text-xs font-semibold uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-emerald-450 text-xs font-semibold hover:text-emerald-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Password"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-655 rounded-xl pl-10 pr-11 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-550 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#020617] font-bold py-3.5 rounded-xl text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                  Verifying session…
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800/80" />
            <span className="text-slate-600 text-xs font-semibold">or</span>
            <div className="flex-1 h-px bg-slate-800/80" />
          </div>

          <p className="text-center text-slate-400 text-xs font-semibold mb-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-450 font-bold hover:text-emerald-400 transition-colors">
              Sign up free
            </Link>
          </p>

          {/* Demo Mode Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex justify-center mb-4">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                Demo Mode (Development Only)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSignIn('ROLE_BUYER')}
                className="bg-[#050816] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/35 text-slate-350 hover:text-emerald-400 text-xs font-semibold py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                🚀 Demo Buyer
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('ROLE_SELLER')}
                className="bg-[#050816] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/35 text-slate-350 hover:text-emerald-400 text-xs font-semibold py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                🚀 Demo Seller
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('ROLE_DELIVERY')}
                className="bg-[#050816] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/35 text-slate-350 hover:text-emerald-400 text-xs font-semibold py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                🚀 Demo Delivery
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('ROLE_ADMIN')}
                className="bg-[#050816] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/35 text-slate-350 hover:text-emerald-400 text-xs font-semibold py-2.5 px-2 rounded-xl transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                🚀 Demo Admin
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
