package com.powershare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyListingRequest {

    // Battery fields (creates/updates embedded battery)
    @NotNull(message = "Battery name is required.")
    private String batteryName;

    @NotNull(message = "Battery type is required.")
    private String batteryType;

    @NotNull(message = "Capacity in kWh is required.")
    private Double capacityKwh;

    @NotNull(message = "Available energy in kWh is required.")
    private Double availableEnergyKwh;

    @NotNull(message = "Battery health percentage is required.")
    private Double healthRating; // 0 to 100

    private String batteryStatus; // AVAILABLE, CHARGING, RESERVED, MAINTENANCE, SOLD_OUT

    private String imageUrl;

    private String serialNumber;

    // Pricing
    @NotNull(message = "Price per kWh is required.")
    private BigDecimal pricePerKwh;

    @Builder.Default
    private Double minPurchaseKwh = 1.0;

    // Location
    @NotNull(message = "Seller latitude is required.")
    private Double sellerLatitude;

    @NotNull(message = "Seller longitude is required.")
    private Double sellerLongitude;

    private String sellerAddress;
    private String sellerArea;
    private String sellerCity;
    private String sellerState;
    private String sellerPincode;

    // Delivery
    @Builder.Default
    private boolean deliveryAvailable = false;

    @Builder.Default
    private Double maxDeliveryDistanceKm = 0.0;

    @Builder.Default
    private BigDecimal deliveryChargePerKm = BigDecimal.ZERO;

    private String estimatedDeliveryTime;

    // Availability
    private LocalDate availableFrom;
    private LocalDate availableUntil;

    // Meta
    private String description;
    private String sellerContact;

    @Builder.Default
    private boolean active = true;
}
