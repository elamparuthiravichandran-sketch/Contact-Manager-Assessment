using Contacts.Api.Domain;
using Microsoft.EntityFrameworkCore;
namespace Contacts.Api.Data;
public static class DatabaseInitializer
{
    public static async Task InitializeAsync(ContactsDbContext db, CancellationToken ct = default)
    {
        // Assessment bootstrap for a fresh database. Use versioned migrations for a maintained deployment.
        await db.Database.EnsureCreatedAsync(ct);
        if (await db.Contacts.AnyAsync(ct)) return;
        var rows = new[]
        {
            new[] { "Ananya", "Raman", "ananya.raman@example.com", "+91 90000 00001", "12 Demo Street", "Chennai", "Tamil Nadu", "India", "600001" },
            new[] { "Arjun", "Shah", "arjun.shah@example.com", "+91 90000 00002", "24 Sample Road", "Bengaluru", "Karnataka", "India", "560001" },
            new[] { "Maya", "Thomas", "maya.thomas@example.com", "+91 90000 00003", "8 Example Avenue", "Kochi", "Kerala", "India", "682001" },
            new[] { "Daniel", "Lee", "daniel.lee@example.com", "+1 202 555 0104", "45 Demo Lane", "Seattle", "Washington", "United States", "98101" },
            new[] { "Sara", "Wilson", "sara.wilson@example.com", "+44 7700 900005", "10 Sample Close", "London", "England", "United Kingdom", "SW1A 1AA" },
            new[] { "Noah", "Martin", "noah.martin@example.com", "+61 2 5550 0106", "33 Example Way", "Sydney", "New South Wales", "Australia", "2000" }
        };
        for (var index = 0; index < rows.Length; index++)
        {
            var r = rows[index];
            db.Contacts.Add(new Contact { Id = Guid.Parse($"00000000-0000-0000-0000-{index + 1:D12}"),
                FirstName = r[0], LastName = r[1], Email = r[2], PhoneNumber = r[3], Address = r[4],
                City = r[5], State = r[6], Country = r[7], PostalCode = r[8],
                CreatedAtUtc = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc).AddMinutes(-index) });
        }
        await db.SaveChangesAsync(ct);
    }
}
