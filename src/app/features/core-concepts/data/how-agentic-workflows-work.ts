import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 21 — How Agentic Workflows Work
// ─────────────────────────────────────────────────────────────────────────────
export const howAgenticWorkflowsWork: CoreConcept = {
  id: 'how-agentic-workflows-work',
  title: 'How Agentic Workflows Work',
  emoji: '🧭',
  icon: 'ti-route',
  color: '#4f46e5',
  bg: '#e0e7ff',
  accentGlow: 'rgba(79,70,229,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Chaining, routing, parallel calls, orchestrator-workers, critique loops and planners — plus context engineering, memory, budgets and multi-agent setups. How to design an agentic app.',
  tags: [
    'Agentic Patterns',
    'Orchestrator-Workers',
    'Context Engineering',
    'Agent Memory',
    'Multi-Agent Systems',
    'Human-in-the-Loop',
  ],
  estimatedTime: '55 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'Quick recap from How AI Agents & MCP Work: tool calling lets a model ask your code to run a function, and an agent is the loop that keeps calling the model, running the tools it asks for and feeding the results back until it gives a final answer. This lesson is about everything around that loop — how you combine model calls, code and tools into a reliable application. An agentic workflow is any system where one or more LLM (large language model) calls are wired together with code, tools and checks to finish a task that a single prompt cannot.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: a single LLM call is one clever employee answering one question. An agentic workflow is a small team with a process — someone sorts incoming requests, someone drafts, someone reviews, someone checks the facts, and a manager decides when the job is done. Most of the engineering is designing that process, not making any one employee smarter.',
        },
        { type: 'heading2', text: 'The Spectrum: Call → Workflow → Agent' },
        {
          type: 'paragraph',
          text: 'There is no single "agentic" switch. Think of a spectrum of how much control you hand to the model. At one end, your code makes one LLM call. In the middle, a workflow — your code decides the steps and their order, and the LLM fills in each step. At the far end, an agent — the model decides which step comes next, which tools to use and when it is finished.',
        },
        {
          type: 'flow',
          title: 'Who decides the next step?',
          code: `flowchart LR
  A["Single LLM call<br/>one prompt, one answer<br/>cheapest, most predictable"]:::client -->|"more autonomy"| B["Workflow<br/>code decides the steps"]:::server
  B -->|"more autonomy"| C["Agent<br/>model decides the steps<br/>most flexible, least predictable"]:::highlight`,
          text: 'Moving right buys flexibility and costs latency, money, predictability and testability. Move only as far right as the task needs.',
        },
        {
          type: 'bullets',
          items: [
            'Single call: summarise this ticket, translate this string, extract fields into JSON. Often enough, especially with good prompting and retrieval (see How Prompt Engineering Works and How RAG Works).',
            'Workflow: a fixed pipeline such as "classify the ticket → retrieve relevant docs → draft reply → check tone". Each step is an LLM call or plain code, and the path is written in TypeScript.',
            'Agent: "investigate why this customer was double-charged and fix it". The steps cannot be known in advance, so the model chooses tools in a loop.',
            'Hybrid (most real apps): a workflow whose individual steps are small, bounded agents — for example a fixed pipeline where only the "research" step is an agent with a 6-step limit.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The golden rule: use the simplest design that reliably solves the task. Every step of autonomy you add multiplies cost, latency and the number of ways things can go wrong. Interviewers reward candidates who say "this part is a workflow, not an agent, and here is why".',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        {
          type: 'paragraph',
          text: 'One giant prompt that says "read these 40 documents, decide what matters, check the database, write a report and double-check it" usually fails in quiet ways: the model skips steps, loses details from the middle of a long context, invents facts it could have looked up, and produces something you cannot debug because it all happened inside one opaque call. Splitting the job into smaller, checkable steps fixes most of this.',
        },
        { type: 'heading2', text: 'What Structure Buys You' },
        {
          type: 'bullets',
          items: [
            'Accuracy: each call has one focused job and a short, relevant context, so it does that job better. Models are noticeably more reliable on narrow tasks than on sprawling ones.',
            'Checkability: between steps, plain code can validate outputs (is this valid JSON? does the cited document exist? is the total under the refund limit?) before errors spread.',
            'Cost control: easy steps go to a small fast model, hard steps to a large reasoning model, and independent steps run in parallel.',
            'Observability: each step is a separate span (a timed, logged unit of work) you can trace, evaluate and replay — see How AI Evals & Observability Work.',
            'Safety: risky actions become explicit steps where you can insert permission checks and human approval — see How AI Security & Guardrails Work.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Structure is not free either. Each extra LLM call adds roughly 0.5–5 seconds and more tokens. A five-step chain that takes 10 seconds may be fine for a background report but terrible for autocomplete. Always weigh the quality gain against the latency budget of the feature.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        {
          type: 'paragraph',
          text: 'Almost every agentic app is built from six reusable patterns. Learn them as building blocks: you will combine two or three of them in any real design.',
        },
        { type: 'heading2', text: '1. Prompt Chaining (with Gates)' },
        {
          type: 'paragraph',
          text: 'The output of one LLM call becomes the input of the next, in a fixed order. Between steps you add gates — plain-code checks that stop or retry the chain if a step produced something wrong. Use it when a task splits cleanly into stages, like "outline → write → translate" or "extract → validate → summarise".',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: prompt chaining is an assembly line with quality inspectors. Each station does one thing, and an inspector between stations sends faulty parts back before they reach the next station.',
        },
        { type: 'heading2', text: '2. Routing' },
        {
          type: 'paragraph',
          text: 'A first, cheap call classifies the request, and code dispatches it to the right specialised handler — a different prompt, a different set of tools, or a different model. Use it when inputs fall into distinct categories that are better handled separately (billing vs. technical support vs. refunds), or to send easy questions to a small fast model and hard ones to a large reasoning model.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// router.ts — a small fast model picks the route; code does the dispatching
type Route = 'billing' | 'technical' | 'refund' | 'other';

const ROUTES: Record<Route, (q: string) => Promise<string>> = {
  billing: (q) => billingWorkflow(q),         // fixed workflow, billing tools only
  technical: (q) => techSupportAgent(q),      // bounded agent with docs search
  refund: (q) => refundWorkflow(q),           // workflow with human approval step
  other: (q) => answerWithLargeModel(q),      // fallback: bigger model, general prompt
};

export async function handle(question: string): Promise<string> {
  const res = await llm.chat({
    model: 'small-fast',                       // a tier name in your own config, not a vendor id
    messages: [
      { role: 'system', content: 'Classify the support question. Reply with JSON {"route": "billing"|"technical"|"refund"|"other", "confidence": 0-1}.' },
      { role: 'user', content: question },
    ],
    responseFormat: 'json',
  });

  let route: Route = 'other';
  try {
    const parsed = JSON.parse(res.text) as { route: Route; confidence: number };
    if (parsed.route in ROUTES && parsed.confidence >= 0.7) route = parsed.route;
  } catch {
    // unparseable -> fall back to the safe general route
  }
  return ROUTES[route](question);
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Always give the router a safe fallback route and a confidence threshold. A misrouted request should land somewhere sensible, not in the refund pipeline. Routing is also cheap to evaluate: build a labelled set of a few hundred questions and measure accuracy before shipping.',
        },
        { type: 'heading2', text: '3. Parallelization: Sectioning and Voting' },
        {
          type: 'paragraph',
          text: 'Run several LLM calls at the same time and combine the results in code. Sectioning splits a task into independent parts (check a contract against five policies, each in its own call). Voting runs the same task several times, or with different prompts, and takes the majority or the most cautious answer — useful for judgements like "is this content unsafe?" where a single call might be wrong.',
        },
        { type: 'heading2', text: '4. Orchestrator-Workers' },
        {
          type: 'paragraph',
          text: 'A lead model (the orchestrator) looks at the task, decides which subtasks are needed, and hands each to a worker call — often in parallel — then combines their results. It differs from sectioning because the subtasks are not known in advance: the orchestrator decides them per request. Use it for tasks like "research these competitors" or "update every file affected by this change", where the number and shape of subtasks depends on the input.',
        },
        {
          type: 'flow',
          title: 'Orchestrator splits, workers run in parallel, synthesiser combines',
          code: `flowchart TB
  T([Task]):::client --> O["Orchestrator LLM<br/>writes a typed plan"]:::highlight
  O --> V{"Validate plan<br/>max 5 subtasks"}:::security
  V --> W1["Worker 1<br/>small model + tools"]:::server
  V --> W2["Worker 2<br/>small model + tools"]:::server
  V --> W3["Worker 3<br/>small model + tools"]:::server
  W1 --> SY["Synthesiser LLM<br/>merge + cite"]:::highlight
  W2 --> SY
  W3 --> SY
  SY --> R([Final result]):::client`,
          text: 'The plan is data, not free text, so your code can validate it, cap it and log it before spending tokens on workers.',
        },
        { type: 'heading2', text: '5. Evaluator-Optimizer (Writer-Critic Loop)' },
        {
          type: 'paragraph',
          text: 'One call drafts, another call critiques the draft against clear criteria, and the first call revises using the critique — repeating until the critic approves or a stop condition is hit. Use it when you can state what "good" looks like (passes the tests, under 200 words, cites every claim, matches the style guide) and iteration measurably helps. Without a stop condition this loop can run forever, polishing in circles.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The best critic is not an LLM at all when you can avoid it: compilers, unit tests, JSON Schema validators, link checkers and word counters give exact feedback for free. Use an LLM critic for the fuzzy parts (tone, completeness), and keep the best-scoring draft rather than the last one.',
        },
        { type: 'heading2', text: '6. Plan-and-Execute' },
        {
          type: 'paragraph',
          text: 'A planner call writes an explicit step-by-step plan up front; an executor carries out the steps one at a time (each step may be a tool call or a small agent); after each step, results are checked, and if a step fails or reveals something unexpected, the planner is asked to replan the remaining steps. Compared with a plain agent loop that decides one step at a time, an explicit plan is easier to show users, approve, checkpoint and resume.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: plan-and-execute is how you cook a new recipe. You read the whole recipe first and write a shopping list (plan), then cook step by step (execute). If the shop is out of basil, you do not start over — you adjust the remaining steps (replan).',
        },
        { type: 'heading2', text: 'Choosing a Pattern' },
        {
          type: 'bullets',
          items: [
            'Steps are fixed and sequential → prompt chaining.',
            'Inputs fall into clear categories, or difficulty varies a lot → routing.',
            'Independent parts, or a judgement that benefits from several opinions → parallelization.',
            'Subtasks depend on the input and can run independently → orchestrator-workers.',
            'Clear quality criteria and iteration helps → evaluator-optimizer.',
            'Long, multi-step task that users want to see, approve or resume → plan-and-execute.',
            'Open-ended, unpredictable steps → a bounded agent loop, ideally as one step inside a workflow.',
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'Designing an Agentic Feature, Step by Step' },
        {
          type: 'numbered',
          items: [
            'Write down the task and what a good result looks like, as testable criteria. If you cannot describe "good", no pattern will save you.',
            'Try a single well-prompted call (with retrieval if facts are needed). Measure it on 20–50 real examples. Stop here if it is good enough.',
            'If it is not, find where it fails and split there: add a chain step, a router, or a gate exactly at the failure point.',
            'Decide which steps the model must choose itself. Only those become agent loops, each with its own small tool set and step limit.',
            'Pick a model tier per step: a small fast model for routing and extraction, a large reasoning model for planning and synthesis.',
            'Add budgets (max steps, max tokens, timeout), checkpoints and human approval points for risky actions.',
            'Stream progress events to the UI so long runs feel alive, and trace every step for debugging and evals.',
          ],
        },
        { type: 'heading2', text: 'Orchestrator-Workers in Node.js' },
        {
          type: 'paragraph',
          text: 'Here is a complete orchestrator-workers flow. The orchestrator returns a typed plan, the code validates and caps it, workers run in parallel with Promise.all (each with its own short context and timeout), and a synthesiser merges the results. `llm` is a thin wrapper you write around your provider’s HTTP API.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// research.service.ts — orchestrator-workers with a typed, validated plan
import { z } from 'zod';

const PlanSchema = z.object({
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        question: z.string().max(300),
        tools: z.array(z.enum(['web_search', 'docs_search', 'sql_readonly'])),
      }),
    )
    .min(1)
    .max(5), // hard cap: never fan out to 50 workers by accident
});
type Plan = z.infer<typeof PlanSchema>;
type WorkerResult = { id: string; ok: boolean; summary: string; sources: string[] };

export async function research(task: string, emit: (e: StepEvent) => void): Promise<string> {
  // 1. Orchestrator: large model writes the plan as JSON
  emit({ type: 'planning' });
  const planRes = await llm.chat({
    model: 'large-reasoning',
    messages: [
      { role: 'system', content: 'Split the task into at most 5 independent research subtasks. Reply with JSON matching the schema.' },
      { role: 'user', content: task },
    ],
    responseFormat: 'json',
  });
  const plan: Plan = PlanSchema.parse(JSON.parse(planRes.text)); // throws on a bad plan
  emit({ type: 'plan', steps: plan.subtasks.map((s) => s.question) });

  // 2. Workers: run in parallel, each with an isolated, small context
  const results = await Promise.all(
    plan.subtasks.map((sub) =>
      withTimeout(runWorker(sub, emit), 30_000).catch(
        (err): WorkerResult => ({ id: sub.id, ok: false, summary: String(err), sources: [] }),
      ),
    ),
  );

  // 3. Synthesiser: only short worker summaries go in, not raw tool output
  emit({ type: 'synthesising' });
  const final = await llm.chat({
    model: 'large-reasoning',
    messages: [
      { role: 'system', content: 'Write a concise answer. Cite sources as [n]. Say which subtasks failed.' },
      { role: 'user', content: JSON.stringify({ task, results }) },
    ],
  });
  emit({ type: 'done' });
  return final.text;
}

async function runWorker(sub: Plan['subtasks'][number], emit: (e: StepEvent) => void): Promise<WorkerResult> {
  emit({ type: 'tool', stepId: sub.id, label: 'Researching: ' + sub.question });
  // a small bounded agent loop (see How AI Agents & MCP Work), max 4 steps, only its allowed tools
  const out = await runAgent(sub.question, toolsFor(sub.tools), { model: 'small-fast', maxSteps: 4 });
  return { id: sub.id, ok: true, summary: out.summary.slice(0, 2_000), sources: out.sources };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Notice the failure handling: one failed worker becomes a result with ok: false instead of rejecting the whole Promise.all. The synthesiser is told which parts are missing, so the final answer can say "pricing data was unavailable" rather than silently inventing it.',
        },
        { type: 'heading2', text: 'Streaming Step Events to Angular' },
        {
          type: 'paragraph',
          text: 'A multi-step run can take 20–60 seconds. Instead of a spinner, stream typed step events over Server-Sent Events (SSE — a one-way stream of text events over a normal HTTP response) and render them as a timeline. Signals make the component simple: each event updates a signal and the template re-renders.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// run-timeline.component.ts — Angular standalone component with signals
import { Component, computed, signal, OnDestroy } from '@angular/core';

export type StepEvent =
  | { type: 'planning' }
  | { type: 'plan'; steps: string[] }
  | { type: 'tool'; stepId: string; label: string }
  | { type: 'step_done'; stepId: string; ok: boolean }
  | { type: 'synthesising' }
  | { type: 'done' }
  | { type: 'error'; message: string };

interface TimelineItem { id: string; label: string; status: 'running' | 'done' | 'failed' }

@Component({
  selector: 'app-run-timeline',
  standalone: true,
  template: \`
    <ol class="timeline">
      @for (item of items(); track item.id) {
        <li [class]="item.status">{{ item.label }}</li>
      }
    </ol>
    @if (finished()) { <p class="done">Finished in {{ elapsed() }} s</p> }
  \`,
})
export class RunTimelineComponent implements OnDestroy {
  items = signal<TimelineItem[]>([]);
  finished = signal(false);
  private startedAt = Date.now();
  elapsed = computed(() => (this.finished() ? Math.round((Date.now() - this.startedAt) / 1000) : 0));
  private source?: EventSource;

  start(runId: string) {
    this.startedAt = Date.now();
    this.source = new EventSource('/api/runs/' + runId + '/events');
    this.source.onmessage = (msg) => this.apply(JSON.parse(msg.data) as StepEvent);
  }

  private apply(ev: StepEvent) {
    switch (ev.type) {
      case 'planning':
        return this.add('plan', 'Planning the research...');
      case 'plan':
        return this.finish('plan', true, 'Plan: ' + ev.steps.length + ' subtasks');
      case 'tool':
        return this.add(ev.stepId, ev.label);
      case 'step_done':
        return this.finish(ev.stepId, ev.ok);
      case 'synthesising':
        return this.add('synth', 'Writing the final answer...');
      case 'done':
        this.finish('synth', true);
        this.finished.set(true);
        return this.source?.close();
      case 'error':
        this.add('error', 'Error: ' + ev.message);
        return this.finish('error', false);
    }
  }

  private add(id: string, label: string) {
    this.items.update((list) => [...list, { id, label, status: 'running' }]);
  }

  private finish(id: string, ok: boolean, label?: string) {
    this.items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, label: label ?? i.label, status: ok ? 'done' : 'failed' } : i)),
    );
  }

  ngOnDestroy() {
    this.source?.close();
  }
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Give every run a runId and persist its events. Then the SSE endpoint can replay past events when the user refreshes the page or reconnects, and the same event log doubles as your debugging trace.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Orchestration code: your TypeScript that wires the steps together — the workflow graph, retries, gates and budgets. This is the part you own and test like any backend code.',
            'Models by tier: a small fast model for routing, extraction and simple workers; a large reasoning model for planning, critique and synthesis.',
            'Tools: functions or MCP servers the model can call (search, SQL, file edits, APIs), each with a narrow permission scope.',
            'Context builder: the code that decides exactly what goes into each call — instructions, retrieved docs, trimmed tool results, relevant memory.',
            'Memory stores: the conversation/scratchpad for the current run, plus long-term memory in Postgres or a vector store.',
            'State and checkpoint store: the run record, its plan, completed steps and pending approvals, so a run can resume after a crash or a human decision.',
            'Guards: budgets, validators, policy checks and approval gates.',
            'Event stream and tracing: step events for the UI and spans for observability.',
          ],
        },
        { type: 'heading2', text: 'Context Engineering' },
        {
          type: 'paragraph',
          text: 'Context engineering means deciding, for every single model call, exactly what goes into its limited context window (the maximum amount of text a model can read at once). It is the most important skill in agent design: a model with the right 5,000 tokens beats the same model drowning in 150,000 irrelevant ones. Accuracy drops, cost rises and latency grows as context fills with noise — sometimes called "context rot".',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: the context window is the model’s desk. You can only fit so many papers on it, and the more clutter there is, the more likely it misses the one page that matters. Context engineering is tidying the desk before every task: put out the instructions, the few documents needed, and the latest notes — file everything else in a drawer it can ask for.',
        },
        {
          type: 'flow',
          title: 'Building the context for one step',
          code: `flowchart LR
  SYS["System instructions<br/>role, rules, output format"]:::security --> CB
  TASK["Current goal + plan step"]:::client --> CB
  MEM[("Long-term memory<br/>top 3 relevant facts")]:::db --> CB
  DOCS[("Retrieved docs<br/>top 5 chunks")]:::db --> CB
  TR["Tool results<br/>trimmed or summarised"]:::cache --> CB
  HIST["History<br/>recent turns + summary of older"]:::cache --> CB
  CB{{"Context builder<br/>token budget"}}:::highlight --> LLM["LLM call"]:::external`,
          text: 'Every source competes for the same token budget. The context builder ranks, trims and summarises before each call.',
        },
        {
          type: 'bullets',
          items: [
            'Instructions: stable rules first (and cacheable — most providers offer prompt caching, so an unchanging prefix is cheaper and faster on repeat calls).',
            'Trim tool output: a search tool returning 40 KB of HTML should be cut to the relevant fields before the model sees it. Return ids or file paths for big data and let the model fetch details if needed.',
            'Summarise old steps: once a sub-task is done, replace its 20 tool messages with a 3-line summary of what was learned.',
            'Compaction: when the history nears a threshold (say 70% of the window), ask a model to summarise the conversation so far into a compact state note, then continue from that note.',
            'Just-in-time retrieval: instead of preloading every document "just in case", give the agent search and read tools and let it fetch what it needs at the step it needs it.',
            'Fewer, clearer tools: every tool definition costs tokens on every call and is one more option to confuse the model. Expose only the tools a step needs.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Keep tool results small before they enter the history
function compactToolResult(name: string, raw: unknown, maxChars = 3_000): string {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (text.length <= maxChars) return text;
  const ref = blobStore.put(text); // full result saved outside the context, e.g. object storage
  return JSON.stringify({
    tool: name,
    truncated: true,
    preview: text.slice(0, maxChars),
    fullResultRef: ref, // the model can call read_result(ref, offset) if it really needs more
  });
}`,
        },
        { type: 'heading2', text: 'Memory: Short-Term and Long-Term' },
        {
          type: 'bullets',
          items: [
            'Short-term memory: the message list and a scratchpad (a working-notes field where the agent records its plan and findings) for the current run. It lives in the context and in your run-state store, and disappears when the run ends unless you save it.',
            'Long-term memory: facts worth keeping across sessions — user preferences ("prefers TypeScript examples"), past decisions, resolved issues. Stored as rows in Postgres or as embedded notes in a vector store (see How Embeddings & Vector Databases Work), and loaded selectively by relevance.',
            'What to remember: stable, useful, non-sensitive facts. Not every message. A common approach is a small "memory writer" step at the end of a run that extracts 0–3 candidate facts.',
            'Forgetting: memories go stale ("works at Acme" may no longer be true). Store a timestamp and source, let newer facts overwrite older ones, expire unused memories, and let users view and delete what is stored about them.',
            'Privacy: long-term memory is personal data. Scope it per user and tenant, and never let one user’s memory be retrieved into another user’s context.',
          ],
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Long-term memory in Postgres + pgvector
CREATE TABLE agent_memory (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  fact        text NOT NULL,
  embedding   vector(1024) NOT NULL,      -- dimension depends on your embedding model
  source_run  uuid,
  created_at  timestamptz DEFAULT now(),
  last_used   timestamptz DEFAULT now()
);

-- Load the 3 most relevant memories for this user at the start of a run
SELECT fact
FROM agent_memory
WHERE user_id = $1
ORDER BY embedding <=> $2   -- cosine distance to the embedded current request
LIMIT 3;`,
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'A Support Copilot That Resolves Billing Disputes' },
        {
          type: 'paragraph',
          text: 'A SaaS company wants an assistant that handles "I was charged twice" tickets. A pure agent with 30 tools was tried first: it worked on demos, but in production it sometimes refunded the wrong invoice and cost roughly 10× more per ticket than expected. The redesign combines patterns and keeps the agent small.',
        },
        {
          type: 'numbered',
          items: [
            'Routing: a small fast model classifies the ticket. Only "billing dispute" goes down this path; others go to existing flows.',
            'Prompt chain step: extract customer id, dates and amounts into JSON. A gate validates the JSON and checks the customer exists.',
            'Parallelization (sectioning): three read-only lookups run at once — invoices, payment-provider charges and recent support history.',
            'Bounded agent: a large reasoning model with read-only tools investigates the mismatch, max 6 steps, and must output a proposed action with evidence.',
            'Evaluator: code checks the proposal (refund amount ≤ the duplicate charge, invoice belongs to the customer); an LLM critic checks the explanation is clear.',
            'Human-in-the-loop: any refund above a threshold (for example 100 dollars) pauses for an agent’s approval in the support console; smaller refunds auto-approve.',
            'Execute and reply: the refund tool runs with an idempotency key, the customer gets a drafted reply, and a memory writer stores "customer prefers email follow-up".',
          ],
        },
        {
          type: 'flow',
          title: 'Billing dispute copilot — workflow with one bounded agent',
          code: `flowchart LR
  T([Ticket]):::client --> R{"Router<br/>small model"}:::highlight
  R -->|"other"| OTH[Existing flows]:::external
  R -->|"billing dispute"| X["Extract fields<br/>+ schema gate"]:::server
  X --> P1[(Invoices)]:::db
  X --> P2[Payment provider]:::external
  X --> P3[(Ticket history)]:::db
  P1 --> AG["Investigator agent<br/>read-only, max 6 steps"]:::highlight
  P2 --> AG
  P3 --> AG
  AG --> EV{"Checks<br/>code + critic"}:::security
  EV -->|"fails"| AG
  EV -->|"refund over limit"| HU([Human approval]):::security
  EV -->|"ok"| ACT["Refund tool<br/>idempotency key"]:::server
  HU --> ACT
  ACT --> REP([Reply to customer]):::client`,
          text: 'Only one box is an autonomous agent, and it has read-only tools. Every write goes through checks and, above a limit, a human.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Illustrative results of a redesign like this: cost per ticket drops several-fold because most steps use a small model and the agent’s context is small; wrong-refund incidents go to near zero because the write step is gated; and debugging gets easier because each box is a separate traced span.',
        },
        { type: 'heading2', text: 'Where Things Pause and Resume' },
        {
          type: 'numbered',
          items: [
            'The workflow worker checkpoints the run after every step, so the plan, lookups and investigator findings are already saved.',
            'When a refund needs approval, the worker saves the proposal, sets status = awaiting_approval and emits an approval_needed event to the support console.',
            'The worker process is then freed — nothing sits waiting in memory or holds an HTTP request open.',
            'Minutes or days later, a support agent approves. The Run API records the decision and who made it, then enqueues a "resume run" job.',
            'Any worker picks up the job, loads the checkpoint and continues with the refund step as if it had never stopped.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: a checkpointed run is a board game you can pack away mid-game. You photograph the board (checkpoint), put the box on the shelf (free the worker), and anyone can set it up exactly as it was and keep playing once the missing player (the approver) arrives.',
        },
      ],
    },
    {
      id: 'visual-flow',
      title: 'Visual Flow & Architecture Diagram',
      icon: 'ti-topology-star',
      blocks: [
        {
          type: 'flow',
          title: 'At a glance — an agentic app in production',
          code: `flowchart TB
  UI([Angular UI<br/>run timeline]):::client -->|"POST /runs"| API[Run API]:::server
  API -->|"enqueue"| Q[[Run queue]]:::queue
  Q --> OR["Orchestrator<br/>workflow code + budgets"]:::server
  OR --> RT{"Router<br/>small model"}:::highlight
  OR --> PL["Planner<br/>large model"]:::highlight
  OR --> WK["Workers<br/>parallel, isolated context"]:::server
  WK --> TL[Tools / MCP servers]:::external
  OR --> CB{{Context builder}}:::cache
  CB --> MEM[(Memory<br/>pgvector)]:::db
  OR --> ST[(Run state<br/>checkpoints)]:::db
  OR --> GD{{"Guards<br/>policy + approvals"}}:::security
  OR -->|"step events"| SSE[SSE stream]:::network
  SSE --> UI`,
          text: 'The orchestrator is ordinary backend code. Models are called at specific points; state, guards and events are plain infrastructure.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-agentic-workflow-run',
            title: 'One Orchestrator-Workers Run, End to End',
            subtitle:
              'Tracing a research request from the Angular UI through planning, parallel workers, synthesis and streaming back to the user',
            nodes: [
              {
                id: 'angular-client',
                name: 'Angular Client',
                subtitle: 'Start Run & Subscribe to Events',
                type: 'client',
                icon: 'ti-browser',
                badge: 'Frontend',
                protocol: 'HTTPS + SSE',
                details: [
                  'POST /api/runs with the task, receives a runId immediately',
                  'Opens an EventSource on /api/runs/:id/events and renders a timeline with signals',
                  'Shows approval buttons when the run pauses for a human',
                ],
              },
              {
                id: 'run-api',
                name: 'Run API + Queue',
                subtitle: 'Accept Fast, Work in Background',
                type: 'gateway',
                icon: 'ti-stack-2',
                badge: 'Backend',
                protocol: 'Enqueue job',
                details: [
                  'Authenticates the user and checks per-user rate and cost quotas',
                  'Creates a run record (status = queued) and enqueues a job',
                  'Long runs never hold the HTTP request open',
                ],
              },
              {
                id: 'planner',
                name: 'Orchestrator / Planner',
                subtitle: 'Large Model Writes a Typed Plan',
                type: 'server',
                icon: 'ti-route',
                badge: 'Plan',
                protocol: 'JSON plan',
                details: [
                  'Large reasoning model splits the task into at most 5 subtasks',
                  'Code validates the plan against a schema and caps fan-out',
                  'Plan is checkpointed and streamed to the UI',
                ],
              },
              {
                id: 'workers',
                name: 'Parallel Workers',
                subtitle: 'Small Bounded Agents with Tools',
                type: 'server',
                icon: 'ti-users-group',
                badge: 'Promise.all',
                protocol: 'Tools / MCP',
                details: [
                  'Each worker gets only its subtask, its allowed tools and a step limit (e.g. 4)',
                  'Tool output is trimmed before entering the worker’s context',
                  'Timeouts turn a stuck worker into a failed result, not a stuck run',
                ],
              },
              {
                id: 'state-store',
                name: 'Run State & Memory',
                subtitle: 'Checkpoints, Events, Long-Term Facts',
                type: 'database',
                icon: 'ti-database',
                badge: 'Postgres',
                protocol: 'SQL + pgvector',
                details: [
                  'Every completed step is checkpointed so a crash resumes, not restarts',
                  'Step events are stored for UI replay and debugging traces',
                  'Relevant long-term memories are loaded per user by vector similarity',
                ],
              },
              {
                id: 'synthesiser',
                name: 'Synthesiser + Guards',
                subtitle: 'Merge, Check, Stream Result',
                type: 'security',
                icon: 'ti-shield-check',
                badge: 'Final',
                protocol: 'Budgets enforced',
                details: [
                  'Merges short worker summaries into one cited answer',
                  'Checks citations exist and flags failed subtasks honestly',
                  'Stops the run if step, token or time budgets are exceeded',
                ],
              },
            ],
            connections: [
              {
                from: 'angular-client',
                to: 'run-api',
                label: '1. Start run',
                protocol: 'HTTPS',
                type: 'sync',
              },
              {
                from: 'run-api',
                to: 'planner',
                label: '2. Job picked up',
                protocol: 'Queue',
                type: 'async',
              },
              {
                from: 'planner',
                to: 'workers',
                label: '3. Fan out subtasks',
                protocol: 'Promise.all',
                type: 'async',
              },
              {
                from: 'workers',
                to: 'state-store',
                label: '4. Checkpoint results',
                protocol: 'SQL',
              },
              {
                from: 'workers',
                to: 'synthesiser',
                label: '5. Summaries in',
                protocol: 'JSON',
              },
              {
                from: 'synthesiser',
                to: 'angular-client',
                label: '6. Stream events + answer',
                protocol: 'SSE',
                type: 'async',
              },
            ],
            keyTakeaways: [
              'The plan is data: validate it, cap it and checkpoint it before spending tokens on workers.',
              'Workers get isolated, small contexts and their own budgets; only short summaries flow back up.',
              'State and events live outside the process, so runs survive crashes, pauses for approval and page refreshes.',
            ],
            rawSpec: `Angular  POST /api/runs {task: "Compare 3 vector DBs for our app"}
   │  ← 202 {runId: "run_42"}; open SSE /api/runs/run_42/events
   ▼
Run API  → INSERT runs(status='queued') → enqueue job
   ▼
Planner (large model) → {subtasks: [pgvector, dedicated DB A, dedicated DB B]}
   │  validate schema, cap at 5, checkpoint plan, emit 'plan'
   ▼
Workers (small model, max 4 steps each, 30 s timeout) — in parallel
   │  w1 ok, w2 ok, w3 timeout → {ok:false}
   │  checkpoint each result, emit 'step_done'
   ▼
Synthesiser (large model) → answer with [1][2] citations, notes w3 missing
   │  emit 'done'
   ▼
Budgets: steps 14/30, tokens ~60k/200k, time 38 s/120 s  ✓`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Multi-Agent Systems' },
        {
          type: 'paragraph',
          text: 'A multi-agent system uses several agents, each with its own instructions, tools and context, instead of one agent that does everything. The two common shapes are a supervisor (one lead agent delegates tasks to sub-agents and combines their answers — orchestrator-workers where the workers are themselves agents) and handoffs (an agent passes control and the conversation to a more specialised agent, like a triage agent handing a user to a billing agent).',
        },
        {
          type: 'flow',
          title: 'Supervisor vs. handoff',
          code: `flowchart LR
  subgraph SUP["Supervisor"]
    direction TB
    LEAD["Lead agent"]:::highlight --> SA1["Search sub-agent"]:::server
    LEAD --> SA2["Code sub-agent"]:::server
    LEAD --> SA3["Data sub-agent"]:::server
    SA1 -->|"summary"| LEAD
    SA2 -->|"summary"| LEAD
    SA3 -->|"summary"| LEAD
  end
  subgraph HO["Handoff"]
    direction LR
    TR["Triage agent"]:::highlight -->|"hand off + context"| BA["Billing agent"]:::server
    BA -->|"hand off"| RA["Refund agent"]:::server
  end`,
        },
        {
          type: 'bullets',
          items: [
            'Why sub-agents help: each one starts with a clean, isolated context focused on its subtask, and returns only a short summary. The lead agent’s context stays small even if a sub-agent read 100 pages.',
            'Cost multiplication: every agent re-reads its own growing context each step. A lead plus 5 sub-agents running 8 steps each can easily use 10–15× the tokens of a single agent run (illustrative). Use multi-agent setups for high-value, parallelisable tasks such as deep research, not for simple Q&A.',
            'Coordination problems: sub-agents can duplicate work or contradict each other. Give each a precise brief (goal, output format, boundaries, what not to do) and have the lead reconcile conflicts.',
            'Handoffs must carry state: pass a structured summary (who the user is, what has been tried) rather than dumping the entire transcript into the next agent.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: multi-agent is like a newsroom. The editor (supervisor) assigns stories to reporters (sub-agents) who each go off and research independently, then hand in a short article — not their whole notebook. It is powerful, but a newsroom costs much more than one writer, so you only staff one for big stories.',
        },
        { type: 'heading2', text: 'State, Checkpoints and Resuming' },
        {
          type: 'paragraph',
          text: 'A long agentic run is a long-running process that can fail halfway: a model call times out, a deployment restarts the worker, a human takes a day to approve. Treat the run like a durable job. After every step, write a checkpoint (the plan, completed step results, the compacted context and pending actions) to Postgres or Redis. To resume, load the checkpoint and continue from the next step. Workflow engines with durable execution (Temporal, AWS Step Functions, or a queue plus a step table) do much of this for you — see AI Agent Platform with MCP.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// A checkpointed step runner — each step runs at most once per run, even across restarts
async function runStep<T>(runId: string, stepKey: string, fn: () => Promise<T>): Promise<T> {
  const saved = await db.query('SELECT output FROM run_steps WHERE run_id = $1 AND step_key = $2', [runId, stepKey]);
  if (saved.rowCount) return saved.rows[0].output as T; // already done: replay the saved result

  const output = await fn(); // the LLM or tool call
  await db.query(
    'INSERT INTO run_steps (run_id, step_key, output) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [runId, stepKey, JSON.stringify(output)],
  );
  return output;
}

// usage: const plan = await runStep(runId, 'plan', () => makePlan(task));`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Resuming means some steps may run twice (the crash happened after the tool ran but before the checkpoint). Side-effecting tools — refunds, emails, file writes — must be idempotent, typically by passing an idempotency key derived from runId + stepKey.',
        },
        { type: 'heading2', text: 'Human-in-the-Loop Points' },
        {
          type: 'bullets',
          items: [
            'Before irreversible or expensive actions: payments, deletions, sending external emails, merging code.',
            'After planning: show the plan and let the user edit or approve it before execution — cheap for the user, and it catches misunderstandings early.',
            'On low confidence: when the router or critic is unsure, escalate instead of guessing.',
            'On budget exhaustion: return partial results and ask whether to continue, rather than silently stopping or silently spending more.',
          ],
        },
        { type: 'heading2', text: 'Stopping Conditions and Budgets' },
        {
          type: 'paragraph',
          text: 'Every loop needs more than one way to stop. The model saying "I am done" is the happy path; budgets are the safety net. Set them per run and per sub-agent, and record how close each run got to the limit — a run that regularly uses 95% of its step budget is a sign the task or prompt needs fixing.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `interface Budget { maxSteps: number; maxTokens: number; deadline: number }

class BudgetExceeded extends Error {}

function checkBudget(b: Budget, used: { steps: number; tokens: number }) {
  if (used.steps >= b.maxSteps) throw new BudgetExceeded('step limit');
  if (used.tokens >= b.maxTokens) throw new BudgetExceeded('token limit');
  if (Date.now() > b.deadline) throw new BudgetExceeded('time limit');
}

// e.g. { maxSteps: 30, maxTokens: 200_000, deadline: Date.now() + 120_000 } for a research run`,
        },
        { type: 'heading2', text: 'Failure Modes and How to Detect Them' },
        {
          type: 'bullets',
          items: [
            'Loops: the agent calls the same tool with the same arguments again and again. Detect by hashing (tool name + arguments) and stopping after 2–3 repeats; tell the model "you already tried this, result was X".',
            'Drifting off-task: after many steps the agent pursues a side quest. Re-state the goal at the top of each step’s context, and have a cheap check ask "does this step serve the original goal?".',
            'Compounding errors: a small mistake in step 2 becomes a confident wrong answer by step 8. If each step is 95% reliable, ten chained steps are only about 60% reliable (0.95¹⁰ ≈ 0.6). Add gates early and keep chains short.',
            'Tool misuse: wrong arguments, wrong tool, or a destructive tool used when a read would do. Validate arguments with schemas, return clear errors, and keep tool sets small and clearly described.',
            'Premature "done": the agent declares success without verifying. Require evidence (test results, citations) in the final output and check it in code.',
            'Runaway cost: a single bad run burns thousands of steps. Per-run and per-user budgets plus alerts on cost outliers catch it.',
          ],
        },
        {
          type: 'flow',
          title: 'Guards around every step',
          code: `flowchart TD
  S([Next step]):::client --> B{"Budget left?<br/>steps, tokens, time"}:::security
  B -->|"no"| P(["Stop: partial result<br/>+ ask user"]):::security
  B -->|"yes"| L["LLM decides action"]:::highlight
  L --> R{"Repeat of an<br/>earlier call?"}:::security
  R -->|"yes, 3rd time"| P
  R -->|"no"| V{"Args valid +<br/>action allowed?"}:::security
  V -->|"needs approval"| H([Pause for human]):::client
  V -->|"no"| E["Return error<br/>as observation"]:::cache --> S
  V -->|"yes"| T["Run tool"]:::server --> C["Checkpoint + emit event"]:::db --> S`,
          text: 'Most production reliability comes from these plain-code checks, not from a smarter prompt.',
        },
      ],
    },
    {
      id: 'misconceptions',
      title: 'Common Misconceptions',
      icon: 'ti-alert-triangle',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Myth: "Agentic means fully autonomous." Reality: Most successful agentic apps are workflows with one or two small, bounded agent steps. Autonomy is a dial, not a switch.',
            'Myth: "More agents means better results." Reality: Multi-agent setups multiply cost and coordination problems. They pay off for broad, parallelisable tasks like deep research, and are wasteful for simple ones.',
            'Myth: "A bigger context window means I do not need context engineering." Reality: Models get less accurate and slower as context fills with irrelevant material. Curating context still matters at any window size.',
            'Myth: "The model will stop when it is done." Reality: Models sometimes loop, stop too early or wander. Budgets, repeat detection and verification are mandatory.',
            'Myth: "Memory means saving the whole chat history forever." Reality: Good memory is selective — a few relevant, current facts retrieved when needed, with a way to update and forget them.',
            'Myth: "A critic LLM guarantees quality." Reality: An LLM critic shares many blind spots with the writer. Prefer deterministic checks (tests, schemas) and use LLM critics for what code cannot judge.',
            'Myth: "Frameworks are required to build agents." Reality: The patterns are a few dozen lines of TypeScript. Frameworks can help with durability and tracing, but understand the plain-code version first.',
          ],
        },
      ],
    },
    {
      id: 'system-design-connection',
      title: 'System Design Connection',
      icon: 'ti-sitemap',
      blocks: [
        {
          type: 'paragraph',
          text: '"Design an agentic app" is now a common interview prompt. Strong answers start by placing the problem on the call → workflow → agent spectrum, name the patterns they will combine, and then spend most of the time on the unglamorous parts: context, state, budgets, approvals, failure handling and cost.',
        },
        {
          type: 'bullets',
          items: [
            'How LLMs Work: context windows, tokens and latency explain why context engineering and model tiers matter.',
            'How Prompt Engineering Works: every step in a workflow is a prompt; structured outputs make plans and routes machine-checkable.',
            'How Embeddings & Vector Databases Work and How RAG Works: retrieval is the most common worker tool and the usual home of long-term memory.',
            'How AI Agents & MCP Work: the tool-calling loop each worker or sub-agent runs, and how tools are exposed through MCP servers.',
            'How AI Evals & Observability Work: tracing every step and evaluating each pattern (router accuracy, plan quality, final answer) is how you improve a workflow safely.',
            'How AI Security & Guardrails Work: prompt injection through tool results, least-privilege tools and output checks for every step that acts.',
            'AI Chat Assistant (system design): streaming, conversation storage and rate limits — the base most agentic UIs sit on.',
            'RAG Knowledge Base (system design): the retrieval pipeline your workers call.',
            'AI Agent Platform with MCP (system design): durable runs, tool registries, an MCP gateway, approvals and audit at multi-tenant scale.',
            'How Message Queues Work: long runs are background jobs — queue them, checkpoint them and resume them.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Interview checklist for an agentic design: Where is it on the call → workflow → agent spectrum, and why not simpler? Which patterns are combined? What goes into each step’s context, and how is it trimmed? What is remembered long-term, and how is it forgotten? Where are the checkpoints, and how does a run resume? Which actions need human approval? What are the step, token and time budgets? How do you detect loops and drift? How does progress reach the UI? What does one run cost?',
        },
      ],
    },
  ],
};
