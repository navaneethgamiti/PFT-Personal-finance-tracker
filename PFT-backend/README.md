# PFT Backend

ASP.NET Core 9 backend for Personal Finance Tracker with PostgreSQL, JWT auth, background recurring scheduler, and modular architecture.

## Architecture

- Controllers
- Application Services
- DTOs
- Validators
- Repositories
- Domain Entities
- DbContext / PostgreSQL
- Background Jobs
- Auth Middleware
- Exception Middleware
- Logging

## Modules

- Auth: register, login, refresh, forgot/reset password
- Accounts: create, balances, transfer funds (transaction-safe)
- Categories: default/custom, edit, archive
- Transactions: CRUD, filters, search, pagination
- Budgets: monthly budgets, threshold alerts, duplicate previous month
- Goals: create/update, contribute/withdraw, progress tracking
- Recurring: CRUD, next-run logic, scheduled generation (idempotent)
- Reports: category spend, income vs expense, balance trend, goals overview, dashboard
- V2 Insights: cash flow forecasting, health score, savings-rate trend, net-worth trend
- V2 Rules Engine: merchant-based auto-categorization/tagging rules
- V2 Shared Accounts: account member management with roles (Owner/Editor/Viewer)

## Database Tables

- users
- accounts
- categories
- transactions
- budgets
- goals
- recurring_transactions
- refresh_tokens
- notifications
- audit_logs
- password_reset_tokens
- rules
- account_members

## Setup

1. Update `appsettings.json`:
- `ConnectionStrings:DefaultConnection`
- `Jwt:Key`

2. Restore/build:
```powershell
$env:DOTNET_CLI_HOME='personal-fincance-tracker\PFT-backend'
dotnet restore
dotnet build
```

3. (Recommended) create EF migration and apply:
```powershell
dotnet ef migrations add InitialCreate --project .\PFT.Backend\PFT.Backend.csproj
dotnet ef database update --project .\PFT.Backend\PFT.Backend.csproj
```

4. Run API:
```powershell
dotnet run --project .\PFT.Backend\PFT.Backend.csproj
```

Swagger UI is enabled in development.

## API Envelope

All endpoints return:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "traceId": "..."
}
```

## V2 Endpoints

- `GET /api/insights/health-score`
- `GET /api/insights/cashflow-forecast?days=30`
- `GET /api/insights/savings-rate-trend?months=6`
- `GET /api/insights/net-worth-trend?months=6`
- `GET /api/rules`
- `POST /api/rules`
- `PUT /api/rules/{id}`
- `DELETE /api/rules/{id}`
- `GET /api/sharedaccounts/{accountId}/members`
- `POST /api/sharedaccounts/members`
- `PUT /api/sharedaccounts/members/{memberId}/role`
- `DELETE /api/sharedaccounts/members/{memberId}`

or

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {}
  },
  "traceId": "..."
}
```
