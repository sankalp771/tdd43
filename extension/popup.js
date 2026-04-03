const appUrlInput = document.getElementById("appUrl");
const tracePreview = document.getElementById("tracePreview");
const captureButton = document.getElementById("captureButton");
const openButton = document.getElementById("openButton");
const statusEl = document.getElementById("status");

let latestPayload = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function normalizeAppUrl(rawUrl) {
  const fallback = "http://localhost:3000/";

  try {
    const url = new URL(rawUrl || fallback);
    return url.toString();
  } catch {
    return fallback;
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function scrapeConversationInPage() {
  function cleanText(value) {
    return (value || "").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function uniqueBlocks(blocks) {
    const seen = new Set();
    return blocks.filter((block) => {
      const key = `${block.role}::${block.text}`;
      if (!block.text || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function scrapeChatGPT() {
    const primaryNodes = Array.from(
      document.querySelectorAll("[data-message-author-role]"),
    );

    const fallbackNodes = primaryNodes.length
      ? []
      : Array.from(
          document.querySelectorAll(
            "main article, main [data-testid^='conversation-turn-']",
          ),
        );

    const nodes = primaryNodes.length ? primaryNodes : fallbackNodes;

    const blocks = nodes
      .map((node) => {
        let role = node.getAttribute("data-message-author-role") || "";

        if (!role) {
          const text = cleanText(node.innerText).toLowerCase();
          role = text.startsWith("you said") ? "user" : "assistant";
        }

        return {
          role,
          text: cleanText(node.innerText),
        };
      })
      .filter((block) => block.text);

    const unique = uniqueBlocks(blocks);
    return {
      source: "ChatGPT",
      title: document.title.replace(/\s*-\s*ChatGPT\s*$/i, "").trim() || "ChatGPT trace",
      messageCount: unique.length,
      trace: unique
        .map((block) => `${block.role === "user" ? "User" : "Agent"}: ${block.text}`)
        .join("\n\n"),
    };
  }

  function scrapeClaude() {
    const selectors = [
      "[data-testid='user-message']",
      "[data-testid='assistant-message']",
      "main [data-is-streaming]",
      "main [class*='prose']",
      "main article",
    ];

    const nodes = Array.from(
      new Set(
        selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))),
      ),
    );

    const blocks = nodes
      .map((node) => {
        const text = cleanText(node.innerText);
        const role =
          node.getAttribute("data-testid") === "user-message" ||
          node.closest("[data-testid='user-message']")
            ? "user"
            : "assistant";

        return { role, text };
      })
      .filter((block) => block.text);

    const unique = uniqueBlocks(blocks);
    return {
      source: "Claude",
      title: document.title.replace(/\s*-\s*Claude\s*$/i, "").trim() || "Claude trace",
      messageCount: unique.length,
      trace: unique
        .map((block) => `${block.role === "user" ? "User" : "Agent"}: ${block.text}`)
        .join("\n\n"),
    };
  }

  const hostname = window.location.hostname;

  if (hostname.includes("chatgpt.com")) {
    return scrapeChatGPT();
  }

  if (hostname.includes("claude.ai")) {
    return scrapeClaude();
  }

  return {
    source: hostname,
    title: document.title || "Unsupported page",
    messageCount: 0,
    trace: "",
  };
}

async function captureTrace() {
  setStatus("Scraping current conversation...");
  openButton.disabled = true;

  try {
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      setStatus("No active tab found.");
      return;
    }

    if (!activeTab.url?.includes("chatgpt.com") && !activeTab.url?.includes("claude.ai")) {
      setStatus("Open ChatGPT or Claude in the active tab first.");
      tracePreview.value = "";
      latestPayload = null;
      return;
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: scrapeConversationInPage,
    });

    if (!result?.trace) {
      setStatus("No conversation found. Refresh the chat page once and try again.");
      tracePreview.value = "";
      latestPayload = null;
      return;
    }

    latestPayload = result;
    tracePreview.value = latestPayload.trace;
    openButton.disabled = !latestPayload.trace.trim();
    setStatus(
      `Captured ${latestPayload.messageCount} message blocks from ${latestPayload.source}.`,
    );
  } catch (error) {
    tracePreview.value = "";
    latestPayload = null;
    setStatus(
      error instanceof Error
        ? `Scrape failed: ${error.message}`
        : "Scrape failed. Refresh the page and try again.",
    );
  }
}

async function openInApp() {
  if (!latestPayload?.trace) {
    setStatus("Capture a trace first.");
    return;
  }

  const baseUrl = normalizeAppUrl(appUrlInput.value);
  const url = new URL(baseUrl);
  url.searchParams.set("title", latestPayload.title || "Imported trace");
  url.searchParams.set("trace", latestPayload.trace);
  url.searchParams.set("analyze", "1");

  await chrome.tabs.create({ url: url.toString() });
  setStatus("Opened Trace Debugger with imported trace.");
}

captureButton.addEventListener("click", () => {
  void captureTrace();
});

openButton.addEventListener("click", () => {
  void openInApp();
});

void captureTrace();
