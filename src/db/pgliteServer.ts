import "./loadEnv";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/**
 * PGlite is NOT safe for concurrent access from multiple processes/workers
 * pointed at the same data directory — Next.js's Turbopack dev server runs
 * route handlers across several worker processes, and each one instantiating
 * its own `new PGlite(dataDir)` against the same files caused real,
 * intermittent "relation does not exist" errors (confirmed in practice, not
 * theoretical). This script is the ONE process allowed to open the data
 * directory directly; everything else (the Next.js app, regardless of how
 * many workers) connects to it as an ordinary Postgres client over TCP via
 * `DATABASE_URL`, exactly like it would talk to a real Postgres server.
 */
async function main() {
  const dataDir = process.env.PGLITE_DATA_DIR ?? "./.pglite";
  const port = Number(process.env.PGLITE_SOCKET_PORT ?? 5433);

  const db = new PGlite(dataDir);
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 10 });
  await server.start();
  console.log(`[pglite-server] listening on postgres://127.0.0.1:${port} (data: ${dataDir})`);

  process.on("SIGINT", async () => {
    await server.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[pglite-server] failed to start:", err);
  process.exit(1);
});
