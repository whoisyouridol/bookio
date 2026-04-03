using System.Security.Claims;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;
    private readonly IValidator<CreateBookingRequest> _createValidator;
    private readonly IValidator<CancelBookingRequest> _cancelValidator;

    public BookingsController(BookingService bookingService,
        IValidator<CreateBookingRequest> createValidator,
        IValidator<CancelBookingRequest> cancelValidator)
    {
        _bookingService = bookingService;
        _createValidator = createValidator;
        _cancelValidator = cancelValidator;
    }

    /// <summary>List all bookings with optional filters</summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? salonId, [FromQuery] Guid? masterId,
        [FromQuery] string? status, [FromQuery] string? dateFrom, [FromQuery] string? dateTo)
    {
        var filter = new BookingFilterRequest(salonId, masterId, status, dateFrom, dateTo);
        return Ok(await _bookingService.GetAllAsync(filter));
    }

    /// <summary>Get booking details</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var booking = await _bookingService.GetByIdAsync(id);
        return booking == null ? NotFound() : Ok(booking);
    }

    /// <summary>Get bookings for the currently authenticated user, optionally filtered by salon</summary>
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMy([FromQuery] Guid? salonId)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(sub, out var userId)) return Unauthorized();
        return Ok(await _bookingService.GetMyBookingsAsync(userId, salonId));
    }

    /// <summary>Create a new booking</summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        var validation = await _createValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid? userId = Guid.TryParse(sub, out var uid) ? uid : null;
        var (result, error) = await _bookingService.CreateAsync(req, userId);
        if (error != null) return BadRequest(new { error });
        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, result);
    }

    /// <summary>Confirm a pending booking</summary>
    [Authorize]
    [HttpPut("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var (result, error) = await _bookingService.ConfirmAsync(id);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Mark booking as completed</summary>
    [Authorize]
    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id)
    {
        var (result, error) = await _bookingService.CompleteAsync(id);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Cancel a booking with side and reason</summary>
    [Authorize]
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelBookingRequest req)
    {
        var validation = await _cancelValidator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (result, error) = await _bookingService.CancelAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }
}

[ApiController]
[Route("api/salons/{salonId:guid}/bookings")]
public class SalonBookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public SalonBookingsController(BookingService bookingService) => _bookingService = bookingService;

    /// <summary>Get bookings for a specific salon</summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetBySalon(Guid salonId) => Ok(await _bookingService.GetBySalonAsync(salonId));
}

[ApiController]
[Route("api/masters/{masterId:guid}/bookings")]
public class MasterBookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public MasterBookingsController(BookingService bookingService) => _bookingService = bookingService;

    /// <summary>Get bookings for a specific master</summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetByMaster(Guid masterId) => Ok(await _bookingService.GetByMasterAsync(masterId));
}
