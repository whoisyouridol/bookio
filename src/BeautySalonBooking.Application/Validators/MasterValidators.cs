using BeautySalonBooking.Application.DTOs;
using FluentValidation;

namespace BeautySalonBooking.Application.Validators;

public class CreateMasterValidator : AbstractValidator<CreateMasterRequest>
{
    public CreateMasterValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
    }
}

public class UpdateMasterValidator : AbstractValidator<UpdateMasterRequest>
{
    public UpdateMasterValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
    }
}
