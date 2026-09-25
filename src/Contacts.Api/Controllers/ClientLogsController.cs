using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
namespace Contacts.Api.Controllers;
public sealed record ClientLogRequest([Required, RegularExpression("^(ui-error|contact-created|contact-updated|contact-deleted|list-loaded)$")] string Event,
    [StringLength(80)] string? Code);

[ApiController, Route("api/client-logs"), Authorize, EnableRateLimiting("client-logs")]
public sealed class ClientLogsController(ILogger<ClientLogsController> logger) : ControllerBase
{
    [HttpPost]
    public IActionResult Write(ClientLogRequest entry)
    {
        // Event codes only: never accept contact payloads, credentials or token values.
        logger.LogInformation("UI event {UiEvent}; code {UiCode}", entry.Event, entry.Code);
        return NoContent();
    }
}
