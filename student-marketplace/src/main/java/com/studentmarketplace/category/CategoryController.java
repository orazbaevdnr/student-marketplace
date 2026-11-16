package com.studentmarketplace.category;

import com.studentmarketplace.category.CategoryDtos.Response;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories")
public class CategoryController {

    private final CategoryService categories;

    public CategoryController(CategoryService categories) {
        this.categories = categories;
    }

    /** Public: the list of active categories for the listing form and the search filter. */
    @GetMapping
    public List<Response> list() {
        return categories.listActive();
    }
}
