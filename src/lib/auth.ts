import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma, getDbMode } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

const { provider } = getDbMode();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: provider as "mysql" | "sqlite",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: async (password: string) => bcrypt.hashSync(password, 10),
      verify: async ({ password, hash }) => bcrypt.compareSync(password, hash),
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "user",
      },
      isBlocked: {
        type: "boolean",
        input: false,
        defaultValue: false,
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_APP_URL!,
  ].filter(Boolean),
});