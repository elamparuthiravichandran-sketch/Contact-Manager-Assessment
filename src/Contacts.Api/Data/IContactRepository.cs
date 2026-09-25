using Contacts.Api.Domain;
namespace Contacts.Api.Data;

public interface IContactRepository
{
    Task<IReadOnlyList<Contact>> ListAsync(CancellationToken ct);
    Task<Contact?> FindAsync(Guid id, CancellationToken ct);
    Task AddAsync(Contact contact, CancellationToken ct);
    void Remove(Contact contact);
    Task SaveAsync(CancellationToken ct);
}
