import { deriveBirthday } from "./birthday";

interface RobloxUser {
  id: number;
  name: string;
  created: string; // ISO timestamp
}

export async function fetchRobloxUser(robloxUserId: string): Promise<RobloxUser | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as RobloxUser;
  } catch {
    return null;
  }
}

export async function deriveCivilianBirthday(robloxUserId: string) {
  const user = await fetchRobloxUser(robloxUserId);
  if (!user) return null;
  return deriveBirthday(user.created);
}
