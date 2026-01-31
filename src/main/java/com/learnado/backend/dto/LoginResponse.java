package com.learnado.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String message;
    private String userId;
    private String email;
    private String role;
}
