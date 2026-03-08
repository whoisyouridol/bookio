using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/masters")]
public class MastersController : ControllerBase
{
    private readonly MasterService _masterService;
    private readonly IValidator<CreateMasterRequest> _createValidator;
    private readonly IValidator<UpdateMasterRequest> _updateValidator;

    public MastersController(MasterService masterService,
        IValidator<CreateMasterRequest> createValidator,
        IValidator<UpdateMasterRequest> updateValidator)
    {
        _masterService = masterService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>List all active masters</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _masterService.GetAllAsync());

    /// <summary>Get master details with average rating</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var master = await _masterService.GetByIdAsync(id);
        return master == null ? NotFound() : Ok(master);
    }

    /// <summary>Create a new master</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMasterRequest req)
    {
        var validation = await _createValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var result = await _masterService.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update master info</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMasterRequest req)
    {
        var validation = await _updateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var result = await _masterService.UpdateAsync(id, req);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Soft-delete master</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _masterService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Get services offered by this master</summary>
    [HttpGet("{id:guid}/services")]
    public async Task<IActionResult> GetServices(Guid id) => Ok(await _masterService.GetServicesAsync(id));

    /// <summary>Get master's average rating</summary>
    [HttpGet("{id:guid}/average-rating")]
    public async Task<IActionResult> GetAverageRating(Guid id) => Ok(await _masterService.GetAverageRatingAsync(id));
}
