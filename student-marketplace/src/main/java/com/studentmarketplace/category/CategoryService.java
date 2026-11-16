package com.studentmarketplace.category;

import com.studentmarketplace.category.CategoryDtos.Request;
import com.studentmarketplace.category.CategoryDtos.Response;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CategoryService {

    static final String CACHE = "categories";

    private final CategoryRepository categories;

    public CategoryService(CategoryRepository categories) {
        this.categories = categories;
    }

    /** Read on every page of the app and almost never changed, so it is cached until an administrator edits a category. */
    @Cacheable(CACHE)
    @Transactional(readOnly = true)
    public List<Response> listActive() {
        return categories.findByActiveTrueOrderByNameAsc().stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Response> listAll() {
        return categories.findAllByOrderByNameAsc().stream().map(Response::from).toList();
    }

    /** Used by ListingService: a listing may only be placed in an existing, active category. */
    @Transactional(readOnly = true)
    public Category requireActive(Long id) {
        Category category = categories.findById(id)
                .orElseThrow(() -> new BadRequestException("Category " + id + " does not exist"));
        if (!category.isActive()) {
            throw new BadRequestException("Category '" + category.getName() + "' is not active");
        }
        return category;
    }

    @CacheEvict(value = CACHE, allEntries = true)
    @Transactional
    public Response create(Request request) {
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Category '" + name + "' already exists");
        }
        return Response.from(categories.save(new Category(name, uniqueSlug(name), blankToNull(request.description()))));
    }

    /** "Dorm & Home" becomes dorm_home; a second category with the same slug gets _2, _3, ... */
    private String uniqueSlug(String name) {
        String base = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.isEmpty()) {
            base = "category";
        }
        if (base.length() > 30) {
            base = base.substring(0, 30);
        }
        String slug = base;
        int n = 2;
        while (categories.existsBySlug(slug)) {
            slug = base + "_" + n++;
        }
        return slug;
    }

    @CacheEvict(value = CACHE, allEntries = true)
    @Transactional
    public Response update(Long id, Request request) {
        Category category = find(id);
        String name = request.name().trim();
        if (categories.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Category '" + name + "' already exists");
        }
        category.update(name, blankToNull(request.description()));
        return Response.from(category);
    }

    @CacheEvict(value = CACHE, allEntries = true)
    @Transactional
    public Response setActive(Long id, boolean active) {
        Category category = find(id);
        category.setActive(active);
        return Response.from(category);
    }

    private Category find(Long id) {
        return categories.findById(id).orElseThrow(() -> new NotFoundException("Category " + id + " not found"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
