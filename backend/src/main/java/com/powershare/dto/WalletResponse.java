package com.powershare.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long id;
    private BigDecimal balance;
    private String currency;
    private LocalDateTime updatedAt;
}
