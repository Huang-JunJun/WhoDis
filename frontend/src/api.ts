import { ReportResponse, SessionResponse } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  createSession() {
    return request<SessionResponse>("/api/session/create", { method: "POST" });
  },

  getSession(id: string) {
    return request<SessionResponse>(`/api/session/${id}`);
  },

  answerSession(id: string, selectedOptionId: string) {
    return request<SessionResponse>(`/api/session/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ selectedOptionId }),
    });
  },

  createReport(id: string) {
    return request<ReportResponse>(`/api/session/${id}/report`, { method: "POST" });
  },

  getReport(id: string) {
    return request<ReportResponse>(`/api/session/${id}/report`);
  },
};
