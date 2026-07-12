package com.powershare.dto;

import com.powershare.entity.BatteryStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatteryResponse {
    private Long id;
    private String name;
    private Double capacityKwh;
    private Double voltage;
    private String batteryType;
    private Double currentChargeKwh;
    private Double healthRating;
    private String serialNumber;
    private BatteryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
