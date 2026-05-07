using Bookio.Application.DTOs;
using Bookio.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

[ApiController]
[Route("api/masters")]
public class MastersController : ControllerBase
{
    private readonly MasterService _masterService;
    private readonly SalonMasterService _salonMasterService;
    private readonly IValidator<CreateMasterRequest> _createValidator;
    private readonly IValidator<UpdateMasterRequest> _updateValidator;

    public MastersController(MasterService masterService,
        SalonMasterService salonMasterService,
        IValidator<CreateMasterRequest> createValidator,
        IValidator<UpdateMasterRequest> updateValidator)
    {
        _masterService = masterService;
        _salonMasterService = salonMasterService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>List all active masters</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _masterService.GetAllAsync());

    /// <summary>Get master details with average rating</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var master = await _masterService.GetByIdAsync(id);
        return master == null ? NotFound() : Ok(master);
    }

    /// <summary>Create a new master (admin-initiated — generates a temporary password and emails credentials)</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMasterRequest req)
    {
        var validation = await _createValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (result, error) = await _masterService.CreateAsync(req);
        if (error != null) return BadRequest(new { error });
        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, result);
    }

    /// <summary>Update master profile</summary>
    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMasterRequest req)
    {
        var validation = await _updateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var result = await _masterService.UpdateAsync(id, req);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Soft-delete master</summary>
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _masterService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Get services offered by this master</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/services")]
    public async Task<IActionResult> GetServices(Guid id) => Ok(await _masterService.GetServicesAsync(id));

    /// <summary>Get salon-master links for this master (with salon names)</summary>
    [Authorize]
    [HttpGet("{id:guid}/salons")]
    public async Task<IActionResult> GetSalons(Guid id) => Ok(await _salonMasterService.GetByMasterAsync(id));

    /// <summary>Get master's average rating</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/average-rating")]
    public async Task<IActionResult> GetAverageRating(Guid id) => Ok(await _masterService.GetAverageRatingAsync(id));
}
