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
import java.math.RoundingMode;
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
            throw new BusinessException("The battery is currently " + battery.getStatus() + " and unavailable for purchase.");
        }

        // Validate requested energy amount against min purchase and available energy
        Double requestedKwh = request.getEnergyAmountKwh();
        if (requestedKwh == null || requestedKwh <= 0) {
            throw new BusinessException("Energy amount requested must be greater than 0 kWh.");
        }
        if (listing.getMinPurchaseKwh() != null && requestedKwh < listing.getMinPurchaseKwh()) {
            throw new BusinessException("Requested amount (" + requestedKwh + " kWh) is below seller's minimum purchase of " + listing.getMinPurchaseKwh() + " kWh.");
        }
        if (requestedKwh > battery.getAvailableEnergyKwh()) {
            throw new BusinessException("Requested amount (" + requestedKwh + " kWh) exceeds available battery energy of " + battery.getAvailableEnergyKwh() + " kWh.");
        }

        // Delivery check & fee calculation
        Double buyerLat = request.getBuyerLatitude() != null ? request.getBuyerLatitude() : buyer.getLatitude();
        Double buyerLon = request.getBuyerLongitude() != null ? request.getBuyerLongitude() : buyer.getLongitude();
        Double sellerLat = listing.getSellerLatitude();
        Double sellerLon = listing.getSellerLongitude();

        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (request.isDeliveryRequired()) {
            if (!listing.isDeliveryAvailable()) {
                throw new BusinessException("Seller does not offer delivery for this listing. Pickup required.");
            }
            if (buyerLat != null && buyerLon != null && sellerLat != null && sellerLon != null) {
                double distanceKm = calculateDistance(sellerLat, sellerLon, buyerLat, buyerLon);
                if (listing.getMaxDeliveryDistanceKm() != null && listing.getMaxDeliveryDistanceKm() > 0 && distanceKm > listing.getMaxDeliveryDistanceKm()) {
                    throw new BusinessException("Your location is " + String.format("%.1f", distanceKm) + " km away, which exceeds the seller's max delivery distance of " + listing.getMaxDeliveryDistanceKm() + " km.");
                }
                if (listing.getDeliveryChargePerKm() != null) {
                    deliveryFee = listing.getDeliveryChargePerKm().multiply(BigDecimal.valueOf(distanceKm)).setScale(2, RoundingMode.HALF_UP);
                }
            }
        }

        BigDecimal pricePerKwh = listing.getPricePerKwh();
        BigDecimal energyCost = pricePerKwh.multiply(BigDecimal.valueOf(requestedKwh));
        BigDecimal totalAmount = energyCost.add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        // Balance Check & Escrow lock
        Wallet buyerWallet = walletRepository.findByUserId(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer wallet not found"));

        if (buyerWallet.getBalance().compareTo(totalAmount) < 0) {
            throw new BusinessException("Insufficient wallet funds. Total required: ₹" + totalAmount +
                    ", but your balance is ₹" + buyerWallet.getBalance() + ". Please deposit funds first.");
        }

        // Debit buyer balance
        buyerWallet.setBalance(buyerWallet.getBalance().subtract(totalAmount));
        walletRepository.save(buyerWallet);

        // Record Buyer Escrow Debit Transaction
        Transaction debitTx = Transaction.builder()
                .wallet(buyerWallet)
                .amount(totalAmount)
                .transactionType(TransactionType.DEBIT)
                .description("Escrow locked for energy order of " + battery.getName() + " (" + requestedKwh + " kWh)")
                .build();
        transactionRepository.save(debitTx);

        // Save order
        Order order = Order.builder()
                .buyer(buyer)
                .seller(listing.getSeller())
                .battery(battery)
                .listing(listing)
                .pricePerKwh(pricePerKwh)
                .energyAmountKwh(requestedKwh)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .deliveryRequired(request.isDeliveryRequired())
                .buyerAddress(request.getBuyerAddress())
                .buyerLatitude(buyerLat)
                .buyerLongitude(buyerLon)
                .sellerAddressSnapshot(listing.getSellerAddress())
                .sellerLatitudeSnapshot(sellerLat)
                .sellerLongitudeSnapshot(sellerLon)
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
            throw new BusinessException("Cannot update order: it is already CANCELLED.");
        }
        if (currentStatus == OrderStatus.COMPLETED) {
            throw new BusinessException("Cannot update order: it is already COMPLETED.");
        }

        // Logic check: if CANCELLED, refund the buyer
        if (newStatus == OrderStatus.CANCELLED) {
            Wallet buyerWallet = walletRepository.findByUserId(order.getBuyer().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Buyer wallet not found"));

            buyerWallet.setBalance(buyerWallet.getBalance().add(order.getTotalAmount()));
            walletRepository.save(buyerWallet);

            Transaction refundTx = Transaction.builder()
                    .wallet(buyerWallet)
                    .amount(order.getTotalAmount())
                    .transactionType(TransactionType.CREDIT)
                    .description("Full refund for cancelled Order #" + order.getId())
                    .build();
            transactionRepository.save(refundTx);
        }

        // Logic check: if COMPLETED, release escrow funds to seller & update battery available energy
        if (newStatus == OrderStatus.COMPLETED) {
            Wallet sellerWallet = walletRepository.findByUserId(order.getSeller().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Seller wallet not found"));

            sellerWallet.setBalance(sellerWallet.getBalance().add(order.getTotalAmount()));
            walletRepository.save(sellerWallet);

            Transaction earnTx = Transaction.builder()
                    .wallet(sellerWallet)
                    .amount(order.getTotalAmount())
                    .transactionType(TransactionType.CREDIT)
                    .description("Escrow payout received for Order #" + order.getId())
                    .build();
            transactionRepository.save(earnTx);

            // Deduct purchased energy from battery
            Battery battery = order.getBattery();
            double remainingEnergy = Math.max(0.0, battery.getAvailableEnergyKwh() - order.getEnergyAmountKwh());
            battery.setAvailableEnergyKwh(remainingEnergy);
            if (remainingEnergy == 0.0) {
                battery.setStatus(BatteryStatus.SOLD_OUT);
            }
            batteryRepository.save(battery);
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
        return toResponse(order);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getFullName())
                .sellerId(order.getSeller().getId())
                .sellerName(order.getSeller().getFullName())
                .batteryId(order.getBattery().getId())
                .batteryName(order.getBattery().getName())
                .batteryType(order.getBattery().getBatteryType())
                .serialNumber(order.getBattery().getSerialNumber())
                .pricePerKwh(order.getPricePerKwh())
                .energyAmountKwh(order.getEnergyAmountKwh())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .deliveryRequired(order.isDeliveryRequired())
                .buyerAddress(order.getBuyerAddress())
                .buyerLatitude(order.getBuyerLatitude())
                .buyerLongitude(order.getBuyerLongitude())
                .sellerAddressSnapshot(order.getSellerAddressSnapshot())
                .sellerLatitudeSnapshot(order.getSellerLatitudeSnapshot())
                .sellerLongitudeSnapshot(order.getSellerLongitudeSnapshot())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
