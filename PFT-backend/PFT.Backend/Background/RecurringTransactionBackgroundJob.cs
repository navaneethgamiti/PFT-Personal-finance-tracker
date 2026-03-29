using PFT.Backend.Application.Interfaces;
using Npgsql;

namespace PFT.Backend.Background;

public sealed class RecurringTransactionBackgroundJob(IServiceScopeFactory scopeFactory, ILogger<RecurringTransactionBackgroundJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var recurring = scope.ServiceProvider.GetRequiredService<IRecurringService>();
                var created = await recurring.ProcessDueTransactionsAsync(stoppingToken);
                if (created > 0)
                {
                    logger.LogInformation("Recurring job created {Count} transactions.", created);
                }
            }
            catch (Exception ex)
            {
                if (ex is PostgresException pg && pg.SqlState == "42P01")
                {
                    logger.LogWarning("Recurring background job skipped because required table is missing. Apply database migrations/schema and retry.");
                }
                else
                {
                    logger.LogError(ex, "Recurring background job failed.");
                }
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
