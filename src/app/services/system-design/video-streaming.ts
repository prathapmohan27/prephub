import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 8 — Video Streaming Platform (YouTube-like)
// ─────────────────────────────────────────────────────────────────────────────
export const videoStreaming: SystemDesignSystem = {
  id: 'video-streaming',
  title: 'Video Streaming Platform',
  icon: 'ti-player-play',
  color: '#ef4444',
  bg: '#fee2e2',
  accentGlow: 'rgba(239,68,68,0.15)',
  difficulty: 'Advanced',
  tagline:
    'Video encoding pipelines, adaptive bitrate streaming, CDN delivery, and billion-scale view counts.',
  tags: ['HLS/DASH', 'Adaptive Bitrate', 'Transcoding', 'CDN', 'Blob Storage'],
  estimatedTime: '70 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A video streaming platform like YouTube or Netflix. Users can upload videos, which are processed and made available for streaming at different quality levels. Other users can search, discover, and stream videos with adaptive quality based on their network speed.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is like a publisher turning one manuscript into many editions — large print, paperback, pocket size — and stocking every local bookshop with them. The upload is converted once into several qualities and cut into small pieces, copies are kept in shops (CDN servers) near every viewer, and the video player keeps choosing the edition that fits through the viewer\'s internet "door" right now.',
        },
        {
          type: 'flow',
          title: 'The big picture — process once, watch everywhere',
          code: `flowchart LR
  CR([Creator uploads]):::client ==>|"raw video"| OS[(Object Storage)]:::db
  OS --> TC[Transcoding workers<br/>360p ... 4K, cut into segments]:::server
  TC --> OS2[(Encoded segments)]:::db
  OS2 --> CDN[CDN edges<br/>near viewers]:::network
  V([Viewers]):::client -->|"small segments,<br/>best quality that fits"| CDN`,
          text: 'Uploading and processing happen once per video. Watching happens billions of times a day, almost entirely from CDN servers close to the viewer.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Video upload (up to 4K, up to 10 GB).',
            'Video processing: transcode to multiple resolutions (360p, 480p, 720p, 1080p, 4K).',
            'Adaptive bitrate streaming — quality adjusts to network speed automatically.',
            'Video search and discovery.',
            'View count, likes, comments.',
            'Video recommendations.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '5 million videos uploaded per day.',
            '5 billion video views per day.',
            'Processing SLA: video available for streaming within 5 minutes of upload.',
            'Video start latency: < 2 seconds.',
            'No buffering for users on 5 Mbps+ connections.',
            'Global availability.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Video Codec and Container Formats' },
        {
          type: 'bullets',
          items: [
            'Codec: The algorithm that compresses video (to make it small) and decompresses it (to play it). H.264 (AVC): plays almost everywhere. H.265 (HEVC): files ~50% smaller than H.264 at the same quality, but requires licensing. AV1: open source, smallest files, slowest to encode.',
            'Container: The file "envelope" that holds the encoded video + audio + metadata together. MP4: most compatible. WebM: open source, Chrome-native. TS (MPEG-TS): used for live streaming segments.',
            'For streaming: Transcode (convert) to H.264 video in an MP4/TS container for maximum compatibility.',
          ],
        },
        {
          type: 'flow',
          title: 'Codec vs container',
          code: `flowchart LR
  RAW[Raw camera footage<br/>huge]:::client --> COD[Codec compresses<br/>H.264 / H.265 / AV1]:::server
  AUD[Audio track]:::client --> AC[Audio codec<br/>AAC]:::server
  COD --> CON[Container wraps it all<br/>MP4 / WebM / TS]:::highlight
  AC --> CON
  META[Subtitles, metadata]:::client --> CON
  CON --> PLAY([Playable file]):::network`,
          text: 'The codec decides how small the video gets. The container is just the box that keeps video, audio and extras together.',
        },
        { type: 'heading2', text: 'Adaptive Bitrate Streaming (ABR)' },
        {
          type: 'paragraph',
          text: "Bitrate is how many bits per second a video needs — higher quality means a higher bitrate. Instead of streaming one fixed-quality file, ABR cuts the video into short segments (2-10 seconds each) and stores every segment at several quality levels. The player keeps measuring the viewer's download speed and picks the quality for each next segment. If the connection slows down, it switches to a lower quality (smaller files). When the connection improves, it switches back up.",
        },
        {
          type: 'flow',
          title: 'Adaptive bitrate — quality follows the network',
          code: `sequenceDiagram
  participant P as Player
  participant C as CDN
  P->>C: segment 1 at 360p (start fast)
  C-->>P: downloaded quickly - bandwidth looks good
  P->>C: segment 2 at 1080p
  C-->>P: OK
  Note over P,C: Viewer walks into a weak Wi-Fi area
  P->>C: segment 3 at 1080p
  C-->>P: arrived too slowly - buffer shrinking
  P->>C: segment 4 at 480p
  C-->>P: OK, no stall
  Note over P,C: Network recovers
  P->>C: segment 5 at 720p, then 1080p`,
          text: 'Each segment is a fresh decision. Viewers see quality change for a moment instead of a frozen spinner.',
        },
        { type: 'heading2', text: 'HLS (HTTP Live Streaming)' },
        {
          type: 'paragraph',
          text: "HLS is Apple's streaming protocol and now the industry standard. It uses plain text playlist files called manifests (.m3u8). A master manifest lists every quality level. Each quality level has its own playlist listing its segment URLs in order. The player downloads the master manifest, picks a quality, and then downloads segments one by one as it plays.",
        },
        {
          type: 'code',
          lang: 'text',
          code: `# Master Playlist (index.m3u8)
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

# Per-quality playlist (720p/playlist.m3u8)
#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-VERSION:3
#EXTINF:6.0,
seg_001.ts
#EXTINF:6.0,
seg_002.ts ...`,
        },
        {
          type: 'flow',
          title: 'How HLS files fit together',
          code: `flowchart TB
  M["index.m3u8<br/>master manifest"]:::highlight --> P1["360p/playlist.m3u8"]:::server
  M --> P2["720p/playlist.m3u8"]:::server
  M --> P3["1080p/playlist.m3u8"]:::server
  P2 --> S1["seg_001.ts<br/>0-6 s"]:::db
  P2 --> S2["seg_002.ts<br/>6-12 s"]:::db
  P2 --> S3["seg_003.ts<br/>12-18 s"]:::db`,
          text: 'Master manifest → one playlist per quality → many small segment files. Switching quality just means reading the next segment from a different playlist.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Upload & Processing Pipeline' },
        {
          type: 'numbered',
          items: [
            'Creator uploads raw video file to Upload Service (chunked, presigned URL to Object Storage).',
            'Upload Service publishes "video_uploaded" event to Kafka.',
            'Transcoding Orchestrator consumes event, creates transcoding jobs for each resolution.',
            'Transcoding Workers (FFmpeg-based, GPU-accelerated) encode the video into segments at each quality level.',
            'Encoded segments uploaded to Object Storage (S3 equivalent).',
            'CDN automatically caches segments as they are requested.',
            'Metadata Service updates video status to "ready" in Video DB.',
            'Creator notified via push notification.',
          ],
        },
        {
          type: 'flow',
          title: 'Upload and processing pipeline',
          code: `sequenceDiagram
  actor CR as Creator
  participant U as Upload Service
  participant OS as Object Storage
  participant K as Kafka
  participant O as Transcode Orchestrator
  participant W as Transcode Workers
  participant M as Metadata Service
  CR->>U: Start upload
  U-->>CR: presigned URL
  CR->>OS: PUT raw video (chunked)
  U--)K: video_uploaded
  K--)O: event
  O->>W: one job per resolution and chunk
  W->>OS: read raw video
  W->>OS: write HLS segments + playlists
  W-->>O: all jobs done
  O->>M: status = ready
  M--)CR: push notification: your video is live`,
          text: 'Every step after the upload is asynchronous, so the creator is never stuck waiting on a spinning progress bar for transcoding.',
        },
        { type: 'heading2', text: 'Streaming Architecture' },
        {
          type: 'bullets',
          items: [
            'Viewer requests video page → Metadata Service returns video info + master playlist URL (pointing to CDN).',
            'Player fetches master playlist from CDN → gets list of quality variants.',
            'Player selects quality based on network speed, downloads segments from CDN.',
            'CDN serves segments from edge cache. Cache miss: CDN fetches from Object Storage (origin).',
            'Player monitors download speed. If segment takes too long, next segment is fetched at lower quality.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  CR([Creator]):::client ==>|"raw upload"| OS[(Object Storage)]:::db
  CR --> US[Upload Service]:::server
  US -.-> K[[Kafka]]:::queue
  K -.-> TO[Transcode Orchestrator]:::server
  TO --> TW[GPU Transcode Workers]:::server
  TW <--> OS
  TO --> MS[Metadata Service]:::server
  MS --> VDB[(Video DB)]:::db
  V([Viewer]):::client -->|"video page"| MS
  V ==>|"manifest + segments"| CDN[CDN]:::network
  CDN -->|"miss"| OS`,
          text: 'Two separate paths: the write path (top) turns uploads into segments; the read path (bottom) is almost entirely CDN. They share only Object Storage and the Metadata Service.',
        },
        {
          type: 'flow',
          title: 'Pressing play',
          code: `sequenceDiagram
  actor V as Viewer
  participant MS as Metadata Service
  participant C as CDN Edge
  participant OS as Object Storage
  V->>MS: GET /watch/video_id
  MS-->>V: title, thumbnail, master playlist URL
  V->>C: GET index.m3u8
  C-->>V: list of qualities
  V->>V: Measure bandwidth, choose 720p
  loop every segment
    V->>C: GET 720p/seg_N.ts
    alt cached at edge
      C-->>V: segment
    else cache miss
      C->>OS: fetch segment
      OS-->>C: segment
      C-->>V: segment (and keep a copy)
    end
  end`,
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Transcoding at Scale' },
        {
          type: 'paragraph',
          text: 'Transcoding (converting a video into other formats and resolutions) is very CPU-intensive. Doing it for 5M videos a day — some of them hour-long 4K files — needs massive parallel processing.',
        },
        {
          type: 'bullets',
          items: [
            'Parallelism at the video level: Multiple workers each transcoding a different video.',
            'Parallelism within a video: Split the raw video into independent chunks and transcode each chunk on a different worker, then join the results. Chunks must be cut on GOP boundaries (a GOP, or Group of Pictures, is a run of frames that can be decoded without looking at earlier frames). A 1-hour video can be transcoded in 10 minutes instead of 1 hour.',
            'Resolution parallelism: Transcode 360p, 720p, 1080p simultaneously on different workers.',
            'Hardware acceleration: Use GPU-accelerated transcoding (NVENC on NVIDIA GPUs) for 10-40× speedup vs. CPU-only.',
          ],
        },
        {
          type: 'flow',
          title: 'Split, transcode in parallel, stitch',
          code: `flowchart TB
  RAW[1-hour raw video]:::client --> SPLIT[Split on GOP boundaries<br/>into 6 x 10-min chunks]:::server
  SPLIT --> C1[Chunk 1]:::queue & C2[Chunk 2]:::queue & C6[Chunk 6]:::queue
  C1 --> W1[Worker: 360p, 720p, 1080p]:::server
  C2 --> W2[Worker: 360p, 720p, 1080p]:::server
  C6 --> W6[Worker: 360p, 720p, 1080p]:::server
  W1 & W2 & W6 --> JOIN[Stitch + write playlists]:::server
  JOIN --> OUT([Ready in ~10 min<br/>instead of ~1 hour]):::highlight`,
          text: 'Cutting on GOP boundaries is what makes chunks independent — each one can be encoded without knowing anything about its neighbours.',
        },
        { type: 'heading2', text: 'Video Metadata Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE videos (
  video_id       UUID PRIMARY KEY,
  uploader_id    UUID NOT NULL,
  title          VARCHAR(100),
  description    TEXT,
  duration_secs  INT,
  status         VARCHAR(20), -- uploading, processing, ready, failed
  visibility     VARCHAR(10), -- public, unlisted, private
  view_count     BIGINT DEFAULT 0,
  like_count     INT DEFAULT 0,
  master_playlist_url TEXT,
  thumbnail_url  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'View Count at Scale' },
        {
          type: 'paragraph',
          text: '5 billion views/day = 58K increments/second. Updating the database row on every view would overwhelm it. Instead, count views in Redis first (one INCR per view, per video), then write the totals to the database in batches every 60 seconds. View counts that lag by a minute or so are perfectly acceptable.',
        },
        {
          type: 'flow',
          title: 'Buffered view counting',
          code: `flowchart LR
  V1([View]):::client --> R[(Redis<br/>INCR views:video_id)]:::cache
  V2([View]):::client --> R
  V3([58K views per sec]):::client --> R
  R -->|"every 60 s:<br/>read and reset counters"| F[Flush job]:::queue
  F -->|"1 UPDATE per video<br/>view_count += N"| DB[(Video DB)]:::db`,
          text: 'Thousands of views of the same video turn into a single database write per minute.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'CDN as the Primary Scaling Mechanism' },
        {
          type: 'paragraph',
          text: 'A video segment is typically 2-8 MB and is watched by many viewers. For popular content, the CDN already has ~99% of requested segments cached. So almost all video bytes come from CDN edges — your own servers only handle cache misses and brand-new content. The CDN does the heavy lifting at scale.',
        },
        { type: 'heading2', text: 'Object Storage Scaling' },
        {
          type: 'bullets',
          items: [
            'Object storage (S3-equivalent) scales infinitely — no capacity planning needed.',
            '5M videos × 1 GB average processed size = 5 PB/day. Budget accordingly.',
            'Tiered storage: Videos not watched in 90 days moved to cheaper "cold" storage tier (e.g., S3 Glacier).',
          ],
        },
        { type: 'heading2', text: 'Transcoding Elastic Scaling' },
        {
          type: 'bullets',
          items: [
            'Use a job queue (SQS/Kafka) for transcoding tasks.',
            'Scale workers based on queue depth (how many jobs are waiting). The Kubernetes Horizontal Pod Autoscaler can add workers when the queue grows.',
            'Spot/preemptible instances (spare cloud capacity sold cheaply, but can be taken back at any time) reduce GPU cost by 60-80% for non-time-critical transcoding.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
  V([Viewers worldwide]):::client --> CDN
  subgraph CDN["CDN - about 99 percent of bytes"]
    E1[Edge: Tokyo]:::network
    E2[Edge: London]:::network
    E3[Edge: New York]:::network
  end
  CDN -->|"misses only"| SH[Origin shield]:::network
  SH --> OS[(Object Storage<br/>hot + cold tiers)]:::db
  Q[[Transcode job queue]]:::queue --> AS{Autoscaler<br/>watches queue depth}
  AS --> W1[GPU workers<br/>on-demand]:::server
  AS --> W2[GPU workers<br/>spot - cheap]:::server
  W1 & W2 --> OS`,
          text: 'An origin shield is one extra cache layer in front of storage, so a miss in many edges at once becomes a single fetch from origin.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Transcoding Fault Tolerance' },
        {
          type: 'bullets',
          items: [
            'Each transcoding job is idempotent: running it again for the same video produces exactly the same output (fixed encoding settings), so retries are always safe.',
            'Failed jobs automatically retried up to 3 times with backoff.',
            'If all retries fail: video stays in "processing_failed" status, alert engineering, notify uploader.',
            'Progress checkpointing: for long videos, save progress periodically. On failure, resume from last checkpoint instead of restarting.',
          ],
        },
        {
          type: 'flow',
          title: 'What happens when a transcoding job fails',
          code: `flowchart TD
  J[Transcode job]:::queue --> RUN[Worker runs from<br/>last checkpoint]:::server
  RUN --> OK{Succeeded?}
  OK -->|Yes| DONE([Segments saved,<br/>status ready]):::highlight
  OK -->|No| R{Retries less than 3?}
  R -->|Yes| WAIT[Back off, then requeue<br/>on another worker]:::queue --> RUN
  R -->|No| FAIL[status = processing_failed]:::security
  FAIL --> AL[Alert engineers +<br/>notify uploader]:::external`,
          text: 'Because jobs are idempotent and checkpointed, a crashed worker costs only the work since its last checkpoint.',
        },
        { type: 'heading2', text: 'Content Integrity' },
        {
          type: 'bullets',
          items: [
            'Verify checksums at each step: raw upload → after transcoding → after CDN delivery.',
            'Play-test sampled videos automatically after transcoding (automated QA pipeline).',
            'A/B test encoding quality settings to balance quality vs. file size.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Startup Latency Optimization' },
        {
          type: 'bullets',
          items: [
            'Pre-load the first few segments to CDN edge closest to the viewer as soon as the video page is loaded.',
            'Start playback at the lowest quality level immediately, then switch to higher quality as bandwidth is confirmed.',
            'Pre-fetch the next segment before the current one finishes playing — player always has a buffer.',
          ],
        },
        {
          type: 'flow',
          title: 'Getting to first frame in under 2 seconds',
          code: `flowchart LR
  A[Page opens]:::client --> B[Warm edge:<br/>first segments pre-loaded]:::network
  B --> C[Play first segment<br/>at low quality]:::highlight
  C --> D[Measure bandwidth]:::server
  D --> E[Step up quality]:::server
  E --> F[Keep 2-3 segments<br/>buffered ahead]:::cache
  F --> D`,
        },
        { type: 'heading2', text: 'Thumbnail Optimization' },
        {
          type: 'bullets',
          items: [
            'Generate multiple thumbnail candidates from different time points during transcoding.',
            'Store thumbnails as WebP format (30% smaller than JPEG with same quality).',
            'Serve thumbnails via CDN with long cache TTL (thumbnails rarely change).',
            'Implement lazy loading — thumbnails outside the viewport are not loaded until scrolled into view.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'HLS vs. DASH' },
        {
          type: 'bullets',
          items: [
            'HLS: Developed by Apple, native support on iOS/Safari. Segment size default: 6 seconds. More widely supported.',
            'DASH (MPEG-DASH): Open standard, supported by most browsers (except Safari). More flexible (different segment sizes, better adaptation algorithms).',
            'Industry practice: Support both. Use HLS for Apple devices, DASH for others.',
          ],
        },
        {
          type: 'flow',
          title: 'Serving HLS and DASH from one set of segments',
          code: `flowchart TD
  T[Transcoder]:::server --> SEG[(Shared CMAF / fMP4<br/>segments)]:::db
  SEG --> H[HLS manifest .m3u8]:::highlight
  SEG --> D[DASH manifest .mpd]:::highlight
  H --> APPLE([iPhone, Safari]):::client
  D --> OTHER([Android, Chrome, smart TVs]):::client`,
          text: 'Modern pipelines encode once into a shared segment format (CMAF) and only write two small manifests, so supporting both protocols costs almost no extra storage.',
        },
        { type: 'heading2', text: 'Upload to Server vs. Direct Upload to Storage' },
        {
          type: 'bullets',
          items: [
            'Upload via server: Server can validate content (virus scan, format check) before storing. But: server bandwidth is a bottleneck for large video files.',
            'Direct upload to storage: Bypasses server bandwidth. But: harder to intercept for validation. Post-upload validation via async job.',
            'For video uploads: direct upload is necessary for performance. Post-upload validation in the processing pipeline.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Content Moderation' },
        {
          type: 'bullets',
          items: [
            'Run automated content classifiers during transcoding pipeline (violence, adult content, copyright).',
            'Hash-based detection: compute a perceptual hash of video frames (a fingerprint that stays the same even if the video is resized or re-encoded) and compare it against a database of prohibited content.',
            'Human review queue for flagged content.',
            'Copyright: Content ID system fingerprints videos and matches against a database of copyrighted content.',
          ],
        },
        {
          type: 'flow',
          title: 'Moderation inside the processing pipeline',
          code: `flowchart TD
  UP[Uploaded video]:::client --> TC[Transcoding]:::server
  TC --> CL[ML classifiers<br/>violence, adult]:::security
  TC --> PH[Perceptual hash +<br/>Content ID match]:::security
  CL & PH --> D{Flagged?}
  D -->|No| PUB([Publish]):::highlight
  D -->|"Clear violation"| BLK[Block automatically]:::external
  D -->|Unsure| HR[[Human review queue]]:::queue
  HR --> PUB
  HR --> BLK`,
        },
        { type: 'heading2', text: 'Cost Management' },
        {
          type: 'bullets',
          items: [
            'Egress cost: CDN egress (paying for data sent out to viewers) is the largest cost. Negotiate CDN contracts carefully.',
            'Transcoding cost: GPU instances are expensive. Use spot instances and optimize encoding settings.',
            'Storage cost: Delete original raw uploads after successful transcoding. Tier old video storage.',
          ],
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
            'How would you design the video upload and processing pipeline?',
            'Explain adaptive bitrate streaming.',
            'How would you scale to serve 5 billion video views per day?',
            'How do you handle view count at scale?',
            'How do you reduce video start latency to < 2 seconds?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Processing pipeline: upload → Kafka → transcoding workers → object storage → CDN.',
            'Parallel transcoding within a single video (GOP-aligned chunks) for fast processing.',
            'CDN is the scalability answer for video delivery — almost all bytes served from edge.',
            'Approximate view counts with Redis buffering + batch DB updates.',
            'Adaptive bitrate ensures good experience for all network conditions.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify scope<br/>upload + playback only]:::client --> B[Estimate<br/>uploads, views, storage]:::client
  B --> C[Upload pipeline<br/>Kafka + transcoding]:::server
  C --> D[Playback<br/>ABR + HLS + CDN]:::network
  D --> E[Hot spots<br/>view counts, start time]:::highlight
  E --> F[Failures + cost]:::db`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Video systems are complex. Scope carefully in interviews — focus on upload flow and streaming architecture. Do not try to cover recommendations, comments, and social features in the same interview session.',
        },
      ],
    },
  ],
};
