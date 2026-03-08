using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/masters/{masterId:guid}/services")]
public class MasterServicesController : ControllerBase
{
    private readonly MasterServiceManager _service;
    private readonly IValidator<AddMasterServiceRequest> _addValidator;
    private readonly IValidator<UpdateMasterServiceRequest> _updateValidator;

    public MasterServicesController(MasterServiceManager service,
        IValidator<AddMasterServiceRequest> addValidator,
        IValidator<UpdateMasterServiceRequest> updateValidator)
    {
        _service = service;
        _addValidator = addValidator;
        _updateValidator = updateValidator;
    }

    /// <summary>Add a catalog service to a master with price and duration</summary>
    [HttpPost]
    public async Task<IActionResult> Add(Guid masterId, [FromBody] AddMasterServiceRequest req)
    {
        var validation = await _addValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (result, error) = await _service.AddAsync(masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Update price or duration for a master's service</summary>
    [HttpPut("{serviceId:guid}")]
    public async Task<IActionResult> Update(Guid masterId, Guid serviceId, [FromBody] UpdateMasterServiceRequest req)
    {
        var validation = await _updateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (result, error) = await _service.UpdateAsync(masterId, serviceId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Remove a service from a master's offerings</summary>
    [HttpDelete("{serviceId:guid}")]
    public async Task<IActionResult> Remove(Guid masterId, Guid serviceId)
    {
        var deleted = await _service.RemoveAsync(masterId, serviceId);
        return deleted ? NoContent() : NotFound();
    }
}
