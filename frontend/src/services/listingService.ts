// src/services/listingService.ts
import api from './api';
import type { Battery } from './batteryService';

export interface EnergyListing {
  id: number;
  battery: Battery;
  pricePerKwh: number;
  deliveryRadiusKm: number;
  description: string;
  active: boolean;
  sellerName: string;
  sellerId: number;
  sellerPhone?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnergyListingRequest {
  batteryId: number;
  pricePerKwh: number;
  deliveryRadiusKm: number;
  description: string;
  active: boolean;
}

const listingService = {
  getSellerListings: async (): Promise<EnergyListing[]> => {
    const { data } = await api.get<EnergyListing[]>('/seller/listings');
    return data;
  },

  createListing: async (payload: EnergyListingRequest): Promise<EnergyListing> => {
    const { data } = await api.post<EnergyListing>('/seller/listings', payload);
    return data;
  },

  updateListing: async (id: number, payload: EnergyListingRequest): Promise<EnergyListing> => {
    const { data } = await api.put<EnergyListing>(`/seller/listings/${id}`, payload);
    return data;
  },

  deleteListing: async (id: number): Promise<void> => {
    await api.delete(`/seller/listings/${id}`);
  },

  getPublicListings: async (): Promise<EnergyListing[]> => {
    const { data } = await api.get<EnergyListing[]>('/listings/public');
    return data;
  },
};

export default listingService;
