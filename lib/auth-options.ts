import prisma from "@/prisma/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginSchema } from "./validators/auth-schema";

const isProduction = process.env.NODE_ENV === "production";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        emailOrUsername: {
          label: "Email or Username",
          type: "text",
          placeholder: "Enter Email or Username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials?.emailOrUsername || !credentials.password) {
          throw new Error(
            "Invalid credentials: Email/username and password are required.",
          );
        }

        const validation = loginSchema.safeParse({
          emailOrUsername: credentials.emailOrUsername,
          password: credentials.password,
        });

        if (!validation.success) {
          throw new Error(
            `Invalid credentials: ${validation.error.issues.at(0)?.message}`,
          );
        }

        const lookup = credentials.emailOrUsername.trim().toLowerCase();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              {
                name: lookup,
              },
              {
                email: lookup,
              },
            ],
          },
          select: {
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
            encryptionSalt: true, // CRITICAL: Explicitly fetch salt
          },
        });

        if (!user || !user.hashedPassword)
          throw new Error("Invalid credentials: User not found.");

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        );

        if (!passwordMatches)
          throw new Error("Invalid credentials: Incorrect password.");

        // CRITICAL: Validate encryptionSalt exists (should never be null for new users)
        if (!user.encryptionSalt) {
          console.error(`[AUTH] User ${user.id} missing encryptionSalt - database corruption?`);
          throw new Error("Account setup incomplete. Please contact support.");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      // First time jwt callback is run, user object is available
      if (user) {
        (token as any).userId = (user as any).id;
        (token as any).encryptionSalt = (user as any).encryptionSalt ?? null;
        if (process.env.NODE_ENV === "development") {
          console.log("[JWT CALLBACK] Attaching salt to token:", (user as any).encryptionSalt ?? null);
        }
      }
      return token;
    },
    async session({ session, token }) {
      const saltFromToken = (token as any).encryptionSalt;

      if (saltFromToken == null || saltFromToken === "") {
        throw new Error("Missing encryption salt in token; session creation aborted.");
      }

      if (session.user) {
        // Attach user ID and encryption salt to session.user
        (session.user as any).id = (token as any).userId;
        (session.user as any).encryptionSalt = saltFromToken;
      }
      (session as any).encryptionSalt = saltFromToken;
      if (process.env.NODE_ENV === "development") {
        console.log("[SESSION CALLBACK] Attaching salt to session:", saltFromToken);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // enforce dashboard after sign-in when coming from our app
      if (url.startsWith(baseUrl)) return `${baseUrl}/dashboard`;
      if (url.startsWith("/")) return `${baseUrl}/dashboard`;
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60,
    updateAge: 0,
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
