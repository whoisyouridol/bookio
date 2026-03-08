using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Infrastructure.Persistence;
using BeautySalonBooking.Infrastructure.Services;
using BeautySalonBooking.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BeautySalonBooking.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.Configure<MinioOptions>(opts =>
        {
            var s = configuration.GetSection("MinIO");
            opts.Endpoint = s["Endpoint"] ?? "";
            opts.PublicEndpoint = s["PublicEndpoint"] ?? "";
            opts.AccessKey = s["AccessKey"] ?? "";
            opts.SecretKey = s["SecretKey"] ?? "";
            opts.BucketName = s["BucketName"] ?? "bookio-media";
        });
        services.AddSingleton<IStorageService, MinioStorageService>();

        services.AddScoped<INotificationService, NotificationService>();

        services.AddScoped<SalonService>();
        services.AddScoped<MasterService>();
        services.AddScoped<SalonMasterService>();
        services.AddScoped<CatalogService>();
        services.AddScoped<MasterServiceManager>();
        services.AddScoped<TimeSlotService>();
        services.AddScoped<BookingService>();
        services.AddScoped<RatingService>();

        return services;
    }
}
