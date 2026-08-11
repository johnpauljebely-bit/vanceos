import { cookies } from "next/headers";

const COOKIE_NAME = "dc-cad-unit";

export interface UnitSession {
  department: string;
  number: number;
  rpName: string;
  agency?: string;
  subdivision?: string;
  items?: string;
}

export async function getUnitSession(): Promise<UnitSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UnitSession;
  } catch {
    return null;
  }
}

export async function setUnitSession(session: UnitSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h shift
  });
}

export async function clearUnitSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
