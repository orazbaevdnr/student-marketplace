package com.studentmarketplace.common;

import org.springframework.data.domain.Page;

import java.util.List;

/** Stable JSON shape for paged results (Spring's PageImpl is not meant to be serialized directly). */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    /** Uses the paging data of {@code page} but the already mapped {@code content}. */
    public static <S, T> PageResponse<T> of(Page<S> page, List<T> content) {
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
