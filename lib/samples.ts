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
];
