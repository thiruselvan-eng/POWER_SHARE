package com.powershare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatteryRequest {

    @NotBlank(message = "Battery name or model is required.")
    private String name;

    @NotNull(message = "Capacity in kWh is required.")
    private Double capacityKwh;

    @NotNull(message = "Voltage is required.")
    private Double voltage;

    @NotBlank(message = "Battery chemistry/type is required.")
    private String batteryType;

    @NotNull(message = "Current charge level is required.")
    private Double currentChargeKwh;

    @NotNull(message = "State of health (health rating) is required.")
    private Double healthRating;

    @NotBlank(message = "Serial number is required.")
    private String serialNumber;
}
