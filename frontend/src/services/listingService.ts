// src/services/listingService.ts
import api from './api';

export interface EnergyListing {
  id: number;
  batteryId: number;
  batteryName: string;
  batteryType: string;
  capacityKwh: number;
  availableEnergyKwh: number;
  healthRating: number; // 0 - 100%
  batteryStatus: string;
  serialNumber: string;
  imageUrl?: string;

  pricePerKwh: number; // ₹ / kWh
  minPurchaseKwh: number;

  sellerLatitude: number;
  sellerLongitude: number;
  sellerAddress?: string;
  sellerArea?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerPincode?: string;

  deliveryAvailable: boolean;
  maxDeliveryDistanceKm: number;
  deliveryChargePerKm: number;
  estimatedDeliveryTime?: string;

  availableFrom?: string;
  availableUntil?: string;

  description?: string;
  sellerContact?: string;
  active: boolean;

  sellerId: number;
  sellerName: string;
  sellerPhone?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface EnergyListingRequest {
  batteryName: string;
  batteryType: string;
  capacityKwh: number;
  availableEnergyKwh: number;
  healthRating: number;
  batteryStatus?: string;
  serialNumber?: string;
  imageUrl?: string;

  pricePerKwh: number;
  minPurchaseKwh?: number;

  sellerLatitude: number;
  sellerLongitude: number;
  sellerAddress?: string;
  sellerArea?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerPincode?: string;

  deliveryAvailable: boolean;
  maxDeliveryDistanceKm?: number;
  deliveryChargePerKm?: number;
  estimatedDeliveryTime?: string;

  availableFrom?: string;
  availableUntil?: string;

  description?: string;
  sellerContact?: string;
  active: boolean;
}

export interface MarketplaceSearchRequest {
  query?: string;
  batteryType?: string;
  minCapacityKwh?: number;
  maxCapacityKwh?: number;
  minPricePerKwh?: number;
  maxPricePerKwh?: number;
  minHealthPct?: number;
  deliveryAvailable?: boolean;
  maxDeliveryDistanceKm?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'capacity_desc' | 'health_desc' | 'newest';
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page index
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

  searchListings: async (req: MarketplaceSearchRequest): Promise<PageResponse<EnergyListing>> => {
    const { data } = await api.post<PageResponse<EnergyListing>>('/listings/public/search', req);
    return data;
  },

  getListingById: async (id: number): Promise<EnergyListing> => {
    const { data } = await api.get<EnergyListing>(`/listings/public/${id}`);
    return data;
  },
};

export default listingService;
