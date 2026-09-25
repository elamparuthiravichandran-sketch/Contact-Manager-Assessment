# Validation record

Prepared on 25 September 2026. This file distinguishes checks actually run from tests supplied for execution on a machine with the required services.

| Check | Result |
| --- | --- |
| Angular dependency installation and lockfile | Passed |
| Angular production build with strict TypeScript and template checking | Passed |
| Browser scenarios, desktop Chromium | Six scenarios passed, including focused rerun after dialog fix |
| Browser scenarios, mobile Chromium | Six scenarios passed, including focused rerun after dialog fix |
| Python setup/runner/smoke-test syntax | Passed |
| Compose YAML structure | Parsed successfully; three services present |
| .NET API build and xUnit suite | Not verified; environment blocked NuGet startup before restore/compilation |
| Docker stack and SQL Server CRUD smoke test | Not run; Docker/SQL Server unavailable in the preparation environment |
| GitHub Actions | Workflow supplied; not run here |

## Browser evidence

The first executable browser run passed ten of twelve cases. Desktop and mobile keyboard-focus tests exposed focus leaving the dialog at its last control. The dialog was updated to wrap Tab/Shift+Tab between its first and last enabled controls. Both affected cases passed on rerun. A subsequent Angular production build passed.

Browser tests use HTTP fixtures, so their success establishes frontend behavior rather than live backend or database behavior. The mobile profile uses Chromium with a mobile viewport and touch emulation, not real iOS Safari.

## Backend limitation

A .NET 8 SDK was downloaded successfully, but `dotnet test` and a direct MSBuild restore both failed before compilation with an environment-level `System.IO.IOException` creating the `NuGet-Migrations` named mutex. No API test is reported as passed. This does not establish that the API build or tests pass; they must be run on a normal development machine or in the supplied CI workflow.

## Before submission

1. Run `dotnet test tests/Contacts.Api.Tests/Contacts.Api.Tests.csproj --configuration Release`.
2. Run `python scripts/setup.py` and `docker compose up --build -d`.
3. Run `python scripts/smoke-test.py` against the running stack.
4. Sign in and manually create, edit and delete a contact. Check persistence after restarting the stack.
5. Review the code and README, confirm the employer permits AI assistance, then push the source to your own GitHub repository.
