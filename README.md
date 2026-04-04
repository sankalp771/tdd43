# Trace Debugger

**Paste an agent run. Find the failure mode, evidence, and fix.**

Trace Debugger is a lightweight debugger for AI agent failures. It takes a visible chat transcript or tool trace, identifies likely failure modes, extracts supporting evidence, and suggests concrete fixes.

This prototype is designed for hackathon speed: fast input, fast diagnosis, clean output, and a credible path from simulated traces to real imported chats.

## Why This Exists

Agent behavior is hard to debug because failure usually looks like:
- a plausible answer that is subtly wrong
- a tool call that should have happened but did not
- a response that sounds confident but is missing real evidence
- an interaction that breaks because context was incomplete, implicit, or hidden

Trace Debugger turns that into something readable:
- root cause
- failure findings
- evidence snippets
- suggested fixes
- trace quality warning

## What It Does

The app analyzes a trace and returns:
- a one-paragraph summary of what likely went wrong
- a primary root-cause label
- supporting findings with severity and confidence
- exact evidence pulled from the trace
- practical remediation suggestions
- a trace-quality assessment

It supports:
- sample traces for reliable demos
- manual paste for arbitrary chat/tool logs
- extension-imported traces captured from live chat UIs

## Demo Story

### Path 1: Curated sample
1. Load a sample trace
2. Click `Analyze Trace`
3. Show the root cause
4. Point to evidence
5. Walk through suggested fixes

### Path 2: Real imported trace
1. Capture a real chat using the extension bridge
2. Open it in the app as an imported trace
3. Analyze the visible conversation
4. Explain why real trace capture matters more than sample-only demos

## Core Product Idea

This is not a generic chatbot wrapper.

It is a trace diagnosis system:
- input comes from a transcript, tool log, or imported chat
- the trace is classified into one or more failure modes
- the model must support findings with evidence from the trace
- the result is rendered as a structured debugging report

## Current Failure Taxonomy

The prototype currently works with these top-level failure modes:
- `bad_planning`
- `wrong_tool_choice`
- `missing_context`
- `hallucinated_assumption`
- `stopped_too_early`
- `format_mismatch`
- `instruction_misread`
- `tool_output_ignored`

Important:
- sample selection is only for loading example traces
- diagnosis comes from the trace itself
- imported traces are treated as source state, not as a failure class

## Extension Bridge

The project includes a thin Chrome extension bridge under [`extension/`](./extension).

Its job is intentionally narrow:
- scrape the visible conversation from ChatGPT or Claude
- open the web app with the imported trace prefilled
- trigger analysis in the main app

This is not a full in-extension product surface. The extension exists to prove that the system can work on real traces, not just handcrafted examples.

## Attachment-Aware Mode

Imported traces may reference:
- files
- screenshots
- images
- PDFs
- other hidden context not fully visible in the scraped chat text

For imported traces, the app uses an attachment-aware mode:
- it assumes the original assistant may have had access to referenced attachment context
- it does not treat missing scraped media as automatic proof of hallucination
- it evaluates the visible response under that assumption

This is important because visible chat scraping is not the same as full multimodal trace capture.

## Current Limitations

This prototype is strongest on visible text traces.

Known limitations:
- confidence percentages are model-estimated, not calibrated metrics
- Claude scraping is less reliable than ChatGPT scraping
- long imported traces may be noisy
- extension scraping only sees what is visible in the page DOM
- attachments, screenshots, and hidden context may not be fully captured
- the analysis is prompt-driven classification, not deterministic scoring logic

In other words:
- this is already useful
- but it is still an honest prototype, not a finished observability platform

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zod for structured output validation
- Puter.js for client-side LLM access
- Chrome Extension (MV3) for real trace import

## How It Works

### 1. Input
The user provides a trace through one of three paths:
- sample trace
- pasted custom trace
- imported trace from the extension

### 2. Prompted diagnosis
The app builds a structured diagnosis prompt and asks the model to return strict JSON with:
- `summary`
- `rootCause`
- `findings`
- `evidence`
- `traceQuality`

### 3. Validation
The model output is validated with Zod before rendering.

### 4. Report UI
The app shows:
- root cause
- findings
- evidence
- fixes
- raw JSON

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

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Using the Chrome Extension

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the [`extension`](./extension) folder
5. Open a ChatGPT or Claude conversation
6. Click the extension
7. Capture the visible trace
8. Open it in Trace Debugger

## Design Principles

This prototype tries to optimize for:
- clarity over hype
- evidence over vibes
- real imported traces over fake-only demos
- useful warnings over overconfident claims

## What Makes It Interesting

Most agent demos stop at "look, it answered."

Trace Debugger asks the more serious question:

**Why did it answer that way, and how would you improve it?**

That makes it useful not just as a demo, but as the beginning of a real developer tool for agent reliability.

## Roadmap

Natural next steps:
- calibrated confidence instead of raw percentages
- smaller and cleaner top-level taxonomy
- explicit severity reasoning
- multimodal trace ingestion
- attachment-aware evidence modeling
- side-by-side run comparison
- regression testing for agent prompt/config changes

## Honest One-Liner

**Today's prototype works best on visible text traces, and already shows how real-world agent debugging could feel much more actionable.**
