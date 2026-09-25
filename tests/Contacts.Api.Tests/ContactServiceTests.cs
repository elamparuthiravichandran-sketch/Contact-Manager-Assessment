using Contacts.Api.Application;
using Contacts.Api.Contracts;
using Contacts.Api.Data;
using Contacts.Api.Domain;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
namespace Contacts.Api.Tests;

public sealed class ContactServiceTests
{
    private readonly FakeRepository repository = new();
    private ContactService Service => new(repository, NullLogger<ContactService>.Instance);
    internal static ContactInput Input() => new() { FirstName = "  Alex  ", LastName = "Kim", Email = "alex@example.com",
        PhoneNumber = "+1 202 555 0100", Address = "12 Sample St", City = "Seattle", State = "WA", Country = "USA", PostalCode = "98101" };

    [Fact] public async Task Create_assigns_identity_trims_and_persists_all_fields()
    {
        var input = Input();
        var result = await Service.HandleAsync(new CreateContactCommand(input), default);
        Assert.NotEqual(Guid.Empty, result.Id); Assert.NotEqual(Guid.Empty, result.Version);
        Assert.Equal("Alex", result.FirstName); Assert.Equal(input.LastName, result.LastName);
        Assert.Equal(input.Email, result.Email); Assert.Equal(input.PhoneNumber, result.PhoneNumber);
        Assert.Equal(input.Address, result.Address); Assert.Equal(input.City, result.City);
        Assert.Equal(input.State, result.State); Assert.Equal(input.Country, result.Country); Assert.Equal(input.PostalCode, result.PostalCode);
        Assert.Single(repository.Items); Assert.Equal(1, repository.SaveCount);
    }
    [Fact] public async Task Update_changes_version_and_preserves_identity_and_creation_date()
    {
        var entity = new Contact(); repository.Items.Add(entity); var oldVersion = entity.Version; var created = entity.CreatedAtUtc;
        var result = await Service.HandleAsync(new UpdateContactCommand(entity.Id, new UpdateContactRequest { FirstName = "New", Version = oldVersion }), default);
        Assert.Equal(entity.Id, result.Id); Assert.Equal("New", result.FirstName); Assert.Equal(created, result.CreatedAtUtc);
        Assert.NotEqual(oldVersion, result.Version); Assert.Equal(1, repository.SaveCount);
    }
    [Fact] public async Task Update_rejects_stale_version_without_saving()
    {
        var entity = new Contact { FirstName = "Original" }; repository.Items.Add(entity);
        await Assert.ThrowsAsync<ContactConflictException>(() => Service.HandleAsync(new UpdateContactCommand(entity.Id, new UpdateContactRequest { Version = Guid.NewGuid() }), default));
        Assert.Equal("Original", entity.FirstName); Assert.Equal(0, repository.SaveCount);
    }
    [Fact] public async Task Delete_removes_matching_version()
    {
        var entity = new Contact(); repository.Items.Add(entity);
        await Service.HandleAsync(new DeleteContactCommand(entity.Id, entity.Version), default);
        Assert.Empty(repository.Items); Assert.Equal(1, repository.SaveCount);
    }
    [Fact] public async Task Delete_rejects_stale_version()
    {
        var entity = new Contact(); repository.Items.Add(entity);
        await Assert.ThrowsAsync<ContactConflictException>(() => Service.HandleAsync(new DeleteContactCommand(entity.Id, Guid.NewGuid()), default));
        Assert.Single(repository.Items); Assert.Equal(0, repository.SaveCount);
    }
    [Fact] public async Task Missing_contact_throws_not_found() =>
        await Assert.ThrowsAsync<ContactNotFoundException>(() => Service.GetAsync(Guid.NewGuid(), default));

    private sealed class FakeRepository : IContactRepository
    {
        public List<Contact> Items { get; } = new(); public int SaveCount { get; private set; }
        public Task<IReadOnlyList<Contact>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Contact>>(Items.ToArray());
        public Task<Contact?> FindAsync(Guid id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));
        public Task AddAsync(Contact c, CancellationToken ct) { Items.Add(c); return Task.CompletedTask; }
        public void Remove(Contact c) => Items.Remove(c);
        public Task SaveAsync(CancellationToken ct) { SaveCount++; return Task.CompletedTask; }
    }
}
