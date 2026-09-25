using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
namespace Contacts.Api.Auth;

public sealed class AuthSettings
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string SigningKey { get; set; } = "";
    public string Issuer { get; set; } = "Contacts.Api";
    public string Audience { get; set; } = "Contacts.Web";
}
public sealed record TokenResponse(string AccessToken, DateTime ExpiresAtUtc, string Username);
public interface ITokenService { TokenResponse? Authenticate(string username, string password); }
public sealed class TokenService(AuthSettings settings) : ITokenService
{
    public TokenResponse? Authenticate(string username, string password)
    {
        // Constant-time hashes avoid comparing secret strings directly. Credentials come from the environment.
        var expected = SHA256.HashData(Encoding.UTF8.GetBytes(settings.Password));
        var provided = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        var passwordMatches = CryptographicOperations.FixedTimeEquals(expected, provided);
        if (!passwordMatches || !string.Equals(username, settings.Username, StringComparison.Ordinal)) return null;
        var expires = DateTime.UtcNow.AddMinutes(30);
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience,
            new[] { new Claim(JwtRegisteredClaimNames.Sub, username), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) },
            notBefore: DateTime.UtcNow, expires: expires,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey)), SecurityAlgorithms.HmacSha256));
        return new(new JwtSecurityTokenHandler().WriteToken(token), expires, username);
    }
}
