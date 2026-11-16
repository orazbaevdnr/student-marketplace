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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The /api/client layer that matches the frontend's API_CONTRACT.md. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClientApiTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;
    /** 1x1 transparent PNG */
    private static final String PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    @Test
    void listingLifecycleInContractFormat() throws Exception {
        String seller = register("seller");
        String buyer = register("buyer");

        Map<String, Object> body = Map.of("title", "Calculus textbook", "description", "Good shape", "price", 4500,
                "category", "textbooks", "condition", "good", "images", List.of(PNG), "contact", "@seller_tg");
        MvcResult created = mvc.perform(post("/api/client/listings").contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("textbooks"))
                .andExpect(jsonPath("$.condition").value("good"))
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.images.length()").value(1))
                .andReturn();
        JsonNode listing = om.readTree(created.getResponse().getContentAsString());
        String id = listing.get("id").asText();
        assertTrue(listing.get("images").get(0).asText().startsWith("http"), "image URL must be absolute");

        // public catalog: no token, contact hidden, page format 1-indexed
        mvc.perform(get("/api/client/listings").param("q", "Calculus").param("category", "textbooks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(12))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].contact").doesNotExist());

        // logged in: contact visible
        mvc.perform(get("/api/client/listings/" + id).header("Authorization", bearer(buyer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contact").value("@seller_tg"));

        // somebody else cannot change it
        mvc.perform(put("/api/client/listings/" + id).contentType(JSON)
                        .header("Authorization", bearer(buyer)).content(om.writeValueAsString(body)))
                .andExpect(status().isForbidden());

        // seller changes the price and keeps the old picture (by its URL), adds a new one
        String keptUrl = listing.get("images").get(0).asText();
        Map<String, Object> changed = Map.of("title", "Calculus textbook", "price", 4000, "category", "textbooks",
                "condition", "good", "images", List.of(keptUrl, PNG));
        mvc.perform(put("/api/client/listings/" + id).contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(changed)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(4000))
                .andExpect(jsonPath("$.images.length()").value(2));

        // mark sold outside the app; afterwards it is gone from the catalog and cannot be changed
        mvc.perform(patch("/api/client/listings/" + id + "/status").contentType(JSON)
                        .header("Authorization", bearer(seller)).content("{\"status\":\"sold\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("sold"));
        mvc.perform(get("/api/client/listings").param("q", "Calculus"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(put("/api/client/listings/" + id).contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(changed)))
                .andExpect(status().isConflict());
    }

    @Test
    void validationAndImageRules() throws Exception {
        String seller = register("val");
        Map<String, Object> badCategory = Map.of("title", "Something", "price", 100, "category", "nope",
                "condition", "good");
        mvc.perform(post("/api/client/listings").contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(badCategory)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        Map<String, Object> externalImage = Map.of("title", "Something", "price", 100, "category", "other",
                "condition", "new", "images", List.of("https://example.com/a.png"));
        mvc.perform(post("/api/client/listings").contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(externalImage)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/client/listings").contentType(JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void favoritesAndProfile() throws Exception {
        String seller = register("fseller");
        String fan = register("fan");
        Map<String, Object> body = Map.of("title", "Desk lamp", "price", 1500, "category", "dorm_home",
                "condition", "like_new");
        String id = om.readTree(mvc.perform(post("/api/client/listings").contentType(JSON)
                        .header("Authorization", bearer(seller)).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(post("/api/client/users/me/favorites/" + id + "/toggle").header("Authorization", bearer(fan)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isFavorite").value(true));
        mvc.perform(get("/api/client/users/me/favorites/" + id).header("Authorization", bearer(fan)))
                .andExpect(jsonPath("$.isFavorite").value(true));
        mvc.perform(get("/api/client/users/me/favorites").header("Authorization", bearer(fan)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(post("/api/client/users/me/favorites/" + id + "/toggle").header("Authorization", bearer(fan)))
                .andExpect(jsonPath("$.isFavorite").value(false));

        // profile
        mvc.perform(patch("/api/client/users/me").contentType(JSON).header("Authorization", bearer(fan))
                        .content("{\"faculty\":\"IT\",\"year\":3,\"telegram\":\"@fan\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faculty").value("IT"))
                .andExpect(jsonPath("$.year").value(3));

        // another user's profile: visible, but without e-mail and not editable; own listings list works
        String sellerId = om.readTree(mvc.perform(get("/api/client/users/me").header("Authorization", bearer(seller)))
                .andReturn().getResponse().getContentAsString()).get("id").asText();
        mvc.perform(get("/api/client/users/" + sellerId).header("Authorization", bearer(fan)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").doesNotExist());
        mvc.perform(patch("/api/client/users/" + sellerId).contentType(JSON).header("Authorization", bearer(fan))
                        .content("{\"faculty\":\"X\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/client/users/" + sellerId + "/listings").header("Authorization", bearer(fan)))
                .andExpect(jsonPath("$.length()").value(1));

        // owner deletes the listing
        mvc.perform(delete("/api/client/listings/" + id).header("Authorization", bearer(seller)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void jwtRegisterLoginAndMe() throws Exception {
        String email = "jwt-" + UUID.randomUUID().toString().substring(0, 8) + "@kbtu.kz";
        MvcResult created = mvc.perform(post("/api/client/auth/register").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123",
                                "name", "Jwt Student"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.emailVerified").value(true))
                .andReturn();
        String token = om.readTree(created.getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/client/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.name").value("Jwt Student"));

        mvc.perform(post("/api/client/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "Password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        mvc.perform(post("/api/client/auth/login").contentType(JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/client/auth/me")).andExpect(status().isUnauthorized());
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
