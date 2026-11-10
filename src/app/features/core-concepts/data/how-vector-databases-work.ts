import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 18 — How Embeddings & Vector Databases Work
// ─────────────────────────────────────────────────────────────────────────────
export const howVectorDatabasesWork: CoreConcept = {
  id: 'how-vector-databases-work',
  title: 'How Embeddings & Vector Databases Work',
  emoji: '🧭',
  icon: 'ti-vector',
  color: '#0d9488',
  bg: '#ccfbf1',
  accentGlow: 'rgba(13,148,136,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Embeddings, cosine similarity, HNSW and IVF indexes, filtering and hybrid search — how apps find text by meaning instead of by exact words.',
  tags: [
    'Embeddings',
    'Vector Search',
    'pgvector',
    'HNSW',
    'Hybrid Search',
    'Chunking',
    'Semantic Search',
  ],
  estimatedTime: '50 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'An embedding is a fixed-length list of numbers (a "vector") that represents the meaning of a piece of content — a sentence, a paragraph, a product description, even an image. An embedding model (a neural network trained for exactly this job) reads the text and outputs, for example, 1,536 floating-point numbers. The key property: texts that mean similar things get vectors that point in similar directions, even when they share no words. "How do I reset my password?" and "I forgot my login credentials" end up close together; "password" and "passport" do not.',
        },
        {
          type: 'paragraph',
          text: 'A vector database is a store that keeps millions of these vectors alongside the original content and metadata, and answers one question very fast: "which stored vectors are closest to this query vector?" That operation is called nearest neighbour search (finding the k closest items is "kNN", k-nearest neighbours). It can be a dedicated product (Pinecone, Qdrant, Weaviate, Milvus) or a feature added to a database you already run (Postgres with the pgvector extension, Elasticsearch/OpenSearch, Redis).',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: imagine every sentence is given a GPS coordinate on a giant "map of meaning". Sentences about cooking cluster in one neighbourhood, sentences about tax law in another. An embedding model is the surveyor that assigns coordinates; a vector database is the map app that, given your location, instantly lists the nearest places — without checking every address on Earth.',
        },
        {
          type: 'flow',
          title: 'The big picture — text in, nearest meanings out',
          code: `flowchart LR
  D["Documents<br/>help articles, tickets"]:::client --> EM["Embedding model"]:::external
  EM -->|"vector per chunk"| VDB[("Vector database<br/>vectors + metadata")]:::db
  Q([User question]):::client --> EM2["Same embedding model"]:::external
  EM2 -->|"query vector"| VDB
  VDB -->|"top-k closest chunks"| APP["App server"]:::server
  APP --> R(["Results or LLM context"]):::highlight`,
          text: 'Documents are embedded once at write time. Each query is embedded at read time with the same model, then compared against everything stored.',
        },
        { type: 'heading2', text: 'Dimensions: What the Numbers Mean' },
        {
          type: 'bullets',
          items: [
            'Dimensions: the length of the vector. Common sizes are roughly 384, 768, 1,024, 1,536 or 3,072, depending on the model. Every vector in one index must have the same number of dimensions.',
            'No single number is human-readable. Dimension 412 is not "about sport"; meaning is spread across all of them together. Only distances between vectors are meaningful.',
            'More dimensions usually capture more nuance but cost more storage and slower comparisons. 1 million vectors x 1,536 dimensions x 4 bytes per float is roughly 6 GB before any index overhead.',
            'Vectors are only comparable if they came from the same model. A vector from model A and a vector from model B live on two different maps, even if they have the same length.',
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
          text: 'Classic search engines and SQL LIKE queries match words, not meaning. A keyword search for "cancel my subscription" misses an article titled "How to end your membership". Users rarely phrase things the way your documentation does, and they do not care about your vocabulary. Semantic search (search by meaning) closes that gap.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: keyword search is a librarian who only checks whether your exact words appear on the book cover. Semantic search is a librarian who understands what you are asking for and hands you the right book even if you described it badly.',
        },
        { type: 'heading2', text: 'Semantic vs Keyword Search' },
        {
          type: 'bullets',
          items: [
            'Keyword (lexical) search: matches the exact terms, usually ranked with BM25 (a classic scoring formula that rewards rare words appearing often in a document). Great for product codes, error messages, names, IDs like "ERR_4012".',
            'Semantic (vector) search: matches meaning. Great for natural-language questions, synonyms, paraphrases and even cross-language queries.',
            'Each fails where the other shines: vectors can blur exact identifiers ("v2.3.1" vs "v2.3.2" look almost identical in meaning), and keywords miss paraphrases. That is why production systems often combine both (hybrid search, covered later).',
          ],
        },
        { type: 'heading2', text: 'Where Full-Stack Apps Use Embeddings' },
        {
          type: 'bullets',
          items: [
            'RAG (retrieval-augmented generation): fetch the most relevant chunks of your docs and paste them into an LLM prompt so the model answers from your data instead of guessing.',
            'Semantic search boxes in help centres, internal wikis and e-commerce catalogues.',
            'Recommendations: "similar products", "related articles", "people who wrote similar tickets".',
            'De-duplication and clustering: find near-duplicate support tickets or group feedback by topic.',
            'Classification and routing: compare an incoming email to labelled examples and route it to the right team.',
            'Semantic caching: if a new question is very close to one answered a minute ago, reuse the cached LLM answer.',
          ],
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Measuring "Closeness": Three Distance Metrics' },
        {
          type: 'paragraph',
          text: 'A similarity metric is the formula that turns two vectors into one number saying how alike they are. There are three you will meet everywhere:',
        },
        {
          type: 'bullets',
          items: [
            'Cosine similarity: the cosine of the angle between the two vectors. 1 means same direction (same meaning), 0 means unrelated, -1 means opposite. It ignores length, so only direction matters. Cosine distance is simply 1 minus cosine similarity.',
            'Dot product (inner product): multiply matching numbers and add them up. It is affected by both direction and length. It is the cheapest to compute.',
            'Euclidean distance (L2): the straight-line distance between the two points. Smaller is closer.',
            'The useful shortcut: if vectors are normalized (scaled to length 1 — many embedding models already output normalized vectors), all three give the same ranking. Dot product then equals cosine similarity, and is fastest. Use whatever metric the embedding model documentation recommends.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// The three metrics, written out (real databases do this in optimized native code)
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

const norm = (a: number[]) => Math.sqrt(dot(a, a));

export const cosineSimilarity = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));

export function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// Normalize once at write time; afterwards dot(a, b) === cosineSimilarity(a, b)
export const normalize = (a: number[]) => {
  const n = norm(a);
  return a.map((x) => x / n);
};`,
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: cosine asks "are these two arrows pointing the same way?", Euclidean asks "how far apart are the arrow tips?", and dot product asks "how much does one arrow push along the other?". When every arrow has the same length, all three questions have the same answer.',
        },
        { type: 'heading2', text: 'Why Brute-Force kNN Does Not Scale' },
        {
          type: 'paragraph',
          text: 'The simplest search is exact (brute-force) kNN: compare the query vector with every stored vector and keep the top k. It is 100% accurate, and for a few thousand or even tens of thousands of vectors it is perfectly fine. But the cost grows linearly. With 10 million vectors of 1,536 dimensions, one query is roughly 15 billion multiply-adds and reads about 60 GB of data. Even with fast hardware, that is far too slow and expensive to do on every keystroke for thousands of users.',
        },
        { type: 'heading2', text: 'Approximate Nearest Neighbour (ANN) Indexes' },
        {
          type: 'paragraph',
          text: 'An ANN index is a data structure that finds "very probably the closest" vectors while only looking at a tiny fraction of them. The quality of an ANN search is measured by recall: the percentage of the true top-k results that the index actually returned. Recall of 0.95 at k = 10 means that, on average, 9.5 of the 10 real nearest neighbours were found. Every ANN index trades recall for speed and memory, and lets you tune that trade-off.',
        },
        { type: 'heading3', text: 'HNSW — A Multi-Layer Graph' },
        {
          type: 'paragraph',
          text: 'HNSW (Hierarchical Navigable Small World) connects each vector to a handful of its nearest neighbours, forming a graph. It builds several layers: the top layer has very few nodes with long-distance links (like motorways), and each lower layer has more nodes with shorter links (like local streets). A search starts at the top, greedily hops to whichever neighbour is closer to the query, drops a layer when it cannot improve, and finishes with a careful local search at the bottom layer, which contains every vector.',
        },
        {
          type: 'bullets',
          items: [
            'M: how many neighbours each node links to (pgvector default 16). Higher M gives better recall but more memory and slower builds.',
            'ef_construction: how many candidates are considered while inserting a node (pgvector default 64). Higher means a better-quality graph and a slower build.',
            'ef_search: how many candidates are kept during a query (pgvector default 40). This is the main runtime knob — raise it for better recall, lower it for speed. It must be at least k.',
            'Strengths: excellent recall/latency, supports inserts at any time, no training step. Weakness: memory-hungry, and builds on large datasets are slow.',
          ],
        },
        {
          type: 'flow',
          title: 'HNSW search — motorways first, then local streets',
          code: `flowchart TB
  subgraph L2["Layer 2 - few nodes, long links"]
    direction LR
    E((entry)):::highlight --> A2((A)):::cache
  end
  subgraph L1["Layer 1 - more nodes, medium links"]
    direction LR
    A1((A)):::cache --> B1((B)):::cache --> C1((C)):::cache
  end
  subgraph L0["Layer 0 - every vector, short links"]
    direction LR
    C0((C)):::cache --> D0((D)):::cache --> T0(("nearest")):::highlight
  end
  A2 -->|"drop a layer"| A1
  C1 -->|"drop a layer"| C0
  Q([query]):::client -.->|"greedy: hop to closer neighbour"| E`,
          text: 'Each hop moves closer to the query. Upper layers cover long distances in few steps; the bottom layer refines the answer.',
        },
        { type: 'heading3', text: 'IVF — Clusters, Then Search the Closest Clusters' },
        {
          type: 'paragraph',
          text: 'IVF (inverted file index) first runs k-means clustering over a sample of vectors to find, say, 1,000 cluster centres ("lists"). Each vector is filed under its nearest centre. At query time it compares the query with the 1,000 centres, picks the closest few (the "probes"), and only searches vectors in those clusters. More probes means better recall and slower queries. IVF uses less memory than HNSW and builds faster, but it needs data to train the clusters first, and recall drops if the data distribution changes a lot after training.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: IVF is like a library sorted into sections. To find a book about sourdough you go to the "Cooking" and "Baking" sections and search those shelves only. If a book was put on the wrong shelf, you might miss it — that is the recall you trade for speed.',
        },
        { type: 'heading3', text: 'Product Quantization — Compressing Vectors' },
        {
          type: 'paragraph',
          text: 'Product quantization (PQ) shrinks vectors by splitting each one into small sub-vectors and replacing each sub-vector with the ID of its closest "codebook" entry. A 1,536-dimension float32 vector (about 6 KB) can shrink to a few dozen bytes. Distances become approximate, so systems often re-rank the top candidates using the full vectors. Simpler variants include scalar quantization (store each number as 8 bits or 16 bits instead of 32) and binary quantization (1 bit per dimension). Quantization is how large systems fit billions of vectors in memory.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'Ingestion: From Document to Searchable Vectors' },
        {
          type: 'numbered',
          items: [
            'Load: pull the source content — Markdown docs, PDFs, ticket histories, product rows.',
            'Clean: strip navigation, HTML boilerplate and duplicated footers that would add noise.',
            'Chunk: split long documents into passages of a few hundred tokens (a token is a word piece, roughly 3-4 characters of English text), usually with some overlap.',
            'Embed: send chunks in batches to the embedding model and get back one vector per chunk.',
            'Store: insert each chunk’s text, vector and metadata (tenant ID, source URL, updated date, access level) into the vector store.',
            'Index: the ANN index (HNSW or IVF) is updated so the new vectors become searchable.',
          ],
        },
        { type: 'heading2', text: 'Query: From Question to Ranked Results' },
        {
          type: 'numbered',
          items: [
            'The user types a question in the Angular app; the frontend calls the backend (never the embedding provider directly — the API key stays on the server).',
            'The backend embeds the question with the same model and settings used at ingestion.',
            'It runs an ANN query: "top 10 nearest chunks where tenant_id = the caller’s tenant".',
            'Optionally it also runs a keyword query and merges the two lists (hybrid search), then re-ranks.',
            'It returns the chunks to the user as search results, or passes them to an LLM as context (RAG).',
          ],
        },
        {
          type: 'flow',
          title: 'Ingestion path and query path',
          code: `sequenceDiagram
  participant W as Ingestion worker
  participant E as Embedding API
  participant DB as Postgres + pgvector
  participant UI as Angular app
  participant API as Node API
  W->>W: load, clean, chunk docs
  W->>E: embed batch of 100 chunks
  E-->>W: 100 vectors
  W->>DB: INSERT chunks + vectors + tenant_id
  Note over DB: HNSW index updated on insert
  UI->>API: GET /search?q=reset password
  API->>E: embed query
  E-->>API: query vector
  API->>DB: ORDER BY embedding <=> query LIMIT 10, filtered by tenant
  DB-->>API: 10 closest chunks
  API-->>UI: results with scores`,
          text: 'Ingestion is a background, batched job. The query path is a synchronous request that should finish in tens of milliseconds plus the embedding call.',
        },
        { type: 'heading2', text: 'Chunking Strategies' },
        {
          type: 'paragraph',
          text: 'Chunking is splitting a document into pieces before embedding. It matters more than most people expect: an embedding of a 40-page PDF is a blurry average of everything in it, and will match nothing well. An embedding of one paragraph about "refund timelines" matches refund questions precisely.',
        },
        {
          type: 'bullets',
          items: [
            'Fixed-size: every N tokens (for example 300-500) with 10-20% overlap so sentences cut at a boundary still appear whole in one chunk. Simple and predictable.',
            'Structure-aware: split on headings, paragraphs, list items or code blocks. Usually the best default for docs and Markdown.',
            'Recursive: try to split on headings, then paragraphs, then sentences, until each piece fits the size limit.',
            'Semantic: start a new chunk where the topic shifts (detected by comparing embeddings of neighbouring sentences). Better quality, more compute.',
            'Add context to each chunk: prepend the document title and section heading ("Billing > Refunds: ...") so an isolated chunk still makes sense.',
            'Keep a pointer back: store document ID, chunk index and URL so you can show sources and fetch neighbouring chunks.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Start with structure-aware chunks of roughly 300-500 tokens with modest overlap, plus the title/heading prefix. Then measure retrieval quality on 30-50 real questions before trying anything fancier.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Structure-aware chunking for Markdown: split on headings, then cap the size
interface Chunk {
  docId: string;
  index: number;
  heading: string;
  text: string;
}

const MAX_CHARS = 1800; // roughly 400-500 tokens of English text
const OVERLAP = 200;

export function chunkMarkdown(docId: string, title: string, markdown: string): Chunk[] {
  const sections = markdown.split(/\\n(?=#{1,3} )/); // keep each heading with its body
  const chunks: Chunk[] = [];

  for (const section of sections) {
    const heading = section.match(/^#{1,3} (.*)/)?.[1] ?? title;
    for (let start = 0; start < section.length; start += MAX_CHARS - OVERLAP) {
      const body = section.slice(start, start + MAX_CHARS).trim();
      if (body.length < 50) continue; // skip tiny fragments
      chunks.push({
        docId,
        index: chunks.length,
        heading,
        text: title + ' > ' + heading + '\\n\\n' + body, // context prefix
      });
    }
  }
  return chunks;
}`,
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
            'Embedding model: turns text (or images) into vectors. Hosted by OpenAI, Google, Cohere, Voyage and others, or run yourself with an open-weight model. Choose by quality on your data, dimensions, language support, maximum input length and cost.',
            'Chunker / ingestion pipeline: loads, cleans, splits and batches content; usually a background worker fed by a queue.',
            'Vector store: holds vectors plus metadata and the ANN index.',
            'ANN index: HNSW, IVF, or a quantized variant — the structure that makes search fast.',
            'Metadata and filters: tenant ID, permissions, language, dates — used to restrict which vectors are eligible.',
            'Keyword index (optional): BM25 or Postgres full-text search for hybrid retrieval.',
            'Re-ranker (optional): a cross-encoder model (one that reads the query and a candidate together and scores how well they match) that re-orders the top 20-100 candidates more accurately than vector distance alone.',
          ],
        },
        { type: 'heading2', text: 'Choosing a Vector Store' },
        {
          type: 'bullets',
          items: [
            'pgvector (Postgres extension): vectors live next to your relational data, with transactions, joins, backups and row-level security you already know. Supports HNSW and IVFFlat indexes and cosine, inner-product and L2 distance. Available on most managed Postgres services.',
            'Pinecone: fully managed, serverless vector database. No servers to run; you pay per usage. Good when you want zero operations and very large scale.',
            'Weaviate: open-source vector database with built-in hybrid search, modules that can call embedding models for you, and a managed cloud.',
            'Qdrant: open-source, written in Rust, strong payload (metadata) filtering and quantization options; self-hosted or managed.',
            'Milvus (and the managed Zilliz Cloud): open-source, built for very large (billions of vectors) distributed deployments with many index types, including GPU indexes.',
            'Elasticsearch / OpenSearch: mature keyword search engines that added dense-vector kNN (HNSW). A natural choice if you already run them and want hybrid search in one system.',
            'Redis: vector search through its query engine, with HNSW and flat indexes in memory. Very low latency; great for semantic caching and moderate-size, hot datasets.',
          ],
        },
        {
          type: 'flow',
          title: 'Do you need a dedicated vector database?',
          code: `flowchart TD
  S([Start]):::client --> PG{Already on Postgres?}
  PG -->|"yes"| SZ{"Under ~10-50 million vectors<br/>and moderate QPS?"}
  SZ -->|"yes"| PGV["pgvector<br/>simplest, transactional"]:::highlight
  SZ -->|"no"| DED["Dedicated store<br/>Qdrant, Milvus, Pinecone, Weaviate"]:::db
  PG -->|"no"| ES{Already running<br/>Elasticsearch or OpenSearch?}
  ES -->|"yes"| ESK["Use its kNN + BM25<br/>hybrid in one place"]:::server
  ES -->|"no"| OPS{Want zero ops?}
  OPS -->|"yes"| MAN["Managed service<br/>e.g. Pinecone"]:::external
  OPS -->|"no"| DED`,
          text: 'The thresholds are illustrative. Benchmark with your own data, dimensions and filters before committing.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'When pgvector is enough: you already run Postgres, you have up to tens of millions of vectors, your queries need SQL filters and joins (tenant, permissions, status), and you value one system to back up, secure and keep consistent. Many production RAG apps never outgrow it. Move to a dedicated store when index size no longer fits in memory on a reasonable instance, when vector queries start competing with your transactional workload, or when you need features like built-in sharding across many nodes.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: pgvector is adding a well-organised bookshelf to the office you already have. A dedicated vector database is renting a purpose-built warehouse — worth it when the bookshelf overflows, but it is one more building to staff and secure.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Multi-Tenant Help-Center Search with pgvector' },
        {
          type: 'paragraph',
          text: 'A SaaS company hosts help centres for 2,000 customer companies (tenants). Each tenant uploads its own articles. Users type questions into an Angular search box; a NestJS/Express backend embeds the question and searches only that tenant’s chunks. Around 3 million chunks in total, 1,536 dimensions, normalized vectors, all in the existing Postgres cluster.',
        },
        { type: 'heading3', text: '1. The Table and the HNSW Index' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE doc_chunks (
  id            bigserial PRIMARY KEY,
  tenant_id     uuid        NOT NULL,
  doc_id        uuid        NOT NULL,
  chunk_index   int         NOT NULL,
  heading       text,
  content       text        NOT NULL,
  embedding     vector(1536) NOT NULL,      -- dimensions must match the model
  embed_model   text        NOT NULL,       -- which model produced this vector
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_id, chunk_index, embed_model)
);

-- B-tree index for the tenant filter
CREATE INDEX doc_chunks_tenant_idx ON doc_chunks (tenant_id);

-- HNSW index using cosine distance (operator <=>)
CREATE INDEX doc_chunks_embedding_hnsw
  ON doc_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Optional: keyword search column for hybrid retrieval
ALTER TABLE doc_chunks
  ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX doc_chunks_tsv_idx ON doc_chunks USING gin (content_tsv);`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'pgvector distance operators: <-> is Euclidean (L2) distance, <#> is negative inner product, <=> is cosine distance. The index operator class (vector_cosine_ops, vector_ip_ops, vector_l2_ops) must match the operator you use in ORDER BY, or Postgres will fall back to a sequential scan.',
        },
        { type: 'heading3', text: '2. Node Ingestion — Embed in Batches' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// ingest.worker.ts — runs from a queue, never inside a user request
import { Pool } from 'pg';
import { chunkMarkdown } from './chunking';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const EMBED_MODEL = process.env.EMBED_MODEL!; // configured, never hard-coded in many places
const BATCH_SIZE = 100;

// Thin provider-neutral wrapper around your embedding provider's HTTP API
async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(process.env.EMBED_URL + '/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.EMBED_API_KEY,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (res.status === 429) throw new RetryableError('rate limited'); // queue retries with backoff
  if (!res.ok) throw new Error('embedding failed: ' + res.status);
  const body = (await res.json()) as { data: { embedding: number[] }[] };
  return body.data.map((d) => d.embedding);
}

class RetryableError extends Error {}

const toPgVector = (v: number[]) => '[' + v.join(',') + ']';

export async function ingestDocument(tenantId: string, docId: string, title: string, md: string) {
  const chunks = chunkMarkdown(docId, title, md);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(batch.map((c) => c.text)); // 1 call per 100 chunks

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        await client.query(
          'INSERT INTO doc_chunks (tenant_id, doc_id, chunk_index, heading, content, embedding, embed_model) ' +
            'VALUES ($1, $2, $3, $4, $5, $6::vector, $7) ' +
            'ON CONFLICT (doc_id, chunk_index, embed_model) DO UPDATE ' +
            'SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, updated_at = now()',
          [tenantId, docId, c.index, c.heading, c.text, toPgVector(vectors[j]), EMBED_MODEL],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Embedding APIs have rate limits and per-request input limits. Batch requests, run ingestion in a background worker with retries and exponential backoff, and make the upsert idempotent (the ON CONFLICT clause) so a retried batch does not create duplicate chunks. If a document shrinks, delete chunks whose chunk_index is now beyond the new count.',
        },
        { type: 'heading3', text: '3. Similarity Query with a Tenant Filter' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// search.controller.ts — Express-style handler
app.get('/api/search', requireAuth, async (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 500);
  const tenantId = req.user.tenantId; // from the auth token — NEVER from the query string
  if (!q) return res.json([]);

  const [queryVector] = await embedBatch([q]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL hnsw.ef_search = 100'); // more recall for this query
    await client.query('SET LOCAL hnsw.iterative_scan = relaxed_order'); // pgvector 0.8+: keep scanning when filters remove rows
    const { rows } = await client.query(
      'SELECT id, doc_id, heading, content, 1 - (embedding <=> $1::vector) AS score ' +
        'FROM doc_chunks ' +
        'WHERE tenant_id = $2 AND embed_model = $3 ' +
        'ORDER BY embedding <=> $1::vector ' +
        'LIMIT 10',
      [toPgVector(queryVector), tenantId, EMBED_MODEL],
    );
    await client.query('COMMIT');
    res.json(rows.filter((r) => r.score > 0.3)); // illustrative cut-off; tune on real data
  } finally {
    client.release();
  }
});`,
        },
        { type: 'heading3', text: '4. The Angular Search Box' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

interface SearchHit {
  id: number;
  heading: string;
  content: string;
  score: number;
}

@Component({
  selector: 'app-help-search',
  standalone: true,
  template: \`
    <input placeholder="Ask a question..." (input)="query.set($any($event.target).value)" />
    @for (hit of results(); track hit.id) {
      <article>
        <h4>{{ hit.heading }}</h4>
        <p>{{ hit.content.slice(0, 200) }}...</p>
      </article>
    }
  \`,
})
export class HelpSearchComponent {
  private http = inject(HttpClient);
  query = signal('');

  // Debounce so we embed once per pause in typing, not once per keystroke
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((q) => q.trim().length > 2),
      switchMap((q) =>
        this.http.get<SearchHit[]>('/api/search', { params: new HttpParams().set('q', q) }),
      ),
    ),
    { initialValue: [] as SearchHit[] },
  );
}`,
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
          title: 'At a glance — ingestion and query sharing one model',
          code: `flowchart TB
  SRC["Docs, PDFs, tickets"]:::client -->|"1. change event"| Q[[Ingestion queue]]:::queue
  Q --> W["Worker<br/>clean + chunk"]:::server
  W -->|"2. batch embed"| EM["Embedding model"]:::external
  W -->|"3. upsert vectors + metadata"| VS[("Vector store<br/>HNSW index")]:::db
  USR([User question]):::client --> API["Search API"]:::server
  API -->|"4. embed query"| EM
  API -->|"5. ANN + filters"| VS
  API -->|"6. optional keyword search"| KW[("BM25 / full-text")]:::db
  API -->|"7. fuse + re-rank"| RR["Re-ranker"]:::cache
  RR --> OUT(["Results or RAG context"]):::highlight`,
          text: 'Writes are asynchronous and batched; reads are synchronous and must be fast. The embedding model is the shared contract between them.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-vector-search-lifecycle',
            title: 'Semantic Search Lifecycle with Embeddings',
            subtitle:
              'Tracing one help article from upload to a ranked answer for the question "how do I get my money back?"',
            nodes: [
              {
                id: 'source-docs',
                name: 'Source Content',
                subtitle: 'Article Uploaded by Tenant',
                type: 'client',
                icon: 'ti-file-text',
                badge: 'Input',
                protocol: 'Markdown / PDF',
                details: [
                  'Tenant acme uploads "Refunds and Returns" (about 4,000 words)',
                  'An ingestion job is put on a queue so the upload request returns immediately',
                ],
              },
              {
                id: 'chunker',
                name: 'Chunker',
                subtitle: 'Split by Headings, Cap Size',
                type: 'server',
                icon: 'ti-cut',
                badge: 'Ingestion',
                protocol: '~400 tokens, 15% overlap',
                details: [
                  'Produces roughly 14 chunks, each prefixed with "Refunds and Returns > <heading>"',
                  'Stores doc_id and chunk_index so results can link back to the source',
                ],
              },
              {
                id: 'embedding-model',
                name: 'Embedding Model',
                subtitle: 'Text to 1,536 Numbers',
                type: 'gateway',
                icon: 'ti-vector',
                badge: 'Model',
                protocol: 'HTTPS, batched',
                details: [
                  'One API call embeds all 14 chunks; vectors come back normalized',
                  'The same model and version must be used later for queries',
                ],
              },
              {
                id: 'vector-store',
                name: 'Vector Store (pgvector)',
                subtitle: 'Rows + HNSW Graph',
                type: 'database',
                icon: 'ti-database',
                badge: 'Storage',
                protocol: 'vector(1536), m = 16',
                details: [
                  'Each chunk is a row with tenant_id, content, embedding and embed_model',
                  'Inserting a row also links it into the HNSW graph to its nearest neighbours',
                ],
              },
              {
                id: 'query-search',
                name: 'Query + ANN Search',
                subtitle: 'Embed Question, Find Neighbours',
                type: 'cache',
                icon: 'ti-search',
                badge: 'Read Path',
                protocol: 'ORDER BY <=> LIMIT 10',
                details: [
                  '"how do I get my money back?" is embedded with the same model',
                  'HNSW walks the graph with ef_search = 100, filtered to tenant acme',
                  'The "Requesting a refund" chunk scores about 0.82 even though it never says "money back"',
                ],
              },
              {
                id: 'hybrid-rerank',
                name: 'Hybrid Fusion & Re-rank',
                subtitle: 'Combine Keyword + Vector Lists',
                type: 'security',
                icon: 'ti-arrows-sort',
                badge: 'Ranking',
                protocol: 'RRF, k = 60',
                details: [
                  'BM25 results and vector results are merged with reciprocal rank fusion',
                  'An optional cross-encoder re-ranks the top 20 and the best 5 are returned',
                ],
              },
            ],
            connections: [
              {
                from: 'source-docs',
                to: 'chunker',
                label: '1. Queue ingestion job',
                protocol: 'Job queue',
                type: 'async',
              },
              {
                from: 'chunker',
                to: 'embedding-model',
                label: '2. Embed batch of chunks',
                protocol: 'HTTPS',
                type: 'sync',
              },
              {
                from: 'embedding-model',
                to: 'vector-store',
                label: '3. Upsert vectors + metadata',
                protocol: 'SQL',
              },
              {
                from: 'query-search',
                to: 'vector-store',
                label: '4. kNN with tenant filter',
                protocol: 'SQL',
                type: 'sync',
              },
              {
                from: 'query-search',
                to: 'hybrid-rerank',
                label: '5. Fuse + re-rank candidates',
                protocol: 'In-process',
              },
            ],
            keyTakeaways: [
              'The embedding model is a contract: documents and queries must be embedded by the same model, or similarity scores are meaningless.',
              'ANN indexes trade a little recall for huge speed-ups; tune ef_search (HNSW) or probes (IVF) and measure recall on real queries.',
              'Filters and hybrid search are not extras: tenant isolation is a security requirement, and keyword matching rescues exact terms that vectors blur.',
            ],
            rawSpec: `Ingestion (async)
  upload "Refunds and Returns" (tenant acme)
    │  enqueue job
    ▼
  chunker → 14 chunks (~400 tokens, 15% overlap, heading prefix)
    │  embed batch of 14
    ▼
  embedding model → 14 x vector(1536), normalized
    │  INSERT ... ON CONFLICT DO UPDATE
    ▼
  doc_chunks rows + HNSW graph links

Query (sync)
  "how do I get my money back?"
    │  embed (same model)
    ▼
  SELECT ... WHERE tenant_id = 'acme'
  ORDER BY embedding <=> :q LIMIT 20      -- vector list
  + full-text query on content_tsv         -- keyword list
    │  reciprocal rank fusion
    ▼
  top 5 → search results or LLM context (RAG)`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'The Recall vs Latency Trade-off' },
        {
          type: 'paragraph',
          text: 'Every ANN index has a dial between "fast" and "accurate". In HNSW the dial is ef_search; in IVF it is the number of probes. Turning it up examines more candidates: recall goes up, latency and CPU go up. The curve flattens — going from 90% to 95% recall is cheap, going from 99% to 99.9% can double the latency. For most search and RAG use-cases, roughly 95-99% recall is plenty, because the top results are then re-ranked anyway and the user cannot tell the difference.',
        },
        {
          type: 'bullets',
          items: [
            'Measure, do not guess: run a few hundred real queries with exact (brute-force) search to get the true top-k, then compare the ANN results to compute recall at your chosen settings.',
            'Watch p95/p99 latency, not just the average. Graph searches can occasionally wander.',
            'Memory is the hidden cost. HNSW performs best when the whole index fits in RAM; when it does not, queries hit disk and latency jumps.',
            'Bulk loads: in pgvector it is usually faster to load the data first and create the HNSW index afterwards, with more maintenance_work_mem.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: ef_search is how many doors you are willing to knock on before declaring "this is the closest house". Knock on more doors and you are more confident, but you get home later.',
        },
        { type: 'heading2', text: 'Metadata Filtering: Pre-filter vs Post-filter' },
        {
          type: 'paragraph',
          text: 'Real queries almost always have conditions: this tenant only, this language, documents the user is allowed to see, updated in the last year. How the filter combines with the ANN search matters a lot.',
        },
        {
          type: 'bullets',
          items: [
            'Post-filtering: run the ANN search for the top k, then drop the rows that fail the filter. Fast, but if the filter is selective you may get back 2 results instead of 10 — or zero — because the true matches were never in the ANN candidate list.',
            'Pre-filtering: restrict to matching rows first, then search only those. Always returns enough results, but if the filtered set is large and has no index of its own, it can degrade to a brute-force scan.',
            'Filtered / in-graph search: modern engines (Qdrant, Weaviate, Milvus, and pgvector 0.8+ with iterative index scans) check the filter while walking the index and keep searching until they have k matches.',
            'Partitioning: for very selective, always-present filters like tenant_id, give big tenants their own partition, table or index (for example Postgres table partitioning or a namespace/collection per tenant in a dedicated store).',
          ],
        },
        {
          type: 'flow',
          title: 'Post-filter can starve; pre-filter can be slow',
          code: `flowchart TB
  Q([Query + filter tenant = acme]):::client
  Q --> POST["Post-filter<br/>ANN top 10 over all tenants"]:::server
  POST -->|"only 2 rows are acme"| FEW["2 results<br/>recall collapses"]:::security
  Q --> PRE["Pre-filter<br/>acme rows only"]:::server
  PRE -->|"no per-tenant index"| SCAN["Exact scan of acme rows<br/>fine if small, slow if huge"]:::cache
  Q --> ITER["Filter during index walk<br/>or per-tenant partition"]:::server
  ITER --> GOOD["10 acme results, fast"]:::highlight`,
          text: 'Selective filters are the most common cause of "vector search returns too few results" in production.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Tenant and permission filters are security controls, not ranking hints. Always derive them from the authenticated user on the server, and test that one tenant can never retrieve another tenant’s chunks — especially once those chunks are pasted into an LLM prompt.',
        },
        { type: 'heading2', text: 'Hybrid Search and Reciprocal Rank Fusion' },
        {
          type: 'paragraph',
          text: 'Hybrid search runs a keyword search (BM25 or Postgres full-text) and a vector search in parallel, then merges the two ranked lists. Their raw scores are on different scales (a BM25 score of 14.2 vs a cosine similarity of 0.81), so instead of adding scores, most systems use reciprocal rank fusion (RRF): each document gets 1 / (k + rank) from every list it appears in, with k usually 60, and the sums are sorted. A document ranked well in both lists rises to the top.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Hybrid search in one Postgres query with reciprocal rank fusion
WITH vector_hits AS (
  SELECT id, row_number() OVER (ORDER BY embedding <=> $1::vector) AS rank
  FROM doc_chunks
  WHERE tenant_id = $2
  ORDER BY embedding <=> $1::vector
  LIMIT 40
),
keyword_hits AS (
  SELECT id,
         row_number() OVER (ORDER BY ts_rank_cd(content_tsv, query) DESC) AS rank
  FROM doc_chunks, websearch_to_tsquery('english', $3) AS query
  WHERE tenant_id = $2 AND content_tsv @@ query
  ORDER BY ts_rank_cd(content_tsv, query) DESC
  LIMIT 40
)
SELECT c.id, c.heading, c.content,
       COALESCE(1.0 / (60 + v.rank), 0) + COALESCE(1.0 / (60 + k.rank), 0) AS rrf_score
FROM vector_hits v
FULL OUTER JOIN keyword_hits k USING (id)
JOIN doc_chunks c ON c.id = COALESCE(v.id, k.id)
ORDER BY rrf_score DESC
LIMIT 10;`,
        },
        { type: 'heading2', text: 'Re-embedding When the Model Changes' },
        {
          type: 'paragraph',
          text: 'Switching embedding models (a better model, a cheaper one, a different dimension size) invalidates every stored vector: old and new vectors are on different maps and cannot be compared. You must re-embed the whole corpus. Treat it like a database migration.',
        },
        {
          type: 'numbered',
          items: [
            'Record the model on every row (embed_model column) or in the index/collection name.',
            'Create a new column, table or collection for the new model (dimensions may differ) and build its index.',
            'Backfill in the background with rate-limited batch jobs, while new writes go to both old and new (dual write).',
            'Evaluate: run your test question set against both and compare retrieval quality.',
            'Switch reads to the new index behind a feature flag, keep the old one for quick rollback, then delete it.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Keep the original chunk text, not just vectors. Without the text you cannot re-embed — and you will need to, sooner or later.',
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
            'Myth: "I need a dedicated vector database to do vector search." Reality: For most apps with up to tens of millions of vectors, pgvector in your existing Postgres (or the vector features in Elasticsearch, OpenSearch or Redis) is enough — and simpler to secure and operate.',
            'Myth: "Vector search returns exact results." Reality: ANN indexes are approximate by design. They usually find around 95-99% of the true neighbours, depending on settings.',
            'Myth: "A higher similarity score means the answer is correct." Reality: It means the text is semantically close, not that it is true or answers the question. A chunk about "refund policy for 2022" is very close to a question about the current policy.',
            'Myth: "Embeddings understand exact identifiers." Reality: Product codes, version numbers and error IDs are often blurred together. Use hybrid search for them.',
            'Myth: "Embed whole documents for best context." Reality: Long inputs get averaged into a vague vector (and may be truncated at the model’s input limit). Chunk them.',
            'Myth: "I can switch embedding models and keep my old vectors." Reality: Vectors from different models are not comparable. A model change means re-embedding everything.',
            'Myth: "Vector databases are secure because embeddings are just numbers." Reality: Embeddings can leak information about the source text, and the stored chunks are usually right next to them. Apply the same access control as for the original documents.',
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
          text: 'Embeddings and vector search are now a standard building block in system design interviews for anything that says "search", "recommend", "similar" or "chat with your documents". Be ready to explain the ingestion pipeline, the index choice and its recall/latency trade-off, how filters (especially tenant isolation) work, and how you would migrate to a new embedding model.',
        },
        {
          type: 'bullets',
          items: [
            'How LLMs Work: embeddings come from the same family of models; understanding tokens and context windows explains why chunk size and top-k matter.',
            'Prompt Engineering: retrieved chunks become part of the prompt, so how you format and label them (with sources) changes answer quality.',
            'RAG: this lesson is the "R" — retrieval. RAG adds the generation step on top, with citations and guardrails.',
            'AI Agents & MCP: an agent often exposes "search the knowledge base" as a tool, backed by exactly this vector query.',
            'AI Chat Assistant (system design): semantic caching of answers and retrieval of past conversation snippets both use embeddings.',
            'RAG Knowledge Base (system design): the full ingestion pipeline, multi-tenant pgvector schema, hybrid search and re-embedding plan from this lesson, at scale.',
            'AI Agent Platform with MCP (system design): vector search is one of the tools that agents call through MCP servers, with per-user permission filters.',
            'How Message Queues Work and How Caching Works: ingestion runs on a queue with retries; hot query embeddings and results are cached.',
          ],
        },
        { type: 'heading2', text: 'Scaling a Vector Search Service' },
        {
          type: 'flow',
          title: 'From one Postgres to a sharded vector tier',
          code: `flowchart LR
  subgraph S1["Stage 1 - single Postgres"]
    direction TB
    A1["App"]:::server --> P1[("Postgres + pgvector<br/>HNSW")]:::db
  end
  subgraph S2["Stage 2 - read replicas"]
    direction TB
    A2["App"]:::server -->|"writes"| P2[("Primary")]:::db
    A2 -->|"vector reads"| R2[("Replicas<br/>index in RAM")]:::db
  end
  subgraph S3["Stage 3 - dedicated, sharded"]
    direction TB
    A3["App"]:::server --> VQ["Vector tier<br/>sharded by tenant"]:::cache
    VQ --> SH1[("Shard 1")]:::db
    VQ --> SH2[("Shard 2")]:::db
  end
  S1 --> S2 --> S3`,
          text: 'Move to the next stage only when metrics (index size vs RAM, p99 latency, CPU contention with transactional queries) say so.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Interview checklist for vector search in your design: Which embedding model and how many dimensions? How are documents chunked? Which store and index (HNSW or IVF), and what recall do you target? How are tenant and permission filters applied (pre, post, or in-index)? Do you need hybrid search for exact terms? How do you re-embed when the model changes? What is the storage estimate (vectors x dimensions x 4 bytes, plus index overhead)?',
        },
      ],
    },
  ],
};
