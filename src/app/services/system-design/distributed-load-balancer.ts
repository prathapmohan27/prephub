import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM: Distributed Load Balancer
// ─────────────────────────────────────────────────────────────────────────────
export const distributedLoadBalancer: SystemDesignSystem = {
  id: 'load-balancer',
  title: 'Distributed Load Balancer',
  icon: 'ti-scale',
  color: '#06b6d4',
  bg: '#cffafe',
  accentGlow: 'rgba(6,182,212,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Design a high-throughput, fault-tolerant Layer 4 and Layer 7 distributed load balancing infrastructure handling 10 million concurrent connections.',
  tags: ['L4 vs L7', 'Anycast BGP', 'Consistent Hashing', 'Health Checks', 'Maglev / Envoy'],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'The Core Challenge' },
        {
          type: 'paragraph',
          text: 'A load balancer is a front door for a group of servers. Clients send traffic to one public address — a Virtual IP (VIP), an IP address that is not tied to any single machine. The balancer picks a healthy backend server and forwards the traffic to it. At small scale this can be one reverse-proxy process. At internet scale, the front door itself must also be spread across many machines and locations, or it becomes the bottleneck.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is the host at a busy restaurant. Guests all come through one entrance (the VIP), and the host seats each party at a table that is open and has a working waiter (a healthy server). When the restaurant becomes a global chain, you need many entrances and many hosts — and no single host can be allowed to bring the whole place to a halt.',
        },
        {
          type: 'flow',
          title: 'The big picture — one address, many servers',
          code: `flowchart LR
  B([Browser]):::client -->|"1. shop.example.com?"| DNS[DNS]:::network
  DNS -->|"2. VIP 203.0.113.10"| B
  B -->|"3. GET /products"| LB{Load Balancer<br/>VIP}:::network
  LB -->|"4. forward"| SB[App Server B]:::server
  LB -.-> SA[App Server A]:::server
  LB -.-x SC[App Server C<br/>failed health check]:::security
  SB -->|"5. product list"| LB
  LB -->|"6. response"| B`,
          text: "The client only ever knows the VIP. Which server actually answers is the balancer's decision, and unhealthy servers (C) are simply skipped.",
        },
        { type: 'heading2', text: 'Start With a Small Example' },
        {
          type: 'numbered',
          items: [
            'A browser requests GET /products from shop.example.com.',
            'DNS returns the load balancer VIP. The browser connects to that VIP.',
            'The load balancer removes unhealthy servers from its candidate list.',
            'It chooses App Server B and forwards the request over the private network.',
            'App Server B returns the product list through the load balancer to the browser.',
            'If B fails a health check, new requests go to A or C instead. The load balancer is a traffic director, not the application that owns the product data.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Keep this distinction in mind. An L4 (Layer 4, transport-level) balancer decides using only connection details — IP addresses and ports — like a mail sorter reading just the envelope. An L7 (Layer 7, application-level) balancer opens the envelope and reads HTTP details such as the path /products, cookies, and headers. The rest of this design explains how to scale both kinds — and how that same single request multiplies into a 10-million-connection problem.',
        },
        {
          type: 'flow',
          title: 'L4 vs L7 — what each one can see',
          code: `flowchart TB
  P([Incoming connection]):::client --> L4[L4 balancer<br/>sees: IPs, ports, protocol]:::network
  L4 -->|"hash of connection details"| L7[L7 proxy<br/>sees: URL path, host, headers, cookies]:::server
  L7 -->|"/checkout"| PAY[Payments service]:::server
  L7 -->|"/products"| CAT[Catalog service]:::server
  L7 -->|"/images"| AST[Assets service]:::server`,
          text: 'L4 is fast but blind to content. L7 is slower but smart enough to send different URLs to different services.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Traffic Distribution: Distribute incoming TCP, UDP, and HTTP/HTTPS connections across a dynamic pool of backend application instances.',
            'Health Probing & Automatic Failover: Continuously monitor backend health; isolate failing nodes in < 3 seconds with zero manual intervention.',
            'Content-Based Routing: Support Layer 7 URL path, host header, and method-based routing rules.',
            'TLS Termination & Offloading: Terminate TLS at the edge to offload cryptographic CPU overhead from backend workers.',
            'Graceful Connection Draining: Drain connections gracefully during backend deployments without severing active transactions.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'High Availability: 99.999% uptime (less than 5.26 minutes of downtime per year). No single point of failure anywhere in the data path.',
            'Ultra-Low Latency: Layer 4 packet forwarding overhead < 1ms; Layer 7 proxy routing overhead < 4ms.',
            'Massive Throughput: Scalable to 10M+ concurrent TCP connections and 100+ Gbps bandwidth per cluster.',
            'Stateless Scaling: The load balancing tier itself must be horizontally scalable across standard commodity hardware without inter-node synchronization bottlenecks.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Foundational Distributed Networking Concepts' },
        {
          type: 'bullets',
          items: [
            'Anycast BGP: BGP is the protocol internet routers use to share "how to reach this address". With Anycast, many edge locations all announce the SAME VIP, and internet routing naturally sends each client to a nearby one. This shortens the distance and spreads load around the world.',
            'Equal-Cost Multi-Path (ECMP): A network switch that has several equally good next hops (here, several L4 balancers) picks one per connection by hashing its 5-tuple — source IP, destination IP, source port, destination port, and protocol. The same connection always hashes the same way, so all its packets stay on the same path.',
            "Consistent Hashing & Maglev: A lookup table that every machine can compute on its own and that always gives the same answer for the same connection. Maglev is Google's version. When a server is added or removed, only a small share of connections move, instead of everyone being reshuffled.",
            'eBPF & XDP (eXpress Data Path): eBPF lets you load small, safety-checked programs into the Linux kernel. XDP runs such a program inside the network card driver, so a packet can be forwarded or dropped before the kernel does its normal (expensive) packet bookkeeping. Result: millions more packets per second per server.',
            'Direct Server Return (DSR): The request goes through the balancer, but the backend sends the response straight back to the client. Responses are usually much bigger than requests, so this saves a lot of balancer bandwidth — at the cost of the balancer no longer seeing (or modifying) responses.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Two-Tier Load Balancing Architecture' },
        {
          type: 'paragraph',
          text: 'At large scale, split the front door into two jobs. L4 handles fast connection distribution; L7 understands HTTP and makes service-level routing decisions. This separation keeps expensive TLS and HTTP work away from the packet-forwarding path.',
        },
        {
          type: 'bullets',
          items: [
            'Tier 1 — Anycast Edge & ECMP Switches: Send a client to a nearby location, then spread each connection across the L4 fleet.',
            'Tier 2 — Stateless L4 Balancer Fleet (Maglev / Katran): Uses connection metadata to forward packets to an L7 proxy. "Stateless" means it does not need a shared per-connection database with every peer; the same hash leads packets consistently to the same destination.',
            'Tier 3 — L7 Proxy Fleet (Envoy / Nginx): Terminates TLS, reads HTTP, applies rate limits, and routes /checkout to Payments while /images goes to Assets.',
            'Tier 4 — Application Service Pool: Stateless application workers handling business logic.',
            'Health Checking & Service Discovery Daemon: Continuously inspects node health and distributes updated server lists via a lightweight gossip protocol or ZooKeeper/Consul.',
          ],
        },
        {
          type: 'flow',
          title: 'Two-tier load balancing architecture',
          code: `flowchart TB
  C([Clients worldwide]):::client -->|"Anycast: nearest PoP"| SW[Edge router / switch<br/>ECMP hashing]:::network
  subgraph L4["L4 fleet — fast, stateless"]
    A1[L4 node 1<br/>Maglev + XDP]:::network
    A2[L4 node 2<br/>Maglev + XDP]:::network
  end
  SW --> A1 & A2
  subgraph L7["L7 fleet — smart, HTTP-aware"]
    E1[Envoy 1<br/>TLS + routing]:::security
    E2[Envoy 2<br/>TLS + routing]:::security
  end
  A1 & A2 --> E1 & E2
  E1 & E2 --> PAY[Payments pool]:::server
  E1 & E2 --> CAT[Catalog pool]:::server
  HC[Health checker +<br/>service discovery]:::db -.->|"healthy server lists"| L4 & L7`,
          text: 'Each tier does one job: get close to the user, spread connections cheaply, then do the expensive HTTP work. The health checker keeps every tier\'s list of "who is alive" up to date.',
        },
      ],
    },
    {
      id: 'worked-example',
      title: 'Worked Example: Tracing 10 Million Connections',
      icon: 'ti-route',
      blocks: [
        { type: 'heading2', text: 'From One Request to Ten Million, Tier by Tier' },
        {
          type: 'paragraph',
          text: 'The requirements above describe each tier in isolation. It is easier to hold onto the design if you trace what actually happens to the full 10 million concurrent connections as they spread out across the fleet, tier by tier, with real numbers.',
        },
        {
          type: 'numbered',
          items: [
            'Global demand: 10,000,000 concurrent connections arrive from clients worldwide, all addressed to one Anycast VIP.',
            'Anycast edge split: BGP routes each client to its nearest of 60 edge PoPs based on network topology, not a central dispatcher. Assuming roughly even geographic demand, each PoP now sees about 166,000 concurrent connections — small enough for a modest local cluster to absorb.',
            "ECMP hand-off inside a PoP: The local switch hashes each connection's 5-tuple and spreads the 166,000 connections across, say, 8 L4 balancer nodes. Each L4 node now handles about 20,000 connections — using no shared state with its 7 siblings.",
            'Maglev lookup on the L4 node: For each incoming packet, the node computes hash(5-tuple) % M against its local Maglev table and gets back one of, say, 4 local L7 proxies — instantly and without asking any other machine.',
            "L7 proxy load: Each of those 4 Envoy proxies ends up holding roughly 5,000 concurrent connections. This is comfortably inside a single 16-core proxy's capacity, leaving headroom for TLS termination and HTTP parsing.",
            'Backend fan-out: The L7 proxy reads the HTTP path and sends /checkout requests to the Payments pool and /products requests to the Catalog pool — so within those 5,000 connections, only the relevant slice ever reaches any one backend service.',
          ],
        },
        {
          type: 'flow',
          title: '10 million connections, divided tier by tier',
          code: `flowchart TD
  G([10,000,000 connections<br/>to one Anycast VIP]):::client -->|"BGP: split across 60 PoPs"| P[~166,000 per PoP]:::network
  P -->|"ECMP: split across 8 L4 nodes"| L4[~20,000 per L4 node]:::network
  L4 -->|"Maglev: split across 4 L7 proxies"| L7[~5,000 per Envoy proxy]:::security
  L7 -->|"route by URL path"| B1[Payments pool<br/>only /checkout]:::server
  L7 -->|"route by URL path"| B2[Catalog pool<br/>only /products]:::server`,
          text: 'Each arrow is one cheap, local decision. Multiply them together and a huge number becomes a comfortable load per machine.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "Notice that no single number in this chain is large. The system's scale comes from repeating a small, cheap decision (one hash lookup) at every tier, in parallel, across thousands of independent nodes — not from any one component being individually massive.",
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: '1. eBPF / XDP Packet Processing Engine' },
        {
          type: 'paragraph',
          text: 'In normal Linux networking, every arriving packet gets wrapped in a kernel bookkeeping structure (an sk_buff) and walks up the full network stack. That overhead caps a server at roughly one to two million packets per second. An eBPF program attached at the XDP (eXpress Data Path) hook runs inside the network card driver itself, before any of that work happens. It looks at the packet, decides where it goes, and sends it back out in place — reaching roughly 10× more packets per second per server.',
        },
        {
          type: 'flow',
          title: 'Normal kernel path vs XDP fast path',
          code: `flowchart LR
  NIC[Network card<br/>receives packet]:::network --> X{XDP program<br/>in the driver}:::highlight
  X -->|"XDP_TX: rewrite + send out<br/>(fast path)"| OUT([Forwarded to L7 proxy]):::server
  X -->|"XDP_DROP: attack traffic"| DROP([Dropped instantly]):::security
  X -->|"XDP_PASS: not for us"| SKB[Allocate sk_buff]:::db
  SKB --> STK[Full kernel network stack<br/>slow path]:::db --> APP[User-space app]:::server`,
          text: 'The fast path skips memory allocation and the whole kernel stack. That is why XDP is also a great first line of DDoS defence — bad packets die at the driver.',
        },
        { type: 'heading2', text: '2. The Maglev Consistent Hashing Table' },
        {
          type: 'paragraph',
          text: 'L4 nodes need to agree on where each connection goes — without constantly talking to each other or sharing a connection database. Maglev solves this with a lookup table that every node builds independently and identically. The table has M slots (M is a prime number, e.g. 65,537). Each backend gets its own pseudo-random "preference order" of slots, and backends take turns claiming their next preferred free slot until the table is full — so each backend owns roughly the same number of slots. When a packet arrives, hash(5-tuple) % M picks a slot, and the slot names the backend. No inter-server communication is needed — this is exactly the lookup traced in step 4 of the worked example above.',
        },
        {
          type: 'flow',
          title: 'Maglev — building the table, then using it',
          code: `flowchart TD
  subgraph Build["Build — same result on every L4 node"]
    BL[Backend list from<br/>service discovery]:::db --> PERM[Each backend gets a<br/>pseudo-random slot order]:::server
    PERM --> FILL[Backends take turns claiming<br/>their next free slot]:::server
    FILL --> T[(Lookup table<br/>M = 65,537 slots)]:::cache
  end
  subgraph Use["Use — per packet"]
    PK([Packet arrives]):::client --> H["hash(5-tuple) % M"]:::network
    H --> T
    T --> BE([Send to backend in that slot]):::highlight
  end`,
          text: "Because every node runs the same algorithm on the same backend list, they all build the same table — agreement without coordination. Removing one backend only reassigns that backend's slots.",
        },
        { type: 'heading2', text: '3. Direct Server Return (DSR) Implementation' },
        {
          type: 'paragraph',
          text: "In DSR, the load balancer changes only the packet's destination MAC address (the hardware address of the next machine on the local network) to the chosen backend. The destination IP stays the VIP. Each backend also has the VIP configured on a dummy loopback interface, so it accepts packets addressed to the VIP. When the backend replies, the kernel uses the VIP as the source IP and sends the response straight to the gateway router — the load balancer never sees it. To the client, the reply looks like it came from the VIP.",
        },
        {
          type: 'flow',
          title: 'Direct Server Return — request in, response around',
          code: `sequenceDiagram
  actor C as Client
  participant LB as L4 Balancer
  participant B as Backend (VIP on loopback)
  participant R as Gateway Router
  C->>LB: Request to VIP (small)
  LB->>B: Same packet, only MAC rewritten
  Note over B: Accepts it - the VIP is on its loopback
  B->>R: Response, source IP = VIP (large)
  R->>C: Response delivered
  Note over LB: Never touches the response bytes`,
          text: 'Requests are small and responses are large (think video). Letting responses skip the balancer frees most of its bandwidth.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Handling 10 Million Concurrent Connections' },
        {
          type: 'bullets',
          items: [
            'Horizontally Scaling L4: Because L4 nodes use stateless Maglev hashing, adding a 10th or 20th L4 server to the ECMP switch requires zero state migration. The fleet scales linearly with hardware.',
            'Epoll & Event-Driven L7: Each Envoy proxy process uses non-blocking asynchronous epoll/kqueue event loops. A single 16-core Envoy instance can maintain around 200,000 concurrent idle keep-alive TCP connections using roughly 2 GB of RAM.',
            'Anycast Geo-Distribution: Announcing the VIP from 60 global edge PoPs splits the 10 million global connections into roughly 166,000 connections per PoP — the same split traced step by step in the worked example above.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Zero Single Points of Failure' },
        {
          type: 'bullets',
          items: [
            'L4 Node Failure: If an L4 balancer server burns out, the hardware switch detects BGP session loss in < 500ms and redirects ECMP routes to surviving L4 nodes. Maglev hashing guarantees that surviving nodes map established flows to the exact same L7 proxies.',
            'L7 Proxy Failure: If an Envoy proxy crashes, L4 health checkers detect the TCP reset and remove it from the Maglev backend list. Connections are re-established to peer Envoy nodes.',
            'Backend Server Crash: For idempotent requests (GET, HEAD), the L7 proxy detects socket closure and transparently replays the request to an alternate healthy server without returning an error to the end user.',
            'Active-Passive VRRP Failover (for smaller on-premise clusters): When Anycast/BGP is unavailable, two balancers share one VIP using Keepalived and VRRP (Virtual Router Redundancy Protocol). The active one sends regular heartbeats. If the backup misses 3 heartbeats in a row, it takes over the VIP and broadcasts a Gratuitous ARP — a "this IP now lives at my MAC address" announcement — so the local network starts sending traffic to it.',
          ],
        },
        {
          type: 'flow',
          title: 'Which tier failed, and who notices',
          code: `flowchart TD
  F([Something fails]):::client --> W{Which tier?}
  W -->|"L4 node"| L4[Switch loses its BGP session<br/>in under 500 ms]:::network
  L4 --> L4R[ECMP stops sending to it.<br/>Maglev keeps flows on same L7]:::highlight
  W -->|"L7 proxy"| L7[L4 health check sees<br/>TCP resets]:::security
  L7 --> L7R[Removed from Maglev table.<br/>Clients reconnect to peers]:::highlight
  W -->|"Backend server"| BE[L7 proxy sees<br/>socket closed]:::server
  BE --> I{Request idempotent?<br/>GET or HEAD}
  I -->|Yes| RT[Retry on another server —<br/>user sees no error]:::highlight
  I -->|No| ER[Return error —<br/>replaying could double-charge]:::security`,
          text: 'Every tier is watched by the tier in front of it. Only safe-to-repeat requests are retried automatically.',
        },
        {
          type: 'flow',
          title: 'Health checks with hysteresis',
          code: `stateDiagram-v2
  [*] --> Healthy
  Healthy --> Suspect: 1 failed probe
  Suspect --> Healthy: probe OK
  Suspect --> Unhealthy: 3 failures in a row
  Unhealthy --> Recovering: 1 probe OK
  Recovering --> Unhealthy: probe fails
  Recovering --> Healthy: 3 successes in a row`,
          text: 'Hysteresis means requiring several results in a row before changing state. It stops a server that is briefly slow from "flapping" in and out of rotation.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Sub-Millisecond Routing Optimizations' },
        {
          type: 'bullets',
          items: [
            'Direct Server Return (DSR): Offloads the majority of network bandwidth from the load balancer tier, preventing return-traffic network interface saturation.',
            'TLS Session Ticket Resumption: Caches TLS session tickets in a distributed Redis cluster. Returning clients resume encrypted sessions in 0-RTT without a full cryptographic handshake.',
            'HTTP/2 Multiplexing to Backends: L7 proxies maintain persistent connection pools to backend servers, multiplexing hundreds of client requests over a few long-lived TCP sockets to eliminate handshake latency.',
            'Zero-Copy Socket Transfers: Using the splice() and sendfile() Linux system calls moves data directly between socket buffers without copying bytes into userspace memory.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Critical Architectural Decisions' },
        {
          type: 'bullets',
          items: [
            'Layer 4 vs. Layer 7: L4 delivers substantially higher packet throughput and lower latency, but cannot inspect HTTP paths or cookies. L7 enables intelligent routing and SSL offloading, but requires significantly more CPU and memory per connection.',
            'Direct Server Return (DSR) vs. Full Proxy: DSR can multiply outbound throughput several times over, but prevents the load balancer from inspecting, caching, or compressing outbound HTTP responses.',
            'Hardware Appliances (F5 / NetScaler) vs. Software Balancers (Envoy / Katran): Hardware appliances offer dedicated ASIC speed, but are expensive and lack programmatic API agility. Software balancers running on commodity Linux servers scale horizontally at cloud economics.',
            'Least Connections vs. Consistent Hashing: Least Connections balances server CPU load evenly. Consistent Hashing routes the same user to the same node (maximizing cache hit ratios), but risks hotspots if a few users generate massive traffic.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing L4, L7, or both',
          code: `flowchart TD
  Q([What does the traffic need?]):::client --> H{Route by URL, header,<br/>or cookie?}
  H -->|No| T{Raw TCP or UDP,<br/>very high volume?}
  T -->|Yes| L4[L4 only<br/>e.g. NLB, Maglev, Katran]:::network
  T -->|No| L7S[Single L7 proxy tier<br/>is usually enough]:::security
  H -->|Yes| S{Internet scale,<br/>millions of connections?}
  S -->|No| L7S
  S -->|Yes| BOTH[L4 fleet in front of<br/>an L7 fleet]:::highlight
  BOTH --> D{Huge responses,<br/>e.g. video?}
  D -->|Yes| DSR[Add DSR on the L4 tier]:::network`,
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Operational Resilience & Observability' },
        {
          type: 'bullets',
          items: [
            'SYN Cookies (DDoS Protection): When receiving thousands of malicious incomplete TCP handshakes (SYN flood), the load balancer encodes connection state into the TCP sequence number, allocating zero RAM until the client sends the final ACK.',
            'Connection Draining: When a server is deregistered for upgrade, it enters DRAINING state for 300 seconds. Existing user requests finish cleanly while all new requests go to updated nodes.',
            'Canary & Traffic Splitting: L7 proxies route 95% of traffic to v1 and 5% to v2 based on HTTP headers or percentage weights, monitoring error rates before promoting new releases.',
            'Key Metrics: p50/p90/p99 routing latency, active TCP connections, backend 5xx error spikes, health check flap rate, and bytes in vs. bytes out.',
          ],
        },
        {
          type: 'flow',
          title: 'Connection draining during a deploy',
          code: `sequenceDiagram
  participant D as Deploy tool
  participant LB as L7 Proxy
  participant V1 as Server v1
  participant V2 as Server v2
  D->>LB: Mark v1 as DRAINING
  Note over LB,V1: New requests stop going to v1
  LB->>V2: All new requests
  LB->>V1: Existing in-flight requests only
  V1-->>LB: Last responses finish
  Note over V1: Idle, or 300 s timeout reached
  D->>V1: Safe to shut down`,
          text: "Draining turns a hard cut-off into a gentle hand-over, so no user's checkout is chopped in half by a deployment.",
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'How to Ace the Load Balancer Interview' },
        {
          type: 'bullets',
          items: [
            'Start by clarifying scope: Ask whether the interviewer wants a high-throughput Layer 4 packet router (like AWS NLB / Maglev) or an application-layer Layer 7 reverse proxy (like AWS ALB / Envoy). Propose a two-tier architecture that covers both.',
            'Address the single-point-of-failure trap immediately: State clearly that the load balancer itself cannot be a single machine. Explain how Anycast BGP + ECMP or VRRP/Keepalived makes the LB tier fully redundant.',
            'Differentiate yourself with Direct Server Return (DSR) and Maglev consistent hashing. Explaining why outbound response traffic should bypass the load balancer shows true distributed systems depth.',
            'Discuss health check hysteresis: Never flip a server state on a single failed probe. Require 2–3 consecutive failures to mark dead, and 3 consecutive successes to restore.',
            'Walk through the numbers, not just the names: Being able to trace how a global connection count actually shrinks tier by tier (Anycast → ECMP → Maglev → L7) shows you understand the architecture rather than having memorized its component names.',
          ],
        },
        {
          type: 'flow',
          title: 'A strong answer, step by step',
          code: `flowchart LR
  A[Clarify<br/>L4, L7, or both]:::client --> B[Simple design<br/>one LB + server pool]:::server
  B --> C[Remove the SPOF<br/>Anycast + ECMP or VRRP]:::network
  C --> D[Scale the LB tier<br/>Maglev, stateless L4]:::highlight
  D --> E[Trace the numbers<br/>10M to 5K per proxy]:::server
  E --> F[Failures + health checks<br/>+ draining]:::security`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Many candidates treat load balancers as magical black boxes with an icon in their diagram. Being able to explain how the load balancer itself handles 10M connections using Anycast, ECMP, Maglev hashing, and eBPF/XDP — and trace the actual numbers tier by tier — will instantly put you in the top 1% of system design interview candidates.',
        },
      ],
    },
  ],
};
