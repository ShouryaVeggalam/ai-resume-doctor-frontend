"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";

import { analyzeResume, optimizeResume } from "@/lib/api";

type Analysis = {
  match_score: number;
  ats_score: number;
  skills_match: number;
  experience_match: number;
  keyword_match: number;
  matched_skills: string[];
  missing_skills: {
    name: string;
    importance: string;
    reason: string;
  }[];
  keyword_analysis?: {
    matched: string[];
    missing: string[];
  };
  ats_checks?: {
    check: string;
    status: string;
    detail: string;
  }[];
  recommendations?: {
    problem: string;
    why_it_matters: string;
    before: string;
    after: string;
  }[];
  summary: string;
  engine?: string;
};

type Optimization = {
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

function ScoreRing({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#111 ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
          <span className="text-2xl font-bold">{score}%</span>
        </div>
      </div>

      <span className="mt-3 text-sm font-semibold text-gray-600">
        {label}
      </span>
    </div>
  );
}

function Optimization({
  data,
}: {
  data: Optimization;
}) {
  const resumeText = data?.optimized_resume || "";

  const downloadResume = () => {
    const blob = new Blob([resumeText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "optimized-resume.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const printResume = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1000"
    );

    if (!printWindow) {
      return;
    }

    const escapedResume = resumeText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Optimized Resume</title>

          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 0 30px;
              color: #111;
              line-height: 1.5;
            }

            pre {
              white-space: pre-wrap;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.55;
            }

            @media print {
              body {
                margin: 20px;
              }
            }
          </style>
        </head>

        <body>
          <pre>${escapedResume}</pre>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white">
              <WandSparkles size={18} />
            </div>

            <div>
              <h2 className="font-bold">
                Resume optimization
              </h2>

              <p className="text-sm text-gray-500">
                Review the AI suggestions before applying them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadResume}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
            >
              <Download size={16} />
              Download Resume
            </button>

            <button
              onClick={printResume}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Printer size={16} />
              Save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="p-7">
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>AI safety:</strong> Review every change before using this
          resume. AI Resume Doctor should never invent experience, skills,
          employers, dates, certifications, metrics, or achievements.
        </div>

        <div className="max-h-[700px] overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <pre className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
            {resumeText}
          </pre>
        </div>

        {data.warnings && data.warnings.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-semibold text-amber-900">
              Review before applying
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              {data.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {data.changes && data.changes.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-bold">
              AI changes
            </h3>

            <div className="space-y-4">
              {data.changes.map((change, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                      {change.section}
                    </span>

                    {change.requires_user_confirmation && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Requires confirmation
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-500">
                    Original
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {change.original || "No original text"}
                  </p>

                  <div className="my-4 flex items-center gap-2 text-gray-400">
                    <ArrowRight size={16} />
                  </div>

                  <p className="text-sm font-semibold text-gray-500">
                    Suggested
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {change.suggested}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {change.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.summary && (
          <div className="mt-6 rounded-2xl bg-gray-950 p-5 text-sm leading-6 text-gray-200">
            {data.summary}
          </div>
        )}
      </div>
    </div>
  );
}

function Results({
  data,
  onOptimize,
  loading,
}: {
  data: Analysis;
  onOptimize: () => void;
  loading: boolean;
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Analysis complete
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Your resume diagnosis
            </h2>
          </div>

          {data.engine && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Powered by {data.engine.toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
          <ScoreRing
            score={data.match_score}
            label="Match"
          />

          <ScoreRing
            score={data.ats_score}
            label="ATS"
          />

          <ScoreRing
            score={data.skills_match}
            label="Skills"
          />

          <ScoreRing
            score={data.experience_match}
            label="Experience"
          />

          <ScoreRing
            score={data.keyword_match}
            label="Keywords"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 size={20} />
            <h3 className="font-bold">
              Matched skills
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.matched_skills?.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <AlertCircle size={20} />
            <h3 className="font-bold">
              Missing skills
            </h3>
          </div>

          <div className="space-y-3">
            {data.missing_skills?.map((skill) => (
              <div
                key={skill.name}
                className="rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {skill.name}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold">
                    {skill.importance}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {skill.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.summary && (
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h3 className="mb-3 font-bold">
            AI assessment
          </h3>

          <p className="leading-7 text-gray-600">
            {data.summary}
          </p>
        </div>
      )}

      {data.ats_checks && data.ats_checks.length > 0 && (
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h3 className="mb-5 font-bold">
            ATS checks
          </h3>

          <div className="space-y-3">
            {data.ats_checks.map((check, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-2xl bg-gray-50 p-4"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    {check.check}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {check.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations &&
        data.recommendations.length > 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <h3 className="mb-5 font-bold">
              Recommendations
            </h3>

            <div className="space-y-5">
              {data.recommendations.map(
                (recommendation, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-100 p-5"
                  >
                    <h4 className="font-semibold">
                      {recommendation.problem}
                    </h4>

                    <p className="mt-2 text-sm text-gray-500">
                      {recommendation.why_it_matters}
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                          Before
                        </p>

                        <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6">
                          {recommendation.before}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                          Suggested
                        </p>

                        <div className="rounded-xl bg-gray-950 p-4 text-sm leading-6 text-white">
                          {recommendation.after}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      <div className="rounded-3xl bg-gray-950 p-7 text-white">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold">
              Ready to improve your resume?
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Let AI rewrite your resume for clarity and ATS alignment.
            </p>
          </div>

          <button
            disabled={loading}
            onClick={onOptimize}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-gray-950 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                className="animate-spin"
                size={18}
              />
            ) : (
              <WandSparkles size={18} />
            )}

            {loading
              ? "Optimizing..."
              : "Fix my resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Analyzer() {
  const [file, setFile] =
    useState<File | null>(null);

  const [jd, setJd] = useState("");

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [optimized, setOptimized] =
    useState<Optimization | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const run = async () => {
    if (!file || !jd.trim()) {
      setError(
        "Please upload a resume and enter a job description."
      );
      return;
    }

    setLoading(true);
    setError("");
    setOptimized(null);

    try {
      const result = await analyzeResume(
        file,
        jd,
        true
      );

      setAnalysis(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Resume analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const optimize = async () => {
    if (!file || !jd.trim()) {
      setError(
        "Please upload a resume and enter a job description."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await optimizeResume(
        file,
        jd,
        true
      );

      setOptimized(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Resume optimization failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white">
              <Upload size={18} />
            </div>

            <div>
              <h2 className="font-bold">
                Upload your resume
              </h2>

              <p className="text-sm text-gray-500">
                PDF or DOCX
              </p>
            </div>
          </div>

          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center transition hover:border-gray-400">
            <FileText size={30} />

            <span className="mt-3 font-semibold">
              {file
                ? file.name
                : "Choose your resume"}
            </span>

            <span className="mt-1 text-sm text-gray-500">
              Click to upload
            </span>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(event) => {
                const selected =
                  event.target.files?.[0] || null;

                setFile(selected);
              }}
            />
          </label>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white">
              <FileText size={18} />
            </div>

            <div>
              <h2 className="font-bold">
                Job description
              </h2>

              <p className="text-sm text-gray-500">
                Paste the job description
              </p>
            </div>
          </div>

          <textarea
            value={jd}
            onChange={(event) =>
              setJd(event.target.value)
            }
            placeholder="Paste the complete job description here..."
            className="min-h-48 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-6 outline-none transition focus:border-gray-400 focus:bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-center">
        <button
          disabled={loading}
          onClick={run}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-7 py-4 font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              className="animate-spin"
              size={18}
            />
          ) : (
            <Sparkles size={18} />
          )}

          {loading
            ? "Analyzing..."
            : "Analyze my resume"}
        </button>
      </div>

      {analysis && (
        <Results
          data={analysis}
          onOptimize={optimize}
          loading={loading}
        />
      )}

      {optimized && (
        <Optimization data={optimized} />
      )}
    </div>
  );
}
