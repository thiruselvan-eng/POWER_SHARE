// src/services/authService.ts
import api from './api';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY';
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  token: string;
  email: string;
  fullName: string;
  role: string;
  userId: number;
  message: string;
}

const authService = {
  register: async (payload: RegisterPayload): Promise<AuthUser> => {
    const { data } = await api.post<AuthUser>('/auth/register', payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const { data } = await api.post<AuthUser>('/auth/login', payload);
    return data;
  },

  getWalletBalance: async () => {
    const { data } = await api.get('/wallet/balance');
    return data;
  },

  getTransactions: async () => {
    const { data } = await api.get('/wallet/transactions');
    return data;
  },

  deposit: async (amount: number) => {
    const { data } = await api.post(`/wallet/deposit?amount=${amount}`);
    return data;
  },

  withdraw: async (amount: number) => {
    const { data } = await api.post(`/wallet/withdraw?amount=${amount}`);
    return data;
  },
};

export default authService;
