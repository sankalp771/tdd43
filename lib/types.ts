import { z } from "zod";

export const failureModeSchema = z.enum([
  "bad_planning",
  "wrong_tool_choice",
  "missing_context",
  "hallucinated_assumption",
  "stopped_too_early",
  "format_mismatch",
  "instruction_misread",
  "tool_output_ignored",
]);

export const analyzeTraceRequestSchema = z.object({
  trace: z.string().min(1, "Trace is required."),
  title: z.string().optional(),
});

export const evidenceItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  snippet: z.string(),
  reason: z.string(),
});

export const failureFindingSchema = z.object({
  mode: failureModeSchema,
  confidence: z.number().min(0).max(1),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string(),
  evidenceIds: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
});

export const analyzeTraceResponseSchema = z.object({
  summary: z.string(),
  rootCause: z.object({
    mode: failureModeSchema,
    confidence: z.number().min(0).max(1),
    explanation: z.string(),
  }),
  findings: z.array(failureFindingSchema).min(1).max(4),
  evidence: z.array(evidenceItemSchema).min(2).max(6),
  traceQuality: z.object({
    parseable: z.boolean(),
    completeness: z.enum(["low", "medium", "high"]),
    notes: z.string(),
  }),
});

export type FailureMode = z.infer<typeof failureModeSchema>;
export type AnalyzeTraceRequest = z.infer<typeof analyzeTraceRequestSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type FailureFinding = z.infer<typeof failureFindingSchema>;
export type AnalyzeTraceResponse = z.infer<typeof analyzeTraceResponseSchema>;
