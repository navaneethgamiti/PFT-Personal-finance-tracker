using Microsoft.EntityFrameworkCore;
using PFT.Backend.Infrastructure.Data;

namespace PFT.Backend.Infrastructure.Repositories;

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> FindAsync(Guid id, CancellationToken ct);
    Task AddAsync(TEntity entity, CancellationToken ct);
    void Remove(TEntity entity);
    Task<int> SaveChangesAsync(CancellationToken ct);
}

public class Repository<TEntity>(AppDbContext db) : IRepository<TEntity> where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>().AsQueryable();

    public async Task<TEntity?> FindAsync(Guid id, CancellationToken ct) => await db.Set<TEntity>().FindAsync([id], ct);

    public async Task AddAsync(TEntity entity, CancellationToken ct) => await db.Set<TEntity>().AddAsync(entity, ct);

    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
