import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT: How Load Balancers Work
// ─────────────────────────────────────────────────────────────────────────────
export const howLoadBalancersWork: CoreConcept = {
  id: 'how-load-balancers-work',
  title: 'How Load Balancers Work',
  emoji: '⚖️',
  icon: 'ti-scale',
  color: '#06b6d4',
  bg: '#cffafe',
  accentGlow: 'rgba(6,182,212,0.15)',
  difficulty: 'Foundational',
  tagline:
    'The traffic cops of the Internet. Understand Layer 4 vs Layer 7, balancing algorithms, health checking, and zero-downtime failover.',
  tags: ['Layer 4 vs Layer 7', 'Round Robin', 'Consistent Hashing', 'Health Checks', 'Failover'],
  estimatedTime: '35 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'One Public Door, Many Private Servers' },
        {
          type: 'paragraph',
          text: 'A load balancer is the server that receives a client request first and chooses which application server should handle it. Clients see one website address, while the load balancer hides a pool of backend servers behind that address.',
        },
        {
          type: 'paragraph',
          text: 'For example, a user visits shop.example.com. DNS points that name to the load balancer, not directly to App Server A, B, or C. The load balancer checks which servers are healthy, chooses one, forwards the request, and sends the response back to the user.',
        },
        { type: 'heading2', text: 'Why Not Let DNS Choose a Server?' },
        {
          type: 'paragraph',
          text: 'DNS can point users toward different servers, but it does not know which server is busy or broken between DNS updates. A load balancer makes that decision for each connection or request using live health and traffic information.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: picture a restaurant with one host and several tables. Customers speak to the host (the load balancer), not to a random waiter. The host sends each customer to an available table (a healthy backend server) and stops using a table if it is unavailable.',
        },
        {
          type: 'flow',
          title: 'The big picture — one address, many servers',
          code: `flowchart LR
  U1([User 1]):::client --> LB
  U2([User 2]):::client --> LB
  U3([User 3]):::client --> LB
  LB["Load balancer<br/>shop.example.com"]:::network
  subgraph POOL["Private backend pool"]
    A[App Server A]:::server
    B[App Server B]:::server
    C[App Server C - down]:::external
  end
  LB --> A
  LB --> B
  LB -.->|"skipped: failed health check"| C`,
          text: 'Users only ever talk to the load balancer. It spreads requests across healthy servers and quietly skips broken ones.',
        },
      ],
    },

    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'Four Critical Engineering Problems Solved' },
        {
          type: 'numbered',
          items: [
            'Horizontal Scalability: Instead of making one server bigger, add more smaller servers behind the load balancer. The load balancer gives new servers traffic after they pass their health check.',
            'High Availability & Fault Tolerance: If some backend servers fail, the load balancer removes them from rotation and sends new traffic to the healthy ones. Existing requests may still fail, so the application must handle retries carefully.',
            'Zero-Downtime Deployments (Rolling Updates): You can take servers out of the pool one by one, deploy new application code, verify they are healthy, and put them back in without ever taking down the website.',
            'Security & Offloading: The load balancer can take over expensive side jobs — TLS (HTTPS) handshakes, rate limiting, and absorbing some network attacks — so backend servers keep more CPU for business logic.',
          ],
        },
        {
          type: 'flow',
          title: 'Rolling deploy with zero downtime',
          code: `flowchart TD
  S1["Stop sending new traffic<br/>to Server 1"]:::network --> S2["Let in-flight requests finish<br/>(connection draining)"]:::network
  S2 --> S3["Deploy new code<br/>on Server 1"]:::server
  S3 --> Q{"Health check<br/>passes?"}
  Q -->|"yes"| S4["Add Server 1 back<br/>to the pool"]:::highlight
  Q -->|"no"| RB["Keep it out and roll back"]:::external
  S4 --> N["Repeat for Server 2, 3, ..."]:::server`,
          text: 'At every moment, most servers are still serving users, so the site never goes offline.',
        },
      ],
    },

    {
      id: 'how-it-works',
      title: 'How Does It Work?',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'First Choose What the Balancer Can See' },
        {
          type: 'paragraph',
          text: 'The important difference between L4 and L7 is what information the load balancer can read. "Layer 4" and "Layer 7" come from the OSI networking model: L4 is the transport layer (TCP/UDP connections), L7 is the application layer (HTTP). L4 can see the connection, like seeing an envelope\'s address. L7 can open the envelope and read the HTTP request inside.',
        },
        {
          type: 'bullets',
          items: [
            'Layer 4 (L4): Sees source/destination IPs, ports, and TCP/UDP connections. It cannot read /checkout versus /search because it does not inspect HTTP. It is fast and works for HTTP, WebSockets, databases, and other TCP/UDP protocols.',
            'Layer 7 (L7): Understands HTTP method, host, path, headers, and cookies. It can send /api/video to video servers and /api/checkout to payment servers. It uses more CPU because it terminates and processes the application connection.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Simple rule: choose L4 when you mainly need fast connection forwarding; choose L7 when routing depends on HTTP details. Many large systems use both: L4 spreads connections across L7 proxies, then L7 routes requests to services.',
        },
        {
          type: 'flow',
          title: 'L4 vs L7 — what each layer can see',
          code: `flowchart TB
  C([Client request<br/>POST /api/checkout]):::client --> L4["L4 balancer<br/>sees only IP + port + TCP<br/>203.0.113.7 to :443"]:::network
  L4 -->|"forwards whole connection"| L7["L7 balancer<br/>decrypts TLS, reads HTTP<br/>method, path, headers, cookies"]:::network
  L7 -->|"/api/checkout"| P[Payment servers]:::server
  L7 -->|"/api/video"| V[Video servers]:::server
  L7 -->|"/api/search"| S[Search servers]:::server`,
          text: 'L4 is a fast mail sorter that only reads the envelope. L7 opens the letter and routes by what is written inside.',
        },
        { type: 'heading2', text: 'Core Balancing Algorithms' },
        {
          type: 'bullets',
          items: [
            'Round Robin: Sends requests sequentially down the list of servers (Server 1 → Server 2 → Server 3 → Server 1). Best when all requests take roughly equal processing time.',
            'Weighted Round Robin: Assigns higher weights to more powerful servers (e.g. Server A gets 3 requests for every 1 request Server B gets).',
            'Least Connections: Routes traffic to whichever server currently has the fewest active open connections. Superior when request durations vary widely (e.g. video streaming vs quick database lookups).',
            'IP Hash / Consistent Hashing: Runs the client IP address or user ID through a hash function (a formula that always turns the same input into the same number), so the same user always lands on the same server. Useful when a server keeps per-user data in memory, such as session caches or gaming lobbies.',
          ],
        },
        {
          type: 'flow',
          title: 'Which algorithm should I pick?',
          code: `flowchart TD
  Q1{"Must the same user always<br/>reach the same server?"} -->|"yes"| H["IP Hash /<br/>Consistent Hashing"]:::highlight
  Q1 -->|"no"| Q2{"Do request durations<br/>vary a lot?"}
  Q2 -->|"yes - e.g. streaming vs quick lookups"| LC["Least Connections"]:::highlight
  Q2 -->|"no"| Q3{"Are servers different sizes?"}
  Q3 -->|"yes"| W["Weighted Round Robin"]:::highlight
  Q3 -->|"no"| RR["Round Robin"]:::highlight`,
        },
      ],
    },

    {
      id: 'step-by-step',
      title: 'What Happens Step by Step?',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'The Lifecycle of a Balanced Request' },
        {
          type: 'numbered',
          items: [
            'Address lookup: The browser resolves shop.example.com to the load balancer public IP, not to a backend server.',
            'Connection: The browser opens a TCP connection to the load balancer. With HTTPS, an L7 balancer may also complete the TLS handshake.',
            'Health filter: The balancer keeps only servers that recently passed a health check such as GET /healthz.',
            'Server choice: It applies an algorithm such as round robin or least connections to choose one healthy server.',
            'Forwarding: It sends the request to that server over the private network, for example 10.0.1.25:8080.',
            "Response: The backend creates the response. The load balancer returns it to the browser, so the browser never needs to know the backend server's private address.",
          ],
        },
        {
          type: 'flow',
          title: 'Lifecycle of a balanced request',
          code: `sequenceDiagram
  participant B as Browser
  participant D as DNS
  participant LB as Load balancer
  participant S as App server 10.0.1.25
  B->>D: Where is shop.example.com?
  D-->>B: Load balancer public IP
  B->>LB: TCP + TLS handshake, then GET /products
  Note over LB: Keep only healthy servers, then pick one (e.g. least connections)
  LB->>S: Forward request over private network
  S-->>LB: 200 OK + HTML
  LB-->>B: 200 OK + HTML`,
          text: "The browser only ever learns the load balancer's address. Backend servers stay hidden on the private network.",
        },
      ],
    },

    {
      id: 'components-involved',
      title: 'Components Involved',
      icon: 'ti-components',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Virtual IP (VIP): The single public IP address users connect to. It is published via DNS, or via Anycast BGP (a routing trick where many machines in different places share the same IP).',
            'Server Pool / Target Group: The current list of backend servers registered to receive traffic. Servers join and leave this list as they scale up, fail, or are deployed.',
            'Health Checking Engine: A background process that keeps poking each backend (e.g. GET /healthz every 5 seconds) and marks it healthy or unhealthy.',
            'Session Persistence (Sticky Sessions): Logic that uses a cookie or a hash of the user to keep sending the same user to the same backend server.',
            'SSL Termination Module: The part (software, sometimes with dedicated crypto hardware) that performs the TLS handshake and decrypts HTTPS, then forwards plain HTTP to backends over the private network.',
          ],
        },
        {
          type: 'flow',
          title: 'Inside a load balancer',
          code: `flowchart LR
  U([Clients]):::client -->|"HTTPS"| VIP["Virtual IP<br/>104.16.20.1"]:::network
  subgraph LB["Load balancer"]
    VIP --> TLS["SSL termination"]:::security
    TLS --> STICKY["Sticky session check"]:::network
    STICKY --> ALG["Balancing algorithm"]:::network
    HC["Health checker"]:::security -.->|"healthy list"| ALG
  end
  ALG -->|"plain HTTP"| POOL["Target group<br/>App servers"]:::server
  HC -.->|"GET /healthz every 5s"| POOL`,
        },
      ],
    },

    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-world-pin',
      blocks: [
        { type: 'heading2', text: "The Concert Ticket Drop That Didn't Crash" },
        {
          type: 'paragraph',
          text: 'At 10:00:00 AM, tickets for a sold-out tour go on sale. In the first 3 seconds, 400,000 people hit "Buy Now" at once — roughly 500x the site\'s normal traffic. Here is what happens between the click and the checkout page.',
        },
        {
          type: 'numbered',
          items: [
            'The 400,000 connections all land on one Virtual IP. An L4 load balancer accepts them at wire speed, without looking at what anyone is trying to buy, and spreads the raw TCP connections across a fleet of 20 L7 proxies. This step never needs to inspect HTTP, so it never becomes the bottleneck.',
            "Each L7 proxy terminates TLS and reads the actual request. It sees paths like /queue, /seat-map, and /checkout, and routes each to a different backend pool — so someone checking the queue position doesn't compete with someone finalizing a payment.",
            'The checkout pool, doing the heaviest work (payment processing, inventory locks), starts slowing down. The health checker notices two consecutive failed pings to Checkout-Server-14 and pulls it out of rotation before it can return errors to real users.',
            "Auto-scaling sees checkout-pool CPU above 70% and launches 30 new servers. As each one passes its health check, the load balancer folds it into the pool — traffic ramps up gradually (slow-start) so the new servers aren't instantly flooded before their caches warm up.",
            "A deploy was scheduled for this exact moment (bad timing, but it happens). The load balancer drains connections from the servers being replaced instead of killing them mid-request, so no one's in-progress payment gets severed.",
            'Traffic stabilizes within a couple of minutes. Because the checkout pool used Least Connections instead of Round Robin, servers stuck on slow payment retries never got stacked with new requests on top — unlike Round Robin, which would have kept feeding them more work regardless of how backed up they already were.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Notice what the user never sees: which of the 50 backend servers handled their request, which ones failed, or that 30 new servers spun up mid-purchase. That invisibility is the entire point of a load balancer — the failure and the scaling happen, and the checkout page just works.',
        },
        {
          type: 'flow',
          title: 'Ticket drop — two-tier balancing',
          code: `flowchart TB
  U(["400,000 buyers"]):::client --> L4["L4 balancer<br/>spreads raw TCP connections"]:::network
  L4 --> P["20 L7 proxies<br/>terminate TLS, read the path"]:::network
  P -->|"/queue"| Q[Queue pool]:::server
  P -->|"/seat-map"| SM[Seat-map pool]:::server
  P -->|"/checkout - least connections"| CO[Checkout pool]:::server
  HC["Health checker"]:::security -.->|"removes Checkout-14"| CO
  AS["Auto-scaling<br/>+30 servers, slow-start"]:::highlight -.-> CO`,
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
          title: 'Load balancing at a glance',
          code: `flowchart LR
  C([Clients]):::client -->|"1. VIP traffic"| L4["L4 balancer"]:::network
  L4 -->|"2. spread connections"| L7["L7 proxy"]:::network
  L7 -->|"3. ask for healthy nodes"| HC["Health checker"]:::security
  L7 -->|"4. forward to least-loaded"| B["Backend fleet"]:::server`,
          text: 'The step cards below expand each hop.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-load-balancer-flow',
            title: 'Distributed Layer 4 & Layer 7 Load Balancing Architecture',
            subtitle:
              'From public Anycast Virtual IP through L4 packet forwarding, L7 content routing, to healthy backend pools',
            nodes: [
              {
                id: 'client-traffic',
                name: 'Incoming Client Traffic',
                subtitle: '400,000 Concurrent Ticket-Purchase Requests',
                type: 'client',
                icon: 'ti-users',
                badge: 'Client Pool',
                protocol: 'HTTPS :443 / TCP',
                details: [
                  'Clients resolve domain to single Virtual IP (VIP: 104.16.20.1)',
                  'Send parallel HTTPS requests with diverse paths (/queue, /seat-map, /checkout)',
                ],
              },
              {
                id: 'l4-network-lb',
                name: 'Layer 4 Load Balancer (NLB / IPVS)',
                subtitle: 'Stateless Wire-Speed Packet Dispatcher',
                type: 'network',
                icon: 'ti-arrows-split-2',
                badge: 'L4 Balancer',
                protocol: 'eBPF / Maglev Hashing',
                details: [
                  'Operates at transport layer (TCP/UDP); routes packets in < 1ms',
                  'Uses 5-tuple hash (Src IP, Src Port, Dst IP, Dst Port, Protocol)',
                  'Distributes millions of packets across Layer 7 proxy fleet without decrypting payload',
                ],
              },
              {
                id: 'l7-application-lb',
                name: 'Layer 7 Application Proxy (Envoy / Nginx)',
                subtitle: 'Content-Aware HTTP Router & TLS Terminator',
                type: 'gateway',
                icon: 'ti-shield-lock',
                badge: 'L7 Balancer',
                protocol: 'TLS 1.3 / HTTP/2',
                details: [
                  'Terminates TLS encryption; inspects HTTP method, path, headers, and cookies',
                  'Applies Least Connections algorithm across active backend nodes',
                  'Enforces path routing: /checkout → Payments Pool, /seat-map → Inventory Pool',
                ],
              },
              {
                id: 'health-checker',
                name: 'Health Checking Controller',
                subtitle: 'Active Probe Daemon & Registry',
                type: 'security',
                icon: 'ti-heartbeat',
                badge: 'Health Daemon',
                protocol: 'GET /healthz',
                details: [
                  'Sends active HTTP ping every 5 seconds to each backend server',
                  'Requires 2 consecutive failures to mark node UNHEALTHY',
                  'Requires 3 consecutive successes to restore node to active pool (hysteresis)',
                ],
              },
              {
                id: 'backend-fleet',
                name: 'Healthy Backend Application Fleet',
                subtitle: 'Stateless Node.js / Go / Java Microservices',
                type: 'server',
                icon: 'ti-server',
                badge: 'Server Pool',
                protocol: 'Private IP :8080',
                details: [
                  'Processes application business logic within bounded CPU and RAM limits',
                  'Gracefully drains active connections during rolling deployments before shutdown',
                ],
              },
            ],
            connections: [
              {
                from: 'client-traffic',
                to: 'l4-network-lb',
                label: '1. Virtual IP Traffic',
                protocol: 'Anycast TCP',
              },
              {
                from: 'l4-network-lb',
                to: 'l7-application-lb',
                label: '2. Wire-speed L4 Distribution',
                protocol: 'Line Rate',
              },
              {
                from: 'l7-application-lb',
                to: 'health-checker',
                label: '3. Filter Unhealthy Nodes',
                protocol: 'Registry Query',
              },
              {
                from: 'l7-application-lb',
                to: 'backend-fleet',
                label: '4. Forward to Least-Loaded Server',
                protocol: 'Internal HTTP',
              },
            ],
            keyTakeaways: [
              'L4 vs L7 Choice: Use L4 (NLB) for extreme throughput, gaming protocols, or non-HTTP traffic. Use L7 (ALB) for URL path routing, SSL offloading, and sticky sessions.',
              'Health Check Flapping: Always use hysteresis thresholds (e.g. 3 successes, 2 failures). Without this, a server hovering at 99% CPU will oscillate between healthy and dead every 5 seconds, causing routing instability.',
              'Connection Draining: When removing a server from a pool, do NOT terminate it immediately. Stop sending NEW requests, allow existing connections up to 300 seconds to complete gracefully, then shut down.',
            ],
            rawSpec: `CLIENTS (Ticket Buyers, 400,000 concurrent)
   │
   ▼
[ Anycast DNS / VIP: 104.16.20.1 ]
   │
   ▼ Layer 4 Load Balancer (NLB / eBPF)
   │ (Fast 5-tuple hash, no SSL decryption, > 1M RPS)
   ├───────────────────────────────┬───────────────────────────────┐
   ▼                               ▼                               ▼
[ L7 Proxy 1: Envoy ]       [ L7 Proxy 2: Envoy ]       [ L7 Proxy 3: Envoy ]
 (SSL termination, URL routing, cookie inspection, least-connections)
   │                               │                               │
   ├───────────────┬───────────────┴───────────────┬───────────────┤
   ▼               ▼                               ▼               ▼
[ Queue Pool ]  [ Seat-Map Pool ]              [ Checkout-14 ]  [ Checkout-15 ]
 (Healthy ✓)     (Healthy ✓)                     (UNHEALTHY ✗)   (Healthy ✓)
                                                 [Skipped by LB]`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'What Happens Behind the Scenes?',
      icon: 'ti-search',
      blocks: [
        { type: 'heading2', text: 'Direct Server Return (DSR) & Graceful Draining' },
        {
          type: 'bullets',
          items: [
            'Direct Server Return (DSR): In typical web traffic, incoming requests are tiny (~1 KB), but outgoing video/HTML responses are huge (~1 MB). In a DSR setup, request packets pass through the load balancer, but the backend servers send the response directly back to the client. This can dramatically increase load balancer throughput since it never has to carry the heavy return traffic.',
            'Connection Draining / Deregistration Delay: When you take a server out of service (e.g. for a deployment), the load balancer stops giving it new requests but lets requests already in progress finish within a grace window (e.g. 60–300s). Users downloading files never get cut off.',
            'Active vs. Passive Health Checks: Active checks poll /healthz proactively every N seconds. Passive checks watch real user traffic: if a server returns three 502 Bad Gateway errors in a row, it is removed from the pool immediately, without waiting for the next scheduled probe.',
          ],
        },
        {
          type: 'flow',
          title: 'Direct Server Return — big responses skip the balancer',
          code: `flowchart LR
  C([Client]):::client -->|"small request ~1 KB"| LB["Load balancer"]:::network
  LB -->|"forward request"| S["Backend server"]:::server
  S -->|"large response ~1 MB<br/>sent directly"| C`,
        },
        {
          type: 'flow',
          title: 'Health checks — when is a server pulled out?',
          code: `flowchart TD
  P["Probe GET /healthz every 5s<br/>+ watch real responses"]:::security --> Q{"2 failed probes in a row<br/>or 3 straight 502s?"}
  Q -->|"no"| H["Stays in pool"]:::server
  Q -->|"yes"| U["Marked unhealthy<br/>no new traffic"]:::external
  U --> R{"3 successful probes<br/>in a row?"}
  R -->|"yes"| SS["Back in pool with slow-start"]:::highlight
  R -->|"no"| U`,
          text: 'Requiring several failures to remove and several successes to restore (hysteresis) stops a borderline server from flapping in and out every few seconds.',
        },
      ],
    },

    {
      id: 'misconceptions',
      title: 'Common Misconceptions',
      icon: 'ti-alert-circle',
      blocks: [
        { type: 'heading2', text: 'Top 3 Fallacies About Load Balancers' },
        {
          type: 'bullets',
          items: [
            'Misconception 1: "Load balancers never fail." Reality: Load balancers are servers too! If you only have one, it is a single point of failure (SPOF) — if it dies, the whole site is down. Production setups run Active-Passive pairs (a standby takes over the shared IP via VRRP / Keepalived), or spread the load across many balancers using Anycast BGP.',
            'Misconception 2: "Round Robin is always the best algorithm." Reality: Round Robin works poorly when request processing time is uneven. If Server A gets 3 complex reporting queries (10s each) and Server B gets 3 health-checks (2ms each), Round Robin continues overloading Server A. Least Connections prevents this bottleneck.',
            'Misconception 3: "Sticky sessions (session affinity) are a best practice." Reality: Sticky sessions defeat the core purpose of load balancing. If one user runs an expensive query or has high traffic, their assigned server gets crushed while others sit idle. The modern best practice is stateless backends with shared Redis session storage.',
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
            'In System Design Interviews: Always place load balancers between: (1) Clients and Web Servers, (2) Web Servers and Internal Microservices, and (3) Application Servers and Read-Replica Databases.',
            'Global Server Load Balancing (GSLB): For multi-region architectures (US, Europe, Asia), use GeoDNS or Anycast to send each user to the nearest region, where a regional load balancer then picks a server.',
            'Preventing Thundering Herd: When a crashed service comes back online, routing 100,000 waiting requests instantly will crash it again. Advanced load balancers use slow-start (ramping traffic up over 60 seconds) to warm caches gracefully.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'In interviews, specify whether your load balancer is L4 (NLB) or L7 (ALB). Choosing L4 for high-throughput streaming/WebSockets and L7 for REST API routing demonstrates senior-level architectural maturity.',
        },
        {
          type: 'flow',
          title: 'Where load balancers sit in a typical design',
          code: `flowchart TB
  U([Users worldwide]):::client --> G["GeoDNS / Anycast<br/>pick nearest region"]:::network
  G --> LB1["Regional load balancer"]:::network
  LB1 --> W1[Web server]:::server
  LB1 --> W2[Web server]:::server
  W1 --> LB2["Internal load balancer"]:::network
  W2 --> LB2
  LB2 --> M1[Microservice]:::server
  LB2 --> M2[Microservice]:::server
  M1 --> R[(Read replicas)]:::db
  M2 --> R`,
        },
      ],
    },
  ],
};
