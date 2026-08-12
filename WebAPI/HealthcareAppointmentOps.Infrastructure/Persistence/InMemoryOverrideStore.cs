using System.Collections.Concurrent;

namespace HealthcareAppointmentOps.Infrastructure.Persistence;

/// <summary>
/// Per-session, in-process overlay of entity mutations for the demo.
/// Writes land here instead of the database; reads merge the overlay on top
/// of the seed-derived database rows. Buckets are keyed by the caller's demo-session
/// token and evicted after a period of inactivity, so a client that starts a fresh
/// session (e.g. a page refresh with a new token) sees only the real database records.
/// </summary>
public interface IInMemoryOverrideStore<TEntity, TKey> where TKey : notnull
{
    /// <summary>Records a created or updated entity for the session.</summary>
    void Upsert(string session, TKey key, TEntity entity);

    /// <summary>Marks an entity as removed for the session.</summary>
    void Tombstone(string session, TKey key);

    /// <summary>Returns the session's overlay entry for a key, if any.</summary>
    bool TryGet(string session, TKey key, out TEntity? entity, out bool tombstoned);

    /// <summary>
    /// Merges the session's overlay onto a set of database rows: overlay entries
    /// replace matching rows, tombstoned entries are dropped, and entities created
    /// in-session are appended. When <paramref name="include"/> is supplied it is the
    /// membership test for overlay entities (mirrors the DB query's filter).
    /// </summary>
    List<TEntity> Merge(string session, IEnumerable<TEntity> dbRows, Func<TEntity, TKey> keyOf, Func<TEntity, bool>? include = null);
}

public sealed class InMemoryOverrideStore<TEntity, TKey> : IInMemoryOverrideStore<TEntity, TKey>
    where TKey : notnull
{
    private sealed class Entry
    {
        public TEntity? Entity;
        public bool Deleted;
    }

    private sealed class Bucket
    {
        public readonly ConcurrentDictionary<TKey, Entry> Entries = new();
        public long LastAccessTicks = DateTime.UtcNow.Ticks;
    }

    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(30);
    private readonly ConcurrentDictionary<string, Bucket> _sessions = new();

    private Bucket Touch(string session)
    {
        EvictStale();
        var bucket = _sessions.GetOrAdd(session, _ => new Bucket());
        Interlocked.Exchange(ref bucket.LastAccessTicks, DateTime.UtcNow.Ticks);
        return bucket;
    }

    private void EvictStale()
    {
        var cutoff = DateTime.UtcNow.Ticks - Ttl.Ticks;
        foreach (var pair in _sessions)
        {
            if (Interlocked.Read(ref pair.Value.LastAccessTicks) < cutoff)
                _sessions.TryRemove(pair.Key, out _);
        }
    }

    public void Upsert(string session, TKey key, TEntity entity)
        => Touch(session).Entries[key] = new Entry { Entity = entity, Deleted = false };

    public void Tombstone(string session, TKey key)
        => Touch(session).Entries[key] = new Entry { Entity = default, Deleted = true };

    public bool TryGet(string session, TKey key, out TEntity? entity, out bool tombstoned)
    {
        entity = default;
        tombstoned = false;
        if (_sessions.TryGetValue(session, out var bucket) && bucket.Entries.TryGetValue(key, out var entry))
        {
            Interlocked.Exchange(ref bucket.LastAccessTicks, DateTime.UtcNow.Ticks);
            entity = entry.Entity;
            tombstoned = entry.Deleted;
            return true;
        }
        return false;
    }

    public List<TEntity> Merge(string session, IEnumerable<TEntity> dbRows, Func<TEntity, TKey> keyOf, Func<TEntity, bool>? include = null)
    {
        if (!_sessions.TryGetValue(session, out var bucket) || bucket.Entries.IsEmpty)
            return dbRows.ToList();

        Interlocked.Exchange(ref bucket.LastAccessTicks, DateTime.UtcNow.Ticks);

        var result = new List<TEntity>();
        var keysFromDb = new HashSet<TKey>();

        foreach (var row in dbRows)
        {
            var key = keyOf(row);
            keysFromDb.Add(key);

            if (bucket.Entries.TryGetValue(key, out var entry))
            {
                if (entry.Deleted)
                    continue;                                   // removed in-session
                if (include is null || include(entry.Entity!))
                    result.Add(entry.Entity!);                  // replaced in-session
            }
            else
            {
                result.Add(row);
            }
        }

        // Entities created in-session that the DB query did not (and could not) return.
        foreach (var pair in bucket.Entries)
        {
            if (pair.Value.Deleted || pair.Value.Entity is null || keysFromDb.Contains(pair.Key))
                continue;
            if (include is null || include(pair.Value.Entity))
                result.Add(pair.Value.Entity);
        }

        return result;
    }
}
