import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { fetchGuildRoles } from "./discordGuild";

const ROLES_STALE_MS = 5 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds.members.read" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Auth.js deliberately randomizes `user.id`/`token.sub` when no
        // database adapter is configured (keeps the session identity
        // provider-independent) — the real Discord snowflake only lives on
        // `account.providerAccountId` during this initial sign-in call.
        // Never read `token.sub` for the Discord ID; it's a random UUID.
        if (account.providerAccountId) {
          token.discordId = account.providerAccountId;
        }
        if (account.access_token) {
          token.discordAccessToken = account.access_token;
        }
      }
      const fetchedAt = typeof token.rolesFetchedAt === "number" ? token.rolesFetchedAt : 0;
      const stale = Date.now() - fetchedAt > ROLES_STALE_MS;
      if (token.discordAccessToken && (account || stale)) {
        const roles = await fetchGuildRoles(token.discordAccessToken as string);
        // Fail closed: a failed fetch leaves previously-known roles alone
        // rather than clearing them, but a first-ever failed fetch means
        // guildRoles stays undefined -> treated as "no roles" everywhere.
        if (roles !== null) {
          token.guildRoles = roles;
          token.rolesFetchedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = (token.discordId as string | undefined) ?? "";
      }
      session.guildRoles = (token.guildRoles as string[] | undefined) ?? [];
      return session;
    },
  },
});
