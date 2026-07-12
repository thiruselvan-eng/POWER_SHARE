package com.powershare.controller;

import com.powershare.dto.AvailablePickupResponse;
import com.powershare.dto.DeliveryResponse;
import com.powershare.dto.DeliveryStatusUpdateRequest;
import com.powershare.entity.DeliveryStatus;
import com.powershare.repository.UserRepository;
import com.powershare.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final UserRepository userRepository;

    @GetMapping("/available")
    public ResponseEntity<List<AvailablePickupResponse>> getAvailablePickups() {
        return ResponseEntity.ok(deliveryService.getAvailablePickups());
    }

    @GetMapping("/assignments")
    public ResponseEntity<List<DeliveryResponse>> getMyAssignments(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long agentId = getUserId(userDetails);
        return ResponseEntity.ok(deliveryService.getAgentAssignments(agentId));
    }

    @PostMapping("/assignments/claim/{orderId}")
    public ResponseEntity<DeliveryResponse> claimOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long agentId = getUserId(userDetails);
        return ResponseEntity.ok(deliveryService.claimOrder(agentId, orderId));
    }

    @PutMapping("/assignments/{assignmentId}/status")
    public ResponseEntity<DeliveryResponse> updateStatus(
            @PathVariable Long assignmentId,
            @RequestParam DeliveryStatus status,
            @RequestBody DeliveryStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long agentId = getUserId(userDetails);
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(agentId, assignmentId, status, request));
    }

    @PutMapping("/assignments/{assignmentId}/location")
    public ResponseEntity<DeliveryResponse> updateLocation(
            @PathVariable Long assignmentId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long agentId = getUserId(userDetails);
        return ResponseEntity.ok(deliveryService.updateLocation(agentId, assignmentId, latitude, longitude));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
