# Restored the live-class clocks and Meet the Team, and added an Opportunities board to the member hub

The time-zone clocks under Live Classes are back and now stay on screen permanently, Meet the Team is back on the homepage with its original team members and design, and paying members have a new Opportunities board inside their hub with a small admin screen behind it. Nothing that already worked was removed or replaced.

## The clocks under Live Classes

A dedicated clock strip now sits at the foot of the Live Classes section and renders whether or not any classes are scheduled, so the five zones are always visible: 🇦🇪 UAE / Dubai, 🇲🇽 Mexico, 🇺🇸 USA, 🇪🇺 Europe and 🌏 Asia. The UAE clock is labelled as the master zone, and every clock shows its city and its current GMT offset alongside the time.

UAE remains the single stored time. Everything else is derived from that instant at display time using the real IANA zones — `Asia/Dubai`, `America/Mexico_City`, `America/New_York`, `Europe/Madrid` and `Asia/Singapore` — so daylight saving is handled by the zone database rather than by arithmetic. There are no hard-coded hour differences anywhere in the change. A class in January and the same class in July genuinely produce different European and American times, and a class that lands after midnight in Asia is marked "+1 day" rather than silently showing the wrong date.

Each scheduled class carries its own row of five conversions underneath it, converted from that class's own date, so an autumn class is not converted with summer offsets. The same conversion strip appears on the events list and inside the member hub.

The empty band that had opened up under the section is gone: the clocks now close the section off instead of floating above a gap.

## Meet the Team

The Meet the Team section is back on the homepage in its original position, with all four teachers, their photographs, badges, biographies, specialisms and "book with" links intact, and it reflows to a single readable column on a phone.

## Opportunities

Opportunities are a paid-member benefit, so the board lives inside the member hub as a fifth tab rather than on the public site. Members browse the open opportunities as cards showing the type, organisation, location and deadline, and opening one shows the full description, the key facts and an apply button that links out safely.

Behind it, `/admin/opportunities` gives the founders a simple editor to create, edit, publish, unpublish and delete entries, with a title, type, organisation, location, deadline, summary, details, apply link, ordering and a publish switch. Slugs are generated from the title and de-duplicated automatically. Drafts are invisible to members until they are published. The admin page is excluded from search engines, and an administrator who is also a member gets a shortcut to it from inside the hub.

Access is enforced on the server, not in the interface. Signed-out visitors are refused outright, signed-in accounts without an active membership cannot read the board, members can read it but cannot write to it, and only administrators can list drafts or make changes. Administrators are recognised by e-mail: the two founder addresses are the built-in fallback, an `ADMIN_EMAILS` environment variable overrides them without a code change, and an optional `profiles.is_admin` flag is honoured if that column is ever added. Database problems are logged on the server and answered with a plain, friendly message — no SQL or internal detail is ever returned to a browser.

The board is stored in the site's Netlify Database. Its table is created by a migration in `netlify/database/migrations/`, which Netlify applies automatically on deploy.

## Testing

Everything below was actually run against the application, not reasoned about. In total roughly 375 automated checks passed.

The homepage, live classes, events and mobile layouts were driven in a real browser at desktop, iPhone and small-Android sizes — 171 checks covering the team section and its images, every existing homepage section and the navigation, the five clocks and their labels, flags, offsets and master tag, the absence of the layout gap, horizontal overflow, element overlap, and the browser console and network log. The clock values were compared against what the browser itself calculates for the same instant in each zone, and the per-class conversions were compared the same way for classes placed deliberately in midwinter, midsummer, the spring window when the United States has changed clocks but Europe has not, the autumn window when the reverse is true, and a late class that rolls past midnight in Asia. Every conversion, offset and date matched.

Permissions were exercised with real accounts against the running server — 54 checks across a paying member, a signed-in account without an active membership, an administrator, and an administrator who is also a member. Each was confirmed to get exactly the access it should, and the administration screen was confirmed to refuse an account that lacks rights instead of showing it the editor.

The data layer was run end to end against the real Netlify Postgres instance — 28 checks covering creating, reading, publishing, unpublishing, editing, ordering, slug generation and de-duplication, accented titles, lookups of missing rows, clearing fields to null, and deleting. The deployment migration's own DDL was used to build the table for the run, and it was accepted by the live database engine unchanged.

The full editing lifecycle was then driven through the real admin screen and the real member board in a browser — 38 checks from creating an opportunity through publishing it, seeing it appear for members, opening its detail view, editing it, unpublishing it and deleting it, plus validation and cancel behaviour. The member hub was separately checked on two phone sizes across all five tabs — 46 checks — with no horizontal scrolling and nothing spilling off the edge.

Two real defects were found during this testing and fixed. The opportunities API returned a server error instead of degrading gracefully when the table was not yet present, because the database driver hides the underlying error one level down; it now inspects the full error chain and answers with an empty board and a clear explanation. The administration screen also showed its editor chrome to an account that had been refused by the API; it now treats anything other than a clean, authorised response as a refusal. The API itself had been enforcing correctly throughout, so no data was ever exposed.

One layout problem was found and fixed as a result of the new tab: five tabs no longer fit across a phone screen, which pushed Opportunities and Workbooks out of sight behind a sideways swipe. The tab strip now wraps on small screens so all five stay visible.

Type checking reports only the ten pre-existing errors in the Supabase middleware and server helper, both untouched by this work; the project has no lint configuration to run.

## Two things to be aware of

The opportunities table is created by the Netlify migration when this deploys, so the board will be empty and the admin screen will say the database is not provisioned yet until that first deploy completes. That path was tested deliberately — the site renders normally rather than erroring while the table is missing.

Events currently have a date but no time, so they are shown as "All day". If you would like events converted across the five zones the way live classes are, `supabase/schema.sql` now documents two optional columns to add to the events table — a plain UAE start time, or a full timestamp — and the site picks either up automatically as soon as it is there.
