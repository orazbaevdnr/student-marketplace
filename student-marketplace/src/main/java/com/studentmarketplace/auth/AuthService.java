package com.studentmarketplace.auth;

import com.studentmarketplace.auth.AuthDtos.AuthResponse;
import com.studentmarketplace.auth.AuthDtos.LoginRequest;
import com.studentmarketplace.auth.AuthDtos.RegisterRequest;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.UnauthorizedException;
import com.studentmarketplace.config.AppProperties;
import com.studentmarketplace.security.JwtService;
import com.studentmarketplace.user.Role;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import com.studentmarketplace.user.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;
    private final Clock clock;
    /** Compared against when the e-mail is unknown, so a missing account and a wrong password take the same time. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AppProperties props, Clock clock) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
        this.clock = clock;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        return response(registerUser(req.email(), req.password(), req.displayName()));
    }

    @Transactional
    public User registerUser(String email, String password, String displayName) {
        String normalized = normalize(email);
        String domain = props.allowedEmailDomain();
        if (domain != null && !domain.isBlank() && !normalized.endsWith("@" + domain.trim().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Registration requires a university e-mail ending with @" + domain.trim());
        }
        if (users.existsByUniversityEmail(normalized)) {
            throw new ConflictException("This e-mail is already registered");
        }
        return users.save(new User(normalized, encoder.encode(password), displayName.trim(),
                Role.STUDENT, clock.instant()));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        return response(loginUser(req.email(), req.password()));
    }

    @Transactional(readOnly = true)
    public User loginUser(String email, String password) {
        User user = users.findByUniversityEmail(normalize(email)).orElse(null);
        String hash = user == null ? dummyHash : user.getPasswordHash();
        boolean passwordOk = encoder.matches(password, hash);
        if (user == null || !passwordOk || !user.isActive()) {
            throw new UnauthorizedException("Wrong e-mail or password");
        }
        return user;
    }

    public AuthResponse response(User user) {
        return new AuthResponse(jwt.generate(user), "Bearer", jwt.ttlSeconds(), UserResponse.from(user));
    }

    public String tokenFor(User user) {
        return jwt.generate(user);
    }

    public long ttlSeconds() {
        return jwt.ttlSeconds();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
