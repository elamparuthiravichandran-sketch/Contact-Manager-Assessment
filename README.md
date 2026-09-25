# Contact Manager

An Angular contact-management application backed by an ASP.NET Core Web API and Microsoft SQL Server. It includes responsive Bootstrap screens, separate add/edit/delete popup components, JWT authentication, Serilog logging, test data, API unit and integration tests, and browser tests.

## Quick start with Docker

Prerequisites: Docker Engine or Docker Desktop with Compose v2, Python 3, and internet access for the initial images/build. Use an x86-64 host supported by the SQL Server Linux image; allocate at least 4 GB of memory to Docker. On Windows, use Linux containers. SQL Server Developer edition is for development/testing.

From the extracted `contact-manager` directory:

```sh
python scripts/setup.py
docker compose up --build -d
```

The setup script prints the generated username and password and writes them to `.env`. Keep that file private. It is excluded from Git and Docker build contexts. On systems where Python is named `python3`, use that instead.

Open **http://localhost:8080** and sign in using those credentials. The database and six fictional sample contacts are created on first startup. Initial downloads can take several minutes. If the browser opens before the API is ready, retry after checking:

```sh
docker compose ps
docker compose logs api
```

API documentation: **http://localhost:5080/swagger**. To call protected endpoints in Swagger, call `POST /api/auth/login`, copy `accessToken`, and paste the token into **Authorize**. A basic process health endpoint is available at `/health`; it is not a database-readiness probe.

Stop while retaining data:

```sh
docker compose down
```

To intentionally delete all local demo data and rebuild a fresh seeded database:

```sh
docker compose down -v
docker compose up --build -d
```

## Run without Docker

Install .NET 8 SDK, Node.js 22.12 or newer in the 22.x series, Python 3, and SQL Server 2022 (or SQL Server Express/LocalDB on Windows). The application uses Angular 20, with dependencies pinned in `web/package-lock.json`.

1. Run `python scripts/setup.py`.
2. Configure your SQL Server connection. The configured account must be allowed to create `ContactsDb`, or you can run `database/schema-and-seed.sql` manually first.
3. Run the API using `python scripts/run-api.py`.
4. In a second terminal, run the Angular app.

PowerShell connection example for LocalDB:

```powershell
$env:ConnectionStrings__Contacts = 'Server=(localdb)\MSSQLLocalDB;Database=ContactsDb;Trusted_Connection=True;TrustServerCertificate=True'
python scripts/run-api.py
```

Bash connection example (replace the password with your local SQL login password):

```sh
export ConnectionStrings__Contacts='Server=localhost,1433;Database=ContactsDb;User Id=sa;Password=YOUR_SQL_PASSWORD;TrustServerCertificate=True'
python3 scripts/run-api.py
```

Angular terminal:

```sh
cd web
npm ci
npm start
```

Open **http://localhost:4200**. The Angular development proxy forwards `/api` requests to `127.0.0.1:5080`, avoiding a separate CORS configuration. Credentials remain on the server; only the login input and resulting token pass through the browser.

## Tests and validation

See `VALIDATION.md` for the exact checks performed when this package was prepared and any remaining limitations.

API unit and HTTP integration tests:

```sh
dotnet test tests/Contacts.Api.Tests/Contacts.Api.Tests.csproj --configuration Release
```

Unit tests cover creation/normalization, updates, deletion, missing records, stale writes, and signed JWTs. HTTP integration tests exercise the real ASP.NET pipeline, authentication, validation, CRUD, conflicts, and UI logging using an isolated relational SQLite database. Production uses SQL Server. SQLite tests do not replace SQL Server validation.

Angular production build and browser tests:

```sh
cd web
npm ci
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright runs desktop and mobile Chromium scenarios. Its HTTP fixtures isolate UI behavior; these are not full-stack tests. Scenarios cover failed login, protected routing, sign-out, validation, creation/highlighting, edit/delete/cancel, sorting all nine fields, search, mobile width, focus trapping, Escape, and recoverable API errors.

For a real SQL Server smoke test, start the Docker application and run from the repository root:

```sh
python scripts/smoke-test.py
```

The script checks unauthorized access, sign-in, invalid input, create/read/update/delete, newest-first ordering, stale-version conflicts, and UI logging. It removes the record it creates. Set `CONTACTS_URL` to use an alternative running URL.

GitHub Actions runs the API tests, Angular production build, and browser tests on pushes and pull requests.

## Architecture

```text
web/src/app/contacts/        List, add, edit, delete, shared form and dialog components
web/src/app/core/            Typed API client, authentication, interceptor, UI logger
src/Contacts.Api/Controllers/ HTTP endpoints and request/response handling
src/Contacts.Api/Application/ Write commands and contact service
src/Contacts.Api/Domain/      Contact entity
src/Contacts.Api/Data/        Repository interface, EF implementation, context and seed
src/Contacts.Api/Auth/        Credential validation and signed JWT creation
src/Contacts.Api/Infrastructure/ Centralized exception responses
tests/Contacts.Api.Tests/     xUnit unit and HTTP integration tests
web/e2e/                     Playwright browser tests
scripts/                     Setup, local API runner, full-stack smoke test
```

The MVC split uses ASP.NET controllers and domain models with Angular as the view layer. Controllers delegate to `IContactService`. Explicit create/update/delete command records describe writes. The service depends on `IContactRepository`, implemented with Entity Framework Core. The DI container manages scoped services and repository/context lifetimes. I/O operations are asynchronous and accept cancellation tokens.

The write path is controller → command handler/service → repository → EF Core → SQL Server. The implementation deliberately avoids a separate mediator dependency for this small assessment.

## Behavior and requirement coverage

| Requirement | Implementation |
| --- | --- |
| Angular with mobile Bootstrap layout | Responsive navigation, content, footer, form grid and scrollable table |
| All nine contact fields | Displayed in the table and editable in the form |
| Sort by any field heading | Ascending/descending sorting for all nine columns |
| Add/edit pages with popup presentation | Child routes `/contacts/new`, `/contacts/:id/edit`, `/contacts/:id/delete` render native modal dialogs |
| Separate add, edit and delete components | Three dedicated route components sharing accessible dialog/form components |
| New record at top and highlighted | Returns to list, clears search/sort, orders newest first, applies green row and “New” badge |
| JWT authorization | Signed 30-minute JWT, issuer/audience/lifetime/signature validation, API authorization, route guard and interceptor |
| API and UI logging | Serilog request/write logs; authenticated UI event endpoint; global UI error handler |
| API unit test application | Dedicated xUnit project plus relational HTTP integration tests |
| Complete test data and scripts | Six fictional contacts, optional SQL script, setup and smoke-test scripts |
| Repository, MVC, commands, interfaces, DI | Explicit layers and interfaces; command handlers in the application service |
| async/await and EF Core | Async API/service/repository data access |

The list initially sorts newest first. Choosing a header switches to that field's sort order. Search checks all nine fields. Required fields, length limits, email format and telephone characters are validated in both UI and API. Phone and postal-code values are strings so leading zeroes and international formats are retained.

Each record carries a version GUID. Update and delete requests must send the version they read. The API returns `409` for stale data, including a database-level concurrency race. The UI preserves an unsuccessful form and tells the user to refresh. The delete dialog requires explicit confirmation. Requests that fail validation return `400`, missing records return `404`, and unexpected server errors return a sanitized problem response with a trace identifier.

## Authentication and logging decisions

This assessment uses one configurable reviewer account from environment variables. There is no registration or user administration. Password comparison uses constant-time hash comparison. No real credentials are committed. For a maintained deployment, replace this demo login with an identity provider or ASP.NET Identity and a password-hash-backed user store.

Tokens are kept in memory, not local storage. Refreshing the page signs the user out; expiry also signs the user out. The application sends the token only to relative `/api/` endpoints. Logout clears the local token; there is no server revocation store, so an already-issued token remains valid until expiry. There is no refresh-token flow.

Serilog writes console output and daily files under `logs/`, retaining seven files. UI events use a small allowlist and contain event codes instead of contact data, passwords, or tokens. HTTP body logging is not enabled. Login and UI-log endpoints have single-instance fixed-window limits; rate limits are global to this demo, not per user. Docker log files inside the API container are ephemeral; use `docker compose logs api` for review.

## Scope and tradeoffs

- A shared address book with one reviewer account is assumed; contacts are not partitioned by owner.
- Email uniqueness is not imposed because the specification does not require it.
- Sorting/searching happen in the browser after fetching the list. This fits a small assessment dataset. A larger address book should use paginated server queries.
- `EnsureCreatedAsync` bootstraps a fresh demo database. It does not update an existing schema. Use versioned EF migrations for ongoing schema changes; do not mix `EnsureCreated` with migrations on the same database.
- Seeding runs when the database contains no contacts. Restarting after deleting every contact restores the six samples. For a maintained deployment, separate sample-data loading from application startup.
- Docker uses local HTTP ports bound to `127.0.0.1`, development Swagger, a SQL administrator account, and trusted development certificates. Before a public deployment, use HTTPS, a least-privilege database account, protected secret storage, and production settings. This package is configured for local evaluation.
- The source and test data were created for this assessment. No original email, phone screenshot, or employer document is included in the repository.

## GitHub submission

Create an empty repository in your own GitHub account, then run these commands from this directory. Replace the URL with your repository URL:

```sh
git init
git add .
git commit -m "Implement Angular and ASP.NET Core contact manager"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/contact-manager.git
git push -u origin main
```

Check that `.env`, dependencies, generated logs and build output are not included before pushing. Use a private repository and grant the designated reviewer access if appropriate. Run the tests and review the code so you can explain the design and implementation. The assessment asks candidates not to seek external assistance; confirm that AI-assisted work is acceptable before submitting this implementation. No repository has been created or email sent by this package.

## Framework references

- Angular compatibility: https://angular.dev/reference/versions
- ASP.NET JWT bearer authentication: https://learn.microsoft.com/aspnet/core/security/authentication/configure-jwt-bearer-authentication
