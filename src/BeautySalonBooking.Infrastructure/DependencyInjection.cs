using System.Text;
using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Infrastructure.ApplicationServices;
using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using BeautySalonBooking.Infrastructure.Services;
using BeautySalonBooking.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace BeautySalonBooking.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // ── Database ───────────────────────────────────────────────────────────
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null)));

        // ── ASP.NET Core Identity ──────────────────────────────────────────────
        services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // ── JWT Authentication ─────────────────────────────────────────────────
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = !string.IsNullOrEmpty(configuration["Jwt:Issuer"]),
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidateAudience = !string.IsNullOrEmpty(configuration["Jwt:Audience"]),
                ValidAudience = configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                // Map the "role" claim to ClaimTypes.Role so [Authorize(Roles=...)] works
                RoleClaimType = "role",
                NameClaimType = "email",
            };
        });

        services.AddAuthorization();

        // ── HttpClient (for Google / Facebook token validation) ────────────────
        services.AddHttpClient();

        // ── MinIO ──────────────────────────────────────────────────────────────
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

        // ── Application services ───────────────────────────────────────────────
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<AuthService>();

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
