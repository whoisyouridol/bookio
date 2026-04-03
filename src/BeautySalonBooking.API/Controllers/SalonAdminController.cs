using System.Security.Claims;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/salon-admin")]
[Authorize(Roles = "SalonAdmin")]
public class SalonAdminController : ControllerBase
{
    private readonly SalonAdminService _salonAdmin;
    private readonly BookingService _bookings;
    private readonly SalonService _salons;

    public SalonAdminController(
        SalonAdminService salonAdmin,
        BookingService bookings,
        SalonService salons)
    {
        _salonAdmin = salonAdmin;
        _bookings = bookings;
        _salons = salons;
    }

    /// <summary>Get salon admin dashboard with metrics</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var dashboard = await _salonAdmin.GetDashboardAsync(salonId.Value);
        if (dashboard == null) return NotFound(new { error = "Salon not found" });
        return Ok(dashboard);
    }

    /// <summary>Get salon's bookings with filters</summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings(
        [FromQuery] Guid? masterId,
        [FromQuery] string? status,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo)
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var filter = new BookingFilterRequest(salonId, masterId, status, dateFrom, dateTo);
        var bookings = await _bookings.GetAllAsync(filter);
        return Ok(bookings);
    }

    /// <summary>Confirm a booking (salon-scoped)</summary>
    [HttpPut("bookings/{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmBooking(Guid id)
    {
        if (!await CanAccessBookingAsync(id)) return Forbid();
        var (result, error) = await _bookings.ConfirmAsync(id);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Complete a booking (salon-scoped)</summary>
    [HttpPut("bookings/{id:guid}/complete")]
    public async Task<IActionResult> CompleteBooking(Guid id)
    {
        if (!await CanAccessBookingAsync(id)) return Forbid();
        var (result, error) = await _bookings.CompleteAsync(id);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Cancel a booking (salon-scoped)</summary>
    [HttpPut("bookings/{id:guid}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequest req)
    {
        if (!await CanAccessBookingAsync(id)) return Forbid();
        var (result, error) = await _bookings.CancelAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Get masters linked to this salon</summary>
    [HttpGet("masters")]
    public async Task<IActionResult> Masters()
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var masters = await _salonAdmin.GetMastersAsync(salonId.Value);
        return Ok(masters);
    }

    /// <summary>Search masters not yet linked to this salon</summary>
    [HttpGet("masters/search")]
    public async Task<IActionResult> SearchMasters([FromQuery] string q = "")
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var results = await _salonAdmin.SearchAvailableMastersAsync(salonId.Value, q);
        return Ok(results);
    }

    /// <summary>Link an existing master to this salon</summary>
    [HttpPost("masters/link")]
    public async Task<IActionResult> LinkMaster([FromBody] LinkExistingMasterRequest req)
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var (ok, error) = await _salonAdmin.LinkMasterToSalonAsync(salonId.Value, req.MasterId);
        if (!ok) return BadRequest(new { error });
        return NoContent();
    }

    /// <summary>Create a new master and auto-link to this salon</summary>
    [HttpPost("masters")]
    public async Task<IActionResult> CreateMaster([FromBody] CreateMasterRequest req)
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var (result, error) = await _salonAdmin.CreateMasterForSalonAsync(salonId.Value, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Remove a master from this salon (unlink, does not delete)</summary>
    [HttpDelete("masters/{masterId:guid}")]
    public async Task<IActionResult> RemoveMaster(Guid masterId)
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var (ok, error) = await _salonAdmin.RemoveMasterFromSalonAsync(salonId.Value, masterId);
        if (!ok) return BadRequest(new { error });
        return NoContent();
    }

    /// <summary>Get salon settings (current salon details)</summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var salon = await _salons.GetByIdAsync(salonId.Value);
        return salon == null ? NotFound() : Ok(salon);
    }

    /// <summary>Update salon settings</summary>
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSalonRequest req)
    {
        var salonId = GetSalonId();
        if (salonId == null) return Forbid();

        var result = await _salons.UpdateAsync(salonId.Value, req);
        return result == null ? NotFound() : Ok(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid? GetSalonId()
    {
        var claim = User.FindFirstValue("salonId");
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private async Task<bool> CanAccessBookingAsync(Guid bookingId)
    {
        var salonId = GetSalonId();
        if (salonId == null) return false;
        var booking = await _bookings.GetByIdAsync(bookingId);
        return booking?.SalonId == salonId;
    }
}
