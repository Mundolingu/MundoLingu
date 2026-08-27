import { createClient } from "@/lib/supabase/server";

// Server-only. Never import this from a client component.

// Who may manage opportunities. Set ADMIN_EMAILS to a comma-separated list to
// grant access to more people; it falls back to the site owner's address.
export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "mundolingu@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminCheck =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string };

// 401 means "not signed in", 403 means "signed in but not an admin". The admin
// screen relies on that distinction to show the right message.
export async function requireAdmin(): Promise<AdminCheck> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, status: 401, error: "Authentication is not configured." };
  }

  let email: string | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  } catch {
    return { ok: false, status: 401, error: "Could not verify your session." };
  }

  if (!email) return { ok: false, status: 401, error: "You need to be logged in." };
  if (!adminEmails().includes(email.toLowerCase())) {
    return { ok: false, status: 403, error: "This account cannot manage opportunities." };
  }
  return { ok: true, email };
}
