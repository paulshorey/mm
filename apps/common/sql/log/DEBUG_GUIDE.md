# Debugging Guide for sqlLogAdd Issues

## Issues Fixed

1. **Removed duplicate "use server" directive** - Was declared both at file level and inside function
2. **Fixed misplaced console.error** - Was outside catch block but inside try block
3. **Added proper return value** - Now returns the inserted row on success, null on failure
4. **Improved error handling** - Better connection management and error logging
5. **Enhanced console logging** - Added timestamps and structured logging for better debugging

## Testing Instructions

### 1. Test Database Connection

First, run the diagnostic to check if your database is accessible:

```bash
# Start your dev server
cd apps/common
pnpm dev

# In another terminal, test the diagnostic endpoint
curl http://localhost:3000/api/test-db?mode=diagnostic
```

This will check:

- Environment variables (NEON_DATABASE_URL)
- Database connection
- Table existence
- Insert/retrieve operations

### 2. Test Simple Logging

Test the simplified debug function:

```bash
curl http://localhost:3000/api/test-db?mode=simple
```

### 3. Test Full sqlLogAdd Function

Test the actual fixed function:

```bash
curl http://localhost:3000/api/test-db?mode=full
```

Or with POST:

```bash
curl -X POST http://localhost:3000/api/test-db \
  -H "Content-Type: application/json" \
  -d '{"message": "Test from curl", "name": "info"}'
```

## Common Issues and Solutions

### Issue 1: Database Connection Fails in Local Development

**Symptoms:**

- No data saved to database
- Connection timeout errors

**Solution:**

1. Check your `.env.local` file has `NEON_DATABASE_URL` set correctly
2. Ensure the database URL includes SSL parameters: `?sslmode=require`
3. Check if your IP is whitelisted in Neon dashboard (if IP restrictions are enabled)

### Issue 2: Console Logs Not Showing in Production

**Symptoms:**

- Only certain console.logs appear
- Logs appear out of order

**Explanation:**
Next.js server actions and edge functions may buffer or filter console output differently in production. The fixed version uses structured logging with timestamps to make debugging easier.

### Issue 3: Function Exits Without Error

**Possible Causes:**

1. **Connection pool exhaustion** - The pool might be exhausted if connections aren't being released properly
2. **Async execution context** - Server actions might be terminated if they take too long
3. **Missing await** - If the function is called without await, it might not complete

**Solutions in the Fixed Code:**

- Always release connections in `finally` block
- Better error handling to catch and log all errors
- Proper return values to detect success/failure

## Monitoring in Production

To monitor the function in production:

1. **Check Vercel Function Logs:**

   ```bash
   vercel logs --filter sqlLogAdd
   ```

2. **Use the diagnostic endpoint:**

   ```bash
   curl https://your-app.vercel.app/api/test-db?mode=diagnostic
   ```

3. **Check the database directly:**
   Connect to your Neon database and run:
   ```sql
   SELECT * FROM logs_v1
   WHERE time > NOW() - INTERVAL '1 hour'
   ORDER BY time DESC
   LIMIT 10;
   ```

## Environment Variables Required

Make sure these are set in both local and production:

```env
NEON_DATABASE_URL=postgresql://user:pass@host/database?sslmode=require
NODE_ENV=development|production
SERVER_NAME=your-server-name
APP_NAME=common
```

## Next Steps

1. Deploy the fixed code to production
2. Test using the diagnostic endpoint
3. Monitor logs to ensure all console.log statements appear
4. If issues persist, use the `sqlLogAddDebug` function for more detailed debugging

## Emergency Fallback

If logging still fails, you can temporarily use the `sqlLogAddDebug` function from `diagnostic.ts` which has even more verbose debugging output.
