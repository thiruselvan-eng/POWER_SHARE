// src/services/batteryService.ts
import api from './api';

export interface Battery {
  id: number;
  name: string;
  capacityKwh: number;
  voltage: number;
  batteryType: string;
  currentChargeKwh: number;
  healthRating: number;
  serialNumber: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'IN_TRANSIT';
  createdAt?: string;
  updatedAt?: string;
}

export interface BatteryRequest {
  name: string;
  capacityKwh: number;
  voltage: number;
  batteryType: string;
  currentChargeKwh: number;
  healthRating: number;
  serialNumber: string;
}

const batteryService = {
  getSellerBatteries: async (): Promise<Battery[]> => {
    const { data } = await api.get<Battery[]>('/seller/batteries');
    return data;
  },

  createBattery: async (payload: BatteryRequest): Promise<Battery> => {
    const { data } = await api.post<Battery>('/seller/batteries', payload);
    return data;
  },

  updateBattery: async (id: number, payload: BatteryRequest): Promise<Battery> => {
    const { data } = await api.put<Battery>(`/seller/batteries/${id}`, payload);
    return data;
  },

  deleteBattery: async (id: number): Promise<void> => {
    await api.delete(`/seller/batteries/${id}`);
  },
};

export default batteryService;
