// src/services/orderService.ts
import api from './api';

export interface OrderRequest {
  listingId: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface Order {
  id: number;
  buyerId: number;
  buyerName: string;
  buyerPhone?: string;
  sellerId: number;
  sellerName: string;
  sellerPhone?: string;
  batteryId: number;
  batteryName: string;
  serialNumber: string;
  listingId: number;
  pricePerKwh: number;
  energyAmountKwh: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  sellerLatitude?: number;
  sellerLongitude?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'COMPLETED' | 'RETURN_PENDING' | 'RETURNED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

const orderService = {
  createOrder: async (payload: OrderRequest): Promise<Order> => {
    const { data } = await api.post<Order>('/buyer/orders', payload);
    return data;
  },

  getBuyerOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/buyer/orders');
    return data;
  },

  getSellerOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/seller/orders');
    return data;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const { data } = await api.patch<Order>(`/buyer/orders/${orderId}/cancel`);
    return data;
  },

  requestReturn: async (orderId: number): Promise<Order> => {
    const { data } = await api.patch<Order>(`/buyer/orders/${orderId}/status?status=RETURN_PENDING`);
    return data;
  },

  updateSellerOrderStatus: async (orderId: number, status: Order['status']): Promise<Order> => {
    const { data } = await api.patch<Order>(`/seller/orders/${orderId}/status?status=${status}`);
    return data;
  },
};

export default orderService;
