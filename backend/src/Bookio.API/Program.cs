using Bookio.API.Middleware;
using Bookio.API.Observability;
using Bookio.Application;
using Microsoft.EntityFrameworkCore;
using Bookio.Application.Interfaces;
using Bookio.Infrastructure;
using Bookio.Infrastructure.Entities;
using Bookio.Infrastructure.Observability;
using Bookio.Infrastructure.Persistence;
using Bookio.Infrastructure.Persistence.Seed;
using Bookio.Infrastructure.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Identity;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Sinks.OpenTelemetry;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 104_857_600); // 100 MB

// Serilog — console + OTLP (→ Loki)
var lokiEndpoint = builder.Configuration["Otel:LokiEndpoint"] ?? "http://loki:3100/otlp/v1/logs";
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.With(new TraceIdEnricher())
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.OpenTelemetry(opts =>
    {
        opts.Endpoint = lokiEndpoint;
        opts.Protocol = OtlpProtocol.HttpProtobuf;
        opts.ResourceAttributes = new Dictionary<string, object>
        {
            ["service.name"] = Telemetry.ServiceName
        };
    })
    .CreateLogger();

builder.Host.UseSerilog();

// OpenTelemetry — distributed tracing (→ Tempo)
var tempoEndpoint = builder.Configuration["Otel:TempoEndpoint"] ?? "http://tempo:4317";
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing =>
    {
        tracing
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService(Telemetry.ServiceName))
            .AddSource(Telemetry.ServiceName)
            .AddAspNetCoreInstrumentation(opts =>
            {
                opts.RecordException = true;
                opts.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health")
                                  && !ctx.Request.Path.StartsWithSegments("/hangfire");
            })
            .AddHttpClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation(opts =>
            {
                opts.SetDbStatementForText = true;
            })
            .AddOtlpExporter(opts =>
            {
                opts.Endpoint = new Uri(tempoEndpoint);
            });
    });

// Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Beauty Salon Booking API", Version = "v1" });
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);

    // JWT auth button in Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var mainDomains = builder.Configuration.GetSection("Subdomain:MainDomains").Get<string[]>()
    ?? ["localhost"];

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.SetIsOriginAllowed(origin =>
    {
        var host = new Uri(origin).Host;
        foreach (var domain in mainDomains)
        {
            if (string.Equals(host, domain, StringComparison.OrdinalIgnoreCase)) return true;
            if (host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
    })
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

builder.Services.AddMemoryCache();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── Hangfire ─────────────────────────────────────────────────────────────
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(
        builder.Configuration.GetConnectionString("DefaultConnection"))));
builder.Services.AddHangfireServer();

var app = builder.Build();

// Migrate DB and seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        db.Database.Migrate();
        await DataSeeder.SeedSuperAdminsAndLinkMastersAsync(db, userManager, config, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize database");
    }
}

// Ensure MinIO bucket exists
using (var scope = app.Services.CreateScope())
{
    var storage = scope.ServiceProvider.GetRequiredService<IStorageService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await storage.EnsureBucketAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize MinIO bucket");
    }
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<SubdomainMiddleware>();
app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Beauty Salon Booking API v1"));

app.UseAuthentication();
app.UseAuthorization();

// ── Hangfire dashboard ───────────────────────────────────────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new AllowAllDashboardAuthorizationFilter() }
});

RecurringJob.AddOrUpdate<ReminderSchedulerJob>(
    "reminder-scanner",
    job => job.ScanAndScheduleMissingRemindersAsync(),
    "*/15 * * * *");

RecurringJob.AddOrUpdate<BookingExpirationJob>(
    "booking-expiration",
    job => job.ProcessPendingBookingsAsync(),
    "*/5 * * * *"); // Every 5 minutes

app.UseHttpsRedirection();
app.MapGet("/health", () => Results.Ok("healthy"));
app.MapControllers();

app.Run();

public partial class Program { }

public class AllowAllDashboardAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context) => true;
}
