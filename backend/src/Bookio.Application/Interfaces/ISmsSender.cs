namespace Bookio.Application.Interfaces;

public interface ISmsSender
{
    Task<bool> SendSmsAsync(string phoneNumber, string message);
}
