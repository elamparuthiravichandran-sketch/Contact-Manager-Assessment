using Contacts.Api.Application;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Contacts.Api.Infrastructure;
public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception error, CancellationToken ct)
    {
        var (status, title) = error switch
        {
            ContactNotFoundException => (404, "Contact not found."),
            ContactConflictException or DbUpdateConcurrencyException => (409, "This contact changed. Close this dialog, refresh the list and try again."),
            _ => (500, "An unexpected error occurred. Please retry.")
        };
        if (status == 500) logger.LogError(error, "Request failed; trace {TraceId}", context.TraceIdentifier);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status, Title = title,
            Extensions = { ["traceId"] = context.TraceIdentifier }
        }, cancellationToken: ct);
        return true;
    }
}
