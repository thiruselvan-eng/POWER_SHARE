package com.powershare.dto;

import com.powershare.entity.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private boolean verified;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
}
