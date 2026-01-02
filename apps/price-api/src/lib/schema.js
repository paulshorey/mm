const { pool } = require("./db");

/**
 * Get database schema information
 * Returns list of tables with their columns and data types
 */
async function getSchema() {
  // Get all tables in the public schema
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = tablesResult.rows.map((row) => row.table_name);

  // Get columns for each table
  const schema = {};
  for (const tableName of tables) {
    const columnsResult = await pool.query(
      `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position
    `,
      [tableName]
    );

    schema[tableName] = columnsResult.rows.map((col) => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === "YES",
      default: col.column_default,
      maxLength: col.character_maximum_length,
    }));
  }

  return {
    tableCount: tables.length,
    tables: schema,
  };
}

module.exports = { getSchema };
