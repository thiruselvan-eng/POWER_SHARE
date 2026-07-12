// src/pages/auth/Register.tsx
// Premium multi-step register page with luxury dark design

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  Zap,
  Eye,
  EyeOff,
  ShoppingBag,
  Sun,
  Truck,
  ShieldAlert
} from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['ROLE_BUYER', 'ROLE_SELLER', 'ROLE_DELIVERY']),
  phone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const roles = [
  {
    id: 'ROLE_BUYER',
    label: 'Buyer',
    description: 'Purchase stored renewable energy packs',
    icon: ShoppingBag,
  },
  {
    id: 'ROLE_SELLER',
    label: 'Seller',
    description: 'List & sell your solar-charged batteries',
    icon: Sun,
  },
  {
    id: 'ROLE_DELIVERY',
    label: 'Courier Partner',
    description: 'Pick up and deliver charged packs',
    icon: Truck,
  },
] as const;

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('ROLE_BUYER');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'ROLE_BUYER' },
  });

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setValue('role', roleId as 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY');
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setServerError('');
    try {
      const user = await authService.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
      });
      login(user);
      const roleMap: Record<string, string> = {
        ROLE_BUYER: '/buyer',
        ROLE_SELLER: '/seller',
        ROLE_DELIVERY: '/delivery',
      };
      navigate(roleMap[user.role] || '/');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-16 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 w-[45rem] h-[45rem] bg-teal-555/5 rounded-full blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a55_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0f172a55_1.5px,transparent_1.5px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg z-10"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6 justify-center">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-[#020617] w-5 h-5 fill-current" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">PowerShare</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1">Join the green energy marketplace loop</p>
          </div>

          {/* Role Selector */}
          <div className="mb-8">
            <p className="text-slate-350 text-xs font-semibold uppercase tracking-wider mb-3">Register Node Role Type</p>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-550 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-[#050816] border-slate-800 text-slate-400 hover:border-slate-750'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold leading-tight">{role.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-slate-500 text-[11px] font-medium mt-3 italic text-center">
              {roles.find(r => r.id === selectedRole)?.description}
            </p>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  placeholder="First and last name"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-655 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              {errors.fullName && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-355 text-xs font-semibold uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-660 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">
                Phone <span className="text-slate-600 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+91 999 999 9999"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-660 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-350 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-660 rounded-xl pl-10 pr-11 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-550 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-355 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-550 w-4 h-4" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Repeat your password"
                  className="w-full bg-[#050816] border border-slate-800 text-white placeholder-slate-660 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#020617] font-bold py-3.5 rounded-xl text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                  Creating node profile…
                </>
              ) : 'Confirm and Register'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-6 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-450 font-bold hover:text-emerald-400 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
