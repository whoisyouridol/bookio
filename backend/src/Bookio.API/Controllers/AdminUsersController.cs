using Bookio.Application.DTOs;
using Bookio.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

/// <summary>SuperAdmin-only user management</summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "SuperAdmin")]
public class AdminUsersController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly MasterService _masters;

    public AdminUsersController(AuthService auth, MasterService masters)
    {
        _auth = auth;
        _masters = masters;
    }

    /// <summary>List all users, optionally filtered by role (SuperAdmin, SalonAdmin, MasterAdmin, Client)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role = null)
        => Ok(await _auth.GetAllUsersAsync(role));

    /// <summary>Get a single user by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOne(Guid id)
    {
        var user = await _auth.GetUserAsync(id);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>Create a SalonAdmin, MasterAdmin or Client account</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserRequest req)
    {
        var (result, error) = await _auth.CreateAdminUserAsync(req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Update a user's profile fields (name, phone, email)</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateUserProfileRequest req)
    {
        var (result, error) = await _auth.UpdateUserProfileAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Update a user's role and entity link</summary>
    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest req)
    {
        var (result, error) = await _auth.UpdateUserRoleAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Activate or deactivate a user account</summary>
    [HttpPut("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetUserActiveRequest req)
    {
        var (result, error) = await _auth.SetUserActiveAsync(id, req.IsActive);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a user. If the user is a master, soft-deletes the linked master record first.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _auth.GetUserAsync(id);
        if (user == null) return NotFound();

        if (user.MasterId.HasValue)
            await _masters.DeleteAsync(user.MasterId.Value);

        var deleted = await _auth.DeleteUserAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
