import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { fetchGuildRoles } from "./discordGuild";

const ROLES_STALE_MS = 5 * 60_000;

/** Outer bound for the session cookie itself — matches "remember me" checked (7 days). */
export const REMEMBER_ME_SECONDS = 7 * 24 * 60 * 60;
/** Unchecked default — shorter than the cookie's own maxAge, so the JWT's own `exp` (set below) expires it sooner even though the cookie could otherwise persist. */
const DEFAULT_SESSION_SECONDS = 24 * 60 * 60;
export const REMEMBER_ME_COOKIE = "dc-remember-me";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds.members.read" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: REMEMBER_ME_SECONDS },
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

        // "Keep me signed in" — the sign-in form sets this short-lived
        // marker cookie right before calling signIn(); read it here (only
        // runs on the initial sign-in, since `account` is only present
        // then) to decide how long THIS token actually stays valid.
        let remember = false;
        try {
          const store = await cookies();
          remember = store.get(REMEMBER_ME_COOKIE)?.value === "1";
        } catch {
          // No request-scoped cookie access available — default to the
          // shorter session rather than silently granting 7 days.
        }
        token.exp = Math.floor(Date.now() / 1000) + (remember ? REMEMBER_ME_SECONDS : DEFAULT_SESSION_SECONDS);
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
