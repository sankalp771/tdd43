export type TraceSample = {
  id: string;
  label: string;
  title: string;
  trace: string;
};

export const traceSamples: TraceSample[] = [
  {
    id: "hallucinated-pricing",
    label: "Hallucinated pricing",
    title: "AcmeCloud pricing lookup",
    trace: `User: Find the latest pricing for AcmeCloud's Pro plan and summarize it in a table with source links.

Agent: I know AcmeCloud usually charges around $49/month for Pro, so I'll draft the answer directly.

Agent: Final answer:
| Plan | Price |
| Pro | $49/month |

Source: AcmeCloud pricing page`,
  },
  {
    id: "wrong-tool-choice",
    label: "Wrong tool choice",
    title: "Support refund policy check",
    trace: `User: Check whether order #58192 is eligible for a refund under our internal policy.

Agent: I should verify the policy and the order status.

Agent Tool Call: web_search("company refund policy order #58192")
Tool Output: Public help center article describing general return rules.

Agent: The article says refunds are allowed within 30 days. I will answer based on that.

Agent: Final answer: Order #58192 is eligible for a refund.

Note: No CRM tool was called. No internal order system or internal policy document was queried.`,
  },
  {
    id: "stopped-too-early",
    label: "Stopped too early",
    title: "Bug fix with no verification",
    trace: `User: Fix the failing login test and confirm all auth tests pass.

Agent: I found the issue in the validation logic.

Agent Tool Call: edit_file("auth.ts")
Tool Output: Updated auth.ts successfully.

Agent: The bug should be fixed now.

Agent: Final answer: I fixed the login test failure and the auth suite should pass.

Note: No test command was run. No verification output is present.`,
  },
  {
    id: "missing-context",
    label: "Missing context",
    title: "Contract redline without policy packet",
    trace: `User: Review this vendor contract draft and tell me whether the liability cap is acceptable under our standard legal policy.

Agent: I will compare the clause against the company's standard legal thresholds.

Agent: I only see the draft excerpt provided in the chat. I do not have the internal legal policy packet or fallback guidance.

Agent: The clause caps liability at fees paid in the last 12 months. That is probably acceptable.

Agent: Final answer: The liability cap looks acceptable under our standard policy.

Note: No internal policy document, prior approved clause library, or legal guideline was referenced in the trace.`,
  },
  {
    id: "instruction-misread",
    label: "Instruction misread",
    title: "Customer email needs bullets only",
    trace: `User: Draft a reply to this angry customer. Keep it under 80 words, use bullet points, and do not offer a refund.

Agent: I should write a warm apology and solve the issue.

Agent: Final answer:
Hi there,

I'm very sorry about the inconvenience. We can absolutely refund your order right away, and we appreciate your patience while we fix this. Please reply with your order number and we will process the refund immediately.

Best,
Support Team`,
  },
  {
    id: "tool-output-ignored",
    label: "Tool output ignored",
    title: "Flight lookup ignores actual search result",
    trace: `User: Find the cheapest nonstop flight from Delhi to Dubai next Friday and give me the departure time.

Agent: I'll check the flight search tool.

Agent Tool Call: flight_search("DEL", "DXB", "next Friday", { nonstop: true })
Tool Output:
1. Air Indigo 6E-145, 09:10, $182
2. Emirates EK-513, 04:15, $310

Agent: Emirates is usually the best option for this route.

Agent: Final answer: The cheapest nonstop flight is Emirates EK-513 departing at 04:15.`,
  },
  {
    id: "bad-planning",
    label: "Bad planning",
    title: "Research brief with no decomposition",
    trace: `User: Compare the top three payroll tools for startups in India, include pricing, compliance support, and one source per tool.

Agent: I will do this quickly in one pass.

Agent: Tool Call: web_search("best payroll tools for startups India")
Tool Output: Search results with several blog roundups and vendor homepages.

Agent: Final answer:
1. RazorPay Payroll
2. WorkPay India
3. PayFlow

They all support compliance and have startup-friendly pricing.

Source: Various web results

Note: The agent never created a plan for gathering pricing per tool, verifying compliance support, or attaching one source to each tool.`,
  },
  {
    id: "format-mismatch",
    label: "Format mismatch",
    title: "JSON-only extraction task",
    trace: `User: Extract the customer's name, plan, and renewal date from the text below. Return valid JSON only with keys "name", "plan", and "renewalDate".

Agent: I found the fields.

Agent: Final answer:
Name: Priya Shah
Plan: Growth
Renewal Date: 2026-07-14

Let me know if you want this in JSON too.`,
  },
];
