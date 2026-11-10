const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      "Could not reach the resume analysis server. Check NEXT_PUBLIC_API_URL and make sure the backend is deployed."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : typeof payload === "string" && payload
          ? payload
          : `Request failed (${response.status})`;
    throw new Error(detail);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("The API returned an unexpected response. Verify the backend URL.");
  }
  return payload as T;
}

export type AnalysisResult = {
  match_score: number;
  ats_score: number;
  skills_match: number;
  experience_match: number;
  keyword_match: number;
  matched_skills: string[];
  missing_skills: { name: string; importance: string; reason: string }[];
  keyword_analysis?: { matched: string[]; missing: string[] };
  ats_checks?: { label: string; status: string; detail: string }[];
  recommendations?: { problem: string; why_it_matters: string; before: string; after: string }[];
  summary: string;
  engine?: string;
};

export type OptimizationResult = {
  optimized_resume: string;
  changes?: {
    section: string;
    original: string;
    suggested: string;
    reason: string;
    requires_user_confirmation: boolean;
  }[];
  warnings?: string[];
  summary?: string;
  engine?: string;
};

function resumeForm(resume: File, jobDescription: string, useLLM: boolean): FormData {
  const form = new FormData();
  form.append("resume", resume);
  form.append("job_description", jobDescription);
  form.append("use_llm", String(useLLM));
  return form;
}

export function analyzeResume(resume: File, jobDescription: string, useLLM = true) {
  return request<AnalysisResult>("/api/v1/analyze", {
    method: "POST",
    body: resumeForm(resume, jobDescription, useLLM),
  });
}

export function optimizeResume(resume: File, jobDescription: string, useLLM = true) {
  return request<OptimizationResult>("/api/v1/optimize", {
    method: "POST",
    body: resumeForm(resume, jobDescription, useLLM),
  });
}

export function improveText(text: string, context: string, useLLM = true) {
  return request("/api/v1/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context, use_llm: useLLM }),
  });
}

export function health() {
  return request<{ status: string; service: string }>("/health", { method: "GET" });
}
