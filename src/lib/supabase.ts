import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public project credentials. The anon/publishable key is designed to ship in
 * browser code — access is protected by Postgres Row Level Security, not by the
 * key. Override via NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to
 * point at your own Supabase project.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nmujreqgiifuslafkpti.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdWpyZXFnaWlmdXNsYWZrcHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTg2NjksImV4cCI6MjA4ODg3NDY2OX0.Rnwza_QqjkQplduo8DsKp42r0HZe2x4Dfc147_KLYFA";

let client: SupabaseClient | null = null;
let failed = false;

export function getSupabase(): SupabaseClient | null {
  if (failed || typeof window === "undefined") return null;
  if (client) return client;
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    return client;
  } catch {
    failed = true;
    return null;
  }
}

export function isCloudAvailable(): boolean {
  return getSupabase() !== null;
}
