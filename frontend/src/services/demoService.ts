// src/services/demoService.ts
// Service for handling Demo Mode configuration and mock sessions

export interface DemoUser {
  userId: number;
  fullName: string;
  email: string;
  role: 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY' | 'ROLE_ADMIN';
}

export const DEMO_ACCOUNTS: Record<string, DemoUser> = {
  ROLE_BUYER: {
    userId: 1,
    fullName: 'Demo Buyer',
    email: 'buyer@powershare.demo',
    role: 'ROLE_BUYER',
  },
  ROLE_SELLER: {
    userId: 2,
    fullName: 'Demo Seller',
    email: 'seller@powershare.demo',
    role: 'ROLE_SELLER',
  },
  ROLE_DELIVERY: {
    userId: 3,
    fullName: 'Demo Delivery',
    email: 'delivery@powershare.demo',
    role: 'ROLE_DELIVERY',
  },
  ROLE_ADMIN: {
    userId: 4,
    fullName: 'Demo Admin',
    email: 'admin@powershare.demo',
    role: 'ROLE_ADMIN',
  },
};

export const demoService = {
  // Check if current user is logged in via demo mode
  isDemoSession: (): boolean => {
    const token = localStorage.getItem('ps_token');
    return !!token && token.startsWith('demo-token');
  },

  // Setup local storage with demo user credentials
  signInDemoUser: (role: 'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY' | 'ROLE_ADMIN') => {
    const user = DEMO_ACCOUNTS[role];
    const mockToken = `demo-token-${role.toLowerCase()}-${Date.now()}`;
    
    // Construct the AuthUser object to be saved
    const authUser = {
      token: mockToken,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      userId: user.userId,
      message: 'Logged in successfully via Demo Mode'
    };

    localStorage.setItem('ps_token', mockToken);
    localStorage.setItem('ps_user', JSON.stringify(authUser));
    
    return authUser;
  }
};
