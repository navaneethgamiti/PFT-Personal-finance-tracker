using Microsoft.AspNetCore.Mvc;
using PFT.Backend.Application.DTOs.Categories;
using PFT.Backend.Application.Interfaces;
using PFT.Backend.Common;

namespace PFT.Backend.Controllers;

public sealed class CategoriesController(ICategoryService categoryService, IUserContext userContext) : ApiControllerBase(userContext)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<CategoryDto>>>> GetAll(CancellationToken ct)
    {
        var data = await categoryService.GetAllAsync(UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Create([FromBody] CreateCategoryRequest request, CancellationToken ct)
    {
        var data = await categoryService.CreateAsync(request, UserId, ct);
        return OkEnvelope(data);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Update([FromRoute] Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken ct)
    {
        var data = await categoryService.UpdateAsync(id, request, UserId, ct);
        return OkEnvelope(data);
    }
}
