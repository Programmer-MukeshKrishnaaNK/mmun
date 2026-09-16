import { collection, getDocs } from "firebase/firestore";
import { DEFAULT_GUIDE_SECTIONS } from "@/content/guide";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import type { Contact, GuideIcon, GuideItem, GuideSection } from "@/types";
import { isPermissionDenied } from "@/utils/errors";
import { asEnum, asNumber, asString } from "@/utils/parse";

const ICONS: readonly GuideIcon[] = ["landmark", "users", "gavel", "scroll", "info", "help"];

export interface GuideContent {
  sections: GuideSection[];
  contacts: Contact[];
}

function parseItems(sectionId: string, value: unknown): GuideItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw, i) => {
    if (typeof raw !== "object" || raw === null) return [];
    const r = raw as Record<string, unknown>;
    const title = asString(r.title);
    const body = asString(r.body);
    return title && body ? [{ id: `${sectionId}-${i}`, title, body }] : [];
  });
}

async function readCollection<T>(name: string, parse: (id: string, data: Record<string, unknown>) => T | null) {
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => parse(d.id, d.data())).filter((v): v is T => v !== null);
  } catch (err) {
    if (isPermissionDenied(err)) return [];
    throw err;
  }
}

/**
 * ADMIN INTEGRATION POINT
 *   guide_sections/{id}: { title, icon?, order?, items: [{ title, body }] }
 *     — if present, replaces the built-in guide content.
 *   contacts/{id}: { name, role?, email?, phone?, order? }
 */
export async function fetchGuideContent(): Promise<GuideContent> {
  {
    const [sections, contacts] = await Promise.all([
      readCollection<GuideSection>(COLLECTIONS.guideSections, (id, data) => {
        const title = asString(data.title);
        const items = parseItems(id, data.items);
        if (!title || items.length === 0) return null;
        return { id, title, items, icon: asEnum(data.icon, ICONS, "info"), order: asNumber(data.order, 1000) };
      }),
      readCollection<Contact>(COLLECTIONS.contacts, (id, data) => {
        const name = asString(data.name);
        if (!name) return null;
        return {
          id,
          name,
          role: asString(data.role),
          email: asString(data.email),
          phone: asString(data.phone),
          order: asNumber(data.order, 1000),
        };
      }),
    ]);
    return {
      sections: sections.length ? sections.sort((a, b) => a.order - b.order) : DEFAULT_GUIDE_SECTIONS,
      contacts: contacts.sort((a, b) => a.order - b.order),
    };
  }
}
