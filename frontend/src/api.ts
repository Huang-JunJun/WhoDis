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
    let errorMessage = "";
    try {
      const errorJson = JSON.parse(errorText) as { message?: unknown };
      if (typeof errorJson.message === "string") {
        errorMessage = errorJson.message;
      }
    } catch {
      errorMessage = "";
    }
    throw new Error(errorMessage || errorText || `Request failed: ${response.status}`);
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

  previousQuestion(id: string) {
    return request<SessionResponse>(`/api/session/${id}/previous`, { method: "POST" });
  },

  createReport(id: string) {
    return request<ReportResponse>(`/api/session/${id}/report`, { method: "POST" });
  },

  createSkillMarkdown(id: string) {
    return request<ReportResponse>(`/api/session/${id}/report/skill`, { method: "POST" });
  },

  getReport(id: string) {
    return request<ReportResponse>(`/api/session/${id}/report`);
  },
};
