package com.powershare.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceSearchRequest {

    private String query;         // matches battery name, city, description
    private String batteryType;   // exact match
    private Double minCapacityKwh;
    private Double maxCapacityKwh;
    private Double minPricePerKwh;
    private Double maxPricePerKwh;
    private Double minHealthPct;  // 0-100
    private Boolean deliveryAvailable;
    private Double maxDeliveryDistanceKm;

    // Sorting: "price_asc", "price_desc", "capacity_desc", "health_desc", "newest"
    @Builder.Default
    private String sortBy = "newest";

    // Pagination
    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;
}
