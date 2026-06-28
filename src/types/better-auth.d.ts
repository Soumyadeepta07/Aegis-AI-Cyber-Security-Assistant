import "better-auth";

declare module "better-auth" {
  interface User {
    role: "user" | "admin";
    isBlocked: boolean;
  }
  interface Session {
    user: User;
  }
}
