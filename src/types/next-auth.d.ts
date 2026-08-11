import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      discordId: string;
    } & DefaultSession["user"];
    guildRoles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    discordAccessToken?: string;
    guildRoles?: string[];
    rolesFetchedAt?: number;
  }
}
