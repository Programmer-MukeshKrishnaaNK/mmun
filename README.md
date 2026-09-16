# MMUN Delegate Portal

Mobile-first delegate portal for MMUN — React 19 · TypeScript · Vite · Tailwind v4 · Firebase · Framer Motion.

```bash
npm install
npm run dev        # http://localhost:5190
npm run build      # type-check + production build → dist/
```

It's a single-page app. Whatever hosts it has to send every path back to `index.html`. On Firebase Hosting, use `"rewrites": [{ "source": "**", "destination": "/index.html" }]`.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in with email and password. Signed-in users skip straight to `/home`. |
| `/home` | Greeting, delegate card, live session status, today's agenda, announcements, documents |
| `/planner` | Timeline for each day with Now / Next / Upcoming / Completed states |
| `/help` | Send a question to organizers, and see your earlier requests |
| `/newspaper` | Conference newspaper — lead story, article grid and a full reading view |
| `/guide` | Searchable guide with collapsible sections, plus contacts |
| `/notifications` | Notifications built from announcements, schedule changes and session start/end |
| `/admin` | **Organizers only.** Console for the live status, schedule, announcements, documents, help requests and delegate lookup. Delegates are redirected to `/home`, and never download the chunk. |

## Structure

```
src/
  lib/          firebase.ts (app + auth), db.ts (Firestore), collections.ts, subscribe.ts
  services/     auth, delegates, session, schedule, announcements, documents, help, guide, notifications
  context/      AuthContext, NowContext (shared clock), ConferenceContext (app-wide live listeners)
  hooks/        useSubscription, useDocuments, useGuide, useMediaQuery, usePageTitle
  layouts/      AppShell, Header, BottomNav
  routes/       guards (RequireAuth / PublicOnly), AuthenticatedApp (lazy chunk)
  pages/        Login, Home, Planner, Help, Guide, Notifications
  components/   ui/, home/, schedule/, profile/, brand/
  content/      guide.ts — general MUN guide shown until organizers add their own
  utils/        time, schedule (now/next logic, day grouping), parse, errors
```

Components never call Firestore directly. Everything goes through `services/`.

## Firestore data

**These already exist and keep their original shape:**

- `users/{uid}`: `name`, `committee`, `play`, `bit_`, `updatedAt`. Delegates can still update committee, play and BITT from the profile sheet. The optional fields `country` and `position` are shown when present.
- `help_requests/{id}`: `userId`, `userName`, `userEmail`, `message`, `status: "Pending"`, `createdAt`. A `category` field is added too. If your rules reject that extra field, the service saves again without it and puts the category at the start of the message instead.

**Organizer-written.** These are read-only for delegates and written from `/admin`. Until they have data, the app shows empty states — never sample data. The exact fields are documented at the top of each service file.

- `conference/live`: `status` (`in_session` | `upcoming` | `break` | `dismissed` | `completed`), plus optional `title`, `detail`, `location`, `startsAt`, `endsAt`. When this document is missing, the live status is worked out from `schedule`.
- `schedule/{id}`: `title`, `startAt`, `endAt`, plus optional `kind`, `location`, `description`, `committees[]`, `changeNote`, `updatedAt`, `published`
- `announcements/{id}`: `title`, `createdAt`, plus optional `message`, `priority`, `committees[]`, `published`
- `documents/{id}`: `title`, `url`, plus optional `type`, `description`, `downloadable` or `downloadUrl`, `committees[]`, `order`
- `news/{id}`: `title`, `body`, `publishedAt`, `published`, plus optional `summary`, `author`, `category`, `coverUrl`. Written from the Newspaper tab in `/admin`; delegates only ever see documents with `published: true`.
- `guide_sections/{id}`: `title`, `items[{title, body}]`, plus optional `icon` and `order`. If this collection has any documents, they replace the built-in guide.
- `contacts/{id}`: `name`, plus optional `role`, `email`, `phone`, `order`

A record with `committees` set is only shown to delegates whose `users/{uid}.committee` matches (case-insensitive). If it's empty or missing, everyone sees it.

## Organizer console

`/admin` is gated two ways. `RequireAdmin` in `routes/guards.tsx` keeps the route
out of the delegate app, and `firestore.rules` is what actually enforces it —
a delegate who reaches the page anyway can't read or write anything.

Organizer UIDs live in `src/constants/admin.ts` **and** in `firestore.rules`.
Both need updating to add an organizer; the constant alone grants nothing.

Reads in `services/admin.ts` are deliberately unfiltered. The delegate services
drop anything malformed or unpublished, which would leave an organizer unable to
see and fix a broken row — so each admin row carries a `hiddenReason` spelling
out why the portal would hide it (no title, ends before it starts, bad link).

`guide_sections` and `contacts` have no panel yet. The portal falls back to its
built-in guide when `guide_sections` is empty, so the Guide page is correct with
no data at all; add documents by hand in the Firebase console if you need to.

## Deploying

```bash
npm run build
npx firebase deploy --only hosting,firestore:rules
```

`firebase.json` serves `dist/` with the SPA rewrite every path needs, hashes
assets with a one-year cache and keeps `index.html` uncached.
`firestore.rules` is the whole ruleset for the project and must be published
before the console will work.
