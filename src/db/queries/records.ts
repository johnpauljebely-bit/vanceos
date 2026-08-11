import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { records } from "@/db/schema";

export async function listRecordsByCreator(createdBy: string) {
  return db.select().from(records).where(eq(records.createdBy, createdBy)).orderBy(desc(records.createdAt));
}

export async function listDraftsForCreator(createdBy: string) {
  return db
    .select()
    .from(records)
    .where(and(eq(records.createdBy, createdBy), eq(records.status, "draft")))
    .orderBy(desc(records.createdAt));
}

export async function listAllRecords() {
  return db.select().from(records).orderBy(desc(records.createdAt)).limit(100);
}

export async function getRecord(id: number) {
  const rows = await db.select().from(records).where(eq(records.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface RecordInput {
  recordType: string;
  title: string;
  content: string;
  subjectName?: string;
  details?: Record<string, string>;
  status: "draft" | "final";
  createdBy: string;
  department?: string;
}

export async function createRecord(input: RecordInput) {
  const [record] = await db.insert(records).values(input).returning();
  return record;
}

/** Used to promote a draft to final (or re-save its edited details), never creates a second row. */
export async function updateRecord(
  id: number,
  input: Partial<Pick<RecordInput, "title" | "content" | "subjectName" | "details" | "status">>,
) {
  const [record] = await db
    .update(records)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(records.id, id))
    .returning();
  return record;
}
