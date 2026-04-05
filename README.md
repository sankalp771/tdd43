# Trace Debugger

Github link : https://github.com/sankalp771/tdd43

**Trace Debugger helps developers inspect AI coding and technical assistant runs, surface likely failure modes, and turn opaque outputs into evidence-backed fixes.**

## Overview

Trace Debugger is a lightweight debugging interface for AI coding and technical assistant workflows. Instead of stopping at "the model answered," it analyzes a visible trace and asks:

- What most likely went wrong?
- What evidence supports that diagnosis?
- How should the workflow, prompt, or validation layer improve?

The result is a structured report with a likely root cause, supporting findings, evidence snippets, and recommended fixes.

## What It Does

Trace Debugger can analyze:
- pasted coding chats and technical transcripts
- tool traces
- curated sample failures
- imported conversations captured through a Chrome extension bridge

For each run, it produces:
- a root-cause summary
- failure findings
- evidence pulled from the trace
- suggested fixes
- trace-quality notes

## Why It Matters

AI agents often fail in ways that are difficult to diagnose:
- they sound confident while skipping evidence
- they use the wrong tool or no tool at all
- they stop before verification
- they answer beyond the limits of the available context

That problem is especially painful in technical workflows, where a plausible but unsupported answer can waste debugging time, mislead implementation, or hide an incomplete fix.

Trace Debugger makes those failure patterns legible. It is designed as an early step toward better observability and evaluation tooling for agentic applications.

## Key Features

- **Fast diagnosis:** paste a trace and get a structured debugging report
- **Evidence-backed findings:** every diagnosis is tied to quoted trace evidence
- **Actionable fixes:** output includes concrete ways to improve prompts, workflow, or validation
- **Real trace import:** a Chrome extension bridge can capture visible conversations from supported chat UIs
- **Attachment-aware review mode:** imported traces are reviewed more cautiously when the visible scrape may omit multimodal context
- **Technical focus:** optimized for coding, developer-tooling, and other technical assistant traces rather than open-ended general conversation

## Intended Scope

Trace Debugger is intentionally focused on:
- coding assistants
- developer tooling agents
- technical Q&A traces
- implementation, debugging, and workflow-oriented conversations

It is not currently optimized as a universal analyzer for every topic.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod
- Puter.js
- Chrome Extension (Manifest V3)

## Project Structure

```txt
app/
  layout.tsx
  page.tsx
  icon.svg
lib/
  types.ts
  samples.ts
extension/
  manifest.json
  popup.html
  popup.js
  content.js
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome Extension Bridge

The repository includes a thin Chrome extension under [`extension/`](./extension).

To load it:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `extension` folder

The extension captures the visible conversation from the active tab and opens Trace Debugger with the imported trace prefilled.

## Current Scope

This prototype is strongest on visible technical text traces. Imported runs may reference files, screenshots, or images that are not fully represented in the scraped text, so the app uses a more cautious attachment-aware review mode for those cases.

## Vision

Trace Debugger is an early prototype for a broader agent reliability workflow:
- trace inspection
- failure categorization
- evidence-backed debugging
- fix recommendation
- eventually, regression testing and eval-driven iteration

## Tagline

**From agent output to root cause.**
