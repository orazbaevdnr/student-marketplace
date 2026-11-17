package com.studentmarketplace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Reviews are stored in PostgreSQL, so every device and account sees the same feedback. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReviewsApiTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    @Test
    void reviewLifecycleAndSellerStats() throws Exception {
        String seller = register("rseller");
        String reviewer = register("reviewer");
        String stranger = register("stranger");

        String listingId = createListing(seller, "Calculus 8th Edition");
        String sellerId = sellerIdOf(seller);

        Map<String, Object> review = Map.of(
                "listingId", listingId,
                "rating", 5,
                "tags", List.of("as_described", "fast_reply", "friendly"),
                "comment", "Book was exactly as described.");

        // self-review is rejected
        mvc.perform(post("/api/client/reviews").contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(review)))
                .andExpect(status().isBadRequest());

        MvcResult created = mvc.perform(post("/api/client/reviews").contentType(JSON)
                        .header("Authorization", bearer(reviewer)).content(om.writeValueAsString(review)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.listingTitle").value("Calculus 8th Edition"))
                .andExpect(jsonPath("$.reviewerName").value("Client reviewer"))
                .andExpect(jsonPath("$.tags.length()").value(3))
                .andReturn();
        String reviewId = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        // the same review is visible to everyone
        mvc.perform(get("/api/client/reviews").header("Authorization", bearer(stranger)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(reviewId))
                .andExpect(jsonPath("$.items[0].sellerId").value(sellerId));

        mvc.perform(get("/api/client/reviews").param("sellerId", sellerId)
                        .header("Authorization", bearer(stranger)))
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/client/sellers/" + sellerId + "/reviews")
                        .header("Authorization", bearer(stranger)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // seller profile: ratings and badges are computed by the backend
        mvc.perform(get("/api/client/sellers/" + sellerId + "/profile")
                        .header("Authorization", bearer(reviewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.reviewCount").value(1))
                .andExpect(jsonPath("$.stats.averageRating").value(5.0))
                .andExpect(jsonPath("$.stats.distribution.5").value(1))
                .andExpect(jsonPath("$.stats.badges[0]").value("new_seller"))
                .andExpect(jsonPath("$.activeListingsCount").value(1))
                .andExpect(jsonPath("$.soldCount").value(0));

        // one review per listing
        mvc.perform(post("/api/client/reviews").contentType(JSON)
                        .header("Authorization", bearer(reviewer)).content(om.writeValueAsString(review)))
                .andExpect(status().isConflict());

        // unknown tags are rejected
        mvc.perform(post("/api/client/reviews").contentType(JSON)
                        .header("Authorization", bearer(stranger))
                        .content(om.writeValueAsString(Map.of("listingId", listingId, "rating", 4,
                                "tags", List.of("made_up"), "comment", "x"))))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/client/reviews/mine").param("listingId", listingId)
                        .header("Authorization", bearer(reviewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewId));

        // only the author can edit or delete
        mvc.perform(patch("/api/client/reviews/" + reviewId).contentType(JSON)
                        .header("Authorization", bearer(stranger)).content("{\"rating\":1}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/client/reviews/" + reviewId).contentType(JSON)
                        .header("Authorization", bearer(reviewer))
                        .content("{\"rating\":4,\"tags\":[\"on_time\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.tags[0]").value("on_time"));

        mvc.perform(get("/api/client/sellers/" + sellerId + "/profile")
                        .header("Authorization", bearer(reviewer)))
                .andExpect(jsonPath("$.stats.averageRating").value(4.0));

        mvc.perform(delete("/api/client/reviews/" + reviewId).header("Authorization", bearer(stranger)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/client/reviews/" + reviewId).header("Authorization", bearer(reviewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mvc.perform(get("/api/client/reviews").header("Authorization", bearer(reviewer)))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void reviewsRequireLogin() throws Exception {
        mvc.perform(get("/api/client/reviews")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/client/reviews").contentType(JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private String createListing(String token, String title) throws Exception {
        MvcResult r = mvc.perform(post("/api/client/listings").contentType(JSON)
                        .header("Authorization", bearer(token))
                        .content(om.writeValueAsString(Map.of("title", title, "price", 4500,
                                "category", "textbooks", "condition", "good"))))
                .andExpect(status().isCreated()).andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private String sellerIdOf(String token) throws Exception {
        MvcResult r = mvc.perform(get("/api/client/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andReturn();
        JsonNode me = om.readTree(r.getResponse().getContentAsString());
        return me.get("id").asText();
    }

    private String register(String prefix) throws Exception {
        String email = prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@kbtu.kz";
        MvcResult r = mvc.perform(post("/api/client/auth/register").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123",
                                "name", "Client " + prefix))))
                .andExpect(status().isCreated()).andReturn();
        return om.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
