package com.powershare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long totalSellers;
    private long totalBuyers;
    private long totalDeliveryPartners;
    private long totalUnverifiedUsers;
    private double totalEnergyTransferredKwh;
    private BigDecimal totalFinancialThroughput;
    private BigDecimal activeEscrowAmount;
    private long totalOrdersCount;
}
