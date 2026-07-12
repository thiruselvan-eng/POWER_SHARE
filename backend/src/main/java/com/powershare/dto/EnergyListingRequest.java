package com.powershare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyListingRequest {

    @NotNull(message = "Battery ID is required.")
    private Long batteryId;

    @NotNull(message = "Price per kWh is required.")
    private BigDecimal pricePerKwh;

    @NotNull(message = "Delivery radius in kilometers is required.")
    private Double deliveryRadiusKm;

    private String description;

    @Builder.Default
    private boolean active = true;
}
