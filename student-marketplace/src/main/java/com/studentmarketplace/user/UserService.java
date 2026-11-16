package com.studentmarketplace.user;

import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.common.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return UserResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(Pageable pageable) {
        return PageResponse.of(users.findAll(pageable).map(UserResponse::from));
    }

    /** Administrators switch accounts on and off instead of deleting them, so listings and purchases keep their owner. */
    @Transactional
    public UserResponse setActive(Long actingAdminId, Long userId, boolean active) {
        if (actingAdminId.equals(userId) && !active) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        User user = find(userId);
        user.setActive(active);
        return UserResponse.from(user);
    }

    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("User " + id + " not found"));
    }
}
