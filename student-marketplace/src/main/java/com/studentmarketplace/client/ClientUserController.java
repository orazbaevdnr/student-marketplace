package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.FavoriteState;
import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.client.ClientDtos.UserDto;
import com.studentmarketplace.client.ClientDtos.UserPatch;
import com.studentmarketplace.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Profile, "my listings" and favorites in the shape of API_CONTRACT.md. {userId} may also be "me". */
@RestController
@RequestMapping("/api/client/users/{userId}")
@Tag(name = "Frontend contract: users and favorites")
@SecurityRequirement(name = "bearerAuth")
public class ClientUserController {

    private final ClientUserService users;
    private final ClientFavoriteService favorites;

    public ClientUserController(ClientUserService users, ClientFavoriteService favorites) {
        this.users = users;
        this.favorites = favorites;
    }

    @GetMapping
    public UserDto get(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId) {
        return users.get(me, userId);
    }

    @PatchMapping
    public UserDto patch(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId,
                         @Valid @RequestBody UserPatch patch) {
        return users.patch(me, userId, patch);
    }

    @GetMapping("/listings")
    public List<ListingDto> listings(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId) {
        return users.listings(me, userId, ClientListingController.baseUrl());
    }

    @GetMapping("/favorites")
    public List<ListingDto> favorites(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId) {
        return favorites.list(me, userId, ClientListingController.baseUrl());
    }

    @GetMapping("/favorites/{listingId}")
    public FavoriteState isFavorite(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId,
                                    @PathVariable String listingId) {
        return favorites.isFavorite(me, userId, listingId);
    }

    @PostMapping("/favorites/{listingId}/toggle")
    public FavoriteState toggle(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String userId,
                                @PathVariable String listingId) {
        return favorites.toggle(me, userId, listingId);
    }
}
