package com.powershare.dto;

import com.powershare.entity.DeliveryStatus;
import com.powershare.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryResponse {
    private Long assignmentId;

    // Order details
    private Long orderId;
    private OrderStatus orderStatus;
    private String batteryName;
    private String serialNumber;
    private Double energyAmountKwh;
    private BigDecimal totalAmount;

    // Buyer details
    private String buyerName;
    private String buyerPhone;
    private String deliveryAddress;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    // Seller details
    private String sellerName;
    private String sellerPhone;
    private Double sellerLatitude;
    private Double sellerLongitude;

    // Assignment details
    private DeliveryStatus deliveryStatus;
    private String agentName;
    private Long agentId;
    private String pickupNote;
    private String deliveryNote;
    private Double currentLatitude;
    private Double currentLongitude;

    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime returnedAt;
    private LocalDateTime createdAt;
}
