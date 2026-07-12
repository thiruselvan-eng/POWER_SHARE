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
    
    private Long buyerId;
    private String buyerName;
    private String buyerPhone;

    private Long sellerId;
    private String sellerName;
    private String sellerPhone;

    private Long batteryId;
    private String batteryName;
    private String serialNumber;
    
    private Long listingId;
    private BigDecimal pricePerKwh;
    private Double energyAmountKwh;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;

    private String deliveryAddress;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    private Double sellerLatitude;
    private Double sellerLongitude;
    
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
