## Migrating table to new database

Use connection URLs (host, port, user, password, and SSL options are parsed from the URL). Replace `OLD_DATABASE_URL`, `NEW_DATABASE_URL`, and `TABLE_NAME` with real values.

### Schema only:

```bash
pg_dump "$OLD_DATABASE_URL" --schema-only -t public.TABLE_NAME \
  | psql "$NEW_DATABASE_URL" -v ON_ERROR_STOP=1
```

### With data:

```bash
pg_dump "$OLD_DATABASE_URL" -t public.TABLE_NAME \
  | psql "$NEW_DATABASE_URL" -v ON_ERROR_STOP=1
```

### Tips

### Schema name

Usually `public`. Use `-t public.log_v1` or just `-t log_v1`.

### `ON_ERROR_STOP=1`

Makes psql exit on first error instead of continuing.

### Dry run

Omit the `| psql ...` part and redirect to a file to inspect the SQL first:

```bash
pg_dump "$OLD_DATABASE_URL" --schema-only -t public.TABLE_NAME > schema.sql
```

Then apply: `psql "$NEW_DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql`

### Multiple tables

Use `-t public.table1 -t public.table2` or `-t 'public.table*'` (pattern).

### Sequence reset

After data migration with serial/identity columns:

```sql
SELECT setval(pg_get_serial_sequence('public.TABLE_NAME', 'id'), COALESCE((SELECT MAX(id) FROM public.TABLE_NAME), 0) + 1);
```

How would I know if the table has serial/identity columns?

You can tell in a few ways:

1. **`pg_get_serial_sequence`** — Returns the sequence name for a column, or `NULL` if it doesn’t use one (serial/identity columns use a sequence):

   ```sql
   SELECT pg_get_serial_sequence('public.log_v1', 'id');
   -- Returns: public.log_v1_id_seq (serial/identity)
   -- Returns: NULL (no sequence)
   ```

2. **`information_schema.columns`** — Check `column_default` for `nextval`:

   ```sql
   SELECT column_name, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'log_v1';
   -- Serial/identity columns have column_default like nextval('...'::regclass)
   ```

3. **`pg_attribute.attidentity`** — For identity columns only:

   ```sql
   SELECT a.attname, a.attidentity
   FROM pg_attribute a
   JOIN pg_class c ON a.attrelid = c.oid
   JOIN pg_namespace n ON c.relnamespace = n.oid
   WHERE c.relname = 'log_v1' AND n.nspname = 'public'
     AND a.attnum > 0 AND NOT a.attisdropped;
   -- attidentity = 'a' (ALWAYS) or 'd' (BY DEFAULT) means identity column
   ```

**Rule of thumb:** If there’s an `id` (or similar) column and you didn’t insert it manually, it’s likely serial or identity. Running `pg_get_serial_sequence('public.TABLE_NAME', 'id')` is the quickest check; a non‑null result means you should reset the sequence after migrating data.
