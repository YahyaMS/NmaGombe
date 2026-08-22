/**
 * Validated environment. Import this instead of touching process.env anywhere else.
 *
 * Why: a missing or misspelled env var is currently a runtime crash on some page, some
 * day, in front of a member. Here it is a build failure with the variable named.
 *
 * Rule: no file in this project reads process.env directly except this one.
 */
import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_USE_EMULATORS: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_APPCHECK_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_WHATSAPP_SECRETARIAT: z.string().optional(),
});

const serverSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
});

/**
 * Next.js inlines NEXT_PUBLIC_* at build time only when referenced as a full literal
 * property access. Destructuring process.env or indexing it dynamically silently yields
 * undefined in the browser bundle — a classic and very confusing failure.
 */
const rawClient = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_USE_EMULATORS: process.env.NEXT_PUBLIC_USE_EMULATORS,
  NEXT_PUBLIC_APPCHECK_SITE_KEY: process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY,
  NEXT_PUBLIC_WHATSAPP_SECRETARIAT: process.env.NEXT_PUBLIC_WHATSAPP_SECRETARIAT,
};

const parsedClient = clientSchema.safeParse(rawClient);
if (!parsedClient.success) {
  throw new Error(
    "Invalid client environment:\n" +
      parsedClient.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
  );
}

export const env = parsedClient.data;

/** Server-only values. Throws if called from the browser. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser. This is a boundary violation.");
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Invalid server environment:\n" +
        parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
    );
  }
  return parsed.data;
}
