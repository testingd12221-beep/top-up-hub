const BASE_URL = "https://api.rechpays.in/api/v1/ext";

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

/**
 * Single place where the ReachPays API is called. The API key never leaves the server.
 */
export async function reachpays<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const apiKey = process.env["REACHPAYS_API_KEY"];
  if (!apiKey) throw new ProviderError("Recharge provider is not configured", 500);

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    console.error("ReachPays network error", error);
    throw new ProviderError("Recharge provider is unreachable. Please try again.", 502);
  }

  const text = await response.text();
  let payload: { success?: boolean; message?: string; data?: T } = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    console.error("ReachPays invalid response", response.status, text.slice(0, 300));
    throw new ProviderError("Invalid response from recharge provider", 502);
  }

  if (!response.ok || payload.success === false) {
    console.error("ReachPays error", path, response.status, payload.message);
    throw new ProviderError(payload.message || "Recharge provider request failed", response.status);
  }

  return (payload.data ?? ({} as T)) as T;
}
