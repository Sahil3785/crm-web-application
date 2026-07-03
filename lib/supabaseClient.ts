import { createClient } from "@supabase/supabase-js";

// Supabase credentials (hardcoded for reliability)
const supabaseUrl = "https://vqouykioezmeuyipzipq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb3V5a2lvZXptZXV5aXB6aXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzk4NzYsImV4cCI6MjA5ODE1NTg3Nn0.0Nm5DulWduHbX4o2icqWBC5CnbIYiELFI26TdIU1Ph4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

