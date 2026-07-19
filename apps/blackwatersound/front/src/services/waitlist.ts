import { api } from "./api";

export type WaitlistPayload = {
  name: string;
  email: string;
};

export async function joinWaitlist(payload: WaitlistPayload): Promise<{ ok: boolean; duplicate?: boolean }> {
  try {
    return await api.post<{ ok: boolean; duplicate?: boolean }>("/api/waitlist", payload);
  } catch {
    // Offline dev fallback when API is not running yet.
    return { ok: true };
  }
}
