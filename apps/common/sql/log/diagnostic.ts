"use server";

import { getDb } from "../../lib/neon";

/**
 * Diagnostic function to test database connectivity and logging
 * Run this to identify where the issue is occurring
 */
export const testDatabaseConnection = async function () {
  const results = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
    success: false,
    error: null as any,
  };

  // Step 1: Check environment variables
  results.steps.push({
    step: "env_check",
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    SERVER_NAME: process.env.SERVER_NAME,
    APP_NAME: process.env.APP_NAME,
  });

  // Step 2: Test database connection
  let client = null;
  try {
    results.steps.push({ step: "get_pool", status: "attempting" });
    const pool = getDb();
    results.steps.push({ step: "get_pool", status: "success" });

    results.steps.push({ step: "connect", status: "attempting" });
    client = await pool.connect();
    results.steps.push({ step: "connect", status: "success" });

    // Step 3: Test simple query
    results.steps.push({ step: "simple_query", status: "attempting" });
    const testResult = await client.query("SELECT NOW() as current_time");
    results.steps.push({
      step: "simple_query",
      status: "success",
      result: testResult.rows[0],
    });

    // Step 4: Check if logs_v1 table exists
    results.steps.push({ step: "check_table", status: "attempting" });
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'logs_v1'
      ) as table_exists
    `);
    results.steps.push({
      step: "check_table",
      status: "success",
      table_exists: tableCheck.rows[0].table_exists,
    });

    // Step 5: Test insert into logs_v1
    if (tableCheck.rows[0].table_exists) {
      results.steps.push({ step: "test_insert", status: "attempting" });
      const insertResult = await client.query(
        `INSERT INTO logs_v1(name, message, stack, access_key, server_name, app_name, node_env, category, tag, time)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name, message`,
        [
          "debug",
          "Database connection test",
          JSON.stringify({ test: true, timestamp: results.timestamp }),
          "test_key",
          process.env.SERVER_NAME || "unknown",
          process.env.APP_NAME || "unknown",
          process.env.NODE_ENV || "unknown",
          "diagnostic",
          "test",
          new Date().toISOString(),
        ]
      );
      results.steps.push({
        step: "test_insert",
        status: "success",
        inserted_id: insertResult.rows[0].id,
      });

      // Step 6: Test retrieve
      results.steps.push({ step: "test_retrieve", status: "attempting" });
      const retrieveResult = await client.query(`SELECT * FROM logs_v1 WHERE id = $1`, [insertResult.rows[0].id]);
      results.steps.push({
        step: "test_retrieve",
        status: "success",
        retrieved: retrieveResult.rows.length > 0,
      });
    }

    results.success = true;
  } catch (error: any) {
    results.error = {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail,
    };
    results.steps.push({
      step: "error",
      error: results.error,
    });
  } finally {
    if (client) {
      try {
        client.release();
        results.steps.push({ step: "release", status: "success" });
      } catch (releaseError: any) {
        results.steps.push({
          step: "release",
          status: "error",
          error: releaseError?.message,
        });
      }
    }
  }

  // Log results to console for debugging
  console.log("=== DATABASE DIAGNOSTIC RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  console.log("=================================");

  return results;
};

/**
 * Simplified logging function with extensive debugging
 */
export const sqlLogAddDebug = async function (message: string, additionalData?: any) {
  const debugInfo = {
    function: "sqlLogAddDebug",
    timestamp: new Date().toISOString(),
    message,
    additionalData,
    steps: [] as string[],
  };

  try {
    debugInfo.steps.push("Starting function");
    console.log(`[DEBUG ${debugInfo.timestamp}] Starting sqlLogAddDebug`);

    // Check database URL
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error("NEON_DATABASE_URL is not set");
    }
    debugInfo.steps.push("Database URL verified");

    // Get connection
    debugInfo.steps.push("Getting connection");
    const client = await getDb().connect();
    debugInfo.steps.push("Got connection");

    try {
      // Execute insert
      debugInfo.steps.push("Executing insert");
      const result = await client.query(
        `INSERT INTO logs_v1(name, message, stack, access_key, server_name, app_name, node_env, category, tag, time)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          "debug",
          message,
          JSON.stringify(additionalData || {}),
          "",
          process.env.SERVER_NAME || "",
          process.env.APP_NAME || "",
          process.env.NODE_ENV || "",
          "debug",
          "sqlLogAddDebug",
          new Date().toISOString(),
        ]
      );
      debugInfo.steps.push(`Insert successful, ID: ${result.rows[0].id}`);

      console.log(`[DEBUG ${debugInfo.timestamp}] Insert successful`, {
        id: result.rows[0].id,
      });

      return { success: true, id: result.rows[0].id, debugInfo };
    } finally {
      client.release();
      debugInfo.steps.push("Connection released");
    }
  } catch (error: any) {
    debugInfo.steps.push(`Error: ${error?.message}`);
    console.error(`[DEBUG ${debugInfo.timestamp}] Error in sqlLogAddDebug`, {
      error: error?.message,
      debugInfo,
    });
    return { success: false, error: error?.message, debugInfo };
  }
};
