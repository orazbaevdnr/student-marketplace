package com.studentmarketplace.photo;

import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Keeps photo files on disk. The database stores only the relative path (LISTING_PHOTOS.file_path).
 * File names are generated here, so a user can never choose a path (no path traversal).
 */
@Component
public class PhotoStorage {

    private static final Logger log = LoggerFactory.getLogger(PhotoStorage.class);

    private final Path root;

    public PhotoStorage(AppProperties props) {
        this.root = Path.of(props.storage().dir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create photo directory " + root, e);
        }
    }

    /** Checks that the file really is a JPEG, PNG or WebP image (by its first bytes, not by its name) and saves it. */
    public String store(String listingId, MultipartFile file) {
        String extension;
        try (InputStream in = file.getInputStream()) {
            extension = detectExtension(in.readNBytes(12));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (extension == null) {
            throw new BadRequestException("Only JPEG, PNG and WebP images are accepted");
        }
        String relative = listingId + "/" + UUID.randomUUID() + "." + extension;
        Path target = resolve(relative);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save photo", e);
        }
        return relative;
    }

    /** Same as {@link #store} for images that arrive inside JSON (data URLs) instead of a multipart upload. */
    public String storeBytes(String listingId, byte[] data) {
        String extension = detectExtension(data.length > 12 ? java.util.Arrays.copyOf(data, 12) : data);
        if (extension == null) {
            throw new BadRequestException("Only JPEG, PNG and WebP images are accepted");
        }
        String relative = listingId + "/" + UUID.randomUUID() + "." + extension;
        Path target = resolve(relative);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, data);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save photo", e);
        }
        return relative;
    }

    public Resource load(String relativePath) {
        Path path = resolve(relativePath);
        if (!Files.isReadable(path)) {
            throw new NotFoundException("Photo file is missing");
        }
        return new PathResource(path);
    }

    public static MediaType mediaType(String relativePath) {
        String lower = relativePath.toLowerCase();
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }

    public void deleteQuietly(String relativePath) {
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException | RuntimeException e) {
            log.warn("Could not delete photo file {}: {}", relativePath, e.getMessage());
        }
    }

    /** Deletes the files only if the database transaction really commits (otherwise rows would point to nothing). */
    public void deleteAfterCommit(Collection<String> relativePaths) {
        if (relativePaths.isEmpty()) {
            return;
        }
        List<String> copy = List.copyOf(relativePaths);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    copy.forEach(PhotoStorage.this::deleteQuietly);
                }
            });
        } else {
            copy.forEach(this::deleteQuietly);
        }
    }

    private Path resolve(String relativePath) {
        Path path = root.resolve(relativePath).normalize();
        if (!path.startsWith(root)) {
            throw new BadRequestException("Invalid photo path");
        }
        return path;
    }

    static String detectExtension(byte[] h) {
        if (h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (h.length >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G') {
            return "png";
        }
        if (h.length >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
