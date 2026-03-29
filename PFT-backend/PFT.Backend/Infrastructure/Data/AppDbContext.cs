using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using PFT.Backend.Domain.Entities;

namespace PFT.Backend.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    public DbSet<Rule> Rules => Set<Rule>();
    public DbSet<AccountMember> AccountMembers => Set<AccountMember>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Account>().HasIndex(x => new { x.UserId, x.Name });
        modelBuilder.Entity<Category>().HasIndex(x => new { x.UserId, x.Name, x.Type });
        modelBuilder.Entity<Transaction>().HasIndex(x => new { x.UserId, x.TransactionDateUtc });
        modelBuilder.Entity<Transaction>().HasIndex(x => new { x.UserId, x.SourceRecurringId, x.SourceRunAtUtc }).IsUnique();
        modelBuilder.Entity<Budget>().HasIndex(x => new { x.UserId, x.CategoryId, x.MonthStartUtc }).IsUnique();
        modelBuilder.Entity<Goal>().HasIndex(x => new { x.UserId, x.Name });
        modelBuilder.Entity<RecurringTransaction>().HasIndex(x => new { x.UserId, x.NextRunAtUtc });
        modelBuilder.Entity<Rule>().HasIndex(x => new { x.UserId, x.Priority });
        modelBuilder.Entity<AccountMember>().HasIndex(x => new { x.AccountId, x.MemberUserId }).IsUnique();
        modelBuilder.Entity<RefreshToken>().HasIndex(x => new { x.UserId, x.TokenHash }).IsUnique();
        modelBuilder.Entity<PasswordResetToken>().HasIndex(x => new { x.UserId, x.TokenHash }).IsUnique();

        modelBuilder.Entity<User>().Property(x => x.Email).HasMaxLength(256);
        modelBuilder.Entity<User>().Property(x => x.FullName).HasMaxLength(200);
        modelBuilder.Entity<Account>().Property(x => x.Balance).HasPrecision(18, 2);
        modelBuilder.Entity<Transaction>().Property(x => x.Amount).HasPrecision(18, 2);
        modelBuilder.Entity<Budget>().Property(x => x.LimitAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Goal>().Property(x => x.TargetAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Goal>().Property(x => x.CurrentAmount).HasPrecision(18, 2);
        modelBuilder.Entity<RecurringTransaction>().Property(x => x.Amount).HasPrecision(18, 2);

        ApplySnakeCaseNames(modelBuilder);
    }

    private static void ApplySnakeCaseNames(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName() ?? entity.DisplayName()));

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName(StoreObjectIdentifier.Table(entity.GetTableName()!, entity.GetSchema())) ?? property.Name));
            }

            foreach (var key in entity.GetKeys())
            {
                if (key.GetName() is { } keyName)
                {
                    key.SetName(ToSnakeCase(keyName));
                }
            }

            foreach (var fk in entity.GetForeignKeys())
            {
                if (fk.GetConstraintName() is { } constraintName)
                {
                    fk.SetConstraintName(ToSnakeCase(constraintName));
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                if (index.GetDatabaseName() is { } indexName)
                {
                    index.SetDatabaseName(ToSnakeCase(indexName));
                }
            }
        }
    }

    private static string ToSnakeCase(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        var chars = new List<char>(input.Length + 8);
        for (var i = 0; i < input.Length; i++)
        {
            var c = input[i];
            if (char.IsUpper(c))
            {
                if (i > 0 && input[i - 1] != '_')
                {
                    chars.Add('_');
                }
                chars.Add(char.ToLowerInvariant(c));
            }
            else
            {
                chars.Add(c);
            }
        }

        return new string(chars.ToArray());
    }
}
