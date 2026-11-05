import type { CoreConcept } from '../core-concepts-data';

export const howWebsiteIsServed: CoreConcept = {
  id: 'how-website-is-served',
  title: 'How a Website is Served',
  emoji: '🖥️',
  icon: 'ti-server',
  color: '#f97316',
  bg: '#ffedd5',
  accentGlow: 'rgba(249,115,22,0.15)',
  difficulty: 'Beginner',
  tagline:
    'From browser to web server to app to database and back — the complete journey of a web request.',
  tags: ['Web Server', 'Nginx', 'CDN', 'Static vs Dynamic', 'Origin Server'],
  estimatedTime: '35 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: "When you visit a website, dozens of components work together in milliseconds to deliver a response. Your browser's request travels across the Internet to a web server. That server may run code, query a database, or call other APIs to build the response, which then travels back to you. Understanding this end-to-end journey is the foundation of web development and backend engineering.",
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: think of a restaurant. The CDN is a takeaway counter near your home stocked with ready-made items (static files). If what you want is not there, your order goes to the restaurant: the host at the door (Nginx / reverse proxy) passes it to the kitchen (application server), which fetches ingredients from the pantry (database) and cooks your dish (the page) to order.',
        },
        {
          type: 'flow',
          title: "The big picture — a request's round trip",
          code: `flowchart LR
  B([Browser]):::client -->|"HTTPS request"| CDN["CDN edge<br/>near the user"]:::cache
  CDN -->|"not cached"| NG["Nginx<br/>web server / reverse proxy"]:::network
  NG --> APP["App server<br/>Node.js / Django"]:::server
  APP --> DB[(Database)]:::db
  APP --> R[(Redis cache)]:::cache
  APP -.->|"HTML or JSON"| NG
  NG -.-> CDN
  CDN -.->|"response"| B`,
          text: 'Solid arrows are the request going in, dotted arrows are the response coming back. Many requests never get past the CDN at all.',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Static vs. Dynamic Content' },
        {
          type: 'bullets',
          items: [
            'Static content: Files that do not change — HTML, CSS, JS, images. The same file is served to every user. Can be cached aggressively. Served directly from a CDN or web server.',
            "Dynamic content: Generated on-demand for each request — user's profile page, a search result, personalized content. Requires an application server to compute the response using data from a database.",
            'Modern websites use both: static assets (CSS, JS, images) served from CDN; dynamic data served from API servers.',
          ],
        },
        {
          type: 'flow',
          title: 'Static or dynamic — where is it served from?',
          code: `flowchart TD
  R["Incoming request"]:::client --> Q{"Is it the same file<br/>for every user?"}
  Q -->|"Yes: CSS, JS, images"| S["Static: serve the file<br/>from CDN or Nginx"]:::cache
  Q -->|"No: profile, feed, search"| D["Dynamic: app server<br/>runs code"]:::server
  D --> DB[(Database)]:::db
  DB --> P["Personalised response<br/>built for this user"]:::highlight`,
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Web Server vs. Application Server' },
        {
          type: 'bullets',
          items: [
            'Web Server (Nginx, Apache): Handles HTTP connections, serves static files, terminates TLS (decrypts HTTPS), and acts as a reverse proxy. Extremely efficient at I/O (reading and writing network data and files) — it can juggle thousands of simultaneous connections.',
            'Application Server (Node.js, Django, Spring Boot): Runs your business logic code. Handles dynamic requests, executes code, queries databases, calls APIs.',
            'Common pattern: Nginx (web server) → Node.js/Django (app server). Nginx handles the heavy I/O lifting; the app server focuses on business logic.',
          ],
        },
        { type: 'heading2', text: 'Reverse Proxy' },
        {
          type: 'paragraph',
          text: 'A reverse proxy (Nginx, HAProxy) is a server that sits in front of your application servers and receives requests on their behalf. Clients only ever connect to the reverse proxy — never directly to your app servers. That one front door can handle TLS termination, load balancing, static file serving, caching, rate limiting, logging, and security for everything behind it.',
        },
        {
          type: 'flow',
          title: 'Reverse proxy — one front door',
          code: `flowchart LR
  C([Clients]):::client -->|"HTTPS"| RP["Nginx reverse proxy<br/>TLS, caching, rate limits"]:::network
  RP -->|"/static/*"| F["Static files on disk"]:::cache
  subgraph PRIV["Private network - not reachable from Internet"]
    A1[App server 1]:::server
    A2[App server 2]:::server
  end
  RP -->|"/api/*"| A1
  RP -->|"/api/*"| A2`,
        },
        { type: 'heading2', text: 'CDN — Content Delivery Network' },
        {
          type: 'paragraph',
          text: 'A CDN is a worldwide network of "edge" servers — servers placed in cities close to users. Copies of static assets (CSS, JS, images, fonts) are cached on these edge nodes. A user in Mumbai gets assets from a Mumbai CDN node instead of a server in the US, so the data travels a much shorter distance. This dramatically reduces latency (waiting time) for static content. Examples: Cloudflare, AWS CloudFront, Fastly, Akamai.',
        },
        {
          type: 'flow',
          title: 'CDN — nearby copies instead of a long trip',
          code: `flowchart LR
  M([User in Mumbai]):::client -->|"~15 ms"| EM["CDN edge Mumbai"]:::cache
  L([User in London]):::client -->|"~15 ms"| EL["CDN edge London"]:::cache
  EM -.->|"only on cache miss<br/>~250 ms"| O["Origin server<br/>in the US"]:::server
  EL -.->|"only on cache miss"| O`,
          text: 'The long trip to the origin happens once per file per edge. After that, nearby users get the cached copy.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'What Happens When You Load twitter.com' },
        {
          type: 'numbered',
          items: [
            "DNS: twitter.com → 104.244.42.65 (Twitter's edge IP, via Akamai CDN).",
            'TCP + TLS: Establish encrypted connection to the CDN edge node.',
            'HTTP request arrives at CDN. CDN checks: "Is the home page HTML cached?" If yes → return immediately.',
            "Cache miss: CDN forwards request to Twitter's Origin Servers (actual web servers).",
            'Nginx (reverse proxy) on origin server receives the request.',
            'Nginx routes to appropriate backend service (e.g., Timeline Service).',
            'Timeline Service queries Redis for cached feed, Cassandra for tweets.',
            'Aggregates response, builds JSON or HTML.',
            'Response travels back: App Server → Nginx → CDN (CDN caches it) → Your Browser.',
            'Browser receives HTML. Makes additional requests for CSS, JS, images — mostly served from CDN cache.',
          ],
        },
        {
          type: 'flow',
          title: 'Loading twitter.com — cache hit vs miss',
          code: `sequenceDiagram
  participant B as Browser
  participant C as CDN edge
  participant N as Nginx (origin)
  participant T as Timeline Service
  participant D as Redis / Cassandra
  B->>C: GET / over TCP + TLS
  alt Cached at the edge
    C-->>B: 200 OK (served from cache)
  else Cache miss
    C->>N: Forward request to origin
    N->>T: Route to Timeline Service
    T->>D: Read cached feed and tweets
    D-->>T: Data
    T-->>N: HTML or JSON
    N-->>C: Response
    Note over C: Store a copy for next time
    C-->>B: 200 OK
  end
  B->>C: GET CSS, JS, images (mostly cache hits)`,
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        {
          type: 'code',
          lang: 'text',
          code: `Browser
  │ HTTPS
  ▼
CDN Edge Node (Cloudflare/Akamai — nearest to user)
  │ Cache HIT → return static files immediately
  │ Cache MISS → forward to origin
  ▼
Load Balancer (Layer 7 — HTTP-aware)
  │ Routes based on URL path, headers
  ▼
Nginx (Web Server / Reverse Proxy)
  │ Serves static files from /var/www/static/
  │ Proxies API requests to app servers
  ▼
Application Server (Node.js / Python / Java)
  │ Business logic, authentication, authorization
  ▼
Database (PostgreSQL, MySQL)   Redis (Cache)
  │ Query, return data              │ Fast reads
  ▼                                 ▼
           Response assembled
                   │
           Back up the chain to browser`,
        },
        {
          type: 'flow',
          title: 'The serving stack, layer by layer',
          code: `flowchart TB
  B([Browser]):::client -->|"HTTPS"| CDN["CDN edge node"]:::cache
  CDN -->|"cache HIT"| B
  CDN -->|"cache MISS"| LB["Load balancer - L7"]:::network
  LB --> NG["Nginx<br/>static files + proxy"]:::network
  NG --> APP["Application server<br/>business logic, auth"]:::server
  APP --> DB[(PostgreSQL / MySQL)]:::db
  APP --> R[(Redis cache)]:::cache`,
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Nginx Configuration — The Reverse Proxy Pattern' },
        {
          type: 'code',
          lang: 'text',
          code: `# Nginx config: serve static files, proxy APIs
server {
  listen 443 ssl;
  server_name myapp.com;
  
  # TLS certificates
  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;
  
  # Static files served directly (fast, no app server)
  location /static/ {
    root /var/www/;
    expires 1y;   # Cache for 1 year
    add_header Cache-Control "public, immutable";
  }
  
  # API requests proxied to Node.js app server
  location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # Everything else goes to the React SPA
  location / {
    try_files $uri /index.html;
  }
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
          title: 'Serving a page at a glance',
          code: `flowchart LR
  B([Browser]):::client --> C{"CDN<br/>cached?"}:::cache
  C -->|"hit"| B
  C -->|"miss"| LB["Load balancer"]:::network
  LB --> NG["Nginx"]:::network
  NG --> APP["App server"]:::server
  APP --> DB[(Database)]:::db`,
          text: 'The step cards below explain what each tier does.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-web-serving-flow',
            title: 'Multi-Tier Web Serving & Edge Delivery Architecture',
            subtitle:
              'Edge CDN caching, global anycast load balancing, Nginx reverse proxying, and application microservices',
            nodes: [
              {
                id: 'browser-client',
                name: 'Client Browser',
                subtitle: 'User Requests Web Application',
                type: 'client',
                icon: 'ti-browser',
                badge: 'Client',
                protocol: 'HTTPS :443',
                details: [
                  'Requests index.html document, followed by referenced CSS, JavaScript bundles, and images in parallel',
                  'Sends ETag and If-Modified-Since headers to check if local browser cache is still fresh',
                ],
              },
              {
                id: 'edge-cdn',
                name: 'Edge CDN (Cloudflare / CloudFront)',
                subtitle: 'Global Edge Point of Presence (PoP)',
                type: 'gateway',
                icon: 'ti-cloud',
                badge: 'Edge Cache',
                protocol: 'Anycast DNS',
                details: [
                  'Cache HIT (< 15ms): Immediately returns static assets (images, CSS, JS) from regional edge RAM/SSD',
                  'Cache MISS: Forwards request to origin server; caches response according to Cache-Control headers',
                  'Absorbs DDoS traffic and blocks malicious bots before reaching origin infrastructure',
                ],
              },
              {
                id: 'load-balancer',
                name: 'Global Load Balancer (ALB)',
                subtitle: 'Layer-7 Application Traffic Router',
                type: 'network',
                icon: 'ti-arrows-split-2',
                badge: 'Load Balancer',
                protocol: 'Health Checks',
                details: [
                  'Distributes incoming HTTP traffic across healthy target server instances using Round-Robin or Least Connections',
                  'Conducts periodic health-check pings (/health); automatically removes unhealthy nodes in seconds',
                ],
              },
              {
                id: 'web-server-proxy',
                name: 'Web Server / Reverse Proxy (Nginx)',
                subtitle: 'Edge Web Server & Proxy',
                type: 'server',
                icon: 'ti-server',
                badge: 'Nginx / Caddy',
                protocol: 'SSL Offload & Gzip',
                details: [
                  'Directly serves local static fallback files using high-performance sendfile() system call',
                  'Compresses responses with Brotli / Gzip; sets security headers (HSTS, Content-Security-Policy)',
                  'Passes dynamic API requests (/api/*) to application servers over Unix domain sockets or fast intranet TCP',
                ],
              },
              {
                id: 'app-service-cluster',
                name: 'Application Cluster (Node.js / Go)',
                subtitle: 'Stateless Business Logic Tier',
                type: 'server',
                icon: 'ti-cpu',
                badge: 'App Workers',
                protocol: 'Express / Fastify',
                details: [
                  'Executes application business logic, user authentication, and data transformations',
                  'Stateless design: any server can handle any user request, enabling horizontal auto-scaling',
                ],
              },
              {
                id: 'database-cache-tier',
                name: 'Database & In-Memory Cache',
                subtitle: 'PostgreSQL & Redis Tier',
                type: 'database',
                icon: 'ti-database',
                badge: 'Data Layer',
                protocol: 'SQL / Redis RESP',
                details: [
                  'Redis cache stores active user sessions and frequent query results for sub-millisecond retrieval',
                  'PostgreSQL persists transactional data with ACID integrity and read-replica replication',
                ],
              },
            ],
            connections: [
              {
                from: 'browser-client',
                to: 'edge-cdn',
                label: '1. HTTPS Request',
                protocol: 'Edge Anycast',
              },
              {
                from: 'edge-cdn',
                to: 'load-balancer',
                label: '2. Cache Miss → Origin',
                protocol: 'Origin Fetch',
              },
              {
                from: 'load-balancer',
                to: 'web-server-proxy',
                label: '3. Layer-7 Route',
                protocol: 'HTTP Proxy',
              },
              {
                from: 'web-server-proxy',
                to: 'app-service-cluster',
                label: '4. proxy_pass /api',
                protocol: 'Fast TCP',
              },
              {
                from: 'app-service-cluster',
                to: 'database-cache-tier',
                label: '5. Query / Cache Read',
                protocol: 'TCP Connection Pool',
              },
            ],
            keyTakeaways: [
              'Static vs Dynamic: 80%+ of bytes on the web are static. Serving static assets via CDN edges eliminates server load and drops latency from 300ms to 15ms.',
              'Role of Reverse Proxy: Never expose Node.js directly to the public internet. Nginx handles slow client connections, TLS termination, compression, and request buffering efficiently.',
              'Stateless Scaling: By storing state in Redis or database instead of application server memory, you can spin up 100 app instances without session loss.',
            ],
            rawSpec: `REQUEST PATH:
Browser ──(HTTPS)──> CDN ──> Load Balancer ──> Nginx ──> App Server ──> DB

STATIC ASSET PATH (fast, CDN cache):
Browser ──> CDN EDGE (cache HIT) ──> Response (< 10ms)

DYNAMIC API PATH:
Browser ──> CDN (miss) ──> LB ──> App Server ──> Redis (fast)
                                                   └──> DB (fallback)

RESPONSE TIMES (approximate):
CDN cache hit:     5-20ms
Origin static:     50-100ms
Dynamic (cached):  50-150ms
Dynamic (DB):      100-500ms`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'HTTP Keep-Alive' },
        {
          type: 'paragraph',
          text: 'HTTP/1.1 by default keeps TCP connections open after a response (Connection: keep-alive). This means the second request on the same page does not need a new TCP handshake. A browser makes 50+ requests for a single page (HTML, CSS, JS, images) — keep-alive dramatically reduces the total time.',
        },
        {
          type: 'flow',
          title: 'Keep-alive — reuse one connection',
          code: `sequenceDiagram
  participant B as Browser
  participant S as Server
  B->>S: TCP + TLS handshake (once)
  B->>S: GET /index.html
  S-->>B: 200 OK
  B->>S: GET /app.css (same connection, no new handshake)
  S-->>B: 200 OK
  B->>S: GET /logo.png (same connection)
  S-->>B: 200 OK`,
        },
        { type: 'heading2', text: 'Worker Processes and Concurrency' },
        {
          type: 'paragraph',
          text: 'Nginx handles many connections at once using an event-driven, non-blocking design: instead of waiting idly for one slow client, each worker process moves on to whichever connection has data ready. So a few worker processes can serve thousands of simultaneous connections without the overhead of constantly switching between many processes. In contrast, a traditional Apache server using the "prefork" model starts a separate process for each connection — very memory-hungry. This is why Nginx replaced Apache as the preferred web server for high-traffic sites.',
        },
        {
          type: 'flow',
          title: 'Process-per-connection vs event loop',
          code: `flowchart TB
  subgraph AP["Apache prefork"]
    C1([Conn 1]):::client --> P1[Process 1]:::server
    C2([Conn 2]):::client --> P2[Process 2]:::server
    C3([Conn 3]):::client --> P3[Process 3]:::server
  end
  subgraph NX["Nginx event-driven"]
    D1([Conn 1]):::client --> W["One worker<br/>handles whichever<br/>connection is ready"]:::highlight
    D2([Conn 2]):::client --> W
    D3([Conn 3]):::client --> W
  end`,
          text: 'Each Apache process costs memory even while it waits. One Nginx worker multiplexes many connections, so memory stays flat as traffic grows.',
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
            'Myth: "The server stores the whole website and sends it to you." Reality: For dynamic sites, the page does not exist until you request it. It is generated on-the-fly from database data.',
            'Myth: "CDN is only for big companies." Reality: CDNs are trivially easy to add (Cloudflare is free) and immediately improve performance and reliability for any site.',
            'Myth: "The web server runs the application code." Reality: Typically, the web server (Nginx) just handles HTTP connections and proxies to a separate application server that runs the code.',
            'Myth: "More servers = faster response." Reality: Response speed for a single request depends on latency (serial operations). For throughput (handling more users), more servers help. For latency, caching and database optimization matter more.',
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
            'Three-tier architecture: Presentation (browser/CDN) → Logic (app servers) → Data (databases). The standard model for scalable web applications.',
            'Microservices: Instead of one monolithic app server, multiple specialized services. Nginx/API Gateway routes requests to the right service.',
            'Containerization: Each component (Nginx, app server, database) runs in a Docker container, orchestrated by Kubernetes.',
            'Horizontal scaling: Add more app servers behind the load balancer. Nginx/LB distributes traffic across all of them.',
            'Database connection pooling: App servers maintain a pool of open database connections instead of opening a new one per request (expensive). PgBouncer for PostgreSQL.',
          ],
        },
      ],
    },
  ],
};
