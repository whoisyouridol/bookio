using Bookio.Application.DTOs;
using FluentValidation;

namespace Bookio.Application.Validators;

public class CreateSalonValidator : AbstractValidator<CreateSalonRequest>
{
    private static readonly string[] ValidDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    public CreateSalonValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).MaximumLength(100)
            .Matches(@"^[a-z0-9\-]+$").WithMessage("Slug may only contain lowercase letters, digits, and hyphens")
            .When(x => !string.IsNullOrEmpty(x.Slug));
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.WorkingHoursStart).NotEmpty().Matches(@"^\d{2}:\d{2}$").WithMessage("Use HH:mm format");
        RuleFor(x => x.WorkingHoursEnd).NotEmpty().Matches(@"^\d{2}:\d{2}$").WithMessage("Use HH:mm format");
        RuleFor(x => x.WorkingDays).NotEmpty().ForEach(d => d.Must(day => ValidDays.Contains(day)).WithMessage("Invalid day of week"));
    }
}

public class UpdateSalonValidator : AbstractValidator<UpdateSalonRequest>
{
    private static readonly string[] ValidDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    public UpdateSalonValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).MaximumLength(100)
            .Matches(@"^[a-z0-9\-]+$").WithMessage("Slug may only contain lowercase letters, digits, and hyphens")
            .When(x => !string.IsNullOrEmpty(x.Slug));
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.WorkingHoursStart).NotEmpty().Matches(@"^\d{2}:\d{2}$").WithMessage("Use HH:mm format");
        RuleFor(x => x.WorkingHoursEnd).NotEmpty().Matches(@"^\d{2}:\d{2}$").WithMessage("Use HH:mm format");
        RuleFor(x => x.WorkingDays).NotEmpty().ForEach(d => d.Must(day => ValidDays.Contains(day)).WithMessage("Invalid day of week"));
    }
}
