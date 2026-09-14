# Envelope Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Briefly display a named envelope before the guest invitation.

**Architecture:** Add one small client component for the timed intro and CSS shapes to the existing stylesheet. Pass the existing guest display name and language from `Invitation`; do not change RSVP data flow.

**Tech Stack:** Next.js, React, CSS.

---

### Task 1: Intro component

**Files:** Create `src/components/envelope-intro.tsx`; modify `src/components/invitation.tsx`.

- [x] Add `EnvelopeIntro` with `name` and `language` props. Render a full-screen button with the addressee, envelope flap, inner card, and a short skip hint.
- [x] Start the opening CSS state after 350 ms, fade after 1,450 ms, and unmount after 1,850 ms. Activation unmounts immediately. Reduced-motion preference unmounts immediately.
- [x] Mount it before the main invitation using `guest.display_name` and `lang`.

### Task 2: Styling and verification

**Files:** Modify `src/app/globals.css`.

- [x] Add responsive envelope geometry and short transitions. Keep the full overlay above the existing page and RSVP bar.
- [x] Run `npm run build` and `git diff --check`.
- [x] Verify on the live site with a mobile viewport that the named envelope disappears and the RSVP button remains accessible.
