import { eq } from "drizzle-orm";
import { db } from "@/db";
import { warrants, bolos } from "@/db/schema";

export async function listActiveWarrants() {
  return db.select().from(warrants).where(eq(warrants.status, "active"));
}

export async function createWarrant(input: { subjectName: string; charges: string; signature?: string; issuedBy: string }) {
  const [warrant] = await db.insert(warrants).values(input).returning();
  return warrant;
}

/** Only active (open) warrants can be closed — matches the brief exactly. */
export async function closeWarrant(id: number) {
  const [warrant] = await db.select().from(warrants).where(eq(warrants.id, id)).limit(1);
  if (!warrant || warrant.status !== "active") {
    return { ok: false as const, reason: "not_active" as const };
  }
  await db.update(warrants).set({ status: "closed", closedAt: new Date() }).where(eq(warrants.id, id));
  return { ok: true as const };
}

export async function listActiveBolos() {
  return db.select().from(bolos).where(eq(bolos.status, "active"));
}

export async function createBolo(input: {
  subjectName?: string;
  description: string;
  type?: string;
  issuedBy: string;
}) {
  const [bolo] = await db.insert(bolos).values(input).returning();
  return bolo;
}

export async function closeBolo(id: number) {
  await db.update(bolos).set({ status: "closed", closedAt: new Date() }).where(eq(bolos.id, id));
}
