## Backing up and restoring large tables

Use connection URLs (host, port, user, password, and SSL options are parsed from the URL). Replace `DATABASE_URL` and `TABLE_NAME` with real values.

### Recommended: Directory format with parallel dump/restore

Best for large tables. Uses parallel workers for speed. Produces a directory (not a single file).

**Backup:**

```bash
pg_dump "$DATABASE_URL" -Fd -j 4 -t public.TABLE_NAME -f backup_dir
```

**Restore:**

```bash
pg_restore -d "$DATABASE_URL" -Fd -j 4 -v backup_dir
```

`-j 4` uses 4 parallel jobs. Increase based on CPU cores (e.g. `-j 8`). `pg_dump` opens `jobs + 1` connections—ensure `max_connections` allows it.

### Alternative: Custom format (single file)

Produces one compressed `.dump` file. Parallel dump not supported; parallel restore is.

**Backup:**

```bash
pg_dump "$DATABASE_URL" -Fc -t public.TABLE_NAME -f backup.dump
```

**Restore:**

```bash
pg_restore -d "$DATABASE_URL" -Fc -j 4 -v backup.dump
```

### Plain SQL with gzip (simple, slow for huge tables)

**Backup:**

```bash
pg_dump "$DATABASE_URL" -t public.TABLE_NAME | gzip > backup.sql.gz
```

**Restore:**

```bash
gunzip -c backup.sql.gz | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
```

---

### Tips

#### Schema vs data

- **Schema only:** Add `--schema-only` to `pg_dump` (no data).
- **Data only:** Add `-a` / `--data-only` to `pg_dump` (schema must already exist in target).

#### Compression for tables with already-compressed data

If the table has columns like `bytea` or stored blobs, built-in compression can slow things down. Disable it and compress the archive externally:

```bash
# Dump with no compression
pg_dump "$DATABASE_URL" -Fd -j 4 -Z 0 -t public.TABLE_NAME -f backup_dir

# Then compress the directory
tar -cf - backup_dir | pigz -p 4 > backup_dir.tar.gz

# Restore: decompress first, then pg_restore
pigz -dc backup_dir.tar.gz | tar -xf -
pg_restore -d "$DATABASE_URL" -Fd -j 4 -v backup_dir
```

#### Restore into a clean table

Use `--clean` with `pg_restore` to drop the table first (requires `--if-exists` to avoid errors if it doesn’t exist):

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists -Fd -j 4 backup_dir
```

#### Sequence reset after data restore

If the table has serial/identity columns, reset the sequence so new inserts get correct IDs:

```sql
SELECT setval(pg_get_serial_sequence('public.TABLE_NAME', 'id'), COALESCE((SELECT MAX(id) FROM public.TABLE_NAME), 0) + 1);
```

Check for serial/identity: `SELECT pg_get_serial_sequence('public.TABLE_NAME', 'id');` — non‑null means a sequence exists.

#### Verify after restore

```sql
SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE relname = 'TABLE_NAME';
```

Compare row counts between source and target (e.g. `SELECT COUNT(*) FROM public.TABLE_NAME`).

#### Verbose output

Add `-v` to `pg_dump` and `pg_restore` to see progress.

#### Connection URL format

Use full URLs like `postgresql://user:pass@host:port/dbname?sslmode=require`. Cloud providers (Neon, Railway) include SSL and other options in the URL—use it as-is. See [connect.md](./connect.md) for details.
