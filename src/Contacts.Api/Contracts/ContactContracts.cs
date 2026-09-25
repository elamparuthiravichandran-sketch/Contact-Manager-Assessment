using System.ComponentModel.DataAnnotations;
namespace Contacts.Api.Contracts;

public class ContactInput
{
    [Required, StringLength(80)] public string FirstName { get; set; } = "";
    [Required, StringLength(80)] public string LastName { get; set; } = "";
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = "";
    [Required, StringLength(30), RegularExpression(@"^[+0-9() .-]{7,30}$", ErrorMessage = "Use 7–30 phone characters: digits, spaces, +, -, . or parentheses.")]
    public string PhoneNumber { get; set; } = "";
    [Required, StringLength(200)] public string Address { get; set; } = "";
    [Required, StringLength(80)] public string City { get; set; } = "";
    [Required, StringLength(80)] public string State { get; set; } = "";
    [Required, StringLength(80)] public string Country { get; set; } = "";
    [Required, StringLength(20)] public string PostalCode { get; set; } = "";
}
public sealed class UpdateContactRequest : ContactInput
{
    public Guid Version { get; set; }
}
public sealed record ContactResponse(Guid Id, string FirstName, string LastName, string Email,
    string PhoneNumber, string Address, string City, string State, string Country,
    string PostalCode, DateTime CreatedAtUtc, Guid Version);
