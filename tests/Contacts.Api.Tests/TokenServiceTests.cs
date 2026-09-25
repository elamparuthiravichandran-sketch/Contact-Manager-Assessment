using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Contacts.Api.Auth;
using Microsoft.IdentityModel.Tokens;
using Xunit;
namespace Contacts.Api.Tests;
public sealed class TokenServiceTests
{
    internal static AuthSettings Settings() => new() { Username = "reviewer", Password = "Test-only-password!", SigningKey = "test-only-signing-key-at-least-32-bytes-long" };
    [Theory]
    [InlineData("wrong", "Test-only-password!")]
    [InlineData("reviewer", "wrong")]
    public void Invalid_credentials_rejected(string user, string password) => Assert.Null(new TokenService(Settings()).Authenticate(user, password));
    [Fact] public void Valid_credentials_produce_signed_expiring_token()
    {
        var settings = Settings(); var result = new TokenService(settings).Authenticate(settings.Username, settings.Password);
        Assert.NotNull(result);
        var handler = new JwtSecurityTokenHandler();
        handler.ValidateToken(result.AccessToken, new TokenValidationParameters {
            ValidateIssuer = true, ValidIssuer = settings.Issuer, ValidateAudience = true, ValidAudience = settings.Audience,
            ValidateLifetime = true, ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey))
        }, out var validated);
        Assert.IsType<JwtSecurityToken>(validated); Assert.InRange(result.ExpiresAtUtc, DateTime.UtcNow.AddMinutes(29), DateTime.UtcNow.AddMinutes(31));
    }
}
