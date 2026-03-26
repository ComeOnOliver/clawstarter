import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Connection for queries
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// For migrations / one-off scripts
export function createMigrationClient() {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const migrationClient = postgres(connectionString, { max: 1 });
  return drizzle(migrationClient, { schema });
}

export type Database = typeof db;

// Re-export drizzle-orm operators so consumers avoid duplicate-instance type conflicts
export { eq, and, or, not, gt, gte, lt, lte, ne, desc, asc, sql, sum, avg, count, ilike, like, isNull, isNotNull, inArray, between } from 'drizzle-orm';
