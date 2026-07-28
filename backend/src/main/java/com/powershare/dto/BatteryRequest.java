package com.powershare.dto;

import com.powershare.entity.BatteryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatteryRequest {

    @NotBlank(message = "Battery name is required.")
    private String name;

    @NotBlank(message = "Battery type is required.")
    private String batteryType;

    @NotNull(message = "Capacity in kWh is required.")
    private Double capacityKwh;

    @NotNull(message = "Available energy in kWh is required.")
    private Double availableEnergyKwh;

    @NotNull(message = "Battery health percentage is required.")
    private Double healthRating; // 0.0 to 100.0

    @NotBlank(message = "Serial number is required.")
    private String serialNumber;

    private String imageUrl;

    @Builder.Default
    private BatteryStatus status = BatteryStatus.AVAILABLE;
}
