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
      hash: async (password: string) => {
        return bcrypt.hashSync(password, 10);
      },
      verify: async ({ password, hash }: { password: string; hash: string }) => {
        return bcrypt.compareSync(password, hash);
      }
    }
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
      }
    }
  },
  secret: process.env.BETTER_AUTH_SECRET || "ai_cyber_security_assistant_super_secret_key_32_chars",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
