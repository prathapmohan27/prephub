import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 6 — File & Object Storage (S3-like)
// ─────────────────────────────────────────────────────────────────────────────
export const fileStorage: SystemDesignSystem = {
  id: 'file-storage',
  title: 'File & Object Storage',
  icon: 'ti-cloud-upload',
  color: '#f97316',
  bg: '#ffedd5',
  accentGlow: 'rgba(249,115,22,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'CDN, chunked uploads, metadata databases, and eventual consistency — the building blocks of S3.',
  tags: ['CDN', 'Chunked Upload', 'Presigned URLs', 'Object Storage', 'Eventual Consistency'],
  estimatedTime: '55 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A distributed object storage system like Amazon S3, Google Cloud Storage, or Dropbox. Users can upload, download, share, and manage files of any size. The system stores billions of objects reliably on cheap, ordinary ("commodity") servers.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it works like a huge self-storage warehouse. The front desk (the API) checks your ID, writes your box into a ledger (the metadata database), and hands you a key card (a presigned URL). You then carry the box to the shelves yourself — the front desk never touches your stuff. Copies of every box are kept in other buildings so nothing is ever lost.',
        },
        {
          type: 'flow',
          title: 'The big picture — a ledger plus a warehouse',
          code: `flowchart LR
  U([User]):::client -->|"1. I want to upload"| API[API Service<br/>front desk]:::server
  API -->|"record name, owner, size"| META[(Metadata DB<br/>the ledger)]:::db
  API -->|"2. presigned URL"| U
  U ==>|"3. file bytes go direct"| ST[(Storage nodes<br/>the warehouse)]:::db
  ST -.->|"4. upload done event"| API
  V([Viewer]):::client -->|"download"| CDN[CDN edge]:::network
  CDN -->|"cache miss only"| ST`,
          text: 'Two separate stores: a small, fast database that knows where every file is, and a giant, cheap store that holds the actual bytes. The API only ever touches the small one.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Upload files (any size, up to 5 GB per file).',
            'Download files by key/URL.',
            'Delete files.',
            'List files in a namespace (bucket/folder).',
            'File versioning — keep previous versions of a file.',
            'Access control — public or private files, shared with specific users.',
            'Presigned URLs — generate time-limited URLs for accessing private files.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 billion total objects stored.',
            '10 PB of total data.',
            '99.999999999% (11 nines) data durability — if you store 10 million files, you would expect to lose one roughly every 10,000 years.',
            '99.99% availability.',
            'Files must be retrievable within seconds.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Object Storage vs. Block Storage vs. File Storage' },
        {
          type: 'bullets',
          items: [
            'Object Storage: Each file is stored as a flat "object" — the bytes, some metadata, and a unique key. There are no real folders. Highly scalable and cheap. Examples: S3, Azure Blob. Best for images, videos, backups, large data.',
            'Block Storage: Data stored in fixed-size blocks, just like a hard drive. Used by databases and operating systems. Low latency but expensive at scale. Examples: AWS EBS.',
            'File Storage: A classic folder tree (directories, subdirectories). Familiar but harder to scale. Examples: NFS, AWS EFS.',
          ],
        },
        {
          type: 'flow',
          title: 'Three ways to store data',
          code: `flowchart TB
  subgraph OBJ["Object storage - S3"]
    K1["photos/cat.jpg"]:::highlight --> O1[(bytes + metadata)]:::db
    K2["backups/2024.zip"]:::highlight --> O2[(bytes + metadata)]:::db
  end
  subgraph BLK["Block storage - EBS"]
    B1[Block 1]:::server --- B2[Block 2]:::server --- B3[Block 3]:::server
  end
  subgraph FS["File storage - NFS"]
    R["/home"]:::client --> D1["/home/docs"]:::client --> F1["report.pdf"]:::client
  end`,
          text: 'Object storage is a flat key → object map (the "/" in a key is just part of the name). Block storage is a raw disk. File storage is the folder tree you know from your laptop.',
        },
        { type: 'heading2', text: 'Chunked (Multipart) Upload' },
        {
          type: 'paragraph',
          text: 'Uploading a 5 GB file as one HTTP request is risky — a single network hiccup means starting over from zero. Multipart upload cuts the file into chunks (e.g., 8 MB each) and uploads each chunk on its own, often several at once. If one chunk fails, only that chunk is retried. Once every part has arrived, the server stitches them back together.',
        },
        {
          type: 'flow',
          title: 'Multipart upload — only the failed piece is retried',
          code: `sequenceDiagram
  participant C as Client
  participant S as Storage Service
  C->>S: Start multipart upload
  S-->>C: uploadId
  par upload parts in parallel
    C->>S: PUT part 1 (8 MB)
    S-->>C: OK, etag 1
  and
    C->>S: PUT part 2 (8 MB)
    S--xC: network error
    C->>S: Retry part 2 only
    S-->>C: OK, etag 2
  and
    C->>S: PUT part 3 (8 MB)
    S-->>C: OK, etag 3
  end
  C->>S: Complete upload (list of etags)
  S->>S: Stitch parts into one object
  S-->>C: 200 object created`,
          text: 'A failure costs you one 8 MB chunk, not the whole 5 GB file. The final "complete" call tells storage which parts to join and in what order.',
        },
        { type: 'heading2', text: 'Content Delivery Network (CDN)' },
        {
          type: 'paragraph',
          text: 'A CDN is a worldwide network of "edge" servers that keep copies of popular content close to users. Instead of a user in Tokyo downloading a file from a data center in Virginia (slow — the data crosses the planet), they download it from a CDN edge server in Tokyo (fast). CDNs are essential for serving static files, images, and videos at global scale.',
        },
        {
          type: 'flow',
          title: 'How a CDN serves a file',
          code: `flowchart LR
  T([User in Tokyo]):::client --> E{Tokyo edge<br/>has the file?}:::network
  E -->|"Yes - cache hit, ~10 ms"| T2([File delivered]):::highlight
  E -->|"No - cache miss"| O[(Origin storage<br/>Virginia)]:::db
  O -->|"~200 ms, once"| E2[Edge stores a copy]:::network
  E2 --> T2`,
          text: 'Only the first request in a region travels to the origin. Everyone after that is served from the nearby edge copy.',
        },
        { type: 'heading2', text: 'Presigned URLs' },
        {
          type: 'paragraph',
          text: 'A presigned URL is a temporary, single-purpose link to a private object. It carries a cryptographic signature (proof that your backend approved it) and an expiry time. The storage service checks the signature and only allows access until the link expires — no permanent passwords or keys are ever handed to the client. Because clients upload and download directly with these links, the application backend never has to carry the file bytes itself.',
        },
        {
          type: 'flow',
          title: 'Presigned URL — a signed, expiring permission slip',
          code: `sequenceDiagram
  participant C as Client
  participant A as API Service
  participant S as Storage
  C->>A: Can I upload cat.jpg?
  A->>A: Check login and permissions
  A->>A: Sign (bucket, key, PUT, expires in 15 min) with secret key
  A-->>C: https://storage/cat.jpg?expires=...&signature=...
  C->>S: PUT file bytes to that URL
  S->>S: Recompute signature with the same secret
  alt signature valid and not expired
    S-->>C: 200 stored
  else tampered or expired
    S-->>C: 403 Forbidden
  end`,
          text: 'Storage and the API share a secret key, so storage can verify the link on its own. Change any part of the URL (key, action, expiry) and the signature no longer matches.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Upload Flow' },
        {
          type: 'numbered',
          items: [
            'Client requests a presigned upload URL from the API Service: POST /api/files/upload-url',
            'API Service validates auth, creates a file metadata record (status: pending), returns a presigned URL pointing to the Storage Service.',
            'Client uploads the file bytes directly to the Storage Service using the presigned URL (bypassing the API Service).',
            'Storage Service stores the file, notifies the API Service via an event (Kafka/SNS).',
            'API Service updates the file metadata (status: active, size, checksum).',
            'Client receives the file_id and can construct the CDN URL.',
          ],
        },
        {
          type: 'flow',
          title: 'Upload flow',
          code: `sequenceDiagram
  actor C as Client
  participant A as API Service
  participant M as Metadata DB
  participant S as Storage Service
  participant Q as Event Queue
  C->>A: POST /api/files/upload-url
  A->>M: INSERT file (status = pending)
  A-->>C: presigned URL + file_id
  C->>S: PUT bytes via presigned URL
  S-->>C: 200 OK
  S--)Q: event: file uploaded (size, checksum)
  Q--)A: deliver event
  A->>M: UPDATE status = active, size, checksum
  C->>A: GET /api/files/file_id
  A-->>C: status active + CDN URL`,
          text: 'The heavy part (the bytes) goes straight to storage. The API only does small, fast bookkeeping before and after.',
        },
        { type: 'heading2', text: 'Download Flow' },
        {
          type: 'numbered',
          items: [
            'Client requests the file URL via GET /api/files/{fileId}.',
            'API Service validates access permissions.',
            'If public: Return the CDN URL. CDN serves from edge cache if present; otherwise fetches from origin (Storage Service).',
            'If private: Generate and return a time-limited presigned CDN URL (e.g., valid for 1 hour).',
          ],
        },
        {
          type: 'flow',
          title: 'Download flow — public vs private',
          code: `sequenceDiagram
  actor C as Client
  participant A as API Service
  participant CDN as CDN Edge
  participant S as Storage (origin)
  C->>A: GET /api/files/file_id
  A->>A: Check permissions
  alt public file
    A-->>C: plain CDN URL
  else private file
    A-->>C: presigned CDN URL (valid 1 hour)
  end
  C->>CDN: GET file
  alt cached at edge
    CDN-->>C: file bytes
  else not cached
    CDN->>S: fetch from origin
    S-->>CDN: file bytes
    CDN-->>C: file bytes (and keeps a copy)
  end`,
        },
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'API Service: Handles auth, metadata, presigned URL generation. Stateless (keeps no per-user data in memory, so any instance can serve any request).',
            'Storage Service (Data Nodes): Stores the actual file bytes across many ordinary servers, protected by erasure coding or replication.',
            'Metadata Database: Stores facts about each file (name, size, owner, storage location, checksum). PostgreSQL or DynamoDB.',
            'CDN: Cloudflare or AWS CloudFront for global file distribution.',
            'Message Queue: Carries events between components (e.g., "file uploaded" → update metadata).',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  C([Clients]):::client --> LB[Load Balancer]:::network
  LB --> API[API Service<br/>auth, metadata, signing]:::server
  API --> MDB[(Metadata DB)]:::db
  API --> RC[(Redis<br/>metadata cache)]:::cache
  C ==>|"bytes via presigned URL"| SS[Storage Service<br/>data nodes]:::server
  C -->|"downloads"| CDN[CDN]:::network
  CDN -->|"miss"| SS
  SS -.->|"file uploaded event"| Q[[Message Queue]]:::queue
  Q -.-> API
  Q -.-> AV[Virus scan /<br/>thumbnails]:::external`,
          text: 'Thick arrows carry file bytes and never pass through the API. Dotted arrows are asynchronous events that trigger follow-up work.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Erasure Coding for Durability (vs. Replication)' },
        {
          type: 'paragraph',
          text: 'Simple replication keeps 3 full copies, so it needs 3× the storage. Erasure coding is smarter: Reed-Solomon 10+4, for example, splits the data into 10 data pieces ("shards") and computes 4 extra parity shards from them — a bit like the checksum digit on a credit card, but able to rebuild missing data. Any 10 of the 14 shards are enough to reconstruct the original, so up to 4 can be lost. That costs only 1.4× storage (vs. 3×) while giving equal or better durability.',
        },
        {
          type: 'flow',
          title: 'Erasure coding 10 + 4',
          code: `flowchart TB
  F[Original object]:::client --> SPLIT[Split into 10 data shards]:::server
  SPLIT --> ENC[Compute 4 parity shards<br/>Reed-Solomon]:::server
  ENC --> AZ1[(Zone A<br/>shards 1-5)]:::db
  ENC --> AZ2[(Zone B<br/>shards 6-10)]:::db
  ENC --> AZ3[(Zone C<br/>parity 1-4)]:::db
  AZ1 -.->|"any 10 of 14"| REB[Rebuild original<br/>even if 4 shards are lost]:::highlight
  AZ2 -.-> REB
  AZ3 -.-> REB`,
          text: '14 shards stored for 10 shards of data = 1.4× overhead. Spreading shards across zones means a whole disk, server, or even rack can fail without losing the file.',
        },
        {
          type: 'bullets',
          items: [
            'S3 uses Reed-Solomon erasure coding to achieve 11 nines of durability.',
            'Data and parity shards are spread across different servers and availability zones.',
            'Higher compute cost for encode/decode vs. simple replication.',
          ],
        },
        { type: 'heading2', text: 'Metadata Database Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE files (
  file_id       UUID PRIMARY KEY,
  bucket_id     UUID NOT NULL,
  owner_id      UUID NOT NULL,
  name          VARCHAR(1024),
  size_bytes    BIGINT,
  content_type  VARCHAR(255),
  checksum_md5  CHAR(32),
  storage_path  TEXT,          -- Internal path on storage nodes
  version       INT DEFAULT 1,
  status        VARCHAR(20) DEFAULT 'active', -- active, deleted, pending
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'File Deduplication' },
        {
          type: 'paragraph',
          text: 'If two users upload the same file, store only one copy. The trick is content-addressed storage: compute a hash (SHA-256) of the file content and use that hash as the storage key. Identical files always produce the same hash. If the hash already exists in storage, skip the upload and just create a new metadata record pointing to the existing bytes. This can dramatically reduce storage costs in consumer applications.',
        },
        {
          type: 'flow',
          title: 'Deduplication with content hashes',
          code: `flowchart TD
  UP[New upload]:::client --> H[Compute SHA-256<br/>of the content]:::server
  H --> Q{Hash already<br/>in storage?}
  Q -->|"Yes - same bytes exist"| LINK[Create metadata row<br/>pointing to existing blob]:::highlight
  Q -->|No| STORE[Store bytes<br/>under key = hash]:::db
  STORE --> LINK2[Create metadata row]:::server`,
          text: 'Many metadata rows (one per user) can point at one stored blob. Delete the blob only when no metadata row references it any more.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Metadata Scaling' },
        {
          type: 'bullets',
          items: [
            'Shard (split) the metadata database by bucket_id or owner_id, so each database server holds only part of the data.',
            'Use a dedicated metadata cluster — metadata is read and written far more often than the file bytes themselves.',
            'Cache frequently accessed metadata in Redis.',
          ],
        },
        { type: 'heading2', text: 'Data Storage Scaling' },
        {
          type: 'bullets',
          items: [
            'Add storage nodes horizontally. Consistent hashing decides which node owns each object, and adding a node only moves a small slice of objects.',
            'Use a distributed block storage layer (e.g., Ceph) under the hood.',
            'Tiered storage: hot data on SSDs (expensive, fast), cold data on HDDs or archive storage (cheap, slow, high latency).',
          ],
        },
        { type: 'heading2', text: 'CDN Scaling' },
        {
          type: 'paragraph',
          text: 'CDNs scale automatically by adding edge nodes globally. No action needed from the application side. Ensure cache-control headers are set correctly (max-age) to maximize CDN cache hit rates.',
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
  U([Users worldwide]):::client --> CDN[Global CDN edges]:::network
  U --> LB[Load Balancer]:::network
  LB --> A1[API 1]:::server & A2[API N]:::server
  A1 & A2 --> RC[(Redis metadata cache)]:::cache
  subgraph META["Metadata cluster - sharded by bucket_id"]
    M1[(Shard 1)]:::db
    M2[(Shard 2)]:::db
    M3[(Shard N)]:::db
  end
  RC -->|"miss"| META
  subgraph DATA["Storage nodes - consistent hashing"]
    HOT[(Hot tier<br/>SSD)]:::db
    COLD[(Cold tier<br/>HDD / archive)]:::db
  end
  CDN -->|"miss"| DATA
  U ==>|"presigned upload"| DATA
  HOT -. "lifecycle: ages out" .-> COLD`,
          text: 'Metadata and data scale separately: metadata by sharding plus a cache, data by simply adding more storage nodes. Old files drift to cheaper storage over time.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Data Integrity — Checksums' },
        {
          type: 'paragraph',
          text: 'A checksum is a short fingerprint of a file (MD5 or SHA-256). The client computes it before uploading. After storing the file, the storage service computes it again and rejects the upload if the two do not match — this catches bits that got flipped in transit. Storage nodes also re-check stored files periodically to catch disks that slowly corrupt data over time ("bit rot").',
        },
        {
          type: 'flow',
          title: 'Checksums at upload time and at rest',
          code: `flowchart TD
  C[Client computes checksum]:::client --> UP[Upload bytes + checksum]:::network
  UP --> S[Storage recomputes checksum]:::server
  S --> M{Match?}
  M -->|Yes| OK[(Stored)]:::db
  M -->|No| ERR[Reject - client retries]:::security
  OK --> SCRUB[Background scrubber<br/>re-checks periodically]:::queue
  SCRUB --> BAD{Corrupted?}
  BAD -->|Yes| FIX[Rebuild from other<br/>replicas or shards]:::highlight
  BAD -->|No| OK`,
        },
        { type: 'heading2', text: 'Consistency Model' },
        {
          type: 'bullets',
          items: [
            'S3 offers strong read-after-write consistency since 2020: after a successful PUT, any GET will return the new version.',
            'Before 2020, S3 was eventually consistent: a GET immediately after PUT might return the old version (or 404 if the object was new).',
            'For your design: use a relational database (RDBMS) for metadata so it is always correct (strong consistency), and accept eventual consistency for the CDN — changed content can take seconds to minutes to reach every edge node.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Byte-Range Requests' },
        {
          type: 'paragraph',
          text: 'HTTP lets you ask for just part of a file: GET /file with the header Range: bytes=0-1048576 fetches only the first 1 MB. This enables resumable downloads (continue from where you left off), video streaming (jump to a specific timestamp), and parallel downloading (fetch several parts at the same time).',
        },
        {
          type: 'flow',
          title: 'Parallel download with byte ranges',
          code: `sequenceDiagram
  participant C as Client
  participant S as Storage / CDN
  par fetch 3 ranges at once
    C->>S: GET Range bytes=0-99MB
    S-->>C: 206 Partial Content
  and
    C->>S: GET Range bytes=100-199MB
    S-->>C: 206 Partial Content
  and
    C->>S: GET Range bytes=200-299MB
    S--xC: connection dropped
    C->>S: GET Range bytes=200-299MB (resume)
    S-->>C: 206 Partial Content
  end
  C->>C: Join ranges into the full file`,
        },
        { type: 'heading2', text: 'Transfer Acceleration' },
        {
          type: 'paragraph',
          text: "Clients upload to the nearest CDN edge node, which then forwards the data to the storage origin over AWS's fast private backbone network instead of the public internet. This cuts upload latency for far-away clients by 50-80%.",
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Replication vs. Erasure Coding' },
        {
          type: 'bullets',
          items: [
            'Replication: Simpler to implement, faster reads (read from nearest replica), higher storage cost (3× for a replication factor of 3).',
            'Erasure Coding: Complex to implement, slower reads/writes (encode/decode CPU cost), much lower storage cost (1.4× for Reed-Solomon 10+4).',
            'Use replication for frequently accessed, latency-sensitive data. Use erasure coding for cold or archival data where storage cost dominates.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing a durability strategy',
          code: `flowchart TD
  Q{How is the data used?}
  Q -->|"Hot - read often,<br/>latency matters"| R[Replication x3<br/>fast reads, 3x storage]:::cache
  Q -->|"Cold - rarely read,<br/>cost matters"| E[Erasure coding 10+4<br/>1.4x storage, more CPU]:::db
  R -. "file ages, lifecycle policy" .-> E`,
        },
        { type: 'heading2', text: 'Upload via API vs. Direct to Storage' },
        {
          type: 'bullets',
          items: [
            'API proxy upload: Simple client code, API has full control. But: every byte flows through the API, so its bandwidth becomes a bottleneck and a cost.',
            'Direct upload via presigned URL: Client uploads to storage directly, no API bandwidth cost. But: harder to validate files before storage.',
            'Recommended: Direct upload with post-upload processing (metadata update, virus scan) triggered asynchronously.',
          ],
        },
        {
          type: 'flow',
          title: 'Proxy upload vs direct upload',
          code: `flowchart LR
  subgraph PROXY["Proxy - API carries the bytes"]
    C1([Client]):::client ==>|"5 GB"| A1[API]:::server ==>|"5 GB"| S1[(Storage)]:::db
  end
  subgraph DIRECT["Direct - presigned URL"]
    C2([Client]):::client -->|"tiny request"| A2[API]:::server
    C2 ==>|"5 GB"| S2[(Storage)]:::db
    S2 -.->|"event: scan + update metadata"| A2
  end`,
          text: 'With direct upload the API handles only small JSON requests, so a few API servers can support huge upload volumes.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Security' },
        {
          type: 'bullets',
          items: [
            'Encrypt data at rest (AES-256).',
            'Encrypt data in transit (TLS 1.2+).',
            'Server-side encryption with customer-managed keys (BYOK — "bring your own key") for compliance.',
            'Access logging: Record every download for audit trails.',
            'Malware scanning: Run uploaded files through a virus scanner before making them accessible.',
          ],
        },
        { type: 'heading2', text: 'Cost Optimization' },
        {
          type: 'bullets',
          items: [
            'Lifecycle policies: Automatically move files from hot → warm → cold → archive storage as they age.',
            'Intelligent tiering: Automatically move objects between tiers based on access frequency.',
            'CDN caching: Reduce origin egress costs (the fee for data leaving your storage) — CDN-served requests are cheaper than origin-served.',
          ],
        },
        {
          type: 'flow',
          title: 'Lifecycle policy — data gets cheaper as it ages',
          code: `flowchart LR
  H[Hot - SSD<br/>0-30 days]:::cache -->|"30 days"| W[Warm - infrequent access<br/>30-90 days]:::server
  W -->|"90 days"| CO[Cold - HDD<br/>90-365 days]:::db
  CO -->|"1 year"| AR[Archive - Glacier<br/>minutes to hours to read]:::external`,
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you design a system that stores 1 billion files with 11 nines of durability?',
            'How do you implement resumable uploads for large files?',
            'How do you secure access to private files?',
            'Explain erasure coding vs. replication.',
            'How does a CDN work and where does it fit in your design?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Presigned URLs: upload directly from client to storage, bypass API layer.',
            'Chunked upload for reliability (resume on failure).',
            'Erasure coding for durability without 3× storage cost.',
            'Content-addressed storage for deduplication.',
            'Separate metadata and data stores — different access patterns, different scaling needs.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify<br/>file sizes, scale, durability]:::client --> B[Split metadata<br/>from file bytes]:::server
  B --> C[Upload path<br/>presigned + multipart]:::server
  C --> D[Download path<br/>CDN + presigned]:::network
  D --> E[Durability<br/>replication vs erasure coding]:::highlight
  E --> F[Scale + cost<br/>sharding, tiers, dedup]:::db`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Emphasize that the API Service never handles actual file bytes — presigned URLs route uploads/downloads directly to/from the storage layer. This is a key insight that shows you understand how production object storage works.',
        },
      ],
    },
  ],
};
