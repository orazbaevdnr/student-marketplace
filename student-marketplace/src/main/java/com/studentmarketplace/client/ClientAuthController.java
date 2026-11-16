package com.studentmarketplace.client;

import com.studentmarketplace.auth.AuthService;
import com.studentmarketplace.client.ClientDtos.AuthResponse;
import com.studentmarketplace.client.ClientDtos.LoginRequest;
import com.studentmarketplace.client.ClientDtos.RegisterRequest;
import com.studentmarketplace.client.ClientDtos.UserDto;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Email/password JWT login in the JSON shape the React app expects. */
@RestController
@RequestMapping("/api/client/auth")
@Tag(name = "Frontend contract: auth")
public class ClientAuthController {

    private final AuthService auth;
    private final UserRepository users;

    public ClientAuthController(AuthService auth, UserRepository users) {
        this.auth = auth;
        this.users = users;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        User user = auth.registerUser(request.email(), request.password(), request.name());
        return toResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return toResponse(auth.loginUser(request.email(), request.password()));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public UserDto me(@AuthenticationPrincipal AppUserPrincipal me) {
        User user = users.findById(me.id()).orElseThrow(() -> new NotFoundException("User not found"));
        return ClientMapper.user(user, true);
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(auth.tokenFor(user), "Bearer", auth.ttlSeconds(), ClientMapper.user(user, true));
    }
}
