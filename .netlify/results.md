# Mundo Lingu — international timezones, paid-access hardening, Terms & Conditions

The existing Mundo Lingu site was adapted in place. Nothing was rebuilt, redesigned or
replaced: the homepage, navigation, login, Stripe checkout, membership gate, the members
hub with its four tabs (Lessons, Live classes, Events, Workbooks), the YouTube video
modal, the workbook hand-in flow, the blog and the level test all kept their existing
code, markup, styling and behaviour. The work fell into three parts.

## One class = one real-world moment, shown in every customer's own timezone

`live_classes.starts_at` was already a Postgres `timestamptz`, so each class was already
stored as a single absolute instant. The data model therefore did not change — what
changed was how that instant is turned into text.

A new `lib/time.ts` performs every conversion through `Intl.DateTimeFormat` with an IANA
`timeZone`. No hours are ever added or subtracted and no fixed GMT offset is used
anywhere, so daylight saving is resolved by the timezone database rather than by the
application. Converting the other direction — a Dubai wall-clock time such as
`2026-09-15 18:00` into an instant — uses a two-pass offset resolution that lands on the
correct instant even when the date sits on a DST boundary. `lib/timezones.ts` holds a
catalogue of 59 zones mapping IANA ids to friendly, flagged names; the IANA id is what
the code and the database use, and the friendly name is only ever a label.

The members hub now shows, for each class and each timed event, the long date, the
customer's own local time with their zone named, and the Dubai reference time on a
second line, clearly labelled. Status (Upcoming / Starting soon / Live now / Ended) and
the optional countdown are computed purely from the absolute instant, so a class reads
as live at the same real-world moment for a viewer in Sydney and a viewer in Los Angeles.
The existing status handling and the existing Join Class button were kept; the join label
simply becomes "Join now" while a class is live.

Events were adapted to exactly the same logic rather than given a parallel one. An event
uses `starts_at` when present, otherwise `event_date` plus `start_time` read as Dubai
wall-clock, otherwise it remains an all-day event with a date badge that is deliberately
not shifted by zone.

## Choosing and remembering a timezone

A timezone selector was added to the existing hub — not a new page. It renders as a chip
in the "Welcome back." row, reusing the hub's own colours, fonts, radii and spacing, and
it is a native `<select>` overlaid transparently on the chip so that long zone names,
grouped by region, behave correctly on iPhone and Android. Its font size is 16px so iOS
does not zoom the page on focus, and below 560px the row stacks while the chip goes full
width.

The chosen zone resolves in three steps: the value saved on the customer's existing
Supabase profile, then a local browser copy, then automatic detection from the browser.
Selecting a zone writes it back to `profiles.timezone` — a column on the profile row that
already existed. No second user, customer or account system was introduced. The profile's
timezone is read separately from the membership check so that a missing column can never
break the paid-access gate.

## Security findings that were fixed

Two real problems were found in the existing Supabase policies and fixed.

Members-only content on `lessons`, `live_classes`, `events` and `workbooks` was readable
by any logged-in account through `for select to authenticated using (true)`. The hub hid
it in the interface, but a signed-in account that had never paid could read the rows —
including the private class join links — directly from the API. A `security definer`
function, `public.is_paid_member()`, now backs the select policy on all four tables, so
the check lives in the database rather than in the frontend.

The profiles update policy restricted which row a member could change but not which
columns, so a signed-in account could set its own `is_member` flag and grant itself paid
access. Column-level grants now limit an authenticated update to `timezone` alone.
Membership is written only by the Stripe webhook through the service-role client, which
these grants do not affect. A missing storage policy letting members read back their own
handed-in files was also added.

The service-role key was confirmed to be used only in server-side code, no secret is
reachable from client-side JavaScript, and the Stripe webhook verifies its signature.
All schema changes are additive and the file remains safe to re-run.

## Terms & Conditions

A `/terms` page was added in the existing article layout, linked from the site footer,
the login and signup card, the membership/checkout screen and the members hub. Signup now
carries an "I agree to the Terms & Conditions" checkbox that blocks submission until it is
ticked, without otherwise changing the flow.

No legal wording was written. `lib/terms.ts` is an empty, commented structure waiting for
the real text; until it is filled the page shows a short notice and the contact address.
Nothing here asserts that the resulting terms are legally sufficient — that is for a
qualified professional to judge.

## Verification

An assertion suite checked the 15 September 2026 18:00 Dubai example across Dubai, Mexico
City, London, Paris, New York, Los Angeles, Toronto, Tokyo, Singapore and Sydney, plus 17
cases straddling the European, North American and Australian DST transitions; all passed.
Status and countdown were confirmed identical across zones, and the real components and
the real selector were rendered through Next for every target zone. A type check reported
no errors in any new or modified file. The build itself was left to the platform.

## What still needs doing

The appended sections of `supabase/schema.sql` must be run once in the Supabase SQL
Editor: until then the new columns and, more importantly, the two security fixes are not
live. The application is backward compatible in the meantime — timezone falls back to
browser detection and duration to 60 minutes. Existing `starts_at` rows are worth reading
back once with `select title, starts_at at time zone 'Asia/Dubai' from public.live_classes`
in case any were originally typed as Dubai wall-clock but stored as UTC. And `lib/terms.ts`
still needs the owner's own legal wording.
