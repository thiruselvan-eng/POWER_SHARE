// src/services/deliveryService.ts
import api from './api';

export interface AvailablePickup {
  orderId: number;
  orderStatus: string;
  batteryName: string;
  serialNumber: string;
  energyAmountKwh: number;
  totalAmount: number;
  deliveryFee: number;
  sellerName: string;
  sellerPhone?: string;
  sellerLatitude?: number;
  sellerLongitude?: number;
  buyerName: string;
  buyerPhone?: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  distanceKm: number;
}

export interface DeliveryAssignment {
  assignmentId: number;
  orderId: number;
  orderStatus: string;
  batteryName: string;
  serialNumber: string;
  energyAmountKwh: number;
  totalAmount: number;
  buyerName: string;
  buyerPhone?: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  sellerName: string;
  sellerPhone?: string;
  sellerLatitude?: number;
  sellerLongitude?: number;
  deliveryStatus: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURN_PICKED_UP' | 'RETURNED' | 'FAILED';
  agentId?: number;
  agentName?: string;
  pickupNote?: string;
  deliveryNote?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  pickedUpAt?: string;
  deliveredAt?: string;
  returnedAt?: string;
  createdAt: string;
}

const deliveryService = {
  getAvailable: async (): Promise<AvailablePickup[]> => {
    const { data } = await api.get<AvailablePickup[]>('/delivery/available');
    return data;
  },

  getMyAssignments: async (): Promise<DeliveryAssignment[]> => {
    const { data } = await api.get<DeliveryAssignment[]>('/delivery/assignments');
    return data;
  },

  claimOrder: async (orderId: number): Promise<DeliveryAssignment> => {
    const { data } = await api.post<DeliveryAssignment>(`/delivery/assignments/claim/${orderId}`);
    return data;
  },

  updateStatus: async (
    assignmentId: number,
    status: DeliveryAssignment['deliveryStatus'],
    note?: string,
    lat?: number,
    lng?: number
  ): Promise<DeliveryAssignment> => {
    const { data } = await api.put<DeliveryAssignment>(
      `/delivery/assignments/${assignmentId}/status?status=${status}`,
      { note, currentLatitude: lat, currentLongitude: lng }
    );
    return data;
  },

  updateLocation: async (
    assignmentId: number,
    latitude: number,
    longitude: number
  ): Promise<DeliveryAssignment> => {
    const { data } = await api.put<DeliveryAssignment>(
      `/delivery/assignments/${assignmentId}/location?latitude=${latitude}&longitude=${longitude}`
    );
    return data;
  },
};

export default deliveryService;
