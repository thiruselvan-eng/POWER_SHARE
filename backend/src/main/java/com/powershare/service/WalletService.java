package com.powershare.service;

import com.powershare.dto.TransactionResponse;
import com.powershare.dto.WalletResponse;
import com.powershare.entity.*;
import com.powershare.exception.BusinessException;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.TransactionRepository;
import com.powershare.repository.UserRepository;
import com.powershare.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Handles all wallet operations: balance inquiry, deposit, withdrawal, and ledger history.
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public WalletResponse getWalletByUserId(Long userId) {
        Wallet wallet = findWallet(userId);
        return toWalletResponse(wallet);
    }

    @Transactional
    public WalletResponse deposit(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Deposit amount must be greater than zero.");
        }
        Wallet wallet = findWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        recordTransaction(wallet, amount, TransactionType.DEPOSIT, "Wallet top-up");
        return toWalletResponse(wallet);
    }

    @Transactional
    public WalletResponse withdraw(Long userId, BigDecimal amount) {
        Wallet wallet = findWallet(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient wallet balance.");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        recordTransaction(wallet, amount, TransactionType.WITHDRAWAL, "Withdrawal to bank");
        return toWalletResponse(wallet);
    }

    public List<TransactionResponse> getTransactionHistory(Long userId) {
        Wallet wallet = findWallet(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());
    }

    // --- Internal helpers ---

    private Wallet findWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user ID: " + userId));
    }

    private void recordTransaction(Wallet wallet, BigDecimal amount,
                                   TransactionType type, String description) {
        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .transactionType(type)
                .description(description)
                .build();
        transactionRepository.save(tx);
    }

    private WalletResponse toWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private TransactionResponse toTransactionResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .amount(tx.getAmount())
                .transactionType(tx.getTransactionType())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
