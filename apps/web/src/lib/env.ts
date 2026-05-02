// Centralized env access for the web client.
// Only NEXT_PUBLIC_* values are exposed to the browser.

function readPublicEnv(name: string): string {
  // Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so dynamic access
  // would lose the value. Use direct property access via a switch.
  switch (name) {
    case "NEXT_PUBLIC_API_URL":
      return process.env.NEXT_PUBLIC_API_URL ?? "";
    case "NEXT_PUBLIC_GOOGLE_CLIENT_ID":
      return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    default:
      return "";
  }
}

function required(name: string): string {
  const value = readPublicEnv(name);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See apps/web/.env.local.example.`
    );
  }
  return value;
}

export const env = {
  apiUrl: () => required("NEXT_PUBLIC_API_URL"),
  googleClientId: () => required("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
  // Soft accessors for places where empty string is acceptable (e.g. SSR before hydration).
  apiUrlOptional: () => readPublicEnv("NEXT_PUBLIC_API_URL"),
  googleClientIdOptional: () => readPublicEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
} as const;
