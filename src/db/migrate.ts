import "./loadEnv";
import path from "node:path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

async function run() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    const db = drizzleNodePg(pool);
    await migrateNodePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await pool.end();
  } else {
    const dataDir = process.env.PGLITE_DATA_DIR ?? "./.pglite";
    const client = new PGlite(dataDir);
    const db = drizzlePglite(client);
    await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await client.close();
  }
  console.log("[migrate] done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
