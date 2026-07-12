// src/App.tsx
// Root application with protected routes + AuthProvider

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

// Redirect authenticated users away from auth pages
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const role = JSON.parse(localStorage.getItem('ps_user') || '{}')?.role;
  if (isAuthenticated) {
    const map: Record<string, string> = {
      ROLE_BUYER: '/buyer', ROLE_SELLER: '/seller',
      ROLE_DELIVERY: '/delivery', ROLE_ADMIN: '/admin',
    };
    return <Navigate to={map[role] || '/'} replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Home />} />

    {/* Auth — only for guests */}
    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
    <Route path="/forgot-password" element={<ForgotPassword />} />

    {/* Protected — Buyer */}
    <Route path="/buyer/*" element={
      <ProtectedRoute allowedRoles={['ROLE_BUYER']}>
        <BuyerDashboard />
      </ProtectedRoute>
    } />

    {/* Protected — Seller */}
    <Route path="/seller/*" element={
      <ProtectedRoute allowedRoles={['ROLE_SELLER']}>
        <SellerDashboard />
      </ProtectedRoute>
    } />

    {/* Protected — Delivery */}
    <Route path="/delivery/*" element={
      <ProtectedRoute allowedRoles={['ROLE_DELIVERY']}>
        <DeliveryDashboard />
      </ProtectedRoute>
    } />

    {/* Protected — Admin */}
    <Route path="/admin/*" element={
      <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />

    {/* Unauthorized */}
    <Route path="/unauthorized" element={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🚫</p>
          <h1 className="text-white text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </div>
    } />

    {/* 404 */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
