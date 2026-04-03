namespace BeautySalonBooking.Infrastructure.Configuration;

public class SmtpSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "noreply@bookvisit.ge";
    public string FromName { get; set; } = "BookVisit";
}
