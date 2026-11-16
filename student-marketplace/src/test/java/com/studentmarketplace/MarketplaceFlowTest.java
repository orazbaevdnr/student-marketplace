package com.studentmarketplace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentmarketplace.stale.StaleJobResult;
import com.studentmarketplace.stale.StaleListingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end tests of the rules written in the Task 9 project plan, on an in-memory H2 database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceFlowTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;
    /** Same zone as app.zone, so "today" in the tests is the same day as "today" in the app. */
    private static final ZoneId ZONE = ZoneId.of("Asia/Almaty");

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    StaleListingService staleJob;

    // ------------------------------------------------------------------ registration and login

    @Test
    void registrationRequiresUniversityEmail() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", "someone@gmail.com",
                                "password", "Password123", "displayName", "Someone"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = email("dup");
        register(email);
        mvc.perform(post("/api/auth/register").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email.toUpperCase(),
                                "password", "Password123", "displayName", "Again"))))
                .andExpect(status().isConflict());
    }

    @Test
    void wrongPasswordGives401() throws Exception {
        String email = email("login");
        register(email);
        mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    // ------------------------------------------------------------------ access rules

    @Test
    void listingsRequireLoginAndAdminAreaRequiresAdmin() throws Exception {
        mvc.perform(get("/api/listings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/categories")).andExpect(status().isOk());

        String student = register(email("student"));
        mvc.perform(get("/api/admin/reports/summary").header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());

        String admin = login("admin@kbtu.kz", "Admin12345!");
        mvc.perform(get("/api/admin/reports/summary").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingsByStatus.AVAILABLE").exists());
    }

    // ------------------------------------------------------------------ data rules

    @Test
    void priceMustBeAWholePositiveNumber() throws Exception {
        String seller = register(email("price"));
        long categoryId = firstCategory(seller);

        for (String badPrice : List.of("0", "-5", "\"12 000 tg\"", "12.5")) {
            mvc.perform(post("/api/listings").header("Authorization", bearer(seller)).contentType(JSON)
                            .content("{\"title\":\"Desk lamp\",\"priceKzt\":" + badPrice + ",\"categoryId\":" + categoryId + "}"))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/listings").header("Authorization", bearer(seller)).contentType(JSON)
                        .content("{\"title\":\"ab\",\"priceKzt\":1000,\"categoryId\":" + categoryId + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void listingGetsSystemIdAndStartsAvailable() throws Exception {
        String seller = register(email("create"));
        MvcResult result = createListingRaw(seller, "Linear Algebra textbook", 8000)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.matchesPattern("L-\\d+")))
                .andReturn();
        String id = om.readTree(result.getResponse().getContentAsString()).get("id").asText();
        assertEquals("/api/listings/" + id, result.getResponse().getHeader("Location"));
    }

    // ------------------------------------------------------------------ search

    @Test
    void buyersFindOnlyAvailableListingsByKeywordAndPrice() throws Exception {
        String seller = register(email("search"));
        String buyer = register(email("searcher"));
        String word = "Calculus" + UUID.randomUUID().toString().substring(0, 6);
        String cheap = createListing(seller, word + " cheap", 3000);
        createListing(seller, word + " expensive", 20000);

        mvc.perform(get("/api/listings").param("q", word).header("Authorization", bearer(buyer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        mvc.perform(get("/api/listings").param("q", word).param("maxPrice", "5000")
                        .header("Authorization", bearer(buyer)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(cheap));

        mvc.perform(patch("/api/listings/{id}/status", cheap).header("Authorization", bearer(seller)).contentType(JSON)
                        .content("{\"status\":\"RESERVED\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/listings").param("q", word).param("maxPrice", "5000")
                        .header("Authorization", bearer(buyer)))
                .andExpect(jsonPath("$.totalElements").value(0));

        mvc.perform(get("/api/listings").param("sort", "passwordHash").header("Authorization", bearer(buyer)))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ "a seller changes only his own listings"

    @Test
    void onlyTheSellerChangesAListing() throws Exception {
        String seller = register(email("owner"));
        String other = register(email("other"));
        long categoryId = firstCategory(seller);
        String id = createListing(seller, "Bicycle helmet", 5000);

        mvc.perform(put("/api/listings/{id}", id).header("Authorization", bearer(other)).contentType(JSON)
                        .content(listingJson("Hacked", 1, categoryId)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/listings/{id}", id).header("Authorization", bearer(other)))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/listings/{id}", id).header("Authorization", bearer(seller)).contentType(JSON)
                        .content(listingJson("Bicycle helmet (new price)", 4500, categoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priceKzt").value(4500));

        mvc.perform(patch("/api/listings/{id}/status", id).header("Authorization", bearer(seller)).contentType(JSON)
                        .content("{\"status\":\"SOLD\"}"))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ the purchase transaction

    @Test
    void purchaseMarksListingSoldAndOnlyOneBuyerWins() throws Exception {
        String seller = register(email("seller"));
        String buyer1 = register(email("buyer1"));
        String buyer2 = register(email("buyer2"));
        long categoryId = firstCategory(seller);
        String id = createListing(seller, "Scientific calculator", 12000);

        mvc.perform(post("/api/listings/{id}/purchase", id).header("Authorization", bearer(seller)))
                .andExpect(status().isBadRequest());                       // cannot buy own listing

        mvc.perform(post("/api/listings/{id}/purchase", id).header("Authorization", bearer(buyer1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.finalPriceKzt").value(12000))
                .andExpect(jsonPath("$.listingId").value(id));

        mvc.perform(post("/api/listings/{id}/purchase", id).header("Authorization", bearer(buyer2)))
                .andExpect(status().isConflict());                          // already sold

        mvc.perform(get("/api/listings/{id}", id).header("Authorization", bearer(buyer2)))
                .andExpect(jsonPath("$.status").value("SOLD"));

        mvc.perform(put("/api/listings/{id}", id).header("Authorization", bearer(seller)).contentType(JSON)
                        .content(listingJson("Changed after sale", 1, categoryId)))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/listings/{id}", id).header("Authorization", bearer(seller)))
                .andExpect(status().isConflict());                          // purchase history is kept

        mvc.perform(get("/api/purchases/mine").header("Authorization", bearer(buyer1)))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/purchases/sales").header("Authorization", bearer(seller)))
                .andExpect(jsonPath("$.content[0].listingId").value(id));
    }

    @Test
    void simultaneousPurchasesProduceExactlyOneSale() throws Exception {
        String seller = register(email("race-seller"));
        String buyer1 = register(email("race-b1"));
        String buyer2 = register(email("race-b2"));
        String id = createListing(seller, "Last concert ticket", 9000);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Callable<Integer> first = () -> buyWhenReady(start, id, buyer1);
            Callable<Integer> second = () -> buyWhenReady(start, id, buyer2);
            Future<Integer> f1 = pool.submit(first);
            Future<Integer> f2 = pool.submit(second);
            start.countDown();
            List<Integer> codes = new ArrayList<>(List.of(f1.get(), f2.get()));
            Collections.sort(codes);
            assertEquals(List.of(201, 409), codes);
        } finally {
            pool.shutdownNow();
        }
        Integer purchases = jdbc.queryForObject("select count(*) from purchases where listing_id = ?", Integer.class, id);
        assertEquals(1, purchases);
    }

    // ------------------------------------------------------------------ photos

    @Test
    void photosAreValidatedStoredAndServed() throws Exception {
        String seller = register(email("photo"));
        String other = register(email("photo-other"));
        String id = createListing(seller, "Desk lamp with photo", 2500);

        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MvcResult uploaded = mvc.perform(multipart("/api/listings/{id}/photos", id)
                        .file(new MockMultipartFile("file", "lamp.png", "image/png", png))
                        .header("Authorization", bearer(seller)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sortOrder").value(1))
                .andReturn();
        long photoId = om.readTree(uploaded.getResponse().getContentAsString()).get("id").asLong();

        // not an image, even though the client says so
        mvc.perform(multipart("/api/listings/{id}/photos", id)
                        .file(new MockMultipartFile("file", "evil.png", "image/png", "just text".getBytes()))
                        .header("Authorization", bearer(seller)))
                .andExpect(status().isBadRequest());

        // somebody else's listing
        mvc.perform(multipart("/api/listings/{id}/photos", id)
                        .file(new MockMultipartFile("file", "lamp.png", "image/png", png))
                        .header("Authorization", bearer(other)))
                .andExpect(status().isForbidden());

        // photos load in <img> tags, so no token is needed
        mvc.perform(get("/api/listings/{id}/photos/{p}/content", id, photoId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));

        mvc.perform(get("/api/listings").param("q", "Desk lamp with photo").header("Authorization", bearer(other)))
                .andExpect(jsonPath("$.content[0].mainPhotoId").value(photoId));

        mvc.perform(delete("/api/listings/{id}/photos/{p}", id, photoId).header("Authorization", bearer(seller)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/listings/{id}/photos/{p}/content", id, photoId))
                .andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ stale listings (30 / 37 days)

    @Test
    void staleListingsGetReminderThenAreHiddenUntilConfirmed() throws Exception {
        String seller = register(email("stale"));
        String buyer = register(email("stale-buyer"));
        String admin = login("admin@kbtu.kz", "Admin12345!");
        String reminded = createListing(seller, "Listing 31 days old", 1000);
        String hidden = createListing(seller, "Listing 40 days old", 1000);
        ageListing(reminded, 31);
        ageListing(hidden, 40);

        mvc.perform(get("/api/admin/reports/stale-listings").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.listingId=='" + hidden + "')]").exists())
                .andExpect(jsonPath("$[?(@.listingId=='" + reminded + "')]").exists());

        StaleJobResult result = staleJob.runOnce();
        assertTrue(result.hidden() >= 1);
        assertTrue(result.reminded() >= 1);
        assertNotNull(jdbc.queryForObject("select reminder_sent_on from listings where listing_id = ?",
                java.sql.Date.class, reminded));

        // the 31-day listing is still visible, the 40-day listing is hidden from buyers but not from its seller
        mvc.perform(get("/api/listings/{id}", reminded).header("Authorization", bearer(buyer))).andExpect(status().isOk());
        mvc.perform(get("/api/listings/{id}", hidden).header("Authorization", bearer(buyer))).andExpect(status().isNotFound());
        mvc.perform(get("/api/listings/{id}", hidden).header("Authorization", bearer(seller)))
                .andExpect(jsonPath("$.status").value("HIDDEN"));
        // a hidden listing cannot be bought either
        mvc.perform(post("/api/listings/{id}/purchase", hidden).header("Authorization", bearer(buyer)))
                .andExpect(status().isConflict());

        // the seller confirms: back to AVAILABLE and the clock restarts
        mvc.perform(post("/api/listings/{id}/confirm", hidden).header("Authorization", bearer(seller)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.lastUpdated").value(LocalDate.now(ZONE).toString()));
    }

    // ------------------------------------------------------------------ administrator

    @Test
    void administratorCanDeactivateAccountsAndManageCategories() throws Exception {
        String admin = login("admin@kbtu.kz", "Admin12345!");
        String email = email("banned");
        String token = register(email);
        long userId = om.readTree(mvc.perform(get("/api/users/me").header("Authorization", bearer(token)))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(patch("/api/admin/users/{id}/active", userId).header("Authorization", bearer(admin))
                        .contentType(JSON).content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123"))))
                .andExpect(status().isUnauthorized());
        // a token issued before the ban cannot create listings any more
        createListingRaw(token, "Should not work", 1000).andExpect(status().isForbidden());

        String name = "Category" + UUID.randomUUID().toString().substring(0, 6);
        mvc.perform(post("/api/admin/categories").header("Authorization", bearer(admin)).contentType(JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"test\"}"))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/admin/categories").header("Authorization", bearer(admin)).contentType(JSON)
                        .content("{\"name\":\"" + name.toUpperCase() + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/categories")).andExpect(jsonPath("$[?(@.name=='" + name + "')]").exists());
    }

    // ------------------------------------------------------------------ helpers

    private int buyWhenReady(CountDownLatch start, String listingId, String token) throws Exception {
        start.await();
        return mvc.perform(post("/api/listings/{id}/purchase", listingId).header("Authorization", bearer(token)))
                .andReturn().getResponse().getStatus();
    }

    private void ageListing(String id, int days) {
        LocalDate date = LocalDate.now(ZONE).minusDays(days);
        jdbc.update("update listings set created_at = ?, last_updated = ? where listing_id = ?", date, date, id);
    }

    private static String email(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@kbtu.kz";
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private String register(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123",
                                "displayName", "Test " + email.substring(0, 5)))))
                .andExpect(status().isCreated())
                .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private String login(String email, String password) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private long firstCategory(String token) throws Exception {
        JsonNode categories = om.readTree(mvc.perform(get("/api/categories"))
                .andReturn().getResponse().getContentAsString());
        return categories.get(0).get("id").asLong();
    }

    private String listingJson(String title, int price, long categoryId) throws Exception {
        return om.writeValueAsString(Map.of("title", title, "description", "Good condition",
                "priceKzt", price, "categoryId", categoryId));
    }

    private org.springframework.test.web.servlet.ResultActions createListingRaw(String token, String title, int price)
            throws Exception {
        return mvc.perform(post("/api/listings").header("Authorization", bearer(token)).contentType(JSON)
                .content(listingJson(title, price, firstCategory(token))));
    }

    private String createListing(String token, String title, int price) throws Exception {
        MvcResult r = createListingRaw(token, title, price).andExpect(status().isCreated()).andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }
}
