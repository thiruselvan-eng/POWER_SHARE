package com.powershare.dto;

import com.powershare.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailablePickupResponse {
    private Long orderId;
    private OrderStatus orderStatus;
    private String batteryName;
    private String serialNumber;
    private Double energyAmountKwh;
    private BigDecimal totalAmount;
    private BigDecimal deliveryFee;

    // Pickup location (seller)
    private String sellerName;
    private String sellerPhone;
    private Double sellerLatitude;
    private Double sellerLongitude;

    // Drop-off location (buyer)
    private String buyerName;
    private String buyerPhone;
    private String deliveryAddress;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    private Double distanceKm;
}
