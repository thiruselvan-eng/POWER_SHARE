package com.powershare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotNull(message = "Listing ID is required.")
    private Long listingId;

    @NotNull(message = "Energy amount in kWh is required.")
    private Double energyAmountKwh;

    private boolean deliveryRequired;

    private String buyerAddress;
    private Double buyerLatitude;
    private Double buyerLongitude;
}
