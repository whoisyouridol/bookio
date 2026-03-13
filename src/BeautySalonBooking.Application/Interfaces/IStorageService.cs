namespace BeautySalonBooking.Application.Interfaces;

public interface IStorageService
{
    /// <summary>Upload a stream and return the object key stored in the bucket.</summary>
    Task<string> UploadAsync(Stream stream, string folder, string fileName, string contentType, CancellationToken ct = default);

    /// <summary>Stream the object content directly (avoids exposing MinIO endpoint).</summary>
    Task<(Stream stream, string contentType)> GetStreamAsync(string key, CancellationToken ct = default);

    /// <summary>Ensure the bucket exists (called at startup).</summary>
    Task EnsureBucketAsync(CancellationToken ct = default);
}
