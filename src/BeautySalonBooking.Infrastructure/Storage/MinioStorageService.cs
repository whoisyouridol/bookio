using BeautySalonBooking.Application.Interfaces;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace BeautySalonBooking.Infrastructure.Storage;

public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _internal;  // internal Docker network
    private readonly IMinioClient _public;    // public endpoint for presigned URLs
    private readonly MinioOptions _opts;

    public MinioStorageService(IOptions<MinioOptions> opts)
    {
        _opts = opts.Value;

        _internal = new MinioClient()
            .WithEndpoint(_opts.Endpoint)
            .WithCredentials(_opts.AccessKey, _opts.SecretKey)
            .Build();

        // Parse public endpoint to extract host (and port)
        var publicUri = new Uri(_opts.PublicEndpoint);
        var publicEndpoint = publicUri.Host + (publicUri.IsDefaultPort ? "" : $":{publicUri.Port}");

        _public = new MinioClient()
            .WithEndpoint(publicEndpoint)
            .WithCredentials(_opts.AccessKey, _opts.SecretKey)
            .Build();
    }

    public async Task EnsureBucketAsync(CancellationToken ct = default)
    {
        var exists = await _internal.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(_opts.BucketName), ct);

        if (!exists)
        {
            await _internal.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(_opts.BucketName), ct);
        }
    }

    public async Task<string> UploadAsync(
        Stream stream, string folder, string fileName, string contentType,
        CancellationToken ct = default)
    {
        var ext = Path.GetExtension(fileName);
        var key = $"{folder.TrimEnd('/')}/{Guid.NewGuid()}{ext}";

        await _internal.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType(contentType), ct);

        return key;
    }

    public Task<string> GetPresignedUrlAsync(string key, CancellationToken ct = default)
    {
        return _public.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key)
            .WithExpiry((int)TimeSpan.FromHours(24).TotalSeconds));
    }
}
