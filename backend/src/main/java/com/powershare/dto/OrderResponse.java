package com.powershare.dto;

import com.powershare.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;

    // Parties
    private Long buyerId;
    private String buyerName;
    private Long sellerId;
    private String sellerName;

    // Battery
    private Long batteryId;
    private String batteryName;
    private String batteryType;
    private String serialNumber;

    // Energy & Pricing
    private BigDecimal pricePerKwh;
    private Double energyAmountKwh;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;

    // Delivery info
    private boolean deliveryRequired;
    private String buyerAddress;
    private Double buyerLatitude;
    private Double buyerLongitude;
    private String sellerAddressSnapshot;
    private Double sellerLatitudeSnapshot;
    private Double sellerLongitudeSnapshot;

    // Status
    private OrderStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
