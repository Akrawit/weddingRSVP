# Invitation Sent Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let organizers see, filter, set, and undo whether each personal invitation has been copied for sending.

**Architecture:** Store a private `invitation_sent` boolean on each guest row and expose a narrow authenticated admin PATCH operation. The admin list marks an invitation sent after a successful clipboard copy, offers an undo control, and filters independently from RSVP status.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres/PostgREST, Node integration tests.

---

### Task 1: Persist and secure the sent state

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/add-invitation-sent.sql`
- Modify: `src/lib/admin.ts`
- Modify: `src/lib/admin-guests.ts`
- Modify: `src/app/api/admin/guests/route.ts`
- Test: `tests/production.integration.mjs`

- [x] Add `invitation_sent boolean not null default false` to the initial and incremental schemas.
- [x] Add an admin-only database update function and accept only a boolean sent value in the authenticated PATCH route.
- [x] Test mark, undo, and invalid sent values through the production HTTP route.
- [x] Run the unit suite and a production build.

### Task 2: Add admin controls

**Files:**
- Modify: `src/components/guest-manager.tsx`
- Modify: `src/app/admin/admin.css`

- [x] Mark the invitation sent only after clipboard copy succeeds.
- [x] Show Sent/Not sent beside the copy control and provide Undo sent.
- [x] Add an independent All delivery/Sent/Not sent filter.
- [x] Verify lint, type checking, and production build.

### Task 3: Apply and release

**Files:**
- Modify: live Supabase `public.wedding_guests`

- [x] Apply the additive migration and query the new column.
- [ ] Commit and push `main` so Vercel deploys.
- [ ] Verify the production admin renders the new controls without changing a real guest record.
