using Bookio.Application.DTOs;
using FluentValidation;

namespace Bookio.Application.Validators;

public class CreateMasterValidator : AbstractValidator<CreateMasterRequest>
{
    public CreateMasterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
    }
}

public class UpdateMasterValidator : AbstractValidator<UpdateMasterRequest>
{
    public UpdateMasterValidator()
    {
        When(x => x.FirstName != null, () =>
            RuleFor(x => x.FirstName!).NotEmpty().MaximumLength(100));
        When(x => x.LastName != null, () =>
            RuleFor(x => x.LastName!).NotEmpty().MaximumLength(100));
        When(x => x.Email != null, () =>
            RuleFor(x => x.Email!).NotEmpty().EmailAddress().MaximumLength(256));
        When(x => x.Phone != null, () =>
            RuleFor(x => x.Phone!).NotEmpty().MaximumLength(20));
    }
}
