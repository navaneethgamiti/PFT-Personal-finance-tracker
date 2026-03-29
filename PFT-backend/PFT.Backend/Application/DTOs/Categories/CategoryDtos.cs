using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Categories;

public record CreateCategoryRequest(
    [Required, MaxLength(80)] string Name,
    [Required, RegularExpression("^(Income|Expense)$")] string Type);

public record UpdateCategoryRequest(
    [Required, MaxLength(80)] string Name,
    bool IsArchived);

public record CategoryDto(Guid Id, string Name, string Type, bool IsDefault, bool IsArchived);

