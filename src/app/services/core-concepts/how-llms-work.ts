import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 16 — How LLMs Work
// ─────────────────────────────────────────────────────────────────────────────
export const howLlmsWork: CoreConcept = {
  id: 'how-llms-work',
  title: 'How LLMs Work',
  emoji: '🧠',
  icon: 'ti-brain',
  color: '#7c3aed',
  bg: '#ede9fe',
  accentGlow: 'rgba(124,58,237,0.15)',
  difficulty: 'Foundational',
  tagline:
    'Tokens, context windows, sampling, streaming and cost — what really happens between your prompt and the model’s answer, explained for full-stack developers.',
  tags: [
    'LLM',
    'Tokens',
    'Context Window',
    'Sampling',
    'Streaming',
    'Latency & Cost',
    'Model Selection',
  ],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'A large language model (LLM) is a neural network — a huge mathematical function with billions of adjustable numbers called parameters (or weights) — that has been trained to do one thing: given some text, predict what piece of text most likely comes next. That "piece" is a token, a chunk of text that is usually a word, part of a word or a punctuation mark. Everything an LLM does — answering questions, writing code, summarising documents, calling tools — is built on top of that single ability, repeated over and over.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: an LLM is your phone’s keyboard autocomplete, scaled up enormously. Your keyboard has seen a little of your typing and suggests the next word. An LLM has "read" a large slice of the public internet, books and code, so its next-word guesses are good enough to continue an essay, finish a function or answer a question. It writes one word-piece at a time, then reads what it just wrote and guesses the next one.',
        },
        {
          type: 'flow',
          title: 'The big picture — generate one token, append, repeat',
          code: `flowchart LR
  P([Prompt text]):::client --> T[Tokenizer<br/>text to token ids]:::server
  T --> M[Transformer model<br/>billions of weights]:::highlight
  M --> D[Probabilities for<br/>every possible next token]:::cache
  D --> S{Sampler picks<br/>one token}:::queue
  S -->|"append and loop"| M
  S -->|"stop token or max tokens"| O([Answer text]):::client`,
          text: 'The model never writes a whole sentence at once. It produces one token, adds it to the input, and runs again — this loop is called autoregressive generation.',
        },
        { type: 'heading2', text: 'Next-Token Prediction' },
        {
          type: 'paragraph',
          text: 'Give a model the text "The capital of France is" and it outputs a probability for every token in its vocabulary (its fixed list of known tokens, typically tens of thousands to a few hundred thousand entries). " Paris" might get 92%, " a" 3%, " located" 2%, and so on. A sampler picks one, the token is appended, and the model runs again on "The capital of France is Paris" to predict the next token. A 300-token answer means roughly 300 runs of the model.',
        },
        {
          type: 'paragraph',
          text: 'Surprisingly, when you train this simple objective on enough text with a big enough model, the model has to learn grammar, facts, reasoning patterns and coding conventions — because all of those help it predict the next token better. That is why one model can translate, summarise and write SQL without being explicitly programmed for any of them.',
        },
        { type: 'heading2', text: 'Key Vocabulary' },
        {
          type: 'bullets',
          items: [
            'Token: the unit of text a model reads and writes. Roughly ¾ of an English word on average.',
            'Prompt: everything you send to the model — instructions, conversation history, documents — measured in input tokens.',
            'Completion / response: what the model generates back, measured in output tokens.',
            'Context window: the maximum number of tokens (input + output together) the model can handle in one request.',
            'Inference: running a trained model to get an answer. This is what happens every time your app calls an LLM API.',
            'Parameters / weights: the learned numbers inside the model. More parameters usually means more capable but slower and more expensive to run.',
          ],
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
          text: 'Many tasks are easy for humans but nearly impossible to write as rules: "summarise this support ticket", "extract the invoice total from this email", "turn this question into a database filter", "explain this stack trace". Before LLMs, each of these needed a custom machine-learning model trained on thousands of labelled examples. Now a single general-purpose model, called through an HTTP API, can handle all of them from a plain-English instruction.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: before LLMs, adding "smart" features was like hiring a specialist for every single job. An LLM is like hiring one very well-read generalist who can do a decent job at almost anything you can describe in words — as long as you describe it clearly and check their work.',
        },
        { type: 'heading2', text: 'Why a Full-Stack Developer Must Understand the Internals' },
        {
          type: 'paragraph',
          text: 'You do not need to know the maths to build with LLMs, but you do need a working mental model. Almost every production problem with AI features — a surprise bill, a slow chat UI, a truncated answer, a confident wrong answer — traces back to one of the concepts in this lesson.',
        },
        {
          type: 'bullets',
          items: [
            'Cost: you pay per token, in and out. Sending a 50-page document with every request, or letting answers ramble, multiplies your bill.',
            'Latency: output is generated token by token, so a long answer takes seconds. Without streaming, users stare at a spinner.',
            'Limits: the context window caps how much history and data you can send. Long chats eventually have to be trimmed or summarised.',
            'Reliability: models sample from probabilities, so the same prompt can give different answers — and they can state false things fluently (hallucinate).',
            'Freshness: a model only knows what was in its training data up to its knowledge cutoff, unless you give it fresh data in the prompt.',
          ],
        },
        { type: 'heading2', text: 'Good Fits and Poor Fits' },
        {
          type: 'bullets',
          items: [
            'Good fit: summarising, classifying, extracting structured data from messy text, drafting, translating, explaining code, conversational interfaces, turning natural language into API calls.',
            'Poor fit: exact arithmetic over large data, anything that must be 100% correct without verification, real-time facts the model was not given, and simple rules a regular `if` statement handles faster and for free.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'An LLM call is a slow, metered, non-deterministic network dependency. Treat it like a third-party payment API, not like a local function: set timeouts, handle failures, validate the output, log usage and put a budget on it.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Step 1: Tokenization — Text Becomes Numbers' },
        {
          type: 'paragraph',
          text: 'Neural networks work on numbers, not letters. A tokenizer splits text into tokens and maps each to an integer id. Most modern LLMs use a variant of byte-pair encoding (BPE): starting from single bytes, the tokenizer was built by repeatedly merging the most frequent neighbouring pairs in a large training corpus. Common words like " the" or " function" become a single token; rare words are split into several pieces, like "tokenization" → "token" + "ization".',
        },
        {
          type: 'flow',
          title: 'Tokenization — the same idea, different token counts',
          code: `flowchart LR
  A["Hello world"]:::client --> TA["Hello | world<br/>2 tokens"]:::highlight
  B["unbelievably"]:::client --> TB["un | believ | ably<br/>about 3 tokens"]:::cache
  C["const x = arr.map"]:::client --> TC["const | x | = | arr | . | map<br/>about 6 tokens"]:::server
  D["Non-English text<br/>same meaning"]:::client --> TD["Many more pieces<br/>often 1.5 to 3x tokens"]:::security`,
          text: 'Illustrative splits — the exact boundaries depend on each model’s tokenizer. Different providers tokenize the same text differently.',
        },
        {
          type: 'bullets',
          items: [
            'Rule of thumb: in English, 1 token ≈ 4 characters ≈ ¾ of a word. So 1,000 tokens is roughly 750 words, and a 10-page document is very roughly 5,000 tokens.',
            'Code costs more: symbols, indentation, camelCase identifiers and unusual names break into many small tokens. A line of code often uses noticeably more tokens than a line of prose of the same length.',
            'Non-English costs more: tokenizers are trained mostly on English text, so languages with other scripts (Hindi, Tamil, Japanese, Arabic and others) are often split into many more tokens for the same meaning — more cost and less effective context.',
            'JSON and whitespace count: every brace, quote and repeated key in a JSON payload is a token. Pretty-printed JSON with long key names is surprisingly expensive.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Tokenization explains some famous LLM quirks. A model sees "strawberry" as maybe two or three tokens, not ten letters, which is why letter-counting and character-level tasks are oddly hard for it.',
        },
        { type: 'heading2', text: 'Step 2: Embeddings — Tokens Become Meaning' },
        {
          type: 'paragraph',
          text: 'Each token id is looked up in a table and turned into an embedding: a long list of numbers (a vector, often thousands of numbers long) that represents its meaning. Tokens with similar meanings end up with similar vectors. The same idea, applied to whole sentences or documents by a separate "embedding model", is what powers semantic search — covered in Embeddings & Vector Databases.',
        },
        { type: 'heading2', text: 'Step 3: The Transformer and Attention' },
        {
          type: 'paragraph',
          text: 'Almost every modern LLM is a transformer — an architecture introduced by Google researchers in 2017. A transformer is a stack of identical layers (dozens to over a hundred). Each layer refines every token’s vector by mixing in information from other tokens, using a mechanism called attention. LLMs are "decoder-only" transformers: each token may only look at the tokens before it, never ahead, which is exactly what you need to predict the next one.',
        },
        {
          type: 'paragraph',
          text: 'Attention lets each token ask "which earlier tokens matter for understanding me?" In "The trophy did not fit in the suitcase because it was too big", attention helps the model link "it" to "trophy". Each token produces a query (what I am looking for), a key (what I contain) and a value (what I will share); matching queries against keys gives weights for how much of each value to blend in. Many attention "heads" run in parallel, each learning to track a different kind of relationship — grammar, references, code brackets and so on.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: attention is like reading with a highlighter. For every word you read, you glance back over the sentence and highlight the words that help explain it. Each layer of the transformer does another, more refined pass of highlighting, until the final layer has enough understanding to guess the next word.',
        },
        { type: 'heading2', text: 'Training vs. Fine-Tuning vs. Inference' },
        {
          type: 'flow',
          title: 'From raw text to the API you call',
          code: `flowchart LR
  D[(Huge text and code corpus<br/>trillions of tokens)]:::db --> PT[Pre-training<br/>predict next token<br/>weeks on thousands of GPUs]:::highlight
  PT --> BM[Base model<br/>continues text]:::server
  BM --> POST[Post-training<br/>instruction tuning and<br/>human preference tuning]:::security
  POST --> CM[Chat model<br/>follows instructions]:::server
  CM -.->|"optional"| FT[Your fine-tuning<br/>small labelled dataset]:::cache
  CM --> INF[Inference API<br/>your app calls it]:::network
  FT --> INF`,
          text: 'Providers do the first two stages at enormous cost. Your application almost always lives in the last box: inference.',
        },
        {
          type: 'bullets',
          items: [
            'Pre-training: the model learns next-token prediction on a massive corpus. This costs millions of dollars of compute and produces a "base model" that continues text but does not reliably follow instructions.',
            'Post-training: the provider teaches the base model to act as a helpful assistant, using curated example conversations (supervised fine-tuning) and feedback on which answers people prefer (reinforcement learning from human feedback, RLHF, and similar techniques). This is also where safety behaviour and tool use are trained in.',
            'Fine-tuning (by you): optionally further training a model on your own examples — for a consistent output format, tone or niche domain. Usually done with parameter-efficient methods such as LoRA (training a small add-on instead of all weights). It teaches style and behaviour well, but it is a poor way to teach facts that change; use retrieval for that.',
            'Inference: running the finished model to answer a request. The weights are frozen — nothing your users type changes the model. "Memory" in a chat app is just the app re-sending earlier messages.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Order of tools to reach for: first a better prompt (Prompt Engineering), then giving the model the right data at request time (RAG), and only then fine-tuning. Most product teams never need to fine-tune.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'The Life of One Chat Request' },
        {
          type: 'numbered',
          items: [
            'The user types "Why is my Angular signal not updating?" and the Angular app POSTs it to your backend, never directly to the provider (the API key must stay on the server).',
            'Your backend builds the message list: a system message with instructions, the recent conversation history and the new user message.',
            'It counts or estimates the tokens, trims old history if needed so the input plus the reserved output fits in the context window, and checks the user’s budget.',
            'It calls the LLM provider with the model name, messages and sampling settings (temperature, max output tokens, stop sequences) and asks for a streamed response.',
            'The provider tokenizes the input and runs one big parallel pass over all input tokens (the "prefill") to build its internal state.',
            'The first output token is sampled and sent back — this moment is the time to first token (TTFT).',
            'The decode loop runs: each new token is sampled, appended and streamed, typically tens to a couple of hundred tokens per second.',
            'Generation stops when the model emits an end-of-turn token, hits a stop sequence, or reaches max output tokens (in which case the answer is cut off).',
            'The provider reports usage (input and output token counts). Your backend logs it, records cost per user and closes the stream to the browser.',
          ],
        },
        { type: 'heading2', text: 'Chat Message Roles' },
        {
          type: 'paragraph',
          text: 'Chat APIs take a list of messages, each with a role. The model was post-trained to treat each role differently. Under the hood the whole list is flattened into one token sequence with special separator tokens — the model is still just predicting what comes after "assistant:".',
        },
        {
          type: 'bullets',
          items: [
            'system (sometimes "developer" or a separate system field): your app’s instructions — persona, rules, output format. Users do not see it, and the model gives it higher priority.',
            'user: what the human typed, plus any documents you attach on their behalf.',
            'assistant: the model’s previous replies. You send these back so the model "remembers" the conversation.',
            'tool (or a tool-result block): the result of a function the model asked your app to run — covered in AI Agents & MCP.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// The model is stateless: every request carries the whole conversation it needs.
type Role = 'system' | 'user' | 'assistant';
interface ChatMessage {
  role: Role;
  content: string;
}

const messages: ChatMessage[] = [
  {
    role: 'system',
    content:
      'You are PrepHub Tutor. Answer Angular and Node.js questions concisely. ' +
      'If you are not sure, say so. Use TypeScript in code samples.',
  },
  { role: 'user', content: 'What is a signal in Angular?' },
  { role: 'assistant', content: 'A signal is a reactive value wrapper...' },
  { role: 'user', content: 'Why is my signal not updating the template?' }, // new turn
];`,
        },
        { type: 'heading2', text: 'Sampling: How the Next Token Is Chosen' },
        {
          type: 'paragraph',
          text: 'The model outputs probabilities; the sampler decides which token to actually use. Sampling settings are the main "knobs" you control per request.',
        },
        {
          type: 'bullets',
          items: [
            'Temperature (commonly 0 to 1, some APIs allow up to 2): how adventurous the choice is. Near 0, the model almost always picks the most likely token — focused, repeatable, good for extraction, classification and code. Around 0.7–1, answers are more varied — better for brainstorming and creative writing. High values produce rambling or nonsense.',
            'Top-p (nucleus sampling): only consider the smallest set of tokens whose probabilities add up to p (for example 0.9), then sample among them. It cuts off the long tail of weird options. Usually tune temperature or top-p, not both. Some APIs also offer top-k (consider only the k most likely tokens).',
            'Max output tokens: a hard cap on the length of the reply. It protects your bill and latency, but if it is too low the answer is cut off mid-sentence — check the "finish reason" the API returns (stopped naturally vs. hit the length limit).',
            'Stop sequences: strings that end generation immediately when produced, such as "\\n\\nUser:" or "</answer>". Useful for structured output.',
            'Determinism: even at temperature 0, outputs are not guaranteed identical across calls — floating-point maths on GPUs and requests being batched with other users’ requests introduce tiny differences, and providers update models. Some APIs offer a seed parameter for "mostly" reproducible results. Never rely on byte-identical output; cache responses yourself if you need repeatability.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: temperature is like asking a friend to recommend a restaurant. At temperature 0 they always name their single favourite. At a higher temperature they sometimes pick their third or fourth favourite to keep things interesting. Top-p is the rule "only suggest places you would actually rate as good".',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Some newer reasoning models fix or ignore sampling parameters like temperature and instead expose a "reasoning effort" setting. Always check what your chosen model supports rather than copying settings between providers.',
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
            'Tokenizer: converts text to token ids and back. Each model family has its own, so token counts differ between providers.',
            'Embedding layer: turns each token id into a vector the network can work with.',
            'Transformer layers: the stack of attention + feed-forward blocks where the "thinking" happens. This is where nearly all the parameters live.',
            'Output head: turns the final vector into a score for every token in the vocabulary.',
            'Sampler: applies temperature, top-p, stop sequences and max tokens to pick each output token.',
            'KV cache: memory on the GPU that stores the attention keys and values of tokens already processed, so each new token does not recompute the whole prompt.',
            'Inference server and API gateway: the provider’s (or your own) serving layer — batching requests from many users onto GPUs, rate limiting, billing and streaming responses.',
          ],
        },
        { type: 'heading2', text: 'The Context Window: One Shared Budget' },
        {
          type: 'paragraph',
          text: 'The context window is the maximum number of tokens the model can attend to in one request — and it is shared between the input you send and the output it generates. In 2026, windows range from tens of thousands of tokens on small models to several hundred thousand or even over a million on large ones. If a model has a 128K-token window and you send 125K tokens of input, it has at most 3K tokens left to answer, and many APIs also cap output separately (for example 8K–64K tokens).',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Illustrative budget for one request against a 128K-token window
const CONTEXT_WINDOW = 128_000;

const budget = {
  systemPrompt: 1_500, // instructions, format rules
  toolDefinitions: 2_000, // JSON schemas for any tools the model may call
  retrievedDocs: 6_000, // RAG chunks
  chatHistory: 8_000, // recent turns
  userMessage: 500,
  reservedOutput: 2_000, // must be reserved up front
};

const used = Object.values(budget).reduce((a, b) => a + b, 0); // 20,000
console.log('headroom', CONTEXT_WINDOW - used); // 108,000 tokens unused`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'A bigger window is not free accuracy. Every input token is billed on every request, latency grows with input size, and models tend to pay less attention to information buried in the middle of a very long prompt ("lost in the middle"). Send the most relevant 5K tokens, not the whole 500K-token knowledge base.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: the context window is the model’s desk. Everything it needs — instructions, the conversation, reference documents, and the space to write its answer — must fit on the desk at once. Anything that does not fit is simply not there; the model cannot go and look it up unless you give it a tool to do so.',
        },
        { type: 'heading2', text: 'Input vs. Output Tokens' },
        {
          type: 'paragraph',
          text: 'Providers bill input and output tokens separately, and output tokens typically cost several times more (often around 3–5×) per token than input. The reason is how the GPU does the work. Input tokens are all known up front, so they are processed together in one highly parallel prefill pass. Output tokens must be produced one at a time, each requiring another trip through the entire model — that sequential decode step is what keeps expensive GPUs busy.',
        },
        {
          type: 'bullets',
          items: [
            'Input-heavy tasks (summarise a long document into 3 bullets) are relatively cheap and fast per token.',
            'Output-heavy tasks (write a 2,000-word article, generate a full file of code) are slower and more expensive.',
            'Reasoning models generate hidden "thinking" tokens before the visible answer. These are billed as output tokens and add latency, even though the user may never see them.',
            'Prompt caching: many providers discount input tokens that repeat an earlier request’s prefix (for example a long, unchanging system prompt). Put stable content first and variable content last to benefit.',
          ],
        },
        { type: 'heading2', text: 'Model Tiers and Choosing a Model' },
        {
          type: 'paragraph',
          text: 'Providers such as OpenAI, Anthropic and Google, plus open-weight model families such as Llama, Mistral and Qwen that you can host yourself, each offer a ladder of models. Names change every few months, but the tiers are stable:',
        },
        {
          type: 'bullets',
          items: [
            'Small, fast models: cheapest and lowest latency. Great for classification, routing, extraction, autocomplete and high-volume background jobs.',
            'Mid-tier general models: the default for most chat assistants and coding help — a good balance of quality, speed and price.',
            'Large and reasoning models: best at multi-step reasoning, hard coding tasks and agent workflows, but slower (seconds to minutes) and many times more expensive per request.',
            'Self-hosted open-weight models: you pay for GPUs instead of tokens, keep data in your own infrastructure and can fine-tune freely — at the cost of operating the serving stack yourself.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Choose with an evaluation, not a leaderboard. Collect 30–100 real examples of your task, run them through two or three candidate models, and compare quality, latency and cost per request. Start with the smallest model that passes, and route only the hard requests to a bigger one.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'A Streaming "Ask the Tutor" Feature' },
        {
          type: 'paragraph',
          text: 'PrepHub adds an "Ask the Tutor" box under each lesson. A typical answer is 300–600 output tokens. At an illustrative 60 tokens per second, a 480-token answer takes about 8 seconds to finish. Waiting 8 seconds for a blank box feels broken; seeing the first words after ~0.5 seconds and watching the answer type itself out feels fast. That is why almost every chat UI streams.',
        },
        {
          type: 'flow',
          title: 'Streaming tokens from the provider to the browser',
          code: `sequenceDiagram
  participant B as Angular app
  participant API as Node API
  participant L as LLM provider
  B->>API: POST /api/chat/stream with messages
  API->>API: auth, rate limit, trim history, check budget
  API->>L: chat request with stream true
  Note over L: prefill all input tokens
  L-->>API: token "Signals"
  API-->>B: data delta Signals
  Note over B: first words visible after about 0.5 s
  L-->>API: token " update"
  API-->>B: data delta update
  L-->>API: more tokens at roughly 60 per second
  API-->>B: forward each delta
  L-->>API: finish reason and usage counts
  API->>API: log tokens and cost per user
  API-->>B: event done`,
          text: 'The backend is a thin, secure relay: it keeps the API key private, enforces limits and records usage, while forwarding each token as soon as it arrives.',
        },
        { type: 'heading2', text: 'Backend: Node.js / Express SSE Endpoint' },
        {
          type: 'paragraph',
          text: 'Server-Sent Events (SSE) is a simple HTTP format for one-way streaming: the server keeps the response open with Content-Type text/event-stream and writes lines like "data: ...", each event ending with a blank line. The `llm` object below is a thin wrapper you own — one small adapter per provider that normalises their streaming format into simple chunks.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// llm-client.ts — your own provider-neutral wrapper (one adapter per provider)
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface Usage {
  inputTokens: number;
  outputTokens: number;
}
export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; finishReason: 'stop' | 'length'; usage: Usage };

export interface LlmClient {
  stream(req: {
    model: string;
    messages: ChatMessage[];
    maxOutputTokens: number;
    temperature?: number;
    signal?: AbortSignal;
  }): AsyncIterable<StreamChunk>;
}`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// chat.routes.ts — Express route that relays tokens as SSE
import express from 'express';
import { llm } from './llm';
import { fitToBudget, recordUsage } from './token-budget';

export const chatRouter = express.Router();

chatRouter.post('/api/chat/stream', async (req, res) => {
  const userId = req.user.id; // set by your auth middleware
  const messages = fitToBudget(SYSTEM_PROMPT, req.body.history, req.body.question);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // send headers now so the browser starts reading

  // If the user closes the tab or presses Stop, stop paying for tokens.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  const send = (event: string, data: unknown) =>
    res.write('event: ' + event + '\\ndata: ' + JSON.stringify(data) + '\\n\\n');

  try {
    for await (const chunk of llm.stream({
      model: 'mid-tier-chat', // read from config, not hard-coded
      messages,
      maxOutputTokens: 800,
      temperature: 0.3,
      signal: abort.signal,
    })) {
      if (chunk.type === 'text') send('delta', { text: chunk.text });
      if (chunk.type === 'done') {
        await recordUsage(userId, chunk.usage);
        send('done', { finishReason: chunk.finishReason, usage: chunk.usage });
      }
    }
  } catch (err) {
    if (!abort.signal.aborted) send('error', { message: 'The tutor is unavailable, please retry.' });
  } finally {
    res.end();
  }
});`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Proxies and load balancers often buffer responses, which silently turns your stream into one big chunk at the end. Disable buffering for this route (for example the X-Accel-Buffering: no header for nginx), avoid response compression middleware on it, and raise idle timeouts — a long answer can keep the connection open for a minute or more.',
        },
        { type: 'heading2', text: 'Frontend: Angular Service with Signals' },
        {
          type: 'paragraph',
          text: 'The browser’s built-in EventSource only supports GET requests, and we need to POST the conversation. The simplest approach is fetch with a streaming response body, parsing SSE events and appending each delta to a signal. (Angular’s HttpClient can also report partial text with observe: "events" and reportProgress, but the fetch reader is easier to follow.)',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// chat-stream.service.ts
import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatStreamService {
  readonly answer = signal('');
  readonly streaming = signal(false);
  readonly error = signal<string | null>(null);
  private abort?: AbortController;

  async ask(history: ChatMessage[], question: string): Promise<void> {
    this.abort?.abort(); // cancel any previous answer
    this.abort = new AbortController();
    this.answer.set('');
    this.error.set(null);
    this.streaming.set(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, question }),
        signal: this.abort.signal,
      });
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const events = buffer.split('\\n\\n'); // SSE events end with a blank line
        buffer = events.pop() ?? ''; // keep the incomplete tail for next time
        for (const raw of events) this.handle(raw);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') this.error.set('Could not reach the tutor.');
    } finally {
      this.streaming.set(false);
    }
  }

  stop(): void {
    this.abort?.abort(); // server sees the closed connection and stops generating
  }

  private handle(raw: string): void {
    const event = /^event: (.*)$/m.exec(raw)?.[1];
    const data = /^data: (.*)$/m.exec(raw)?.[1];
    if (!data) return;
    const payload = JSON.parse(data);
    if (event === 'delta') this.answer.update((text) => text + payload.text);
    if (event === 'error') this.error.set(payload.message);
  }
}`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// tutor-box.component.ts — renders the answer as it grows
import { Component, inject, signal } from '@angular/core';
import { ChatStreamService } from './chat-stream.service';

@Component({
  selector: 'app-tutor-box',
  standalone: true,
  template:
    '<textarea [value]="question()" (input)="question.set($any($event.target).value)"></textarea>' +
    '@if (chat.streaming()) { <button (click)="chat.stop()">Stop</button> }' +
    '@else { <button (click)="send()">Ask</button> }' +
    '<p class="answer" aria-live="polite">{{ chat.answer() }}</p>' +
    '@if (chat.error(); as err) { <p class="error">{{ err }}</p> }',
})
export class TutorBoxComponent {
  readonly chat = inject(ChatStreamService);
  readonly question = signal('');

  send(): void {
    void this.chat.ask([], this.question());
  }
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Updating a signal 60 times a second is fine for plain text. If you render the answer as Markdown, re-parsing the whole string on every token gets slow for long answers — throttle rendering to every 50–100 ms or parse only the completed paragraphs.',
        },
        { type: 'heading2', text: 'Counting Tokens and Budgeting Cost' },
        {
          type: 'paragraph',
          text: 'The exact token count comes back in the API’s usage field after each call — always log it. Before a call, you can use the provider’s tokenizer library or token-counting endpoint for an exact number, or the 4-characters rule for a quick estimate that is good enough for trimming history and enforcing budgets.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// token-budget.ts
import type { ChatMessage, Usage } from './llm-client';

// Rough estimate: ~4 characters per token for English. Pad it for code / other languages.
export function estimateTokens(text: string, safety = 1.2): number {
  return Math.ceil((text.length / 4) * safety);
}

// Prices change often — load them from config per model, never hard-code.
interface ModelPricing {
  inputPerMillion: number; // USD per 1M input tokens
  outputPerMillion: number; // USD per 1M output tokens
}

export function costUsd(usage: Usage, p: ModelPricing): number {
  return (
    (usage.inputTokens / 1_000_000) * p.inputPerMillion +
    (usage.outputTokens / 1_000_000) * p.outputPerMillion
  );
}

// Keep the system prompt and the new question; drop the OLDEST turns until it fits.
export function fitToBudget(
  system: string,
  history: ChatMessage[],
  question: string,
  maxInputTokens = 12_000,
): ChatMessage[] {
  const fixed = estimateTokens(system) + estimateTokens(question);
  const kept: ChatMessage[] = [];
  let used = fixed;
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estimateTokens(history[i].content);
    if (used + t > maxInputTokens) break;
    kept.unshift(history[i]);
    used += t;
  }
  return [
    { role: 'system', content: system },
    ...kept,
    { role: 'user', content: question },
  ];
}`,
        },
        {
          type: 'paragraph',
          text: 'A quick back-of-the-envelope estimate, with illustrative numbers: 10,000 daily users × 10 questions × (2,000 input + 400 output tokens) = 200M input + 40M output tokens per day. With an illustrative price of $1 per million input and $5 per million output tokens, that is $200 + $200 = about $400 per day, or roughly $12,000 per month. Notice that output is only one-sixth of the tokens but half the bill — and that trimming history from 2,000 to 1,000 input tokens saves about $100 a day.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Put guard rails on spend from day one: a max output tokens cap on every call, a per-user daily token quota, rate limits on the chat endpoint, and an alert on daily cost. A single bug that loops an LLM call can burn a month’s budget overnight.',
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
          title: 'At a glance — one LLM request through a full-stack app',
          code: `flowchart TB
  U([Angular app]):::client -->|"1. POST question"| API[Node API<br/>auth + rate limit]:::server
  API -->|"2. load history"| DB[(Postgres<br/>conversations)]:::db
  API -->|"3. trim to token budget"| BUD[Token budgeter]:::cache
  BUD -->|"4. stream request"| GW[LLM provider<br/>or self-hosted model]:::external
  GW -->|"5. tokens via SSE"| API
  API -->|"6. forward deltas"| U
  API -->|"7. save answer + usage"| DB
  API -.->|"cost metrics"| MON[Monitoring and<br/>spend alerts]:::security`,
          text: 'Your backend owns the key, the budget and the logs. The provider only ever sees one stateless request at a time.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-llm-request-lifecycle',
            title: 'Lifecycle of One Streamed LLM Request',
            subtitle:
              'Following a tutor question from the Angular UI, through tokenization, prefill and decode, back to the screen token by token',
            nodes: [
              {
                id: 'angular-client',
                name: 'Angular Client',
                subtitle: 'Send Question, Render Stream',
                type: 'client',
                icon: 'ti-browser',
                badge: 'Frontend',
                protocol: 'fetch + ReadableStream',
                details: [
                  'POSTs the question and recent history to /api/chat/stream',
                  'Appends each delta event to an answer signal so the text grows on screen',
                  'Stop button aborts the fetch, which closes the connection',
                ],
              },
              {
                id: 'node-api',
                name: 'Node API Relay',
                subtitle: 'Auth, Budget, Prompt Assembly',
                type: 'server',
                icon: 'ti-server',
                badge: 'Backend',
                protocol: 'Express + SSE',
                details: [
                  'Authenticates the user and applies rate limits and daily token quotas',
                  'Builds system + history + user messages and trims to about 12K input tokens',
                  'Holds the provider API key — it never reaches the browser',
                ],
              },
              {
                id: 'tokenizer',
                name: 'Tokenizer',
                subtitle: 'Text to Token IDs',
                type: 'network',
                icon: 'ti-binary',
                badge: 'Provider',
                protocol: 'BPE',
                details: [
                  'Splits roughly 8,000 characters of input into about 2,000 tokens',
                  'Code and non-English text produce more tokens for the same length',
                ],
              },
              {
                id: 'prefill',
                name: 'Prefill Pass',
                subtitle: 'Process All Input Tokens in Parallel',
                type: 'gateway',
                icon: 'ti-cpu',
                badge: 'GPU',
                protocol: 'Transformer layers',
                details: [
                  'Runs every input token through every layer at once, building the KV cache',
                  'Its duration is most of the time to first token, and it grows with prompt length',
                ],
              },
              {
                id: 'decode-loop',
                name: 'Decode Loop + Sampler',
                subtitle: 'One Token at a Time',
                type: 'cache',
                icon: 'ti-arrows-exchange',
                badge: 'Generation',
                protocol: 'temperature 0.3, max 800',
                details: [
                  'Each step reuses the KV cache, predicts probabilities and samples one token',
                  'Runs at an illustrative 30–150 tokens per second until a stop condition',
                  'Every token is streamed out immediately as it is chosen',
                ],
              },
              {
                id: 'usage-log',
                name: 'Usage & Cost Log',
                subtitle: 'Record Tokens Per User',
                type: 'database',
                icon: 'ti-database',
                badge: 'Observability',
                protocol: 'usage: input, output',
                details: [
                  'Stores input and output token counts, model, latency and finish reason',
                  'Feeds per-user quotas, cost dashboards and spend alerts',
                ],
              },
            ],
            connections: [
              {
                from: 'angular-client',
                to: 'node-api',
                label: '1. POST question',
                protocol: 'HTTPS',
                type: 'sync',
              },
              {
                from: 'node-api',
                to: 'tokenizer',
                label: '2. Stream request',
                protocol: 'HTTPS',
                type: 'sync',
              },
              {
                from: 'tokenizer',
                to: 'prefill',
                label: '3. Token ids',
                protocol: 'In-process',
              },
              {
                from: 'prefill',
                to: 'decode-loop',
                label: '4. KV cache ready → first token',
                protocol: 'GPU memory',
              },
              {
                from: 'decode-loop',
                to: 'angular-client',
                label: '5. Tokens streamed via API',
                protocol: 'SSE',
                type: 'async',
              },
              {
                from: 'node-api',
                to: 'usage-log',
                label: '6. Record usage',
                protocol: 'SQL',
                type: 'async',
              },
            ],
            keyTakeaways: [
              'Latency has two parts: time to first token (dominated by prefill, grows with input size) and tokens per second (the decode loop, determines how long the full answer takes).',
              'Streaming does not make generation faster — it makes the wait feel short by showing the first words in under a second.',
              'Your backend is where cost control lives: trimming input, capping output, quotas and logging the usage returned by every call.',
            ],
            rawSpec: `Angular  ──POST {history, question}──▶  Node API
                                          │ auth, rate-limit, quota check
                                          │ messages = [system, ...trimmedHistory, user]
                                          ▼
                                 LLM provider (stream: true)
                                          │ tokenize: ~8,000 chars → ~2,000 tokens
                                          │ prefill: all 2,000 tokens in parallel  (~0.3–1 s)
                                          │ decode: token 1, token 2, ... token 480 (~60 tok/s)
                                          ▼
Angular  ◀──event: delta {text}── ... ──  Node API  ◀── text chunks
Angular  ◀──event: done {usage}─────────  Node API  ──▶ usage log
                                                         input 2,000 / output 480
                                                         cost = in × price_in + out × price_out`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Prefill, Decode and the KV Cache' },
        {
          type: 'paragraph',
          text: 'An LLM request has two phases with very different performance. Prefill processes the whole prompt at once; GPUs are excellent at this kind of parallel work, so even thousands of input tokens take well under a second or two. Decode generates the output one token at a time; each step depends on the previous one, so it cannot be parallelised within a request. To avoid recomputing the entire prompt for every new token, the server keeps the attention keys and values of all previous tokens in GPU memory — the KV cache. Long contexts make the KV cache large, which is one reason long prompts cost more and reduce how many users a GPU can serve at once.',
        },
        {
          type: 'flow',
          title: 'Where the time goes in one request',
          code: `sequenceDiagram
  participant App as Your backend
  participant GPU as Inference server
  App->>GPU: 2,000 input tokens
  Note over GPU: Prefill - all 2,000 tokens in parallel
  GPU-->>App: token 1
  Note over App,GPU: Time to first token - about 0.3 to 1 s
  loop Decode - one step per output token
    GPU-->>App: next token using the KV cache
  end
  Note over App,GPU: 480 tokens at about 60 per second - about 8 s
  GPU-->>App: finish reason and usage`,
          text: 'Illustrative timings. Total latency ≈ time to first token + output tokens ÷ tokens per second.',
        },
        { type: 'heading2', text: 'Measuring Latency' },
        {
          type: 'bullets',
          items: [
            'Time to first token (TTFT): from sending the request to receiving the first output token. It covers network, queueing at the provider and prefill. Typical values range from a few hundred milliseconds to a few seconds; reasoning models that "think" first can take much longer.',
            'Output speed (tokens per second): how fast the decode loop runs once started — roughly 30 to a few hundred tokens per second depending on model size and provider. Smaller models are faster.',
            'Total time ≈ TTFT + (output tokens ÷ tokens per second). Cutting output length is the most effective latency fix: 200 tokens at 50 tok/s is 4 s, 1,000 tokens is 20 s.',
            'Track p50 and p95 for both metrics. Provider latency varies with load, so set timeouts per phase: a short timeout on first token, a longer one on the whole stream.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: prefill is a chef reading the whole recipe in one glance; decode is the chef plating the dish one spoon at a time. Reading a longer recipe takes only a little longer, but every extra spoonful on the plate adds the same amount of time. That is why short answers are fast and cheap, and long answers are slow and expensive.',
        },
        { type: 'heading2', text: 'Hallucinations' },
        {
          type: 'paragraph',
          text: 'A hallucination is fluent, confident output that is false — an invented API method, a fake citation, a wrong date. It happens because the model is trained to produce plausible text, not to check facts. When it lacks the right knowledge, the most "plausible" continuation can still be wrong, and nothing in the sampling loop verifies truth. Post-training has made models better at saying "I don’t know", but no model is hallucination-free.',
        },
        {
          type: 'bullets',
          items: [
            'Ground the answer: put the relevant source text in the prompt and instruct the model to answer only from it (this is RAG).',
            'Ask for citations or quotes from the provided sources, then verify them in code.',
            'Use tools for facts and maths: let the model call your API or a calculator instead of guessing (AI Agents & MCP).',
            'Validate structured output against a schema (for example with Zod) and retry or fall back when it fails.',
            'Lower the temperature for factual tasks, and design the UI so users can check sources.',
          ],
        },
        { type: 'heading2', text: 'Knowledge Cutoff' },
        {
          type: 'paragraph',
          text: 'A model’s knowledge is frozen at its training data cutoff — typically several months to a year before its release. It does not know about your latest framework version, yesterday’s news or anything in your private database. It also does not know today’s date unless you tell it. If your app depends on current or private information, you must supply it in the prompt — through retrieval, tool calls or simply including the date and user context in the system message.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Models often suggest deprecated APIs for fast-moving libraries because older patterns dominate their training data. For framework questions, retrieve the current docs into the prompt instead of trusting the model’s memory.',
        },
        { type: 'heading2', text: 'How Providers Serve Millions of Users' },
        {
          type: 'paragraph',
          text: 'One GPU can only hold so many KV caches, so inference servers use continuous batching: they mix decode steps from many users’ requests on the same GPU and slot new requests in as old ones finish. That is efficient, but it means your latency depends on how busy the provider is, and it is one reason identical requests can produce slightly different outputs. It is also why providers enforce rate limits in requests per minute and tokens per minute — your backend should handle HTTP 429 responses with retry and backoff, and queue non-urgent work (see How Message Queues Work).',
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
            'Myth: "The model learns from my conversations." Reality: Inference does not change the weights. The model only "remembers" what your app re-sends in the prompt. (A provider may separately use data for training depending on its policy and your settings — check your agreement.)',
            'Myth: "Tokens are words." Reality: A token is often part of a word. English averages around 4 characters per token; code and non-English text use more tokens for the same content.',
            'Myth: "Temperature 0 makes it deterministic." Reality: It makes outputs much more consistent, but GPU arithmetic, batching and model updates can still change them. Cache results if you need exact repeatability.',
            'Myth: "A 1M-token context window means I can skip retrieval." Reality: You pay for every input token on every call, latency grows, and recall of details in the middle of huge prompts gets worse. Retrieval of the relevant parts is usually cheaper and more accurate.',
            'Myth: "Streaming makes the model faster." Reality: Total generation time is the same. Streaming improves perceived speed by showing the first tokens immediately.',
            'Myth: "Input and output tokens cost the same." Reality: Output tokens are typically several times more expensive and much slower, because they are generated sequentially.',
            'Myth: "If it sounds confident, it is right." Reality: Fluency is what the model is optimised for; correctness is not guaranteed. Ground, verify and validate.',
            'Myth: "The biggest model is always the best choice." Reality: For many tasks a small model is just as accurate, many times cheaper and much faster. Pick the smallest model that passes your evaluation.',
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
          text: 'In an AI system design interview, the LLM is usually treated as an external, slow, expensive, rate-limited dependency. The strongest answers show you understand tokens, context limits, latency and cost — and design the rest of the system around them.',
        },
        {
          type: 'bullets',
          items: [
            'Prompt Engineering: how to write the system prompt and messages from this lesson so the model reliably produces what you need — structure, examples and output formats.',
            'Embeddings & Vector Databases: the embedding idea mentioned here, applied to whole documents and stored in Postgres + pgvector or a dedicated vector store for semantic search.',
            'RAG (Retrieval-Augmented Generation): the main fix for knowledge cutoff and hallucinations — retrieve relevant chunks and fit them into the context window budget.',
            'AI Agents & MCP: letting the model call tools in a loop, with the Model Context Protocol as the standard way to plug tools and data sources into an AI app.',
            'AI Chat Assistant (system design): streaming over SSE, conversation storage, history trimming, rate limiting and per-user token quotas — everything in the Real-World Example, at scale.',
            'RAG Knowledge Base (system design): ingestion pipelines, chunking, embeddings and retrieval feeding grounded answers with citations.',
            'AI Agent Platform with MCP (system design): orchestrating multi-step tool calls, permissions and long-running agent jobs on top of these fundamentals.',
            'Caching, Rate Limiting and Message Queues: cache identical answers, protect provider quotas with rate limits and back off on 429s, and move batch LLM jobs (summarising thousands of documents) onto a queue.',
          ],
        },
        { type: 'heading2', text: 'Model Routing and Fallbacks' },
        {
          type: 'paragraph',
          text: 'Production systems rarely use a single model. A gateway layer routes each request to the cheapest model that can handle it, and falls back to another model or provider when one is slow, rate limited or down.',
        },
        {
          type: 'flow',
          title: 'An LLM gateway with routing, caching and fallback',
          code: `flowchart LR
  REQ([Request]):::client --> GW{LLM gateway}:::network
  GW -->|"exact repeat"| C[(Response cache)]:::cache
  GW -->|"simple: classify, extract"| S[Small fast model]:::server
  GW -->|"normal chat"| M[Mid-tier model]:::server
  GW -->|"hard reasoning"| L[Large reasoning model]:::highlight
  M -.->|"timeout or 429"| F[Fallback provider]:::external
  GW --> LOG[Usage, cost and<br/>latency metrics]:::security`,
          text: 'Keeping provider calls behind your own wrapper or gateway is what makes routing, fallbacks and switching providers a configuration change instead of a rewrite.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Interview checklist for any LLM feature: Which model tier and why? How many input and output tokens per request, and what does that cost per day? How do you stay inside the context window (trimming, summarising, retrieval)? Do you stream, and what are your TTFT and total latency targets? How do you reduce hallucinations (grounding, validation, tools)? What are your guard rails — max tokens, quotas, rate limits, timeouts, fallbacks and spend alerts?',
        },
      ],
    },
  ],
};
