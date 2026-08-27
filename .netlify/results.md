# Fixed the failed database migration deploy and finished the Opportunities feature

## Why the deploy was failing

The `Database migration failed: branch for deploy not found` message is produced by Netlify's own Netlify Database deploy step, not by anything in this repository — the string does not appear in the codebase or in the CLI. It means the migration step ran against a deploy that had no database branch to run against.

Netlify Database was switched on for this project during an earlier session so that an "Opportunities" feature could store its data, but that feature was never actually built. The database was left completely empty: no tables, no migration files, no `@netlify/database` dependency, and not a single line of code that referenced it. Every deploy therefore reached a migration step that had a database attached but nothing legitimate to do, and failed.

Separately, and just as damaging, the repository had 1,483 files of `.netlify/` build and CLI state committed to it — about 44 MB. That included a dead local Postgres data directory (complete with a `postmaster.pid` pointing at a nonsense process ID) and stale Deno edge-function caches. Every deploy was restoring that snapshot on top of the state Netlify generates for itself.

You chose to keep the database and have Opportunities use it, so both problems were fixed in that direction: the stale state was removed, and the feature was completed so the migration step has real, valid work to apply.

## What changed

**Stopped committing Netlify's build state.** `.netlify` is now ignored, and the 1,479 tracked files under it (plus a stray `.DS_Store`) were removed from the working tree. Netlify regenerates this directory on every build, so nothing of value was lost, and deploys no longer have a months-old local database directory dropped over their own state.

**Added the database layer.** `db/schema.ts` defines a single `opportunities` table — slug, title, kind, organisation, location, summary, body, apply URL, deadline, published flag, sort order and timestamps — and is the source of truth for the schema. `db/index.ts` opens the connection through the Netlify Drizzle adapter, which picks up its credentials from the platform at runtime, so no connection string is stored anywhere. `drizzle.config.ts` writes generated migrations to `netlify/database/migrations`, which is the directory Netlify applies automatically at deploy time.

**Generated the first migration.** `netlify/database/migrations/20260827073431_create_opportunities/` contains the `CREATE TABLE` statement and its snapshot. This is the piece that gives the deploy's migration step something valid to apply. In line with how Netlify Database works, the migration was only ever generated here — it was not applied by hand. The platform runs it on the next deploy.

**Built the member-facing Opportunities tab.** `components/Opportunities.tsx` renders a grid of published opportunities with a detail view, using the `op-*` CSS classes that already existed in the stylesheet, so it matches the rest of the hub without any new styling. As you asked, it lives inside the paid members hub and not on the homepage: `components/MembersArea.tsx` gained an "Opportunities" tab between Events and Workbooks. All four existing tabs are untouched.

**Wired up the admin screen.** There was already an `OpportunitiesAdmin` component in the repository with no page rendering it. `app/admin/opportunities/page.tsx` now does, and admins reach it through a manage link shown inside the Opportunities tab.

**Added the API.** `app/api/opportunities/route.ts` handles listing and creation; `app/api/opportunities/[id]/route.ts` handles updates and deletion. A few details worth calling out:

- The public list returns only published rows; the admin view asks for everything explicitly.
- Slugs are generated from the title, with accents stripped, and a collision retry appends `-2`, `-3` and so on when a title repeats.
- A slug never changes after creation, so links shared with members keep working even when a title is edited.
- Updates only touch the fields actually present in the request, so toggling "published" cannot blank out an opportunity's body.
- If the database is not reachable yet — which is exactly the state a first deploy is in before migrations run — the list endpoint returns an empty result flagged as unavailable rather than an error. The admin screen turns any error response into a misleading "this account does not have permission" message, so this keeps it honest.

**Admin access.** Supabase `profiles` has no `is_admin` column, so `lib/admin-auth.ts` gates the write endpoints on an email allowlist and distinguishes "not signed in" (401) from "not an admin" (403). It defaults to your own address. To grant access to other people, set `ADMIN_EMAILS` in the Netlify UI to a comma-separated list of addresses; no code change or redeploy of the allowlist logic is needed beyond that.

## Testing

The schema and query logic were exercised against a real Postgres instance — the local Netlify database emulator, never the production database — and 18 checks passed: UUID generation, accent-stripped slugs, snake_case serialisation of `apply_url`, `YYYY-MM-DD` deadline round-trips, column defaults, the unique-violation path on a duplicate slug, partial updates preserving untouched fields, slug stability across edits, sort ordering, the published-only filter, and both the found and not-found delete paths.

Over HTTP, the endpoints correctly rejected unauthenticated writes, and the list endpoint returned its graceful empty result when the database was deliberately made unreachable. Page renders were checked too: the homepage and the admin screen returned 200, `/members` correctly redirected an anonymous visitor, and `/login` returned 200. TypeScript reports no errors in any of the new files. (Ten pre-existing implicit-`any` errors remain in `lib/supabase/server.ts` and `middleware.ts`; those files were not touched and the errors are already suppressed by the project's build config, so they were left alone.)

The production database was left exactly as it was found: no tables, no applied migrations, and one migration now pending for the deploy to run.

## One thing to check after deploying

The Opportunities tab will be empty until you add entries through the admin screen at `/admin/opportunities`. That is expected — the migration creates the table, not its contents.
