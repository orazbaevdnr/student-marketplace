package com.studentmarketplace.photo;

import com.studentmarketplace.photo.PhotoService.PhotoContent;
import com.studentmarketplace.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@RestController
@RequestMapping("/api/listings/{listingId}/photos")
@Tag(name = "Photos")
public class PhotoController {

    private final PhotoService photos;

    public PhotoController(PhotoService photos) {
        this.photos = photos;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    public PhotoResponse upload(@AuthenticationPrincipal AppUserPrincipal me,
                                @PathVariable String listingId,
                                @RequestParam("file") MultipartFile file) {
        return photos.add(me, listingId, file);
    }

    @DeleteMapping("/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    public void delete(@AuthenticationPrincipal AppUserPrincipal me,
                       @PathVariable String listingId, @PathVariable Long photoId) {
        photos.delete(me, listingId, photoId);
    }

    /** File names never change (they are random UUIDs), so browsers may cache the image for a day. */
    @GetMapping("/{photoId}/content")
    public ResponseEntity<Resource> content(@AuthenticationPrincipal AppUserPrincipal me,
                                            @PathVariable String listingId, @PathVariable Long photoId) {
        PhotoContent content = photos.content(me, listingId, photoId);
        return ResponseEntity.ok()
                .contentType(content.mediaType())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                .body(content.resource());
    }
}
