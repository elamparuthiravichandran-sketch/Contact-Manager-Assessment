using System.ComponentModel.DataAnnotations;
using Contacts.Api.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
namespace Contacts.Api.Controllers;
public sealed record LoginRequest([Required, StringLength(100)] string Username, [Required, StringLength(200)] string Password);

[ApiController, Route("api/auth")]
public sealed class AuthController(ITokenService tokens, ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login"), EnableRateLimiting("login")]
    public ActionResult<TokenResponse> Login(LoginRequest request)
    {
        var result = tokens.Authenticate(request.Username, request.Password);
        if (result is null)
        {
            logger.LogWarning("Login rejected");
            return Problem(statusCode: 401, title: "Invalid username or password.");
        }
        logger.LogInformation("Login succeeded");
        return Ok(result);
    }
}
