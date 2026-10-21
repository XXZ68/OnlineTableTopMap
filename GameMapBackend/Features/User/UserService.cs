using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GameMapBackend.Data;

namespace GameMapBackend.Features.User
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<UserEntity> _passwordHasher;

        public UserService(
            AppDbContext context,
            IPasswordHasher<UserEntity> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<AuthResponseDto> RegisterAsync(AuthRequestDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            {
                throw new InvalidOperationException(
                    "Benutzername bereits vergeben.");
            }

            var user = new UserEntity
            {
                Username = dto.Username
            };

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                dto.Password
            );

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new AuthResponseDto(user.Id, user.Username);
        }

        public async Task<AuthResponseDto?> LoginAsync(AuthRequestDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null)
            {
                return null;
            }

            var result = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.Password
            );

            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }

            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(
                    user,
                    dto.Password
                );

                await _context.SaveChangesAsync();
            }

            return new AuthResponseDto(user.Id, user.Username);
        }
    }
}