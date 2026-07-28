package com.powershare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "batteries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Battery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotNull
    @Column(name = "capacity_kwh", nullable = false)
    private Double capacityKwh;

    @NotBlank
    @Column(name = "battery_type", nullable = false)
    private String batteryType;

    @NotNull
    @Column(name = "available_energy_kwh", nullable = false)
    private Double availableEnergyKwh;

    @NotNull
    @Column(name = "health_rating", nullable = false)
    private Double healthRating; // 0.0 to 100.0 (percentage)

    @NotBlank
    @Column(name = "serial_number", unique = true, nullable = false)
    private String serialNumber;

    @Column(name = "image_url")
    private String imageUrl;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BatteryStatus status = BatteryStatus.AVAILABLE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = BatteryStatus.AVAILABLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
