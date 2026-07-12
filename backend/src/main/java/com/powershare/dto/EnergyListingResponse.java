package com.powershare.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyListingResponse {
    private Long id;
    private BatteryResponse battery;
    private BigDecimal pricePerKwh;
    private Double deliveryRadiusKm;
    private String description;
    private boolean active;
    private String sellerName;
    private Long sellerId;
    private String sellerPhone;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
