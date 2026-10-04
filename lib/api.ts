const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

async function request(path:string, options:RequestInit) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) { const detail = await res.text(); throw new Error(detail || `Request failed (${res.status})`); }
  return res.json();
}

export async function analyzeResume(resume:File, jobDescription:string, useLLM=true) {
  const form = new FormData(); form.append("resume", resume); form.append("job_description", jobDescription); form.append("use_llm", String(useLLM));
  return request("/api/v1/analyze", { method:"POST", body:form });
}
export async function optimizeResume(resume:File, jobDescription:string, useLLM=true) {
  const form = new FormData(); form.append("resume", resume); form.append("job_description", jobDescription); form.append("use_llm", String(useLLM));
  return request("/api/v1/optimize", { method:"POST", body:form });
}
export async function improveText(text:string, context:string, useLLM=true) {
  return request("/api/v1/improve", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({text,context,use_llm:useLLM}) });
}
export async function health() { return request("/health", {method:"GET"}); }
