using Contacts.Api.Contracts;
using Contacts.Api.Data;
using Contacts.Api.Domain;
namespace Contacts.Api.Application;

// Commands describe writes; the service is their handler, without a mediator dependency.
public sealed record CreateContactCommand(ContactInput Input);
public sealed record UpdateContactCommand(Guid Id, UpdateContactRequest Input);
public sealed record DeleteContactCommand(Guid Id, Guid Version);
public sealed class ContactNotFoundException : Exception { }
public sealed class ContactConflictException : Exception { }

public interface IContactService
{
    Task<IReadOnlyList<ContactResponse>> ListAsync(CancellationToken ct);
    Task<ContactResponse> GetAsync(Guid id, CancellationToken ct);
    Task<ContactResponse> HandleAsync(CreateContactCommand command, CancellationToken ct);
    Task<ContactResponse> HandleAsync(UpdateContactCommand command, CancellationToken ct);
    Task HandleAsync(DeleteContactCommand command, CancellationToken ct);
}
public sealed class ContactService(IContactRepository repository, ILogger<ContactService> logger) : IContactService
{
    public async Task<IReadOnlyList<ContactResponse>> ListAsync(CancellationToken ct) =>
        (await repository.ListAsync(ct)).Select(Map).ToArray();
    public async Task<ContactResponse> GetAsync(Guid id, CancellationToken ct) => Map(await Find(id, ct));
    public async Task<ContactResponse> HandleAsync(CreateContactCommand command, CancellationToken ct)
    {
        var contact = new Contact();
        Apply(contact, command.Input);
        await repository.AddAsync(contact, ct);
        await repository.SaveAsync(ct);
        logger.LogInformation("Contact {ContactId} created", contact.Id);
        return Map(contact);
    }
    public async Task<ContactResponse> HandleAsync(UpdateContactCommand command, CancellationToken ct)
    {
        var contact = await Find(command.Id, ct);
        CheckVersion(contact, command.Input.Version);
        Apply(contact, command.Input);
        contact.Version = Guid.NewGuid();
        await repository.SaveAsync(ct);
        logger.LogInformation("Contact {ContactId} updated", contact.Id);
        return Map(contact);
    }
    public async Task HandleAsync(DeleteContactCommand command, CancellationToken ct)
    {
        var contact = await Find(command.Id, ct);
        CheckVersion(contact, command.Version);
        repository.Remove(contact);
        await repository.SaveAsync(ct);
        logger.LogInformation("Contact {ContactId} deleted", contact.Id);
    }
    private async Task<Contact> Find(Guid id, CancellationToken ct) =>
        await repository.FindAsync(id, ct) ?? throw new ContactNotFoundException();
    private static void CheckVersion(Contact c, Guid version)
    {
        if (c.Version != version) throw new ContactConflictException();
    }
    private static void Apply(Contact c, ContactInput i)
    {
        c.FirstName = i.FirstName.Trim(); c.LastName = i.LastName.Trim();
        c.Email = i.Email.Trim(); c.PhoneNumber = i.PhoneNumber.Trim();
        c.Address = i.Address.Trim(); c.City = i.City.Trim(); c.State = i.State.Trim();
        c.Country = i.Country.Trim(); c.PostalCode = i.PostalCode.Trim();
    }
    private static ContactResponse Map(Contact c) => new(c.Id, c.FirstName, c.LastName, c.Email,
        c.PhoneNumber, c.Address, c.City, c.State, c.Country, c.PostalCode, c.CreatedAtUtc, c.Version);
}
