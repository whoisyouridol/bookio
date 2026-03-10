using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
public class RatingsController : ControllerBase
{
    private readonly RatingService _ratingService;
    private readonly IValidator<CreateRatingRequest> _validator;

    public RatingsController(RatingService ratingService, IValidator<CreateRatingRequest> validator)
    {
        _ratingService = ratingService;
        _validator = validator;
    }

    /// <summary>Submit a rating for a master</summary>
    [AllowAnonymous]
    [HttpPost("api/masters/{masterId:guid}/ratings")]
    public async Task<IActionResult> Create(Guid masterId, [FromBody] CreateRatingRequest req)
    {
        var validation = await _validator.ValidateAsync(req);
        if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => e.ErrorMessage));
        var (result, error) = await _ratingService.CreateAsync(masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>List all ratings for a master</summary>
    [AllowAnonymous]
    [HttpGet("api/masters/{masterId:guid}/ratings")]
    public async Task<IActionResult> GetByMaster(Guid masterId) => Ok(await _ratingService.GetByMasterAsync(masterId));

    /// <summary>Delete a rating</summary>
    [Authorize]
    [HttpDelete("api/ratings/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _ratingService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
