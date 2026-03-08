using BeautySalonBooking.Application.DTOs;
using FluentValidation;

namespace BeautySalonBooking.Application.Validators;

public class GenerateSlotsValidator : AbstractValidator<GenerateSlotsRequest>
{
    public GenerateSlotsValidator()
    {
        RuleFor(x => x.StartDate).NotEmpty().Matches(@"^\d{4}-\d{2}-\d{2}$").WithMessage("Use YYYY-MM-DD format");
        RuleFor(x => x.EndDate).NotEmpty().Matches(@"^\d{4}-\d{2}-\d{2}$").WithMessage("Use YYYY-MM-DD format");
        RuleFor(x => x.SlotDurationMinutes).InclusiveBetween(15, 480);
    }
}
