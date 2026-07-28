// src/services/orderService.ts
import api from './api';

export interface OrderRequest {
  listingId: number;
  energyAmountKwh: number;
  deliveryRequired: boolean;
  buyerAddress?: string;
  buyerLatitude?: number;
  buyerLongitude?: number;
}

export interface Order {
  id: number;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;

  batteryId: number;
  batteryName: string;
  batteryType: string;
  serialNumber: string;

  pricePerKwh: number;
  energyAmountKwh: number;
  deliveryFee: number;
  totalAmount: number;

  deliveryRequired: boolean;
  buyerAddress?: string;
  buyerLatitude?: number;
  buyerLongitude?: number;
  sellerAddressSnapshot?: string;
  sellerLatitudeSnapshot?: number;
  sellerLongitudeSnapshot?: number;

  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
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

  updateSellerOrderStatus: async (orderId: number, status: Order['status']): Promise<Order> => {
    const { data } = await api.patch<Order>(`/seller/orders/${orderId}/status?status=${status}`);
    return data;
  },
};

export default orderService;
