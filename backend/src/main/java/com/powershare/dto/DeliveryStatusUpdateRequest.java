package com.powershare.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryStatusUpdateRequest {
    private String note;
    private Double currentLatitude;
    private Double currentLongitude;
}
