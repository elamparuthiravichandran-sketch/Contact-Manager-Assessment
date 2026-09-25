using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Contacts.Api.Auth;
using Contacts.Api.Contracts;
using Xunit;
namespace Contacts.Api.Tests;
public sealed class ApiIntegrationTests
{
    [Fact] public async Task Contacts_require_authentication()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/contacts")).StatusCode);
    }
    [Fact] public async Task Invalid_login_is_unauthorized()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new { username = "reviewer", password = "bad" })).StatusCode);
    }
    [Fact] public async Task Complete_crud_flow_and_stale_update_protection()
    {
        using var factory = new ApiFactory(); using var client = await Authenticated(factory);
        var initial = await client.GetFromJsonAsync<ContactResponse[]>("/api/contacts"); Assert.Equal(6, initial!.Length);
        var create = await client.PostAsJsonAsync("/api/contacts", ContactServiceTests.Input());
        Assert.Equal(HttpStatusCode.Created, create.StatusCode); Assert.NotNull(create.Headers.Location);
        var contact = (await create.Content.ReadFromJsonAsync<ContactResponse>())!;
        var list = await client.GetFromJsonAsync<ContactResponse[]>("/api/contacts"); Assert.Equal(contact.Id, list![0].Id);
        var read = await client.GetFromJsonAsync<ContactResponse>(create.Headers.Location); Assert.Equal(contact.Email, read!.Email);
        var request = new UpdateContactRequest { FirstName = "Updated", LastName = contact.LastName, Email = contact.Email, PhoneNumber = contact.PhoneNumber,
            Address = contact.Address, City = contact.City, State = contact.State, Country = contact.Country, PostalCode = contact.PostalCode, Version = contact.Version };
        var update = await client.PutAsJsonAsync($"/api/contacts/{contact.Id}", request); Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = (await update.Content.ReadFromJsonAsync<ContactResponse>())!; Assert.Equal("Updated", updated.FirstName);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PutAsJsonAsync($"/api/contacts/{contact.Id}", request)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.DeleteAsync($"/api/contacts/{contact.Id}?version={contact.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/contacts/{contact.Id}?version={updated.Version}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/contacts/{contact.Id}")).StatusCode);
    }
    [Fact] public async Task Invalid_contact_returns_validation_problem()
    {
        using var factory = new ApiFactory(); using var client = await Authenticated(factory);
        var input = ContactServiceTests.Input(); input.Email = "not-an-email"; input.FirstName = " ";
        var response = await client.PostAsJsonAsync("/api/contacts", input);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(); Assert.Contains("Email", body); Assert.Contains("FirstName", body);
    }
    [Fact] public async Task Ui_events_are_authenticated_and_validated()
    {
        using var factory = new ApiFactory(); using var client = await Authenticated(factory);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/client-logs", new { @event = "contact-created", code = "" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/client-logs", new { @event = "arbitrary-payload", code = "" })).StatusCode);
    }
    private static async Task<HttpClient> Authenticated(ApiFactory factory)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { username = "reviewer", password = "Test-only-password!" });
        response.EnsureSuccessStatusCode();
        var token = (await response.Content.ReadFromJsonAsync<TokenResponse>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        return client;
    }
}
