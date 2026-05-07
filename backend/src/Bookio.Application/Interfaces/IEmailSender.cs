namespace Bookio.Application.Interfaces;

public interface IEmailSender
{
    Task<bool> SendEmailAsync(string to, string subject, string htmlBody);
}
