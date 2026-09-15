import { api } from "./api";

export type WaitlistPayload = {
  name: string;
  email: string;
};

export class WaitlistError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WaitlistError";
  }
}

/**
 * Join the Blackwater Sound waitlist via the API.
 * Failures surface to the form — no silent offline success.
 */
export async function joinWaitlist(
  payload: WaitlistPayload,
): Promise<{ ok: boolean; duplicate?: boolean }> {
  try {
    return await api.post<{ ok: boolean; duplicate?: boolean }>(
      "/api/waitlist",
      payload,
    );
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Waitlist request failed";
    throw new WaitlistError(
      `Could not join the waitlist. Is the API running? (${detail})`,
      error,
    );
  }
}
