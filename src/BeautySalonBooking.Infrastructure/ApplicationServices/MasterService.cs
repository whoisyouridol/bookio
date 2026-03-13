using System.Security.Cryptography;
using BeautySalonBooking.Application.DTOs;
using BeautySalonBooking.Application.Interfaces;
using BeautySalonBooking.Domain.Entities;
using BeautySalonBooking.Domain.Enums;
using BeautySalonBooking.Infrastructure.Entities;
using BeautySalonBooking.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BeautySalonBooking.Infrastructure.ApplicationServices;

public class MasterService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly INotificationService _notifications;
    private readonly ILogger<MasterService> _logger;

    // Word list for readable temporary passwords
    private static readonly string[] PasswordWords =
        ["Glow", "Star", "Bloom", "Luxe", "Charm", "Style", "Grace", "Nova", "Luna", "Jade"];

    public MasterService(
        AppDbContext db,
        UserManager<AppUser> userManager,
        INotificationService notifications,
        ILogger<MasterService> logger)
    {
        _db = db;
        _userManager = userManager;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<List<MasterDto>> GetAllAsync()
    {
        var masters = await _db.Masters
            .Where(m => !m.IsDeleted)
            .Include(m => m.Ratings)
            .OrderBy(m => m.Id)
            .ToListAsync();

        var masterIds = masters.Select(m => m.Id).ToList();

        // Load linked users for all masters in one query
        var users = await _db.Set<AppUser>()
            .Where(u => u.MasterId != null && masterIds.Contains(u.MasterId.Value) && u.Role == AppRole.Master)
            .Select(u => new { u.MasterId, u.Email, u.FirstName, u.LastName, u.PhoneNumber, u.IsActive })
            .ToListAsync();

        var userByMaster = users.ToDictionary(u => u.MasterId!.Value);

        // Only return masters that have a linked user (public-facing list)
        return masters
            .Where(m => userByMaster.ContainsKey(m.Id))
            .Select(m => MapToDto(m, userByMaster[m.Id].Email ?? string.Empty, userByMaster[m.Id].FirstName,
                                  userByMaster[m.Id].LastName, userByMaster[m.Id].PhoneNumber, userByMaster[m.Id].IsActive))
            .ToList();
    }

    public async Task<MasterDto?> GetByIdAsync(Guid id)
    {
        var master = await _db.Masters
            .Include(m => m.Ratings)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (master == null) return null;

        var user = await _db.Set<AppUser>()
            .Where(u => u.MasterId == id)
            .Select(u => new { u.Email, u.FirstName, u.LastName, u.PhoneNumber, u.IsActive })
            .FirstOrDefaultAsync();

        // If no linked user exists (e.g. seed master), treat as active with empty name
        return MapToDto(master, user?.Email ?? string.Empty, user?.FirstName, user?.LastName, user?.PhoneNumber, user?.IsActive ?? true);
    }

    public async Task<(MasterDto? result, string? error)> CreateAsync(CreateMasterRequest req)
    {
        if (await _userManager.FindByEmailAsync(req.Email) != null)
            return (null, "An account with this email is already registered");

        var tempPassword = GenerateTemporaryPassword();

        var master = new Master
        {
            Id = Guid.NewGuid(),
            Photo = req.Photo,
            Description = req.Description,
            AutoApproveBookings = req.AutoApproveBookings,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Masters.Add(master);

        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email,
            EmailConfirmed = true,
            FirstName = req.FirstName,
            LastName = req.LastName,
            PhoneNumber = req.Phone,
            Role = AppRole.Master,
            MasterId = master.Id,
            IsActive = true,
            MustChangePassword = true,
        };

        var result = await _userManager.CreateAsync(user, tempPassword);
        if (!result.Succeeded)
            return (null, string.Join("; ", result.Errors.Select(e => e.Description)));

        master.UserId = user.Id;
        await _db.SaveChangesAsync();

        await _notifications.SendMasterCredentialsAsync(req.Email, tempPassword);
        _logger.LogInformation("Master created by admin: {Email} | Temp password: {Password}", req.Email, tempPassword);

        return (MapToDto(master, user.Email ?? string.Empty, user.FirstName, user.LastName, user.PhoneNumber, user.IsActive), null);
    }

    public async Task<MasterDto?> UpdateAsync(Guid id, UpdateMasterRequest req)
    {
        var master = await _db.Masters.Include(m => m.Ratings).FirstOrDefaultAsync(m => m.Id == id);
        if (master == null) return null;

        master.Photo = req.Photo;
        master.Description = req.Description;
        master.AutoApproveBookings = req.AutoApproveBookings;
        master.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var user = await _db.Set<AppUser>()
            .Where(u => u.MasterId == id)
            .Select(u => new { u.Email, u.FirstName, u.LastName, u.PhoneNumber, u.IsActive })
            .FirstOrDefaultAsync();

        return MapToDto(master, user?.Email ?? string.Empty, user?.FirstName, user?.LastName, user?.PhoneNumber, user?.IsActive ?? true);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var master = await _db.Masters.FindAsync(id);
        if (master == null) return false;
        master.IsDeleted = true;
        master.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<MasterServiceDto>> GetServicesAsync(Guid masterId)
    {
        var services = await _db.MasterServices
            .Include(ms => ms.Service)
            .Where(ms => ms.MasterId == masterId && ms.IsActive)
            .ToListAsync();

        return services.Select(ms => new MasterServiceDto(
            ms.Id, ms.MasterId, ms.ServiceId, ms.Service.Name, ms.Service.Photo, ms.Photo, ms.Description, ms.Price, ms.DurationMinutes, ms.IsActive
        )).ToList();
    }

    public async Task<List<RatingDto>> GetRatingsAsync(Guid masterId)
    {
        var ratings = await _db.MasterRatings
            .Where(r => r.MasterId == masterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ratings.Select(r => new RatingDto(r.Id, r.MasterId, r.BookingId, r.ClientName, r.Rating, r.Comment, r.CreatedAt)).ToList();
    }

    public async Task<AverageRatingDto> GetAverageRatingAsync(Guid masterId)
    {
        var ratings = await _db.MasterRatings.Where(r => r.MasterId == masterId).ToListAsync();
        if (!ratings.Any()) return new AverageRatingDto(0, 0);
        return new AverageRatingDto(ratings.Average(r => r.Rating), ratings.Count);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static MasterDto MapToDto(Master m, string email, string? firstName, string? lastName, string? phone, bool isUserActive)
    {
        var avg = m.Ratings.Any() ? (double?)m.Ratings.Average(r => r.Rating) : null;
        return new MasterDto(
            m.Id,
            email,
            firstName ?? string.Empty,
            lastName ?? string.Empty,
            phone,
            m.Photo,
            m.Description,
            m.AutoApproveBookings,
            m.IsDeleted,
            isUserActive,
            m.CreatedAt,
            avg,
            m.Ratings.Count);
    }

    private static string GenerateTemporaryPassword()
    {
        var rng = RandomNumberGenerator.Create();

        var wordBuf = new byte[1];
        rng.GetBytes(wordBuf);
        var word = PasswordWords[wordBuf[0] % PasswordWords.Length];

        var digitsBuf = new byte[2];
        rng.GetBytes(digitsBuf);
        var digits = (digitsBuf[0] % 90 + 10).ToString() + (digitsBuf[1] % 10).ToString();

        // Append one special char to meet common complexity rules
        const string specials = "!@#";
        var specBuf = new byte[1];
        rng.GetBytes(specBuf);
        var special = specials[specBuf[0] % specials.Length];

        return $"{word}{digits}{special}";
    }
}
