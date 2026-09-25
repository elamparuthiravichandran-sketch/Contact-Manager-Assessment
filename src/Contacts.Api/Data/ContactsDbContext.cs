using Contacts.Api.Domain;
using Microsoft.EntityFrameworkCore;
namespace Contacts.Api.Data;

public sealed class ContactsDbContext(DbContextOptions<ContactsDbContext> options) : DbContext(options)
{
    public DbSet<Contact> Contacts => Set<Contact>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        var c = model.Entity<Contact>();
        c.HasKey(x => x.Id);
        c.Property(x => x.FirstName).HasMaxLength(80).IsRequired();
        c.Property(x => x.LastName).HasMaxLength(80).IsRequired();
        c.Property(x => x.Email).HasMaxLength(254).IsRequired();
        c.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        c.Property(x => x.Address).HasMaxLength(200).IsRequired();
        c.Property(x => x.City).HasMaxLength(80).IsRequired();
        c.Property(x => x.State).HasMaxLength(80).IsRequired();
        c.Property(x => x.Country).HasMaxLength(80).IsRequired();
        c.Property(x => x.PostalCode).HasMaxLength(20).IsRequired();
        c.Property(x => x.Version).IsConcurrencyToken();
        c.HasIndex(x => x.CreatedAtUtc);
    }
}
