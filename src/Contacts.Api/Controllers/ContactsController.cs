using Contacts.Api.Application;
using Contacts.Api.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Contacts.Api.Controllers;

[ApiController, Route("api/contacts"), Authorize]
public sealed class ContactsController(IContactService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ContactResponse>>> List(CancellationToken ct) => Ok(await service.ListAsync(ct));
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContactResponse>> Get(Guid id, CancellationToken ct) => Ok(await service.GetAsync(id, ct));
    [HttpPost]
    public async Task<ActionResult<ContactResponse>> Create(ContactInput input, CancellationToken ct)
    {
        var result = await service.HandleAsync(new CreateContactCommand(input), ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ContactResponse>> Update(Guid id, UpdateContactRequest input, CancellationToken ct) =>
        Ok(await service.HandleAsync(new UpdateContactCommand(id, input), ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid version, CancellationToken ct)
    {
        await service.HandleAsync(new DeleteContactCommand(id, version), ct);
        return NoContent();
    }
}
