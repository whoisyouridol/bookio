using Bookio.Application.Interfaces;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;

namespace Bookio.Infrastructure.Storage;

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

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await _internal.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(_opts.BucketName)
                .WithObject(key), ct);
        }
        catch (MinioException)
        {
            // Object does not exist or already deleted — treat as success
        }
    }

    public async Task<(Stream stream, string contentType)> GetStreamAsync(string key, CancellationToken ct = default)
    {
        var ms = new MemoryStream();
        string contentType = "application/octet-stream";

        var args = new GetObjectArgs()
            .WithBucket(_opts.BucketName)
            .WithObject(key)
            .WithCallbackStream((s, _) => s.CopyToAsync(ms));

        var obj = await _internal.GetObjectAsync(args, ct);
        contentType = obj.ContentType ?? contentType;
        ms.Position = 0;
        return (ms, contentType);
    }
}
