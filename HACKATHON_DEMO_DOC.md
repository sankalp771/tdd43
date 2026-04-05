# Trace Debugger Demo Doc

## Project
Trace Debugger

## One-Liner
Trace Debugger analyzes AI coding and technical assistant traces, identifies likely failure modes, and turns opaque outputs into evidence-backed fixes.

## Submission Summary
Trace Debugger is a lightweight debugging interface for AI coding and technical assistant workflows. It ingests visible traces from pasted chats, tool logs, curated samples, and imported browser conversations, then produces a structured diagnosis with root cause, evidence, and practical fixes.

## Problem
AI agents often fail in subtle ways:
- they sound confident without verification
- they skip tools or misuse them
- they answer beyond the context actually available
- they stop before completing the real task

These failures are hard to debug from raw transcripts alone.

## Solution
Trace Debugger converts a raw trace into:
- root cause
- failure findings
- supporting evidence
- suggested fixes
- trace quality notes

## Key Features
- sample trace analysis
- pasted custom trace analysis
- imported real trace analysis via Chrome extension bridge
- evidence-backed findings
- attachment-aware review mode for imported traces

## Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod
- Puter.js
- Chrome Extension (MV3)

## Demo Flow
1. Show homepage
2. Load a curated technical failure sample
3. Run analysis
4. Point to root cause, evidence, and suggested fixes
5. Show extension import flow
6. Open imported trace in app
7. Re-run analysis on a real trace

## Screenshots

### 1. Homepage
![Homepage](./screenshots/homepage.png)

Notes:
- clean landing state
- technical debugging positioning

### 2. Sample Trace Loaded
![Sample Trace](./screenshots/sample-trace.png)

Notes:
- show technical trace input
- highlight curated sample workflow

### 3. Root Cause + Findings
![Analysis Result](./screenshots/analysis-result.png)

Notes:
- root cause
- findings
- evidence-backed reasoning

### 4. Extension Capture
![Extension Capture](./screenshots/extension-capture.png)

Notes:
- real trace import from live assistant
- proves system is not sample-only

### 5. Imported Trace Analysis
![Imported Trace](./screenshots/imported-trace.png)

Notes:
- imported trace source state
- attachment-aware warning
- diagnosis from real visible conversation

## What Makes It Interesting
- moves beyond "AI answered" into "why it failed"
- useful for agent debugging, evals, and reliability workflows
- bridges curated examples and real imported traces
- designed for technical and coding-focused assistant traces

## Current Scope
This prototype is strongest on visible technical text traces. Imported runs may reference screenshots, files, or images not fully represented in the scraped text, so the app uses a more cautious attachment-aware review mode in those cases.

## Future Work
- multimodal trace ingestion
- calibrated confidence
- cleaner taxonomy
- regression testing over trace sets
- richer eval workflows for technical agents

## Tagline
From agent output to root cause.
