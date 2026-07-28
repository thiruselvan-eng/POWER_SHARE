package com.powershare.config;

import com.powershare.entity.*;
import com.powershare.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seeds demo accounts (Admin, Seller, Buyer) on startup.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BatteryRepository batteryRepository;
    private final EnergyListingRepository energyListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Admin ───────────────────────────────────────────────────────────
        upsertUser(
                "admin@powershare.com",
                "Root Platform Admin",
                "adminpassword",
                Role.ROLE_ADMIN,
                null, null, null, null,
                BigDecimal.ZERO
        );

        // ── 2. Seller ──────────────────────────────────────────────────────────
        User seller = upsertUser(
                "seller@powershare.com",
                "Solar Max Energy",
                "sellerpassword",
                Role.ROLE_SELLER,
                "+919876543210",
                "MG Road, Indiranagar, Bengaluru, Karnataka",
                12.9716,
                77.5946,
                BigDecimal.valueOf(1500.00)
        );

        // ── 3. Buyer ───────────────────────────────────────────────────────────
        upsertUser(
                "buyer@powershare.com",
                "John Resident",
                "buyerpassword",
                Role.ROLE_BUYER,
                "+919876543211",
                "Koramangala 5th Block, Bengaluru, Karnataka",
                12.9352,
                77.6245,
                BigDecimal.valueOf(5000.00)
        );

        // ── 4. Seed a sample battery + listing for the seller (once only) ──────
        if (!batteryRepository.findBySellerId(seller.getId()).isEmpty()) {
            log.info(">>> DataSeeder: demo accounts verified. Sample data already present — skipping battery seed.");
            return;
        }

        Battery battery = Battery.builder()
                .name("Tesla Powerwall 2")
                .batteryType("LiFePO4")
                .capacityKwh(13.5)
                .availableEnergyKwh(12.8)
                .healthRating(97.0)
                .serialNumber("PW-TSLA98124")
                .imageUrl("https://images.unsplash.com/photo-1558441719-6779b6869537?w=600&auto=format&fit=crop&q=80")
                .status(BatteryStatus.AVAILABLE)
                .seller(seller)
                .build();
        batteryRepository.save(battery);

        EnergyListing listing = EnergyListing.builder()
                .seller(seller)
                .battery(battery)
                .pricePerKwh(BigDecimal.valueOf(12.50))
                .minPurchaseKwh(2.0)
                .sellerLatitude(12.9716)
                .sellerLongitude(77.5946)
                .sellerAddress("MG Road, Indiranagar, Bengaluru, Karnataka")
                .sellerArea("Indiranagar")
                .sellerCity("Bengaluru")
                .sellerState("Karnataka")
                .sellerPincode("560038")
                .deliveryAvailable(true)
                .maxDeliveryDistanceKm(25.0)
                .deliveryChargePerKm(BigDecimal.valueOf(5.00))
                .estimatedDeliveryTime("1-2 hours")
                .description("High-performance Tesla Powerwall 2 battery cell package. Fully solar charged under strict safety configurations.")
                .sellerContact("+919876543210")
                .active(true)
                .build();
        energyListingRepository.save(listing);

        log.info(">>> DataSeeder: demo accounts and sample battery listing seeded successfully!");
    }

    private User upsertUser(
            String email,
            String fullName,
            String rawPassword,
            Role role,
            String phone,
            String address,
            Double latitude,
            Double longitude,
            BigDecimal initialBalance
    ) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .phone(phone)
                    .address(address)
                    .latitude(latitude)
                    .longitude(longitude)
                    .isVerified(true)
                    .build();
            user = userRepository.save(user);

            final Long userId = user.getId();
            if (walletRepository.findByUserId(userId).isEmpty()) {
                Wallet wallet = Wallet.builder()
                        .user(user)
                        .balance(initialBalance)
                        .currency("INR")
                        .build();
                walletRepository.save(wallet);
            }

            log.info(">>> DataSeeder: created demo user [{}] ({})", email, role);
            return user;
        });
    }
}
