using Bookio.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Bookio.Infrastructure.Services;

public class StubSmsSender : ISmsSender
{
    private readonly ILogger<StubSmsSender> _logger;

    public StubSmsSender(ILogger<StubSmsSender> logger)
    {
        _logger = logger;
    }

    public Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        _logger.LogInformation("[SMS STUB] To: {Phone} | Message: {Message}", phoneNumber, message);
        return Task.FromResult(true);
    }
}
