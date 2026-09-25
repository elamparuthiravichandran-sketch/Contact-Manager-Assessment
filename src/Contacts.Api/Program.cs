using System.Text;
using System.Threading.RateLimiting;
using Contacts.Api.Application;
using Contacts.Api.Auth;
using Contacts.Api.Data;
using Contacts.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, config) => config
    .MinimumLevel.Information().MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext().WriteTo.Console()
    .WriteTo.File("logs/contacts-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7));
builder.Services.AddSingleton(services =>
{
    var auth = services.GetRequiredService<IConfiguration>().GetSection("Auth").Get<AuthSettings>() ?? new();
    if (Encoding.UTF8.GetByteCount(auth.SigningKey) < 32 || string.IsNullOrWhiteSpace(auth.Username) || auth.Password.Length < 12)
        throw new InvalidOperationException("Set Auth__Username, Auth__Password (12+ characters), and Auth__SigningKey (32+ bytes).");
    return auth;
});
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddDbContext<ContactsDbContext>(options => options.UseSqlServer(
    builder.Configuration.GetConnectionString("Contacts") ?? throw new InvalidOperationException("Set ConnectionStrings__Contacts.")));
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddControllers();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme).Configure<AuthSettings>((options, auth) =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = auth.Issuer, ValidAudience = auth.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(auth.SigningKey)),
        ClockSkew = TimeSpan.FromSeconds(15)
    };
});
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    // Per-application budgets suit this single-reviewer demo; use distributed per-user limits at scale.
    options.AddFixedWindowLimiter("login", x => { x.PermitLimit = 20; x.Window = TimeSpan.FromMinutes(1); x.QueueLimit = 0; });
    options.AddFixedWindowLimiter("client-logs", x => { x.PermitLimit = 120; x.Window = TimeSpan.FromMinutes(1); x.QueueLimit = 0; });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Contact Manager API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
    });
});
var app = builder.Build();
_ = app.Services.GetRequiredService<AuthSettings>();
app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
if (builder.Configuration.GetValue<bool>("Database:Initialize"))
{
    using var scope = app.Services.CreateScope();
    await DatabaseInitializer.InitializeAsync(scope.ServiceProvider.GetRequiredService<ContactsDbContext>());
}
app.Run();
public partial class Program { }
