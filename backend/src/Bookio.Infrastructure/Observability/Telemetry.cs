using System.Diagnostics;

namespace Bookio.Infrastructure.Observability;

public static class Telemetry
{
    public const string ServiceName = "Bookio.API";
    public static readonly ActivitySource Source = new(ServiceName);
}
