using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautySalonBooking.API.Controllers;

/// <summary>SuperAdmin-only user management</summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "SuperAdmin")]
public class AdminUsersController : ControllerBase
{
    private readonly AuthService _auth;

    public AdminUsersController(AuthService auth) => _auth = auth;

    /// <summary>List all users</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _auth.GetAllUsersAsync());

    /// <summary>Create a SalonAdmin, MasterAdmin or Client account</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserRequest req)
    {
        var (result, error) = await _auth.CreateAdminUserAsync(req);
        if (error != null) return BadRequest(new { error });
        return Ok(result);
    }

    /// <summary>Update a user's role and entity link</summary>
    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest req)
    {
        var (result, error) = await _auth.UpdateUserRoleAsync(id, req);
        if (error != null) return BadRequest(new { error });
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a user</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _auth.DeleteUserAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
