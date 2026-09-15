# VIP Guest Marker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private VIP checkbox to each admin guest record and include the value in CSV exports.

**Architecture:** Persist `is_vip` as a protected boolean on the existing guest row and update it through a narrow authenticated admin PATCH operation. Render an optimistic checkbox in the admin table and append the value to the existing organizer export.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres/PostgREST, Node tests.

---

### Task 1: Persist VIP status

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/add-vip-guest-marker.sql`
- Modify: `src/lib/admin.ts`
- Modify: `src/lib/admin-guests.ts`
- Modify: `src/app/api/admin/guests/route.ts`
- Test: `tests/production.integration.mjs`

- [x] Add `is_vip boolean not null default false` to initial and incremental schemas.
- [x] Add a boolean-only authenticated admin update operation.
- [x] Test VIP mark, unmark, and invalid values through the production HTTP route.

### Task 2: Add the admin checkbox and CSV field

**Files:**
- Modify: `src/components/guest-manager.tsx`
- Modify: `src/app/admin/admin.css`
- Modify: `src/lib/admin.ts`
- Test: `tests/admin.test.ts`

- [x] Add the VIP table column with an immediately saved checkbox and rollback on failure.
- [x] Add `vip` with `true` or `false` to every CSV row.
- [x] Verify unit tests, type checking, lint, build, and integration tests.

### Task 3: Apply and release

**Files:**
- Modify: live Supabase `public.wedding_guests`

- [x] Apply the additive migration before deploying application code.
- [x] Query the new field and confirm existing records default to false.
- [ ] Commit and push `main`, then confirm the Vercel deployment is ready.
