package com.powershare.service;

import com.powershare.dto.OrderRequest;
import com.powershare.dto.OrderResponse;

import com.powershare.entity.*;
import com.powershare.exception.BusinessException;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final EnergyListingRepository energyListingRepository;
    private final BatteryRepository batteryRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;


    @Transactional
    public OrderResponse createOrder(Long buyerId, OrderRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));
        EnergyListing listing = energyListingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Energy listing not found"));

        if (!listing.isActive()) {
            throw new BusinessException("This energy listing is no longer active.");
        }

        Battery battery = listing.getBattery();
        if (battery.getStatus() != BatteryStatus.AVAILABLE) {
            throw new BusinessException("The selected battery pack is currently " + battery.getStatus() + " and cannot be rented.");
        }

        // Proximity Radius Check & Dynamic Delivery Fee
        Double buyerLat = request.getDeliveryLatitude() != null ? request.getDeliveryLatitude() : buyer.getLatitude();
        Double buyerLon = request.getDeliveryLongitude() != null ? request.getDeliveryLongitude() : buyer.getLongitude();
        Double sellerLat = listing.getSeller().getLatitude();
        Double sellerLon = listing.getSeller().getLongitude();

        double distanceKm = 0;
        double deliveryFeeDouble = 5.00; // Default flat fee

        if (buyerLat != null && buyerLon != null && sellerLat != null && sellerLon != null) {
            distanceKm = calculateDistance(sellerLat, sellerLon, buyerLat, buyerLon);
            if (distanceKm > listing.getDeliveryRadiusKm()) {
                throw new BusinessException("Your delivery location is outside the seller's " + 
                        listing.getDeliveryRadiusKm() + " km service radius (Calculated: " + 
                        String.format("%.1f", distanceKm) + " km away).");
            }
            deliveryFeeDouble = 2.00 + (distanceKm * 0.50); // $2.00 base + $0.50/km
        }

        BigDecimal pricePerKwh = listing.getPricePerKwh();
        BigDecimal energyAmount = BigDecimal.valueOf(battery.getCurrentChargeKwh());
        BigDecimal deliveryFee = BigDecimal.valueOf(deliveryFeeDouble).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal energyCost = pricePerKwh.multiply(energyAmount);
        BigDecimal totalAmount = energyCost.add(deliveryFee).setScale(2, java.math.RoundingMode.HALF_UP);

        // Balance Check
        Wallet buyerWallet = walletRepository.findByUserId(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer wallet not found"));

        if (buyerWallet.getBalance().compareTo(totalAmount) < 0) {
            throw new BusinessException("Insufficient wallet funds. Total cost: $" + totalAmount + 
                    ", but your balance is only $" + buyerWallet.getBalance() + ". Please top up first.");
        }

        // Debit buyer
        buyerWallet.setBalance(buyerWallet.getBalance().subtract(totalAmount));
        walletRepository.save(buyerWallet);

        // Record Buyer Transaction
        Transaction debitTx = Transaction.builder()
                .wallet(buyerWallet)
                .amount(totalAmount)
                .transactionType(TransactionType.DEBIT)
                .description("Paid for Order of " + battery.getName() + " (Escrow lock)")
                .build();
        transactionRepository.save(debitTx);

        // Update status of battery & delist
        battery.setStatus(BatteryStatus.IN_TRANSIT);
        batteryRepository.save(battery);

        listing.setActive(false);
        energyListingRepository.save(listing);

        // Save order
        Order order = Order.builder()
                .buyer(buyer)
                .seller(listing.getSeller())
                .battery(battery)
                .listing(listing)
                .pricePerKwh(pricePerKwh)
                .energyAmountKwh(battery.getCurrentChargeKwh())
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryLatitude(buyerLat)
                .deliveryLongitude(buyerLon)
                .status(OrderStatus.PENDING)
                .build();

        orderRepository.save(order);
        return toResponse(order);
    }

    public List<OrderResponse> getBuyerOrders(Long buyerId) {
        return orderRepository.findByBuyerId(buyerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getSellerOrders(Long sellerId) {
        return orderRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateStatus(Long userId, Long orderId, OrderStatus newStatus, boolean isSellerUser) {
        Order order = isSellerUser 
                ? orderRepository.findByIdAndSellerId(orderId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found for this seller"))
                : orderRepository.findByIdAndBuyerId(orderId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found for this buyer"));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot change status: Order is already closed as CANCELLED");
        }

        if (currentStatus == OrderStatus.COMPLETED && newStatus != OrderStatus.RETURN_PENDING) {
            throw new BusinessException("Cannot change status: Order is already COMPLETED. Only return requests can be initiated.");
        }

        // Logic check: if cancelled, refund the buyer and release battery
        if (newStatus == OrderStatus.CANCELLED) {
            Wallet buyerWallet = walletRepository.findByUserId(order.getBuyer().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Buyer wallet not found"));
            
            buyerWallet.setBalance(buyerWallet.getBalance().add(order.getTotalAmount()));
            walletRepository.save(buyerWallet);

            Transaction refundTx = Transaction.builder()
                    .wallet(buyerWallet)
                    .amount(order.getTotalAmount())
                    .transactionType(TransactionType.CREDIT)
                    .description("Refund for cancelled Order #" + order.getId())
                    .build();
            transactionRepository.save(refundTx);

            Battery battery = order.getBattery();
            battery.setStatus(BatteryStatus.AVAILABLE);
            batteryRepository.save(battery);

            EnergyListing listing = order.getListing();
            listing.setActive(true);
            energyListingRepository.save(listing);
        }

        // Logic check: if completed, release funds to the seller
        if (newStatus == OrderStatus.COMPLETED) {
            Wallet sellerWallet = walletRepository.findByUserId(order.getSeller().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Seller wallet not found"));

            sellerWallet.setBalance(sellerWallet.getBalance().add(order.getTotalAmount()));
            walletRepository.save(sellerWallet);

            Transaction earnTx = Transaction.builder()
                    .wallet(sellerWallet)
                    .amount(order.getTotalAmount())
                    .transactionType(TransactionType.CREDIT)
                    .description("Received escrow earnings for Order #" + order.getId())
                    .build();
            transactionRepository.save(earnTx);

            Battery battery = order.getBattery();
            battery.setStatus(BatteryStatus.RENTED);
            batteryRepository.save(battery);
        }

        // Logic check: if returned, set battery status back to AVAILABLE
        if (newStatus == OrderStatus.RETURNED) {
            Battery battery = order.getBattery();
            battery.setStatus(BatteryStatus.AVAILABLE);
            batteryRepository.save(battery);
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
        return toResponse(order);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radious of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getFullName())
                .buyerPhone(order.getBuyer().getPhone())
                .sellerId(order.getSeller().getId())
                .sellerName(order.getSeller().getFullName())
                .sellerPhone(order.getSeller().getPhone())
                .batteryId(order.getBattery().getId())
                .batteryName(order.getBattery().getName())
                .serialNumber(order.getBattery().getSerialNumber())
                .listingId(order.getListing().getId())
                .pricePerKwh(order.getPricePerKwh())
                .energyAmountKwh(order.getEnergyAmountKwh())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                .sellerLatitude(order.getSeller().getLatitude())
                .sellerLongitude(order.getSeller().getLongitude())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
