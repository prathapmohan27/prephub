import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 15 — AI Chat Assistant
// ─────────────────────────────────────────────────────────────────────────────
export const aiChatAssistant: SystemDesignSystem = {
  id: 'ai-chat-assistant',
  title: 'AI Chat Assistant',
  icon: 'ti-message-chatbot',
  color: '#d946ef',
  bg: '#fae8ff',
  accentGlow: 'rgba(217,70,239,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'A ChatGPT-style assistant inside a SaaS product — token streaming, context windows, an LLM gateway, token quotas, and cost control.',
  tags: ['LLM', 'Streaming (SSE)', 'Context Window', 'LLM Gateway', 'Token Quotas', 'Cost Control'],
  estimatedTime: '60 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'An AI chat assistant built into a SaaS product — think of a "Ask the assistant" panel inside a project-management or CRM app. A user types a question, and an LLM (large language model: a model that generates text one token at a time) answers, streaming words onto the screen as they are produced. Conversations are saved so users can come back to them, and the assistant can read files the user attaches.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: "In simple terms: your backend is a translator's office. The customer (user) hands over a note, the office adds the right background pages (system prompt, earlier conversation, attached files), sends it to an expensive outside expert (the LLM provider), and relays the expert's answer back word by word as it is spoken. The office keeps a copy of every conversation, counts how many words each customer has used, and makes sure nobody runs up a huge bill.",
        },
        {
          type: 'flow',
          title: 'The big picture — your backend sits between the user and the model',
          code: `flowchart LR
  U([Angular app]):::client -->|"POST message"| API[Chat API<br/>Node.js]:::server
  API -->|"check quota"| Q[(Redis<br/>token counters)]:::cache
  API -->|"load history"| DB[(Postgres<br/>conversations)]:::db
  API -->|"prompt"| GW[LLM Gateway]:::highlight
  GW -->|"HTTPS stream"| P[LLM provider<br/>or self-hosted model]:::external
  P -.->|"tokens"| GW
  GW -.->|"tokens"| API
  API -.->|"SSE stream"| U`,
          text: 'The browser never talks to the model provider directly. Your backend owns the API keys, the conversation history, the quota checks and the cost.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Send a message and receive the answer as a token stream (text appears progressively, not after a 20-second wait).',
            'Stop generation at any time with a "Stop" button.',
            'Create, list, rename and delete conversations; reopen any past conversation with full history.',
            'Multi-turn context: the assistant remembers what was said earlier in the same conversation.',
            'Attach files (PDF, text, images) and ask questions about them.',
            'Per-plan limits: e.g. Free users get a small daily token allowance, Pro users get much more and access to the larger model.',
            "Safety: block clearly harmful input and output; never leak another tenant's data.",
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Time to first token (TTFT — how long until the first word appears) under roughly 1–2 seconds at p95 for the small model.',
            'Availability of 99.9% for the chat feature, even when one model provider is degraded.',
            'Predictable cost: the AI bill must scale with paying usage, not with abuse.',
            'Data privacy: customer data is not used to train models, PII (personally identifiable information like names, emails, phone numbers) is handled carefully, retention is configurable per tenant.',
            'Durability: a finished assistant message must never be lost, even if the user closes the tab mid-stream.',
          ],
        },
        { type: 'heading2', text: 'Back-of-the-Envelope Estimates' },
        {
          type: 'paragraph',
          text: 'All numbers below are illustrative, chosen to make the reasoning easy to follow. Tokens are the unit everything is measured in — a token is a chunk of text, roughly 3–4 characters or about three-quarters of an English word.',
        },
        {
          type: 'bullets',
          items: [
            'Users: 1 million daily active users (DAU), each sending about 10 messages per day → 10 million LLM requests per day.',
            'QPS (queries per second): 10M / 86,400 s ≈ 115 requests/s on average; assume a 4× daytime peak → roughly 500 requests/s.',
            'Concurrent streams: an answer takes about 10 seconds to stream, so at peak ≈ 500 × 10 = 5,000 open streaming connections at once.',
            'Input tokens per request: system prompt (~800) + conversation history (~1,500) + attachment or retrieved context (~700) ≈ 3,000 tokens.',
            'Output tokens per request: ≈ 400 tokens (a few paragraphs).',
            'Tokens per day: input 10M × 3,000 = 30 billion tokens; output 10M × 400 = 4 billion tokens.',
            'Storage: 20M messages/day (user + assistant) × ~2 KB with metadata ≈ 40 GB/day ≈ 15 TB/year before compression. Attachments go to object storage and are counted separately.',
          ],
        },
        { type: 'heading3', text: 'Cost reasoning in tokens' },
        {
          type: 'paragraph',
          text: 'Providers bill per token, and output tokens typically cost several times more than input tokens (often around 3–5×). Large models can cost 10–20× more per token than small ones. So instead of quoting prices, reason in "input-token equivalents": with output at 4× input, one request costs about 3,000 + 400 × 4 = 4,600 input-token units. Notice that input dominates — which is exactly why trimming history, summarizing old turns and prompt caching matter so much.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview move: say out loud "input tokens dominate the bill here, because we resend history on every turn". It shows you understand that LLMs are stateless and every request carries the whole context again.',
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'The AI Concepts You Need' },
        {
          type: 'paragraph',
          text: 'This design leans on a handful of AI ideas. Each is covered in depth in its own Core Concepts lesson; here is just enough to follow the design.',
        },
        {
          type: 'bullets',
          items: [
            'Tokens, context window and statelessness (see "How LLMs Work"): the model reads a list of tokens and predicts the next one. The context window is the maximum number of tokens it can read in one request (input + output). The model remembers nothing between calls — "memory" is just you resending the history.',
            'System prompt and prompt structure (see "How Prompt Engineering Works"): the system prompt is the hidden instruction block that sets the assistant\'s role, tone and rules. Keeping it stable and at the start of the prompt also makes prompt caching work.',
            'Embeddings and vector search (see "How Embeddings & Vector Databases Work"): an embedding turns text into a list of numbers so similar meanings land close together; a vector database finds the nearest ones. We use it for large attachments.',
            'RAG — retrieval-augmented generation (see "How RAG Works"): fetch the relevant chunks of a document and paste them into the prompt, instead of pasting the whole document.',
            'Tools and MCP (see "How AI Agents & MCP Work"): the model can ask your app to run a function (a tool call). MCP, the Model Context Protocol, is an open standard for exposing such tools. A basic chat assistant does not need tools, but it is the natural next step.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: the model is a brilliant consultant with total amnesia and a desk that only fits so many pages. Every time you ask a question you must re-hand them the relevant notes, and if the pile is too big, you have to choose or summarize what goes on the desk.',
        },
        { type: 'heading2', text: 'Streaming: SSE vs WebSockets' },
        {
          type: 'paragraph',
          text: 'Models generate tokens one after another, so the answer can be shown as it is produced. Two transport options exist. SSE (Server-Sent Events) is a one-way stream from server to browser over a normal HTTP response with content type text/event-stream. WebSockets are a two-way persistent connection.',
        },
        {
          type: 'bullets',
          items: [
            'SSE fits the shape of the problem: the user sends one request, the server streams one answer. It is plain HTTP, so it works through load balancers, CDNs, proxies and existing auth middleware.',
            'SSE has a built-in resume idea: each event can carry an id, and a reconnecting client sends the last one in a Last-Event-ID header.',
            'The browser EventSource API only supports GET, so most chat apps use fetch() with a POST body and read the SSE-formatted response body as a stream.',
            'WebSockets are worth it when the server must push things the user did not ask for (collaborative editing, live agent progress across many tabs, voice). They cost more to operate: sticky connections, custom reconnect logic, and no HTTP caching or middleware.',
          ],
        },
        {
          type: 'flow',
          title: 'One request, many small events',
          code: `sequenceDiagram
  participant B as Browser
  participant A as Chat API
  participant M as Model provider
  B->>A: POST /conversations/42/messages
  A->>M: generate, stream on
  A-->>B: event meta, assistant message id 901
  M-->>A: token "Sure"
  A-->>B: event delta id 1 "Sure"
  M-->>A: token ", here"
  A-->>B: event delta id 2 ", here"
  Note over B: text grows on screen
  M-->>A: done, usage 3100 in 410 out
  A-->>B: event done with usage
  A->>A: save final message and tokens`,
          text: 'TTFT is the gap between the POST and the first delta. Everything after that is about keeping the trickle smooth.',
        },
        { type: 'heading2', text: 'Context Window Management' },
        {
          type: 'paragraph',
          text: 'Long conversations eventually exceed the context window, and even before that, resending everything is slow and expensive. Three standard techniques, usually combined:',
        },
        {
          type: 'bullets',
          items: [
            'Sliding window: keep only the most recent N turns (or the most recent turns that fit a token budget).',
            'Summarization: when old turns fall out of the window, replace them with a short running summary generated by a small, cheap model.',
            'Retrieval: for very long histories or big attachments, embed the content and retrieve only the relevant parts (RAG).',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Token counts depend on the model\'s tokenizer. Count with the tokenizer that matches the target model (or the provider\'s count endpoint), and keep a safety margin of around 5–10% — an off-by-a-few-hundred error turns into a hard "context length exceeded" failure.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Core Components' },
        {
          type: 'bullets',
          items: [
            'Angular client: chat UI, renders tokens with signals, holds the Stop button.',
            'API gateway / load balancer: TLS, auth (JWT or session), request size limits. Must not buffer responses, or streaming breaks.',
            'Chat API (Node.js / NestJS): owns conversations and messages, builds the prompt, enforces quotas, writes the SSE response.',
            'Generation workers: run the actual model call, decoupled from the HTTP connection so a closed tab does not kill the answer.',
            'Redis: token-rate counters, stream buffers for resumable streams, cancel flags, short-lived caches.',
            'Postgres: conversations, messages, summaries, usage ledger; pgvector for attachment chunks.',
            'Object storage (S3-compatible): uploaded files.',
            'LLM gateway: one internal service that talks to every model provider — retries, fallback, timeouts, circuit breaking, metrics.',
            'Moderation service: classifies input and output for policy violations.',
            'Observability stack: traces, token metrics and cost dashboards.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  C([Angular client]):::client --> LB[Load balancer<br/>no response buffering]:::network
  LB --> API[Chat API<br/>NestJS]:::server
  API --> MOD[Moderation]:::security
  API --> PG[(Postgres<br/>conversations, messages,<br/>usage, pgvector)]:::db
  API --> R[(Redis<br/>quotas, stream buffers,<br/>cancel flags)]:::cache
  API -->|"enqueue generation"| Q[[Job queue]]:::queue
  Q --> W[Generation workers]:::server
  W --> GW[LLM Gateway]:::highlight
  GW --> P1[Provider A]:::external
  GW --> P2[Provider B]:::external
  GW --> P3[Self-hosted<br/>open-weight model]:::external
  W -->|"append tokens"| R
  R -.->|"tail stream"| API
  C -->|"upload"| OS[(Object storage)]:::db
  W --> PG`,
          text: 'The worker writes tokens into a Redis stream; the API tails that stream and forwards it as SSE. The browser connection and the model call have independent lifetimes.',
        },
        { type: 'heading2', text: 'Message Flow' },
        {
          type: 'numbered',
          items: [
            'The client POSTs the user message with a client-generated id (for idempotency — a retry with the same id does not create a duplicate).',
            "The Chat API authenticates, runs input moderation, and reserves an estimated token amount against the user's quota.",
            'It saves the user message and an empty assistant message with status "streaming".',
            'It builds the prompt: system prompt + summary + recent turns + attachment context, fitted to a token budget.',
            'A generation job is started; the worker calls the LLM gateway and appends each token chunk to a Redis stream keyed by the assistant message id.',
            'The API reads that Redis stream and writes each chunk to the client as an SSE event.',
            'On completion, the worker saves the full text, actual token usage and model name, settles the quota reservation, and marks the message "complete".',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'For a smaller product, the Chat API can call the gateway directly inside the request instead of using a queue + worker. It is simpler; you lose resumable streams and must handle the client disconnecting mid-answer. Start simple, add the worker split when you need resumability.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Conversation Storage (Postgres)' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE conversations (
  id            UUID PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  user_id       UUID NOT NULL,
  title         TEXT,
  summary       TEXT,                 -- running summary of old turns
  summary_upto  BIGINT,               -- last message seq included in summary
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ           -- soft delete, hard-deleted by retention job
);
CREATE INDEX ON conversations (user_id, updated_at DESC);

CREATE TABLE messages (
  id               UUID PRIMARY KEY,  -- client-generated for user messages
  conversation_id  UUID NOT NULL REFERENCES conversations(id),
  seq              BIGINT NOT NULL,   -- order inside the conversation
  role             TEXT NOT NULL,     -- 'user' | 'assistant' | 'system' | 'tool'
  content          TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL,     -- 'streaming' | 'complete' | 'cancelled' | 'failed'
  model            TEXT,              -- which model actually answered
  input_tokens     INT,
  output_tokens    INT,
  token_count      INT,               -- tokens this message adds to future prompts
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, seq)
);

CREATE TABLE usage_ledger (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  user_id       UUID NOT NULL,
  message_id    UUID NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INT NOT NULL,
  cached_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
        },
        {
          type: 'bullets',
          items: [
            'Storing token_count per message means the context builder never re-tokenizes old history.',
            'The usage_ledger is append-only — it is the source of truth for billing and quota reconciliation, while Redis holds the fast-moving counters.',
            'Partition messages by conversation_id hash (or by created_at month) once the table reaches billions of rows; queries are always "one conversation, newest first".',
          ],
        },
        { type: 'heading2', text: 'Building the Context' },
        {
          type: 'paragraph',
          text: 'The context builder fills a token budget from most important to least important: system prompt first, then reserved space for the answer, then the running summary, then the newest turns going backwards until the budget runs out.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `interface ChatTurn { role: 'user' | 'assistant'; content: string; tokenCount: number; seq: number }
interface PromptMessage { role: 'system' | 'user' | 'assistant'; content: string }

export function buildContext(opts: {
  systemPrompt: string;
  summary: string | null;
  history: ChatTurn[];          // oldest -> newest, already excluding summarized turns
  newUserMessage: ChatTurn;
  contextWindow: number;        // e.g. 128_000 for a large model (illustrative)
  maxOutputTokens: number;      // reserve space for the answer
  countTokens: (text: string) => number;
}): { messages: PromptMessage[]; droppedSeqs: number[] } {
  const safety = Math.floor(opts.contextWindow * 0.05);
  let budget = opts.contextWindow - opts.maxOutputTokens - safety;

  const system = opts.summary
    ? opts.systemPrompt + '\\n\\nSummary of earlier conversation:\\n' + opts.summary
    : opts.systemPrompt;
  budget -= opts.countTokens(system) + opts.newUserMessage.tokenCount;

  // Walk backwards from the newest turn, keep what fits
  const kept: ChatTurn[] = [];
  const dropped: number[] = [];
  for (let i = opts.history.length - 1; i >= 0; i--) {
    const turn = opts.history[i];
    if (turn.tokenCount <= budget) {
      kept.unshift(turn);
      budget -= turn.tokenCount;
    } else {
      // everything older than this is dropped too, to keep turns contiguous
      for (let j = i; j >= 0; j--) dropped.push(opts.history[j].seq);
      break;
    }
  }

  return {
    messages: [
      { role: 'system', content: system },
      ...kept.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user', content: opts.newUserMessage.content },
    ],
    droppedSeqs: dropped,   // a background job folds these into the summary
  };
}`,
        },
        {
          type: 'callout',
          variant: 'info',
          text: "In simple terms: it is packing a suitcase with a weight limit. The passport (system prompt) and today's outfit (the new message) go in first, space is reserved for souvenirs (the answer), and then you add yesterday's clothes, then the day before, until it is full. Everything older gets replaced by a one-page packing list (the summary).",
        },
        { type: 'heading2', text: 'Streaming Endpoint (NestJS / Express)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// POST /conversations/:id/messages  -> text/event-stream
app.post('/conversations/:id/messages', auth, async (req, res) => {
  const { clientMessageId, text } = req.body;
  const user = req.user;

  await moderation.assertAllowed(text);                       // throws 400 on violation
  const reservation = await quota.reserve(user, estimateTokens(text)); // throws 429

  const { assistantMessageId } = await chat.startTurn({
    conversationId: req.params.id, clientMessageId, text, user, reservation,
  }); // saves user msg + empty assistant msg, enqueues generation

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',          // tell nginx-style proxies not to buffer
    Connection: 'keep-alive',
  });
  send(res, 'meta', { assistantMessageId });

  // Tail the Redis stream the worker writes to. If the client disconnects,
  // we stop tailing — the worker keeps generating and saves the result.
  const abort = new AbortController();
  req.on('close', () => abort.abort());
  for await (const evt of streamBuffer.tail(assistantMessageId, '0', abort.signal)) {
    send(res, evt.type, evt.data, evt.id);  // delta | done | error
    if (evt.type !== 'delta') break;
  }
  res.end();
});

function send(res: import('http').ServerResponse, event: string, data: unknown, id?: string) {
  if (id) res.write('id: ' + id + '\\n');
  res.write('event: ' + event + '\\n');
  res.write('data: ' + JSON.stringify(data) + '\\n\\n');
}`,
        },
        { type: 'heading2', text: 'Resumable Streams and Stop Generation' },
        {
          type: 'paragraph',
          text: "Because the worker writes every chunk to a Redis stream (an append-only log with ids), any API instance can replay it. If the user's Wi-Fi blips, the client reconnects to GET /messages/901/stream with the last event id it saw, and the server replays from there. After completion the Redis stream expires (for example after 10 minutes) and the client simply loads the finished message from Postgres.",
        },
        {
          type: 'flow',
          title: 'Reconnect mid-answer, then stop',
          code: `sequenceDiagram
  participant B as Browser
  participant A as Chat API
  participant R as Redis stream
  participant W as Worker
  W->>R: append chunks 1 to 40
  A-->>B: chunks 1 to 25
  Note over B: network drops at chunk 25
  B->>A: GET stream, Last-Event-ID 25
  A->>R: read from 26
  R-->>A: chunks 26 to 40 and live tail
  A-->>B: chunks 26 onwards
  B->>A: POST cancel
  A->>R: set cancel flag for msg 901
  W->>R: sees flag, aborts provider call
  W->>W: save partial text, status cancelled`,
          text: 'Stop must reach the worker, not just close the browser connection — otherwise you keep paying for tokens nobody will read.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Generation worker: stream from the gateway, honour cancel, save once at the end
export async function generate(job: { messageId: string; prompt: PromptMessage[]; model: string }) {
  const abort = new AbortController();
  const stopWatcher = cancelFlags.onCancel(job.messageId, () => abort.abort());
  let text = '';
  let usage = { inputTokens: 0, outputTokens: 0, cachedTokens: 0 };
  let status: 'complete' | 'cancelled' | 'failed' = 'complete';

  try {
    for await (const chunk of llm.stream({ model: job.model, messages: job.prompt, signal: abort.signal })) {
      if (chunk.type === 'text') {
        text += chunk.text;
        await streamBuffer.append(job.messageId, { type: 'delta', data: chunk.text });
      } else if (chunk.type === 'usage') {
        usage = chunk.usage;
      }
    }
  } catch (err) {
    status = abort.signal.aborted ? 'cancelled' : 'failed';
  } finally {
    stopWatcher.dispose();
    await messages.finish(job.messageId, { text, status, usage, model: job.model });
    await quota.settle(job.messageId, usage);           // release unused reservation
    await streamBuffer.append(job.messageId, { type: status === 'complete' ? 'done' : status, data: usage });
  }
}`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'When a stream is cancelled, some providers do not report final usage. Estimate output tokens by counting the text you received, and bill on that — never skip the ledger write just because the usage event is missing.',
        },
        { type: 'heading2', text: 'The LLM Gateway' },
        {
          type: 'paragraph',
          text: 'Every product team calling providers directly leads to scattered API keys, inconsistent retries and no cost visibility. An LLM gateway is one internal service (or library) with a single provider-neutral interface. It maps a logical model name ("chat-small", "chat-large") to concrete providers, and handles retries, timeouts, fallback and metrics in one place.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `export interface LlmProvider {
  name: string;
  stream(req: { model: string; messages: PromptMessage[]; maxTokens: number; signal: AbortSignal }):
    AsyncIterable<{ type: 'text'; text: string } | { type: 'usage'; usage: Usage }>;
}

const ROUTES: Record<string, { provider: LlmProvider; model: string }[]> = {
  // logical name -> ordered list of (provider, concrete model); first is primary
  'chat-small': [{ provider: providerA, model: 'a-small' }, { provider: providerB, model: 'b-small' }],
  'chat-large': [{ provider: providerA, model: 'a-large' }, { provider: providerB, model: 'b-large' }],
};

export async function* streamWithFallback(logical: string, messages: PromptMessage[], signal: AbortSignal) {
  for (const route of ROUTES[logical]) {
    if (breakers.isOpen(route.provider.name)) continue;      // skip a provider known to be failing
    let sentAnyToken = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ttftTimer = AbortSignal.any([signal, AbortSignal.timeout(10_000)]);
      try {
        for await (const chunk of route.provider.stream({ model: route.model, messages, maxTokens: 1024, signal: ttftTimer })) {
          sentAnyToken = true;
          yield chunk;
        }
        breakers.recordSuccess(route.provider.name);
        return;
      } catch (err) {
        if (signal.aborted) throw err;                       // user pressed Stop
        breakers.recordFailure(route.provider.name);
        if (sentAnyToken) throw err;                         // never retry after tokens reached the user
        if (!isRetryable(err)) break;                        // 400s: do not retry, try next provider
        await sleep(250 * 2 ** attempt + Math.random() * 100); // backoff with jitter on 429 / 5xx
      }
    }
  }
  throw new Error('All model providers unavailable');
}`,
        },
        {
          type: 'bullets',
          items: [
            'Timeouts: use a TTFT timeout (no first token within ~10 s → give up) plus an idle timeout between chunks, rather than one total timeout — long answers legitimately take a minute.',
            'Retries only before the first token. Once text has reached the user, retrying would duplicate or contradict it; surface an error with a "Regenerate" button instead.',
            'Circuit breaker: after, say, 50% errors over 30 seconds, mark the provider open (skip it) for a cool-down, then let a few trial requests through (half-open).',
            'Fallback models behave differently. Keep prompts portable, and test the fallback path regularly so it is not first exercised during an outage.',
            'The real code above should also reset the TTFT timer once streaming starts; it is simplified for readability.',
          ],
        },
        {
          type: 'flow',
          title: 'Inside the gateway — retry, then fall back',
          code: `flowchart TD
  IN([Request for chat-large]):::client --> B1{Provider A<br/>breaker open?}
  B1 -->|"No"| A[Call provider A]:::external
  B1 -->|"Yes"| B2
  A -->|"tokens flowing"| OUT([Stream to user]):::highlight
  A -->|"429 or 5xx<br/>before first token"| R{Retries left?}
  R -->|"Yes, backoff"| A
  R -->|"No"| B2{Provider B<br/>breaker open?}
  B2 -->|"No"| B[Call provider B<br/>fallback model]:::external
  B --> OUT
  B2 -->|"Yes"| ERR([Friendly error<br/>try again soon]):::security
  A -->|"error after<br/>tokens sent"| ERR`,
          text: 'The single most important rule: retries and fallbacks are only safe before anything has been streamed to the user.',
        },
        { type: 'heading2', text: 'Moderation and Safety' },
        {
          type: 'bullets',
          items: [
            'Input: run a fast moderation classifier (a provider moderation endpoint or a small self-hosted classifier) before calling the main model. Reject clear violations with a helpful message.',
            'Output: you cannot "unsend" streamed text. Common approach: moderate in small buffered windows (e.g. every sentence or ~200 characters) and, if a violation is found, stop the stream and replace the message with a notice.',
            'Prompt injection (text that tries to override your instructions, often hidden inside an attached file): treat attachment content as data, wrap it in clear delimiters, and never give the model permissions the user does not have.',
            "Tenant isolation: the prompt for user X must only ever contain user X's tenant data. Enforce it in the data-access layer, not in the prompt.",
          ],
        },
        { type: 'heading2', text: 'File Attachments' },
        {
          type: 'numbered',
          items: [
            'Client asks for a pre-signed upload URL and uploads directly to object storage (the API never proxies large files).',
            'A worker virus-scans the file and extracts text (PDF parsing, OCR for scans). Images are kept as images for multimodal models (models that can read images as well as text).',
            'Small files (under a few thousand tokens) are pasted into the prompt directly.',
            'Large files are split into chunks, embedded, and stored in pgvector; each question retrieves the top few relevant chunks (RAG).',
            'The message stores attachment ids, not file contents, so history stays small.',
          ],
        },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE attachment_chunks (
  id             BIGSERIAL PRIMARY KEY,
  attachment_id  UUID NOT NULL,
  tenant_id      UUID NOT NULL,
  chunk_index    INT  NOT NULL,
  content        TEXT NOT NULL,
  embedding      vector(1024)        -- dimension depends on the embedding model
);
CREATE INDEX ON attachment_chunks USING hnsw (embedding vector_cosine_ops);

-- Top 5 chunks for this question, only from the files attached to this conversation
SELECT content
FROM attachment_chunks
WHERE tenant_id = $1 AND attachment_id = ANY($2)
ORDER BY embedding <=> $3          -- cosine distance to the question embedding
LIMIT 5;`,
        },
        { type: 'heading2', text: 'Angular Frontend: Streaming UI with Signals' },
        {
          type: 'code',
          lang: 'typescript',
          code: `interface UiMessage { id: string; role: 'user' | 'assistant'; text: string; status: 'pending' | 'streaming' | 'complete' | 'cancelled' | 'failed' }

@Injectable({ providedIn: 'root' })
export class ChatStore {
  readonly messages = signal<UiMessage[]>([]);
  readonly isStreaming = computed(() => this.messages().some((m) => m.status === 'streaming'));
  private abort?: AbortController;
  private assistantId?: string;

  async send(conversationId: string, text: string) {
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: 'user', text, status: 'pending' };
    const draft: UiMessage = { id: 'draft', role: 'assistant', text: '', status: 'streaming' };
    this.messages.update((list) => [...list, userMsg, draft]); // optimistic: show instantly

    this.abort = new AbortController();
    try {
      const res = await fetch('/api/conversations/' + conversationId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientMessageId: userMsg.id, text }),
        signal: this.abort.signal,
      });
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
      this.patch(userMsg.id, { status: 'complete' });

      for await (const evt of readSse(res.body)) {
        if (evt.event === 'meta') this.assistantId = evt.data.assistantMessageId;
        if (evt.event === 'delta') this.patch('draft', { text: this.find('draft').text + evt.data });
        if (evt.event === 'done') this.patch('draft', { status: 'complete' });
        if (evt.event === 'error') this.patch('draft', { status: 'failed' });
      }
    } catch {
      const cancelled = this.abort.signal.aborted;
      this.patch('draft', { status: cancelled ? 'cancelled' : 'failed' });
      if (!cancelled) this.patch(userMsg.id, { status: 'failed' }); // show a retry icon
    }
  }

  stop() {
    if (this.assistantId) {
      // tell the server to stop the worker; closing the fetch alone is not enough
      fetch('/api/messages/' + this.assistantId + '/cancel', { method: 'POST' });
    }
    this.abort?.abort();
  }

  private find(id: string) { return this.messages().find((m) => m.id === id)!; }
  private patch(id: string, change: Partial<UiMessage>) {
    this.messages.update((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));
  }
}`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Minimal SSE parser for a fetch() body (EventSource cannot POST)
export async function* readSse(body: ReadableStream<Uint8Array>) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let sep: number;
    while ((sep = buffer.indexOf('\\n\\n')) >= 0) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      let data = '';
      for (const line of raw.split('\\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      yield { event, data: JSON.parse(data) };
    }
  }
}`,
        },
        {
          type: 'bullets',
          items: [
            'Template: show the Stop button with @if (store.isStreaming()), and render assistant text with a Markdown pipe that tolerates half-finished Markdown (an unclosed code block mid-stream).',
            'Performance: tokens can arrive 50+ times per second. Signals only re-render the changed message, but for very fast streams batch updates per animation frame (requestAnimationFrame) to keep scrolling smooth.',
            'Auto-scroll only if the user is already at the bottom — never yank them down while they are reading earlier text.',
            'The HttpClient can stream with observe: "events" and reportProgress, but plain fetch with a ReadableStream is simpler and works the same in all modern browsers.',
          ],
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Holding Thousands of Open Streams' },
        {
          type: 'paragraph',
          text: 'The Chat API mostly waits — a streaming request is an open socket with an occasional small write. Node.js handles this well: one instance can hold thousands of idle streams. At our illustrative peak of ~5,000 concurrent streams, a handful of instances is enough for connections; the real limit is elsewhere.',
        },
        {
          type: 'bullets',
          items: [
            'Load balancers and proxies need long idle timeouts (several minutes) and response buffering turned off.',
            'Send an SSE comment line (": ping") every ~15 s so idle proxies do not cut the connection while a reasoning model thinks.',
            'Scale API instances on open connections and CPU; scale workers on queue depth.',
            'Postgres write load is modest (~230 message writes/s on average) because the worker writes the assistant message once at the end, not per token.',
          ],
        },
        { type: 'heading2', text: 'The Real Bottleneck: Provider Capacity' },
        {
          type: 'paragraph',
          text: 'Model inference runs on GPUs, and GPU capacity is finite and shared. Providers enforce limits in requests per minute and tokens per minute (TPM) per account and per region. At 30B input tokens/day (~350K tokens/s on average, more at peak) you will hit those limits before you hit any limit of your own servers.',
        },
        {
          type: 'bullets',
          items: [
            'Request higher TPM limits early, and consider reserved or provisioned throughput (capacity you pay for in advance) for the baseline, with on-demand capacity for spikes.',
            'Spread traffic across multiple providers and regions through the gateway.',
            'Self-hosting an open-weight model (e.g. a Llama-family model on your own GPUs) gives control over capacity, but GPUs are expensive to keep idle — usually only worth it at high, steady volume or for strict data residency.',
            'Shed load gracefully: when near the limit, route Free-tier traffic to the small model first, and queue or reject Free traffic before Pro traffic.',
          ],
        },
        {
          type: 'flow',
          title: 'Token-based rate limiting and plan quotas',
          code: `flowchart TD
  REQ([New message]):::client --> EST[Estimate tokens<br/>prompt plus max output]:::server
  EST --> U{User per-minute<br/>token bucket OK?}:::security
  U -->|"No"| R429([429 slow down<br/>Retry-After]):::highlight
  U -->|"Yes"| PLAN{Plan quota left<br/>today or this month?}:::security
  PLAN -->|"No"| UP([Quota reached,<br/>upgrade prompt]):::highlight
  PLAN -->|"Yes"| ORG{Global provider<br/>TPM budget OK?}:::security
  ORG -->|"No"| SHED[Downgrade to small model<br/>or queue]:::queue
  ORG -->|"Yes"| RES[Reserve tokens in Redis]:::cache
  SHED --> RES
  RES --> GEN[Generate]:::external
  GEN --> SET[Settle: actual usage<br/>to ledger, release rest]:::db`,
          text: 'Limit by tokens, not requests: one request with a 100-page PDF can cost as much as a thousand "hi" messages.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Reserve-then-settle: protects against many parallel requests overspending a quota
export async function reserve(user: User, estimatedTokens: number): Promise<Reservation> {
  const plan = PLANS[user.plan];               // e.g. { dailyTokens: 50_000, perMinuteTokens: 10_000 }
  const dayKey = 'quota:' + user.id + ':' + todayUtc();
  // Lua script: atomically check and add, like the Rate Limiter lesson
  const ok = await redis.eval(RESERVE_LUA, [dayKey], [estimatedTokens, plan.dailyTokens, 86_400]);
  if (!ok) throw new HttpException('Daily AI quota reached', 429);
  return { key: dayKey, reserved: estimatedTokens };
}

export async function settle(r: Reservation, actualTokens: number) {
  await redis.incrby(r.key, actualTokens - r.reserved); // give back what was not used
}`,
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Failure Modes and Responses' },
        {
          type: 'bullets',
          items: [
            'Provider returns 429 / 5xx before streaming → retry with backoff, then fall back to another provider (gateway).',
            'Provider stalls mid-stream → idle timeout fires; save partial text with status "failed" and offer "Regenerate". Do not silently restart.',
            'Browser disconnects → worker keeps going and saves the result; client resumes from Last-Event-ID or loads the finished message.',
            'Worker crashes mid-generation → the job queue redelivers after a visibility timeout; the worker sees the message is still "streaming" with a stale heartbeat, clears the Redis buffer, and regenerates from scratch (the client shows a "restarted" notice).',
            'Redis loses the stream buffer → resumption fails gracefully; the client falls back to polling the message from Postgres until it is complete.',
            'Duplicate POST (user double-clicks, client retries) → the unique client message id makes the second insert a no-op that returns the existing assistant message id.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: the model call is a phone call to an outside expert that might drop. Before they start talking you can redial or call a different expert. Once they have started answering and you have been repeating their words to the customer, you cannot quietly switch experts mid-sentence — you have to say "sorry, the line dropped, shall I ask again?".',
        },
        { type: 'heading2', text: 'Multi-Region' },
        {
          type: 'bullets',
          items: [
            'Run the Chat API and workers in each region close to users; Postgres per region for tenants with data-residency needs (EU data stays in EU).',
            "Model endpoints are regional too. A region's provider capacity can be exhausted while another region has room — the gateway can route across regions only if the tenant's data-residency rules allow it.",
            'Network latency to the provider is small compared to model latency (hundreds of milliseconds to seconds), so co-locating with the provider matters less than having capacity there.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'What Users Actually Feel' },
        {
          type: 'bullets',
          items: [
            'TTFT (time to first token): dominated by prompt length and model size. Shorter prompts and smaller models start faster.',
            'Tokens per second: how fast text flows once it starts. Roughly, users read at a few tokens per second, so anything well above that feels instant.',
            'Total latency: TTFT + output tokens ÷ tokens per second. Capping max output tokens bounds the worst case.',
          ],
        },
        { type: 'heading2', text: 'Cost and Latency Levers' },
        {
          type: 'bullets',
          items: [
            'Model routing: a cheap classifier (or simple rules: message length, attachments, plan) sends easy questions to a small fast model and hard ones to a large reasoning model. If, for example, 70% of traffic goes to a small model that is ~15× cheaper, the blended cost drops by more than half.',
            'Prompt caching: providers can cache the processed form of a repeated prompt prefix (system prompt, attached document, earlier turns) and charge much less for those cached input tokens while also cutting TTFT. Keep the prefix byte-for-byte stable: no timestamps or user names at the top of the system prompt. Caching works on prefixes, so put stable content first and changing content last.',
            'Response caching: only safe for non-personal, deterministic-enough requests — e.g. "suggested starter questions" or FAQ answers keyed by a normalized question. Never cache answers that include user or tenant data across users.',
            'Context trimming: summarizing old turns can cut input tokens per request by half on long conversations.',
            'Do the cheap work in parallel: run input moderation, quota checks and history loading concurrently before the model call.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Generate the conversation title with the small model after the first answer completes, asynchronously. It is a classic place where teams accidentally use the expensive model for a 5-word output.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'SSE vs WebSockets' },
        {
          type: 'bullets',
          items: [
            'SSE: request-response shaped, plain HTTP, easy auth and proxies, built-in resume via event ids. One direction only — which is all a chat answer needs.',
            'WebSockets: bi-directional, good for live collaboration or voice. More operational overhead (sticky routing, reconnect logic, custom heartbeats).',
            'Recommendation: SSE over fetch for chat; add WebSockets only for genuinely bidirectional features.',
          ],
        },
        { type: 'heading2', text: 'Direct Streaming vs Worker + Stream Buffer' },
        {
          type: 'bullets',
          items: [
            'Direct (API calls the model inside the request): fewer moving parts, lower latency by a few milliseconds. A tab close or deploy kills the answer.',
            'Worker + Redis buffer: resumable, survives disconnects and API deploys, enables "continue on another device". Adds a queue, a buffer and more failure modes.',
          ],
        },
        { type: 'heading2', text: 'Hosted API vs Self-Hosted Model' },
        {
          type: 'bullets',
          items: [
            "Hosted provider: best quality models, no GPU operations, pay per token. Capacity and data handling depend on the provider's terms.",
            'Self-hosted open-weight model: full control of data and capacity, predictable cost at high steady volume. You own GPU scheduling, upgrades and quality evaluation.',
            'Many teams use hosted models for chat quality and a small self-hosted model for cheap tasks like moderation, routing and summarization.',
          ],
        },
        { type: 'heading2', text: 'Summaries vs Full History' },
        {
          type: 'bullets',
          items: [
            'Full history: most faithful, simplest, but cost grows with every turn and eventually overflows.',
            'Summaries: bounded cost, but details can be lost ("what was the exact number I gave you earlier?"). Mitigate by keeping recent turns verbatim and retrieving old turns by similarity when needed.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Observability' },
        {
          type: 'bullets',
          items: [
            'One trace per message (e.g. OpenTelemetry) with spans for: auth, moderation, quota, context build, gateway, provider TTFT, streaming, save. Tag spans with model, provider, prompt version and token counts.',
            'Metrics: TTFT p50/p95, tokens per second, input/output/cached tokens per model, error and fallback rate per provider, circuit-breaker state, cancel rate.',
            "Cost dashboards: tokens and cost per tenant, per plan, per feature — and an alert when a single user's usage spikes far above normal.",
            'Quality signals: thumbs up/down, regenerate rate, and offline evaluation sets that run whenever the system prompt or model changes.',
            'Log prompts and responses only with PII redaction and short retention, and access-controlled — they contain customer data.',
          ],
        },
        { type: 'heading2', text: 'Data Privacy' },
        {
          type: 'bullets',
          items: [
            'Use provider plans and contract terms where customer inputs and outputs are not used for model training, and prefer zero- or short-retention options where offered.',
            'Redact or mask PII before it reaches logs and analytics; consider redacting before the model for highly sensitive fields when the answer does not need them.',
            "Per-tenant retention: a retention job hard-deletes conversations, messages, attachment chunks and stream buffers older than the tenant's setting; user deletion requests cascade the same way (GDPR right to erasure).",
            'Encrypt at rest and in transit; keep provider API keys in a secrets manager, only accessible to the gateway.',
            'Document which subprocessors (model providers) see which data, and in which region.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Version your system prompts like code. Store the prompt version on each assistant message so that when quality changes you can tell whether it was the prompt, the model, or the routing that moved.',
        },
        { type: 'heading2', text: 'Rollouts' },
        {
          type: 'bullets',
          items: [
            'Roll out new models or prompts behind feature flags to a small percentage of traffic, compare quality and cost metrics, then expand.',
            'Pin concrete model versions in the gateway config rather than "latest" aliases, so behaviour does not change under you.',
            'Keep a kill switch per feature that downgrades to the small model or disables attachments during an incident.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Running It in 45 Minutes' },
        {
          type: 'numbered',
          items: [
            '0–5 min — Clarify: who are the users, is it inside an existing product, attachments, multi-tenant, which plans, data-residency needs.',
            '5–10 min — Estimate: DAU, requests/s, concurrent streams, tokens/day, and say that input tokens dominate cost.',
            '10–20 min — High-level design: client, Chat API with SSE, Postgres, Redis, LLM gateway, providers. Walk one message end to end.',
            '20–35 min — Deep dives the interviewer picks: streaming and stop, context window management, gateway failover, token quotas.',
            '35–42 min — Scale and cost: provider TPM limits as the real bottleneck, model routing, prompt caching, multi-region.',
            '42–45 min — Wrap up: safety, privacy, observability, and what you would build next (tools via MCP, RAG over tenant docs).',
          ],
        },
        {
          type: 'flow',
          title: 'A strong answer, step by step',
          code: `flowchart LR
  A[Clarify<br/>users, plans, files]:::client --> B[Estimate<br/>QPS and tokens]:::network
  B --> C[Streaming path<br/>SSE plus worker]:::server
  C --> D[Context builder<br/>window and summary]:::highlight
  D --> E[LLM gateway<br/>fallback and breaker]:::external
  E --> F[Token quotas<br/>and cost levers]:::cache
  F --> G[Safety, privacy,<br/>observability]:::security`,
        },
        { type: 'heading2', text: 'Likely Follow-Up Questions' },
        {
          type: 'bullets',
          items: [
            'Why SSE and not WebSockets? — The interaction is one request, one streamed answer. SSE is plain HTTP, works with existing auth and proxies, and supports resume with event ids.',
            'The user closes the tab mid-answer — what happens? — Generation runs in a worker writing to a Redis stream; it finishes and saves. Reopening the conversation shows the complete answer.',
            'How does Stop actually save money? — The cancel request sets a flag the worker watches; the worker aborts the provider call, so output token billing stops. Just closing the browser connection would not.',
            'The conversation is longer than the context window. — Sliding window over recent turns within a token budget, plus a running summary of older turns built asynchronously by a small model; retrieve old turns by similarity if exact recall is needed.',
            "The primary provider is down. — Circuit breaker opens, gateway falls back to a second provider's comparable model. Retries and fallback happen only before the first token is streamed.",
            'How do you stop one user from burning the budget? — Token-based limits: a per-minute token bucket plus daily/monthly plan quotas, with reserve-then-settle in Redis and a ledger in Postgres.',
            'How do you cut cost by half? — Route easy traffic to a small model, enable prompt caching with a stable prefix, trim history with summaries, cap max output tokens.',
            'How do you keep customer data safe? — No-training contract terms, tenant isolation in the data layer, PII redaction in logs, per-tenant retention and deletion, regional processing for residency.',
            'Can you cache responses? — Only for non-personal, shared prompts (starter suggestions, FAQ). Personal conversations are not cached across users; prompt caching is the safe, big win.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The insight that separates strong answers: an LLM is a slow, expensive, rate-limited, stateless external dependency. Almost every design decision — streaming, the gateway, token quotas, context management, caching — follows from treating it that way.',
        },
      ],
    },
  ],
};
