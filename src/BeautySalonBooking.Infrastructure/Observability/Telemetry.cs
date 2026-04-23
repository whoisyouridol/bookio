using System.Diagnostics;

namespace BeautySalonBooking.Infrastructure.Observability;

public static class Telemetry
{
    public const string ServiceName = "BookVisit.API";
    public static readonly ActivitySource Source = new(ServiceName);
}
