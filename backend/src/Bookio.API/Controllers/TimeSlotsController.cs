using Bookio.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

[ApiController]
public class TimeSlotsController : ControllerBase
{
    private readonly AvailabilityService _availability;

    public TimeSlotsController(AvailabilityService availability)
    {
        _availability = availability;
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
}
