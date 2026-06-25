import { apiFetch } from "./client";

export type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  email_verified: boolean;
};

/** GET /api/tenant/v1/profile */
export async function fetchProfile(): Promise<Profile> {
  return apiFetch<Profile>("/profile");
}

/** PUT /api/tenant/v1/profile */
export async function updateProfile(input: {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
}): Promise<Profile> {
  return apiFetch<Profile>("/profile", { method: "PUT", body: input });
}

/** PUT /api/tenant/v1/profile/password */
export async function updatePassword(input: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await apiFetch("/profile/password", { method: "PUT", body: input });
}
