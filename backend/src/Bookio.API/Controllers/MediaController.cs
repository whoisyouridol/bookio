using Bookio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bookio.API.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif"
    };

    private static readonly HashSet<string> AllowedVideoTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "video/mp4", "video/webm", "video/quicktime"
    };

    private readonly IStorageService _storage;

    public MediaController(IStorageService storage) => _storage = storage;

    /// <summary>Upload a file. folder = e.g. "salons", "masters", "services"</summary>
    [Authorize]
    [HttpPost("upload")]
    [RequestSizeLimit(104_857_600)] // 100 MB
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload([FromForm] UploadRequest request, CancellationToken ct)
    {
        var file = request.File;
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");

        var contentType = file.ContentType ?? "";
        var isImage = AllowedImageTypes.Contains(contentType);
        var isVideo = AllowedVideoTypes.Contains(contentType);

        if (!isImage && !isVideo)
            return BadRequest($"Unsupported file type: {contentType}");

        await using var stream = file.OpenReadStream();
        var key = await _storage.UploadAsync(stream, request.Folder, file.FileName, contentType, ct);

        return Ok(new { key });
    }

    /// <summary>Delete a media object by its key.</summary>
    [Authorize]
    [HttpDelete("{**key}")]
    public async Task<IActionResult> Delete(string key, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(key))
            return BadRequest();

        await _storage.DeleteAsync(key, ct);
        return NoContent();
    }

    /// <summary>Stream the media file for the given object key.</summary>
    [AllowAnonymous]
    [HttpGet("{**key}")]
    public async Task<IActionResult> Get(string key, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(key))
            return BadRequest();

        try
        {
            var (stream, contentType) = await _storage.GetStreamAsync(key, ct);
            Response.Headers.CacheControl = "public, max-age=86400";
            return File(stream, contentType);
        }
        catch
        {
            return NotFound();
        }
    }
}

public class UploadRequest
{
    public IFormFile File { get; set; } = null!;
    public string Folder { get; set; } = string.Empty;
}
