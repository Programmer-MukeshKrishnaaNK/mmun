/**
 * Delegate-facing newspaper reads. Published articles only — the `published`
 * flag and the organizer-only write rule in firestore.rules are what keep a
 * draft private; this filter is presentation, not protection.
 *
 * Sorting is done here rather than with orderBy() because Firestore omits
 * documents missing the ordered field from results entirely, which would hide
 * an article whose publishedAt was never set instead of showing it late.
 */
import { collection, onSnapshot } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import type { NewsArticle, NewsCategory, SubscriptionHandlers, Unsubscribe } from "@/types";
import { isPermissionDenied, toAppError } from "@/utils/errors";
import { asDate, asEnum, asString } from "@/utils/parse";

export const NEWS_CATEGORIES: readonly NewsCategory[] = [
  "briefing",
  "committee",
  "interview",
  "opinion",
  "feature",
  "notice",
];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  briefing: "Briefing",
  committee: "Committee",
  interview: "Interview",
  opinion: "Opinion",
  feature: "Feature",
  notice: "Notice",
};

/** Only http(s) covers — anything else is ignored rather than rendered. */
export function asHttpUrl(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function subscribePublishedNews(handlers: SubscriptionHandlers<NewsArticle[]>): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.news),
    (snapshot) => {
      const rows: NewsArticle[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data({ serverTimestamps: "estimate" });
        const title = asString(d.title);
        const body = asString(d.body);
        const publishedAt = asDate(d.publishedAt);
        if (!title || !body || !publishedAt || d.published !== true) return;
        rows.push({
          id: snap.id,
          title,
          body,
          summary: asString(d.summary),
          author: asString(d.author),
          category: asEnum(d.category, NEWS_CATEGORIES, "briefing"),
          coverUrl: asHttpUrl(d.coverUrl),
          publishedAt,
          updatedAt: asDate(d.updatedAt),
        });
      });
      rows.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      handlers.next(rows);
    },
    (err) => {
      // Not provisioned yet is an empty paper, not an error.
      if (isPermissionDenied(err)) {
        handlers.next([]);
        return;
      }
      handlers.error(toAppError(err, "Unable to load the newspaper."));
    },
  );
}

/** First paragraph, for list cards when no summary was written. */
export function excerpt(article: NewsArticle, max = 180): string {
  const text = article.summary ?? article.body.split(/\n\s*\n/)[0] ?? "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}
