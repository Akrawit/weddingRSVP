# VIP Guest Marker Design

## Goal

Let the couple mark individual invitation records as VIP in the admin guest list and include that information when exporting the organizer CSV.

## Admin experience

- Add a `VIP` column to the guest table.
- Each row contains a plainly labeled checkbox.
- Checking or unchecking it saves immediately without opening the edit dialog.
- The interface updates immediately and restores the previous value if saving fails.
- VIP status remains independent from RSVP and invitation delivery status.

## Data and access

- Add `is_vip boolean not null default false` to `public.wedding_guests`.
- Existing and newly created invitations default to non-VIP.
- Only the authenticated admin API can update the field through the existing server-side service-role connection.
- Guest-facing invitation and RSVP routes do not select, return, or display VIP status.

## CSV export

- Add a `vip` column to the exported guest CSV.
- Export `true` for VIP records and `false` for all other records.
- Keep the current export columns and invitation URLs unchanged.

## Validation and release

- Reject non-boolean VIP update values.
- Cover marking, unmarking, CSV output, and existing guest-edit behavior in automated tests.
- Apply the additive database migration before deploying application code.
- Run type checking, lint, unit tests, production build, and the production-route integration test before pushing to `main`.
