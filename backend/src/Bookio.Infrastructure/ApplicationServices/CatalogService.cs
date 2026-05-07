using Bookio.Application.DTOs;
using Bookio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ServiceEntity = Bookio.Domain.Entities.Service;

namespace Bookio.Infrastructure.ApplicationServices;

public class CatalogService
{
    private readonly AppDbContext _db;

    public CatalogService(AppDbContext db) => _db = db;

    public async Task<List<ServiceDto>> GetAllAsync()
    {
        var services = await _db.Services.OrderBy(s => s.Name).ToListAsync();
        return services.Select(MapToDto).ToList();
    }

    public async Task<ServiceDto?> GetByIdAsync(Guid id)
    {
        var s = await _db.Services.FindAsync(id);
        return s == null ? null : MapToDto(s);
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceRequest req)
    {
        var service = new ServiceEntity
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Description = req.Description,
            Photo = req.Photo,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        return MapToDto(service);
    }

    public async Task<ServiceDto?> UpdateAsync(Guid id, UpdateServiceRequest req)
    {
        var service = await _db.Services.FindAsync(id);
        if (service == null) return null;
        service.Name = req.Name;
        service.Description = req.Description;
        service.Photo = req.Photo;
        service.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(service);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var service = await _db.Services.FindAsync(id);
        if (service == null) return false;
        _db.Services.Remove(service);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ServiceDto MapToDto(ServiceEntity s) =>
        new(s.Id, s.Name, s.Description, s.Photo, s.CreatedAt);
}
