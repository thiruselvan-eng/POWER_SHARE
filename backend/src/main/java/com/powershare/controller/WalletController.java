package com.powershare.controller;

import com.powershare.dto.TransactionResponse;
import com.powershare.dto.WalletResponse;
import com.powershare.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.powershare.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST controller for wallet operations (balance, deposit, withdraw, history).
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    /**
     * GET /api/wallet/balance
     * Return current wallet balance for the authenticated user.
     */
    @GetMapping("/balance")
    public ResponseEntity<WalletResponse> getBalance(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    /**
     * POST /api/wallet/deposit?amount=50.00
     * Top up wallet with the given amount.
     */
    @PostMapping("/deposit")
    public ResponseEntity<WalletResponse> deposit(@AuthenticationPrincipal UserDetails userDetails,
                                                   @RequestParam BigDecimal amount) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.deposit(userId, amount));
    }

    /**
     * POST /api/wallet/withdraw?amount=20.00
     * Withdraw funds from wallet (must have sufficient balance).
     */
    @PostMapping("/withdraw")
    public ResponseEntity<WalletResponse> withdraw(@AuthenticationPrincipal UserDetails userDetails,
                                                    @RequestParam BigDecimal amount) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.withdraw(userId, amount));
    }

    /**
     * GET /api/wallet/transactions
     * Return full transaction history for the authenticated user.
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponse>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(walletService.getTransactionHistory(userId));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
