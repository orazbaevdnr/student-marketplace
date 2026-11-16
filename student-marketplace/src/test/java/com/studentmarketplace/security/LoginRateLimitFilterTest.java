package com.studentmarketplace.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/** The in-memory guard in front of the password endpoints. */
class LoginRateLimitFilterTest {

    private static final String LOGIN = "/api/client/auth/login";

    @Test
    void blocksAfterTheLimitWithinOneMinute() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(2);

        assertEquals(200, call(filter, "POST", LOGIN, "10.0.0.1"));
        assertEquals(200, call(filter, "POST", LOGIN, "10.0.0.1"));

        MockHttpServletResponse blocked = responseOf(filter, "POST", LOGIN, "10.0.0.1");
        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
        assertNotNull(blocked.getContentAsString());
        assertEquals(true, blocked.getContentAsString().contains("Too Many"));
    }

    @Test
    void differentClientsDoNotShareTheBudget() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(1);

        assertEquals(200, call(filter, "POST", LOGIN, "10.0.0.1"));
        assertEquals(429, call(filter, "POST", LOGIN, "10.0.0.1"));
        assertEquals(200, call(filter, "POST", LOGIN, "10.0.0.2"));
    }

    @Test
    void onlyPasswordEndpointsAreLimited() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(1);

        assertEquals(200, call(filter, "POST", LOGIN, "10.0.0.3"));
        assertEquals(429, call(filter, "POST", LOGIN, "10.0.0.3"));
        // a GET, another POST path and the register endpoint on a fresh IP are not affected
        assertEquals(200, call(filter, "GET", LOGIN, "10.0.0.4"));
        assertEquals(200, call(filter, "POST", "/api/client/listings", "10.0.0.4"));
        assertEquals(200, call(filter, "POST", "/api/client/auth/register", "10.0.0.4"));
        assertEquals(429, call(filter, "POST", "/api/client/auth/register", "10.0.0.4"));
    }

    private static int call(LoginRateLimitFilter filter, String method, String path, String ip) throws Exception {
        return responseOf(filter, method, path, ip).getStatus();
    }

    private static MockHttpServletResponse responseOf(LoginRateLimitFilter filter, String method, String path, String ip)
            throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
