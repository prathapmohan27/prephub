import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 2 — How DNS Works
// ─────────────────────────────────────────────────────────────────────────────
export const howDnsWorks: CoreConcept = {
  id: 'how-dns-works',
  title: 'How DNS Works',
  emoji: '🔍',
  icon: 'ti-search',
  color: '#8b5cf6',
  bg: '#ede9fe',
  accentGlow: 'rgba(139,92,246,0.15)',
  difficulty: 'Beginner',
  tagline: 'The phonebook of the Internet — how google.com becomes 142.250.80.46 in milliseconds.',
  tags: ['DNS Resolver', 'Nameservers', 'Caching', 'TTL', 'A Records'],
  estimatedTime: '30 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'The Domain Name System' },
        {
          type: 'paragraph',
          text: "DNS (Domain Name System) is the Internet's phonebook. Computers communicate using IP addresses (like 142.250.80.46), but humans remember names (like google.com). DNS translates human-readable domain names into machine-readable IP addresses.",
        },
        {
          type: 'paragraph',
          text: 'Every time you type a URL in your browser, visit a website, send an email, or open an app — a DNS lookup happens in the background. It is one of the most fundamental services on the Internet, yet almost invisible to end users.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'DNS is a distributed, hierarchical database. "Distributed" means no single server holds every name-to-IP mapping. "Hierarchical" means the servers are arranged like a tree: a few at the top point you to the next level down, until you reach the server that holds the real answer.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: "In simple terms: DNS is like asking for directions in a big city. You ask a helpful guide (the resolver). If they do not already know, they ask the city office (root), which sends them to the right district office (.com), which sends them to the building manager (google.com's nameserver), who gives the exact address. The guide remembers it so the next person gets the answer instantly.",
        },
        {
          type: 'flow',
          title: 'The big picture — name in, IP address out',
          code: `flowchart LR
  B(["Browser<br/>needs google.com"]):::client -->|"What is the IP?"| R["DNS Resolver<br/>8.8.8.8 or your ISP"]:::network
  R --> C{"Already<br/>in cache?"}
  C -->|"yes, usually"| A["142.250.80.46"]:::highlight
  C -->|"no"| H["Ask the hierarchy<br/>root, .com, google.com"]:::external
  H --> A
  A --> B`,
          text: 'Most lookups are answered from a cache in about a millisecond. The full walk down the hierarchy only happens when the cached answer has expired.',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'The Problem' },
        {
          type: 'paragraph',
          text: 'IP addresses change. Companies move servers, add capacity, migrate to cloud, change providers. If your browser bookmarked IP addresses instead of domain names, every time google.com changed its server, you would need to update your bookmark. DNS lets the IP change while the domain name stays the same.',
        },
        {
          type: 'flow',
          title: 'Same name, different answers',
          code: `flowchart TB
  Q(["Lookup: shop.com"]):::client --> DNS["DNS for shop.com"]:::network
  DNS -->|"user in India"| S1["Mumbai server<br/>13.0.0.10"]:::server
  DNS -->|"user in US"| S2["Virginia server<br/>54.0.0.20"]:::server
  DNS -.->|"Virginia down, failover"| S3["Oregon server<br/>34.0.0.30"]:::server`,
          text: 'Because users only remember the name, DNS is free to point it at whichever server is nearest, least busy, or still healthy.',
        },
        { type: 'heading2', text: 'Key Benefits of DNS' },
        {
          type: 'bullets',
          items: [
            'Human-friendly names: google.com is easier to remember than 142.250.80.46.',
            'Indirection: IP addresses can change without users needing to do anything. Just update the DNS record.',
            'Load distribution: DNS can return different IP addresses for the same domain to distribute load across multiple servers.',
            "Geographic routing: DNS can return the nearest server's IP to the user's location (GeoDNS).",
            'Redundancy: Multiple IP addresses can be returned for the same domain for failover.',
          ],
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'The Four Key Players in DNS Resolution' },
        {
          type: 'bullets',
          items: [
            "DNS Resolver (Recursive Resolver): Your device's first call. Usually provided by your ISP, or a public resolver like 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare). It does the work of finding the answer by querying other DNS servers.",
            'Root Nameserver: The top of the DNS hierarchy. Knows where to find the nameservers for all top-level domains (.com, .org, .in, etc.). There are 13 root nameserver clusters worldwide.',
            "TLD Nameserver (Top-Level Domain): Knows where to find nameservers for all domains ending in .com, .org, etc. For google.com, the .com TLD nameserver knows google's authoritative nameserver.",
            "Authoritative Nameserver: The final authority. Holds the actual DNS records for a domain. For google.com, Google's own nameservers (ns1.google.com, etc.) hold the real IP addresses.",
          ],
        },
        {
          type: 'flow',
          title: 'The DNS tree — who knows what',
          code: `flowchart TB
  ROOT["Root nameservers<br/>know where every TLD lives"]:::network
  ROOT --> COM[".com TLD"]:::network
  ROOT --> ORG[".org TLD"]:::network
  ROOT --> IN[".in TLD"]:::network
  COM --> G["ns1.google.com<br/>authoritative"]:::db
  COM --> AMZ["Amazon nameservers<br/>authoritative"]:::db
  G --> REC["google.com A 142.250.80.46"]:::highlight`,
          text: 'Each level only knows the next level down. Only the authoritative nameserver at the bottom holds the actual IP address.',
        },
        { type: 'heading2', text: 'DNS Record Types' },
        {
          type: 'bullets',
          items: [
            'A Record: Maps a domain to an IPv4 address. google.com → 142.250.80.46',
            'AAAA Record: Maps a domain to an IPv6 address.',
            'CNAME Record: Alias from one domain to another. www.google.com → google.com',
            'MX Record: Mail server for a domain. google.com → mail servers for Gmail.',
            'NS Record: Nameserver for a domain. Tells where to find authoritative answers.',
            'TXT Record: Arbitrary text. Used for domain verification, SPF (email anti-spam), etc.',
            'TTL (Time to Live): How long a DNS record should be cached. A TTL of 300 = cache for 5 minutes.',
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'Full DNS Resolution: typing google.com' },
        {
          type: 'numbered',
          items: [
            'Browser checks its own DNS cache. If google.com was visited recently and TTL has not expired — use cached IP. Done in 0ms.',
            'OS checks the local DNS cache (and the /etc/hosts file). If found, return immediately.',
            "OS queries the Recursive Resolver (e.g., 8.8.8.8). This is typically your ISP's resolver or a public DNS.",
            'Resolver checks its own cache. If cached and TTL valid, return the answer immediately.',
            'If not cached: Resolver asks a Root Nameserver: "Who handles .com?"',
            'Root Nameserver responds: "Ask the .com TLD nameserver at [address]."',
            'Resolver asks the .com TLD nameserver: "Who handles google.com?"',
            '.com TLD nameserver responds: "Ask ns1.google.com at [address]."',
            'Resolver asks ns1.google.com: "What is the IP for google.com?"',
            'ns1.google.com responds: "google.com → 142.250.80.46, TTL=300"',
            'Resolver caches the answer for 300 seconds and returns it to your browser.',
            'Browser now connects to 142.250.80.46 on port 443 for HTTPS.',
          ],
        },
        {
          type: 'flow',
          title: 'Full lookup when nothing is cached (steps 3-11)',
          code: `sequenceDiagram
  participant B as Browser / OS
  participant R as Resolver 8.8.8.8
  participant Root as Root NS
  participant TLD as .com TLD NS
  participant A as ns1.google.com
  B->>R: IP for google.com?
  R->>Root: Who handles .com?
  Root-->>R: Ask the .com TLD servers
  R->>TLD: Who handles google.com?
  TLD-->>R: Ask ns1.google.com
  R->>A: IP for google.com?
  A-->>R: 142.250.80.46, TTL 300
  Note over R: Cache the answer for 300 seconds
  R-->>B: 142.250.80.46`,
          text: 'The browser asks one question. The resolver does the legwork, asking three servers in turn, each one pointing it closer to the answer.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'In practice, steps 5-10 rarely happen. Recursive resolvers cache heavily. Most DNS queries resolve from cache in < 1ms. The full recursive lookup (steps 5-10) only happens when the TTL has expired, typically once every few minutes for popular sites.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'DNS Cache Hierarchy' },
        {
          type: 'code',
          lang: 'text',
          code: `Browser Cache (0ms)
   ↓ miss
OS/System Cache (0ms)
   ↓ miss
Recursive Resolver Cache (1-5ms, network)
   ↓ miss
Root Nameserver → TLD Nameserver → Authoritative NS
(~50-150ms total, multiple network round-trips)`,
        },
        {
          type: 'flow',
          title: 'Cache check order — stop at the first hit',
          code: `flowchart TD
  Q([Need IP for google.com]):::client --> BC{"Browser cache?"}:::cache
  BC -->|"hit, 0ms"| DONE["Use the IP"]:::highlight
  BC -->|"miss"| OS{"OS cache or<br/>hosts file?"}:::cache
  OS -->|"hit, 0ms"| DONE
  OS -->|"miss"| RC{"Resolver cache?"}:::cache
  RC -->|"hit, 1-5ms"| DONE
  RC -->|"miss"| FULL["Root, TLD, authoritative<br/>50-150ms"]:::external
  FULL --> DONE`,
          text: 'Each cache layer is faster than the one below it. Only a miss at every level triggers the slow full lookup.',
        },
        { type: 'heading2', text: 'Popular Public DNS Resolvers' },
        {
          type: 'bullets',
          items: [
            '8.8.8.8 / 8.8.4.4: Google Public DNS. Fast, reliable, global.',
            '1.1.1.1 / 1.0.0.1: Cloudflare DNS. Claims to be the fastest public DNS resolver. Privacy-focused.',
            '9.9.9.9: Quad9. Security-focused — blocks known malicious domains.',
            'ISP DNS: Default for most users. Often slower but usually good enough.',
          ],
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'DNS in Website Migration' },
        {
          type: 'paragraph',
          text: 'Imagine your company is moving from a shared hosting server to AWS. The old server IP is 1.2.3.4. The new server IP on AWS is 5.6.7.8. The migration process:',
        },
        {
          type: 'numbered',
          items: [
            'Configure your application on the new server (5.6.7.8). Test it thoroughly.',
            'Lower the TTL on your DNS records to 60 seconds (1 minute). Wait 24 hours for this to propagate.',
            'Update the DNS A record: mysite.com → 5.6.7.8.',
            'Within 60 seconds, all DNS caches worldwide will have expired and serve the new IP.',
            'New traffic goes to AWS. Old cached entries (TTL 60s) expire quickly.',
            'Restore TTL to 3600 (1 hour) once migration is confirmed successful.',
          ],
        },
        {
          type: 'flow',
          title: 'Zero-downtime migration using TTL',
          code: `flowchart LR
  A["Set up and test<br/>new server 5.6.7.8"]:::server --> B["Lower TTL<br/>3600s to 60s"]:::cache
  B --> C["Wait for the old<br/>1-hour TTL to expire"]
  C --> D["Change A record<br/>to 5.6.7.8"]:::network
  D --> E["Within ~60s all caches<br/>use the new IP"]
  E --> F["Raise TTL<br/>back to 3600s"]:::highlight`,
          text: 'The trick is lowering the TTL first. Then, when you change the record, caches only hold the old answer for a minute instead of an hour.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'DNS propagation does NOT take "24-48 hours" as commonly said. With a low TTL, it propagates in minutes. "24-48 hours" was accurate in the 1990s with very high TTLs. With modern short TTLs, DNS changes propagate in minutes.',
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
          title: 'DNS resolution at a glance',
          code: `flowchart LR
  C(["Browser + OS cache"]):::client -->|"1. recursive query"| R["Recursive resolver"]:::network
  R -->|"2. where is .com?"| ROOT["Root NS"]:::network
  R -->|"3. where is google.com?"| TLD[".com TLD NS"]:::network
  R -->|"4. IP of google.com?"| AUTH[("Authoritative NS")]:::db
  R -->|"5. 142.250.80.46, TTL 300"| C
  C -->|"6. connect to port 443"| S["google.com server"]:::server`,
          text: 'One recursive question from the client, three iterative questions from the resolver. The cards below explain each stop.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-dns-hierarchy',
            title: 'Hierarchical 4-Tier DNS Resolution Architecture',
            subtitle:
              'Iterative tree traversal converting domain names into routable 32/128-bit IP addresses in < 25ms',
            nodes: [
              {
                id: 'browser-os-cache',
                name: 'Browser & OS Resolver Cache',
                subtitle: 'Local Client Memory Check',
                type: 'client',
                icon: 'ti-brand-chrome',
                badge: 'Local Cache (L1)',
                protocol: 'chrome://net-internals',
                details: [
                  'Checks browser memory cache (stores recent lookups for 1–5 minutes)',
                  'Checks OS DNS client cache (Windows DNS Cache / macOS mDNSResponder)',
                  'Checks static hosts file (/etc/hosts or system drivers path)',
                ],
              },
              {
                id: 'recursive-resolver',
                name: 'Recursive DNS Resolver',
                subtitle: 'ISP Resolver or 1.1.1.1 / 8.8.8.8',
                type: 'gateway',
                icon: 'ti-server-2',
                badge: 'Query Coordinator',
                protocol: 'UDP Port 53',
                details: [
                  'First external stop: searches shared recursive cache (95%+ of queries resolved here)',
                  'If cache MISS: initiates iterative query chain down the global DNS hierarchy',
                  'Caches final record for the duration of the authoritative TTL',
                ],
              },
              {
                id: 'root-nameserver',
                name: 'Root Nameserver Cluster',
                subtitle: '13 Global Root Authority Clusters',
                type: 'network',
                icon: 'ti-world',
                badge: 'Root Zone (.)',
                protocol: 'Anycast Hundreds of Nodes',
                details: [
                  'Does NOT know specific domain IPs; holds definitive addresses for all TLD servers',
                  'Inspects ".com" suffix in "google.com"',
                  'Returns referral to .com TLD Nameserver IP list',
                ],
              },
              {
                id: 'tld-nameserver',
                name: 'TLD Nameserver (.com / Verisign)',
                subtitle: 'Top-Level Domain Authority',
                type: 'network',
                icon: 'ti-folder',
                badge: 'TLD Zone (.com)',
                protocol: 'TLD Registry',
                details: [
                  'Managed by Verisign for .com/.net; maintains all registered domain NS records',
                  'Identifies registrar-designated authoritative nameserver (e.g., ns1.google.com)',
                  'Returns referral containing authoritative nameserver IP addresses',
                ],
              },
              {
                id: 'authoritative-nameserver',
                name: 'Authoritative Nameserver',
                subtitle: 'ns1.google.com / Route 53 / Cloudflare',
                type: 'database',
                icon: 'ti-database',
                badge: 'Source of Truth',
                protocol: 'Zone File',
                details: [
                  'The definitive owner holding actual DNS zone records (A, AAAA, CNAME, MX, TXT)',
                  'Reads Zone File: "google.com. 300 IN A 142.250.80.46"',
                  'Returns final answer record with 300s TTL back to Recursive Resolver',
                ],
              },
              {
                id: 'dns-client-dispatch',
                name: 'Browser TCP Dispatch',
                subtitle: 'Socket Connection Established',
                type: 'server',
                icon: 'ti-bolt',
                badge: 'IP Obtained',
                protocol: '142.250.80.46:443',
                details: [
                  'Resolver returns IP to browser; OS caches entry for 300 seconds',
                  'Browser initiates TCP 3-way handshake directly to 142.250.80.46:443',
                ],
              },
            ],
            connections: [
              {
                from: 'browser-os-cache',
                to: 'recursive-resolver',
                label: '1. Cache Miss: Recursive Query',
                protocol: 'UDP 53',
              },
              {
                from: 'recursive-resolver',
                to: 'root-nameserver',
                label: '2. "Where is .com?"',
                protocol: 'Iterative',
              },
              {
                from: 'recursive-resolver',
                to: 'tld-nameserver',
                label: '3. "Where is google.com?"',
                protocol: 'Iterative',
              },
              {
                from: 'recursive-resolver',
                to: 'authoritative-nameserver',
                label: '4. "What is IP of google.com?"',
                protocol: 'Iterative',
              },
              {
                from: 'recursive-resolver',
                to: 'dns-client-dispatch',
                label: '5. Answer: 142.250.80.46 (TTL 300)',
                protocol: 'Resolved',
              },
            ],
            keyTakeaways: [
              'Iterative vs Recursive: Client makes 1 Recursive request to Resolver. Resolver makes multiple Iterative queries down the hierarchy.',
              'DNS uses UDP: Requests are single packets (< 512 bytes) to avoid 3-way handshake overhead. Responses over 512 bytes fall back to TCP.',
              'TTL Trade-off: High TTL (e.g. 86400s) minimizes DNS traffic and boosts speed; Low TTL (e.g. 60s) allows near-instant failover during migration.',
            ],
            rawSpec: `                    Root Nameserver (13 clusters)
                   /         |           \
          .com TLD        .org TLD     .in TLD
         /    |    \
   google  amazon  apple  ← Authoritative nameservers
   (ns1.google.com → 142.250.80.46)

Query path for "mail.google.com":
Browser → Resolver → Root → .com TLD → ns1.google.com → IP
          ↑ caches every step for TTL duration

DNS Record on ns1.google.com:
google.com.       300   IN   A       142.250.80.46
mail.google.com.  300   IN   CNAME   googlemail.l.google.com.`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'DNS over UDP' },
        {
          type: 'paragraph',
          text: 'DNS queries are sent over UDP port 53. Why UDP? DNS questions and answers are tiny (usually under 512 bytes) and fit in a single packet. TCP would first need a handshake — an extra round trip — which is wasted time for such a small exchange. If an answer is too large for one UDP packet (e.g., many IP addresses), the client automatically retries over TCP.',
        },
        {
          type: 'flow',
          title: 'UDP first, TCP only when needed',
          code: `flowchart TD
  Q[Send query over UDP 53]:::network --> R{"Response fits<br/>in one packet?"}
  R -->|"yes, almost always"| OK["Done - 1 round trip"]:::highlight
  R -->|"no, marked truncated"| T["Retry over TCP 53<br/>handshake + query"]:::server
  T --> OK2["Done - 2+ round trips"]`,
        },
        { type: 'heading2', text: 'DNS Security Concerns' },
        {
          type: 'bullets',
          items: [
            "DNS Spoofing (Cache Poisoning): An attacker injects false DNS records into a resolver's cache, redirecting users to malicious servers. Fixed by DNSSEC (DNS Security Extensions) — cryptographic signatures on DNS records.",
            'DNS Hijacking: ISP or government redirects DNS queries to their own servers to censor or monitor traffic. Countermeasure: DNS-over-HTTPS (DoH) — encrypts DNS queries so no one can intercept or modify them.',
            "DDoS on DNS: Taking down a company's authoritative DNS server makes their domain unreachable. Solution: Use multiple geographically distributed DNS providers (e.g., Route53 + Cloudflare).",
          ],
        },
        {
          type: 'flow',
          title: 'Cache poisoning and how DNSSEC stops it',
          code: `sequenceDiagram
  participant U as User
  participant R as Resolver
  participant X as Attacker
  participant A as Real nameserver
  R->>A: IP for bank.com?
  X--)R: Fake reply - bank.com is 6.6.6.6
  alt Without DNSSEC
    Note over R: Fake answer cached
    R-->>U: 6.6.6.6 (attacker site)
  else With DNSSEC
    Note over R: Signature check fails, fake reply dropped
    A-->>R: Signed reply - 93.184.216.34
    R-->>U: 93.184.216.34 (real site)
  end`,
          text: 'Without signatures the resolver cannot tell a forged answer from a real one, and every user of that resolver is misdirected until the TTL expires.',
        },
        { type: 'heading2', text: 'GeoDNS — Serving the Nearest Server' },
        {
          type: 'paragraph',
          text: 'DNS can return different IP addresses based on the location of the DNS resolver. A user in India querying google.com gets an IP for a Google server in Mumbai. A user in the US gets a different IP for a Google server in Virginia. This is how large companies serve users from the geographically nearest data center — reducing latency automatically.',
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
            'Myth: "DNS takes 24-48 hours to propagate." Reality: With low TTLs, DNS propagates in minutes.',
            'Myth: "DNS is just a simple lookup." Reality: It is a hierarchical distributed database with caching at every level. The system is extraordinarily sophisticated.',
            'Myth: "Changing DNS provider is instant." Reality: You need to lower TTL before changing, wait for old TTL to expire, then change.',
            'Myth: "My private IP address is hidden." Reality: Your public IP (router) is visible. DNS does not hide IP addresses — it just maps names to them.',
            'Myth: "HTTPS makes DNS secure." Reality: HTTPS encrypts the HTTP data but DNS lookups are still in plaintext (unless using DNS-over-HTTPS).',
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
            'Global Traffic Management: Route53, Cloudflare — use DNS to route users to the nearest server, implement health checks, and failover automatically.',
            'Blue-Green Deployments: Deploy new version on new servers. Update DNS to point to new servers. Instant traffic switch with TTL-based rollback.',
            'Multi-region Architecture: Two data centers (US, EU). GeoDNS routes European users to EU servers, American users to US servers.',
            'Rate Limiting IP-level: DNS helps identify if a domain resolves to multiple IPs — useful when designing distributed rate limiters.',
            'Service Discovery (Internal DNS): In microservices, services use internal DNS to discover each other: payment-service.internal → 10.0.0.15.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'In system design interviews, DNS is often the answer to "How do you route users to the nearest server?" and "How do you implement failover?" — GeoDNS and health-check-based failover routing are fundamental architecture patterns.',
        },
      ],
    },
  ],
};
