package com.powershare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.powershare.dto.AvailablePickupResponse;
import com.powershare.dto.DeliveryResponse;
import com.powershare.dto.DeliveryStatusUpdateRequest;
import com.powershare.entity.*;
import com.powershare.exception.BusinessException;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.*;
import com.powershare.websocket.TrackingWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryAssignmentRepository deliveryAssignmentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BatteryRepository batteryRepository;
    private final TrackingWebSocketHandler trackingWebSocketHandler;
    private final ObjectMapper objectMapper;

    /**
     * Finds all orders that require a delivery partner.
     * This includes:
     * 1. Orders accepted by seller (ACCEPTED) with no delivery assignment.
     * 2. Orders requested for return (RETURN_PENDING) where delivery status is DELIVERED.
     */
    public List<AvailablePickupResponse> getAvailablePickups() {
        List<AvailablePickupResponse> list = new ArrayList<>();

        // 1. New Orders
        List<Order> newOrders = deliveryAssignmentRepository.findAvailableOrdersForPickup();
        for (Order o : newOrders) {
            list.add(mapToAvailablePickup(o, false));
        }

        // 2. Returns (Orders with RETURN_PENDING status)
        List<Order> returnOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.RETURN_PENDING)
                .filter(o -> {
                    Optional<DeliveryAssignment> opt = deliveryAssignmentRepository.findByOrderId(o.getId());
                    // Return is available if assignment exists but its status is DELIVERED
                    return opt.isPresent() && opt.get().getStatus() == DeliveryStatus.DELIVERED;
                })
                .collect(Collectors.toList());

        for (Order o : returnOrders) {
            list.add(mapToAvailablePickup(o, true));
        }

        return list;
    }

    /**
     * Claims an order for delivery.
     * Works for both initial shipment (status ACCEPTED) and return delivery (status RETURN_PENDING).
     */
    @Transactional
    public DeliveryResponse claimOrder(Long agentId, Long orderId) {
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found"));

        if (agent.getRole() != Role.ROLE_DELIVERY) {
            throw new BusinessException("User does not have delivery agent privileges");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        DeliveryAssignment assignment;
        Optional<DeliveryAssignment> existingOpt = deliveryAssignmentRepository.findByOrderId(orderId);

        if (order.getStatus() == OrderStatus.ACCEPTED) {
            if (existingOpt.isPresent()) {
                throw new BusinessException("This order is already claimed by another delivery partner.");
            }

            assignment = DeliveryAssignment.builder()
                    .order(order)
                    .deliveryAgent(agent)
                    .status(DeliveryStatus.ASSIGNED)
                    .currentLatitude(order.getSeller().getLatitude())
                    .currentLongitude(order.getSeller().getLongitude())
                    .build();

        } else if (order.getStatus() == OrderStatus.RETURN_PENDING) {
            if (existingOpt.isEmpty()) {
                throw new BusinessException("Invalid state: Return requested but no original delivery assignment found.");
            }

            assignment = existingOpt.get();
            if (assignment.getStatus() == DeliveryStatus.ASSIGNED || 
                assignment.getStatus() == DeliveryStatus.PICKED_UP || 
                assignment.getStatus() == DeliveryStatus.IN_TRANSIT ||
                assignment.getStatus() == DeliveryStatus.RETURN_PICKED_UP) {
                throw new BusinessException("This return is already in progress by a delivery partner.");
            }

            // Reuse existing assignment, update agent and reset state for returning
            assignment.setDeliveryAgent(agent);
            assignment.setStatus(DeliveryStatus.ASSIGNED);
            assignment.setCurrentLatitude(order.getDeliveryLatitude() != null ? order.getDeliveryLatitude() : order.getBuyer().getLatitude());
            assignment.setCurrentLongitude(order.getDeliveryLongitude() != null ? order.getDeliveryLongitude() : order.getBuyer().getLongitude());
            assignment.setReturnedAt(null);
            assignment.setPickupNote(null);
            assignment.setDeliveryNote(null);

        } else {
            throw new BusinessException("Order is not in a claimable state. Status: " + order.getStatus());
        }

        deliveryAssignmentRepository.save(assignment);
        DeliveryResponse response = toResponse(assignment);
        broadcastUpdate(orderId, response);
        return response;
    }

    /**
     * Gets all delivery assignments for a delivery agent.
     */
    public List<DeliveryResponse> getAgentAssignments(Long agentId) {
        return deliveryAssignmentRepository.findByDeliveryAgentId(agentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update the status and optional notes/coordinates of a delivery.
     */
    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long agentId, Long assignmentId, DeliveryStatus newStatus, DeliveryStatusUpdateRequest request) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findByIdAndDeliveryAgentId(assignmentId, agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery assignment not found for this agent"));

        Order order = assignment.getOrder();

        if (request.getCurrentLatitude() != null) {
            assignment.setCurrentLatitude(request.getCurrentLatitude());
        }
        if (request.getCurrentLongitude() != null) {
            assignment.setCurrentLongitude(request.getCurrentLongitude());
        }

        // Status Transitions
        if (newStatus == DeliveryStatus.PICKED_UP) {
            if (order.getStatus() == OrderStatus.ACCEPTED) {
                assignment.setStatus(DeliveryStatus.PICKED_UP);
                assignment.setPickedUpAt(LocalDateTime.now());
                if (request.getNote() != null) {
                    assignment.setPickupNote(request.getNote());
                }
                order.setStatus(OrderStatus.DISPATCHED);
                orderRepository.save(order);
            } else {
                throw new BusinessException("Cannot pick up: Order is not in ACCEPTED state. Current state: " + order.getStatus());
            }
        } 
        else if (newStatus == DeliveryStatus.IN_TRANSIT) {
            assignment.setStatus(DeliveryStatus.IN_TRANSIT);
        } 
        else if (newStatus == DeliveryStatus.DELIVERED) {
            if (order.getStatus() == OrderStatus.DISPATCHED || order.getStatus() == OrderStatus.ACCEPTED) {
                assignment.setStatus(DeliveryStatus.DELIVERED);
                assignment.setDeliveredAt(LocalDateTime.now());
                if (request.getNote() != null) {
                    assignment.setDeliveryNote(request.getNote());
                }
                
                order.setStatus(OrderStatus.COMPLETED);
                orderRepository.save(order);

                // Update Battery Status to RENTED
                Battery battery = order.getBattery();
                battery.setStatus(BatteryStatus.RENTED);
                batteryRepository.save(battery);

                // Release Escrow funds to Seller
                Wallet sellerWallet = walletRepository.findByUserId(order.getSeller().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Seller wallet not found"));
                
                BigDecimal sellerEarnings = order.getTotalAmount().subtract(order.getDeliveryFee());
                sellerWallet.setBalance(sellerWallet.getBalance().add(sellerEarnings));
                walletRepository.save(sellerWallet);

                Transaction sellerTx = Transaction.builder()
                        .wallet(sellerWallet)
                        .amount(sellerEarnings)
                        .transactionType(TransactionType.CREDIT)
                        .description("Earnings (energy price) for Order #" + order.getId() + " delivered")
                        .build();
                transactionRepository.save(sellerTx);

                // Payout Delivery Fee to Delivery Partner
                Wallet agentWallet = walletRepository.findByUserId(agentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Delivery partner wallet not found"));
                agentWallet.setBalance(agentWallet.getBalance().add(order.getDeliveryFee()));
                walletRepository.save(agentWallet);

                Transaction agentTx = Transaction.builder()
                        .wallet(agentWallet)
                        .amount(order.getDeliveryFee())
                        .transactionType(TransactionType.CREDIT)
                        .description("Payout for delivering Order #" + order.getId())
                        .build();
                transactionRepository.save(agentTx);
            } else {
                throw new BusinessException("Cannot mark as delivered: Order is not in DISPATCHED state.");
            }
        } 
        else if (newStatus == DeliveryStatus.RETURN_PICKED_UP) {
            if (order.getStatus() == OrderStatus.RETURN_PENDING) {
                assignment.setStatus(DeliveryStatus.RETURN_PICKED_UP);
                if (request.getNote() != null) {
                    assignment.setPickupNote("Return Pickup: " + request.getNote());
                }
            } else {
                throw new BusinessException("Cannot pick up return: Order is not in RETURN_PENDING state.");
            }
        } 
        else if (newStatus == DeliveryStatus.RETURNED) {
            if (assignment.getStatus() == DeliveryStatus.RETURN_PICKED_UP || assignment.getStatus() == DeliveryStatus.ASSIGNED) {
                assignment.setStatus(DeliveryStatus.RETURNED);
                assignment.setReturnedAt(LocalDateTime.now());
                if (request.getNote() != null) {
                    assignment.setDeliveryNote("Return Completed: " + request.getNote());
                }

                order.setStatus(OrderStatus.RETURNED);
                orderRepository.save(order);

                // Battery is now back in seller's inventory, status AVAILABLE
                Battery battery = order.getBattery();
                battery.setStatus(BatteryStatus.AVAILABLE);
                batteryRepository.save(battery);

                // Payout Return Delivery Fee to Delivery Partner (system-wide, or seller paid. For simplicity, we credit agent standard delivery fee as incentive)
                Wallet agentWallet = walletRepository.findByUserId(agentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Delivery partner wallet not found"));
                agentWallet.setBalance(agentWallet.getBalance().add(order.getDeliveryFee()));
                walletRepository.save(agentWallet);

                Transaction agentTx = Transaction.builder()
                        .wallet(agentWallet)
                        .amount(order.getDeliveryFee())
                        .transactionType(TransactionType.CREDIT)
                        .description("Payout for returning Battery from Order #" + order.getId())
                        .build();
                transactionRepository.save(agentTx);
            } else {
                throw new BusinessException("Cannot mark return completed unless return is claimed/picked up.");
            }
        }

        deliveryAssignmentRepository.save(assignment);
        DeliveryResponse response = toResponse(assignment);
        broadcastUpdate(order.getId(), response);
        return response;
    }

    /**
     * Updates the delivery agent's location in real-time.
     */
    @Transactional
    public DeliveryResponse updateLocation(Long agentId, Long assignmentId, Double latitude, Double longitude) {
        DeliveryAssignment assignment = deliveryAssignmentRepository.findByIdAndDeliveryAgentId(assignmentId, agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery assignment not found"));

        assignment.setCurrentLatitude(latitude);
        assignment.setCurrentLongitude(longitude);
        deliveryAssignmentRepository.save(assignment);

        DeliveryResponse response = toResponse(assignment);
        broadcastUpdate(assignment.getOrder().getId(), response);
        return response;
    }

    private void broadcastUpdate(Long orderId, DeliveryResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            trackingWebSocketHandler.broadcast(orderId.toString(), json);
        } catch (Exception e) {
            // Ignore mapping/broadcast errors
        }
    }

    private AvailablePickupResponse mapToAvailablePickup(Order order, boolean isReturn) {
        Double sLat = order.getSeller().getLatitude();
        Double sLon = order.getSeller().getLongitude();
        Double bLat = order.getDeliveryLatitude() != null ? order.getDeliveryLatitude() : order.getBuyer().getLatitude();
        Double bLon = order.getDeliveryLongitude() != null ? order.getDeliveryLongitude() : order.getBuyer().getLongitude();

        double distance = 0.0;
        if (sLat != null && sLon != null && bLat != null && bLon != null) {
            distance = calculateDistance(sLat, sLon, bLat, bLon);
        }

        return AvailablePickupResponse.builder()
                .orderId(order.getId())
                .orderStatus(order.getStatus())
                .batteryName(order.getBattery().getName())
                .serialNumber(order.getBattery().getSerialNumber())
                .energyAmountKwh(order.getEnergyAmountKwh())
                .totalAmount(order.getTotalAmount())
                .deliveryFee(order.getDeliveryFee())
                .sellerName(order.getSeller().getFullName())
                .sellerPhone(order.getSeller().getPhone())
                .sellerLatitude(sLat)
                .sellerLongitude(sLon)
                .buyerName(order.getBuyer().getFullName())
                .buyerPhone(order.getBuyer().getPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryLatitude(bLat)
                .deliveryLongitude(bLon)
                .distanceKm(distance)
                .build();
    }

    private DeliveryResponse toResponse(DeliveryAssignment da) {
        User agent = da.getDeliveryAgent();
        Order order = da.getOrder();

        return DeliveryResponse.builder()
                .assignmentId(da.getId())
                .orderId(order.getId())
                .orderStatus(order.getStatus())
                .batteryName(order.getBattery().getName())
                .serialNumber(order.getBattery().getSerialNumber())
                .energyAmountKwh(order.getEnergyAmountKwh())
                .totalAmount(order.getTotalAmount())
                .buyerName(order.getBuyer().getFullName())
                .buyerPhone(order.getBuyer().getPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                .sellerName(order.getSeller().getFullName())
                .sellerPhone(order.getSeller().getPhone())
                .sellerLatitude(order.getSeller().getLatitude())
                .sellerLongitude(order.getSeller().getLongitude())
                .deliveryStatus(da.getStatus())
                .agentId(agent != null ? agent.getId() : null)
                .agentName(agent != null ? agent.getFullName() : null)
                .pickupNote(da.getPickupNote())
                .deliveryNote(da.getDeliveryNote())
                .currentLatitude(da.getCurrentLatitude())
                .currentLongitude(da.getCurrentLongitude())
                .pickedUpAt(da.getPickedUpAt())
                .deliveredAt(da.getDeliveredAt())
                .returnedAt(da.getReturnedAt())
                .createdAt(da.getCreatedAt())
                .build();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of Earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
