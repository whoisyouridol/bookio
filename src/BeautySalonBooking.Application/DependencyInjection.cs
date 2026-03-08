using BeautySalonBooking.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BeautySalonBooking.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<CreateSalonValidator>();
        return services;
    }
}
