import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 10 — How Files are Uploaded and Downloaded
// ─────────────────────────────────────────────────────────────────────────────
export const howFilesWork: CoreConcept = {
  id: 'how-files-work',
  title: 'How Files are Uploaded and Downloaded',
  emoji: '💾',
  icon: 'ti-upload',
  color: '#7c3aed',
  bg: '#ede9fe',
  accentGlow: 'rgba(124,58,237,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Multipart uploads, presigned URLs, S3 object storage, streaming — the complete picture of file handling.',
  tags: ['Multipart Upload', 'Presigned URLs', 'Object Storage', 'Streaming', 'Byte Ranges'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'File upload and download seems simple — send a file, receive a file. But with large files, slow or flaky connections, and storage spread across many machines, it becomes one of the trickiest parts of a web application. This concept covers: how browsers send files over HTTP, how servers receive and store them, how cloud object storage (like Amazon S3) works, and how to serve files back to users efficiently.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: think of shipping furniture to a warehouse. You would not carry a sofa through the front office. Instead, the front desk (your API server) checks your paperwork and hands you a temporary gate pass (a presigned URL). You then drive straight to the warehouse loading dock (object storage). Later, local pick-up points (a CDN) keep copies so customers can collect items close to home.',
        },
        {
          type: 'flow',
          title: 'The big picture — the API handles permission, storage handles the bytes',
          code: `flowchart LR
  U([Browser]):::client -->|"1. may I upload photo.jpg?"| API[API server]:::server
  API -->|"2. presigned URL"| U
  U ==>|"3. file bytes, direct"| S3[(Object storage<br/>S3)]:::db
  S3 -.->|"4. upload event"| W[Worker<br/>scan, thumbnail]:::queue
  W -->|"5. mark ready"| DB[(Metadata DB)]:::db
  S3 --> CDN[CDN edge]:::network
  CDN -->|"6. fast downloads"| V([Viewers]):::client`,
          text: 'The heavy file bytes never pass through your API server. It only hands out permission slips and keeps track of metadata.',
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
          text: 'File handling is everywhere: profile pictures, document uploads, video uploads, data exports, report downloads. Each use case needs a different approach. A profile picture is small (under 5 MB) and can be checked right away. A 4K video might be 10 GB, so it must be uploaded in chunks that can resume after a dropped connection. A nightly data export should be streamed — sent piece by piece — rather than loaded into memory all at once.',
        },
        {
          type: 'flow',
          title: 'Picking the right approach',
          code: `flowchart TD
  F([A file needs to move]):::client --> D{Upload or download?}:::highlight
  D -->|"upload"| SZ{Bigger than ~100 MB?}:::server
  SZ -->|"no"| SIMPLE["Single PUT to a presigned URL"]:::db
  SZ -->|"yes"| CHUNK["Chunked multipart upload<br/>resumable"]:::db
  D -->|"download"| POP{Popular or public?}:::server
  POP -->|"yes"| CDN["Serve from a CDN"]:::network
  POP -->|"no, large or private"| STREAM["Stream in chunks<br/>or a signed download URL"]:::cache`,
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'How Browsers Send Files: multipart/form-data' },
        {
          type: 'paragraph',
          text: 'When a browser submits a form with a file input, it uses the multipart/form-data encoding. The request body is split into "parts" — one per form field — separated by a unique marker called the boundary string. Each part has its own small headers (Content-Disposition says which field it is and the file name; Content-Type says what kind of data it is), followed by the data itself: plain text for normal fields, raw binary bytes for the file.',
        },
        {
          type: 'code',
          lang: 'http',
          code: `POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----Boundary7MA4YWxkTrZu0gW

------Boundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

My holiday photo
------Boundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="photo"; filename="beach.jpg"
Content-Type: image/jpeg

[binary data of the JPEG file]
------Boundary7MA4YWxkTrZu0gW--`,
        },
        { type: 'heading2', text: 'Chunked / Multipart Upload for Large Files' },
        {
          type: 'paragraph',
          text: 'For large files (videos, datasets), sending the whole file in one request is unreliable: if the network drops at 95%, you start over from zero. Chunked upload breaks the file into small pieces (e.g., 8 MB each) and uploads each one separately. A failed chunk is simply retried on its own. Resumable uploads also remember which chunks already arrived, so after a disconnection you continue where you left off.',
        },
        {
          type: 'flow',
          title: 'Chunked upload with retries',
          code: `flowchart TD
  F([Large file]):::client --> SPLIT["Split into 8 MB chunks"]:::server
  SPLIT --> NEXT["Upload next chunk"]:::network
  NEXT --> OK{Chunk accepted?}:::highlight
  OK -->|"no, network error"| RETRY["Retry only this chunk"]:::cache
  RETRY --> NEXT
  OK -->|"yes"| MORE{More chunks left?}
  MORE -->|"yes"| NEXT
  MORE -->|"no"| DONE["Complete: storage<br/>joins chunks into one file"]:::db`,
        },
        { type: 'heading2', text: 'Object Storage (S3-like)' },
        {
          type: 'paragraph',
          text: 'A traditional file system — folders on a single hard drive — does not scale to petabytes spread over thousands of servers. Object storage takes a simpler approach. Each file is stored as an "object" under a unique key (a name like uploads/uuid-photo.jpg), copies are spread across many storage machines, and you access it with plain HTTP: PUT to upload, GET to download. Amazon S3, Google Cloud Storage and Azure Blob Storage are all object stores.',
        },
        {
          type: 'flow',
          title: 'Object storage — a key in, bytes out',
          code: `flowchart LR
  C([Client]):::client -->|"PUT or GET uploads/uuid-photo.jpg"| GW[S3 HTTP endpoint]:::network
  GW --> IDX[(Key index<br/>which nodes hold it?)]:::cache
  IDX --> N1[(Storage node A)]:::db
  IDX --> N2[(Storage node B)]:::db
  IDX --> N3[(Storage node C)]:::db`,
          text: 'There are no real folders — just a key mapped to bytes, stored as several copies on different machines so a single failure loses nothing.',
        },
        { type: 'heading2', text: 'Presigned URLs — Secure Direct Upload' },
        {
          type: 'paragraph',
          text: 'The naive pattern is client → API server → S3. Here the API server has to receive the entire file first, which costs bandwidth, uses up memory, and adds delay. The better pattern uses a presigned URL: a normal S3 link with a cryptographic signature and an expiry time added to it, which grants permission to upload one specific file. The client asks the API server for one, the server signs it with its S3 credentials (without sharing them), and the client uploads directly to S3. The API server never touches the file bytes.',
        },
        {
          type: 'flow',
          title: 'Naive proxy vs presigned URL',
          code: `flowchart TB
  subgraph Naive["Naive: file goes through the API"]
    C1([Client]):::client ==>|"10 GB"| A1[API server<br/>busy and memory-hungry]:::highlight
    A1 ==>|"10 GB again"| S1[(S3)]:::db
  end
  subgraph Better["Presigned: file skips the API"]
    C2([Client]):::client -->|"tiny metadata request"| A2[API server]:::server
    A2 -->|"signed URL, 15 min"| C2
    C2 ==>|"10 GB, direct"| S2[(S3)]:::db
  end`,
        },
        { type: 'heading2', text: 'Streaming vs. Loading into Memory' },
        {
          type: 'paragraph',
          text: 'When a user downloads a 1 GB file, you do NOT load the whole 1 GB into server memory before sending it. You stream it: read a chunk from storage, send it to the client, read the next chunk, and repeat. This way the server only ever holds about one chunk (~8 MB) in memory, no matter how big the file is. With many users downloading at once, this is the difference between a healthy server and one that runs out of memory.',
        },
        {
          type: 'flow',
          title: 'Streaming — one chunk in memory at a time',
          code: `flowchart LR
  ST[(Storage<br/>1 GB file)]:::db -->|"read 8 MB"| BUF["Server buffer<br/>about 8 MB"]:::server
  BUF -->|"send chunk"| CL([Client]):::client
  CL -.->|"ready for more"| BUF
  BUF -.->|"read next chunk"| ST`,
          text: 'Memory use stays flat at the chunk size instead of growing with the file size.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'File Upload Flow (Presigned URL Pattern)' },
        {
          type: 'numbered',
          items: [
            'User selects a file in the browser. Client JS gets file metadata (name, size, type).',
            'Client calls: POST /api/upload-url {filename: "photo.jpg", contentType: "image/jpeg", size: 2048576}',
            'API Server validates: auth token, file type whitelist (image/jpeg only), size limit (< 10 MB).',
            'API Server generates a presigned S3 PUT URL (valid for 15 minutes): https://my-bucket.s3.amazonaws.com/uploads/uuid-photo.jpg?X-Amz-Signature=...',
            'API Server creates a pending record in the database: {fileId: "uuid", status: "pending", ownerId: 123}',
            'API Server returns the presigned URL and fileId to the client.',
            'Client uploads the file binary directly to the S3 presigned URL (PUT request).',
            'S3 validates the signature and stores the file.',
            'S3 triggers an event notification (to SQS/Lambda): "Object uuid-photo.jpg uploaded."',
            'Backend Lambda/worker receives the event: validate file, generate thumbnail, virus scan.',
            'Worker updates database record: {status: "ready", url: "https://cdn.myapp.com/uploads/uuid-photo.jpg"}',
            'Client polls or receives webhook: file is ready, display to user.',
          ],
        },
        {
          type: 'flow',
          title: 'Presigned upload, end to end',
          code: `sequenceDiagram
  participant B as Browser
  participant API as API server
  participant DB as Database
  participant S3
  participant W as Worker
  B->>API: POST /api/upload-url with name, type, size
  Note over API: check auth, type allowlist, size limit
  API->>DB: insert file record, status pending
  API-->>B: presigned PUT URL (15 min) and fileId
  B->>S3: PUT file bytes to presigned URL
  Note over S3: verify signature, store object
  S3-)W: event: object uploaded
  Note over W: validate, virus scan, thumbnail
  W->>DB: status ready, CDN url
  B->>API: poll: is fileId ready?
  API-->>B: ready, show the file`,
          text: 'Notice the API server only exchanges small JSON messages. The file itself goes straight from the browser to S3.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'HTTP Range Requests — The Basis of Streaming' },
        {
          type: 'code',
          lang: 'http',
          code: `# Request a specific byte range of a file
GET /video/movie.mp4 HTTP/1.1
Range: bytes=10485760-20971519  (10 MB to 20 MB)

# Server responds with just that range
HTTP/1.1 206 Partial Content
Content-Range: bytes 10485760-20971519/104857600
Content-Length: 10485760
Content-Type: video/mp4

[10 MB of video data]

# This is how video players seek to a specific timestamp
# without downloading the entire file first.`,
        },
        {
          type: 'flow',
          title: 'Seeking in a video with range requests',
          code: `sequenceDiagram
  participant P as Video player
  participant S as File server or CDN
  P->>S: GET movie.mp4, Range bytes 0 to 10 MB
  S-->>P: 206 Partial Content, first 10 MB
  Note over P: user drags to the middle
  P->>S: GET movie.mp4, Range bytes 50 MB to 60 MB
  S-->>P: 206 Partial Content, just that slice`,
          text: 'The player asks only for the bytes it needs. A status of 206 (instead of 200) means "here is part of the file".',
        },
        { type: 'heading2', text: 'CDN for File Serving' },
        {
          type: 'paragraph',
          text: 'Never serve large files from your origin server (your own servers or S3 bucket) directly to every user. Use a CDN (Content Delivery Network) — a network of cache servers, called edge nodes, placed in cities around the world. The first time someone in a region asks for a file, the nearby edge fetches it from the origin and keeps a copy. Everyone after that in the same region downloads it from the edge — much faster, and with no extra load on your origin.',
        },
        {
          type: 'flow',
          title: 'CDN — hit or miss',
          code: `flowchart LR
  U([User in Paris]):::client --> E{Paris edge:<br/>file cached?}:::network
  E -->|"hit"| FAST["Served from Paris<br/>fast, origin untouched"]:::highlight
  E -->|"miss, first request"| O[(Origin<br/>S3 bucket)]:::db
  O -->|"copy cached at edge"| E`,
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'YouTube-style Video Upload' },
        {
          type: 'numbered',
          items: [
            'Creator selects a 4 GB video file.',
            'Browser JS splits it into 500 chunks of 8 MB each.',
            'Client initiates multipart upload: POST /initiate-upload → get uploadId.',
            'For each chunk: PUT /upload-part?uploadId=X&partNumber=N with 8 MB of data.',
            'If network drops, resume from the last successful part number.',
            'After all 500 parts uploaded: POST /complete-upload → S3 assembles the file.',
            'Transcoding pipeline begins: encode to 360p, 480p, 720p, 1080p in parallel.',
            'Each quality is split into 6-second HLS segments and uploaded to S3/CDN.',
            'Creator is notified: "Your video is ready."',
            'Viewers stream using HLS — downloading only the segments they are watching, at the quality their bandwidth supports.',
          ],
        },
        {
          type: 'flow',
          title: 'YouTube-style pipeline',
          code: `flowchart TB
  CR([Creator: 4 GB video]):::client -->|"500 parts of 8 MB<br/>resumable"| S3[(S3 raw upload)]:::db
  S3 -->|"upload complete event"| Q[[Transcode queue]]:::queue
  Q --> T1[Encode 360p]:::server
  Q --> T2[Encode 720p]:::server
  Q --> T3[Encode 1080p]:::server
  T1 --> SEG["Split into 6-second<br/>HLS segments"]:::server
  T2 --> SEG
  T3 --> SEG
  SEG --> CDN[CDN]:::network
  CDN -->|"only the segments being watched"| V([Viewers]):::client`,
          text: 'HLS (HTTP Live Streaming) lets the player switch quality segment by segment as the viewer’s bandwidth changes.',
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
          title: 'At a glance — upload path and download path',
          code: `flowchart LR
  subgraph Upload["Upload"]
    C([Client]):::client -->|"1. metadata only"| API[API server<br/>signs URL]:::security
    API -->|"2. presigned URL"| C
    C ==>|"3. direct PUT"| S3[(Object storage)]:::db
    S3 -.->|"4. event"| W[Worker]:::queue
  end
  subgraph Download["Download"]
    W -->|"5. ready"| CDN[CDN edge]:::network
    CDN -->|"range requests"| V([Viewers]):::client
  end`,
          text: 'Uploads go straight to storage with a short-lived permission. Downloads come from the CDN closest to the viewer.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-file-storage-flow',
            title: 'Direct-to-Storage Presigned Upload & Streaming Architecture',
            subtitle:
              'Bypassing API server bandwidth bottlenecks with S3 Presigned URLs, multipart streaming, and edge delivery',
            nodes: [
              {
                id: 'uploader-client',
                name: 'Client Browser / Application',
                subtitle: 'User Selects 500MB File',
                type: 'client',
                icon: 'ti-file-upload',
                badge: 'Client File',
                protocol: 'Metadata Request',
                details: [
                  'Reads file metadata locally: name: "video.mp4", size: 524288000 bytes, type: "video/mp4"',
                  'Does NOT upload file bytes to API server; requests upload authorization first',
                ],
              },
              {
                id: 'api-authorization',
                name: 'API Server (Presigned URL Generator)',
                subtitle: 'Cryptographic URL Generator',
                type: 'gateway',
                icon: 'ti-key',
                badge: 'Auth Server',
                protocol: 'HMAC-SHA256 Sign',
                details: [
                  'Authenticates user permissions and validates file extension and size quota',
                  'Generates temporary AWS S3 Presigned URL signed with AWS Secret Key (valid 15 minutes)',
                  'Returns presigned URL and fileId to client in < 20ms with ZERO file bytes passing through API server',
                ],
              },
              {
                id: 'cloud-object-store',
                name: 'Cloud Object Storage (AWS S3 / GCS)',
                subtitle: 'Scalable Distributed Blob Store',
                type: 'storage',
                icon: 'ti-cloud-upload',
                badge: 'Object Store',
                protocol: 'Direct PUT Stream',
                details: [
                  'Client uploads file bytes directly to S3 via HTTP PUT with Content-Type: video/mp4',
                  'For files > 100MB: client splits file into 10MB chunks and uploads in parallel via S3 Multipart Upload',
                  'Stores object across multiple availability zones with 99.999999999% (11 9s) durability',
                ],
              },
              {
                id: 's3-event-worker',
                name: 'Async Event Worker (Lambda / Queue)',
                subtitle: 'Post-Upload Background Processing',
                type: 'server',
                icon: 'ti-bolt',
                badge: 'Event Worker',
                protocol: 's3:ObjectCreated',
                details: [
                  'S3 fires event notification webhook upon successful upload completion',
                  'Worker validates file magic numbers (prevents renamed malware), runs virus scan, and transcodes video',
                  'Updates metadata record in primary database: status = "READY"',
                ],
              },
              {
                id: 'cdn-download-edge',
                name: 'Global CDN & Download Delivery',
                subtitle: 'CloudFront Edge Distribution',
                type: 'database',
                icon: 'ti-cloud-download',
                badge: 'Download Edge',
                protocol: 'Range Requests / CDN',
                details: [
                  'Public downloads served from nearest CDN edge node; caches popular files globally',
                  'Private files protected by signed CloudFront cookies or signed download URLs',
                  'Supports HTTP Range requests (206 Partial Content) for seeking video playback',
                ],
              },
            ],
            connections: [
              {
                from: 'uploader-client',
                to: 'api-authorization',
                label: '1. POST /api/upload-url (Metadata only)',
                protocol: 'JSON REST',
              },
              {
                from: 'api-authorization',
                to: 'uploader-client',
                label: '2. Return Presigned S3 URL',
                protocol: '200 OK',
              },
              {
                from: 'uploader-client',
                to: 'cloud-object-store',
                label: '3. Direct PUT Stream (Bypass API)',
                protocol: 'Binary Stream',
              },
              {
                from: 'cloud-object-store',
                to: 's3-event-worker',
                label: '4. s3:ObjectCreated Event',
                protocol: 'Async Webhook',
              },
              {
                from: 's3-event-worker',
                to: 'cdn-download-edge',
                label: '5. Ready for Global CDN Delivery',
                protocol: 'Edge Sync',
              },
            ],
            keyTakeaways: [
              'Presigned URLs are Essential: Uploading files through your API server consumes server RAM, ties up worker threads, and racks up costly bandwidth. Presigned URLs offload 100% of binary file transfer to S3.',
              'Multipart Upload: For files > 100MB, multipart uploads upload chunks concurrently (faster) and can retry individual failed chunks without restarting the entire 500MB upload from scratch.',
              'Streaming vs Buffering: When reading or downloading files in backend code, always stream chunks using streams or pipes. Buffering an entire 1GB file into RAM will crash your Node.js or Python process with an out-of-memory error.',
            ],
            rawSpec: `UPLOAD (Presigned URL pattern):
Browser ──POST /api/upload-url──> API Server
                                      │
                                      │ Generate presigned URL
                                      │
Browser <── {presignedUrl, fileId} ──┘
  │
  │  PUT <presigned S3 URL> (file bytes)
  ▼
S3 (validates signature, stores file)
  │
  │  Event notification
  ▼
Lambda/Worker (validate, thumbnail, virus scan)
  │
  │  Update DB: status = "ready"
  ▼
Database

DOWNLOAD (CDN pattern):
Browser ──GET /files/photo.jpg──> CloudFront CDN
                                      │
                                      │ (Cache HIT)
                                      ▼
Browser <── 200 OK (file bytes) ──────┘`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Checksums for Data Integrity' },
        {
          type: 'paragraph',
          text: 'File data can be corrupted in transit (network errors, partial writes). A checksum is a short "fingerprint" calculated from a file’s bytes (using an algorithm like MD5 or SHA-256) — change even one byte and the fingerprint changes. Compute it before upload and check it after. S3 supports this via the Content-MD5 header: if the bytes it received do not produce the same fingerprint, S3 rejects the upload. For large multipart uploads, each part has its own checksum and S3 verifies each one separately.',
        },
        { type: 'heading2', text: 'Storage Tiers and Cost Optimization' },
        {
          type: 'bullets',
          items: [
            'S3 Standard: Frequently accessed files. Milliseconds retrieval. Expensive.',
            'S3 Standard-IA (Infrequent Access): Lower cost for files accessed monthly. Small retrieval fee.',
            'S3 Glacier: For archival. Retrievals take minutes to hours. Very cheap.',
            'S3 Lifecycle policies: Automatically move objects: Standard → IA after 30 days → Glacier after 90 days → Delete after 7 years.',
          ],
        },
        {
          type: 'flow',
          title: 'A lifecycle policy moving files to cheaper storage',
          code: `flowchart LR
  STD["S3 Standard<br/>hot, fast, pricey"]:::highlight -->|"after 30 days"| IA["Standard-IA<br/>cheaper, retrieval fee"]:::cache
  IA -->|"after 90 days"| GL["Glacier<br/>very cheap, slow to restore"]:::db
  GL -->|"after 7 years"| DEL["Deleted"]`,
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
            'Myth: "Files should be stored in the database." Reality: Storing large files (BLOBs) in PostgreSQL bloats the database, slows backups, and is massively inefficient. Use object storage (S3) and store only the file URL in the database.',
            'Myth: "My API server should handle file uploads." Reality: API servers are not designed for large file transfers. They tie up connections, consume memory, and create a bandwidth bottleneck. Use presigned URLs for direct client-to-storage uploads.',
            'Myth: "Downloading a file loads it all into memory." Reality: Streaming reads and sends data in chunks. A 100 GB download uses only ~8 MB of server memory at any moment.',
            'Myth: "File upload is complete when the browser says so." Reality: The upload to your API server is complete, but the file may still need processing (virus scan, format validation, transcoding). Always validate server-side before marking a file as "ready."',
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
          type: 'bullets',
          items: [
            'Designing a file storage system (Dropbox/S3): Chunked upload, metadata database separate from data, deduplication using content hash, CDN for serving.',
            'Video processing pipeline: Upload → Kafka event → Transcoding workers (GPU) → Multiple quality levels → CDN.',
            'Image processing: Upload → Lambda triggered by S3 event → Generate thumbnails (multiple sizes) → Store back in S3.',
            'Cost optimization: Pre-signed uploads bypass API bandwidth cost. CDN caching reduces S3 GET request costs. Lifecycle policies reduce storage cost over time.',
            'Security: Validate file type on server (never trust client-side validation). Virus scan uploaded files. Use private S3 buckets with presigned URLs for access-controlled files.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'In system design interviews, always suggest presigned URLs for file uploads. It shows you understand: security (no credential exposure), efficiency (bypass API layer), scalability (S3 scales infinitely), and cost (no API bandwidth for file data). This one pattern demonstrates all four system design priorities at once.',
        },
      ],
    },
  ],
};
