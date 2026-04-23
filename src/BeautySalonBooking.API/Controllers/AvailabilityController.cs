 using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Authorize]
[Route("api/salons/{salonId:guid}/masters/{masterId:guid}/availability")]
public class AvailabilityController : ControllerBase
{
    private readonly AvailabilityService _service;

    public AvailabilityController(AvailabilityService service) => _service = service;

    // ── Weekly Schedule ──────────────────────────────────────────────────────

    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklySchedule(Guid salonId, Guid masterId)
    {
        var smId = await _service.FindSalonMasterIdAsync(salonId, masterId);
        if (smId == null) return NotFound(new { error = "Salon-master link not found" });
        var result = await _service.GetWeeklyScheduleAsync(smId.Value);
        return Ok(result);
    }

    [HttpPut("weekly")]
    public async Task<IActionResult> SetWeeklySchedule(
        Guid salonId, Guid masterId, [FromBody] SetWeeklyScheduleRequest req)
    {
        var (result, error) = await _service.SetWeeklyScheduleAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    // ── Date Overrides ───────────────────────────────────────────────────────

    [HttpGet("overrides")]
    public async Task<IActionResult> GetDateOverrides(
        Guid salonId, Guid masterId,
        [FromQuery] string? from, [FromQuery] string? to)
    {
        var smId = await _service.FindSalonMasterIdAsync(salonId, masterId);
        if (smId == null) return NotFound(new { error = "Salon-master link not found" });
        var result = await _service.GetDateOverridesAsync(smId.Value, from, to);
        return Ok(result);
    }

    [HttpPut("overrides")]
    public async Task<IActionResult> UpsertDateOverride(
        Guid salonId, Guid masterId, [FromBody] UpsertDateOverrideRequest req)
    {
        var (result, error) = await _service.UpsertDateOverrideAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    [HttpDelete("overrides/{overrideId:guid}")]
    public async Task<IActionResult> DeleteDateOverride(Guid salonId, Guid masterId, Guid overrideId)
    {
        var deleted = await _service.DeleteDateOverrideAsync(salonId, masterId, overrideId);
        return deleted ? NoContent() : NotFound();
    }

    // ── Time Off ─────────────────────────────────────────────────────────────

    [HttpGet("timeoff")]
    public async Task<IActionResult> GetTimeOffs(Guid salonId, Guid masterId)
    {
        var smId = await _service.FindSalonMasterIdAsync(salonId, masterId);
        if (smId == null) return NotFound(new { error = "Salon-master link not found" });
        var result = await _service.GetTimeOffsAsync(smId.Value);
        return Ok(result);
    }

    [HttpPost("timeoff")]
    public async Task<IActionResult> CreateTimeOff(
        Guid salonId, Guid masterId, [FromBody] CreateTimeOffRequest req)
    {
        var (result, error) = await _service.CreateTimeOffAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Created("", result);
    }

    [HttpPut("timeoff/{timeOffId:guid}")]
    public async Task<IActionResult> UpdateTimeOff(
        Guid salonId, Guid masterId, Guid timeOffId, [FromBody] UpdateTimeOffRequest req)
    {
        var (result, error) = await _service.UpdateTimeOffAsync(salonId, masterId, timeOffId, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("timeoff/{timeOffId:guid}")]
    public async Task<IActionResult> DeleteTimeOff(Guid salonId, Guid masterId, Guid timeOffId)
    {
        var deleted = await _service.DeleteTimeOffAsync(salonId, masterId, timeOffId);
        return deleted ? NoContent() : NotFound();
    }

    // ── Resolved Availability ────────────────────────────────────────────────

    [AllowAnonymous]
    [HttpGet("resolve")]
    public async Task<IActionResult> Resolve(
        Guid salonId, Guid masterId,
        [FromQuery] string startDate, [FromQuery] string endDate)
    {
        var (result, error) = await _service.ResolveAsync(salonId, masterId, startDate, endDate);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }
}
