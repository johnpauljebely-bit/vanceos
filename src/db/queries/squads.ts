import { db } from "@/db";
import { squads } from "@/db/schema";

export async function listSquads() {
  return db.select().from(squads);
}
