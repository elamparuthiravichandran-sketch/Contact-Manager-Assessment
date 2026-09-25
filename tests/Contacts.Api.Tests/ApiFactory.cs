using Contacts.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
namespace Contacts.Api.Tests;

// A real HTTP pipeline and relational SQLite database; production remains SQL Server.
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    public ApiFactory() { connection.Open(); }
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> {
            ["Auth:Username"] = "reviewer", ["Auth:Password"] = "Test-only-password!",
            ["Auth:SigningKey"] = "test-only-signing-key-at-least-32-bytes-long",
            ["ConnectionStrings:Contacts"] = "unused", ["Database:Initialize"] = "true"
        }));
        builder.ConfigureServices(services => {
            services.RemoveAll<ContactsDbContext>();
            services.RemoveAll<DbContextOptions<ContactsDbContext>>();
            services.AddDbContext<ContactsDbContext>(options => options.UseSqlite(connection));
        });
    }
    protected override void Dispose(bool disposing) { base.Dispose(disposing); if (disposing) connection.Dispose(); }
}
