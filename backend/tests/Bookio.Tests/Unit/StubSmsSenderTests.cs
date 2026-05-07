using Bookio.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace Bookio.Tests.Unit;

public class StubSmsSenderTests
{
    [Fact]
    public async Task SendSmsAsync_AlwaysReturnsTrue()
    {
        var logger = new Mock<ILogger<StubSmsSender>>();
        var sender = new StubSmsSender(logger.Object);

        var result = await sender.SendSmsAsync("+995555123456", "Test message");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SendSmsAsync_LogsMessage()
    {
        var logger = new Mock<ILogger<StubSmsSender>>();
        var sender = new StubSmsSender(logger.Object);

        await sender.SendSmsAsync("+995555123456", "Hello SMS");

        logger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("[SMS STUB]")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
