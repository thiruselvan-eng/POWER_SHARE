package com.powershare.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyListingResponse {
    private Long id;

    // Battery info
    private Long batteryId;
    private String batteryName;
    private String batteryType;
    private Double capacityKwh;
    private Double availableEnergyKwh;
    private Double healthRating; // 0-100
    private String batteryStatus;
    private String serialNumber;
    private String imageUrl;

    // Pricing
    private BigDecimal pricePerKwh;
    private Double minPurchaseKwh;

    // Location
    private Double sellerLatitude;
    private Double sellerLongitude;
    private String sellerAddress;
    private String sellerArea;
    private String sellerCity;
    private String sellerState;
    private String sellerPincode;

    // Delivery
    private boolean deliveryAvailable;
    private Double maxDeliveryDistanceKm;
    private BigDecimal deliveryChargePerKm;
    private String estimatedDeliveryTime;

    // Availability
    private LocalDate availableFrom;
    private LocalDate availableUntil;

    // Meta
    private String description;
    private String sellerContact;
    private boolean active;

    // Seller info
    private Long sellerId;
    private String sellerName;
    private String sellerPhone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
