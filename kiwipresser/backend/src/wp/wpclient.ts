// src/wp/WPClient.ts

export class WPClient {
  protected baseUrl: string;
  protected authHeader?: string;

  constructor(baseUrl?: string) {
    // Single source of truth for WordPress REST root
    this.baseUrl = (baseUrl ?? process.env.WPURL ?? "").replace(/\/$/, "");

    if (!this.baseUrl) {
      throw new Error("WPClient: baseUrl is required (expected /wp-json)");
    }

    // Enforce contract early (saves hours later)
    if (!this.baseUrl.endsWith("/wp-json")) {
      console.warn(
        "WPClient warning: baseUrl should end with /wp-json",
        this.baseUrl
      );
    }

    // Build auth header only if credentials exist
    if (process.env.WP_USER && process.env.WP_APP_PASSWORD) {
      this.authHeader = Buffer.from(
        `${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`
      ).toString("base64");
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Safe URL construction (no string concatenation)
    const url = new URL(endpoint, this.baseUrl).toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined)
    };

    // Attach auth only when available
    if (this.authHeader) {
      headers.Authorization = `Basic ${this.authHeader}`;
    }

    // Debug visibility (keep or remove later)
    console.log("WP FETCH:", url);

    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WP error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }
}
