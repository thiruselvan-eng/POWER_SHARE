package com.powershare.config;

import com.powershare.entity.*;
import com.powershare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BatteryRepository batteryRepository;
    private final EnergyListingRepository energyListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // 1. Seed Admin
            User admin = User.builder()
                    .fullName("Root Platform Admin")
                    .email("admin@powershare.com")
                    .password(passwordEncoder.encode("adminpassword"))
                    .role(Role.ROLE_ADMIN)
                    .isVerified(true)
                    .build();
            userRepository.save(admin);
            createWallet(admin, BigDecimal.ZERO);

            // 2. Seed Seller
            User seller = User.builder()
                    .fullName("Solar Max Energy")
                    .email("seller@powershare.com")
                    .password(passwordEncoder.encode("sellerpassword"))
                    .role(Role.ROLE_SELLER)
                    .phone("+155502932")
                    .address("789 Sunny Boulevard, Los Angeles")
                    .latitude(34.0522)
                    .longitude(-118.2437)
                    .isVerified(true)
                    .build();
            userRepository.save(seller);
            createWallet(seller, BigDecimal.valueOf(150.00));

            // 3. Seed Buyer
            User buyer = User.builder()
                    .fullName("John Resident")
                    .email("buyer@powershare.com")
                    .password(passwordEncoder.encode("buyerpassword"))
                    .role(Role.ROLE_BUYER)
                    .phone("+155598103")
                    .address("123 Green Lane, Los Angeles")
                    .latitude(34.0620)
                    .longitude(-118.2500)
                    .isVerified(true)
                    .build();
            userRepository.save(buyer);
            createWallet(buyer, BigDecimal.valueOf(500.00)); // Pre-load with $500 for testing purchases

            // 4. Seed Delivery
            User delivery = User.builder()
                    .fullName("Green Courier Service")
                    .email("delivery@powershare.com")
                    .password(passwordEncoder.encode("deliverypassword"))
                    .role(Role.ROLE_DELIVERY)
                    .phone("+155510293")
                    .address("456 Depot Street, Los Angeles")
                    .latitude(34.0550)
                    .longitude(-118.2450)
                    .isVerified(true)
                    .build();
            userRepository.save(delivery);
            createWallet(delivery, BigDecimal.valueOf(50.00));

            // 5. Seed a Sample Battery for the Seller
            Battery battery = Battery.builder()
                    .name("Tesla Powerwall 2")
                    .capacityKwh(13.5)
                    .voltage(230.0)
                    .batteryType("Li-Ion")
                    .currentChargeKwh(12.8)
                    .healthRating(0.97)
                    .serialNumber("PW-TSLA98124")
                    .status(BatteryStatus.AVAILABLE)
                    .seller(seller)
                    .build();
            batteryRepository.save(battery);

            // 6. Seed a sample Energy Listing for the Battery
            EnergyListing listing = EnergyListing.builder()
                    .seller(seller)
                    .battery(battery)
                    .pricePerKwh(BigDecimal.valueOf(0.28))
                    .deliveryRadiusKm(15.0)
                    .description("High-performance Tesla Powerwall 2 battery cell package. Fully solar charged, ready to deliver.")
                    .active(true)
                    .build();
            energyListingRepository.save(listing);

            System.out.println(">>> DataSeeder: default accounts and experimental battery nodes loaded successfully!");
        }
    }

    private void createWallet(User user, BigDecimal initialBalance) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(initialBalance)
                .currency("USD")
                .build();
        walletRepository.save(wallet);
    }
}
