import { z } from "zod";

// Public values are safe for the browser; everything else is server-only.
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LINEAR_API_KEY: z.string().min(1),
  LINEAR_WEBHOOK_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16),
  PACE_WORKSPACE_SLUG: z.string().min(1).default("sysvit"),
});

export function publicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Call only in server code (route handlers, server actions, scripts). */
export function serverEnv() {
  return serverSchema.parse(process.env);
}
