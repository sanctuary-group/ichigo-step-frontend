import { apiFetch } from "./client";

export type AnnouncementItem = {
  date: string;
  title: string;
  isNew?: boolean;
};

type ApiAnnouncement = {
  id: number;
  title: string;
  date: string;
  is_new: boolean;
};

/** GET /announcements */
export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const data = await apiFetch<ApiAnnouncement[]>("/announcements");
  return data.map((a) => ({ date: a.date, title: a.title, isNew: a.is_new }));
}
