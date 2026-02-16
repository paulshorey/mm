/**
 * Test setup - runs before any test files via --import.
 * Ensures NEON_DATABASE_URL is set so db module does not throw during unit tests.
 * The real pool is never used when tests inject mock getStrengthRows.
 */
if (!process.env.NEON_DATABASE_URL) {
  process.env.NEON_DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}
