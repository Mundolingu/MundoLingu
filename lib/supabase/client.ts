import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

// One shared client for the whole browser session.
// Creating a new client per call spins up a new auth instance each time; those
// instances fight over the same storage lock, which makes signing in slow and
// occasionally leaves the app on the login screen after a successful login.
let browserClient: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
