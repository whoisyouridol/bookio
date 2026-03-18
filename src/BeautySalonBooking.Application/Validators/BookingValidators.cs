using BeautySalonBooking.Application.DTOs;
using FluentValidation;
using System.Globalization;

namespace BeautySalonBooking.Application.Validators;

public class CreateBookingValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.SalonId).NotEmpty();
        RuleFor(x => x.MasterId).NotEmpty();
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ClientPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.ClientEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.ClientEmail));
        RuleFor(x => x.BookingDate).NotEmpty().Matches(@"^\d{4}-\d{2}-\d{2}$").WithMessage("Use YYYY-MM-DD format");
        RuleFor(x => x.BookingDate)
            .NotEmpty()
            .Must(date => DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            .WithMessage("Booking date must be in format yyyy-MM-dd")
            .DependentRules(() =>
            {
                RuleFor(x => x.BookingDate)
                    .Must(date =>
                    {
                        DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed);
                        return parsed.Date >= DateTime.Today;
                    })
                    .WithMessage("Booking cannot be made for previous dates");
            });
        RuleFor(x => x.StartTime).NotEmpty().Matches(@"^\d{2}:\d{2}$").WithMessage("Use HH:mm format");
        RuleFor(x => x.ServiceIds).NotEmpty().WithMessage("At least one service is required");
    }
}

public class CancelBookingValidator : AbstractValidator<CancelBookingRequest>
{
    public CancelBookingValidator()
    {
        RuleFor(x => x.Side).NotEmpty().Must(s => s == "Client" || s == "Master").WithMessage("Side must be 'Client' or 'Master'");
    }
}
