// A small fetch wrapper. Error replies carry {"detail": "..."} in plain words,
// which become the message of the thrown ApiError.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let reply: Response;
  try {
    reply = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach Accountable's server. Is it still running?");
  }
  if (!reply.ok) {
    let message = `Something went wrong (error ${reply.status}).`;
    try {
      const data = await reply.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      // keep the general message
    }
    throw new ApiError(reply.status, message);
  }
  if (reply.status === 204) return undefined as T;
  return (await reply.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
