package com.studentmarketplace.admin;

import com.studentmarketplace.category.CategoryDtos;
import com.studentmarketplace.category.CategoryService;
import com.studentmarketplace.common.PageResponse;
import com.studentmarketplace.purchase.PurchaseResponse;
import com.studentmarketplace.purchase.PurchaseService;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.stale.StaleJobResult;
import com.studentmarketplace.stale.StaleListingService;
import com.studentmarketplace.user.UserResponse;
import com.studentmarketplace.user.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Everything the administrator can do. URL rule in SecurityConfig plus @PreAuthorize as a second lock. */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService users;
    private final CategoryService categories;
    private final ReportService reports;
    private final StaleListingService staleJob;
    private final PurchaseService purchases;

    public AdminController(UserService users, CategoryService categories, ReportService reports,
                           StaleListingService staleJob, PurchaseService purchases) {
        this.users = users;
        this.categories = categories;
        this.reports = reports;
        this.staleJob = staleJob;
        this.purchases = purchases;
    }

    // ----- users -----

    @GetMapping("/users")
    public PageResponse<UserResponse> users(Pageable pageable) {
        return users.list(pageable);
    }

    @PatchMapping("/users/{id}/active")
    public UserResponse setUserActive(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable Long id,
                                      @Valid @RequestBody CategoryDtos.ActiveRequest request) {
        return users.setActive(me.id(), id, request.active());
    }

    // ----- categories -----

    @GetMapping("/categories")
    public List<CategoryDtos.Response> allCategories() {
        return categories.listAll();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDtos.Response createCategory(@Valid @RequestBody CategoryDtos.Request request) {
        return categories.create(request);
    }

    @PutMapping("/categories/{id}")
    public CategoryDtos.Response updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryDtos.Request request) {
        return categories.update(id, request);
    }

    @PatchMapping("/categories/{id}/active")
    public CategoryDtos.Response setCategoryActive(@PathVariable Long id,
                                                   @Valid @RequestBody CategoryDtos.ActiveRequest request) {
        return categories.setActive(id, request.active());
    }

    // ----- information for decisions -----

    /** Available listings not updated for more than {days} days (default 30). */
    @GetMapping("/reports/stale-listings")
    public List<StaleListingRow> staleListings(@RequestParam(required = false) Integer days) {
        return reports.staleListings(days);
    }

    @GetMapping("/reports/summary")
    public SummaryResponse summary() {
        return reports.summary();
    }

    @GetMapping("/purchases")
    public PageResponse<PurchaseResponse> allPurchases(Pageable pageable) {
        return purchases.all(pageable);
    }

    /** Runs the nightly job now (remind at 30 days, hide at 37 days). */
    @PostMapping("/jobs/stale-listings")
    public StaleJobResult runStaleJob() {
        return staleJob.runOnce();
    }
}
