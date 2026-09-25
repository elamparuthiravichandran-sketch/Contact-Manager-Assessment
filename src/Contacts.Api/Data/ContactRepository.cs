using Contacts.Api.Domain;
using Microsoft.EntityFrameworkCore;
namespace Contacts.Api.Data;

public sealed class ContactRepository(ContactsDbContext db) : IContactRepository
{
    public async Task<IReadOnlyList<Contact>> ListAsync(CancellationToken ct) =>
        await db.Contacts.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).ThenBy(x => x.Id).ToListAsync(ct);
    public Task<Contact?> FindAsync(Guid id, CancellationToken ct) => db.Contacts.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task AddAsync(Contact contact, CancellationToken ct) => await db.Contacts.AddAsync(contact, ct);
    public void Remove(Contact contact) => db.Contacts.Remove(contact);
    public async Task SaveAsync(CancellationToken ct) => await db.SaveChangesAsync(ct);
}
