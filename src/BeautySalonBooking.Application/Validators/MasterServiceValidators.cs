using BeautySalonBooking.Application.DTOs;
using FluentValidation;

namespace BeautySalonBooking.Application.Validators;

public class AddMasterServiceValidator : AbstractValidator<AddMasterServiceRequest>
{
    public AddMasterServiceValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
    }
}

public class UpdateMasterServiceValidator : AbstractValidator<UpdateMasterServiceRequest>
{
    public UpdateMasterServiceValidator()
    {
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
    }
}
