using Bookio.Application.DTOs;
using Bookio.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

[ApiController]
[Route("api/salons")]
public class SalonsController : ControllerBase
{
    private readonly SalonService _salonService;
    private readonly IValidator<CreateSalonRequest> _createValidator;
    private readonly IValidator<UpdateSalonRequest> _updateValidator;

    public SalonsController(SalonService salonService,
        IValidator<CreateSalonRequest> createValidator,
        IValidator<UpdateSalonRequest> updateValidator)
    {
        _salonService = salonService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>List all active salons</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _salonService.GetAllAsync());

    /// <summary>Get salon details with masters</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var salon = await _salonService.GetByIdAsync(id);
        return salon == null ? NotFound() : Ok(salon);
    }

    /// <summary>Get salon by subdomain slug</summary>
    [AllowAnonymous]
    [HttpGet("by-slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var salon = await _salonService.GetBySlugAsync(slug);
        return salon == null ? NotFound() : Ok(salon);
    }

    /// <summary>Create a new salon</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalonRequest req)
    {
        var validation = await _createValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var result = await _salonService.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update salon info</summary>
    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSalonRequest req)
    {
        var validation = await _updateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var result = await _salonService.UpdateAsync(id, req);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Soft-delete salon</summary>
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _salonService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Get all masters at this salon</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/masters")]
    public async Task<IActionResult> GetMasters(Guid id) => Ok(await _salonService.GetMastersAsync(id));

    /// <summary>Get all services available at this salon</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/services")]
    public async Task<IActionResult> GetServices(Guid id) => Ok(await _salonService.GetServicesAsync(id));
}
