import api from './api';
import type { Order } from './orderService';

export interface AdminStats {
  totalSellers: number;
  totalBuyers: number;
  totalDeliveryPartners: number;
  totalUnverifiedUsers: number;
  totalEnergyTransferredKwh: number;
  totalFinancialThroughput: number;
  activeEscrowAmount: number;
  totalOrdersCount: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY' | 'ROLE_ADMIN';
  verified: boolean;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await api.get<AdminUser[]>('/admin/users');
    return data;
  },

  verifyUser: async (userId: number, verified: boolean): Promise<AdminUser> => {
    const { data } = await api.put<AdminUser>(`/admin/users/${userId}/verify?verified=${verified}`);
    return data;
  },

  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/admin/orders');
    return data;
  },
};

export default adminService;
