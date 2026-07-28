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
    private String batteryType;
    private Double capacityKwh;
    private Double availableEnergyKwh;
    private Double healthRating; // 0.0 to 100.0
    private String serialNumber;
    private String imageUrl;
    private BatteryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
