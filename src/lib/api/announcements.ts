import { apiFetch } from "./client";

export type AnnouncementImportance = "normal" | "important" | "maintenance";

export type AnnouncementItem = {
  id: number;
  date: string;
  title: string;
  body: string;
  importance: AnnouncementImportance;
  isNew?: boolean;
};

type ApiAnnouncement = {
  id: number;
  title: string;
  body: string | null;
  importance: AnnouncementImportance | null;
  date: string;
  is_new: boolean;
};

function asImportance(v: string | null): AnnouncementImportance {
  return v === "important" || v === "maintenance" ? v : "normal";
}

/** GET /announcements */
export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const data = await apiFetch<ApiAnnouncement[]>("/announcements");
  return data.map((a) => ({
    id: a.id,
    date: a.date,
    title: a.title,
    body: a.body ?? "",
    importance: asImportance(a.importance),
    isNew: a.is_new,
  }));
}
