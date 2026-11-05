import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 1 — How the Internet Works
// ─────────────────────────────────────────────────────────────────────────────
export const howInternetWorks: CoreConcept = {
  id: 'how-internet-works',
  title: 'How the Internet Works',
  emoji: '🌐',
  icon: 'ti-world',
  color: '#3b82f6',
  bg: '#dbeafe',
  accentGlow: 'rgba(59,130,246,0.15)',
  difficulty: 'Beginner',
  tagline:
    'The foundation of everything. Understand IP, TCP, UDP, packets, ports, and how data travels the world.',
  tags: ['IP Addresses', 'TCP/UDP', 'Packets', 'Routers', 'Ports'],
  estimatedTime: '35 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'The Internet in Plain English' },
        {
          type: 'paragraph',
          text: 'The Internet is a global network of billions of devices (computers, phones, servers, routers) all connected together and able to talk to each other. Think of it like a massive postal system — except instead of physical packages, it moves digital data, and instead of roads, it uses cables (fiber optic, copper) and wireless signals.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: sending data over the Internet is like mailing a long letter one page per envelope. Each envelope has a "to" and "from" address (the IP address), post offices along the way (routers) pass it toward the destination, and the receiver puts the pages back in order.',
        },
        {
          type: 'flow',
          title: 'The big picture — your device to a server',
          code: `flowchart LR
  D([Your device]):::client -->|"Wi-Fi / cable"| R[Home router]:::network
  R --> ISP[Your ISP]:::network
  ISP --> NET["The Internet<br/>many routers and cables"]:::network
  NET --> DC[Data center]:::external
  DC --> S[Web server]:::server
  S -.->|"response comes back the same way"| D`,
          text: 'Your data never travels on one dedicated wire. It is handed from network to network, each one passing it a step closer to the destination.',
        },
        { type: 'heading2', text: 'What the Internet is NOT' },
        {
          type: 'bullets',
          items: [
            'The Internet is not a cloud somewhere. It is physical — millions of kilometers of undersea cables, data centers, and router hardware.',
            'The Internet is not the Web. The World Wide Web (websites, browsers) is just one application that runs on top of the Internet. Email, video calls, online games — all run on the same Internet.',
            'The Internet is not owned by anyone. It is a decentralized global network run by many organizations, ISPs, and governments.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The Internet is infrastructure. The Web (HTTP) is just one service running on that infrastructure — like how roads exist, and cars, buses, and trucks all use those same roads.',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'The Problem It Solves' },
        {
          type: 'paragraph',
          text: 'Before the Internet, computers could not talk to each other unless physically connected with a cable. You could only share information by physically copying it (floppy disks, CDs) and delivering it in person. The Internet solved this by creating a shared global communication system.',
        },
        { type: 'heading2', text: 'Key Capabilities the Internet Provides' },
        {
          type: 'bullets',
          items: [
            'Remote communication: Send a message from India to the USA in milliseconds.',
            'Resource sharing: Access information on any web server in the world.',
            'Decentralization: No single point of failure — if one path is broken, data finds another route.',
            'Standardization: Any device running standard protocols (TCP/IP) can communicate with any other.',
          ],
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'IP Addresses — The Postal Address of the Internet' },
        {
          type: 'paragraph',
          text: 'Every device on the Internet has an IP (Internet Protocol) address — a unique number that identifies it. Like a home address, it tells the network where to deliver data.',
        },
        {
          type: 'bullets',
          items: [
            'IPv4: 32-bit addresses written as four numbers separated by dots. Example: 192.168.1.1. About 4.3 billion possible addresses (nearly exhausted).',
            'IPv6: 128-bit addresses written as eight groups of hex. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334. 340 undecillion possible addresses — practically unlimited.',
            "Public IP: Your router's address visible to the Internet.",
            "Private IP: Your device's address within your local network (e.g., 192.168.x.x).",
          ],
        },
        { type: 'heading2', text: 'Packets — Data is Broken Into Pieces' },
        {
          type: 'paragraph',
          text: 'When you send data (a photo, a web page, a message), it is not sent as one large chunk. It is broken into small units called packets, typically 1,500 bytes each. Each packet travels independently across the network and is reassembled at the destination.',
        },
        {
          type: 'bullets',
          items: [
            'Why packets? Smaller units allow the network to route efficiently, recover from lost data by re-sending only missing packets, and share network capacity fairly among all users.',
            'Each packet contains: source IP (who sent it), destination IP (where it is going), a sequence number (its position, so the pieces can be put back in order), and the payload (the actual chunk of data).',
          ],
        },
        {
          type: 'flow',
          title: 'Split, travel separately, reassemble',
          code: `flowchart LR
  F["Photo<br/>4,500 bytes"]:::client --> P1["Packet 1"]
  F --> P2["Packet 2"]
  F --> P3["Packet 3"]
  P1 -->|"route A"| N[Internet routers]:::network
  P2 -->|"route B"| N
  P3 -->|"route A"| N
  N --> RA["Reassemble by<br/>sequence number"]:::server
  RA --> OUT["Original photo"]:::highlight`,
          text: 'Packets can take different routes and arrive out of order. The sequence numbers let the receiver rebuild the original data correctly.',
        },
        { type: 'heading2', text: 'Routers — Traffic Directors' },
        {
          type: 'paragraph',
          text: 'Routers are devices that pass packets along toward their destination. A router does not know the whole path. It only knows its neighbours, and it keeps a routing table — a lookup list that answers: "For this destination IP, which neighbour should I hand the packet to next?" A packet may pass through 10-20 routers on its way to a server across the world.',
        },
        {
          type: 'flow',
          title: 'What one router does with each packet',
          code: `flowchart TD
  A[Packet arrives]:::network --> B[Read destination IP]
  B --> C{"Match in<br/>routing table?"}
  C -->|"yes"| D["Forward to the<br/>matching next router"]:::network
  C -->|"no specific match"| E["Send via default route<br/>usually toward the ISP"]:::network
  D --> F[Next hop repeats this]
  E --> F`,
          text: 'Every hop makes a small local decision. Repeating that decision 10-20 times gets the packet across the world.',
        },
        { type: 'heading2', text: 'TCP vs. UDP — The Two Transport Protocols' },
        {
          type: 'bullets',
          items: [
            'TCP (Transmission Control Protocol): Reliable. Guarantees delivery and order. Sender waits for acknowledgment of each packet. Lost packets are automatically re-sent. Slightly slower due to overhead. Used by: HTTP, HTTPS, email, file transfers.',
            'UDP (User Datagram Protocol): Fast but unreliable. Fire-and-forget — no acknowledgment, no retry, no guaranteed order. Used by: video streaming, online games, DNS lookups, video calls. You prefer speed over occasional packet loss.',
          ],
        },
        {
          type: 'flow',
          title: 'TCP vs UDP when a packet is lost',
          code: `sequenceDiagram
  participant A as Sender
  participant B as Receiver
  Note over A,B: TCP - reliable
  A->>B: Packet 1
  B-->>A: ACK 1
  A-xB: Packet 2 (lost)
  Note over A: No ACK arrives, so resend
  A->>B: Packet 2 (again)
  B-->>A: ACK 2
  Note over A,B: UDP - fire and forget
  A->>B: Packet 1
  A-xB: Packet 2 (lost)
  A->>B: Packet 3
  Note over B: Packet 2 is simply skipped`,
          text: 'TCP waits for acknowledgments (ACKs) and resends anything missing. UDP never waits — faster, but a lost packet stays lost.',
        },
        { type: 'heading2', text: 'Ports — Doors Into a Device' },
        {
          type: 'paragraph',
          text: 'An IP address identifies a device. A port identifies a specific application on that device. Think of it like an apartment building: the street address is the IP, and the apartment number is the port.',
        },
        {
          type: 'bullets',
          items: [
            'Port 80: HTTP (web traffic)',
            'Port 443: HTTPS (secure web traffic)',
            'Port 22: SSH (remote server access)',
            'Port 25: SMTP (email sending)',
            'Port 5432: PostgreSQL database',
            'Ports 0-1023: "Well-known" reserved ports. Ports 1024-65535: Available for applications.',
          ],
        },
        {
          type: 'flow',
          title: 'IP finds the building, port finds the apartment',
          code: `flowchart LR
  P["Incoming packet<br/>to 203.0.113.20"]:::network --> S
  subgraph S["Server 203.0.113.20"]
    W["Port 443<br/>Web server"]:::server
    SSH["Port 22<br/>SSH"]:::security
    DB["Port 5432<br/>PostgreSQL"]:::db
  end
  P -.->|"port 443"| W`,
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'What Happens When Your Device Sends Data' },
        {
          type: 'numbered',
          items: [
            'Your application (browser, app) creates data to send (e.g., an HTTP request).',
            'The OS wraps the data in a TCP segment: adds source port, destination port, sequence number.',
            'The OS wraps the TCP segment in an IP packet: adds source IP, destination IP.',
            'The IP packet is handed to your network adapter (WiFi/Ethernet) which wraps it in a frame for the local network.',
            'Your router receives the frame, removes the local frame, reads the destination IP, looks up its routing table, and forwards the packet to the next router.',
            'The packet hops across 10-20 routers worldwide, each one forwarding toward the destination.',
            "The destination server's router receives the packet, forwards it to the server.",
            "The server's OS reassembles the TCP segments (multiple packets) back into the original HTTP request.",
            'The server application processes the request and sends back a response following the same process in reverse.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'This "wrapping" is called encapsulation: each layer puts the previous layer\'s data inside its own envelope and writes its own address info on the outside. The receiver opens the envelopes in reverse order.',
        },
        {
          type: 'flow',
          title: 'Envelopes inside envelopes (encapsulation)',
          code: `flowchart TB
  subgraph SEND["Your device - wrapping"]
    A["HTTP request<br/>the actual data"]:::client --> B["+ TCP header<br/>ports, sequence number"]
    B --> C["+ IP header<br/>source and destination IP"]
    C --> D["+ Frame<br/>local Wi-Fi / Ethernet"]
  end
  D --> R["10-20 routers<br/>each reads only the IP header"]:::network
  R --> E
  subgraph RECV["Server - unwrapping"]
    E["Remove frame"] --> F["Remove IP header"]
    F --> G["TCP reassembles segments"]
    G --> H["HTTP request delivered<br/>to the web app"]:::server
  end`,
          text: 'Routers only look at the IP layer. They never need to understand the HTTP request inside.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'The Physical Layer' },
        {
          type: 'bullets',
          items: [
            'Fiber optic cables: Transmit data as pulses of light. Backbone of the Internet — including undersea cables spanning oceans.',
            'Copper cables: Ethernet cables in offices and homes.',
            'Wireless: WiFi (IEEE 802.11), 4G/5G cellular.',
            'Satellites: SpaceX Starlink — useful for remote areas, higher latency (~20-600ms).',
          ],
        },
        { type: 'heading2', text: 'The Network Layer Devices' },
        {
          type: 'bullets',
          items: [
            'Network Interface Card (NIC): Hardware in your computer that connects to a network.',
            'Switch: Connects devices in a local network (home/office). Routes packets by MAC address.',
            'Router: Connects networks together. Routes packets by IP address.',
            'ISP (Internet Service Provider): Comcast, AT&T, Jio — provides your connection to the global Internet.',
            'Internet Exchange Point (IXP): Physical location where multiple ISPs connect and exchange traffic.',
            'Data Centers: Buildings full of servers that host websites, applications, and cloud services.',
          ],
        },
        { type: 'heading2', text: 'The Protocol Stack (OSI Model simplified)' },
        {
          type: 'bullets',
          items: [
            'Application Layer: HTTP, HTTPS, DNS, SMTP — what your apps use.',
            'Transport Layer: TCP, UDP — handles connections and reliability.',
            'Network Layer: IP — handles addressing and routing.',
            'Link Layer: Ethernet, WiFi — handles data on the physical local network.',
          ],
        },
        {
          type: 'flow',
          title: 'The protocol stack — each layer has one job',
          code: `flowchart TB
  APP["Application layer<br/>HTTP, DNS, SMTP<br/>what the app wants to say"]:::client
  TR["Transport layer<br/>TCP, UDP<br/>which app, reliable or fast"]:::server
  NW["Network layer<br/>IP<br/>which device, which route"]:::network
  LK["Link layer<br/>Ethernet, Wi-Fi<br/>next hop on the local wire"]:::network
  PHY["Physical<br/>fiber, copper, radio"]:::external
  APP --> TR --> NW --> LK --> PHY`,
          text: 'Sending data goes down the stack, receiving goes back up. Each layer only talks to the layer directly above and below it.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Opening YouTube on Your Phone' },
        {
          type: 'paragraph',
          text: 'When you open YouTube on your phone, here is what happens at the network level:',
        },
        {
          type: 'numbered',
          items: [
            'Your phone connects to WiFi. The router assigns your phone a private IP (e.g., 192.168.1.5).',
            'Your DNS resolver (more on this in the next concept) resolves youtube.com to an IP like 142.250.80.46.',
            "Your phone's OS creates a TCP connection to 142.250.80.46 on port 443 (HTTPS).",
            'The TCP handshake happens: SYN → SYN-ACK → ACK (3 packets, typically 20-50ms).',
            'Your phone sends an HTTP request for the YouTube homepage.',
            "The request travels: Phone → Home Router → ISP → Several Internet routers → Google's data center.",
            "Google's servers respond with HTML, CSS, JavaScript.",
            'Your phone reassembles all the TCP packets and hands the data to the YouTube app to display.',
          ],
        },
        {
          type: 'flow',
          title: 'Opening YouTube, step by step',
          code: `sequenceDiagram
  participant P as Phone
  participant R as Home Router
  participant D as DNS Resolver
  participant G as Google Server
  P->>R: Join Wi-Fi
  R-->>P: Your private IP is 192.168.1.5
  P->>D: What is the IP of youtube.com?
  D-->>P: 142.250.80.46
  P->>G: SYN (port 443)
  G-->>P: SYN-ACK
  P->>G: ACK - connection open
  P->>G: HTTP request for the homepage
  G-->>P: HTML, CSS, JavaScript (many packets)
  Note over P: Reassemble packets and render the app`,
          text: 'Before a single byte of the video page arrives, the phone has already spent two round trips: one to DNS and one for the TCP handshake.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'The round-trip time (latency) for a packet from India to a Google server in the US is roughly 150-200ms. Light through fiber optic cable travels at ~200,000 km/s, so physical distance is a real constraint on latency.',
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
          title: 'The whole journey at a glance',
          code: `flowchart LR
  C(["Your device<br/>192.168.1.5"]):::client -->|"1. Wi-Fi frame"| H["Home router + NAT<br/>203.0.113.10"]:::network
  H -->|"2. private IP swapped<br/>for public IP"| ISP["ISP router<br/>BGP routing"]:::network
  ISP -->|"3. fiber hops"| IXP["Internet Exchange<br/>Point"]:::network
  IXP -->|"4. peering"| EDGE["Google edge +<br/>load balancer"]:::security
  EDGE -->|"5. internal network"| S["YouTube server<br/>port 443"]:::server`,
          text: 'Five hand-offs, about 10-20 router hops in total, typically 50-200ms end to end. The cards below zoom into each step.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-internet-flow',
            title: 'End-to-End Internet Packet Journey & NAT Traversal',
            subtitle:
              'How packets traverse private IP spaces, NAT translation, BGP routing, IXPs, and edge load balancers in ~50ms',
            nodes: [
              {
                id: 'client-device',
                name: 'Client Device',
                subtitle: 'Your Laptop or Smartphone',
                type: 'client',
                icon: 'ti-device-laptop',
                badge: 'Client Endpoint',
                protocol: 'IPv4 192.168.1.5',
                details: [
                  'Creates raw TCP segment with HTTP request payload',
                  'Adds TCP header (Source Port: 52314, Dest Port: 443)',
                  'Encapsulates in IP packet (Dest IP: 142.250.80.46)',
                ],
              },
              {
                id: 'home-router',
                name: 'Home Gateway & NAT',
                subtitle: 'Network Address Translation Router',
                type: 'gateway',
                icon: 'ti-router',
                badge: 'NAT Translation',
                protocol: 'Public IP 203.0.113.10',
                details: [
                  'Substitutes private IP (192.168.1.5) with public WAN IP',
                  'Records translation in NAT state table for response routing',
                  'Appends CRC checksum and pushes Ethernet frame to ISP optical link',
                ],
              },
              {
                id: 'isp-router',
                name: 'ISP Core & Aggregation Router',
                subtitle: 'Tier-2 Internet Service Provider',
                type: 'network',
                icon: 'ti-network',
                badge: 'BGP Routing',
                protocol: 'BGP Transit',
                details: [
                  'Inspects destination IP in routing table (~900,000 global routes)',
                  'Selects lowest Autonomous System (AS) path toward Google ASN 15169',
                  'Decrements IP TTL (Time-To-Live) by 1 to prevent infinite loops',
                ],
              },
              {
                id: 'ixp-exchange',
                name: 'Internet Exchange Point (IXP)',
                subtitle: 'High-Speed Fiber Peering Switch',
                type: 'network',
                icon: 'ti-arrows-split-2',
                badge: 'Peering Fabric',
                protocol: '100 Gbps Dark Fiber',
                details: [
                  'Zero-hop settlement-free direct interconnection between ISP and Google network',
                  'Transits packet across metropolitan glass optical fiber at ~200,000 km/s',
                ],
              },
              {
                id: 'google-edge',
                name: 'Cloud Edge Gateway & Load Balancer',
                subtitle: 'Anycast Ingress & DDoS Mitigation',
                type: 'gateway',
                icon: 'ti-shield-lock',
                badge: 'Anycast Edge',
                protocol: 'VIP 142.250.80.46',
                details: [
                  'Terminates Anycast BGP route at nearest geographic data center',
                  'Inspects TCP SYN for SYN flood attacks; performs Layer-4 health-checking',
                  'Forwards payload to internal web server cluster over private fiber',
                ],
              },
              {
                id: 'dest-server',
                name: 'Origin Web Server',
                subtitle: 'Target Application Node',
                type: 'server',
                icon: 'ti-server',
                badge: 'Destination Host',
                protocol: 'TCP Port 443 / TLS',
                details: [
                  'Kernel strips Ethernet, IP, and TCP headers; verifies packet checksum',
                  'Reassembles TCP segments in order using Sequence Numbers',
                  'Hands payload stream to HTTPS listener socket in userspace',
                ],
              },
            ],
            connections: [
              {
                from: 'client-device',
                to: 'home-router',
                label: '1. Wi-Fi / Ethernet Frame',
                protocol: '192.168.1.5:52314',
              },
              {
                from: 'home-router',
                to: 'isp-router',
                label: '2. NAT Rewritten Packet',
                protocol: '203.0.113.10:41029',
              },
              {
                from: 'isp-router',
                to: 'ixp-exchange',
                label: '3. BGP Fiber Transit Hop',
                protocol: 'AS Peering',
              },
              {
                from: 'ixp-exchange',
                to: 'google-edge',
                label: '4. Direct Peering Ingress',
                protocol: '100GbE',
              },
              {
                from: 'google-edge',
                to: 'dest-server',
                label: '5. Internal VIP Distribution',
                protocol: 'Intranet TCP',
              },
            ],
            keyTakeaways: [
              'NAT is mandatory because IPv4 addresses (32-bit, ~4.3B) are exhausted; billions of private home IPs share single public addresses.',
              'Routers operate at Layer 3 (IP). They do not understand HTML, JSON, or cookies—they only read 20-byte IP headers and forward packets.',
              'Packets can take different physical routes and arrive out-of-order; TCP reliably resequences them before the application ever reads a byte.',
            ],
            rawSpec: `Your Device (192.168.1.5)
      │
      ▼
Home Router (Public IP: 203.0.113.10)
      │  NAT: rewrites your private IP to public IP
      ▼
ISP Router
      │  Routes based on destination IP
      ▼
IXP (Internet Exchange Point)
      │  Connects your ISP to Google's network
      ▼
Google's Edge Router
      │  Routes to the right data center
      ▼
Google Load Balancer
      │  Distributes to healthy servers
      ▼
YouTube Server (142.250.80.46)

Each hop: packet is forwarded by a router in ~1-2ms
Total path: ~10-20 hops, ~50-200ms depending on distance

┌─────────────────────────────────────────────┐
│  IP Header (20 bytes)                        │
│  Source IP: 203.0.113.10                     │
│  Destination IP: 142.250.80.46               │
├─────────────────────────────────────────────┤
│  TCP Header (20 bytes)                       │
│  Source Port: 52314 (random)                 │
│  Destination Port: 443 (HTTPS)               │
│  Sequence Number: 1234                       │
│  ACK Number: 5678                            │
├─────────────────────────────────────────────┤
│  Data (up to ~1,460 bytes)                   │
│  "GET / HTTP/2.0\r\nHost: youtube.com\r\n..."│
└─────────────────────────────────────────────┘`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'NAT — How Your Router Hides Your Devices' },
        {
          type: 'paragraph',
          text: "Your home has one public IP but many devices (phone, laptop, TV). Your router shares that one address using NAT (Network Address Translation). When a device sends a packet out, the router swaps the device's private IP + port for the public IP + a new port, and writes the pairing down in a table. When the reply comes back to that port, the router looks up the table and passes it to the right device. For example, your laptop is 192.168.1.2:52000 and your phone is 192.168.1.5:53000 — to the outside world, both look like 203.0.113.10, just on different ports.",
        },
        {
          type: 'flow',
          title: 'NAT — one public address, many devices',
          code: `sequenceDiagram
  participant L as Laptop 192.168.1.2
  participant R as Router (NAT)
  participant S as Web Server
  L->>R: from 192.168.1.2:52000
  Note over R: Rewrite source to 203.0.113.10:41029 and save the mapping
  R->>S: from 203.0.113.10:41029
  S-->>R: reply to 203.0.113.10:41029
  Note over R: Look up 41029 in the table, it belongs to the laptop
  R-->>L: deliver to 192.168.1.2:52000`,
          text: "The server only ever sees the public address. The router's translation table is what gets the reply back to the right device.",
        },
        { type: 'heading2', text: 'TCP Three-Way Handshake' },
        {
          type: 'paragraph',
          text: 'Before sending any data, TCP establishes a connection with a 3-step handshake:',
        },
        {
          type: 'bullets',
          items: [
            'SYN: Your device sends "I want to connect, my starting sequence number is X."',
            'SYN-ACK: Server responds "OK, I acknowledge X. My starting sequence number is Y."',
            'ACK: Your device confirms "I acknowledge Y." Connection established.',
          ],
        },
        {
          type: 'flow',
          title: 'TCP three-way handshake',
          code: `sequenceDiagram
  participant C as Your device
  participant S as Server
  C->>S: SYN - I want to connect, I start at X
  S-->>C: SYN-ACK - got X, I start at Y
  C->>S: ACK - got Y
  Note over C,S: Connection open (cost 1 round trip)
  C->>S: Now the real data can flow`,
        },
        {
          type: 'paragraph',
          text: 'This handshake takes one round-trip time (RTT). At 100ms latency, just establishing a connection costs 100ms before any data is sent. This is why HTTPS connections reuse (keep-alive) established connections — to avoid repeated handshakes.',
        },
        { type: 'heading2', text: 'BGP — How Routers Learn Routes' },
        {
          type: 'paragraph',
          text: 'Border Gateway Protocol (BGP) is how large networks tell each other which addresses they can reach. Each ISP or big network (called an Autonomous System) announces "I can deliver to these IP ranges." Neighbours pass these announcements along, and every router builds its routing table from them. Even with close to a million routes, a router can pick the right one in microseconds using longest-prefix matching — it chooses the most specific range that contains the destination IP.',
        },
        {
          type: 'flow',
          title: 'How a route announcement spreads',
          code: `flowchart LR
  G["Google network<br/>announces 142.250.0.0/15"]:::server -->|"I can reach this"| IXP[Exchange point]:::network
  IXP -->|"via Google"| ISP1[Tier-1 ISP]:::network
  IXP -->|"via Google"| ISP2[Your ISP]:::network
  ISP1 -->|"via Tier-1, Google"| ISP3[Other ISPs]:::network
  ISP2 --> T["Routing table updated:<br/>142.250.x.x goes via IXP"]:::highlight`,
          text: 'Routes flow outward from whoever owns the addresses. Packets then flow back along the reverse of those announcements.',
        },
      ],
    },
    {
      id: 'misconceptions',
      title: 'Common Misconceptions',
      icon: 'ti-alert-triangle',
      blocks: [
        { type: 'heading2', text: 'Myths vs. Reality' },
        {
          type: 'bullets',
          items: [
            'Myth: "The Internet is the cloud." Reality: The Internet is physical infrastructure. The "cloud" is just data centers connected to this infrastructure.',
            'Myth: "WiFi is the Internet." Reality: WiFi is just the wireless connection between your device and your router. Your router then connects to the Internet via your ISP.',
            'Myth: "Data travels at the speed of light." Reality: Almost, but not quite. Light through fiber optic cable is ~67% the speed of light in vacuum. Plus, each router introduces microseconds of processing delay.',
            'Myth: "If I have a fast Internet plan, all websites will be fast." Reality: Speed also depends on: server location (latency), server capacity, CDN usage, and network congestion along the path.',
            'Myth: "TCP is always better than UDP." Reality: For real-time applications (video calls, online games), UDP is better because occasional packet loss is preferable to the delay caused by TCP\'s retransmission.',
          ],
        },
      ],
    },
    {
      id: 'system-design-connection',
      title: 'System Design Connection',
      icon: 'ti-sitemap',
      blocks: [
        { type: 'heading2', text: 'Why This Matters for System Design' },
        {
          type: 'bullets',
          items: [
            'Latency budgeting: A system design must account for network latency. A request from India to the US takes ~150-200ms in network time alone — before any server processing.',
            'TCP vs UDP choice: Designing a real-time chat system → TCP for reliability. Designing a live video stream → UDP for speed.',
            'Load balancers: Understanding packets and ports explains how a load balancer can distribute traffic — it inspects destination IP and port to decide which backend server to forward to.',
            'CDN design: CDNs work by placing servers physically close to users, reducing the number of network hops and thus latency.',
            'Firewall and security: Firewalls operate at the IP/port level — blocking or allowing packets based on source IP, destination port, and protocol.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'In every system design interview, latency is a constraint rooted in network physics. Understanding TCP/IP and routing is why engineers know that global P99 latency < 50ms is physically impossible for data traveling between continents.',
        },
      ],
    },
  ],
};
