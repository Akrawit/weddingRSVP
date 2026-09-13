# New & Sai launch plan

## Current state

The local invitation defaults to Thai and uses the couple’s photographs. The home page is a labelled demo; its replies stay in the current browser. Real RSVP collection requires Supabase and personal invitation links. Do not send the demo URL as a working RSVP invitation.

## 1. Confirm event information

- The wedding date is confirmed as 21 November 2026. Family blessing starts at 16:00, welcome at 18:00, and the ceremony at 19:00 Bangkok time.
- Confirm the reply deadline (currently 1 November 2026), dress palette, and a real contact email.
- Venue and map are Oyard, supplied by the couple.
- Gift information is optional; leave it empty unless verified details are supplied.

Edit `src/lib/wedding.ts` after confirmation and update matching date/time wording in both languages in `src/lib/copy.ts`.

## 2. Connect private RSVP storage

Follow the Supabase setup in README.md: apply the initial schema, run the transactional security checks, create the organizer Auth user, allowlist the `/admin/callback` redirect URL, and set the five server environment variables. Enter credentials in the local environment file or hosting environment settings, never in a guest-facing field. The organizer signs in through an email magic link.

## 3. Verify real persistence

Use synthetic invitations first. Allocate four seats, accept with two, then edit to three and decline. The dashboard’s confirmed-people total should change by +2, +1, then -3. Reopen the personal link in a different browser to confirm persistence. Check that another invitation remains unchanged and that a signed-out visitor cannot read the admin list or CSV export. Remove the synthetic invitations when finished.

## 4. Publish

Deploy the `outputs/invitation` directory with the Next.js preset and Node.js 24. Configure the server variables and exact HTTPS `SITE_URL`, rebuild, and repeat the persistence check at the public origin. Localhost links only work on the machine running the preview.

## 5. Check guest devices

On iOS and Android, open a test personal link inside LINE. Confirm Thai initially appears, English switching works, photos load, RSVP can be edited, directions open, and calendar and copy-link controls work. Verify the headcount after each response.

## 6. Invite guests and monitor

Import the guest list once, reviewing seats per invitation. Copy each personal link from the admin dashboard and send it to its intended party. Use confirmed people for catering and seating; invitation count is a separate measure. Export the guest list when needed and keep exports private.

## Release checks

Run lint, unit tests, production build, and the production integration test. The integration test uses a local test double; it does not replace the live database and device checks above.

Database setup completed on 12 September 2026: migration create_wedding_guests applied to project xnymyetfdlaaxqzhsggq through MCP. SQL security checks and transactional accept (2), edit (3), decline (0) checks passed. Test rows rolled back; zero invitations remain.

On 13 September 2026, the local production invitation at `http://localhost:3001` saved a real synthetic RSVP to Supabase: accept for two, edit to three, then decline to zero. The database values matched, the declined response survived a page reload, and an anonymous admin API request returned 401. The synthetic invitation was deleted afterward; the guest table is empty. Organizer magic-link sign-in also works. Public deployment and LINE device checks remain pending.
