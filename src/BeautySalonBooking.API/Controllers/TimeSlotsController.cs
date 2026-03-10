using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
public class TimeSlotsController : ControllerBase
{
    private readonly TimeSlotService _service;
    private readonly IValidator<GenerateSlotsRequest> _generateValidator;

    public TimeSlotsController(TimeSlotService service, IValidator<GenerateSlotsRequest> generateValidator)
    {
        _service = service;
        _generateValidator = generateValidator;
    }

    /// <summary>Get available time slots for a master at a salon on a given date</summary>
    [AllowAnonymous]
    [HttpGet("api/salons/{salonId:guid}/masters/{masterId:guid}/slots")]
    public async Task<IActionResult> GetAvailable(
        Guid salonId, Guid masterId,
        [FromQuery] string date,
        [FromQuery] List<Guid>? serviceIds)
    {
        var (slots, error) = await _service.GetAvailableAsync(salonId, masterId, date, serviceIds);
        if (error != null) return BadRequest(new { error });
        return Ok(slots);
    }

    /// <summary>Manually create time slots (batch)</summary>
    [Authorize]
    [HttpPost("api/salons/{salonId:guid}/masters/{masterId:guid}/slots")]
    public async Task<IActionResult> CreateBatch(Guid salonId, Guid masterId, [FromBody] CreateTimeSlotsRequest req)
    {
        var (result, error) = await _service.CreateBatchAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Auto-generate time slots for a date range</summary>
    [Authorize]
    [HttpPost("api/salons/{salonId:guid}/masters/{masterId:guid}/slots/generate")]
    public async Task<IActionResult> Generate(Guid salonId, Guid masterId, [FromBody] GenerateSlotsRequest req)
    {
        var validation = await _generateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (count, error) = await _service.GenerateAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(new { generated = count });
    }

    /// <summary>Update slot status (Block/Unblock)</summary>
    [Authorize]
    [HttpPut("api/slots/{id:guid}")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSlotStatusRequest req)
    {
        var (result, error) = await _service.UpdateStatusAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a time slot</summary>
    [Authorize]
    [HttpDelete("api/slots/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
