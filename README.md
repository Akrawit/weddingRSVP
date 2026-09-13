# New & Sai — digital invitation

RSVP-first wedding invitation built with Next.js 16, React, TypeScript, and Tailwind CSS. Guests confirm attendance and party size; the private organizer view sums confirmed people. The venue is Oyard, using the map supplied by the couple. The names are New & Sai, Thai is the default, and the photographs are the couple’s own. The wedding date and ceremony schedule are confirmed; the RSVP deadline and contact details still need confirmation. See [the launch plan](LAUNCH.md).

## Run locally

Use Node.js 24 LTS (minimum 22.6).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The home page is a design preview for a sample family. Its RSVP is stored in this browser's localStorage and is explicitly labelled as a demo on the page and in the form. It never writes to Supabase. Visit `/admin` for the headcount view: until configured, it shows a connection notice and dashes, not a misleading zero or sample totals. Real guest responses use `/i/{token}` and Supabase.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
npm start
```

## Implemented for review

- Personalized editorial invitation, responsive from 320px to desktop.
- English and Thai copy, locally hosted fonts, reduced-motion support.
- Accept/decline, attendee count, conditional plus-one, dietary needs, reply editing.
- Calendar download, map directions, schedule, screenshot-friendly dress palette.
- Three-photo asymmetric gallery, discreet gift drawer, private sharing flow.
- Today/tomorrow presentation for accepted guests, using the Asia/Bangkok date.
- Real `/i/[token]` server lookup and RSVP endpoint ready for a configured Supabase database.
- Uniform invalid-invitation page, generic metadata, no-referrer and no-index protection.
- SQL schema with RLS, no public guest grants, 256-bit tokens, and database seat constraints.
- A prominent opening-screen RSVP action and a persistent mobile RSVP button.
- Protected organizer sign-in and `/admin` headcount view, with minute-by-minute refresh while visible.
- Confirmed people, allocated seats, accepted/declined/waiting invitations, and pending possible guests.
- Guest creation/editing/deletion, table assignments, secure invitation links, search and status filters.
- CSV preview/import, a downloadable template at `/guest-template.csv`, and export including personal links.
- Automated RSVP, token, count, CSV and date-boundary tests; production HTTP integration tests.

## One place for wedding information

Edit `src/lib/wedding.ts`: names, dates, venue, address, map link, schedule, colours, photographs, contact and gift information. Translation strings live in `src/lib/copy.ts`.

The active images are cartoon-style WebP versions of the supplied prewedding photos. Source images are kept locally outside this deployable app in `outputs/invitation-source-images`. Set a real contact address; the current `hello@example.com` is intentionally a placeholder.

Gift details are empty by default. Add your verified PromptPay QR path and/or bank information to `wedding.gift`. The app does not generate a fake payment QR. Details appear only inside the gift dialog.

## Supabase setup

1. The schema is already applied to the shared Supabase project `xnymyetfdlaaxqzhsggq`. For a separate project, review `supabase/schema.sql` before applying it.
2. `supabase/security-checks.sql` passed against the shared project. It verifies browser role privileges, RLS, token format, and seat/plus-one constraints, then rolls back its fixture data.
3. Create a confirmed organizer email user in Supabase Authentication. Only this user's UUID is authorized; other signed-in Supabase users are denied. No password is needed to sign in to this app.
4. Copy `.env.example` to `.env.local` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` (publishable or legacy anon key), `ADMIN_USER_ID` (organizer UUID), and the exact public `SITE_URL` origin. Never expose the service-role key in a `NEXT_PUBLIC_` variable. Restart the app after configuring it.
5. In Supabase Authentication → URL Configuration, add the exact `${SITE_URL}/admin/callback` URL to Redirect URLs (for local preview, `http://localhost:3001/admin/callback`). The email template must retain its default `{{ .ConfirmationURL }}` link. Visit `/admin`, enter the organizer email, and open the sign-in link from that inbox. Then add or import invitations and copy each guest's personal `/i/{token}` link to send manually through LINE.
6. Exercise accept, edit, decline and refresh on a real development invitation. Verify its database values and the admin headcount, then run the SQL security checks before using real guest information.

Live RSVP persistence and organizer magic-link login have been verified against the shared Supabase project. The local `.env.local` is excluded from Git; configure the same server variables separately in the hosting provider.

Guest routes select only display fields for the matching token. Guest listing, CSV export and every admin mutation require server verification of the organizer's Supabase Auth identity. The admin access token is held in an HttpOnly, SameSite=Strict cookie (Secure over HTTPS), lasting up to one hour; sign in again when it expires. No refresh token is stored. There is no public signup or user-managed admin role.

RSVP writes are constrained to four fields and checked on the server; SQL constraints also enforce allocated seats if allocations change concurrently. Mutating endpoints validate Origin and bound request-body size. Table numbers are rendered prominently only for accepted guests today or tomorrow. Invitation links are bearer credentials: share only with the intended invited party. Open Graph metadata never includes guest names or tokens.

## Headcount and CSV behavior

The main number is the sum of `seats_confirmed` for accepted invitations. Accepted invitations and invited people are labelled separately: a family of three is one invitation and three confirmed guests. Filters affect the table, not the total. Editing an RSVP updates the same database row. Declining confirms zero attendees. Fetching all pages avoids silently counting only the first API page.

CSV columns are `name,seats,language,table`, with optional `plus_one_allowed` (`true`/`false`, defaults to false). Each row creates a new invitation. Review before importing; repeated names are not automatically merged, so import each file once. All rows are validated before one batch insert. Exports include dietary notes and invitation links, and neutralize spreadsheet formula prefixes. Treat exported files as private guest data.

## Verification and remaining setup

`npm test` covers counting, CSV parsing/export safety, validation, tokens and Bangkok dates. After building, `npm run test:integration` launches a temporary production server and an isolated Supabase test double. It checks admin authentication, cookie flags, denied roles, acceptance → edit → decline headcounts, seat limits, request origins, body limits, CSV validation, pagination, CRUD, export, and guest isolation. The test double contains synthetic data and is shut down afterward. These tests do not prove live Supabase RLS; run the supplied SQL security checks against your actual development project.

Before public launch: confirm the RSVP deadline and contact address, configure the production origin, and test on physical iOS/Android devices inside LINE. Invitation-open tracking remains unimplemented and does not affect RSVP counting. Native share and calendar handling can differ between LINE and the system browser. A clipboard/manual-copy fallback is included for sharing.

## Vercel

Import this `invitation` directory as the project root, use Node.js 24 and the default Next.js preset, and configure the five server environment variables above. Build with `npm run build`. No deployment has been created by this task.

## Structure

```text
src/app/                 pages, calendar and RSVP routes
src/components/         invitation and interactive dialogs
src/lib/wedding.ts      wedding configuration
src/lib/copy.ts         bilingual copy
src/lib/guest.ts        RSVP validation and Bangkok date logic
src/lib/server-guests.ts server-only Supabase REST access
src/lib/tokens.ts       secure token creation and validation
public/                 local photographs and font subsets
supabase/               schema and development security checks
tests/                  important validation and security logic
```

## Assets

The invitation uses New & Sai’s prewedding photos, served locally from `public/images/new-sai-*.webp`. Earlier sample assets are unused.

Fonts: Cormorant Garamond, Jost, and Noto Sans Thai from Google Fonts, licensed under the SIL Open Font License. License copies are in `public/fonts/licenses`.

Implementation references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Shared-project setup: the app uses public.wedding_guests and the wedding-specific timestamp function. The initial schema creates new objects; it does not rename or modify an existing guests table. Inspect existing objects before applying it to another project. Runtime keys and ADMIN_USER_ID are required separately from the Codex MCP connection.
