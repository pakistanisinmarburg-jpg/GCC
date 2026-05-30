import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tcyhmxieoccfsncblljf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeWhteGllb2NjZnNuY2JsbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjQ2OTgsImV4cCI6MjA5NTcwMDY5OH0.La1ZPKfrB2QYPOWr5iR6w0N2rPi0MwXSw2zi3QdyNwU";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL;
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
