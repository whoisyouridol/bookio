using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

[ApiController]
[Authorize]
[Route("api/salons/{salonId:guid}/masters")]
public class SalonMastersController : ControllerBase
{
    private readonly SalonMasterService _service;

    public SalonMastersController(SalonMasterService service) => _service = service;

    /// <summary>Link a master to a salon with schedule</summary>
    [HttpPost]
    public async Task<IActionResult> Link(Guid salonId, [FromBody] LinkMasterToSalonRequest req)
    {
        var (result, error) = await _service.LinkAsync(salonId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Update master's schedule at this salon</summary>
    [HttpPut("{masterId:guid}")]
    public async Task<IActionResult> Update(Guid salonId, Guid masterId, [FromBody] UpdateSalonMasterRequest req)
    {
        var (result, error) = await _service.UpdateAsync(salonId, masterId, req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Unlink master from salon</summary>
    [HttpDelete("{masterId:guid}")]
    public async Task<IActionResult> Unlink(Guid salonId, Guid masterId)
    {
        var deleted = await _service.UnlinkAsync(salonId, masterId);
        return deleted ? NoContent() : NotFound();
    }
}
