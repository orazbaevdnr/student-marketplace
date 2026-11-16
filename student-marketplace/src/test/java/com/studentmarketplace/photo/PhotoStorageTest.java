package com.studentmarketplace.photo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PhotoStorageTest {

    @Test
    void recognisesImagesByTheirFirstBytes() {
        assertEquals("jpg", PhotoStorage.detectExtension(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0}));
        assertEquals("png", PhotoStorage.detectExtension(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}));
        assertEquals("webp", PhotoStorage.detectExtension(
                new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'}));
    }

    @Test
    void rejectsEverythingElse() {
        assertNull(PhotoStorage.detectExtension("<script>alert(1)</script>".getBytes()));
        assertNull(PhotoStorage.detectExtension(new byte[]{'G', 'I', 'F', '8', '9', 'a'}));
        assertNull(PhotoStorage.detectExtension(new byte[0]));
    }
}
