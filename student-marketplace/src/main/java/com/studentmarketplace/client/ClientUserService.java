package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.client.ClientDtos.UserDto;
import com.studentmarketplace.client.ClientDtos.UserPatch;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingSpecifications;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/** Profile endpoints of the frontend contract. The {userId} in a URL may be "me" or the numeric user id. */
@Service
public class ClientUserService {

    private static final int MAX_USER_LISTINGS = 200;

    private final UserRepository users;
    private final ListingRepository listings;
    private final ClientListingService listingService;

    public ClientUserService(UserRepository users, ListingRepository listings, ClientListingService listingService) {
        this.users = users;
        this.listings = listings;
        this.listingService = listingService;
    }

    /** Everyone logged in can see a profile; the e-mail only the user and administrators see. */
    @Transactional(readOnly = true)
    public UserDto get(AppUserPrincipal me, String userId) {
        User user = resolve(me, userId);
        return ClientMapper.user(user, me.id().equals(user.getId()) || me.isAdmin());
    }

    @Transactional
    public UserDto patch(AppUserPrincipal me, String userId, UserPatch patch) {
        User user = requireSelf(me, userId);
        if (patch.name() != null && patch.name().isBlank()) {
            throw new BadRequestException("name must not be empty");
        }
        user.updateProfile(patch.name() == null ? null : patch.name().trim(), patch.faculty(), patch.year(),
                patch.telegram());
        return ClientMapper.user(user, true);
    }

    /** Own profile: all listings in every status. Someone else's profile: only active listings. */
    @Transactional(readOnly = true)
    public List<ListingDto> listings(AppUserPrincipal me, String userId, String baseUrl) {
        User user = resolve(me, userId);
        boolean manager = me.isAdmin() || me.id().equals(user.getId());
        Set<ListingStatus> statuses = manager ? null : Set.of(ListingStatus.AVAILABLE);
        List<Listing> found = listings.findAll(
                ListingSpecifications.filter(null, null, null, null, user.getId(), statuses),
                PageRequest.of(0, MAX_USER_LISTINGS,
                        Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")))).getContent();
        return listingService.assemble(found, true, baseUrl);
    }

    User resolve(AppUserPrincipal me, String userId) {
        if ("me".equals(userId)) {
            return users.findById(me.id()).orElseThrow(() -> new NotFoundException("User not found"));
        }
        if (!userId.isEmpty() && userId.length() <= 18 && userId.chars().allMatch(Character::isDigit)) {
            return users.findById(Long.valueOf(userId))
                    .orElseThrow(() -> new NotFoundException("User " + userId + " not found"));
        }
        throw new NotFoundException("User " + userId + " not found");
    }

    User requireSelf(AppUserPrincipal me, String userId) {
        User user = resolve(me, userId);
        if (!user.getId().equals(me.id())) {
            throw new ForbiddenException("You can only change your own data");
        }
        return user;
    }
}
