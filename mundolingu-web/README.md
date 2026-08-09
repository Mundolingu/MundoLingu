# MundoLingu

The official MundoLingu marketing site — English & Spanish lessons, made personal.
Built with Next.js (App Router), React, and TypeScript.

## Run it locally

You need Node.js 18.18+ installed. Then:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build for production

```bash
npm run build
npm run start
```

## Deploy to Netlify (recommended)

1. Push this folder to a new GitHub repository.
2. Go to vercel.com, click **Add New → Project**, and import the repo.
3. Netlify auto-detects Next.js and deploys it — you get a live preview URL.
4. In the project: **Settings → Domains** → add `mundolingu.com`.
   Netlify shows you the exact DNS records to use.
5. Log in to **Strato → your domain → DNS settings** and point it at Netlify:
   - Root domain (@): an **A record** to the IP Netlify shows (usually `75.2.60.5`).
     In Strato this is the "Eigene IP-Adresse" (own IP address) option.
   - `www`: a **CNAME** to the value Netlify gives you.
   - Delete any old A / AAAA record Strato had for the domain first.
6. Wait for DNS to propagate. Netlify issues HTTPS automatically.

Every push to your main branch redeploys automatically.

## Where to edit things

- **Copy, teachers, pricing, FAQ** → the data arrays near the top of
  `components/Site.tsx` (TEACHERS, WHY, STEPS, STORIES, BENEFITS, FAQ, HERO...).
  Change the placeholder teacher profiles to your real team here.
- **Colours, spacing, type** → the CSS variables at the top of `app/globals.css`.
- **Logo** → replace the files in `public/` (logo-emblem.png, logo-wordmark.png,
  logo-wordmark-white.png) and `app/icon.png` (the browser tab favicon).
- **Fonts** are loaded via `next/font` in `app/layout.tsx`.

## Notes

- `next.config.mjs` currently skips lint/type errors during build so your first
  deploy is frictionless. Once you have CI set up, set both to `false`.
- The "Book a free demo" buttons scroll to the demo section — wire your Calendly
  embed in there when ready.
- To host on Strato instead of Netlify, uncomment `output: "export"` in
  `next.config.mjs`, run `npm run build`, and upload the generated `out/` folder
  via Strato's file manager or FTP.


---

## Members area (custom build)

Two new pages are now in the project:

- **`/login`** — the member sign-in screen (`components/LoginForm.tsx`)
- **`/members`** — the member dashboard with tabs for **Lessons, Live classes,
  Events, and Workbooks** (`components/MembersArea.tsx`)

The nav now has a **Log in** link that opens `/login`.

**Important:** right now this is the *front-end only*, filled with sample
content, and it is NOT secured — anyone can open `/members`. Before you put real
lessons or paying members behind it, you must connect the three pieces below.

### To make it real

1. **Login (authentication).** Add a real login system so only signed-in members
   can open `/members`. Easiest option: **Clerk**. Also good: **Supabase Auth**
   or **Auth.js (NextAuth)**. Then protect the `/members` route.
2. **Payments.** Connect **Stripe** to sell the membership ($10 first month, then
   $15/month). When someone subscribes, mark them an active member; when they
   cancel, remove access (a Stripe webhook handles this automatically).
3. **Your content.**
   - **Videos** → paste YouTube (unlisted) or Vimeo links, or host with Mux /
     Cloudflare Stream, and embed them in the lesson cards.
   - **Events & live classes** → store them in a database (e.g. **Supabase**) or a
     simple CMS (e.g. **Sanity**) you can edit yourself.
   - **Workbooks** → upload each month's PDF to storage (**Supabase Storage** or a
     CMS). Once set up, this is how you "add a new book every month" — no code.
   - Then replace the sample arrays at the top of `components/MembersArea.tsx`
     (LESSONS, LIVE, EVENTS, WORKBOOKS) with your real data.

### Simplest recommended stack

**Supabase** (login + database + file storage, has a free tier) + **Stripe**
(payments) + **YouTube/Vimeo embeds** for video. That keeps it to two accounts and
lets you upload workbooks yourself from the Supabase dashboard.

This auth + payments wiring is the part where an hour or two of a developer's help
goes a long way — the front-end above is already done.


---

## Full setup — make the whole website work

The marketing site works with no setup. The **members area** needs two free
accounts wired in: **Supabase** (accounts + database) and **Stripe** (payments).
Do these in order. Take your time — this is the involved part.

### Step 1 — Supabase (login + database)
1. Create a free account at supabase.com and make a new project. Save the database
   password it asks you to set.
2. Open **SQL Editor**, paste everything from `supabase/schema.sql`, and click Run.
   (This creates the `profiles` table that tracks who is a paying member.)
3. Open **Project Settings -> API** and copy three values:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)
4. Open **Authentication -> Providers -> Email** and make sure Email is enabled.
   Tip: turning "Confirm email" OFF lets people log in the instant they sign up
   (simplest to start). Leaving it ON means they must click a link in their email.

### Step 2 — Stripe (the membership payment)
1. Create an account at stripe.com. Stay in **Test mode** while setting up.
2. **Products -> Add product**: name it "MundoLingu Membership", add a **recurring**
   price of **$15 / month**. Save, then copy the **Price ID** (starts `price_`) ->
   `STRIPE_PRICE_ID`.
3. (Optional, for your "$10 first month" offer) **Product catalog -> Coupons ->
   New**: $5 off, Duration = Once. Copy its ID -> `STRIPE_FIRST_MONTH_COUPON`.
4. **Developers -> API keys**: copy the **Secret key** (`sk_test_...`) ->
   `STRIPE_SECRET_KEY`.
5. The **webhook** (which tells your site when someone pays) is set up after you
   deploy — see Step 4.

### Step 3 — Add your keys and run it locally
1. In the project folder, copy `.env.local.example` to a new file `.env.local`.
2. Paste in all the values from Steps 1 and 2. Keep `NEXT_PUBLIC_SITE_URL` as
   `http://localhost:3000` for now.
3. Run `npm install` then `npm run dev`, and open http://localhost:3000.
   Click **Log in -> Create an account**, and you should be able to sign up.

### Step 4 — Deploy and connect the webhook
1. Deploy to Netlify (push to GitHub, import the repo — see the deploy section above).
2. In Netlify: **Settings -> Environment Variables** and add every line from your
   `.env.local`, but set `NEXT_PUBLIC_SITE_URL` to `https://mundolingu.com` (or your
   Netlify URL for now). Redeploy.
3. In Stripe: **Developers -> Webhooks -> Add endpoint**. URL:
   `https://YOUR-DOMAIN/api/stripe/webhook`. Select these events:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the webhook's **Signing secret** (`whsec_...`) into Netlify as
   `STRIPE_WEBHOOK_SECRET`, and redeploy.
5. Point mundolingu.com at Netlify (the DNS steps in the deploy section).

### Step 5 — Test the whole flow
1. Sign up on your live site, click **Join**, and pay with Stripe's test card
   `4242 4242 4242 4242` (any future date, any CVC).
2. You should land back inside the members area with full access. In Supabase,
   the `profiles` row for that user now shows `is_member = true`.
3. "Manage membership" opens Stripe's portal where a member can cancel.
4. When you are ready for real payments, switch Stripe to **Live mode**, create the
   product/price/keys again there, and update the keys in Netlify.

### Step 6 — Add your real content
- **Workbooks:** in Supabase, create a **Storage** bucket (e.g. "workbooks"),
  upload each month's PDF, copy its URL, and paste it into the `WORKBOOKS` list in
  `components/MembersArea.tsx`. That is your monthly routine — no other code.
- **Videos:** put your video links (YouTube unlisted or Vimeo) into the `LESSONS`
  list and embed them.
- **Events & live classes:** edit the `EVENTS` and `LIVE_UPCOMING` lists.
- (Later, these lists can be moved into a Supabase table so you edit them without
  touching code — a small next step whenever you want it.)

### If you get stuck
The auth + Stripe wiring is genuinely the fiddly part. All the code is done and in
place — if a step doesn't behave, an hour with a developer (or a message to me with
the error) will sort it quickly.


---

## Demo request form (emails you each request)

Every "Book a free demo" button now opens a form asking for **name, email, phone,
age, which language they want, and why they want to learn**. Each submission emails
you the details, using **Resend** (free).

1. Create a free account at resend.com — sign up with the email address where you
   want to receive the requests.
2. **API Keys -> Create API Key**, and copy it.
3. Add two environment variables (in `.env.local` locally, and in Netlify):
   - `RESEND_API_KEY` = your key
   - `DEMO_NOTIFY_EMAIL` = your Resend sign-up email
4. Deploy, then submit the form on your live site — the email should arrive within
   seconds. (Resend's free tier is 3,000 emails per month.)

Note: until you verify a domain in Resend, it can only email **your own** Resend
sign-up address — which is why `DEMO_NOTIFY_EMAIL` should be that address. Later, to
send from `hello@mundolingu.com` (or to also send the person a confirmation), verify
mundolingu.com in Resend (it adds a few DNS records at Strato) and set
`DEMO_FROM_EMAIL`.

The form fields live in `components/DemoForm.tsx` and the email logic in
`app/api/demo/route.ts` — easy to adjust.


---

## Professional polish (added)

- **Social share image** — sharing mundolingu.com on WhatsApp, Instagram, Facebook,
  etc. now shows a branded preview card (`app/opengraph-image.png`).
- **SEO** — full page titles, description, keywords, Open Graph + Twitter tags, plus
  `app/robots.ts` and `app/sitemap.ts` so search engines can index the site.
- **Branded 404 page** (`app/not-found.tsx`) for any wrong link.
- **Floating WhatsApp button** — add your number to show it. Open
  `components/Site.tsx`, find `WHATSAPP_NUMBER` near the top, and set it to your full
  number (country code, digits only), e.g. `"5215512345678"`. Leave it blank to hide.
- **Demo emails** go to **mundolingu@gmail.com** by default. Important: sign up to
  Resend with that same Gmail so the notifications can be delivered without verifying
  a domain (see the demo-form section above).

Optional later: add free web analytics like Cloudflare Web Analytics to see
your visitor numbers.

## Before you sell / launch — replace the sample content

The teachers, testimonials, and stats are realistic placeholders. Swap them for the
real thing so the site is fully authentic:
- Teachers -> `TEACHERS` in `components/Site.tsx`
- Testimonials -> `STORIES`, stats -> `STATS`
- Lessons / events / workbooks -> the lists in `components/MembersArea.tsx`


---

## Learning hub features (added)

Your members area is now a hub — join live lessons, a calendar you manage, and
workbooks members can both download and hand in.

**1. Live lesson link.** Open `components/MembersArea.tsx`, find `LIVE_LESSON_URL`
near the top, and paste your recurring Zoom or Google Meet room link. The "Enter the
lesson" buttons open it.

**2. Events calendar you manage.** Re-run `supabase/schema.sql` in Supabase's SQL
Editor (it only adds what's missing). It creates an `events` table. To add or change
events, go to Supabase -> **Table Editor -> events** and add rows (`event_date`,
`title`, `description`). The members calendar updates automatically. Until you add
any, it shows sample events.

**3. Demo availability.** The demo form now also asks which days and times the person
is free, and includes that in the email to you — so you can offer them a slot.

**4. Workbook hand-in.** After re-running the schema (it also creates a `submissions`
table and a private `submissions` storage bucket), members can upload their completed
work from the Workbooks tab. You'll see every submission in Supabase -> **Table Editor
-> submissions**, and the files in **Storage -> submissions**.

Note: features 2 and 4 need the schema re-run to work. They're built to fail softly
(the calendar shows samples, hand-in shows a clear message) until then. As this grows
toward full course features (grading, drip lessons, automated booking), a dedicated
course platform can also handle a lot of it without code — worth weighing if the
setup gets heavy.


### Email alerts

You now get an email automatically for both key actions — no need to check Supabase:
- **A demo request** (via the form) -> emailed to you.
- **A workbook hand-in** -> emailed to you with a 7-day download link to the file.

Both use Resend, so they just need `RESEND_API_KEY` set (and `DEMO_NOTIFY_EMAIL`,
which defaults to mundolingu@gmail.com). The hand-in link also uses your Supabase
`SUPABASE_SERVICE_ROLE_KEY`, which you already have set.
