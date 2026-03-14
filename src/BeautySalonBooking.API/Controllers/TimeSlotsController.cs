using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
public class TimeSlotsController : ControllerBase
{
    private readonly AvailabilityService _availability;
    private readonly TimeSlotService _legacySlots;
    private readonly IValidator<GenerateSlotsRequest> _generateValidator;

    public TimeSlotsController(
        AvailabilityService availability,
        TimeSlotService legacySlots,
        IValidator<GenerateSlotsRequest> generateValidator)
    {
        _availability = availability;
        _legacySlots = legacySlots;
        _generateValidator = generateValidator;
    }

    /// <summary>Get available time slots for a master at a salon on a given date (on-the-fly computation)</summary>
    [AllowAnonymous]
    [HttpGet("api/salons/{salonId:guid}/masters/{masterId:guid}/slots")]
    public async Task<IActionResult> GetAvailable(
        Guid salonId, Guid masterId,
        [FromQuery] string date,
        [FromQuery] List<Guid>? serviceIds)
    {
        var (slots, error) = await _availability.GetAvailableSlotsAsync(salonId, masterId, date, serviceIds);
        if (error != null) return BadRequest(new { error });
        return Ok(slots);
    }

    /// <summary>Manually create time slots (batch) — legacy</summary>
    [Authorize]
    [HttpPost("api/salons/{salonId:guid}/masters/{masterId:guid}/slots")]
    public async Task<IActionResult> CreateBatch(Guid salonId, Guid masterId, [FromBody] CreateTimeSlotsRequest req)
    {
        var (result, error) = await _legacySlots.CreateBatchAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Auto-generate time slots for a date range — legacy</summary>
    [Authorize]
    [HttpPost("api/salons/{salonId:guid}/masters/{masterId:guid}/slots/generate")]
    public async Task<IActionResult> Generate(Guid salonId, Guid masterId, [FromBody] GenerateSlotsRequest req)
    {
        var validation = await _generateValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (count, error) = await _legacySlots.GenerateAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(new { generated = count });
    }

    /// <summary>Update slot status (Block/Unblock) — legacy</summary>
    [Authorize]
    [HttpPut("api/slots/{id:guid}")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSlotStatusRequest req)
    {
        var (result, error) = await _legacySlots.UpdateStatusAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a time slot — legacy</summary>
    [Authorize]
    [HttpDelete("api/slots/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _legacySlots.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
