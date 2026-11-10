import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 5 — How HTTPS Works
// ─────────────────────────────────────────────────────────────────────────────
export const howHttpsWorks: CoreConcept = {
  id: 'how-https-works',
  title: 'How HTTPS Works',
  emoji: '🔐',
  icon: 'ti-lock',
  color: '#ec4899',
  bg: '#fce7f3',
  accentGlow: 'rgba(236,72,153,0.15)',
  difficulty: 'Foundational',
  tagline:
    'TLS handshake, certificates, public/private keys — how a secure channel is established in milliseconds.',
  tags: ['TLS Handshake', 'SSL Certificates', 'Public Key', 'CA Chain', 'Encryption'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'HTTPS = HTTP + TLS' },
        {
          type: 'paragraph',
          text: 'HTTPS (HTTP Secure) is plain HTTP with an extra encryption layer called TLS (Transport Layer Security). Everything HTTP sends — requests, responses, cookies, passwords — is scrambled before it leaves your device. Anyone watching the traffic in between (your ISP, a hacker on the same WiFi, a government) sees only meaningless gibberish, not your actual data.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: HTTP is like sending a postcard — every postal worker can read it. HTTPS is like sending a locked box. First you check the ID of the person you are sending to (the certificate), then the two of you agree on a secret key that only you both know, and from then on every message travels inside the locked box.',
        },
        {
          type: 'flow',
          title: 'The big picture — postcard vs locked box',
          code: `flowchart LR
  subgraph PLAIN["HTTP (plain text)"]
    B1([Browser]):::client -->|"password=hunter2"| W1{{Public WiFi}}:::network -->|"password=hunter2"| S1[Server]:::server
    W1 -.->|"readable!"| H1[Eavesdropper]:::external
  end
  subgraph SECURE["HTTPS (HTTP + TLS)"]
    B2([Browser]):::client -->|"x8Kf91q... encrypted"| W2{{Public WiFi}}:::network -->|"encrypted"| S2[Server]:::server
    W2 -.->|"gibberish"| H2[Eavesdropper]:::external
  end`,
          text: 'Same network, same eavesdropper. With HTTPS the attacker still sees traffic flowing, but cannot read or change it.',
        },
        { type: 'heading2', text: 'What TLS Provides' },
        {
          type: 'bullets',
          items: [
            'Encryption: Data is encrypted between client and server. Eavesdroppers cannot read it.',
            'Authentication: The certificate proves the server is who it claims to be. You are actually talking to google.com, not an impersonator.',
            'Integrity: Data cannot be changed on the way without the change being detected. This defeats man-in-the-middle (MITM) attacks, where an attacker secretly sits between you and the server and tampers with messages.',
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
          text: 'Plain HTTP is completely readable to anyone between you and the server. On public WiFi, anyone running a packet sniffer (a free tool that records all network traffic nearby) can see your passwords, cookies, and personal data. HTTPS prevents this by encrypting everything. HTTPS is also required for modern browser features (service workers, geolocation, push notifications), and Google ranks HTTPS sites higher in search results.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Symmetric vs. Asymmetric Encryption' },
        {
          type: 'bullets',
          items: [
            'Symmetric encryption: Same key for encrypting and decrypting. Fast (AES-256). Problem: how do you safely share the key with the server? You cannot send it unencrypted.',
            'Asymmetric encryption (Public-Key Cryptography): Two mathematically related keys — a public key and a private key. Anything encrypted with the public key can only be decrypted by the private key (and vice versa). The public key is shared openly. The private key is kept secret by the server.',
            'TLS uses both: the slow asymmetric kind only at the start, to safely agree on a shared symmetric key — then the fast symmetric kind for all the actual data.',
          ],
        },
        {
          type: 'flow',
          title: 'Hybrid encryption — slow to set up, fast to use',
          code: `flowchart TB
  A["Asymmetric crypto<br/>public + private keys<br/>(slow, used once)"]:::security --> K["Shared session key<br/>known only to browser and server"]:::highlight
  K --> S["Symmetric crypto AES<br/>one key encrypts and decrypts<br/>(fast, used for every byte)"]:::security
  S --> D["Encrypted HTTP traffic<br/>pages, cookies, API calls"]:::network`,
          text: 'Asymmetric encryption solves the "how do we share a key safely?" problem. Symmetric encryption then does the heavy lifting because it is far faster.',
        },
        { type: 'heading2', text: 'SSL Certificates' },
        {
          type: 'paragraph',
          text: 'An SSL/TLS certificate is like a digital ID card for a website. It contains: the domain name it is valid for, the server\'s public key, who issued it (the Certificate Authority), and a digital signature from that issuer. It proves "this public key really belongs to google.com." Without certificates, anyone could claim to be google.com.',
        },
        { type: 'heading2', text: 'Certificate Authorities (CAs)' },
        {
          type: 'paragraph',
          text: "A Certificate Authority (CA) is a trusted organization that vouches for certificates — like a passport office vouching for passports. CAs such as DigiCert, Let's Encrypt, and Comodo sign certificates. Your browser and operating system ship with a built-in list of trusted root CAs. When a site presents a certificate, the browser checks the CA's signature on it. If the CA is on the trusted list and the signature is valid, the certificate is trusted.",
        },
        {
          type: 'flow',
          title: 'Can the browser trust this certificate?',
          code: `flowchart TD
  C["Server sends certificate"]:::server --> Q1{"Signed by a CA<br/>the browser trusts?"}
  Q1 -->|No| E["Show security warning<br/>Your connection is not private"]:::external
  Q1 -->|Yes| Q2{"Domain matches<br/>and not expired?"}
  Q2 -->|No| E
  Q2 -->|Yes| OK["Trusted - continue handshake"]:::highlight`,
          text: 'Every check must pass. A single failure and the browser shows the full-page warning instead of the site.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'TLS 1.3 Handshake (Simplified)' },
        {
          type: 'numbered',
          items: [
            'Client Hello: The browser says hello and lists what it supports — TLS versions and cipher suites (the encryption algorithms it can use) — plus a random number (client_random) and its half of the key exchange (a temporary "key share").',
            "Server Hello: The server picks the TLS version and cipher suite, and replies with its own random number (server_random), its own key share, and its certificate (which contains the server's public key).",
            'Certificate Verification: The browser checks the certificate: Is it signed by a trusted CA? Is it expired? Does the domain match? If any check fails → SSL error page.',
            "Key Exchange: Client and server combine the two key shares using ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) — a bit of math that lets two parties arrive at the same secret without ever sending it. The server also signs the handshake with its certificate's private key, proving it really owns that certificate.",
            'Session Key Derived: Both sides now independently compute the same symmetric session key from client_random + server_random + the ECDHE shared secret.',
            'Server Finished: The server sends a "Finished" message encrypted with the new key, confirming nothing was tampered with during the handshake.',
            'Client Finished: The browser sends its own encrypted "Finished" message. Handshake complete.',
            'Encrypted Communication: All further HTTP traffic is encrypted with the symmetric session key (e.g. AES-256-GCM). This is very fast.',
          ],
        },
        {
          type: 'flow',
          title: 'TLS 1.3 handshake — one round trip',
          code: `sequenceDiagram
  participant B as Browser
  participant S as Server
  B->>S: ClientHello (versions, ciphers, client_random, key share)
  S->>B: ServerHello (chosen cipher, server_random, key share)
  S->>B: Certificate + signature proving key ownership
  Note over B: Verify certificate (CA, expiry, domain)
  Note over B,S: Both compute the same session key - it is never sent
  S->>B: Finished (encrypted)
  B->>S: Finished (encrypted)
  B->>S: GET /account (encrypted with session key)
  S->>B: 200 OK (encrypted)`,
          text: 'Notice that only one round trip (there and back) happens before real data can flow. The session key itself never crosses the network.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'TLS 1.3 (2018) completes the handshake in 1 round-trip (1-RTT). Previous TLS 1.2 required 2 round-trips. For repeated connections, TLS 1.3 supports 0-RTT resumption — sending data before the handshake completes.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Certificate Chain of Trust' },
        {
          type: 'code',
          lang: 'text',
          code: `Root CA (DigiCert) — pre-installed in your browser/OS
   │ Signs ↓
Intermediate CA (DigiCert SHA2 High Assurance Server CA)
   │ Signs ↓
Leaf Certificate (*.github.com, valid until 2025-06-01)
   Contains: Public Key, Domain, Issuer, Signature

Browser verification:
1. Check leaf cert is signed by intermediate CA ✓
2. Check intermediate CA is signed by root CA ✓
3. Check root CA is in browser's trusted CA list ✓
4. Check domain matches (github.com) ✓
5. Check expiry date ✓
→ Certificate TRUSTED`,
        },
        {
          type: 'flow',
          title: 'Chain of trust — each level vouches for the next',
          code: `flowchart TB
  R["Root CA - DigiCert<br/>pre-installed in browser/OS"]:::security -->|"signs"| I["Intermediate CA<br/>DigiCert High Assurance"]:::security
  I -->|"signs"| L["Leaf certificate<br/>*.github.com + public key"]:::server
  L -->|"presented to"| B([Browser]):::client
  B -.->|"walks back up the chain<br/>to a root it already trusts"| R`,
          text: 'The browser does not need to know github.com in advance. It only needs to trust the root at the top of the chain.',
        },
        { type: 'heading2', text: 'HSTS — HTTP Strict Transport Security' },
        {
          type: 'paragraph',
          text: 'HSTS is a response header (Strict-Transport-Security: max-age=31536000) that tells browsers: "Always use HTTPS for this domain for the next year. Never fall back to HTTP." Once the browser has seen it, it refuses to connect over plain HTTP. This blocks downgrade attacks, where an attacker tricks your browser into using unencrypted HTTP. Browsers also ship with a pre-loaded HSTS list for major domains, so those are HTTPS-only even on your very first visit.',
        },
        {
          type: 'flow',
          title: 'HSTS — the browser upgrades HTTP by itself',
          code: `flowchart TD
  U["User types http://bank.com"]:::client --> Q{"Has the browser seen<br/>an HSTS header for bank.com?"}
  Q -->|"Yes, or on preload list"| UP["Browser switches to https://<br/>before sending anything"]:::security
  Q -->|"No - first visit"| H["Request goes out over HTTP<br/>attacker could intercept"]:::external
  H --> R["Server redirects to HTTPS<br/>and sends HSTS header"]:::server
  R --> UP
  UP --> S["Secure connection"]:::highlight`,
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'What If You Are on a Public WiFi?' },
        {
          type: 'paragraph',
          text: 'Without HTTPS: A coffee shop hacker captures your packets. They see your Gmail password in plaintext. Game over.',
        },
        {
          type: 'paragraph',
          text: 'With HTTPS: A coffee shop hacker captures your packets. They see: "TLS 1.3 encrypted data, destination: accounts.google.com." They cannot decrypt it without the session key. They cannot impersonate google.com because they do not have Google\'s private key to sign a valid certificate. HTTPS makes your session secure even on hostile networks.',
        },
        {
          type: 'flow',
          title: 'Why a fake hotspot cannot impersonate Google',
          code: `sequenceDiagram
  participant B as Your browser
  participant A as Attacker hotspot
  participant G as accounts.google.com
  B->>A: ClientHello for accounts.google.com
  A->>B: Fake certificate for google.com
  Note over B: Not signed by a trusted CA - or no matching private key
  B-->>B: Abort with security warning
  Note over A,G: Attacker can only relay encrypted bytes it cannot read`,
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
          title: 'HTTPS at a glance',
          code: `flowchart LR
  A([Browser]):::client -->|"1. ClientHello + key share"| B[Server]:::server
  B -->|"2. ServerHello + certificate"| C{"3. Certificate<br/>valid?"}:::security
  C -->|"yes"| D["4. Both derive the<br/>same session key"]:::highlight
  C -->|"no"| X["Warning page"]:::external
  D --> E["5. Encrypted HTTP<br/>with AES-GCM"]:::network`,
          text: 'The step cards below walk through each stage in detail.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-https-flow',
            title: 'TLS 1.3 Cryptographic Handshake & Hybrid Encryption Tunnel',
            subtitle:
              'Asymmetric cryptography for 1-RTT key exchange + hardware-accelerated symmetric AES-GCM for bulk data',
            nodes: [
              {
                id: 'client-hello',
                name: 'ClientHello & Key Share',
                subtitle: 'Client Initiates Handshake',
                type: 'client',
                icon: 'ti-lock-open',
                badge: 'ClientHello (1-RTT)',
                protocol: 'TLS 1.3 / ECDHE',
                details: [
                  'Sends supported TLS version (TLS 1.3), cipher suites (e.g. TLS_AES_256_GCM_SHA384)',
                  'Generates ephemeral Elliptic-Curve key pair; sends public Key Share immediately',
                  'Includes SNI (Server Name Indication) so server knows which SSL certificate to present',
                ],
              },
              {
                id: 'server-hello-cert',
                name: 'ServerHello & Certificate',
                subtitle: 'Server Picks Cipher & Shares Key',
                type: 'gateway',
                icon: 'ti-certificate',
                badge: 'ServerHello',
                protocol: 'X.509 Certificate',
                details: [
                  'Selects agreed cipher suite and responds with server Ephemeral Key Share',
                  'Sends X.509 digital certificate containing server public key and CA cryptographic signature',
                  'Sends Finished HMAC verification hash',
                ],
              },
              {
                id: 'ca-chain-verifier',
                name: 'Certificate Authority (CA) Chain Validation',
                subtitle: 'Cryptographic Trust Verification',
                type: 'security',
                icon: 'ti-shield-check',
                badge: 'Chain of Trust',
                protocol: 'RSA/ECDSA Verify',
                details: [
                  'Client traverses certificate chain up to a pre-installed Root CA in OS/Browser trust store',
                  'Verifies digital signatures mathematically using CA public keys',
                  'Checks certificate expiration dates, domain name match (SAN), and revocation lists (OCSP)',
                ],
              },
              {
                id: 'key-derivation',
                name: 'Independent Shared Key Derivation',
                subtitle: 'ECDHE Mathematical Secret',
                type: 'server',
                icon: 'ti-key',
                badge: 'Shared Secret',
                protocol: 'HKDF / ECDHE',
                details: [
                  'Both client and server combine their own private key with the other party public key share',
                  'Via Diffie-Hellman mathematics, both compute the EXACT same master secret independently',
                  'The shared secret was NEVER transmitted across the wire, making passive sniffing impossible',
                ],
              },
              {
                id: 'encrypted-tunnel',
                name: 'Authenticated Symmetric Tunnel',
                subtitle: 'Wire-Speed Application Data',
                type: 'database',
                icon: 'ti-lock',
                badge: 'Encrypted Stream',
                protocol: 'AES-256-GCM',
                details: [
                  'All HTTP headers, URLs, cookies, and payloads are encrypted using symmetric AES-GCM-256',
                  'AEAD (Authenticated Encryption with Associated Data) guarantees privacy AND tamper detection',
                ],
              },
            ],
            connections: [
              {
                from: 'client-hello',
                to: 'server-hello-cert',
                label: '1. ClientHello + Ephemeral KeyShare',
                protocol: 'TLS 1.3',
              },
              {
                from: 'server-hello-cert',
                to: 'ca-chain-verifier',
                label: '2. ServerHello + Certificate + Finished',
                protocol: 'X.509',
              },
              {
                from: 'ca-chain-verifier',
                to: 'key-derivation',
                label: '3. Validated CA Signature',
                protocol: 'Trust OK',
              },
              {
                from: 'key-derivation',
                to: 'encrypted-tunnel',
                label: '4. Symmetric AES Key Derived (1-RTT)',
                protocol: 'AES-GCM',
              },
            ],
            keyTakeaways: [
              'Hybrid Encryption: Asymmetric cryptography is slow and CPU-heavy, so it is ONLY used during the 1-RTT handshake. All actual data is encrypted with fast symmetric AES-GCM.',
              'Perfect Forward Secrecy (PFS): Because Diffie-Hellman keys are ephemeral (discarded after the session), even if an attacker steals the server private key in the future, they cannot decrypt past recorded sessions.',
              'What HTTPS Hides: HTTPS encrypts URL paths, query parameters, headers, cookies, and body. It only exposes destination IP and domain name (via SNI).',
            ],
            rawSpec: `TLS 1.3 Handshake:

Client                              Server
  │  ClientHello                      │
  │  (TLS 1.3, cipher suites,         │
  │   client_random, key_share)       │
  │ ────────────────────────────────> │
  │                                   │
  │  ServerHello (cipher chosen)      │
  │  Certificate (public key)         │
  │  server_random, key_share         │
  │ <──────────────────────────────── │
  │                                   │
  │  [Both derive session key]        │
  │                                   │
  │  Finished (encrypted)             │
  │ ────────────────────────────────> │
  │  Finished (encrypted)             │
  │ <──────────────────────────────── │
  │                                   │
  │ === SECURE TUNNEL ESTABLISHED === │
  │                                   │
  │  GET /api/user (ENCRYPTED)        │
  │ ────────────────────────────────> │
  │  HTTP/2 200 OK (ENCRYPTED)        │
  │ <──────────────────────────────── │

Total: 1 round trip (1-RTT) to establish encryption in TLS 1.3`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Perfect Forward Secrecy (PFS)' },
        {
          type: 'paragraph',
          text: "Older SSL/TLS often used RSA key exchange: the client encrypted the session key with the server's long-term public key and sent it. If an attacker recorded that traffic and, years later, stole the server's private key, they could decrypt every recorded session. ECDHE gives Perfect Forward Secrecy: each session uses brand-new temporary keys that are thrown away afterwards. Even if the server's private key leaks later, past sessions stay secret.",
        },
        {
          type: 'flow',
          title: 'Stolen private key — old RSA vs ECDHE',
          code: `flowchart TD
  T["Attacker records encrypted traffic today"]:::external --> L["Years later: server private key leaks"]:::external
  L --> Q{"Which key exchange<br/>was used?"}
  Q -->|"RSA key exchange"| R["Session key was sent encrypted<br/>with that key - recover it"]:::external
  R --> RX["All past sessions decrypted"]:::external
  Q -->|"ECDHE"| E["Session keys were temporary<br/>and already deleted"]:::security
  E --> EX["Past sessions stay secret"]:::highlight`,
        },
        { type: 'heading2', text: "Let's Encrypt — Free Certificates" },
        {
          type: 'paragraph',
          text: "Let's Encrypt is a free, automated CA that has made HTTPS universal. Before 2015, certificates cost $50-$300/year. Let's Encrypt provides free certificates with 90-day validity (automatically renewed by tools like Certbot). Over 350 million domains use Let's Encrypt certificates. HTTPS adoption jumped from 30% to 90%+ of web traffic largely due to Let's Encrypt.",
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
            'Myth: "HTTPS means the website is safe/legitimate." Reality: HTTPS only means the connection is encrypted. Phishing sites can and do use HTTPS. The certificate only proves the domain name matches — not that the site is trustworthy.',
            'Myth: "SSL and TLS are different things." Reality: SSL is the old name (SSL 3.0). TLS is the successor (TLS 1.0, 1.1, 1.2, 1.3). SSL is technically deprecated. What people call "SSL certificates" are technically TLS certificates.',
            'Myth: "HTTPS is significantly slower than HTTP." Reality: The TLS handshake adds ~100ms for the first connection. Subsequent requests on the same connection have near-zero overhead. Modern TLS 1.3 with 0-RTT resumption is extremely fast.',
            'Myth: "HTTPS encrypts everything, including DNS." Reality: DNS lookups are still in plaintext (unless using DNS-over-HTTPS). An observer can see which domain you visited but not the specific URL or data.',
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
            'TLS Termination: In a production system, TLS is typically terminated at the load balancer or API gateway — not at each application server. Internal traffic (load balancer → app servers) often uses plain HTTP within a trusted private network.',
            "Certificate Management at Scale: Thousands of servers need valid certificates. Solutions: AWS Certificate Manager (auto-renew), cert-manager (Kubernetes), Nginx with Let's Encrypt + Certbot.",
            "mTLS (Mutual TLS): Both client AND server verify each other's certificates. Used for service-to-service authentication in microservices. Much stronger than just bearer tokens.",
            'Certificate Pinning: Mobile apps can "pin" the server certificate — reject connections unless the certificate matches a specific expected certificate. Prevents MITM even with a compromised CA.',
          ],
        },
        {
          type: 'flow',
          title: 'TLS termination at the load balancer',
          code: `flowchart LR
  U([Users]):::client -->|"HTTPS"| LB["Load balancer<br/>holds the certificate<br/>decrypts TLS"]:::security
  subgraph PRIV["Private network"]
    A1[App server 1]:::server
    A2[App server 2]:::server
  end
  LB -->|"plain HTTP or mTLS"| A1
  LB -->|"plain HTTP or mTLS"| A2`,
          text: 'Decrypting once at the edge keeps certificates in one place and saves CPU on app servers. Zero-trust setups re-encrypt internal hops with mTLS.',
        },
      ],
    },
  ],
};
