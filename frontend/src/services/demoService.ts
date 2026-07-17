// src/services/demoService.ts
// Demo Mode: maps each role to its seeded production-database credentials.
// When a Demo button is clicked the app calls the real /api/auth/login endpoint
// with these credentials, receives a real JWT, and stores it exactly like a
// normal login.  No fake tokens are ever generated.

export const DEMO_CREDENTIALS: Record<
  'ROLE_BUYER' | 'ROLE_SELLER' | 'ROLE_DELIVERY' | 'ROLE_ADMIN',
  { email: string; password: string }
> = {
  ROLE_BUYER:    { email: 'buyer@powershare.com',    password: 'buyerpassword'    },
  ROLE_SELLER:   { email: 'seller@powershare.com',   password: 'sellerpassword'   },
  ROLE_DELIVERY: { email: 'delivery@powershare.com', password: 'deliverypassword' },
  ROLE_ADMIN:    { email: 'admin@powershare.com',    password: 'adminpassword'    },
};
