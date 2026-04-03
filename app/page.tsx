"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

import { traceSamples } from "@/lib/samples";
import {
  analyzeTraceResponseSchema,
  type AnalyzeTraceResponse,
  type FailureMode,
} from "@/lib/types";

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string,
          options?: {
            model?: string;
            stream?: boolean;
            temperature?: number;
            max_tokens?: number;
          },
        ) => Promise<
          | string
          | {
              text?: string;
              message?: {
                content?: string;
              };
            }
        >;
      };
    };
  }
}

const emptyTrace = traceSamples[0]?.trace ?? "";
const emptyTitle = traceSamples[0]?.title ?? "";
const model = "gpt-5.4-mini";

const modeLabels: Record<FailureMode, string> = {
  bad_planning: "Bad planning",
  wrong_tool_choice: "Wrong tool choice",
  missing_context: "Missing context",
  hallucinated_assumption: "Hallucinated assumption",
  stopped_too_early: "Stopped too early",
  format_mismatch: "Format mismatch",
  instruction_misread: "Instruction misread",
  tool_output_ignored: "Tool output ignored",
};

const systemPrompt = `You are an expert debugger for AI agent runs.

Your job is to analyze a trace of an agent execution and identify likely failure modes.

Rules:
- Use only the provided trace.
- Do not invent missing steps, tools, or hidden intentions.
- Every finding must be supported by direct evidence from the trace.
- Prefer specific, practical explanations over vague commentary.
- If the trace is incomplete or ambiguous, say so clearly in traceQuality.notes and lower confidence.
- Suggested fixes must be actionable changes to prompts, workflow, tool policy, or output validation.
- Return valid JSON only.
- Follow the schema exactly.

Allowed failure modes:
- bad_planning
- wrong_tool_choice
- missing_context
- hallucinated_assumption
- stopped_too_early
- format_mismatch
- instruction_misread
- tool_output_ignored

Severity guidance:
- low: issue exists but probably not the main reason for failure
- medium: meaningful contributor to failure
- high: likely primary blocker or root cause

Confidence guidance:
- 0.0 to 0.39 = weak evidence
- 0.4 to 0.69 = plausible
- 0.7 to 1.0 = strong evidence

You must respond with JSON only.`;

function confidenceLabel(confidence: number) {
  if (confidence >= 0.7) return "High confidence";
  if (confidence >= 0.4) return "Medium confidence";
  return "Low confidence";
}

function buildPrompt(trace: string, title?: string) {
  return `${systemPrompt}

Analyze the following agent trace and return a JSON object with this exact structure:

{
  "summary": "string",
  "rootCause": {
    "mode": "bad_planning | wrong_tool_choice | missing_context | hallucinated_assumption | stopped_too_early | format_mismatch | instruction_misread | tool_output_ignored",
    "confidence": 0.0,
    "explanation": "string"
  },
  "findings": [
    {
      "mode": "bad_planning | wrong_tool_choice | missing_context | hallucinated_assumption | stopped_too_early | format_mismatch | instruction_misread | tool_output_ignored",
      "confidence": 0.0,
      "severity": "low | medium | high",
      "explanation": "string",
      "evidenceIds": ["e1"],
      "suggestedFixes": ["string"]
    }
  ],
  "evidence": [
    {
      "id": "e1",
      "label": "string",
      "snippet": "string",
      "reason": "string"
    }
  ],
  "traceQuality": {
    "parseable": true,
    "completeness": "low | medium | high",
    "notes": "string"
  }
}

Requirements:
- Include 1 to 4 findings.
- Include 2 to 6 evidence items.
- Evidence snippets must be short exact excerpts from the trace.
- Every finding must reference at least one evidence item by id.
- Suggested fixes must be concrete and testable.
- If the trace is too incomplete to support a strong conclusion, reflect that in confidence and traceQuality.

Title: ${title ?? "Untitled trace"}

Trace:
${trace}`;
}

function extractPuterText(
  response:
    | string
    | {
        text?: string;
        message?: {
          content?: string;
        };
      },
) {
  if (typeof response === "string") {
    return response;
  }

  if (response && typeof response.text === "string") {
    return response.text;
  }

  if (response?.message && typeof response.message.content === "string") {
    return response.message.content;
  }

  return "";
}

export default function Home() {
  const [title, setTitle] = useState(emptyTitle);
  const [trace, setTrace] = useState(emptyTrace);
  const [selectedSampleId, setSelectedSampleId] = useState(traceSamples[0]?.id ?? "");
  const [result, setResult] = useState<AnalyzeTraceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(false);

  const suggestedFixes = useMemo(() => {
    if (!result) return [];

    return Array.from(
      new Set(result.findings.flatMap((finding) => finding.suggestedFixes)),
    );
  }, [result]);

  const handleLoadSample = (sampleId: string) => {
    const sample = traceSamples.find((entry) => entry.id === sampleId);
    if (!sample) return;

    setSelectedSampleId(sample.id);
    setTitle(sample.title);
    setTrace(sample.trace);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.puter?.ai?.chat) {
        throw new Error("Puter is not loaded yet. Wait a second and try again.");
      }

      const rawResponse = await window.puter.ai.chat(buildPrompt(trace, title), {
        model,
        temperature: 0.2,
        max_tokens: 1400,
      });

      const text = extractPuterText(rawResponse).trim();

      if (!text) {
        throw new Error("Puter returned an empty response.");
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(text);
      } catch {
        throw new Error(`Puter returned invalid JSON: ${text}`);
      }

      const validated = analyzeTraceResponseSchema.safeParse(parsedJson);

      if (!validated.success) {
        throw new Error(
          `Puter returned JSON that does not match the expected schema: ${JSON.stringify(validated.error.flatten())}`,
        );
      }

      setResult(validated.data);
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error ? caughtError.message : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onLoad={() => setPuterReady(true)}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-stone-800 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_transparent_30%),linear-gradient(135deg,_rgba(28,25,23,0.96),_rgba(12,10,9,1))] p-8 shadow-2xl shadow-amber-500/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                Trace Debugger
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
                Paste an agent run. Find the failure mode, evidence, and fix.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
                A lightweight debugger for AI agent failures. Drop in a transcript
                or tool trace and get a root-cause report you can actually act on.
              </p>
              <p className="mt-2 text-sm text-stone-400">
                Client-side analysis via Puter.js using <code>{model}</code>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || !trace.trim() || !puterReady}
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Analyzing..." : puterReady ? "Analyze Trace" : "Loading Puter..."}
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(traceSamples[0]?.id ?? "")}
                className="rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-900"
              >
                Load Sample
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-50">Trace Input</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Paste a transcript, tool log, or raw JSON trace.
                </p>
              </div>
              <select
                value={selectedSampleId}
                onChange={(event) => handleLoadSample(event.target.value)}
                className="rounded-full border border-stone-700 bg-stone-950 px-4 py-2 text-sm text-stone-200 outline-none transition focus:border-amber-300"
              >
                {traceSamples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-300">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="AcmeCloud pricing lookup"
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-300">
                  Trace
                </span>
                <textarea
                  value={trace}
                  onChange={(event) => setTrace(event.target.value)}
                  placeholder="Paste the full agent run here..."
                  className="min-h-[420px] w-full rounded-3xl border border-stone-700 bg-stone-950 px-4 py-4 font-mono text-sm leading-6 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
                    Root Cause
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-50">
                    {result ? modeLabels[result.rootCause.mode] : "Waiting for analysis"}
                  </h2>
                </div>
                {result ? (
                  <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
                    {confidenceLabel(result.rootCause.confidence)} ·{" "}
                    {Math.round(result.rootCause.confidence * 100)}%
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-stone-300">
                {error
                  ? error
                  : result
                    ? result.summary
                    : "Run an analysis to generate a concise summary, likely root cause, and practical fixes."}
              </p>

              {result ? (
                <div className="mt-5 rounded-2xl border border-stone-800 bg-stone-950/80 p-4 text-sm leading-7 text-stone-300">
                  {result.rootCause.explanation}
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-stone-50">Failure Findings</h2>
                {result ? (
                  <span className="text-sm text-stone-500">
                    {result.findings.length} finding{result.findings.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-4">
                {result ? (
                  result.findings.map((finding) => (
                    <article
                      key={`${finding.mode}-${finding.explanation}`}
                      className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-300">
                          {modeLabels[finding.mode]}
                        </span>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs font-medium text-stone-400">
                          {finding.severity} severity
                        </span>
                        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs font-medium text-stone-400">
                          {Math.round(finding.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-stone-300">
                        {finding.explanation}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">
                    Your findings will show up here with severity and confidence.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
            <h2 className="text-xl font-semibold text-stone-50">Evidence</h2>
            <div className="mt-5 space-y-4">
              {result ? (
                result.evidence.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-stone-200">
                        {item.label}
                      </span>
                      <span className="rounded-full border border-stone-700 px-2.5 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                        {item.id}
                      </span>
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/30 p-3 font-mono text-xs leading-6 text-amber-100">
                      {item.snippet}
                    </pre>
                    <p className="mt-3 text-sm leading-7 text-stone-400">{item.reason}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">
                  Short evidence snippets will be quoted directly from the trace.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
              <h2 className="text-xl font-semibold text-stone-50">Suggested Fixes</h2>
              <div className="mt-5 space-y-3">
                {result ? (
                  suggestedFixes.map((fix) => (
                    <div
                      key={fix}
                      className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4 text-sm leading-7 text-stone-300"
                    >
                      {fix}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">
                    Concrete workflow, prompt, and validation fixes will appear here.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
              <h2 className="text-xl font-semibold text-stone-50">Trace Quality</h2>
              {result ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-300">
                      Parseable: {result.traceQuality.parseable ? "Yes" : "No"}
                    </span>
                    <span className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-300">
                      Completeness: {result.traceQuality.completeness}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-stone-400">
                    {result.traceQuality.notes}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">
                  This section flags whether the trace was complete enough to trust the diagnosis.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-stone-50">Raw JSON</h2>
                {result ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                    }
                    className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:bg-stone-950"
                  >
                    Copy JSON
                  </button>
                ) : null}
              </div>
              <pre className="mt-5 max-h-[320px] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-6 text-stone-300">
                {result
                  ? JSON.stringify(result, null, 2)
                  : `{
  "summary": "...",
  "rootCause": { "mode": "hallucinated_assumption" }
}`}
              </pre>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
