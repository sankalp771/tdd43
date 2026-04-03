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
  const nodes = Array.from(document.querySelectorAll("[data-message-author-role]"));
  const blocks = nodes
    .map((node) => {
      const role = node.getAttribute("data-message-author-role") || "unknown";
      const text = cleanText(node.innerText);
      return { role, text };
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
    "[data-is-streaming]",
    "[class*='font-claude-message']",
    "main [class*='prose']",
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

function scrapeConversation() {
  const hostname = window.location.hostname;

  if (hostname.includes("chatgpt.com")) {
    return scrapeChatGPT();
  }

  if (hostname.includes("claude.ai")) {
    return scrapeClaude();
  }

  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TRACE_DEBUGGER_SCRAPE") {
    return;
  }

  const payload = scrapeConversation();

  if (!payload || !payload.trace) {
    sendResponse({
      ok: false,
      error: "No conversation content found on this page yet.",
    });
    return;
  }

  sendResponse({
    ok: true,
    payload,
  });
});
