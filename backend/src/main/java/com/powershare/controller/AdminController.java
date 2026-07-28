package com.powershare.controller;

import com.powershare.dto.AdminStatsResponse;
import com.powershare.dto.OrderResponse;
import com.powershare.dto.UserProfileResponse;
import com.powershare.entity.*;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.*;
import com.powershare.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        List<User> allUsers = userRepository.findAll();
        List<Order> allOrders = orderRepository.findAll();

        long totalSellers = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_SELLER).count();
        long totalBuyers = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_BUYER).count();
        long totalUnverifiedUsers = allUsers.stream().filter(u -> !u.isVerified() && u.getRole() != Role.ROLE_ADMIN).count();

        double totalEnergyTransferredKwh = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .mapToDouble(Order::getEnergyAmountKwh)
                .sum();

        BigDecimal totalFinancialThroughput = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal activeEscrowAmount = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING || o.getStatus() == OrderStatus.ACCEPTED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrdersCount = allOrders.size();

        AdminStatsResponse stats = AdminStatsResponse.builder()
                .totalSellers(totalSellers)
                .totalBuyers(totalBuyers)
                .totalUnverifiedUsers(totalUnverifiedUsers)
                .totalEnergyTransferredKwh(totalEnergyTransferredKwh)
                .totalFinancialThroughput(totalFinancialThroughput)
                .activeEscrowAmount(activeEscrowAmount)
                .totalOrdersCount(totalOrdersCount)
                .build();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getUsers() {
        List<UserProfileResponse> users = userRepository.findAll().stream()
                .map(this::mapToUserProfileResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}/verify")
    public ResponseEntity<UserProfileResponse> verifyUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "true") boolean verified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setVerified(verified);
        userRepository.save(user);
        return ResponseEntity.ok(mapToUserProfileResponse(user));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getOrders() {
        List<OrderResponse> orders = orderRepository.findAll().stream()
                .map(orderService::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .verified(user.isVerified())
                .phone(user.getPhone())
                .address(user.getAddress())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
