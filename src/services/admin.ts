/**
 * Organizer writes. Everything the delegate portal reads is written here.
 *
 * The delegate-facing services in this folder deliberately filter out anything
 * malformed or unpublished. An organizer needs the opposite: they must see the
 * rows delegates *can't*, or a hidden event is invisible from both sides. So
 * these reads are unfiltered, and each row carries a `hiddenReason` explaining
 * why the portal would drop it.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Timestamp,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { COLLECTIONS, LIVE_SESSION_DOC_ID } from "@/lib/collections";
import { db } from "@/lib/db";
import type {
  AnnouncementPriority,
  NewsCategory,
  DocumentType,
  ScheduleEventKind,
  SessionStatus,
  SubscriptionHandlers,
  Unsubscribe,
} from "@/types";
import { isPermissionDenied, toAppError } from "@/utils/errors";
import { asDate, asNumber, asString, asStringArray } from "@/utils/parse";

// ─── Row shapes ───────────────────────────────────────────────────────────

interface AdminRow {
  id: string;
  /** Set when the delegate portal would not show this row. */
  hiddenReason?: string;
  /** Saved but deliberately withheld from delegates. */
  draft: boolean;
}

/**
 * Which collection a schedule row lives in. Events written by the original
 * portal are in `schedule_events`; anything this console creates goes there
 * too, because that is what the delegate app reads and what the currently
 * published rules already allow an organizer to write. `schedule` is read and
 * editable so nothing created before this change is stranded.
 */
export type ScheduleSource = "schedule" | "schedule_events";

export interface AdminScheduleRow extends AdminRow {
  source: ScheduleSource;
  title: string;
  startAt?: Date;
  endAt?: Date;
  kind: ScheduleEventKind;
  location?: string;
  description?: string;
  changeNote?: string;
}

export interface AdminAnnouncementRow extends AdminRow {
  title: string;
  message?: string;
  priority: AnnouncementPriority;
  createdAt?: Date;
  committees: string[];
}

export interface AdminDocumentRow extends AdminRow {
  title: string;
  url: string;
  type: DocumentType;
  description?: string;
  committees: string[];
  order: number;
  downloadable: boolean;
}

export interface AdminHelpRequest {
  id: string;
  userName: string;
  userEmail: string;
  message: string;
  status: string;
  category?: string;
  createdAt?: Date;
}

export interface AdminDelegate {
  uid: string;
  name?: string;
  school?: string;
  committee?: string;
  email?: string;
}

export interface LiveSessionDraft {
  status: SessionStatus | "";
  title: string;
  detail: string;
  location: string;
  startsAt?: Date;
  endsAt?: Date;
}

// ─── Inputs ───────────────────────────────────────────────────────────────

export interface ScheduleEventInput {
  title: string;
  startAt: Timestamp | null;
  endAt: Timestamp | null;
  kind: ScheduleEventKind;
  location: string;
  description: string;
  changeNote: string;
  published: boolean;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  committees: string[];
  published: boolean;
}

export interface DocumentInput {
  title: string;
  url: string;
  type: DocumentType;
  description: string;
  committees: string[];
  order: number;
  downloadable: boolean;
  published: boolean;
}

export interface LiveSessionInput {
  status: SessionStatus;
  title: string;
  detail: string;
  location: string;
  startsAt: Timestamp | null;
  endsAt: Timestamp | null;
}

// ─── Shared subscribe helper (unfiltered, unlike lib/subscribe) ────────────

function subscribeRaw<T>(
  q: Parameters<typeof onSnapshot>[0],
  parse: (snap: QueryDocumentSnapshot<DocumentData>) => T,
  handlers: SubscriptionHandlers<T[]>,
  fallback: string,
  sort?: (a: T, b: T) => number,
): Unsubscribe {
  return onSnapshot(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    q as any,
    (snapshot: { forEach: (cb: (d: QueryDocumentSnapshot<DocumentData>) => void) => void }) => {
      const rows: T[] = [];
      snapshot.forEach((d) => rows.push(parse(d)));
      if (sort) rows.sort(sort);
      handlers.next(rows);
    },
    (err: unknown) => handlers.error(toAppError(err, fallback)),
  );
}

/**
 * Sorting happens here rather than with orderBy() for a specific reason:
 * Firestore omits documents that lack the ordered field from the results
 * entirely. Ordering the console by `startAt` or `createdAt` would therefore
 * hide exactly the malformed rows the console exists to surface — an
 * announcement with no timestamp would be invisible to the organizer *and* to
 * delegates, with nowhere to fix it. These lists are small, so we read them
 * whole and order them here.
 *
 * Undated rows sort first: they're broken, and they need attention.
 */
function byDate<T>(get: (row: T) => Date | undefined, direction: "asc" | "desc") {
  return (a: T, b: T): number => {
    const left = get(a);
    const right = get(b);
    if (!left && !right) return 0;
    if (!left) return -1;
    if (!right) return 1;
    return direction === "asc" ? left.getTime() - right.getTime() : right.getTime() - left.getTime();
  };
}

// ─── Schedule ─────────────────────────────────────────────────────────────

const KINDS: readonly ScheduleEventKind[] = ["session", "ceremony", "break", "meal", "social", "other"];

export function subscribeAdminSchedule(handlers: SubscriptionHandlers<AdminScheduleRow[]>): Unsubscribe {
  let modern: AdminScheduleRow[] = [];
  let legacy: AdminScheduleRow[] = [];
  let modernReady = false;
  let legacyReady = false;

  const emit = () => {
    if (!modernReady || !legacyReady) return;
    handlers.next([...modern, ...legacy].sort(byDate((r) => r.startAt, "asc")));
  };

  const parse = (source: ScheduleSource) => (snap: QueryDocumentSnapshot<DocumentData>): AdminScheduleRow => {
    const d = snap.data({ serverTimestamps: "estimate" });
    const isLegacy = source === "schedule_events";
    const title = asString(d.title);
    const startAt = asDate(isLegacy ? d.startTime : d.startAt);
    const endAt = asDate(isLegacy ? d.endTime : d.endAt);

    // Mirrors the filter in services/schedule.ts, so the organizer sees the
    // same verdict the delegate app reaches.
    let hiddenReason: string | undefined;
    if (!title) hiddenReason = "No title — delegates won't see this.";
    else if (!startAt || !endAt) hiddenReason = "Missing a start or end time.";
    else if (endAt <= startAt) hiddenReason = "Ends before it starts.";

    return {
      id: snap.id,
      source,
      title: title ?? "(untitled)",
      startAt,
      endAt,
      kind: (KINDS.includes(String(isLegacy ? d.type : d.kind).toLowerCase() as ScheduleEventKind)
        ? String(isLegacy ? d.type : d.kind).toLowerCase()
        : "session") as ScheduleEventKind,
      location: asString(d.location),
      description: asString(isLegacy ? d.notes : d.description) ?? asString(d.description),
      changeNote: asString(d.changeNote),
      draft: d.published === false,
      hiddenReason,
    };
  };

  const read = (
    source: ScheduleSource,
    assign: (rows: AdminScheduleRow[]) => void,
    markReady: () => void,
  ): Unsubscribe =>
    onSnapshot(
      collection(db, source),
      (snapshot) => {
        const rows: AdminScheduleRow[] = [];
        snapshot.forEach((d) => rows.push(parse(source)(d)));
        assign(rows);
        markReady();
        emit();
      },
      (err) => {
        // One collection being locked down or absent must not blank the other.
        if (isPermissionDenied(err)) {
          assign([]);
          markReady();
          emit();
          return;
        }
        handlers.error(toAppError(err, "Unable to load the schedule."));
      },
    );

  const stopModern = read("schedule", (r) => (modern = r), () => (modernReady = true));
  const stopLegacy = read("schedule_events", (r) => (legacy = r), () => (legacyReady = true));
  return () => {
    stopModern();
    stopLegacy();
  };
}

/**
 * New events are written to `schedule_events` so they work under the rules
 * that are already published. Editing an existing event writes back to
 * whichever collection it came from, never moving it between the two.
 */
export async function saveScheduleEvent(
  target: { id: string | null; source: ScheduleSource },
  input: ScheduleEventInput,
): Promise<void> {
  const legacyShape = {
    title: input.title,
    startTime: input.startAt,
    endTime: input.endAt,
    // The original portal grouped its planner by this string; harmless to keep
    // consistent with the documents already there.
    day: input.startAt ? input.startAt.toDate().toISOString().slice(0, 10) : "",
    type: input.kind,
    location: input.location,
    notes: input.description,
    changed: input.changeNote.length > 0,
    changeNote: input.changeNote,
    published: input.published,
    updatedAt: serverTimestamp(),
  };
  const modernShape = { ...input, updatedAt: serverTimestamp() };
  const payload = target.source === "schedule_events" ? legacyShape : modernShape;

  if (target.id) await updateDoc(doc(db, target.source, target.id), payload);
  else await addDoc(collection(db, target.source), payload);
}

export function deleteScheduleEvent(target: { id: string; source: ScheduleSource }): Promise<void> {
  return deleteDoc(doc(db, target.source, target.id));
}

// ─── Announcements ────────────────────────────────────────────────────────

const PRIORITIES: readonly AnnouncementPriority[] = ["normal", "important", "urgent"];

export function subscribeAdminAnnouncements(
  handlers: SubscriptionHandlers<AdminAnnouncementRow[]>,
): Unsubscribe {
  return subscribeRaw(
    collection(db, COLLECTIONS.announcements),
    (snap) => {
      const d = snap.data({ serverTimestamps: "estimate" });
      const title = asString(d.title) ?? asString(d.content);
      const createdAt = asDate(d.createdAt);

      let hiddenReason: string | undefined;
      if (!title) hiddenReason = "No title — delegates won't see this.";
      else if (!createdAt) hiddenReason = "No timestamp. Re-save it to fix.";

      return {
        id: snap.id,
        title: title ?? "(untitled)",
        message: asString(d.message),
        priority: (PRIORITIES.includes(d.priority as AnnouncementPriority)
          ? d.priority
          : "normal") as AnnouncementPriority,
        createdAt,
        committees: asStringArray(d.committees),
        draft: d.published === false,
        hiddenReason,
      };
    },
    handlers,
    "Unable to load announcements.",
    byDate((r) => r.createdAt, "desc"),
  );
}

export async function saveAnnouncement(id: string | null, input: AnnouncementInput): Promise<void> {
  if (id) {
    // createdAt is left alone on edit so correcting a typo doesn't jump the
    // announcement back to the top of every delegate's feed.
    await updateDoc(doc(db, COLLECTIONS.announcements, id), { ...input });
    return;
  }
  // createdAt is mandatory: the portal orders by it, and Firestore omits
  // documents missing an ordered field from query results entirely — so one
  // without it is invisible rather than last.
  await addDoc(collection(db, COLLECTIONS.announcements), { ...input, createdAt: serverTimestamp() });
}

export function deleteAnnouncement(id: string): Promise<void> {
  return deleteDoc(doc(db, COLLECTIONS.announcements, id));
}

// ─── Documents ────────────────────────────────────────────────────────────

const DOC_TYPES: readonly DocumentType[] = [
  "agenda",
  "rules",
  "handbook",
  "study_guide",
  "committee",
  "announcement",
  "other",
];

/** The portal only accepts http/https links and silently drops anything else. */
export function isUsableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function subscribeAdminDocuments(handlers: SubscriptionHandlers<AdminDocumentRow[]>): Unsubscribe {
  return subscribeRaw(
    collection(db, COLLECTIONS.documents),
    (snap) => {
      const d = snap.data({ serverTimestamps: "estimate" });
      const title = asString(d.title);
      const url = asString(d.url);

      let hiddenReason: string | undefined;
      if (!title) hiddenReason = "No title — delegates won't see this.";
      else if (!url) hiddenReason = "No link.";
      else if (!isUsableUrl(url)) hiddenReason = "Link isn't http(s), so the portal ignores it.";

      return {
        id: snap.id,
        title: title ?? "(untitled)",
        url: url ?? "",
        type: (DOC_TYPES.includes(d.type as DocumentType) ? d.type : "other") as DocumentType,
        description: asString(d.description),
        committees: asStringArray(d.committees),
        order: asNumber(d.order, 1000),
        downloadable: d.downloadable === true,
        draft: d.published === false,
        hiddenReason,
      };
    },
    handlers,
    "Unable to load documents.",
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

export async function saveDocument(id: string | null, input: DocumentInput): Promise<void> {
  const payload = { ...input, updatedAt: serverTimestamp() };
  if (id) await updateDoc(doc(db, COLLECTIONS.documents, id), payload);
  else await addDoc(collection(db, COLLECTIONS.documents), payload);
}

export function deleteDocument(id: string): Promise<void> {
  return deleteDoc(doc(db, COLLECTIONS.documents, id));
}

// ─── Live session ─────────────────────────────────────────────────────────

const STATUSES: readonly SessionStatus[] = ["in_session", "upcoming", "break", "dismissed", "completed"];

export async function fetchLiveSessionDraft(): Promise<LiveSessionDraft> {
  const snap = await getDoc(doc(db, COLLECTIONS.conference, LIVE_SESSION_DOC_ID));
  const d = snap.exists() ? snap.data() : {};
  const raw = asString(d.status)?.toLowerCase().replace(/[\s-]+/g, "_") ?? "";
  return {
    status: (STATUSES as readonly string[]).includes(raw) ? (raw as SessionStatus) : "",
    title: asString(d.title) ?? "",
    detail: asString(d.detail) ?? "",
    location: asString(d.location) ?? "",
    startsAt: asDate(d.startsAt),
    endsAt: asDate(d.endsAt),
  };
}

export async function saveLiveSession(input: LiveSessionInput): Promise<void> {
  await setDoc(
    doc(db, COLLECTIONS.conference, LIVE_SESSION_DOC_ID),
    { ...input, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Blanking the status is enough — the portal treats an unrecognised value as
 * "not set" and falls back to deriving status from the schedule.
 */
export async function clearLiveSession(): Promise<void> {
  await setDoc(
    doc(db, COLLECTIONS.conference, LIVE_SESSION_DOC_ID),
    { status: "", updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ─── Help requests ────────────────────────────────────────────────────────

export function subscribeAllHelpRequests(handlers: SubscriptionHandlers<AdminHelpRequest[]>): Unsubscribe {
  return subscribeRaw(
    collection(db, COLLECTIONS.helpRequests),
    (snap) => {
      const d = snap.data({ serverTimestamps: "estimate" });
      return {
        id: snap.id,
        userName: asString(d.userName) ?? "Delegate",
        userEmail: asString(d.userEmail) ?? "",
        message: asString(d.message) ?? "",
        status: asString(d.status) ?? "Pending",
        category: asString(d.category),
        createdAt: asDate(d.createdAt),
      };
    },
    handlers,
    "Unable to load help requests.",
    byDate((r) => r.createdAt, "desc"),
  );
}

export function resolveHelpRequest(id: string): Promise<void> {
  return updateDoc(doc(db, COLLECTIONS.helpRequests, id), { status: "Resolved" });
}

/**
 * Permanent. The delegate who sent it loses it from their "your requests" list
 * too, so resolving is usually the better answer — this is for spam and
 * duplicates.
 */
export function deleteHelpRequest(id: string): Promise<void> {
  return deleteDoc(doc(db, COLLECTIONS.helpRequests, id));
}

// ─── Delegates ────────────────────────────────────────────────────────────

/** One-off read. Only organizers may list users/ — see firestore.rules. */
export async function fetchDelegates(): Promise<AdminDelegate[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.users));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: asString(data.name),
      school: asString(data.school),
      committee: asString(data.committee),
      email: asString(data.email),
    };
  });
}

// ─── Newspaper ────────────────────────────────────────────────────────────

export interface AdminNewsRow extends AdminRow {
  title: string;
  body: string;
  summary?: string;
  author?: string;
  category: NewsCategory;
  coverUrl?: string;
  publishedAt?: Date;
}

export interface NewsInput {
  title: string;
  body: string;
  summary: string;
  author: string;
  category: NewsCategory;
  coverUrl: string;
  published: boolean;
  publishedAt: Timestamp | null;
}

const NEWS_KINDS: readonly NewsCategory[] = [
  "briefing",
  "committee",
  "interview",
  "opinion",
  "feature",
  "notice",
];

export function subscribeAdminNews(handlers: SubscriptionHandlers<AdminNewsRow[]>): Unsubscribe {
  return subscribeRaw(
    collection(db, COLLECTIONS.news),
    (snap) => {
      const d = snap.data({ serverTimestamps: "estimate" });
      const title = asString(d.title);
      const body = asString(d.body);
      const publishedAt = asDate(d.publishedAt);

      // Mirrors the delegate filter, so an organizer can see why an article
      // isn't on the stand.
      let hiddenReason: string | undefined;
      if (!title) hiddenReason = "No headline — delegates won't see this.";
      else if (!body) hiddenReason = "No article body.";
      else if (!publishedAt) hiddenReason = "No publication date. Re-save to set one.";

      return {
        id: snap.id,
        title: title ?? "(untitled)",
        body: body ?? "",
        summary: asString(d.summary),
        author: asString(d.author),
        category: (NEWS_KINDS.includes(String(d.category).toLowerCase() as NewsCategory)
          ? String(d.category).toLowerCase()
          : "briefing") as NewsCategory,
        coverUrl: asString(d.coverUrl),
        publishedAt,
        draft: d.published !== true,
        hiddenReason,
      };
    },
    handlers,
    "Unable to load the newspaper.",
    byDate((r) => r.publishedAt, "desc"),
  );
}

export async function saveNewsArticle(id: string | null, input: NewsInput): Promise<void> {
  const payload = {
    ...input,
    // Stamped on first publish and kept afterwards, so editing a typo doesn't
    // reorder the front page.
    publishedAt: input.publishedAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (id) await updateDoc(doc(db, COLLECTIONS.news, id), payload);
  else await addDoc(collection(db, COLLECTIONS.news), payload);
}

export function deleteNewsArticle(id: string): Promise<void> {
  return deleteDoc(doc(db, COLLECTIONS.news, id));
}
