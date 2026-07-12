package com.powershare.dto;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Delivery address is required.")
    private String deliveryAddress;

    private Double deliveryLatitude;

    private Double deliveryLongitude;
}
