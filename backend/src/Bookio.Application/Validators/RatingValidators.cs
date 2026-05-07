using Bookio.Application.DTOs;
using FluentValidation;

namespace Bookio.Application.Validators;

public class CreateRatingValidator : AbstractValidator<CreateRatingRequest>
{
    public CreateRatingValidator()
    {
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).MaximumLength(2000).When(x => x.Comment != null);
    }
}
