var K=[{id:`how-internet-works`,title:`How the Internet Works`,emoji:`🌐`,icon:`ti-world`,color:`#3b82f6`,bg:`#dbeafe`,accentGlow:`rgba(59,130,246,0.15)`,difficulty:`Beginner`,tagline:`The foundation of everything. Understand IP, TCP, UDP, packets, ports, and how data travels the world.`,tags:[`IP Addresses`,`TCP/UDP`,`Packets`,`Routers`,`Ports`],estimatedTime:`35 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`The Internet in Plain English`},{type:`paragraph`,text:`The Internet is a global network of billions of devices (computers, phones, servers, routers) all connected together and able to talk to each other. Think of it like a massive postal system — except instead of physical packages, it moves digital data, and instead of roads, it uses cables (fiber optic, copper) and wireless signals.`},{type:`callout`,variant:`info`,text:`In simple terms: sending data over the Internet is like mailing a long letter one page per envelope. Each envelope has a "to" and "from" address (the IP address), post offices along the way (routers) pass it toward the destination, and the receiver puts the pages back in order.`},{type:`flow`,title:`The big picture — your device to a server`,code:`flowchart LR
  D([Your device]):::client -->|"Wi-Fi / cable"| R[Home router]:::network
  R --> ISP[Your ISP]:::network
  ISP --> NET["The Internet<br/>many routers and cables"]:::network
  NET --> DC[Data center]:::external
  DC --> S[Web server]:::server
  S -.->|"response comes back the same way"| D`,text:`Your data never travels on one dedicated wire. It is handed from network to network, each one passing it a step closer to the destination.`},{type:`heading2`,text:`What the Internet is NOT`},{type:`bullets`,items:[`The Internet is not a cloud somewhere. It is physical — millions of kilometers of undersea cables, data centers, and router hardware.`,`The Internet is not the Web. The World Wide Web (websites, browsers) is just one application that runs on top of the Internet. Email, video calls, online games — all run on the same Internet.`,`The Internet is not owned by anyone. It is a decentralized global network run by many organizations, ISPs, and governments.`]},{type:`callout`,variant:`tip`,text:`The Internet is infrastructure. The Web (HTTP) is just one service running on that infrastructure — like how roads exist, and cars, buses, and trucks all use those same roads.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`The Problem It Solves`},{type:`paragraph`,text:`Before the Internet, computers could not talk to each other unless physically connected with a cable. You could only share information by physically copying it (floppy disks, CDs) and delivering it in person. The Internet solved this by creating a shared global communication system.`},{type:`heading2`,text:`Key Capabilities the Internet Provides`},{type:`bullets`,items:[`Remote communication: Send a message from India to the USA in milliseconds.`,`Resource sharing: Access information on any web server in the world.`,`Decentralization: No single point of failure — if one path is broken, data finds another route.`,`Standardization: Any device running standard protocols (TCP/IP) can communicate with any other.`]}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`IP Addresses — The Postal Address of the Internet`},{type:`paragraph`,text:`Every device on the Internet has an IP (Internet Protocol) address — a unique number that identifies it. Like a home address, it tells the network where to deliver data.`},{type:`bullets`,items:[`IPv4: 32-bit addresses written as four numbers separated by dots. Example: 192.168.1.1. About 4.3 billion possible addresses (nearly exhausted).`,`IPv6: 128-bit addresses written as eight groups of hex. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334. 340 undecillion possible addresses — practically unlimited.`,`Public IP: Your router's address visible to the Internet.`,`Private IP: Your device's address within your local network (e.g., 192.168.x.x).`]},{type:`heading2`,text:`Packets — Data is Broken Into Pieces`},{type:`paragraph`,text:`When you send data (a photo, a web page, a message), it is not sent as one large chunk. It is broken into small units called packets, typically 1,500 bytes each. Each packet travels independently across the network and is reassembled at the destination.`},{type:`bullets`,items:[`Why packets? Smaller units allow the network to route efficiently, recover from lost data by re-sending only missing packets, and share network capacity fairly among all users.`,`Each packet contains: source IP (who sent it), destination IP (where it is going), a sequence number (its position, so the pieces can be put back in order), and the payload (the actual chunk of data).`]},{type:`flow`,title:`Split, travel separately, reassemble`,code:`flowchart LR
  F["Photo<br/>4,500 bytes"]:::client --> P1["Packet 1"]
  F --> P2["Packet 2"]
  F --> P3["Packet 3"]
  P1 -->|"route A"| N[Internet routers]:::network
  P2 -->|"route B"| N
  P3 -->|"route A"| N
  N --> RA["Reassemble by<br/>sequence number"]:::server
  RA --> OUT["Original photo"]:::highlight`,text:`Packets can take different routes and arrive out of order. The sequence numbers let the receiver rebuild the original data correctly.`},{type:`heading2`,text:`Routers — Traffic Directors`},{type:`paragraph`,text:`Routers are devices that pass packets along toward their destination. A router does not know the whole path. It only knows its neighbours, and it keeps a routing table — a lookup list that answers: "For this destination IP, which neighbour should I hand the packet to next?" A packet may pass through 10-20 routers on its way to a server across the world.`},{type:`flow`,title:`What one router does with each packet`,code:`flowchart TD
  A[Packet arrives]:::network --> B[Read destination IP]
  B --> C{"Match in<br/>routing table?"}
  C -->|"yes"| D["Forward to the<br/>matching next router"]:::network
  C -->|"no specific match"| E["Send via default route<br/>usually toward the ISP"]:::network
  D --> F[Next hop repeats this]
  E --> F`,text:`Every hop makes a small local decision. Repeating that decision 10-20 times gets the packet across the world.`},{type:`heading2`,text:`TCP vs. UDP — The Two Transport Protocols`},{type:`bullets`,items:[`TCP (Transmission Control Protocol): Reliable. Guarantees delivery and order. Sender waits for acknowledgment of each packet. Lost packets are automatically re-sent. Slightly slower due to overhead. Used by: HTTP, HTTPS, email, file transfers.`,`UDP (User Datagram Protocol): Fast but unreliable. Fire-and-forget — no acknowledgment, no retry, no guaranteed order. Used by: video streaming, online games, DNS lookups, video calls. You prefer speed over occasional packet loss.`]},{type:`flow`,title:`TCP vs UDP when a packet is lost`,code:`sequenceDiagram
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
  Note over B: Packet 2 is simply skipped`,text:`TCP waits for acknowledgments (ACKs) and resends anything missing. UDP never waits — faster, but a lost packet stays lost.`},{type:`heading2`,text:`Ports — Doors Into a Device`},{type:`paragraph`,text:`An IP address identifies a device. A port identifies a specific application on that device. Think of it like an apartment building: the street address is the IP, and the apartment number is the port.`},{type:`bullets`,items:[`Port 80: HTTP (web traffic)`,`Port 443: HTTPS (secure web traffic)`,`Port 22: SSH (remote server access)`,`Port 25: SMTP (email sending)`,`Port 5432: PostgreSQL database`,`Ports 0-1023: "Well-known" reserved ports. Ports 1024-65535: Available for applications.`]},{type:`flow`,title:`IP finds the building, port finds the apartment`,code:`flowchart LR
  P["Incoming packet<br/>to 203.0.113.20"]:::network --> S
  subgraph S["Server 203.0.113.20"]
    W["Port 443<br/>Web server"]:::server
    SSH["Port 22<br/>SSH"]:::security
    DB["Port 5432<br/>PostgreSQL"]:::db
  end
  P -.->|"port 443"| W`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`What Happens When Your Device Sends Data`},{type:`numbered`,items:[`Your application (browser, app) creates data to send (e.g., an HTTP request).`,`The OS wraps the data in a TCP segment: adds source port, destination port, sequence number.`,`The OS wraps the TCP segment in an IP packet: adds source IP, destination IP.`,`The IP packet is handed to your network adapter (WiFi/Ethernet) which wraps it in a frame for the local network.`,`Your router receives the frame, removes the local frame, reads the destination IP, looks up its routing table, and forwards the packet to the next router.`,`The packet hops across 10-20 routers worldwide, each one forwarding toward the destination.`,`The destination server's router receives the packet, forwards it to the server.`,`The server's OS reassembles the TCP segments (multiple packets) back into the original HTTP request.`,`The server application processes the request and sends back a response following the same process in reverse.`]},{type:`callout`,variant:`tip`,text:`This "wrapping" is called encapsulation: each layer puts the previous layer's data inside its own envelope and writes its own address info on the outside. The receiver opens the envelopes in reverse order.`},{type:`flow`,title:`Envelopes inside envelopes (encapsulation)`,code:`flowchart TB
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
  end`,text:`Routers only look at the IP layer. They never need to understand the HTTP request inside.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`The Physical Layer`},{type:`bullets`,items:[`Fiber optic cables: Transmit data as pulses of light. Backbone of the Internet — including undersea cables spanning oceans.`,`Copper cables: Ethernet cables in offices and homes.`,`Wireless: WiFi (IEEE 802.11), 4G/5G cellular.`,`Satellites: SpaceX Starlink — useful for remote areas, higher latency (~20-600ms).`]},{type:`heading2`,text:`The Network Layer Devices`},{type:`bullets`,items:[`Network Interface Card (NIC): Hardware in your computer that connects to a network.`,`Switch: Connects devices in a local network (home/office). Routes packets by MAC address.`,`Router: Connects networks together. Routes packets by IP address.`,`ISP (Internet Service Provider): Comcast, AT&T, Jio — provides your connection to the global Internet.`,`Internet Exchange Point (IXP): Physical location where multiple ISPs connect and exchange traffic.`,`Data Centers: Buildings full of servers that host websites, applications, and cloud services.`]},{type:`heading2`,text:`The Protocol Stack (OSI Model simplified)`},{type:`bullets`,items:[`Application Layer: HTTP, HTTPS, DNS, SMTP — what your apps use.`,`Transport Layer: TCP, UDP — handles connections and reliability.`,`Network Layer: IP — handles addressing and routing.`,`Link Layer: Ethernet, WiFi — handles data on the physical local network.`]},{type:`flow`,title:`The protocol stack — each layer has one job`,code:`flowchart TB
  APP["Application layer<br/>HTTP, DNS, SMTP<br/>what the app wants to say"]:::client
  TR["Transport layer<br/>TCP, UDP<br/>which app, reliable or fast"]:::server
  NW["Network layer<br/>IP<br/>which device, which route"]:::network
  LK["Link layer<br/>Ethernet, Wi-Fi<br/>next hop on the local wire"]:::network
  PHY["Physical<br/>fiber, copper, radio"]:::external
  APP --> TR --> NW --> LK --> PHY`,text:`Sending data goes down the stack, receiving goes back up. Each layer only talks to the layer directly above and below it.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Opening YouTube on Your Phone`},{type:`paragraph`,text:`When you open YouTube on your phone, here is what happens at the network level:`},{type:`numbered`,items:[`Your phone connects to WiFi. The router assigns your phone a private IP (e.g., 192.168.1.5).`,`Your DNS resolver (more on this in the next concept) resolves youtube.com to an IP like 142.250.80.46.`,`Your phone's OS creates a TCP connection to 142.250.80.46 on port 443 (HTTPS).`,`The TCP handshake happens: SYN → SYN-ACK → ACK (3 packets, typically 20-50ms).`,`Your phone sends an HTTP request for the YouTube homepage.`,`The request travels: Phone → Home Router → ISP → Several Internet routers → Google's data center.`,`Google's servers respond with HTML, CSS, JavaScript.`,`Your phone reassembles all the TCP packets and hands the data to the YouTube app to display.`]},{type:`flow`,title:`Opening YouTube, step by step`,code:`sequenceDiagram
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
  Note over P: Reassemble packets and render the app`,text:`Before a single byte of the video page arrives, the phone has already spent two round trips: one to DNS and one for the TCP handshake.`},{type:`callout`,variant:`info`,text:`The round-trip time (latency) for a packet from India to a Google server in the US is roughly 150-200ms. Light through fiber optic cable travels at ~200,000 km/s, so physical distance is a real constraint on latency.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`The whole journey at a glance`,code:`flowchart LR
  C(["Your device<br/>192.168.1.5"]):::client -->|"1. Wi-Fi frame"| H["Home router + NAT<br/>203.0.113.10"]:::network
  H -->|"2. private IP swapped<br/>for public IP"| ISP["ISP router<br/>BGP routing"]:::network
  ISP -->|"3. fiber hops"| IXP["Internet Exchange<br/>Point"]:::network
  IXP -->|"4. peering"| EDGE["Google edge +<br/>load balancer"]:::security
  EDGE -->|"5. internal network"| S["YouTube server<br/>port 443"]:::server`,text:`Five hand-offs, about 10-20 router hops in total, typically 50-200ms end to end. The cards below zoom into each step.`},{type:`diagram`,diagram:{id:`diagram-internet-flow`,title:`End-to-End Internet Packet Journey & NAT Traversal`,subtitle:`How packets traverse private IP spaces, NAT translation, BGP routing, IXPs, and edge load balancers in ~50ms`,nodes:[{id:`client-device`,name:`Client Device`,subtitle:`Your Laptop or Smartphone`,type:`client`,icon:`ti-device-laptop`,badge:`Client Endpoint`,protocol:`IPv4 192.168.1.5`,details:[`Creates raw TCP segment with HTTP request payload`,`Adds TCP header (Source Port: 52314, Dest Port: 443)`,`Encapsulates in IP packet (Dest IP: 142.250.80.46)`]},{id:`home-router`,name:`Home Gateway & NAT`,subtitle:`Network Address Translation Router`,type:`gateway`,icon:`ti-router`,badge:`NAT Translation`,protocol:`Public IP 203.0.113.10`,details:[`Substitutes private IP (192.168.1.5) with public WAN IP`,`Records translation in NAT state table for response routing`,`Appends CRC checksum and pushes Ethernet frame to ISP optical link`]},{id:`isp-router`,name:`ISP Core & Aggregation Router`,subtitle:`Tier-2 Internet Service Provider`,type:`network`,icon:`ti-network`,badge:`BGP Routing`,protocol:`BGP Transit`,details:[`Inspects destination IP in routing table (~900,000 global routes)`,`Selects lowest Autonomous System (AS) path toward Google ASN 15169`,`Decrements IP TTL (Time-To-Live) by 1 to prevent infinite loops`]},{id:`ixp-exchange`,name:`Internet Exchange Point (IXP)`,subtitle:`High-Speed Fiber Peering Switch`,type:`network`,icon:`ti-arrows-split-2`,badge:`Peering Fabric`,protocol:`100 Gbps Dark Fiber`,details:[`Zero-hop settlement-free direct interconnection between ISP and Google network`,`Transits packet across metropolitan glass optical fiber at ~200,000 km/s`]},{id:`google-edge`,name:`Cloud Edge Gateway & Load Balancer`,subtitle:`Anycast Ingress & DDoS Mitigation`,type:`gateway`,icon:`ti-shield-lock`,badge:`Anycast Edge`,protocol:`VIP 142.250.80.46`,details:[`Terminates Anycast BGP route at nearest geographic data center`,`Inspects TCP SYN for SYN flood attacks; performs Layer-4 health-checking`,`Forwards payload to internal web server cluster over private fiber`]},{id:`dest-server`,name:`Origin Web Server`,subtitle:`Target Application Node`,type:`server`,icon:`ti-server`,badge:`Destination Host`,protocol:`TCP Port 443 / TLS`,details:[`Kernel strips Ethernet, IP, and TCP headers; verifies packet checksum`,`Reassembles TCP segments in order using Sequence Numbers`,`Hands payload stream to HTTPS listener socket in userspace`]}],connections:[{from:`client-device`,to:`home-router`,label:`1. Wi-Fi / Ethernet Frame`,protocol:`192.168.1.5:52314`},{from:`home-router`,to:`isp-router`,label:`2. NAT Rewritten Packet`,protocol:`203.0.113.10:41029`},{from:`isp-router`,to:`ixp-exchange`,label:`3. BGP Fiber Transit Hop`,protocol:`AS Peering`},{from:`ixp-exchange`,to:`google-edge`,label:`4. Direct Peering Ingress`,protocol:`100GbE`},{from:`google-edge`,to:`dest-server`,label:`5. Internal VIP Distribution`,protocol:`Intranet TCP`}],keyTakeaways:[`NAT is mandatory because IPv4 addresses (32-bit, ~4.3B) are exhausted; billions of private home IPs share single public addresses.`,`Routers operate at Layer 3 (IP). They do not understand HTML, JSON, or cookies—they only read 20-byte IP headers and forward packets.`,`Packets can take different physical routes and arrive out-of-order; TCP reliably resequences them before the application ever reads a byte.`],rawSpec:`Your Device (192.168.1.5)
      \u2502
      \u25BC
Home Router (Public IP: 203.0.113.10)
      \u2502  NAT: rewrites your private IP to public IP
      \u25BC
ISP Router
      \u2502  Routes based on destination IP
      \u25BC
IXP (Internet Exchange Point)
      \u2502  Connects your ISP to Google's network
      \u25BC
Google's Edge Router
      \u2502  Routes to the right data center
      \u25BC
Google Load Balancer
      \u2502  Distributes to healthy servers
      \u25BC
YouTube Server (142.250.80.46)

Each hop: packet is forwarded by a router in ~1-2ms
Total path: ~10-20 hops, ~50-200ms depending on distance

\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502  IP Header (20 bytes)                        \u2502
\u2502  Source IP: 203.0.113.10                     \u2502
\u2502  Destination IP: 142.250.80.46               \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  TCP Header (20 bytes)                       \u2502
\u2502  Source Port: 52314 (random)                 \u2502
\u2502  Destination Port: 443 (HTTPS)               \u2502
\u2502  Sequence Number: 1234                       \u2502
\u2502  ACK Number: 5678                            \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Data (up to ~1,460 bytes)                   \u2502
\u2502  "GET / HTTP/2.0\r
Host: youtube.com\r
..."\u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`NAT — How Your Router Hides Your Devices`},{type:`paragraph`,text:`Your home has one public IP but many devices (phone, laptop, TV). Your router shares that one address using NAT (Network Address Translation). When a device sends a packet out, the router swaps the device's private IP + port for the public IP + a new port, and writes the pairing down in a table. When the reply comes back to that port, the router looks up the table and passes it to the right device. For example, your laptop is 192.168.1.2:52000 and your phone is 192.168.1.5:53000 — to the outside world, both look like 203.0.113.10, just on different ports.`},{type:`flow`,title:`NAT — one public address, many devices`,code:`sequenceDiagram
  participant L as Laptop 192.168.1.2
  participant R as Router (NAT)
  participant S as Web Server
  L->>R: from 192.168.1.2:52000
  Note over R: Rewrite source to 203.0.113.10:41029 and save the mapping
  R->>S: from 203.0.113.10:41029
  S-->>R: reply to 203.0.113.10:41029
  Note over R: Look up 41029 in the table, it belongs to the laptop
  R-->>L: deliver to 192.168.1.2:52000`,text:`The server only ever sees the public address. The router's translation table is what gets the reply back to the right device.`},{type:`heading2`,text:`TCP Three-Way Handshake`},{type:`paragraph`,text:`Before sending any data, TCP establishes a connection with a 3-step handshake:`},{type:`bullets`,items:[`SYN: Your device sends "I want to connect, my starting sequence number is X."`,`SYN-ACK: Server responds "OK, I acknowledge X. My starting sequence number is Y."`,`ACK: Your device confirms "I acknowledge Y." Connection established.`]},{type:`flow`,title:`TCP three-way handshake`,code:`sequenceDiagram
  participant C as Your device
  participant S as Server
  C->>S: SYN - I want to connect, I start at X
  S-->>C: SYN-ACK - got X, I start at Y
  C->>S: ACK - got Y
  Note over C,S: Connection open (cost 1 round trip)
  C->>S: Now the real data can flow`},{type:`paragraph`,text:`This handshake takes one round-trip time (RTT). At 100ms latency, just establishing a connection costs 100ms before any data is sent. This is why HTTPS connections reuse (keep-alive) established connections — to avoid repeated handshakes.`},{type:`heading2`,text:`BGP — How Routers Learn Routes`},{type:`paragraph`,text:`Border Gateway Protocol (BGP) is how large networks tell each other which addresses they can reach. Each ISP or big network (called an Autonomous System) announces "I can deliver to these IP ranges." Neighbours pass these announcements along, and every router builds its routing table from them. Even with close to a million routes, a router can pick the right one in microseconds using longest-prefix matching — it chooses the most specific range that contains the destination IP.`},{type:`flow`,title:`How a route announcement spreads`,code:`flowchart LR
  G["Google network<br/>announces 142.250.0.0/15"]:::server -->|"I can reach this"| IXP[Exchange point]:::network
  IXP -->|"via Google"| ISP1[Tier-1 ISP]:::network
  IXP -->|"via Google"| ISP2[Your ISP]:::network
  ISP1 -->|"via Tier-1, Google"| ISP3[Other ISPs]:::network
  ISP2 --> T["Routing table updated:<br/>142.250.x.x goes via IXP"]:::highlight`,text:`Routes flow outward from whoever owns the addresses. Packets then flow back along the reverse of those announcements.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`heading2`,text:`Myths vs. Reality`},{type:`bullets`,items:[`Myth: "The Internet is the cloud." Reality: The Internet is physical infrastructure. The "cloud" is just data centers connected to this infrastructure.`,`Myth: "WiFi is the Internet." Reality: WiFi is just the wireless connection between your device and your router. Your router then connects to the Internet via your ISP.`,`Myth: "Data travels at the speed of light." Reality: Almost, but not quite. Light through fiber optic cable is ~67% the speed of light in vacuum. Plus, each router introduces microseconds of processing delay.`,`Myth: "If I have a fast Internet plan, all websites will be fast." Reality: Speed also depends on: server location (latency), server capacity, CDN usage, and network congestion along the path.`,`Myth: "TCP is always better than UDP." Reality: For real-time applications (video calls, online games), UDP is better because occasional packet loss is preferable to the delay caused by TCP's retransmission.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`heading2`,text:`Why This Matters for System Design`},{type:`bullets`,items:[`Latency budgeting: A system design must account for network latency. A request from India to the US takes ~150-200ms in network time alone — before any server processing.`,`TCP vs UDP choice: Designing a real-time chat system → TCP for reliability. Designing a live video stream → UDP for speed.`,`Load balancers: Understanding packets and ports explains how a load balancer can distribute traffic — it inspects destination IP and port to decide which backend server to forward to.`,`CDN design: CDNs work by placing servers physically close to users, reducing the number of network hops and thus latency.`,`Firewall and security: Firewalls operate at the IP/port level — blocking or allowing packets based on source IP, destination port, and protocol.`]},{type:`callout`,variant:`important`,text:`In every system design interview, latency is a constraint rooted in network physics. Understanding TCP/IP and routing is why engineers know that global P99 latency < 50ms is physically impossible for data traveling between continents.`}]}]},{id:`how-dns-works`,title:`How DNS Works`,emoji:`🔍`,icon:`ti-search`,color:`#8b5cf6`,bg:`#ede9fe`,accentGlow:`rgba(139,92,246,0.15)`,difficulty:`Beginner`,tagline:`The phonebook of the Internet — how google.com becomes 142.250.80.46 in milliseconds.`,tags:[`DNS Resolver`,`Nameservers`,`Caching`,`TTL`,`A Records`],estimatedTime:`30 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`The Domain Name System`},{type:`paragraph`,text:`DNS (Domain Name System) is the Internet's phonebook. Computers communicate using IP addresses (like 142.250.80.46), but humans remember names (like google.com). DNS translates human-readable domain names into machine-readable IP addresses.`},{type:`paragraph`,text:`Every time you type a URL in your browser, visit a website, send an email, or open an app — a DNS lookup happens in the background. It is one of the most fundamental services on the Internet, yet almost invisible to end users.`},{type:`callout`,variant:`info`,text:`DNS is a distributed, hierarchical database. "Distributed" means no single server holds every name-to-IP mapping. "Hierarchical" means the servers are arranged like a tree: a few at the top point you to the next level down, until you reach the server that holds the real answer.`},{type:`callout`,variant:`info`,text:`In simple terms: DNS is like asking for directions in a big city. You ask a helpful guide (the resolver). If they do not already know, they ask the city office (root), which sends them to the right district office (.com), which sends them to the building manager (google.com's nameserver), who gives the exact address. The guide remembers it so the next person gets the answer instantly.`},{type:`flow`,title:`The big picture — name in, IP address out`,code:`flowchart LR
  B(["Browser<br/>needs google.com"]):::client -->|"What is the IP?"| R["DNS Resolver<br/>8.8.8.8 or your ISP"]:::network
  R --> C{"Already<br/>in cache?"}
  C -->|"yes, usually"| A["142.250.80.46"]:::highlight
  C -->|"no"| H["Ask the hierarchy<br/>root, .com, google.com"]:::external
  H --> A
  A --> B`,text:`Most lookups are answered from a cache in about a millisecond. The full walk down the hierarchy only happens when the cached answer has expired.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`The Problem`},{type:`paragraph`,text:`IP addresses change. Companies move servers, add capacity, migrate to cloud, change providers. If your browser bookmarked IP addresses instead of domain names, every time google.com changed its server, you would need to update your bookmark. DNS lets the IP change while the domain name stays the same.`},{type:`flow`,title:`Same name, different answers`,code:`flowchart TB
  Q(["Lookup: shop.com"]):::client --> DNS["DNS for shop.com"]:::network
  DNS -->|"user in India"| S1["Mumbai server<br/>13.0.0.10"]:::server
  DNS -->|"user in US"| S2["Virginia server<br/>54.0.0.20"]:::server
  DNS -.->|"Virginia down, failover"| S3["Oregon server<br/>34.0.0.30"]:::server`,text:`Because users only remember the name, DNS is free to point it at whichever server is nearest, least busy, or still healthy.`},{type:`heading2`,text:`Key Benefits of DNS`},{type:`bullets`,items:[`Human-friendly names: google.com is easier to remember than 142.250.80.46.`,`Indirection: IP addresses can change without users needing to do anything. Just update the DNS record.`,`Load distribution: DNS can return different IP addresses for the same domain to distribute load across multiple servers.`,`Geographic routing: DNS can return the nearest server's IP to the user's location (GeoDNS).`,`Redundancy: Multiple IP addresses can be returned for the same domain for failover.`]}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`The Four Key Players in DNS Resolution`},{type:`bullets`,items:[`DNS Resolver (Recursive Resolver): Your device's first call. Usually provided by your ISP, or a public resolver like 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare). It does the work of finding the answer by querying other DNS servers.`,`Root Nameserver: The top of the DNS hierarchy. Knows where to find the nameservers for all top-level domains (.com, .org, .in, etc.). There are 13 root nameserver clusters worldwide.`,`TLD Nameserver (Top-Level Domain): Knows where to find nameservers for all domains ending in .com, .org, etc. For google.com, the .com TLD nameserver knows google's authoritative nameserver.`,`Authoritative Nameserver: The final authority. Holds the actual DNS records for a domain. For google.com, Google's own nameservers (ns1.google.com, etc.) hold the real IP addresses.`]},{type:`flow`,title:`The DNS tree — who knows what`,code:`flowchart TB
  ROOT["Root nameservers<br/>know where every TLD lives"]:::network
  ROOT --> COM[".com TLD"]:::network
  ROOT --> ORG[".org TLD"]:::network
  ROOT --> IN[".in TLD"]:::network
  COM --> G["ns1.google.com<br/>authoritative"]:::db
  COM --> AMZ["Amazon nameservers<br/>authoritative"]:::db
  G --> REC["google.com A 142.250.80.46"]:::highlight`,text:`Each level only knows the next level down. Only the authoritative nameserver at the bottom holds the actual IP address.`},{type:`heading2`,text:`DNS Record Types`},{type:`bullets`,items:[`A Record: Maps a domain to an IPv4 address. google.com → 142.250.80.46`,`AAAA Record: Maps a domain to an IPv6 address.`,`CNAME Record: Alias from one domain to another. www.google.com → google.com`,`MX Record: Mail server for a domain. google.com → mail servers for Gmail.`,`NS Record: Nameserver for a domain. Tells where to find authoritative answers.`,`TXT Record: Arbitrary text. Used for domain verification, SPF (email anti-spam), etc.`,`TTL (Time to Live): How long a DNS record should be cached. A TTL of 300 = cache for 5 minutes.`]}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`Full DNS Resolution: typing google.com`},{type:`numbered`,items:[`Browser checks its own DNS cache. If google.com was visited recently and TTL has not expired — use cached IP. Done in 0ms.`,`OS checks the local DNS cache (and the /etc/hosts file). If found, return immediately.`,`OS queries the Recursive Resolver (e.g., 8.8.8.8). This is typically your ISP's resolver or a public DNS.`,`Resolver checks its own cache. If cached and TTL valid, return the answer immediately.`,`If not cached: Resolver asks a Root Nameserver: "Who handles .com?"`,`Root Nameserver responds: "Ask the .com TLD nameserver at [address]."`,`Resolver asks the .com TLD nameserver: "Who handles google.com?"`,`.com TLD nameserver responds: "Ask ns1.google.com at [address]."`,`Resolver asks ns1.google.com: "What is the IP for google.com?"`,`ns1.google.com responds: "google.com → 142.250.80.46, TTL=300"`,`Resolver caches the answer for 300 seconds and returns it to your browser.`,`Browser now connects to 142.250.80.46 on port 443 for HTTPS.`]},{type:`flow`,title:`Full lookup when nothing is cached (steps 3-11)`,code:`sequenceDiagram
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
  R-->>B: 142.250.80.46`,text:`The browser asks one question. The resolver does the legwork, asking three servers in turn, each one pointing it closer to the answer.`},{type:`callout`,variant:`tip`,text:`In practice, steps 5-10 rarely happen. Recursive resolvers cache heavily. Most DNS queries resolve from cache in < 1ms. The full recursive lookup (steps 5-10) only happens when the TTL has expired, typically once every few minutes for popular sites.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`DNS Cache Hierarchy`},{type:`code`,lang:`text`,code:`Browser Cache (0ms)
   \u2193 miss
OS/System Cache (0ms)
   \u2193 miss
Recursive Resolver Cache (1-5ms, network)
   \u2193 miss
Root Nameserver \u2192 TLD Nameserver \u2192 Authoritative NS
(~50-150ms total, multiple network round-trips)`},{type:`flow`,title:`Cache check order — stop at the first hit`,code:`flowchart TD
  Q([Need IP for google.com]):::client --> BC{"Browser cache?"}:::cache
  BC -->|"hit, 0ms"| DONE["Use the IP"]:::highlight
  BC -->|"miss"| OS{"OS cache or<br/>hosts file?"}:::cache
  OS -->|"hit, 0ms"| DONE
  OS -->|"miss"| RC{"Resolver cache?"}:::cache
  RC -->|"hit, 1-5ms"| DONE
  RC -->|"miss"| FULL["Root, TLD, authoritative<br/>50-150ms"]:::external
  FULL --> DONE`,text:`Each cache layer is faster than the one below it. Only a miss at every level triggers the slow full lookup.`},{type:`heading2`,text:`Popular Public DNS Resolvers`},{type:`bullets`,items:[`8.8.8.8 / 8.8.4.4: Google Public DNS. Fast, reliable, global.`,`1.1.1.1 / 1.0.0.1: Cloudflare DNS. Claims to be the fastest public DNS resolver. Privacy-focused.`,`9.9.9.9: Quad9. Security-focused — blocks known malicious domains.`,`ISP DNS: Default for most users. Often slower but usually good enough.`]}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`DNS in Website Migration`},{type:`paragraph`,text:`Imagine your company is moving from a shared hosting server to AWS. The old server IP is 1.2.3.4. The new server IP on AWS is 5.6.7.8. The migration process:`},{type:`numbered`,items:[`Configure your application on the new server (5.6.7.8). Test it thoroughly.`,`Lower the TTL on your DNS records to 60 seconds (1 minute). Wait 24 hours for this to propagate.`,`Update the DNS A record: mysite.com → 5.6.7.8.`,`Within 60 seconds, all DNS caches worldwide will have expired and serve the new IP.`,`New traffic goes to AWS. Old cached entries (TTL 60s) expire quickly.`,`Restore TTL to 3600 (1 hour) once migration is confirmed successful.`]},{type:`flow`,title:`Zero-downtime migration using TTL`,code:`flowchart LR
  A["Set up and test<br/>new server 5.6.7.8"]:::server --> B["Lower TTL<br/>3600s to 60s"]:::cache
  B --> C["Wait for the old<br/>1-hour TTL to expire"]
  C --> D["Change A record<br/>to 5.6.7.8"]:::network
  D --> E["Within ~60s all caches<br/>use the new IP"]
  E --> F["Raise TTL<br/>back to 3600s"]:::highlight`,text:`The trick is lowering the TTL first. Then, when you change the record, caches only hold the old answer for a minute instead of an hour.`},{type:`callout`,variant:`warning`,text:`DNS propagation does NOT take "24-48 hours" as commonly said. With a low TTL, it propagates in minutes. "24-48 hours" was accurate in the 1990s with very high TTLs. With modern short TTLs, DNS changes propagate in minutes.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`DNS resolution at a glance`,code:`flowchart LR
  C(["Browser + OS cache"]):::client -->|"1. recursive query"| R["Recursive resolver"]:::network
  R -->|"2. where is .com?"| ROOT["Root NS"]:::network
  R -->|"3. where is google.com?"| TLD[".com TLD NS"]:::network
  R -->|"4. IP of google.com?"| AUTH[("Authoritative NS")]:::db
  R -->|"5. 142.250.80.46, TTL 300"| C
  C -->|"6. connect to port 443"| S["google.com server"]:::server`,text:`One recursive question from the client, three iterative questions from the resolver. The cards below explain each stop.`},{type:`diagram`,diagram:{id:`diagram-dns-hierarchy`,title:`Hierarchical 4-Tier DNS Resolution Architecture`,subtitle:`Iterative tree traversal converting domain names into routable 32/128-bit IP addresses in < 25ms`,nodes:[{id:`browser-os-cache`,name:`Browser & OS Resolver Cache`,subtitle:`Local Client Memory Check`,type:`client`,icon:`ti-brand-chrome`,badge:`Local Cache (L1)`,protocol:`chrome://net-internals`,details:[`Checks browser memory cache (stores recent lookups for 1–5 minutes)`,`Checks OS DNS client cache (Windows DNS Cache / macOS mDNSResponder)`,`Checks static hosts file (/etc/hosts or system drivers path)`]},{id:`recursive-resolver`,name:`Recursive DNS Resolver`,subtitle:`ISP Resolver or 1.1.1.1 / 8.8.8.8`,type:`gateway`,icon:`ti-server-2`,badge:`Query Coordinator`,protocol:`UDP Port 53`,details:[`First external stop: searches shared recursive cache (95%+ of queries resolved here)`,`If cache MISS: initiates iterative query chain down the global DNS hierarchy`,`Caches final record for the duration of the authoritative TTL`]},{id:`root-nameserver`,name:`Root Nameserver Cluster`,subtitle:`13 Global Root Authority Clusters`,type:`network`,icon:`ti-world`,badge:`Root Zone (.)`,protocol:`Anycast Hundreds of Nodes`,details:[`Does NOT know specific domain IPs; holds definitive addresses for all TLD servers`,`Inspects ".com" suffix in "google.com"`,`Returns referral to .com TLD Nameserver IP list`]},{id:`tld-nameserver`,name:`TLD Nameserver (.com / Verisign)`,subtitle:`Top-Level Domain Authority`,type:`network`,icon:`ti-folder`,badge:`TLD Zone (.com)`,protocol:`TLD Registry`,details:[`Managed by Verisign for .com/.net; maintains all registered domain NS records`,`Identifies registrar-designated authoritative nameserver (e.g., ns1.google.com)`,`Returns referral containing authoritative nameserver IP addresses`]},{id:`authoritative-nameserver`,name:`Authoritative Nameserver`,subtitle:`ns1.google.com / Route 53 / Cloudflare`,type:`database`,icon:`ti-database`,badge:`Source of Truth`,protocol:`Zone File`,details:[`The definitive owner holding actual DNS zone records (A, AAAA, CNAME, MX, TXT)`,`Reads Zone File: "google.com. 300 IN A 142.250.80.46"`,`Returns final answer record with 300s TTL back to Recursive Resolver`]},{id:`dns-client-dispatch`,name:`Browser TCP Dispatch`,subtitle:`Socket Connection Established`,type:`server`,icon:`ti-bolt`,badge:`IP Obtained`,protocol:`142.250.80.46:443`,details:[`Resolver returns IP to browser; OS caches entry for 300 seconds`,`Browser initiates TCP 3-way handshake directly to 142.250.80.46:443`]}],connections:[{from:`browser-os-cache`,to:`recursive-resolver`,label:`1. Cache Miss: Recursive Query`,protocol:`UDP 53`},{from:`recursive-resolver`,to:`root-nameserver`,label:`2. "Where is .com?"`,protocol:`Iterative`},{from:`recursive-resolver`,to:`tld-nameserver`,label:`3. "Where is google.com?"`,protocol:`Iterative`},{from:`recursive-resolver`,to:`authoritative-nameserver`,label:`4. "What is IP of google.com?"`,protocol:`Iterative`},{from:`recursive-resolver`,to:`dns-client-dispatch`,label:`5. Answer: 142.250.80.46 (TTL 300)`,protocol:`Resolved`}],keyTakeaways:[`Iterative vs Recursive: Client makes 1 Recursive request to Resolver. Resolver makes multiple Iterative queries down the hierarchy.`,`DNS uses UDP: Requests are single packets (< 512 bytes) to avoid 3-way handshake overhead. Responses over 512 bytes fall back to TCP.`,`TTL Trade-off: High TTL (e.g. 86400s) minimizes DNS traffic and boosts speed; Low TTL (e.g. 60s) allows near-instant failover during migration.`],rawSpec:`                    Root Nameserver (13 clusters)
                   /         |                     .com TLD        .org TLD     .in TLD
         /    |       google  amazon  apple  \u2190 Authoritative nameservers
   (ns1.google.com \u2192 142.250.80.46)

Query path for "mail.google.com":
Browser \u2192 Resolver \u2192 Root \u2192 .com TLD \u2192 ns1.google.com \u2192 IP
          \u2191 caches every step for TTL duration

DNS Record on ns1.google.com:
google.com.       300   IN   A       142.250.80.46
mail.google.com.  300   IN   CNAME   googlemail.l.google.com.`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`DNS over UDP`},{type:`paragraph`,text:`DNS queries are sent over UDP port 53. Why UDP? DNS questions and answers are tiny (usually under 512 bytes) and fit in a single packet. TCP would first need a handshake — an extra round trip — which is wasted time for such a small exchange. If an answer is too large for one UDP packet (e.g., many IP addresses), the client automatically retries over TCP.`},{type:`flow`,title:`UDP first, TCP only when needed`,code:`flowchart TD
  Q[Send query over UDP 53]:::network --> R{"Response fits<br/>in one packet?"}
  R -->|"yes, almost always"| OK["Done - 1 round trip"]:::highlight
  R -->|"no, marked truncated"| T["Retry over TCP 53<br/>handshake + query"]:::server
  T --> OK2["Done - 2+ round trips"]`},{type:`heading2`,text:`DNS Security Concerns`},{type:`bullets`,items:[`DNS Spoofing (Cache Poisoning): An attacker injects false DNS records into a resolver's cache, redirecting users to malicious servers. Fixed by DNSSEC (DNS Security Extensions) — cryptographic signatures on DNS records.`,`DNS Hijacking: ISP or government redirects DNS queries to their own servers to censor or monitor traffic. Countermeasure: DNS-over-HTTPS (DoH) — encrypts DNS queries so no one can intercept or modify them.`,`DDoS on DNS: Taking down a company's authoritative DNS server makes their domain unreachable. Solution: Use multiple geographically distributed DNS providers (e.g., Route53 + Cloudflare).`]},{type:`flow`,title:`Cache poisoning and how DNSSEC stops it`,code:`sequenceDiagram
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
  end`,text:`Without signatures the resolver cannot tell a forged answer from a real one, and every user of that resolver is misdirected until the TTL expires.`},{type:`heading2`,text:`GeoDNS — Serving the Nearest Server`},{type:`paragraph`,text:`DNS can return different IP addresses based on the location of the DNS resolver. A user in India querying google.com gets an IP for a Google server in Mumbai. A user in the US gets a different IP for a Google server in Virginia. This is how large companies serve users from the geographically nearest data center — reducing latency automatically.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "DNS takes 24-48 hours to propagate." Reality: With low TTLs, DNS propagates in minutes.`,`Myth: "DNS is just a simple lookup." Reality: It is a hierarchical distributed database with caching at every level. The system is extraordinarily sophisticated.`,`Myth: "Changing DNS provider is instant." Reality: You need to lower TTL before changing, wait for old TTL to expire, then change.`,`Myth: "My private IP address is hidden." Reality: Your public IP (router) is visible. DNS does not hide IP addresses — it just maps names to them.`,`Myth: "HTTPS makes DNS secure." Reality: HTTPS encrypts the HTTP data but DNS lookups are still in plaintext (unless using DNS-over-HTTPS).`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Global Traffic Management: Route53, Cloudflare — use DNS to route users to the nearest server, implement health checks, and failover automatically.`,`Blue-Green Deployments: Deploy new version on new servers. Update DNS to point to new servers. Instant traffic switch with TTL-based rollback.`,`Multi-region Architecture: Two data centers (US, EU). GeoDNS routes European users to EU servers, American users to US servers.`,`Rate Limiting IP-level: DNS helps identify if a domain resolves to multiple IPs — useful when designing distributed rate limiters.`,`Service Discovery (Internal DNS): In microservices, services use internal DNS to discover each other: payment-service.internal → 10.0.0.15.`]},{type:`callout`,variant:`important`,text:`In system design interviews, DNS is often the answer to "How do you route users to the nearest server?" and "How do you implement failover?" — GeoDNS and health-check-based failover routing are fundamental architecture patterns.`}]}]},{id:`how-browser-works`,title:`How a Browser Works`,emoji:`⚡`,icon:`ti-browser`,color:`#f59e0b`,bg:`#fef3c7`,accentGlow:`rgba(245,158,11,0.15)`,difficulty:`Beginner`,tagline:`From a URL to pixels on screen — parsing HTML, building DOM, executing JavaScript, rendering.`,tags:[`DOM`,`CSSOM`,`Render Tree`,`JavaScript Engine`,`Painting`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`What a Browser Actually Is`},{type:`paragraph`,text:`A browser (Chrome, Firefox, Safari, Edge) is a program that downloads files from the Internet and turns them into the pages you see and click. Under the hood it is three main parts working together: a network client (downloads HTML, CSS, JS, images), a rendering engine (turns HTML and CSS into pixels on screen), and a JavaScript engine (runs the page's JavaScript code).`},{type:`callout`,variant:`info`,text:`In simple terms: a browser is like a builder handed a set of blueprints. The HTML says what rooms exist, the CSS says how they look, and the JavaScript says how things move and react. The browser reads all three, works out where everything goes, and then paints the finished house on your screen.`},{type:`flow`,title:`The big picture — from URL to pixels`,code:`flowchart LR
  U(["You type a URL"]):::client --> N["Network<br/>DNS, TCP, TLS, HTTP"]:::network
  N --> F["HTML, CSS, JS,<br/>images arrive"]:::external
  F --> P["Parse into<br/>DOM + CSSOM"]:::server
  F --> JS["JavaScript engine<br/>runs scripts"]:::server
  JS -->|"can change"| P
  P --> R["Layout, paint,<br/>composite"]:::server
  R --> S(["Pixels on screen"]):::highlight`,text:`Fetch the files, understand them, then draw them. JavaScript can step in at any point and change what gets drawn.`},{type:`heading2`,text:`Key Browser Components`},{type:`bullets`,items:[`Browser UI: Address bar, tabs, back/forward buttons.`,`Rendering Engine: Chrome/Edge use Blink. Firefox uses Gecko. Safari uses WebKit. Converts HTML + CSS → pixels.`,`JavaScript Engine: Chrome uses V8. Firefox uses SpiderMonkey. Executes JavaScript code.`,`Network Layer: Handles HTTP/HTTPS requests, caching, cookies.`,`Storage: localStorage, sessionStorage, IndexedDB, cookies.`]},{type:`flow`,title:`How the browser parts fit together`,code:`flowchart TB
  UI["Browser UI<br/>address bar, tabs"]:::client
  subgraph ENG["Inside the browser"]
    NET["Network layer<br/>HTTP, cache, cookies"]:::network
    REN["Rendering engine<br/>Blink, Gecko, WebKit"]:::server
    JSE["JavaScript engine<br/>V8, SpiderMonkey"]:::server
    ST[("Storage<br/>localStorage, IndexedDB")]:::db
  end
  UI --> NET
  NET --> REN
  REN <--> JSE
  JSE <--> ST
  REN --> SCR(["Screen"]):::highlight`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Without a browser, web pages would be raw text files. The browser is what transforms an HTML document — a structured text file — into the interactive, visual experience you see on screen. It handles the enormous complexity of rendering, JavaScript execution, security sandboxing, and network communication so web developers do not have to build all of this themselves.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Phase 1: Navigation`},{type:`numbered`,items:[`You type a URL (e.g., https://github.com) and press Enter.`,`Browser checks if the URL is a search query or an actual URL.`,`Browser performs a DNS lookup to resolve github.com → IP address.`,`Browser establishes a TCP connection to the server on port 443.`,`TLS handshake occurs to establish encrypted HTTPS connection.`,`Browser sends an HTTP GET request for the page.`,`Server responds with HTML.`]},{type:`flow`,title:`Phase 1 — navigation, step by step`,code:`sequenceDiagram
  participant B as Browser
  participant D as DNS Resolver
  participant S as github.com server
  B->>B: Is this a URL or a search?
  B->>D: IP for github.com?
  D-->>B: 140.82.114.4
  B->>S: TCP handshake (port 443)
  B->>S: TLS handshake - agree on encryption keys
  B->>S: GET / (encrypted)
  S-->>B: 200 OK + HTML`,text:`Several round trips happen before the first byte of HTML arrives. This is why connection reuse and nearby servers (CDNs) matter so much.`},{type:`heading2`,text:`Phase 2: Parsing HTML → DOM`},{type:`paragraph`,text:`The browser receives the HTML as raw bytes and turns it into a tree of objects called the DOM (Document Object Model) — one object per element, nested the same way the tags are nested. The parser reads the tags from top to bottom. When it hits a <script> tag, it pauses, downloads and runs the script, then continues (unless the script is marked async or defer). When it hits a CSS <link>, it starts downloading the CSS file in the background and keeps parsing.`},{type:`flow`,title:`What the HTML parser does with each tag`,code:`flowchart TD
  T[Read next tag]:::client --> K{"Which tag?"}
  K -->|"normal element"| D["Add node to DOM"]:::server
  K -->|"stylesheet link"| C["Fetch CSS in background,<br/>keep parsing"]:::network
  K -->|"img"| I["Fetch image in background,<br/>keep parsing"]:::network
  K -->|"plain script"| S["PAUSE parsing,<br/>download + run JS"]:::security
  K -->|"script with async or defer"| A["Download in background,<br/>keep parsing"]:::network
  D --> T
  C --> T
  I --> T
  S --> T
  A --> T`,text:`A plain script tag is the only thing that stops the parser in its tracks — that is why scripts are usually placed at the end or marked defer.`},{type:`heading2`,text:`Phase 3: Parsing CSS → CSSOM`},{type:`paragraph`,text:`CSS is parsed into a tree called the CSSOM (CSS Object Model), which records the final styles for every element. CSS is render-blocking: the browser will not draw anything until the CSSOM is complete. Otherwise it might draw the page unstyled and then have to redraw it a moment later.`},{type:`heading2`,text:`Phase 4: Building the Render Tree`},{type:`paragraph`,text:`DOM + CSSOM are combined into a Render Tree — the list of things that will actually appear on screen. Only visible elements are included (elements with display:none are left out). Each node in the render tree carries its final, computed CSS styles.`},{type:`heading2`,text:`Phase 5: Layout (Reflow)`},{type:`paragraph`,text:`The browser calculates the exact position and size of every element on the screen based on the CSS rules (width, height, margin, padding, flexbox, etc.).`},{type:`heading2`,text:`Phase 6: Paint`},{type:`paragraph`,text:`The browser fills in the actual pixels for each element — colors, borders, shadows, text. This happens in layers (CSS z-index creates layers).`},{type:`heading2`,text:`Phase 7: Compositing`},{type:`paragraph`,text:`The painted layers are handed to the GPU (graphics chip), which stacks them together into the final image on screen — like stacking transparent sheets. Hardware-accelerated transforms and animations happen at this stage, which is why they are so smooth.`},{type:`flow`,title:`Phases 2-7 — the rendering pipeline`,code:`flowchart LR
  H["HTML"]:::external --> DOM["DOM tree"]:::server
  C["CSS"]:::external --> CSSOM["CSSOM tree"]:::server
  DOM --> RT["Render tree<br/>visible nodes + styles"]:::server
  CSSOM --> RT
  RT --> L["Layout<br/>position + size"]:::server
  L --> P["Paint<br/>fill pixels per layer"]:::server
  P --> CO["Composite<br/>GPU stacks layers"]:::highlight`,text:`Two parallel trees merge into one, then each step adds detail: what to show, where it goes, what it looks like, and finally the image on screen.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`Complete Flow: URL to Pixels`},{type:`code`,lang:`text`,code:`User types: https://github.com/explore

1. URL Parse: scheme=https, host=github.com, path=/explore
2. DNS: github.com \u2192 140.82.114.4
3. TCP Connect: SYN \u2192 SYN-ACK \u2192 ACK  (~50ms)
4. TLS Handshake: Client Hello \u2192 Server Hello \u2192 Keys (~50ms)
5. HTTP GET /explore \u2192 200 OK + HTML
6. Parse HTML \u2192 DOM tree
   While parsing:
   \u2192 Encounter <link rel="stylesheet"> \u2192 fetch CSS (parallel)
   \u2192 Encounter <script> \u2192 pause parsing, execute JS (or defer)
   \u2192 Encounter <img> \u2192 fetch image (parallel)
7. Parse CSS \u2192 CSSOM
8. DOM + CSSOM \u2192 Render Tree
9. Layout: calculate positions and sizes
10. Paint: fill pixels per element
11. Composite: GPU combines layers \u2192 Display

Total time goal: < 1 second for initial paint (First Contentful Paint)`},{type:`flow`,title:`URL to pixels — network part, then rendering part`,code:`flowchart TB
  subgraph NET["Network - about 100-200ms"]
    A["1. Parse URL"]:::client --> B["2. DNS lookup"]:::network
    B --> C["3. TCP connect"]:::network
    C --> D["4. TLS handshake"]:::security
    D --> E["5. GET /explore, 200 OK"]:::network
  end
  subgraph RENDER["Rendering - in the browser"]
    F["6. HTML to DOM<br/>fetch CSS, JS, images"]:::server --> G["7. CSS to CSSOM"]:::server
    G --> H["8. Render tree"]:::server
    H --> I["9. Layout"]:::server
    I --> J["10. Paint"]:::server
    J --> K["11. Composite, display"]:::highlight
  end
  E --> F`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`JavaScript Engine — V8 (Chrome)`},{type:`bullets`,items:[`Parses JavaScript source code into an Abstract Syntax Tree (AST).`,`Compiles to bytecode (Ignition interpreter).`,`Hot code paths are identified and compiled to optimized machine code (TurboFan JIT compiler).`,`This is why JavaScript, once considered slow, now runs at near-native speed.`]},{type:`flow`,title:`How V8 runs your JavaScript`,code:`flowchart LR
  SRC["JS source code"]:::client --> AST["Parser<br/>builds AST"]:::server
  AST --> BC["Ignition<br/>bytecode, runs right away"]:::server
  BC --> HOT{"Function run<br/>many times?"}
  HOT -->|"yes, hot"| TF["TurboFan<br/>optimized machine code"]:::highlight
  HOT -->|"no"| BC
  TF -.->|"assumptions broken,<br/>de-optimize"| BC`,text:`Start quickly with bytecode, then spend extra effort compiling only the code that runs often. JIT means "just-in-time" — compiled while the program is running.`},{type:`heading2`,text:`Event Loop — The Heart of JavaScript`},{type:`paragraph`,text:`JavaScript is single-threaded: it can only do one thing at a time. Slow work like network requests and timers is handed off to the browser, so the main thread is not stuck waiting. When that work finishes, its callback (the function to run next) is put in a task queue. The Event Loop keeps checking: whenever the call stack (the code currently running) is empty, it takes the next callback from the queue and runs it.`},{type:`flow`,title:`The event loop`,code:`flowchart LR
  CS["Call stack<br/>code running now"]:::server -->|"fetch, setTimeout"| WA["Browser APIs<br/>network, timers"]:::external
  WA -->|"done, queue callback"| Q[["Task queue"]]:::queue
  Q --> EL{"Event loop:<br/>is the stack empty?"}
  EL -->|"yes"| CS
  EL -->|"no, wait"| EL`,text:`Long-running code on the call stack blocks everything — clicks, rendering and callbacks all wait until it finishes.`},{type:`heading2`,text:`Browser Caching`},{type:`bullets`,items:[`HTTP Cache: Stores server responses. Cache-Control headers determine how long to cache.`,`Service Worker Cache: JavaScript-controlled offline cache.`,`Memory Cache: Short-lived in-memory cache for the current page session.`,`Disk Cache: Persistent cache stored on disk across sessions.`]}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Performance Optimization in Practice`},{type:`paragraph`,text:`Understanding how browsers work explains every web performance optimization technique:`},{type:`bullets`,items:[`Minification: Remove whitespace from CSS/JS → smaller files → faster download.`,`Code splitting: Load only the JavaScript needed for the current page (not the whole app).`,`Lazy loading images: Only load images when they scroll into the viewport.`,`async/defer on scripts: Do not block HTML parsing while loading JS.`,`Critical CSS: Inline the CSS needed for above-the-fold content to avoid render-blocking.`,`HTTP/2: Multiple resources can be fetched in parallel over a single connection.`,`Preloading: <link rel="preload"> tells the browser to fetch critical resources immediately.`]}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`Critical rendering path at a glance`,code:`flowchart LR
  BY["Bytes from network"]:::network --> TOK["Tokenize"]
  TOK --> DOM["DOM"]:::server
  TOK --> CSSOM["CSSOM"]:::server
  DOM --> RT["Render tree"]:::server
  CSSOM --> RT
  RT --> L["Layout"]:::server
  L --> PC["Paint + composite"]:::highlight`,text:`Every page goes through this pipeline. The cards below explain what happens inside each stage.`},{type:`diagram`,diagram:{id:`diagram-browser-pipeline`,title:`Critical Rendering Path & Browser Engine Pipeline`,subtitle:`How HTML/CSS/JS byte streams are transformed into 60fps GPU rasterized screen pixels`,nodes:[{id:`network-tokenizer`,name:`Bytes → Tokens → Nodes`,subtitle:`HTML/CSS Lexer & Tokenizer`,type:`network`,icon:`ti-binary`,badge:`Lexical Analysis`,protocol:`UTF-8 Stream`,details:[`Reads raw bytes from network socket; decodes character sets (UTF-8)`,`Emits StartTag, EndTag, and Character tokens using state machine`,`Spawns preload scanner in background to download external CSS and scripts`]},{id:`dom-tree-builder`,name:`DOM Tree Construction`,subtitle:`Document Object Model`,type:`client`,icon:`ti-binary-tree`,badge:`DOM Tree`,protocol:`Node Hierarchy`,details:[`Builds nested object tree representing all elements, attributes, and relationships`,`Executes HTML parser tolerance (auto-closes unclosed tags like <p>)`,`Synchronous <script> tags block DOM construction until downloaded & evaluated`]},{id:`cssom-engine`,name:`CSSOM Construction`,subtitle:`CSS Object Model`,type:`client`,icon:`ti-paint`,badge:`Style Resolution`,protocol:`Cascading Rules`,details:[`Parses stylesheets, inline styles, and browser user-agent defaults`,`Calculates specificity and cascading rules for every node`,`Render-blocking: browser refuses to paint until CSSOM is 100% complete`]},{id:`render-tree`,name:`Render Tree Synthesis`,subtitle:`Visible Nodes Pruning`,type:`gateway`,icon:`ti-layers-intersect`,badge:`Render Tree`,protocol:`DOM + CSSOM`,details:[`Combines DOM and CSSOM to represent everything visually painted on screen`,`Prunes non-visible nodes (<head>, <script>, <meta>, and elements with display:none)`,`Includes pseudo-elements like ::before and ::after`]},{id:`layout-reflow`,name:`Layout / Reflow Engine`,subtitle:`Box Model Geometry Calculation`,type:`server`,icon:`ti-dimensions`,badge:`Geometry (x, y, w, h)`,protocol:`Box Model`,details:[`Calculates exact viewport-relative coordinates and pixel dimensions for each box`,`Translates percentages and em/rem units into absolute device pixel values`,`Layout thrashing occurs when JavaScript repeatedly reads and writes geometry in loops`]},{id:`paint-compositor`,name:`Paint & GPU Compositing`,subtitle:`Rasterization & Layer Blending`,type:`database`,icon:`ti-device-desktop`,badge:`GPU Compositor`,protocol:`60–120 FPS Output`,details:[`Rasterizes element boxes into pixel bitmaps across multiple GPU graphic layers`,`GPU Compositor merges layers on screen; handles CSS transforms & opacity without CPU reflow`]}],connections:[{from:`network-tokenizer`,to:`dom-tree-builder`,label:`1. Tokens to DOM Nodes`,protocol:`AST`},{from:`network-tokenizer`,to:`cssom-engine`,label:`2. CSS Bytes to Style Rules`,protocol:`CSSOM`},{from:`dom-tree-builder`,to:`render-tree`,label:`3. Merge Visible Nodes`,protocol:`DOM+CSSOM`},{from:`render-tree`,to:`layout-reflow`,label:`4. Compute Pixel Geometry`,protocol:`Box Model`},{from:`layout-reflow`,to:`paint-compositor`,label:`5. Rasterize & Composite Layers`,protocol:`GPU Draw`}],keyTakeaways:[`Display: none vs Visibility: hidden: display:none is omitted from the Render Tree completely (no layout). visibility:hidden occupies space in Layout and only skips Paint.`,`Composite-Only Properties: Animating transform and opacity executes exclusively on the GPU compositor thread, completely bypassing expensive Layout and Paint phases.`,`Async vs Defer: <script async> executes immediately upon download (interrupts parsing). <script defer> downloads in parallel and executes strictly after DOM parsing finishes.`],rawSpec:`HTML Bytes \u2192 Tokenize \u2192 DOM Tree
                             \u2193
CSS Bytes  \u2192 Tokenize \u2192 CSSOM   \u2193
                     \u2193      \u2193
                   Render Tree (DOM + CSSOM)
                             \u2193
                        Layout/Reflow
                     (compute x, y, w, h of every element)
                             \u2193
                          Paint
                    (fill pixels per element)
                             \u2193
                        Composite
                    (GPU merges layers to screen)

JS modifications:
element.style.width = '200px'  \u2192 forces Layout \u2192 Paint \u2192 Composite
element.style.color = 'red'    \u2192 forces Paint \u2192 Composite (skips Layout)
element.style.transform = '...' \u2192 forces Composite only (runs on GPU)`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`The Critical Rendering Path`},{type:`paragraph`,text:`The Critical Rendering Path is the sequence of steps the browser takes to convert HTML, CSS, and JS into pixels. Optimizing this path is the core of web performance engineering. The goal is to minimize the number of bytes needed for first render and the number of round-trips to the server.`},{type:`heading2`,text:`Reflow and Repaint — The Expensive Operations`},{type:`bullets`,items:[`Reflow (Layout): When JavaScript changes the DOM in a way that affects element positions or sizes (e.g., adding a div, changing width), the browser must recalculate layout for the affected elements and their children. Expensive.`,`Repaint: When only visual properties change (color, background) without affecting layout. Cheaper than reflow.`,`Compositing: CSS transforms (transform, opacity) only trigger compositing — no reflow or repaint. Cheapest. That's why animations should use transform instead of changing left/top.`]},{type:`flow`,title:`Which work does a style change trigger?`,code:`flowchart TD
  CH([JS or CSS changes a style]):::client --> Q1{"Changes size<br/>or position?"}
  Q1 -->|"yes: width, margin, left"| L["Layout"]:::security
  L --> P["Paint"]:::cache
  Q1 -->|"no"| Q2{"Changes how<br/>it looks?"}
  Q2 -->|"yes: color, background"| P
  Q2 -->|"no: transform, opacity"| C["Composite only<br/>runs on GPU"]:::highlight
  P --> C`,text:`The higher up the pipeline a change starts, the more work the browser must redo. Smooth animations stick to transform and opacity.`},{type:`heading2`,text:`Browser Security — The Same-Origin Policy`},{type:`paragraph`,text:`JavaScript on a page from site-a.com is not allowed to read responses from site-b.com. This is the Same-Origin Policy — a critical security boundary. An "origin" is the combination of scheme, domain and port (e.g., https://site-a.com:443). CORS (Cross-Origin Resource Sharing) is how site-b.com can explicitly say "I trust site-a.com, let it read my responses."`},{type:`flow`,title:`Same-origin policy and CORS`,code:`sequenceDiagram
  participant P as Page on site-a.com
  participant B as Browser
  participant S as api.site-b.com
  P->>B: fetch api.site-b.com/data
  B->>S: GET /data (Origin: site-a.com)
  S-->>B: Response + Access-Control-Allow-Origin header
  alt header allows site-a.com
    B-->>P: Here is the data
  else header missing or different
    B-->>P: Blocked - CORS error
  end`,text:`The browser, not the server, enforces the rule. The server only decides which origins it trusts by sending the CORS header.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "JavaScript is slow." Reality: Modern V8/SpiderMonkey JIT compilers produce near-native speed code. Performance issues are usually algorithmic, not language-speed.`,`Myth: "The browser downloads the whole page before showing anything." Reality: Browsers stream HTML and render incrementally as data arrives.`,`Myth: "More JavaScript = slower page." Reality: It depends on when and how JS is loaded. async/defer loading can make JS have zero impact on initial render.`,`Myth: "CSS is trivial, only JS matters for performance." Reality: CSS is render-blocking. A large unoptimized CSS file can delay first paint more than JavaScript.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Server-Side Rendering (SSR): Render HTML on the server. Browser receives ready-to-display HTML → faster First Contentful Paint.`,`Client-Side Rendering (CSR): Send minimal HTML + lots of JS. Browser builds DOM from JS. Slower initial load, but faster subsequent navigation.`,`Static Site Generation (SSG): Pre-generate HTML at build time. Fastest possible delivery.`,`CDN for static assets: JS/CSS/images served from CDN edge nodes. Reduces download latency by serving from nearest server.`,`Web Vitals: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift) — measurable performance metrics derived directly from understanding the rendering pipeline.`]}]}]},{id:`how-http-works`,title:`How HTTP Works`,emoji:`🔄`,icon:`ti-arrows-exchange`,color:`#10b981`,bg:`#d1fae5`,accentGlow:`rgba(16,185,129,0.15)`,difficulty:`Beginner`,tagline:`The language of the web — request/response lifecycle, methods, headers, status codes, and HTTP/2.`,tags:[`Request/Response`,`Methods`,`Status Codes`,`Headers`,`HTTP/2`],estimatedTime:`35 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`HyperText Transfer Protocol`},{type:`paragraph`,text:`HTTP (HyperText Transfer Protocol) is the set of rules for how clients (browsers, apps) and servers talk to each other on the web. It works as request and response: the client asks for something, the server answers. Every web page you load and every API call your app makes uses HTTP or its encrypted version, HTTPS.`},{type:`callout`,variant:`info`,text:`In simple terms: HTTP is like ordering at a restaurant counter. You hand over an order slip saying what you want (method + URL), with extra notes like "no onions" (headers). The kitchen hands back your food (the body) with a short note on top: "here you go" (200), "we are out of that" (404), or "kitchen is on fire" (500).`},{type:`flow`,title:`The big picture — one request, one response`,code:`sequenceDiagram
  participant C as Client (browser / app)
  participant S as Server
  C->>S: Request - GET /api/users/123 + headers
  Note over S: Find the handler, run logic, read the database
  S-->>C: Response - 200 OK + headers + JSON body
  Note over C,S: The server forgets this exchange - next request starts fresh`,text:`Every HTTP interaction is this same shape: one request, one response, with no memory in between.`},{type:`heading2`,text:`HTTP is Stateless`},{type:`paragraph`,text:`Each HTTP request is completely independent. The server has no memory of previous requests from the same client — Request 2 is treated as if Request 1 never happened. This makes HTTP simple and easy to scale (any server can handle any request). The catch: to remember things like "this user is logged in", we need extra tools such as cookies, sessions, and tokens that the client sends along with every request.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Before HTTP, there was no standard way for computers to share documents over a network. HTTP defined a universal language: how to ask for a resource (request), how to describe what you want (headers, methods), and how to communicate the result (status codes, response body). It is the contract between every web client and server.`},{type:`heading2`,text:`HTTP Versions Timeline`},{type:`bullets`,items:[`HTTP/1.0 (1996): One request per TCP connection. Very inefficient.`,`HTTP/1.1 (1997): Keep-alive connections (reuse TCP). Pipelining (send multiple requests without waiting). Still the most widely understood.`,`HTTP/2 (2015): Binary protocol. Multiplexing (multiple requests on one connection, no head-of-line blocking). Header compression (HPACK). Server push.`,`HTTP/3 (2022): Based on QUIC (UDP) instead of TCP. Eliminates TCP head-of-line blocking. Faster connection establishment. Used by ~30% of the web.`]},{type:`callout`,variant:`tip`,text:`Head-of-line blocking means one slow item at the front of the line holds up everything behind it — like a single checkout lane where one customer with a full cart makes everyone wait.`},{type:`flow`,title:`How each HTTP version improved`,code:`flowchart LR
  A["HTTP/1.0<br/>new TCP connection<br/>for every request"]:::external --> B["HTTP/1.1<br/>reuse the connection<br/>keep-alive"]:::server
  B --> C["HTTP/2<br/>many requests at once<br/>on one connection"]:::server
  C --> D["HTTP/3<br/>QUIC over UDP<br/>no TCP blocking"]:::highlight`,text:`Each version attacks the same problem: wasted waiting. First fewer handshakes, then less queueing, then no single lost packet stalling everything.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`HTTP Request Structure`},{type:`code`,lang:`http`,code:`GET /api/users/123 HTTP/1.1
Host: api.github.com
Authorization: Bearer eyJhbGc...
Accept: application/json
User-Agent: Mozilla/5.0 (Chrome/...)
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

(empty body for GET requests)`},{type:`heading2`,text:`HTTP Response Structure`},{type:`code`,lang:`http`,code:`HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 185
Cache-Control: max-age=60
ETag: "33a64df5"
Set-Cookie: session=abc123; HttpOnly; Secure

{
  "id": 123,
  "login": "torvalds",
  "name": "Linus Torvalds",
  "public_repos": 9
}`},{type:`heading2`,text:`HTTP Methods`},{type:`bullets`,items:[`GET: Retrieve a resource. No body. Safe (no side effects) and idempotent (same result every time).`,`POST: Create a resource or submit data. Has a body. Not idempotent (two POSTs may create two resources).`,`PUT: Replace a resource entirely. Idempotent (putting the same data twice gives the same result).`,`PATCH: Partially update a resource. More efficient than PUT for partial changes.`,`DELETE: Remove a resource. Idempotent.`,`HEAD: Like GET but returns only headers, no body. Used to check if a resource exists or check its size.`,`OPTIONS: Ask the server what methods are allowed. Used in CORS preflight requests.`]},{type:`heading2`,text:`HTTP Status Codes`},{type:`bullets`,items:[`2xx Success: 200 OK, 201 Created, 204 No Content.`,`3xx Redirect: 301 Moved Permanently, 302 Found (temporary), 304 Not Modified (use cache).`,`4xx Client Errors: 400 Bad Request, 401 Unauthorized (not authenticated), 403 Forbidden (not authorized), 404 Not Found, 409 Conflict, 429 Too Many Requests.`,`5xx Server Errors: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.`]},{type:`flow`,title:`Reading a status code`,code:`flowchart TD
  R([Response arrives]):::client --> F{"First digit?"}
  F -->|"2xx"| OK["It worked<br/>200, 201, 204"]:::highlight
  F -->|"3xx"| RE["Look elsewhere<br/>301, 302, 304 use cache"]:::cache
  F -->|"4xx"| CE["You made a mistake<br/>400, 401, 403, 404, 429"]:::security
  F -->|"5xx"| SE["Server broke<br/>500, 502, 503, 504"]:::external`,text:`The first digit tells you who should act: 4xx means fix the request, 5xx means the server side has a problem and retrying later may help.`},{type:`heading2`,text:`Important HTTP Headers`},{type:`bullets`,items:[`Content-Type: What format is the body? (application/json, text/html, multipart/form-data)`,`Authorization: Bearer {token} for API auth. Basic {base64} for basic auth.`,`Cache-Control: max-age=3600 (cache for 1 hour), no-cache, no-store.`,`ETag: A hash of the response. Client sends If-None-Match: {etag}. Server returns 304 if unchanged.`,`Cookie / Set-Cookie: State management. Server sets cookies; client sends them on every request.`,`CORS headers: Access-Control-Allow-Origin tells browsers which domains can make cross-origin requests.`]}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`A Full HTTP Request/Response Cycle`},{type:`numbered`,items:[`Client forms a request: method (GET), URL (/api/products), headers (Authorization, Accept), optional body.`,`Request sent over TCP to server's IP:Port. HTTPS: encrypted. HTTP: plaintext.`,`Server receives request, decodes it.`,`Server routes request to the correct handler (based on path and method).`,`Handler executes business logic (queries database, calls other services).`,`Handler builds a response: status code, headers (Content-Type, Cache-Control), response body.`,`Server sends response back over the same TCP connection (keep-alive).`,`Client receives response, checks status code.`,`200: process response body. 304: use cached copy. 401: redirect to login. 500: show error.`]},{type:`flow`,title:`A full request/response cycle`,code:`sequenceDiagram
  participant C as Client
  participant S as Server
  participant H as Route handler
  participant DB as Database
  C->>S: GET /api/products + Authorization header
  S->>S: Decode request
  S->>H: Route by method + path
  H->>DB: Query products
  DB-->>H: Rows
  H-->>S: 200 + headers + JSON body
  S-->>C: Response (same keep-alive connection)
  alt 200
    C->>C: Use the JSON
  else 401
    C->>C: Redirect to login
  else 5xx
    C->>C: Show an error message
  end`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`HTTP/2 Multiplexing — The Key Improvement`},{type:`paragraph`,text:`In HTTP/1.1, a connection handles one request at a time: the next request must wait until the previous response has fully arrived (head-of-line blocking). To work around this, browsers open up to 6 TCP connections per site in parallel. HTTP/2 fixes it properly: many requests can be in flight at the same time over a single TCP connection. Each request/response pair gets its own numbered "stream", and their pieces (frames) are interleaved on the wire. This removes HTTP-level head-of-line blocking and lets the server send the most important responses first.`},{type:`code`,lang:`text`,code:`HTTP/1.1: 6 parallel TCP connections (workaround)
Conn 1: GET /style.css \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> Response
Conn 2: GET /app.js   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> Response
Conn 3: GET /logo.png \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> Response

HTTP/2: 1 TCP connection, multiple streams
Stream 1: GET /style.css \u2500\u2500> Response  (interleaved frames)
Stream 3: GET /app.js   \u2500\u2500> Response
Stream 5: GET /logo.png \u2500\u2500> Response`},{type:`flow`,title:`HTTP/1.1 waits in line, HTTP/2 interleaves`,code:`sequenceDiagram
  participant B as Browser
  participant S as Server
  Note over B,S: HTTP/1.1 - one connection, one at a time
  B->>S: GET /style.css
  S-->>B: style.css
  B->>S: GET /app.js
  S-->>B: app.js
  Note over B,S: HTTP/2 - one connection, many streams
  B->>S: stream 1 GET /style.css
  B->>S: stream 3 GET /app.js
  B->>S: stream 5 GET /logo.png
  S-->>B: frames for 3, 1, 5, 1, 3 mixed together
  Note over B: Reassemble each stream separately`,text:`With HTTP/2, a slow app.js no longer holds up style.css — their frames simply take turns on the same connection.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`An API Call from a React App`},{type:`code`,lang:`typescript`,code:`// React component fetches user data
useEffect(() => {
  fetch('https://api.example.com/users/me', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGc...',  // JWT token
      'Accept': 'application/json',
    }
  })
  .then(res => {
    // Check HTTP status
    if (res.status === 401) redirect('/login');
    if (!res.ok) throw new Error('Server error');
    return res.json();   // Parse JSON body
  })
  .then(user => setUser(user))
  .catch(err => setError(err));
}, []);

// Browser sends:
// GET /users/me HTTP/2
// Host: api.example.com
// Authorization: Bearer eyJhbGc...
// \u2192 Response: 200 OK + JSON body`},{type:`flow`,title:`What the fetch call does`,code:`flowchart TD
  A["fetch /users/me<br/>with Bearer token"]:::client --> B["GET over HTTP/2"]:::network
  B --> S["api.example.com"]:::server
  S --> C{"Response status?"}
  C -->|"401"| L["Redirect to /login"]:::security
  C -->|"other non-2xx"| E["throw, setError"]:::external
  C -->|"2xx"| J["res.json, setUser"]:::highlight`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`HTTP lifecycle at a glance`,code:`flowchart LR
  C(["Client"]):::client -->|"1. TCP + TLS<br/>handshake"| F["HTTP framing<br/>1.1 text or 2 binary"]:::network
  F -->|"2. request on the wire"| P["Reverse proxy<br/>Nginx, Envoy"]:::security
  P -->|"3. forward"| A["App handler"]:::server
  A <--> DB[("Database<br/>or cache")]:::db
  A -->|"4. status, headers, body"| R["Response"]:::highlight
  R -.->|"connection kept alive"| C`,text:`The connection is set up once and reused. The cards below walk through each stage in detail.`},{type:`diagram`,diagram:{id:`diagram-http-flow`,title:`HTTP Request/Response Lifecycle & Protocol Stream Pipeline`,subtitle:`From TCP 3-Way Handshake to Multiplexed HTTP/2 Binary Frames and UDP-based HTTP/3 QUIC`,nodes:[{id:`client-transport`,name:`Client Socket & TCP Handshake`,subtitle:`Layer 4 Transport Setup`,type:`client`,icon:`ti-plug-connected`,badge:`Transport Init`,protocol:`SYN → SYN-ACK → ACK`,details:[`Browser opens socket, allocates local ephemeral port, sends TCP SYN to server`,`Server responds with SYN-ACK; client confirms with ACK (1 RTT total)`,`With TLS enabled, TLS handshake executes immediately on top of the established TCP connection`]},{id:`http-framing`,name:`HTTP Serialization & Framing`,subtitle:`Message Serialization`,type:`gateway`,icon:`ti-file-code`,badge:`HTTP Framing`,protocol:`HTTP/1.1 vs HTTP/2`,details:[`HTTP/1.1: Formats plain-text Method, Path, CRLF-delimited headers, and body`,`HTTP/2: Encodes headers via HPACK compression; splits messages into binary frames`,`HTTP/3: Maps streams onto independent UDP datagrams via QUIC protocol`]},{id:`reverse-proxy-ingress`,name:`Reverse Proxy / API Gateway`,subtitle:`Nginx / Envoy Ingress`,type:`network`,icon:`ti-arrows-split`,badge:`Reverse Proxy`,protocol:`SSL Termination`,details:[`Terminates TLS connection; inspects Host header and URL path`,`Checks request headers (CORS Origin, Content-Type, Authorization)`,`Applies gzip/brotli decompression and forwards request to upstream application server`]},{id:`app-service-handler`,name:`Application Service Handler`,subtitle:`Node.js / Go / Spring Boot`,type:`server`,icon:`ti-cpu`,badge:`Controller Logic`,protocol:`REST / GraphQL`,details:[`Routes request to matched controller action; parses query parameters and JSON body`,`Executes business logic and queries database or Redis cache`,`Selects appropriate HTTP status code (200 OK, 201 Created, 400 Bad Request, 404 Not Found)`]},{id:`response-streamer`,name:`HTTP Response Streaming`,subtitle:`Chunked Transfer & Caching`,type:`database`,icon:`ti-arrow-back-up`,badge:`Response Headers`,protocol:`Content-Length / Chunked`,details:[`Generates response headers: Content-Type: application/json, Cache-Control: max-age=3600, ETag`,`Streams binary/text payload over socket; sets Connection: keep-alive to preserve socket for reuse`]}],connections:[{from:`client-transport`,to:`http-framing`,label:`1. Established Socket`,protocol:`TCP/TLS`},{from:`http-framing`,to:`reverse-proxy-ingress`,label:`2. Wire Transmission`,protocol:`HTTP Stream`},{from:`reverse-proxy-ingress`,to:`app-service-handler`,label:`3. Upstream Proxy Dispatch`,protocol:`Internal HTTP`},{from:`app-service-handler`,to:`response-streamer`,label:`4. Serialized Response Payload`,protocol:`JSON / Bytes`}],keyTakeaways:[`HTTP is inherently stateless: every request is completely independent. Session continuity is maintained via HTTP Cookies or Authorization Bearer tokens.`,`Head-of-Line Blocking: In HTTP/1.1, a slow response on a socket blocks all subsequent requests on that socket. HTTP/2 solves this with multiplexed binary frames over a single TCP socket.`,`Idempotency: GET, PUT, and DELETE are idempotent (calling them 10 times yields the exact same server state). POST is NOT idempotent (calling it 10 times creates 10 records).`],rawSpec:`Client (Browser/App)           Server
       \u2502                              \u2502
       \u2502  TCP Connect (port 443)      \u2502
       \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502
       \u2502 <\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502 SYN-ACK
       \u2502                              \u2502
       \u2502  TLS Handshake               \u2502
       \u2502 \u25C4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502 (encrypted channel)
       \u2502                              \u2502
       \u2502  GET /api/data HTTP/2        \u2502
       \u2502  Authorization: Bearer ...   \u2502
       \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502
       \u2502                              \u2502 Process request
       \u2502                              \u2502 Query DB
       \u2502  HTTP/2 200 OK               \u2502
       \u2502  Content-Type: app/json      \u2502
       \u2502  {"data": [...]}             \u2502
       \u2502 <\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502
       \u2502                              \u2502
       \u2502 (connection kept ALIVE)      \u2502
       \u2502                              \u2502
       \u2502  GET /api/user HTTP/2        \u2502 (no new connection needed!)
       \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`HTTP Caching in Depth`},{type:`bullets`,items:[`Cache-Control: max-age=3600 → browser caches for 1 hour, no server contact needed.`,`ETag: Hash of the resource content. Browser sends If-None-Match: "etag" with next request. If unchanged, server sends 304 Not Modified (no body, very fast).`,`Last-Modified + If-Modified-Since: Same pattern but using timestamps instead of hashes.`,`no-cache: Always validate with server before using cached version.`,`no-store: Do not cache at all. For sensitive data like banking pages.`]},{type:`flow`,title:`Browser cache decision`,code:`flowchart TD
  N([Need /app.js]):::client --> C{"In cache?"}:::cache
  C -->|"no"| FULL["Full GET<br/>200 + body, store it"]:::server
  C -->|"yes"| FR{"Still fresh?<br/>within max-age"}
  FR -->|"yes"| USE["Use cache<br/>no network at all"]:::highlight
  FR -->|"no, stale"| V["Ask server:<br/>If-None-Match etag"]:::network
  V --> CH{"Changed?"}
  CH -->|"no"| NM["304 Not Modified<br/>reuse cached copy"]:::highlight
  CH -->|"yes"| FULL`,text:`max-age avoids the request entirely. ETag turns a full download into a tiny "still the same?" check.`},{type:`heading2`,text:`Cookies — How State is Maintained`},{type:`paragraph`,text:`HTTP is stateless, but websites need to know who you are across requests. Cookies solve this. The server sets a cookie in its response (Set-Cookie: sessionId=abc123). The browser stores it and automatically sends it back on every future request to the same domain (Cookie: sessionId=abc123), so the server can look up who you are. Security flags: HttpOnly (JavaScript cannot read it, so an injected script — an XSS attack — cannot steal it), Secure (only sent over HTTPS), SameSite (not sent on requests triggered by other sites, which blocks CSRF — tricking your browser into making requests you did not intend).`},{type:`flow`,title:`How a cookie keeps you logged in`,code:`sequenceDiagram
  participant B as Browser
  participant S as Server
  participant ST as Session store
  B->>S: POST /login (username, password)
  S->>ST: Save session abc123 for user 42
  S-->>B: 200 + Set-Cookie sessionId=abc123
  Note over B: Browser stores the cookie
  B->>S: GET /orders + Cookie sessionId=abc123
  S->>ST: Who is abc123?
  ST-->>S: user 42
  S-->>B: 200 + orders for user 42`,text:`The server still has no memory of the connection — the cookie carries the identity on every single request.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "POST is more secure than GET." Reality: Both are equally insecure over HTTP, equally secure over HTTPS. The difference is GET puts data in the URL (visible in logs), POST puts it in the body (also visible in logs).`,`Myth: "404 means the page is broken." Reality: 404 means the resource was not found — which is a valid, expected response. The page is working correctly by telling you what you asked for does not exist.`,`Myth: "HTTP/2 replaces the need for CDN." Reality: HTTP/2 improves performance within a single connection. CDN reduces latency by physically moving content closer. Both are needed.`,`Myth: "200 OK means the operation succeeded." Reality: The server could return 200 with an error message in the body. Always design APIs to use correct status codes.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`REST API Design: HTTP methods and status codes are the grammar of REST. GET=read, POST=create, PUT/PATCH=update, DELETE=delete.`,`Load Balancer Layer 7: HTTP-aware load balancers can route based on URL path, headers, cookies. "Send /api/payments to payment service, /api/users to user service."`,`API Gateway: Inspects HTTP requests — validates auth tokens, rate limits, transforms requests, routes to backend services.`,`Caching Strategy: Cache-Control and ETag headers are the mechanism for CDN and browser caching. Understanding them is essential for cache invalidation design.`,`GraphQL vs REST: Both use HTTP. GraphQL uses POST for all queries. REST uses GET for reads (better caching) and POST/PUT/DELETE for writes.`]}]}]},{id:`how-https-works`,title:`How HTTPS Works`,emoji:`🔐`,icon:`ti-lock`,color:`#ec4899`,bg:`#fce7f3`,accentGlow:`rgba(236,72,153,0.15)`,difficulty:`Foundational`,tagline:`TLS handshake, certificates, public/private keys — how a secure channel is established in milliseconds.`,tags:[`TLS Handshake`,`SSL Certificates`,`Public Key`,`CA Chain`,`Encryption`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`HTTPS = HTTP + TLS`},{type:`paragraph`,text:`HTTPS (HTTP Secure) is plain HTTP with an extra encryption layer called TLS (Transport Layer Security). Everything HTTP sends — requests, responses, cookies, passwords — is scrambled before it leaves your device. Anyone watching the traffic in between (your ISP, a hacker on the same WiFi, a government) sees only meaningless gibberish, not your actual data.`},{type:`callout`,variant:`info`,text:`In simple terms: HTTP is like sending a postcard — every postal worker can read it. HTTPS is like sending a locked box. First you check the ID of the person you are sending to (the certificate), then the two of you agree on a secret key that only you both know, and from then on every message travels inside the locked box.`},{type:`flow`,title:`The big picture — postcard vs locked box`,code:`flowchart LR
  subgraph PLAIN["HTTP (plain text)"]
    B1([Browser]):::client -->|"password=hunter2"| W1{{Public WiFi}}:::network -->|"password=hunter2"| S1[Server]:::server
    W1 -.->|"readable!"| H1[Eavesdropper]:::external
  end
  subgraph SECURE["HTTPS (HTTP + TLS)"]
    B2([Browser]):::client -->|"x8Kf91q... encrypted"| W2{{Public WiFi}}:::network -->|"encrypted"| S2[Server]:::server
    W2 -.->|"gibberish"| H2[Eavesdropper]:::external
  end`,text:`Same network, same eavesdropper. With HTTPS the attacker still sees traffic flowing, but cannot read or change it.`},{type:`heading2`,text:`What TLS Provides`},{type:`bullets`,items:[`Encryption: Data is encrypted between client and server. Eavesdroppers cannot read it.`,`Authentication: The certificate proves the server is who it claims to be. You are actually talking to google.com, not an impersonator.`,`Integrity: Data cannot be changed on the way without the change being detected. This defeats man-in-the-middle (MITM) attacks, where an attacker secretly sits between you and the server and tampers with messages.`]}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Plain HTTP is completely readable to anyone between you and the server. On public WiFi, anyone running a packet sniffer (a free tool that records all network traffic nearby) can see your passwords, cookies, and personal data. HTTPS prevents this by encrypting everything. HTTPS is also required for modern browser features (service workers, geolocation, push notifications), and Google ranks HTTPS sites higher in search results.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Symmetric vs. Asymmetric Encryption`},{type:`bullets`,items:[`Symmetric encryption: Same key for encrypting and decrypting. Fast (AES-256). Problem: how do you safely share the key with the server? You cannot send it unencrypted.`,`Asymmetric encryption (Public-Key Cryptography): Two mathematically related keys — a public key and a private key. Anything encrypted with the public key can only be decrypted by the private key (and vice versa). The public key is shared openly. The private key is kept secret by the server.`,`TLS uses both: the slow asymmetric kind only at the start, to safely agree on a shared symmetric key — then the fast symmetric kind for all the actual data.`]},{type:`flow`,title:`Hybrid encryption — slow to set up, fast to use`,code:`flowchart TB
  A["Asymmetric crypto<br/>public + private keys<br/>(slow, used once)"]:::security --> K["Shared session key<br/>known only to browser and server"]:::highlight
  K --> S["Symmetric crypto AES<br/>one key encrypts and decrypts<br/>(fast, used for every byte)"]:::security
  S --> D["Encrypted HTTP traffic<br/>pages, cookies, API calls"]:::network`,text:`Asymmetric encryption solves the "how do we share a key safely?" problem. Symmetric encryption then does the heavy lifting because it is far faster.`},{type:`heading2`,text:`SSL Certificates`},{type:`paragraph`,text:`An SSL/TLS certificate is like a digital ID card for a website. It contains: the domain name it is valid for, the server's public key, who issued it (the Certificate Authority), and a digital signature from that issuer. It proves "this public key really belongs to google.com." Without certificates, anyone could claim to be google.com.`},{type:`heading2`,text:`Certificate Authorities (CAs)`},{type:`paragraph`,text:`A Certificate Authority (CA) is a trusted organization that vouches for certificates — like a passport office vouching for passports. CAs such as DigiCert, Let's Encrypt, and Comodo sign certificates. Your browser and operating system ship with a built-in list of trusted root CAs. When a site presents a certificate, the browser checks the CA's signature on it. If the CA is on the trusted list and the signature is valid, the certificate is trusted.`},{type:`flow`,title:`Can the browser trust this certificate?`,code:`flowchart TD
  C["Server sends certificate"]:::server --> Q1{"Signed by a CA<br/>the browser trusts?"}
  Q1 -->|No| E["Show security warning<br/>Your connection is not private"]:::external
  Q1 -->|Yes| Q2{"Domain matches<br/>and not expired?"}
  Q2 -->|No| E
  Q2 -->|Yes| OK["Trusted - continue handshake"]:::highlight`,text:`Every check must pass. A single failure and the browser shows the full-page warning instead of the site.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`TLS 1.3 Handshake (Simplified)`},{type:`numbered`,items:[`Client Hello: The browser says hello and lists what it supports — TLS versions and cipher suites (the encryption algorithms it can use) — plus a random number (client_random) and its half of the key exchange (a temporary "key share").`,`Server Hello: The server picks the TLS version and cipher suite, and replies with its own random number (server_random), its own key share, and its certificate (which contains the server's public key).`,`Certificate Verification: The browser checks the certificate: Is it signed by a trusted CA? Is it expired? Does the domain match? If any check fails → SSL error page.`,`Key Exchange: Client and server combine the two key shares using ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) — a bit of math that lets two parties arrive at the same secret without ever sending it. The server also signs the handshake with its certificate's private key, proving it really owns that certificate.`,`Session Key Derived: Both sides now independently compute the same symmetric session key from client_random + server_random + the ECDHE shared secret.`,`Server Finished: The server sends a "Finished" message encrypted with the new key, confirming nothing was tampered with during the handshake.`,`Client Finished: The browser sends its own encrypted "Finished" message. Handshake complete.`,`Encrypted Communication: All further HTTP traffic is encrypted with the symmetric session key (e.g. AES-256-GCM). This is very fast.`]},{type:`flow`,title:`TLS 1.3 handshake — one round trip`,code:`sequenceDiagram
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
  S->>B: 200 OK (encrypted)`,text:`Notice that only one round trip (there and back) happens before real data can flow. The session key itself never crosses the network.`},{type:`callout`,variant:`info`,text:`TLS 1.3 (2018) completes the handshake in 1 round-trip (1-RTT). Previous TLS 1.2 required 2 round-trips. For repeated connections, TLS 1.3 supports 0-RTT resumption — sending data before the handshake completes.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Certificate Chain of Trust`},{type:`code`,lang:`text`,code:`Root CA (DigiCert) \u2014 pre-installed in your browser/OS
   \u2502 Signs \u2193
Intermediate CA (DigiCert SHA2 High Assurance Server CA)
   \u2502 Signs \u2193
Leaf Certificate (*.github.com, valid until 2025-06-01)
   Contains: Public Key, Domain, Issuer, Signature

Browser verification:
1. Check leaf cert is signed by intermediate CA \u2713
2. Check intermediate CA is signed by root CA \u2713
3. Check root CA is in browser's trusted CA list \u2713
4. Check domain matches (github.com) \u2713
5. Check expiry date \u2713
\u2192 Certificate TRUSTED`},{type:`flow`,title:`Chain of trust — each level vouches for the next`,code:`flowchart TB
  R["Root CA - DigiCert<br/>pre-installed in browser/OS"]:::security -->|"signs"| I["Intermediate CA<br/>DigiCert High Assurance"]:::security
  I -->|"signs"| L["Leaf certificate<br/>*.github.com + public key"]:::server
  L -->|"presented to"| B([Browser]):::client
  B -.->|"walks back up the chain<br/>to a root it already trusts"| R`,text:`The browser does not need to know github.com in advance. It only needs to trust the root at the top of the chain.`},{type:`heading2`,text:`HSTS — HTTP Strict Transport Security`},{type:`paragraph`,text:`HSTS is a response header (Strict-Transport-Security: max-age=31536000) that tells browsers: "Always use HTTPS for this domain for the next year. Never fall back to HTTP." Once the browser has seen it, it refuses to connect over plain HTTP. This blocks downgrade attacks, where an attacker tricks your browser into using unencrypted HTTP. Browsers also ship with a pre-loaded HSTS list for major domains, so those are HTTPS-only even on your very first visit.`},{type:`flow`,title:`HSTS — the browser upgrades HTTP by itself`,code:`flowchart TD
  U["User types http://bank.com"]:::client --> Q{"Has the browser seen<br/>an HSTS header for bank.com?"}
  Q -->|"Yes, or on preload list"| UP["Browser switches to https://<br/>before sending anything"]:::security
  Q -->|"No - first visit"| H["Request goes out over HTTP<br/>attacker could intercept"]:::external
  H --> R["Server redirects to HTTPS<br/>and sends HSTS header"]:::server
  R --> UP
  UP --> S["Secure connection"]:::highlight`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`What If You Are on a Public WiFi?`},{type:`paragraph`,text:`Without HTTPS: A coffee shop hacker captures your packets. They see your Gmail password in plaintext. Game over.`},{type:`paragraph`,text:`With HTTPS: A coffee shop hacker captures your packets. They see: "TLS 1.3 encrypted data, destination: accounts.google.com." They cannot decrypt it without the session key. They cannot impersonate google.com because they do not have Google's private key to sign a valid certificate. HTTPS makes your session secure even on hostile networks.`},{type:`flow`,title:`Why a fake hotspot cannot impersonate Google`,code:`sequenceDiagram
  participant B as Your browser
  participant A as Attacker hotspot
  participant G as accounts.google.com
  B->>A: ClientHello for accounts.google.com
  A->>B: Fake certificate for google.com
  Note over B: Not signed by a trusted CA - or no matching private key
  B-->>B: Abort with security warning
  Note over A,G: Attacker can only relay encrypted bytes it cannot read`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`HTTPS at a glance`,code:`flowchart LR
  A([Browser]):::client -->|"1. ClientHello + key share"| B[Server]:::server
  B -->|"2. ServerHello + certificate"| C{"3. Certificate<br/>valid?"}:::security
  C -->|"yes"| D["4. Both derive the<br/>same session key"]:::highlight
  C -->|"no"| X["Warning page"]:::external
  D --> E["5. Encrypted HTTP<br/>with AES-GCM"]:::network`,text:`The step cards below walk through each stage in detail.`},{type:`diagram`,diagram:{id:`diagram-https-flow`,title:`TLS 1.3 Cryptographic Handshake & Hybrid Encryption Tunnel`,subtitle:`Asymmetric cryptography for 1-RTT key exchange + hardware-accelerated symmetric AES-GCM for bulk data`,nodes:[{id:`client-hello`,name:`ClientHello & Key Share`,subtitle:`Client Initiates Handshake`,type:`client`,icon:`ti-lock-open`,badge:`ClientHello (1-RTT)`,protocol:`TLS 1.3 / ECDHE`,details:[`Sends supported TLS version (TLS 1.3), cipher suites (e.g. TLS_AES_256_GCM_SHA384)`,`Generates ephemeral Elliptic-Curve key pair; sends public Key Share immediately`,`Includes SNI (Server Name Indication) so server knows which SSL certificate to present`]},{id:`server-hello-cert`,name:`ServerHello & Certificate`,subtitle:`Server Picks Cipher & Shares Key`,type:`gateway`,icon:`ti-certificate`,badge:`ServerHello`,protocol:`X.509 Certificate`,details:[`Selects agreed cipher suite and responds with server Ephemeral Key Share`,`Sends X.509 digital certificate containing server public key and CA cryptographic signature`,`Sends Finished HMAC verification hash`]},{id:`ca-chain-verifier`,name:`Certificate Authority (CA) Chain Validation`,subtitle:`Cryptographic Trust Verification`,type:`security`,icon:`ti-shield-check`,badge:`Chain of Trust`,protocol:`RSA/ECDSA Verify`,details:[`Client traverses certificate chain up to a pre-installed Root CA in OS/Browser trust store`,`Verifies digital signatures mathematically using CA public keys`,`Checks certificate expiration dates, domain name match (SAN), and revocation lists (OCSP)`]},{id:`key-derivation`,name:`Independent Shared Key Derivation`,subtitle:`ECDHE Mathematical Secret`,type:`server`,icon:`ti-key`,badge:`Shared Secret`,protocol:`HKDF / ECDHE`,details:[`Both client and server combine their own private key with the other party public key share`,`Via Diffie-Hellman mathematics, both compute the EXACT same master secret independently`,`The shared secret was NEVER transmitted across the wire, making passive sniffing impossible`]},{id:`encrypted-tunnel`,name:`Authenticated Symmetric Tunnel`,subtitle:`Wire-Speed Application Data`,type:`database`,icon:`ti-lock`,badge:`Encrypted Stream`,protocol:`AES-256-GCM`,details:[`All HTTP headers, URLs, cookies, and payloads are encrypted using symmetric AES-GCM-256`,`AEAD (Authenticated Encryption with Associated Data) guarantees privacy AND tamper detection`]}],connections:[{from:`client-hello`,to:`server-hello-cert`,label:`1. ClientHello + Ephemeral KeyShare`,protocol:`TLS 1.3`},{from:`server-hello-cert`,to:`ca-chain-verifier`,label:`2. ServerHello + Certificate + Finished`,protocol:`X.509`},{from:`ca-chain-verifier`,to:`key-derivation`,label:`3. Validated CA Signature`,protocol:`Trust OK`},{from:`key-derivation`,to:`encrypted-tunnel`,label:`4. Symmetric AES Key Derived (1-RTT)`,protocol:`AES-GCM`}],keyTakeaways:[`Hybrid Encryption: Asymmetric cryptography is slow and CPU-heavy, so it is ONLY used during the 1-RTT handshake. All actual data is encrypted with fast symmetric AES-GCM.`,`Perfect Forward Secrecy (PFS): Because Diffie-Hellman keys are ephemeral (discarded after the session), even if an attacker steals the server private key in the future, they cannot decrypt past recorded sessions.`,`What HTTPS Hides: HTTPS encrypts URL paths, query parameters, headers, cookies, and body. It only exposes destination IP and domain name (via SNI).`],rawSpec:`TLS 1.3 Handshake:

Client                              Server
  \u2502  ClientHello                      \u2502
  \u2502  (TLS 1.3, cipher suites,         \u2502
  \u2502   client_random, key_share)       \u2502
  \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502
  \u2502                                   \u2502
  \u2502  ServerHello (cipher chosen)      \u2502
  \u2502  Certificate (public key)         \u2502
  \u2502  server_random, key_share         \u2502
  \u2502 <\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502
  \u2502                                   \u2502
  \u2502  [Both derive session key]        \u2502
  \u2502                                   \u2502
  \u2502  Finished (encrypted)             \u2502
  \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502
  \u2502  Finished (encrypted)             \u2502
  \u2502 <\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502
  \u2502                                   \u2502
  \u2502 === SECURE TUNNEL ESTABLISHED === \u2502
  \u2502                                   \u2502
  \u2502  GET /api/user (ENCRYPTED)        \u2502
  \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500> \u2502
  \u2502  HTTP/2 200 OK (ENCRYPTED)        \u2502
  \u2502 <\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502

Total: 1 round trip (1-RTT) to establish encryption in TLS 1.3`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Perfect Forward Secrecy (PFS)`},{type:`paragraph`,text:`Older SSL/TLS often used RSA key exchange: the client encrypted the session key with the server's long-term public key and sent it. If an attacker recorded that traffic and, years later, stole the server's private key, they could decrypt every recorded session. ECDHE gives Perfect Forward Secrecy: each session uses brand-new temporary keys that are thrown away afterwards. Even if the server's private key leaks later, past sessions stay secret.`},{type:`flow`,title:`Stolen private key — old RSA vs ECDHE`,code:`flowchart TD
  T["Attacker records encrypted traffic today"]:::external --> L["Years later: server private key leaks"]:::external
  L --> Q{"Which key exchange<br/>was used?"}
  Q -->|"RSA key exchange"| R["Session key was sent encrypted<br/>with that key - recover it"]:::external
  R --> RX["All past sessions decrypted"]:::external
  Q -->|"ECDHE"| E["Session keys were temporary<br/>and already deleted"]:::security
  E --> EX["Past sessions stay secret"]:::highlight`},{type:`heading2`,text:`Let's Encrypt — Free Certificates`},{type:`paragraph`,text:`Let's Encrypt is a free, automated CA that has made HTTPS universal. Before 2015, certificates cost $50-$300/year. Let's Encrypt provides free certificates with 90-day validity (automatically renewed by tools like Certbot). Over 350 million domains use Let's Encrypt certificates. HTTPS adoption jumped from 30% to 90%+ of web traffic largely due to Let's Encrypt.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "HTTPS means the website is safe/legitimate." Reality: HTTPS only means the connection is encrypted. Phishing sites can and do use HTTPS. The certificate only proves the domain name matches — not that the site is trustworthy.`,`Myth: "SSL and TLS are different things." Reality: SSL is the old name (SSL 3.0). TLS is the successor (TLS 1.0, 1.1, 1.2, 1.3). SSL is technically deprecated. What people call "SSL certificates" are technically TLS certificates.`,`Myth: "HTTPS is significantly slower than HTTP." Reality: The TLS handshake adds ~100ms for the first connection. Subsequent requests on the same connection have near-zero overhead. Modern TLS 1.3 with 0-RTT resumption is extremely fast.`,`Myth: "HTTPS encrypts everything, including DNS." Reality: DNS lookups are still in plaintext (unless using DNS-over-HTTPS). An observer can see which domain you visited but not the specific URL or data.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`TLS Termination: In a production system, TLS is typically terminated at the load balancer or API gateway — not at each application server. Internal traffic (load balancer → app servers) often uses plain HTTP within a trusted private network.`,`Certificate Management at Scale: Thousands of servers need valid certificates. Solutions: AWS Certificate Manager (auto-renew), cert-manager (Kubernetes), Nginx with Let's Encrypt + Certbot.`,`mTLS (Mutual TLS): Both client AND server verify each other's certificates. Used for service-to-service authentication in microservices. Much stronger than just bearer tokens.`,`Certificate Pinning: Mobile apps can "pin" the server certificate — reject connections unless the certificate matches a specific expected certificate. Prevents MITM even with a compromised CA.`]},{type:`flow`,title:`TLS termination at the load balancer`,code:`flowchart LR
  U([Users]):::client -->|"HTTPS"| LB["Load balancer<br/>holds the certificate<br/>decrypts TLS"]:::security
  subgraph PRIV["Private network"]
    A1[App server 1]:::server
    A2[App server 2]:::server
  end
  LB -->|"plain HTTP or mTLS"| A1
  LB -->|"plain HTTP or mTLS"| A2`,text:`Decrypting once at the edge keeps certificates in one place and saves CPU on app servers. Zero-trust setups re-encrypt internal hops with mTLS.`}]}]},{id:`how-load-balancers-work`,title:`How Load Balancers Work`,emoji:`⚖️`,icon:`ti-scale`,color:`#06b6d4`,bg:`#cffafe`,accentGlow:`rgba(6,182,212,0.15)`,difficulty:`Foundational`,tagline:`The traffic cops of the Internet. Understand Layer 4 vs Layer 7, balancing algorithms, health checking, and zero-downtime failover.`,tags:[`Layer 4 vs Layer 7`,`Round Robin`,`Consistent Hashing`,`Health Checks`,`Failover`],estimatedTime:`35 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`One Public Door, Many Private Servers`},{type:`paragraph`,text:`A load balancer is the server that receives a client request first and chooses which application server should handle it. Clients see one website address, while the load balancer hides a pool of backend servers behind that address.`},{type:`paragraph`,text:`For example, a user visits shop.example.com. DNS points that name to the load balancer, not directly to App Server A, B, or C. The load balancer checks which servers are healthy, chooses one, forwards the request, and sends the response back to the user.`},{type:`heading2`,text:`Why Not Let DNS Choose a Server?`},{type:`paragraph`,text:`DNS can point users toward different servers, but it does not know which server is busy or broken between DNS updates. A load balancer makes that decision for each connection or request using live health and traffic information.`},{type:`callout`,variant:`info`,text:`In simple terms: picture a restaurant with one host and several tables. Customers speak to the host (the load balancer), not to a random waiter. The host sends each customer to an available table (a healthy backend server) and stops using a table if it is unavailable.`},{type:`flow`,title:`The big picture — one address, many servers`,code:`flowchart LR
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
  LB -.->|"skipped: failed health check"| C`,text:`Users only ever talk to the load balancer. It spreads requests across healthy servers and quietly skips broken ones.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-target`,blocks:[{type:`heading2`,text:`Four Critical Engineering Problems Solved`},{type:`numbered`,items:[`Horizontal Scalability: Instead of making one server bigger, add more smaller servers behind the load balancer. The load balancer gives new servers traffic after they pass their health check.`,`High Availability & Fault Tolerance: If some backend servers fail, the load balancer removes them from rotation and sends new traffic to the healthy ones. Existing requests may still fail, so the application must handle retries carefully.`,`Zero-Downtime Deployments (Rolling Updates): You can take servers out of the pool one by one, deploy new application code, verify they are healthy, and put them back in without ever taking down the website.`,`Security & Offloading: The load balancer can take over expensive side jobs — TLS (HTTPS) handshakes, rate limiting, and absorbing some network attacks — so backend servers keep more CPU for business logic.`]},{type:`flow`,title:`Rolling deploy with zero downtime`,code:`flowchart TD
  S1["Stop sending new traffic<br/>to Server 1"]:::network --> S2["Let in-flight requests finish<br/>(connection draining)"]:::network
  S2 --> S3["Deploy new code<br/>on Server 1"]:::server
  S3 --> Q{"Health check<br/>passes?"}
  Q -->|"yes"| S4["Add Server 1 back<br/>to the pool"]:::highlight
  Q -->|"no"| RB["Keep it out and roll back"]:::external
  S4 --> N["Repeat for Server 2, 3, ..."]:::server`,text:`At every moment, most servers are still serving users, so the site never goes offline.`}]},{id:`how-it-works`,title:`How Does It Work?`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`First Choose What the Balancer Can See`},{type:`paragraph`,text:`The important difference between L4 and L7 is what information the load balancer can read. "Layer 4" and "Layer 7" come from the OSI networking model: L4 is the transport layer (TCP/UDP connections), L7 is the application layer (HTTP). L4 can see the connection, like seeing an envelope's address. L7 can open the envelope and read the HTTP request inside.`},{type:`bullets`,items:[`Layer 4 (L4): Sees source/destination IPs, ports, and TCP/UDP connections. It cannot read /checkout versus /search because it does not inspect HTTP. It is fast and works for HTTP, WebSockets, databases, and other TCP/UDP protocols.`,`Layer 7 (L7): Understands HTTP method, host, path, headers, and cookies. It can send /api/video to video servers and /api/checkout to payment servers. It uses more CPU because it terminates and processes the application connection.`]},{type:`callout`,variant:`tip`,text:`Simple rule: choose L4 when you mainly need fast connection forwarding; choose L7 when routing depends on HTTP details. Many large systems use both: L4 spreads connections across L7 proxies, then L7 routes requests to services.`},{type:`flow`,title:`L4 vs L7 — what each layer can see`,code:`flowchart TB
  C([Client request<br/>POST /api/checkout]):::client --> L4["L4 balancer<br/>sees only IP + port + TCP<br/>203.0.113.7 to :443"]:::network
  L4 -->|"forwards whole connection"| L7["L7 balancer<br/>decrypts TLS, reads HTTP<br/>method, path, headers, cookies"]:::network
  L7 -->|"/api/checkout"| P[Payment servers]:::server
  L7 -->|"/api/video"| V[Video servers]:::server
  L7 -->|"/api/search"| S[Search servers]:::server`,text:`L4 is a fast mail sorter that only reads the envelope. L7 opens the letter and routes by what is written inside.`},{type:`heading2`,text:`Core Balancing Algorithms`},{type:`bullets`,items:[`Round Robin: Sends requests sequentially down the list of servers (Server 1 → Server 2 → Server 3 → Server 1). Best when all requests take roughly equal processing time.`,`Weighted Round Robin: Assigns higher weights to more powerful servers (e.g. Server A gets 3 requests for every 1 request Server B gets).`,`Least Connections: Routes traffic to whichever server currently has the fewest active open connections. Superior when request durations vary widely (e.g. video streaming vs quick database lookups).`,`IP Hash / Consistent Hashing: Runs the client IP address or user ID through a hash function (a formula that always turns the same input into the same number), so the same user always lands on the same server. Useful when a server keeps per-user data in memory, such as session caches or gaming lobbies.`]},{type:`flow`,title:`Which algorithm should I pick?`,code:`flowchart TD
  Q1{"Must the same user always<br/>reach the same server?"} -->|"yes"| H["IP Hash /<br/>Consistent Hashing"]:::highlight
  Q1 -->|"no"| Q2{"Do request durations<br/>vary a lot?"}
  Q2 -->|"yes - e.g. streaming vs quick lookups"| LC["Least Connections"]:::highlight
  Q2 -->|"no"| Q3{"Are servers different sizes?"}
  Q3 -->|"yes"| W["Weighted Round Robin"]:::highlight
  Q3 -->|"no"| RR["Round Robin"]:::highlight`}]},{id:`step-by-step`,title:`What Happens Step by Step?`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`The Lifecycle of a Balanced Request`},{type:`numbered`,items:[`Address lookup: The browser resolves shop.example.com to the load balancer public IP, not to a backend server.`,`Connection: The browser opens a TCP connection to the load balancer. With HTTPS, an L7 balancer may also complete the TLS handshake.`,`Health filter: The balancer keeps only servers that recently passed a health check such as GET /healthz.`,`Server choice: It applies an algorithm such as round robin or least connections to choose one healthy server.`,`Forwarding: It sends the request to that server over the private network, for example 10.0.1.25:8080.`,`Response: The backend creates the response. The load balancer returns it to the browser, so the browser never needs to know the backend server's private address.`]},{type:`flow`,title:`Lifecycle of a balanced request`,code:`sequenceDiagram
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
  LB-->>B: 200 OK + HTML`,text:`The browser only ever learns the load balancer's address. Backend servers stay hidden on the private network.`}]},{id:`components-involved`,title:`Components Involved`,icon:`ti-components`,blocks:[{type:`bullets`,items:[`Virtual IP (VIP): The single public IP address users connect to. It is published via DNS, or via Anycast BGP (a routing trick where many machines in different places share the same IP).`,`Server Pool / Target Group: The current list of backend servers registered to receive traffic. Servers join and leave this list as they scale up, fail, or are deployed.`,`Health Checking Engine: A background process that keeps poking each backend (e.g. GET /healthz every 5 seconds) and marks it healthy or unhealthy.`,`Session Persistence (Sticky Sessions): Logic that uses a cookie or a hash of the user to keep sending the same user to the same backend server.`,`SSL Termination Module: The part (software, sometimes with dedicated crypto hardware) that performs the TLS handshake and decrypts HTTPS, then forwards plain HTTP to backends over the private network.`]},{type:`flow`,title:`Inside a load balancer`,code:`flowchart LR
  U([Clients]):::client -->|"HTTPS"| VIP["Virtual IP<br/>104.16.20.1"]:::network
  subgraph LB["Load balancer"]
    VIP --> TLS["SSL termination"]:::security
    TLS --> STICKY["Sticky session check"]:::network
    STICKY --> ALG["Balancing algorithm"]:::network
    HC["Health checker"]:::security -.->|"healthy list"| ALG
  end
  ALG -->|"plain HTTP"| POOL["Target group<br/>App servers"]:::server
  HC -.->|"GET /healthz every 5s"| POOL`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-world-pin`,blocks:[{type:`heading2`,text:`The Concert Ticket Drop That Didn't Crash`},{type:`paragraph`,text:`At 10:00:00 AM, tickets for a sold-out tour go on sale. In the first 3 seconds, 400,000 people hit "Buy Now" at once \u2014 roughly 500x the site's normal traffic. Here is what happens between the click and the checkout page.`},{type:`numbered`,items:[`The 400,000 connections all land on one Virtual IP. An L4 load balancer accepts them at wire speed, without looking at what anyone is trying to buy, and spreads the raw TCP connections across a fleet of 20 L7 proxies. This step never needs to inspect HTTP, so it never becomes the bottleneck.`,`Each L7 proxy terminates TLS and reads the actual request. It sees paths like /queue, /seat-map, and /checkout, and routes each to a different backend pool — so someone checking the queue position doesn't compete with someone finalizing a payment.`,`The checkout pool, doing the heaviest work (payment processing, inventory locks), starts slowing down. The health checker notices two consecutive failed pings to Checkout-Server-14 and pulls it out of rotation before it can return errors to real users.`,`Auto-scaling sees checkout-pool CPU above 70% and launches 30 new servers. As each one passes its health check, the load balancer folds it into the pool — traffic ramps up gradually (slow-start) so the new servers aren't instantly flooded before their caches warm up.`,`A deploy was scheduled for this exact moment (bad timing, but it happens). The load balancer drains connections from the servers being replaced instead of killing them mid-request, so no one's in-progress payment gets severed.`,`Traffic stabilizes within a couple of minutes. Because the checkout pool used Least Connections instead of Round Robin, servers stuck on slow payment retries never got stacked with new requests on top — unlike Round Robin, which would have kept feeding them more work regardless of how backed up they already were.`]},{type:`callout`,variant:`info`,text:`Notice what the user never sees: which of the 50 backend servers handled their request, which ones failed, or that 30 new servers spun up mid-purchase. That invisibility is the entire point of a load balancer — the failure and the scaling happen, and the checkout page just works.`},{type:`flow`,title:`Ticket drop — two-tier balancing`,code:`flowchart TB
  U(["400,000 buyers"]):::client --> L4["L4 balancer<br/>spreads raw TCP connections"]:::network
  L4 --> P["20 L7 proxies<br/>terminate TLS, read the path"]:::network
  P -->|"/queue"| Q[Queue pool]:::server
  P -->|"/seat-map"| SM[Seat-map pool]:::server
  P -->|"/checkout - least connections"| CO[Checkout pool]:::server
  HC["Health checker"]:::security -.->|"removes Checkout-14"| CO
  AS["Auto-scaling<br/>+30 servers, slow-start"]:::highlight -.-> CO`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`Load balancing at a glance`,code:`flowchart LR
  C([Clients]):::client -->|"1. VIP traffic"| L4["L4 balancer"]:::network
  L4 -->|"2. spread connections"| L7["L7 proxy"]:::network
  L7 -->|"3. ask for healthy nodes"| HC["Health checker"]:::security
  L7 -->|"4. forward to least-loaded"| B["Backend fleet"]:::server`,text:`The step cards below expand each hop.`},{type:`diagram`,diagram:{id:`diagram-load-balancer-flow`,title:`Distributed Layer 4 & Layer 7 Load Balancing Architecture`,subtitle:`From public Anycast Virtual IP through L4 packet forwarding, L7 content routing, to healthy backend pools`,nodes:[{id:`client-traffic`,name:`Incoming Client Traffic`,subtitle:`400,000 Concurrent Ticket-Purchase Requests`,type:`client`,icon:`ti-users`,badge:`Client Pool`,protocol:`HTTPS :443 / TCP`,details:[`Clients resolve domain to single Virtual IP (VIP: 104.16.20.1)`,`Send parallel HTTPS requests with diverse paths (/queue, /seat-map, /checkout)`]},{id:`l4-network-lb`,name:`Layer 4 Load Balancer (NLB / IPVS)`,subtitle:`Stateless Wire-Speed Packet Dispatcher`,type:`network`,icon:`ti-arrows-split-2`,badge:`L4 Balancer`,protocol:`eBPF / Maglev Hashing`,details:[`Operates at transport layer (TCP/UDP); routes packets in < 1ms`,`Uses 5-tuple hash (Src IP, Src Port, Dst IP, Dst Port, Protocol)`,`Distributes millions of packets across Layer 7 proxy fleet without decrypting payload`]},{id:`l7-application-lb`,name:`Layer 7 Application Proxy (Envoy / Nginx)`,subtitle:`Content-Aware HTTP Router & TLS Terminator`,type:`gateway`,icon:`ti-shield-lock`,badge:`L7 Balancer`,protocol:`TLS 1.3 / HTTP/2`,details:[`Terminates TLS encryption; inspects HTTP method, path, headers, and cookies`,`Applies Least Connections algorithm across active backend nodes`,`Enforces path routing: /checkout → Payments Pool, /seat-map → Inventory Pool`]},{id:`health-checker`,name:`Health Checking Controller`,subtitle:`Active Probe Daemon & Registry`,type:`security`,icon:`ti-heartbeat`,badge:`Health Daemon`,protocol:`GET /healthz`,details:[`Sends active HTTP ping every 5 seconds to each backend server`,`Requires 2 consecutive failures to mark node UNHEALTHY`,`Requires 3 consecutive successes to restore node to active pool (hysteresis)`]},{id:`backend-fleet`,name:`Healthy Backend Application Fleet`,subtitle:`Stateless Node.js / Go / Java Microservices`,type:`server`,icon:`ti-server`,badge:`Server Pool`,protocol:`Private IP :8080`,details:[`Processes application business logic within bounded CPU and RAM limits`,`Gracefully drains active connections during rolling deployments before shutdown`]}],connections:[{from:`client-traffic`,to:`l4-network-lb`,label:`1. Virtual IP Traffic`,protocol:`Anycast TCP`},{from:`l4-network-lb`,to:`l7-application-lb`,label:`2. Wire-speed L4 Distribution`,protocol:`Line Rate`},{from:`l7-application-lb`,to:`health-checker`,label:`3. Filter Unhealthy Nodes`,protocol:`Registry Query`},{from:`l7-application-lb`,to:`backend-fleet`,label:`4. Forward to Least-Loaded Server`,protocol:`Internal HTTP`}],keyTakeaways:[`L4 vs L7 Choice: Use L4 (NLB) for extreme throughput, gaming protocols, or non-HTTP traffic. Use L7 (ALB) for URL path routing, SSL offloading, and sticky sessions.`,`Health Check Flapping: Always use hysteresis thresholds (e.g. 3 successes, 2 failures). Without this, a server hovering at 99% CPU will oscillate between healthy and dead every 5 seconds, causing routing instability.`,`Connection Draining: When removing a server from a pool, do NOT terminate it immediately. Stop sending NEW requests, allow existing connections up to 300 seconds to complete gracefully, then shut down.`],rawSpec:`CLIENTS (Ticket Buyers, 400,000 concurrent)
   \u2502
   \u25BC
[ Anycast DNS / VIP: 104.16.20.1 ]
   \u2502
   \u25BC Layer 4 Load Balancer (NLB / eBPF)
   \u2502 (Fast 5-tuple hash, no SSL decryption, > 1M RPS)
   \u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
   \u25BC                               \u25BC                               \u25BC
[ L7 Proxy 1: Envoy ]       [ L7 Proxy 2: Envoy ]       [ L7 Proxy 3: Envoy ]
 (SSL termination, URL routing, cookie inspection, least-connections)
   \u2502                               \u2502                               \u2502
   \u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
   \u25BC               \u25BC                               \u25BC               \u25BC
[ Queue Pool ]  [ Seat-Map Pool ]              [ Checkout-14 ]  [ Checkout-15 ]
 (Healthy \u2713)     (Healthy \u2713)                     (UNHEALTHY \u2717)   (Healthy \u2713)
                                                 [Skipped by LB]`}}]},{id:`behind-the-scenes`,title:`What Happens Behind the Scenes?`,icon:`ti-search`,blocks:[{type:`heading2`,text:`Direct Server Return (DSR) & Graceful Draining`},{type:`bullets`,items:[`Direct Server Return (DSR): In typical web traffic, incoming requests are tiny (~1 KB), but outgoing video/HTML responses are huge (~1 MB). In a DSR setup, request packets pass through the load balancer, but the backend servers send the response directly back to the client. This can dramatically increase load balancer throughput since it never has to carry the heavy return traffic.`,`Connection Draining / Deregistration Delay: When you take a server out of service (e.g. for a deployment), the load balancer stops giving it new requests but lets requests already in progress finish within a grace window (e.g. 60–300s). Users downloading files never get cut off.`,`Active vs. Passive Health Checks: Active checks poll /healthz proactively every N seconds. Passive checks watch real user traffic: if a server returns three 502 Bad Gateway errors in a row, it is removed from the pool immediately, without waiting for the next scheduled probe.`]},{type:`flow`,title:`Direct Server Return — big responses skip the balancer`,code:`flowchart LR
  C([Client]):::client -->|"small request ~1 KB"| LB["Load balancer"]:::network
  LB -->|"forward request"| S["Backend server"]:::server
  S -->|"large response ~1 MB<br/>sent directly"| C`},{type:`flow`,title:`Health checks — when is a server pulled out?`,code:`flowchart TD
  P["Probe GET /healthz every 5s<br/>+ watch real responses"]:::security --> Q{"2 failed probes in a row<br/>or 3 straight 502s?"}
  Q -->|"no"| H["Stays in pool"]:::server
  Q -->|"yes"| U["Marked unhealthy<br/>no new traffic"]:::external
  U --> R{"3 successful probes<br/>in a row?"}
  R -->|"yes"| SS["Back in pool with slow-start"]:::highlight
  R -->|"no"| U`,text:`Requiring several failures to remove and several successes to restore (hysteresis) stops a borderline server from flapping in and out every few seconds.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-circle`,blocks:[{type:`heading2`,text:`Top 3 Fallacies About Load Balancers`},{type:`bullets`,items:[`Misconception 1: "Load balancers never fail." Reality: Load balancers are servers too! If you only have one, it is a single point of failure (SPOF) — if it dies, the whole site is down. Production setups run Active-Passive pairs (a standby takes over the shared IP via VRRP / Keepalived), or spread the load across many balancers using Anycast BGP.`,`Misconception 2: "Round Robin is always the best algorithm." Reality: Round Robin works poorly when request processing time is uneven. If Server A gets 3 complex reporting queries (10s each) and Server B gets 3 health-checks (2ms each), Round Robin continues overloading Server A. Least Connections prevents this bottleneck.`,`Misconception 3: "Sticky sessions (session affinity) are a best practice." Reality: Sticky sessions defeat the core purpose of load balancing. If one user runs an expensive query or has high traffic, their assigned server gets crushed while others sit idle. The modern best practice is stateless backends with shared Redis session storage.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`In System Design Interviews: Always place load balancers between: (1) Clients and Web Servers, (2) Web Servers and Internal Microservices, and (3) Application Servers and Read-Replica Databases.`,`Global Server Load Balancing (GSLB): For multi-region architectures (US, Europe, Asia), use GeoDNS or Anycast to send each user to the nearest region, where a regional load balancer then picks a server.`,`Preventing Thundering Herd: When a crashed service comes back online, routing 100,000 waiting requests instantly will crash it again. Advanced load balancers use slow-start (ramping traffic up over 60 seconds) to warm caches gracefully.`]},{type:`callout`,variant:`tip`,text:`In interviews, specify whether your load balancer is L4 (NLB) or L7 (ALB). Choosing L4 for high-throughput streaming/WebSockets and L7 for REST API routing demonstrates senior-level architectural maturity.`},{type:`flow`,title:`Where load balancers sit in a typical design`,code:`flowchart TB
  U([Users worldwide]):::client --> G["GeoDNS / Anycast<br/>pick nearest region"]:::network
  G --> LB1["Regional load balancer"]:::network
  LB1 --> W1[Web server]:::server
  LB1 --> W2[Web server]:::server
  W1 --> LB2["Internal load balancer"]:::network
  W2 --> LB2
  LB2 --> M1[Microservice]:::server
  LB2 --> M2[Microservice]:::server
  M1 --> R[(Read replicas)]:::db
  M2 --> R`}]}]},{id:`how-website-is-served`,title:`How a Website is Served`,emoji:`🖥️`,icon:`ti-server`,color:`#f97316`,bg:`#ffedd5`,accentGlow:`rgba(249,115,22,0.15)`,difficulty:`Beginner`,tagline:`From browser to web server to app to database and back — the complete journey of a web request.`,tags:[`Web Server`,`Nginx`,`CDN`,`Static vs Dynamic`,`Origin Server`],estimatedTime:`35 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`When you visit a website, dozens of components work together in milliseconds to deliver a response. Your browser's request travels across the Internet to a web server. That server may run code, query a database, or call other APIs to build the response, which then travels back to you. Understanding this end-to-end journey is the foundation of web development and backend engineering.`},{type:`callout`,variant:`info`,text:`In simple terms: think of a restaurant. The CDN is a takeaway counter near your home stocked with ready-made items (static files). If what you want is not there, your order goes to the restaurant: the host at the door (Nginx / reverse proxy) passes it to the kitchen (application server), which fetches ingredients from the pantry (database) and cooks your dish (the page) to order.`},{type:`flow`,title:`The big picture — a request's round trip`,code:`flowchart LR
  B([Browser]):::client -->|"HTTPS request"| CDN["CDN edge<br/>near the user"]:::cache
  CDN -->|"not cached"| NG["Nginx<br/>web server / reverse proxy"]:::network
  NG --> APP["App server<br/>Node.js / Django"]:::server
  APP --> DB[(Database)]:::db
  APP --> R[(Redis cache)]:::cache
  APP -.->|"HTML or JSON"| NG
  NG -.-> CDN
  CDN -.->|"response"| B`,text:`Solid arrows are the request going in, dotted arrows are the response coming back. Many requests never get past the CDN at all.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Static vs. Dynamic Content`},{type:`bullets`,items:[`Static content: Files that do not change — HTML, CSS, JS, images. The same file is served to every user. Can be cached aggressively. Served directly from a CDN or web server.`,`Dynamic content: Generated on-demand for each request — user's profile page, a search result, personalized content. Requires an application server to compute the response using data from a database.`,`Modern websites use both: static assets (CSS, JS, images) served from CDN; dynamic data served from API servers.`]},{type:`flow`,title:`Static or dynamic — where is it served from?`,code:`flowchart TD
  R["Incoming request"]:::client --> Q{"Is it the same file<br/>for every user?"}
  Q -->|"Yes: CSS, JS, images"| S["Static: serve the file<br/>from CDN or Nginx"]:::cache
  Q -->|"No: profile, feed, search"| D["Dynamic: app server<br/>runs code"]:::server
  D --> DB[(Database)]:::db
  DB --> P["Personalised response<br/>built for this user"]:::highlight`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Web Server vs. Application Server`},{type:`bullets`,items:[`Web Server (Nginx, Apache): Handles HTTP connections, serves static files, terminates TLS (decrypts HTTPS), and acts as a reverse proxy. Extremely efficient at I/O (reading and writing network data and files) — it can juggle thousands of simultaneous connections.`,`Application Server (Node.js, Django, Spring Boot): Runs your business logic code. Handles dynamic requests, executes code, queries databases, calls APIs.`,`Common pattern: Nginx (web server) → Node.js/Django (app server). Nginx handles the heavy I/O lifting; the app server focuses on business logic.`]},{type:`heading2`,text:`Reverse Proxy`},{type:`paragraph`,text:`A reverse proxy (Nginx, HAProxy) is a server that sits in front of your application servers and receives requests on their behalf. Clients only ever connect to the reverse proxy — never directly to your app servers. That one front door can handle TLS termination, load balancing, static file serving, caching, rate limiting, logging, and security for everything behind it.`},{type:`flow`,title:`Reverse proxy — one front door`,code:`flowchart LR
  C([Clients]):::client -->|"HTTPS"| RP["Nginx reverse proxy<br/>TLS, caching, rate limits"]:::network
  RP -->|"/static/*"| F["Static files on disk"]:::cache
  subgraph PRIV["Private network - not reachable from Internet"]
    A1[App server 1]:::server
    A2[App server 2]:::server
  end
  RP -->|"/api/*"| A1
  RP -->|"/api/*"| A2`},{type:`heading2`,text:`CDN — Content Delivery Network`},{type:`paragraph`,text:`A CDN is a worldwide network of "edge" servers — servers placed in cities close to users. Copies of static assets (CSS, JS, images, fonts) are cached on these edge nodes. A user in Mumbai gets assets from a Mumbai CDN node instead of a server in the US, so the data travels a much shorter distance. This dramatically reduces latency (waiting time) for static content. Examples: Cloudflare, AWS CloudFront, Fastly, Akamai.`},{type:`flow`,title:`CDN — nearby copies instead of a long trip`,code:`flowchart LR
  M([User in Mumbai]):::client -->|"~15 ms"| EM["CDN edge Mumbai"]:::cache
  L([User in London]):::client -->|"~15 ms"| EL["CDN edge London"]:::cache
  EM -.->|"only on cache miss<br/>~250 ms"| O["Origin server<br/>in the US"]:::server
  EL -.->|"only on cache miss"| O`,text:`The long trip to the origin happens once per file per edge. After that, nearby users get the cached copy.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`What Happens When You Load twitter.com`},{type:`numbered`,items:[`DNS: twitter.com → 104.244.42.65 (Twitter's edge IP, via Akamai CDN).`,`TCP + TLS: Establish encrypted connection to the CDN edge node.`,`HTTP request arrives at CDN. CDN checks: "Is the home page HTML cached?" If yes → return immediately.`,`Cache miss: CDN forwards request to Twitter's Origin Servers (actual web servers).`,`Nginx (reverse proxy) on origin server receives the request.`,`Nginx routes to appropriate backend service (e.g., Timeline Service).`,`Timeline Service queries Redis for cached feed, Cassandra for tweets.`,`Aggregates response, builds JSON or HTML.`,`Response travels back: App Server → Nginx → CDN (CDN caches it) → Your Browser.`,`Browser receives HTML. Makes additional requests for CSS, JS, images — mostly served from CDN cache.`]},{type:`flow`,title:`Loading twitter.com — cache hit vs miss`,code:`sequenceDiagram
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
  B->>C: GET CSS, JS, images (mostly cache hits)`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`code`,lang:`text`,code:`Browser
  \u2502 HTTPS
  \u25BC
CDN Edge Node (Cloudflare/Akamai \u2014 nearest to user)
  \u2502 Cache HIT \u2192 return static files immediately
  \u2502 Cache MISS \u2192 forward to origin
  \u25BC
Load Balancer (Layer 7 \u2014 HTTP-aware)
  \u2502 Routes based on URL path, headers
  \u25BC
Nginx (Web Server / Reverse Proxy)
  \u2502 Serves static files from /var/www/static/
  \u2502 Proxies API requests to app servers
  \u25BC
Application Server (Node.js / Python / Java)
  \u2502 Business logic, authentication, authorization
  \u25BC
Database (PostgreSQL, MySQL)   Redis (Cache)
  \u2502 Query, return data              \u2502 Fast reads
  \u25BC                                 \u25BC
           Response assembled
                   \u2502
           Back up the chain to browser`},{type:`flow`,title:`The serving stack, layer by layer`,code:`flowchart TB
  B([Browser]):::client -->|"HTTPS"| CDN["CDN edge node"]:::cache
  CDN -->|"cache HIT"| B
  CDN -->|"cache MISS"| LB["Load balancer - L7"]:::network
  LB --> NG["Nginx<br/>static files + proxy"]:::network
  NG --> APP["Application server<br/>business logic, auth"]:::server
  APP --> DB[(PostgreSQL / MySQL)]:::db
  APP --> R[(Redis cache)]:::cache`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Nginx Configuration — The Reverse Proxy Pattern`},{type:`code`,lang:`text`,code:`# Nginx config: serve static files, proxy APIs
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
}`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`Serving a page at a glance`,code:`flowchart LR
  B([Browser]):::client --> C{"CDN<br/>cached?"}:::cache
  C -->|"hit"| B
  C -->|"miss"| LB["Load balancer"]:::network
  LB --> NG["Nginx"]:::network
  NG --> APP["App server"]:::server
  APP --> DB[(Database)]:::db`,text:`The step cards below explain what each tier does.`},{type:`diagram`,diagram:{id:`diagram-web-serving-flow`,title:`Multi-Tier Web Serving & Edge Delivery Architecture`,subtitle:`Edge CDN caching, global anycast load balancing, Nginx reverse proxying, and application microservices`,nodes:[{id:`browser-client`,name:`Client Browser`,subtitle:`User Requests Web Application`,type:`client`,icon:`ti-browser`,badge:`Client`,protocol:`HTTPS :443`,details:[`Requests index.html document, followed by referenced CSS, JavaScript bundles, and images in parallel`,`Sends ETag and If-Modified-Since headers to check if local browser cache is still fresh`]},{id:`edge-cdn`,name:`Edge CDN (Cloudflare / CloudFront)`,subtitle:`Global Edge Point of Presence (PoP)`,type:`gateway`,icon:`ti-cloud`,badge:`Edge Cache`,protocol:`Anycast DNS`,details:[`Cache HIT (< 15ms): Immediately returns static assets (images, CSS, JS) from regional edge RAM/SSD`,`Cache MISS: Forwards request to origin server; caches response according to Cache-Control headers`,`Absorbs DDoS traffic and blocks malicious bots before reaching origin infrastructure`]},{id:`load-balancer`,name:`Global Load Balancer (ALB)`,subtitle:`Layer-7 Application Traffic Router`,type:`network`,icon:`ti-arrows-split-2`,badge:`Load Balancer`,protocol:`Health Checks`,details:[`Distributes incoming HTTP traffic across healthy target server instances using Round-Robin or Least Connections`,`Conducts periodic health-check pings (/health); automatically removes unhealthy nodes in seconds`]},{id:`web-server-proxy`,name:`Web Server / Reverse Proxy (Nginx)`,subtitle:`Edge Web Server & Proxy`,type:`server`,icon:`ti-server`,badge:`Nginx / Caddy`,protocol:`SSL Offload & Gzip`,details:[`Directly serves local static fallback files using high-performance sendfile() system call`,`Compresses responses with Brotli / Gzip; sets security headers (HSTS, Content-Security-Policy)`,`Passes dynamic API requests (/api/*) to application servers over Unix domain sockets or fast intranet TCP`]},{id:`app-service-cluster`,name:`Application Cluster (Node.js / Go)`,subtitle:`Stateless Business Logic Tier`,type:`server`,icon:`ti-cpu`,badge:`App Workers`,protocol:`Express / Fastify`,details:[`Executes application business logic, user authentication, and data transformations`,`Stateless design: any server can handle any user request, enabling horizontal auto-scaling`]},{id:`database-cache-tier`,name:`Database & In-Memory Cache`,subtitle:`PostgreSQL & Redis Tier`,type:`database`,icon:`ti-database`,badge:`Data Layer`,protocol:`SQL / Redis RESP`,details:[`Redis cache stores active user sessions and frequent query results for sub-millisecond retrieval`,`PostgreSQL persists transactional data with ACID integrity and read-replica replication`]}],connections:[{from:`browser-client`,to:`edge-cdn`,label:`1. HTTPS Request`,protocol:`Edge Anycast`},{from:`edge-cdn`,to:`load-balancer`,label:`2. Cache Miss → Origin`,protocol:`Origin Fetch`},{from:`load-balancer`,to:`web-server-proxy`,label:`3. Layer-7 Route`,protocol:`HTTP Proxy`},{from:`web-server-proxy`,to:`app-service-cluster`,label:`4. proxy_pass /api`,protocol:`Fast TCP`},{from:`app-service-cluster`,to:`database-cache-tier`,label:`5. Query / Cache Read`,protocol:`TCP Connection Pool`}],keyTakeaways:[`Static vs Dynamic: 80%+ of bytes on the web are static. Serving static assets via CDN edges eliminates server load and drops latency from 300ms to 15ms.`,`Role of Reverse Proxy: Never expose Node.js directly to the public internet. Nginx handles slow client connections, TLS termination, compression, and request buffering efficiently.`,`Stateless Scaling: By storing state in Redis or database instead of application server memory, you can spin up 100 app instances without session loss.`],rawSpec:`REQUEST PATH:
Browser \u2500\u2500(HTTPS)\u2500\u2500> CDN \u2500\u2500> Load Balancer \u2500\u2500> Nginx \u2500\u2500> App Server \u2500\u2500> DB

STATIC ASSET PATH (fast, CDN cache):
Browser \u2500\u2500> CDN EDGE (cache HIT) \u2500\u2500> Response (< 10ms)

DYNAMIC API PATH:
Browser \u2500\u2500> CDN (miss) \u2500\u2500> LB \u2500\u2500> App Server \u2500\u2500> Redis (fast)
                                                   \u2514\u2500\u2500> DB (fallback)

RESPONSE TIMES (approximate):
CDN cache hit:     5-20ms
Origin static:     50-100ms
Dynamic (cached):  50-150ms
Dynamic (DB):      100-500ms`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`HTTP Keep-Alive`},{type:`paragraph`,text:`HTTP/1.1 by default keeps TCP connections open after a response (Connection: keep-alive). This means the second request on the same page does not need a new TCP handshake. A browser makes 50+ requests for a single page (HTML, CSS, JS, images) — keep-alive dramatically reduces the total time.`},{type:`flow`,title:`Keep-alive — reuse one connection`,code:`sequenceDiagram
  participant B as Browser
  participant S as Server
  B->>S: TCP + TLS handshake (once)
  B->>S: GET /index.html
  S-->>B: 200 OK
  B->>S: GET /app.css (same connection, no new handshake)
  S-->>B: 200 OK
  B->>S: GET /logo.png (same connection)
  S-->>B: 200 OK`},{type:`heading2`,text:`Worker Processes and Concurrency`},{type:`paragraph`,text:`Nginx handles many connections at once using an event-driven, non-blocking design: instead of waiting idly for one slow client, each worker process moves on to whichever connection has data ready. So a few worker processes can serve thousands of simultaneous connections without the overhead of constantly switching between many processes. In contrast, a traditional Apache server using the "prefork" model starts a separate process for each connection — very memory-hungry. This is why Nginx replaced Apache as the preferred web server for high-traffic sites.`},{type:`flow`,title:`Process-per-connection vs event loop`,code:`flowchart TB
  subgraph AP["Apache prefork"]
    C1([Conn 1]):::client --> P1[Process 1]:::server
    C2([Conn 2]):::client --> P2[Process 2]:::server
    C3([Conn 3]):::client --> P3[Process 3]:::server
  end
  subgraph NX["Nginx event-driven"]
    D1([Conn 1]):::client --> W["One worker<br/>handles whichever<br/>connection is ready"]:::highlight
    D2([Conn 2]):::client --> W
    D3([Conn 3]):::client --> W
  end`,text:`Each Apache process costs memory even while it waits. One Nginx worker multiplexes many connections, so memory stays flat as traffic grows.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "The server stores the whole website and sends it to you." Reality: For dynamic sites, the page does not exist until you request it. It is generated on-the-fly from database data.`,`Myth: "CDN is only for big companies." Reality: CDNs are trivially easy to add (Cloudflare is free) and immediately improve performance and reliability for any site.`,`Myth: "The web server runs the application code." Reality: Typically, the web server (Nginx) just handles HTTP connections and proxies to a separate application server that runs the code.`,`Myth: "More servers = faster response." Reality: Response speed for a single request depends on latency (serial operations). For throughput (handling more users), more servers help. For latency, caching and database optimization matter more.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Three-tier architecture: Presentation (browser/CDN) → Logic (app servers) → Data (databases). The standard model for scalable web applications.`,`Microservices: Instead of one monolithic app server, multiple specialized services. Nginx/API Gateway routes requests to the right service.`,`Containerization: Each component (Nginx, app server, database) runs in a Docker container, orchestrated by Kubernetes.`,`Horizontal scaling: Add more app servers behind the load balancer. Nginx/LB distributes traffic across all of them.`,`Database connection pooling: App servers maintain a pool of open database connections instead of opening a new one per request (expensive). PgBouncer for PostgreSQL.`]}]}]},{id:`how-apis-work`,title:`How APIs Work`,emoji:`🔄`,icon:`ti-api`,color:`#6366f1`,bg:`#eef2ff`,accentGlow:`rgba(99,102,241,0.15)`,difficulty:`Foundational`,tagline:`REST, authentication, serialization — how applications talk to each other across the internet.`,tags:[`REST`,`JSON`,`Authentication`,`Authorization`,`Serialization`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`Application Programming Interface`},{type:`paragraph`,text:`An API (Application Programming Interface) is an agreed way for two pieces of software to talk to each other. A Web API specifically means a server that accepts HTTP requests and returns structured data (usually JSON). It acts as a contract between a client (browser, mobile app, another server) and a backend service: "send me a request in this shape, and I promise to reply in that shape."`},{type:`callout`,variant:`info`,text:`In simple terms: an API is like a restaurant menu and waiter. You (the client) do not walk into the kitchen. You pick from the menu (the available endpoints), the waiter (the API) takes your order to the kitchen (the server and database), and brings back exactly what you ordered (the JSON response) — or tells you it is not available (an error code).`},{type:`flow`,title:`The big picture — request in, data out`,code:`flowchart LR
  subgraph CLIENTS["Clients"]
    W([Web app]):::client
    M([Mobile app]):::client
    O([Another server]):::client
  end
  W -->|"GET /api/orders/456"| API["Web API<br/>the contract"]:::server
  M -->|"POST /api/orders"| API
  O -->|"HTTP + JSON"| API
  API --> DB[(Database)]:::db
  API -->|"JSON response"| W`,text:`Any client that speaks HTTP can use the same API. The client never touches the database directly — only the API does.`},{type:`paragraph`,text:`APIs are what make the modern Internet possible. Stripe's API lets you add payments to your app. Twilio's API lets you send SMS. Google Maps API embeds maps. Every app you use is built on dozens of APIs.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Without APIs`},{type:`paragraph`,text:`Without APIs, every application would have to build everything itself. Your food delivery app would need its own mapping system, its own payment processing, its own SMS gateway. APIs let each company specialize: Stripe handles payments (including the heavy legal and security rules), Google handles maps (petabytes of map data), Twilio handles SMS delivery. Your app simply calls each one through its API.`},{type:`flow`,title:`One app, many specialist APIs`,code:`flowchart TB
  APP["Food delivery app<br/>backend"]:::server
  APP -->|"charge card"| ST["Stripe API<br/>payments"]:::external
  APP -->|"route + ETA"| GM["Google Maps API"]:::external
  APP -->|"Your order is on the way"| TW["Twilio API<br/>SMS"]:::external
  APP --> DB[(Own database<br/>orders, menus)]:::db`},{type:`heading2`,text:`API Types`},{type:`bullets`,items:[`REST (Representational State Transfer): Uses HTTP methods (GET, POST, PUT, DELETE) and URLs to identify resources. Returns JSON. The standard for most modern web APIs.`,`GraphQL: Client specifies exactly what data it needs in a query. Single endpoint. Great for complex, nested data needs. Facebook/GitHub use it.`,`gRPC: Binary protocol over HTTP/2. Extremely fast. Used for internal microservice communication (not browser-facing). Google, Netflix use it.`,`WebSocket APIs: A connection stays open and both sides can send messages at any time (bidirectional, real-time), instead of one request getting one response. Used for chat, live feeds, notifications.`]},{type:`flow`,title:`Which API style fits?`,code:`flowchart TD
  Q1{"Need the server to push<br/>live updates?"} -->|"yes"| WS["WebSocket"]:::highlight
  Q1 -->|"no"| Q2{"Internal service-to-service<br/>where speed matters most?"}
  Q2 -->|"yes"| G["gRPC"]:::highlight
  Q2 -->|"no"| Q3{"Clients need very different<br/>shapes of nested data?"}
  Q3 -->|"yes"| GQ["GraphQL"]:::highlight
  Q3 -->|"no"| R["REST - the safe default"]:::highlight`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`REST API Design`},{type:`code`,lang:`text`,code:`Resource: /users
GET    /users           \u2192 list all users
POST   /users           \u2192 create a new user

Resource: /users/{id}
GET    /users/123       \u2192 get user 123
PUT    /users/123       \u2192 replace user 123 entirely
PATCH  /users/123       \u2192 partially update user 123
DELETE /users/123       \u2192 delete user 123

Nested resource:
GET    /users/123/posts \u2192 get all posts by user 123
POST   /users/123/posts \u2192 create a new post for user 123`},{type:`heading2`,text:`Serialization and Deserialization`},{type:`bullets`,items:[`Serialization: Converting an in-memory object into a transmittable format (JSON, XML, Protocol Buffers).`,`Deserialization: Parsing the received format back into an in-memory object.`,`JSON (JavaScript Object Notation): The standard for REST APIs. Human-readable, simple, language-agnostic.`,`Protocol Buffers (protobuf): Binary format used by gRPC. 3-10x smaller and faster than JSON. Not human-readable.`]},{type:`flow`,title:`Serialization round trip`,code:`flowchart LR
  O1["Server object<br/>in memory"]:::server -->|"serialize"| J["JSON text<br/>sent over HTTP"]:::network
  J -->|"deserialize"| O2["Client object<br/>in memory"]:::client`,text:`Objects cannot travel over a network as-is. They are turned into text or bytes, sent, and rebuilt on the other side.`},{type:`heading2`,text:`API Authentication`},{type:`bullets`,items:[`API Keys: A static secret string. Client includes it in the header: X-API-Key: sk-... or query parameter: ?api_key=... Simple but if compromised, must be rotated.`,`Bearer Tokens (JWT): Client logs in once (username/password) and receives a short-lived token (a JWT — JSON Web Token). It then sends the token with every request in the header: Authorization: Bearer eyJ... "Bearer" means "whoever holds this token is allowed in". The token expires (e.g., after 1 hour).`,`OAuth 2.0: "Login with Google" — a third party (Google) vouches for the user without exposing their password to your app.`,`Basic Auth: Username:password encoded in base64. Only acceptable over HTTPS. Sent on every request.`]},{type:`flow`,title:`Bearer token flow — log in once, reuse the token`,code:`sequenceDiagram
  participant C as Client
  participant A as Auth endpoint
  participant API as API
  C->>A: POST /login (username + password)
  A-->>C: JWT (expires in 1 hour)
  C->>API: GET /orders + Authorization Bearer JWT
  Note over API: Check signature and expiry - no password needed
  API-->>C: 200 OK + orders
  C->>API: Later request with expired token
  API-->>C: 401 Unauthorized - log in again or refresh`},{type:`heading2`,text:`API Authorization`},{type:`paragraph`,text:`Authentication = Who are you? Authorization = What are you allowed to do? After authenticating (verifying the token), the server checks permissions: Can this user view this resource? Can they modify it? Two common models: RBAC (Role-Based Access Control) grants permissions by role — admin, editor, viewer. ABAC (Attribute-Based Access Control) is finer-grained and decides using attributes, e.g. "users may edit documents they own, during business hours".`},{type:`flow`,title:`Authentication then authorization`,code:`flowchart TD
  R["Request arrives"]:::client --> A{"Valid token?<br/>Who are you"}:::security
  A -->|"no"| E401["401 Unauthorized"]:::external
  A -->|"yes"| Z{"Allowed to do this?<br/>role or ownership"}:::security
  Z -->|"no"| E403["403 Forbidden"]:::external
  Z -->|"yes"| OK["200 OK - run the action"]:::highlight`,text:`401 means "we do not know who you are". 403 means "we know who you are, but you cannot do this".`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`A Complete API Request Lifecycle`},{type:`numbered`,items:[`Client sends: GET /api/v1/orders/456 with Authorization: Bearer eyJ...`,`API Gateway receives the request. Validates JWT signature and expiry.`,`JWT decoded: {userId: 123, role: "customer", exp: 1725638400}.`,`API Gateway checks rate limit for userId 123 — under limit, proceed.`,`Request forwarded to Order Service.`,`Order Service deserializes the request, extracts orderId=456.`,`Authorization check: Does user 123 own order 456? Query database.`,`Order 456 belongs to user 789, not 123 → Return 403 Forbidden.`,`Response: {"error": "You do not have permission to view this order"}.`,`Client receives 403 and shows "Access Denied" to the user.`]},{type:`flow`,title:`Lifecycle of GET /api/v1/orders/456`,code:`sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant O as Order Service
  participant D as Database
  C->>G: GET /api/v1/orders/456 + Bearer JWT
  Note over G: Verify JWT signature and expiry, decode userId 123
  Note over G: Rate limit check for user 123 - OK
  G->>O: Forward request (userId 123)
  O->>D: Who owns order 456?
  D-->>O: user 789
  Note over O: 123 is not 789 - not allowed
  O-->>G: 403 Forbidden
  G-->>C: 403 + error JSON
  Note over C: Show Access Denied`,text:`The gateway handles the checks every request needs (identity, rate limits). The service handles checks that need business data (who owns this order).`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`JWT — JSON Web Token`},{type:`code`,lang:`text`,code:`A JWT has three parts separated by dots: header.payload.signature

Header (base64): {"alg": "HS256", "typ": "JWT"}
Payload (base64): {
  "userId": 123,
  "email": "user@example.com",
  "role": "admin",
  "iat": 1725634800,  // issued at
  "exp": 1725638400   // expires at (1 hour later)
}
Signature: HMAC_SHA256(header + "." + payload, secret_key)

The server verifies the signature using its secret key.
If the signature is valid and token not expired \u2192 trusted.
No database lookup needed \u2014 all info is in the token.`},{type:`flow`,title:`How a server verifies a JWT`,code:`flowchart TD
  T["Incoming JWT<br/>header.payload.signature"]:::client --> S["Recompute signature from<br/>header + payload + secret key"]:::security
  S --> Q1{"Matches the<br/>signature sent?"}
  Q1 -->|"no - tampered"| X["Reject 401"]:::external
  Q1 -->|"yes"| Q2{"exp in the future?"}
  Q2 -->|"no - expired"| X
  Q2 -->|"yes"| OK["Trust userId and role<br/>from the payload"]:::highlight`,text:`Changing even one character of the payload changes the expected signature, so tampering is detected without a database lookup.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Building a Simple REST API`},{type:`code`,lang:`typescript`,code:`// Express.js REST API
import express from 'express';
const app = express();

// Middleware: parse JSON body
app.use(express.json());

// Middleware: verify JWT
app.use('/api', authenticateToken);

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  // Authorization
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const user = await db.users.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Serialize (exclude sensitive fields)
  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
});`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`An API call at a glance`,code:`flowchart LR
  C([Client]):::client -->|"HTTP + JWT"| G["API Gateway<br/>auth, rate limit"]:::security
  G -->|"route"| S["Service<br/>business logic"]:::server
  S <-->|"query"| D[(Database)]:::db
  S -->|"serialize to JSON"| C`,text:`The step cards below go through each stage of the pipeline.`},{type:`diagram`,diagram:{id:`diagram-api-flow`,title:`API Gateway, JWT Authentication & Serialization Pipeline`,subtitle:`How requests navigate rate limiting, cryptographic token verification, validation, and JSON serialization`,nodes:[{id:`api-consumer`,name:`Client API Consumer`,subtitle:`Frontend App / Mobile Client / Third Party`,type:`client`,icon:`ti-device-mobile`,badge:`Client Caller`,protocol:`POST /api/v1/checkout`,details:[`Packages payload into JSON: { items: [...], total: 120 }`,`Attaches credentials: Authorization: Bearer eyJhbGciOi...`,`Includes Idempotency-Key header to guarantee safe retries on network failure`]},{id:`api-gateway`,name:`API Gateway & Rate Limiter`,subtitle:`Traffic Controller & Policy Enforcement`,type:`gateway`,icon:`ti-shield`,badge:`API Gateway`,protocol:`Token Bucket / Redis`,details:[`Enforces rate limits (e.g. 100 req/min per API key) using Redis Token Bucket counter`,`Validates API Key / CORS origin; routes traffic to target microservice cluster`,`Rejects abusers with HTTP 429 Too Many Requests before any application code executes`]},{id:`auth-validator`,name:`JWT Token Cryptographic Verifier`,subtitle:`Stateless Authentication`,type:`security`,icon:`ti-key`,badge:`Auth Verifier`,protocol:`HMAC-SHA256 / RSA`,details:[`Decodes Header and Payload; verifies signature using shared secret or public key`,`Validates claims: exp (not expired), iss (trusted issuer), and aud (correct audience)`,`Zero DB queries: user identity (userId, roles) is cryptographically proven in memory`]},{id:`schema-validator`,name:`Input Deserializer & Validator`,subtitle:`Schema Enforcement (Zod / Joi)`,type:`server`,icon:`ti-checklist`,badge:`Data Validation`,protocol:`Type Checking`,details:[`Deserializes JSON string into native language data structures (memory objects)`,`Validates field types, mandatory fields, regex patterns, and numeric ranges`,`Strips unknown/injected properties (prevents Mass Assignment & Prototype Pollution vulnerabilities)`]},{id:`service-logic`,name:`Controller & Business Service`,subtitle:`Domain Logic & Persistence`,type:`server`,icon:`ti-cpu`,badge:`Business Service`,protocol:`Transactions`,details:[`Executes transactional domain rules; queries database within ACID transaction`,`Publishes background events (e.g., OrderPlaced to Kafka/RabbitMQ)`]},{id:`serializer-response`,name:`Response Serializer & Cache Formatter`,subtitle:`JSON Response Formatting`,type:`database`,icon:`ti-brackets-contain`,badge:`HTTP 201 Created`,protocol:`JSON Output`,details:[`Serializes data model into clean external DTO (Data Transfer Object); strips sensitive fields (password_hash)`,`Adds ETag, Content-Type: application/json, and Cache-Control headers`]}],connections:[{from:`api-consumer`,to:`api-gateway`,label:`1. API Call with Bearer JWT`,protocol:`HTTPS REST`},{from:`api-gateway`,to:`auth-validator`,label:`2. Rate Limit OK → Verify Token`,protocol:`Gateway Pipeline`},{from:`auth-validator`,to:`schema-validator`,label:`3. Token Valid → Parse JSON`,protocol:`Memory Context`},{from:`schema-validator`,to:`service-logic`,label:`4. Validated DTO to Service`,protocol:`Domain Logic`},{from:`service-logic`,to:`serializer-response`,label:`5. Serialize Result Object`,protocol:`JSON Format`}],keyTakeaways:[`Stateless JWT Architecture: Traditional session auth requires querying a central session database for every request. JWTs verify identity mathematically in memory, eliminating database bottlenecks.`,`Idempotency Keys: Network requests can fail after server processing but before response reaches client. Using an Idempotency-Key header prevents duplicate charges on network retries.`,`Boundary Validation: Always sanitize and validate request inputs at the controller boundary. Never allow unvalidated client input into database queries or internal services.`],rawSpec:`Client App
  \u2502
  \u2502  POST /api/login  {email, password}
  \u25BC
API Server
  \u2502  Verify credentials (hash + compare)
  \u2502  Generate JWT (sign with secret key)
  \u2502
  \u2502  Response: 200 OK { token: "eyJ..." }
  \u25BC
Client stores token (memory/localStorage)

Next request:
Client
  \u2502  GET /api/profile
  \u2502  Authorization: Bearer eyJ...
  \u25BC
API Gateway / Middleware
  \u2502  Decode JWT \u2192 {userId: 123, role: "user"}
  \u2502  Verify signature \u2192 Valid \u2713
  \u2502  Check expiry \u2192 Not expired \u2713
  \u2502  Check rate limit \u2192 45/100 remaining \u2713
  \u25BC
Route Controller
  \u2502  Fetch user 123 from database/cache
  \u25BC
Response: 200 OK { id: 123, name: "Alice", email: "..." }`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`API Versioning`},{type:`paragraph`,text:`Once clients depend on an API, you cannot break the contract. API versioning allows you to evolve without breaking existing clients. Common strategies:`},{type:`bullets`,items:[`URL versioning (most common): /api/v1/users → /api/v2/users. Simple, visible.`,`Header versioning: Accept: application/vnd.api.v2+json. More elegant but less discoverable.`,`Semantic versioning: Major version for breaking changes. Minor for additions. Patch for bug fixes.`]},{type:`heading2`,text:`CORS — Cross-Origin Resource Sharing`},{type:`paragraph`,text:`By default, browser security (the same-origin policy) stops JavaScript on site-a.com from reading data fetched from api-b.com. An "origin" is the scheme + domain + port, like https://myapp.com. The API server can opt in by sending CORS headers that name the origins it trusts: Access-Control-Allow-Origin: https://myapp.com. For requests that could change data or use custom headers (e.g. POST with JSON, PUT, DELETE), the browser first sends a "preflight" OPTIONS request to ask permission before sending the real one.`},{type:`flow`,title:`CORS preflight`,code:`sequenceDiagram
  participant B as Browser on myapp.com
  participant A as api-b.com
  B->>A: OPTIONS /orders (Origin myapp.com, method PUT)
  A-->>B: Access-Control-Allow-Origin https://myapp.com
  alt Origin allowed
    B->>A: PUT /orders (the real request)
    A-->>B: 200 OK - JavaScript can read it
  else Origin not allowed
    Note over B: Browser blocks it with a CORS error
  end`,text:`CORS is enforced by the browser, not the server. Tools like curl or other servers ignore it completely.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "REST is a protocol." Reality: REST is an architectural style, not a protocol. It is a set of conventions for using HTTP.`,`Myth: "JWT is encrypted." Reality: JWT is base64-encoded (anyone can decode it) and signed (cannot be tampered with). Use HTTPS to prevent interception. For truly sensitive data, use JWE (JSON Web Encryption).`,`Myth: "API keys are safer than JWTs." Reality: API keys are static and have no expiry by default — a leaked key is compromised forever. JWTs expire automatically.`,`Myth: "GraphQL is always better than REST." Reality: REST has better caching (GET requests are cacheable). GraphQL is better for complex, varied data requirements. Choose based on your use case.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`API Gateway: Central entry point for all API requests. Handles auth, rate limiting, routing, logging. Products: AWS API Gateway, Kong, Nginx.`,`Microservices Communication: Services call each other via internal APIs. gRPC for performance; REST for simplicity.`,`Backend for Frontend (BFF): A dedicated API layer for each client type (mobile BFF, web BFF). Aggregates and tailors responses for each client's needs.`,`Rate Limiting API: Use sliding window counters (in Redis) to enforce per-user, per-endpoint request limits.`,`API Design for Scale: Pagination (cursor-based), filtering, field selection, bulk endpoints — all influence how the backend database queries are structured.`]}]}]},{id:`how-backend-works`,title:`How a Backend Request is Processed`,emoji:`⚙️`,icon:`ti-code`,color:`#14b8a6`,bg:`#ccfbf1`,accentGlow:`rgba(20,184,166,0.15)`,difficulty:`Foundational`,tagline:`Middleware, routing, controllers, business logic, database — the full journey inside a server.`,tags:[`Middleware`,`Routing`,`Controllers`,`Business Logic`,`Response`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`When an HTTP request arrives at your application server, it does not go straight to "the code that answers it". It passes through a series of steps — a pipeline — before a response is sent back. The main stops are middleware (shared checks every request goes through), the router (picks the right handler), the controller (coordinates the work), services (the business rules) and repositories (talk to the database). Understanding this pipeline is essential for any backend developer: it is the internal anatomy of a web application.`},{type:`callout`,variant:`info`,text:`In simple terms: think of a restaurant. The door staff check you in (middleware), the host takes you to the right table (router), the waiter takes your order (controller), the chef follows the recipes (service), and the pantry staff fetch ingredients (repository). Each person does one job and hands off to the next.`},{type:`flow`,title:`The big picture — a request’s journey through the server`,code:`flowchart LR
  C([Client]):::client -->|"HTTP request"| M[Middleware<br/>log, auth, parse]:::security
  M --> R[Router<br/>which handler?]:::network
  R --> CT[Controller<br/>coordinate]:::server
  CT --> S[Service<br/>business rules]:::server
  S --> RP[Repository<br/>data access]:::server
  RP --> DB[(Database)]:::db
  CT -->|"HTTP response"| C`,text:`The request travels inward layer by layer. The answer is built by the controller and travels back out to the client.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Without a structured request processing pipeline, every route handler would need to manually parse headers, verify tokens, validate input, log requests, handle errors, and connect to the database. The pipeline pattern separates these concerns so each piece of code has a single responsibility.`},{type:`heading2`,text:`The Single Responsibility Principle in Action`},{type:`bullets`,items:[`Middleware layer: Cross-cutting concerns (logging, auth, rate limiting, parsing).`,`Router: Decides which handler processes this request.`,`Controller: Coordinates the request — validates input, calls services, builds response.`,`Service layer: Business logic — the rules that define what the application does.`,`Repository/DAO (Data Access Object): Data access — how to talk to the database.`]},{type:`flow`,title:`One job per layer`,code:`flowchart TB
  subgraph Edge["Shared for every request"]
    MW["Middleware<br/>logging, auth, rate limits, parsing"]:::security
  end
  subgraph App["Specific to this request"]
    RT["Router<br/>pick the handler"]:::network
    CT["Controller<br/>validate, call service, reply"]:::server
    SV["Service<br/>business rules"]:::server
  end
  subgraph Data["Data access"]
    RP["Repository<br/>SQL and queries"]:::server
    DB[(Database)]:::db
  end
  MW --> RT --> CT --> SV --> RP --> DB`,text:`Each layer only talks to the one below it. If you change the database, only the repository changes. If a business rule changes, only the service changes.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Middleware — The Preprocessing Chain`},{type:`paragraph`,text:`Middleware are functions that run before (or after) the route handler. Each one receives the request and can add to it (for example, attach the logged-in user). Then it does one of two things: calls next() to hand the request to the next middleware, or "short-circuits" — sends a response itself (like 401 Unauthorized) so the request never reaches the handler.`},{type:`code`,lang:`typescript`,code:`// Express.js middleware chain
app.use(requestLogger);      // 1. Log every request
app.use(cors());             // 2. Add CORS headers
app.use(express.json());     // 3. Parse JSON body
app.use(authenticateJWT);   // 4. Verify auth token
app.use(rateLimiter);        // 5. Check rate limits

// Route: only reached if ALL middleware pass
app.get('/api/products', productController.list);

// Middleware example: auth check
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Pass to next middleware
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}`},{type:`flow`,title:`Middleware chain — pass along or stop early`,code:`flowchart TD
  IN([Request arrives]):::client --> L[Logger]
  L --> P[Body parser]
  P --> A{Valid token?}:::security
  A -->|"no"| E401["401 Unauthorized<br/>response sent, chain stops"]:::highlight
  A -->|"yes, next()"| RL{Under rate limit?}:::cache
  RL -->|"no"| E429["429 Too Many Requests"]:::highlight
  RL -->|"yes, next()"| H[Route handler]:::server
  H --> OUT([Response]):::client`,text:`Any middleware can end the request early by sending a response. Only requests that pass every check reach your route handler.`},{type:`heading2`,text:`Routing — Matching Request to Handler`},{type:`paragraph`,text:`The router looks at the HTTP method (GET, POST…) and the path (/api/orders/42) and picks the handler function for it. Path parameters like :id are pulled out into req.params. Fast frameworks store routes in a trie — a tree where each branch is one path segment — so finding a match stays quick even with thousands of routes.`},{type:`flow`,title:`How the router picks a handler`,code:`flowchart LR
  REQ["GET /api/orders/42"]:::client --> RT{Router:<br/>method + path match?}:::network
  RT -->|"GET /api/orders"| H1[OrderController.list]:::server
  RT -->|"GET /api/orders/:id<br/>id = 42"| H2[OrderController.getById]:::highlight
  RT -->|"POST /api/orders"| H3[OrderController.create]:::server
  RT -->|"no match"| NF["404 Not Found"]`},{type:`heading2`,text:`Controller — The Coordinator`},{type:`paragraph`,text:`The controller handles a specific route. It validates input, calls the appropriate service methods, and builds the HTTP response. Controllers should be thin — they coordinate but do not contain business logic.`},{type:`heading2`,text:`Service Layer — Business Logic`},{type:`paragraph`,text:`Services contain the actual business rules. "A user can only have 5 active orders." "Applying a discount code requires the order total to be over $50." "After a payment, send a confirmation email." These rules live in services, not controllers or database code.`},{type:`heading2`,text:`Repository Pattern — Data Access`},{type:`paragraph`,text:`The repository hides the details of the database behind simple methods. Services call repository.findById(id) and do not know or care whether the data comes from PostgreSQL, MongoDB, or Redis. This makes testing easier (swap in a fake "mock" repository) and lets you change the database without touching business logic.`},{type:`flow`,title:`The repository as a plug-in point`,code:`flowchart LR
  S[OrderService]:::server -->|"findById(42)"| R[OrderRepository<br/>interface]:::highlight
  R -.-> PG[(PostgreSQL)]:::db
  R -.-> MG[(MongoDB)]:::db
  R -.-> MK[In-memory mock<br/>for tests]:::cache`,text:`The service only knows the repository’s methods. Which storage sits behind it can change without the service noticing.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`POST /api/orders — Complete Request Processing`},{type:`numbered`,items:[`HTTP request arrives at port 443. TLS decrypted. TCP data delivered to Node.js process.`,`Request logging middleware: Log {method: POST, path: /api/orders, ip: 1.2.3.4, timestamp: ...}`,`CORS middleware: Check Origin header. Add Access-Control-Allow-Origin response header.`,`Body parser middleware: Read request body bytes, parse JSON → req.body = {productId: 5, qty: 2}.`,`Auth middleware: Extract JWT from header. Verify signature. Decode. Set req.user = {id: 123}.`,`Rate limiter middleware: Check Redis counter for user 123. Under limit → increment and proceed.`,`Input validation middleware: Validate req.body schema. productId must be integer, qty must be 1-100.`,`Router matches POST /api/orders → OrderController.create.`,`Controller: Call orderService.createOrder(req.user.id, req.body).`,`Service: Check inventory (productRepository.findById), calculate price, apply discounts, create order record.`,`Repository: INSERT INTO orders ... → returns {orderId: 789}.`,`Service: Publish "order_created" event to Kafka (for async notification).`,`Controller: Build response {orderId: 789, status: "pending", total: 29.99}.`,`Response middleware: Add response headers (Content-Type, X-Request-ID).`,`Response serialized to JSON, sent back via TCP → Client receives 201 Created.`]},{type:`flow`,title:`POST /api/orders — who talks to whom`,code:`sequenceDiagram
  participant C as Client
  participant MW as Middleware chain
  participant CT as OrderController
  participant SV as OrderService
  participant RP as Repositories
  participant DB as Database
  participant K as Kafka
  C->>MW: POST /api/orders with JWT and JSON body
  Note over MW: log, CORS, parse body,<br/>verify JWT, rate limit, validate
  MW->>CT: router matches OrderController.create
  CT->>SV: createOrder(userId 123, body)
  SV->>RP: productRepository.findById(5)
  RP->>DB: SELECT product
  DB-->>RP: product row, stock OK
  SV->>RP: orderRepository.create(...)
  RP->>DB: INSERT INTO orders
  DB-->>RP: orderId 789
  SV-)K: publish order_created (async)
  SV-->>CT: order 789
  CT-->>MW: 201 with order JSON
  Note over MW: add headers like X-Request-ID
  MW-->>C: 201 Created`,text:`The Kafka event is "fire and forget": the client gets its answer without waiting for emails or notifications to be sent.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Error Handling Middleware`},{type:`code`,lang:`typescript`,code:`// Global error handler \u2014 must be last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, fields: err.fields });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Unexpected errors \u2014 don't leak internal details
  res.status(500).json({ error: 'Internal server error' });
});`},{type:`flow`,title:`How the global error handler picks a status code`,code:`flowchart TD
  T["Error thrown anywhere<br/>in controller, service or repository"]:::highlight --> H{Global error handler:<br/>what kind of error?}:::server
  H -->|"ValidationError"| E400["400 Bad Request<br/>with field details"]
  H -->|"NotFoundError"| E404["404 Not Found"]
  H -->|"UnauthorizedError"| E401["401 Unauthorized"]:::security
  H -->|"anything else"| E500["500 Internal server error<br/>details logged, not leaked"]`,text:`Code deep in the stack just throws. One central place turns errors into safe, consistent HTTP responses.`},{type:`heading2`,text:`Request Context — Thread-Local vs. AsyncLocalStorage`},{type:`paragraph`,text:`As a request flows through the pipeline, it collects context: the user ID, a request ID used for tracing, maybe a tenant (customer account) ID. Passing these through every function as arguments would be tedious. In Node.js, AsyncLocalStorage lets you store this "per-request" data once and read it from anywhere while that request is being handled (Java and similar languages use thread-local storage for the same job). This is how correlation IDs work: the request ID is stored once and automatically added to every log line, so you can find all logs for one request.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Layered Architecture in Practice`},{type:`code`,lang:`typescript`,code:`// Controller (thin \u2014 coordinates)
class OrderController {
  async create(req: Request, res: Response) {
    const dto = await validateCreateOrderDto(req.body);
    const order = await this.orderService.createOrder(req.user.id, dto);
    res.status(201).json(order);
  }
}

// Service (business logic)
class OrderService {
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const product = await this.productRepo.findById(dto.productId);
    if (!product || product.stock < dto.quantity) throw new OutOfStockError();
    
    const price = product.price * dto.quantity;
    const discount = await this.discountService.calculate(userId, price);
    
    const order = await this.orderRepo.create({
      userId, productId: dto.productId,
      quantity: dto.quantity,
      total: price - discount
    });
    
    await this.eventBus.publish('order.created', { orderId: order.id });
    return order;
  }
}

// Repository (data access)
class OrderRepository {
  async create(data: CreateOrderData): Promise<Order> {
    const result = await this.db.query(
      'INSERT INTO orders (user_id, product_id, quantity, total) VALUES ($1,$2,$3,$4) RETURNING *',
      [data.userId, data.productId, data.quantity, data.total]
    );
    return result.rows[0];
  }
}`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — the onion: in through the layers, back out again`,code:`flowchart TB
  SOCK["OS socket + event loop<br/>bytes arrive on port 443"]:::network --> L1
  subgraph Onion["Middleware layers"]
    L1["1. Logger + request ID"]:::server --> L2["2. Security + CORS"]:::security
    L2 --> L3["3. Body parser + auth"]:::security
    L3 --> CT["4. Router + controller"]:::highlight
    CT --> POOL["5. Borrow DB connection<br/>from pool"]:::db
    POOL -->|"result"| UNW["6. Unwind outward<br/>log duration, set headers"]:::server
  end
  UNW --> RESP([HTTP response to client]):::client`,text:`Middleware wraps the controller like layers of an onion: the request passes through each layer going in, and the response passes back through them coming out.`},{type:`diagram`,diagram:{id:`diagram-backend-pipeline`,title:`The Onion Middleware & Request Processing Pipeline`,subtitle:`Tracing a request through non-blocking event loops, ordered middleware layers, router, and controller`,nodes:[{id:`socket-event-loop`,name:`OS Socket & Non-Blocking Event Loop`,subtitle:`epoll / kqueue Kernel Listener`,type:`network`,icon:`ti-bolt`,badge:`I/O Listener`,protocol:`Event Loop`,details:[`Kernel triggers epoll read event when network packet arrives on TCP port 443`,`Runtime reads raw byte chunks into memory buffer without blocking other concurrent connections`]},{id:`request-logger-context`,name:`1. Request Context & Correlation ID`,subtitle:`Observability & Tracing`,type:`gateway`,icon:`ti-file-text`,badge:`Middleware 1`,protocol:`X-Request-ID`,details:[`Generates unique UUID (trace_id) and attaches it to request context`,`Logs incoming method, URL, and timestamp; passes trace_id to downstream database calls`]},{id:`security-cors-middleware`,name:`2. Security & CORS Enforcement`,subtitle:`Helmet & CORS Headers`,type:`security`,icon:`ti-shield-check`,badge:`Middleware 2`,protocol:`CORS & CSP`,details:[`Validates Origin header against permitted domain whitelist; handles OPTIONS preflight`,`Appends security headers: X-Content-Type-Options: nosniff, Strict-Transport-Security`]},{id:`body-parser-middleware`,name:`3. Streaming Body Parser & Auth`,subtitle:`Stream Accumulation & Authentication`,type:`server`,icon:`ti-binary`,badge:`Middleware 3 & 4`,protocol:`JSON Buffer`,details:[`Accumulates incoming stream chunks until completed; enforces 1MB payload limit`,`Parses JSON into req.body; validates auth token and populates req.user`]},{id:`router-controller`,name:`4. Router & Controller Execution`,subtitle:`Pattern Matching & Business Logic`,type:`server`,icon:`ti-code`,badge:`Controller Action`,protocol:`Trie Route Match`,details:[`Matches URL path against routing tree (e.g. /users/:id); extracts params`,`Calls business controller action: validates inputs, orchestrates domain logic`]},{id:`db-connection-pool`,name:`5. Database Connection Pool & Query`,subtitle:`Pooled TCP Client Reuse`,type:`database`,icon:`ti-database`,badge:`DB Pool`,protocol:`Parameterized SQL`,details:[`Borrows pre-established TCP client from pool (avoids expensive 3-way handshake)`,`Executes parameterized SQL query; releases client back to pool immediately`]},{id:`reverse-middleware-unwind`,name:`6. Onion Outward Unwinding & Response`,subtitle:`Post-Processing & Socket Flush`,type:`client`,icon:`ti-arrow-back-up`,badge:`Response Flush`,protocol:`HTTP Response`,details:[`Execution flows backward through middleware: logs total request duration (e.g. 24ms)`,`Sets Content-Type, writes HTTP status 200, flushes response buffers to client socket`]}],connections:[{from:`socket-event-loop`,to:`request-logger-context`,label:`1. I/O Event → Enter Onion`,protocol:`Inward Flow`},{from:`request-logger-context`,to:`security-cors-middleware`,label:`2. Next() with Trace ID`,protocol:`Pipeline`},{from:`security-cors-middleware`,to:`body-parser-middleware`,label:`3. Next() CORS verified`,protocol:`Pipeline`},{from:`body-parser-middleware`,to:`router-controller`,label:`4. Next() Body parsed & Auth verified`,protocol:`Pipeline`},{from:`router-controller`,to:`db-connection-pool`,label:`5. Borrow pooled DB client`,protocol:`SQL Query`},{from:`db-connection-pool`,to:`reverse-middleware-unwind`,label:`6. Results return; Outward unwind`,protocol:`Outward Flow`}],keyTakeaways:[`The Onion Pattern: Middleware wraps your controller like layers of an onion. A request travels inward through each layer, and response travels outward in reverse order through post-processing.`,`Non-blocking Event Loop: A single-threaded event loop (like Node.js) can handle 10,000+ concurrent requests because it delegates database queries and network I/O to OS threads and resumes via callbacks.`,`Connection Pooling: Opening a database TCP connection takes 30–50ms. Maintaining a pool of 20 reusable connections drops query dispatch time to < 1ms.`],rawSpec:`Incoming HTTP Request
        \u2502
        \u25BC Middleware Chain (in order)
   \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
   \u2502 1. Request Logger        \u2502 \u2190 log every request
   \u2502 2. CORS Handler          \u2502 \u2190 add CORS headers
   \u2502 3. Body Parser           \u2502 \u2190 parse JSON body
   \u2502 4. Auth Middleware       \u2502 \u2190 verify JWT, set req.user
   \u2502 5. Rate Limiter          \u2502 \u2190 check Redis counter
   \u2502 6. Input Validator       \u2502 \u2190 validate schema
   \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
        \u2502
        \u25BC Router
   Match: GET /api/users/:id \u2192 UserController.getUserById()
        \u2502
        \u25BC Controller
   Call UserService.getUser(id)
        \u2502
        \u25BC Service / Business Logic
   Check Redis cache first (HIT? return)
   If MISS: Query database
        \u2502
        \u25BC Database Query
   SELECT * FROM users WHERE id = $1  (parameterized)
        \u2502
        \u25BC Response Formatter
   Strip sensitive fields (password_hash)
   Format JSON response
        \u2502
        \u25BC Outward Middleware
   Log duration: "GET /api/users/123 completed in 23ms"
        \u2502
        \u25BC
HTTP/2 200 OK sent to browser`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Concurrency in Node.js`},{type:`paragraph`,text:`Node.js runs your JavaScript on a single thread, yet it handles thousands of requests at once. The trick is the event loop and non-blocking I/O (input/output such as network or disk calls). When your handler awaits a database query, Node.js does not sit and wait — it parks that request and serves other requests. When the database replies, Node.js picks up where it left off. This is why Node.js scales well for I/O-bound workloads (apps that mostly wait on databases and APIs rather than doing heavy calculations).`},{type:`flow`,title:`One thread, many requests — the event loop at work`,code:`sequenceDiagram
  participant A as Request A
  participant EL as Event loop (1 thread)
  participant DB as Database
  participant B as Request B
  A->>EL: handler runs
  EL->>DB: send query for A (non-blocking)
  Note over EL: free while A waits
  B->>EL: handler runs
  EL-->>B: response for B sent
  DB-->>EL: rows for A ready
  EL-->>A: A resumes after await, response sent`,text:`While request A waits on the database, the single thread is free to fully serve request B.`},{type:`heading2`,text:`Database Connection Pooling`},{type:`paragraph`,text:`Opening a new database connection is slow — roughly 50-200ms for the network handshake, login and setup. So instead of opening one per request, the app keeps a pool of already-open connections (libraries like pg-pool or HikariCP do this). When a request needs the database, it borrows a connection from the pool and gives it back when done. Pool size is typically 10-50 connections. Too many, and PostgreSQL runs out of memory and resources. Too few, and requests queue up waiting for a free connection.`},{type:`flow`,title:`Borrowing from the connection pool`,code:`flowchart TD
  REQ([Request needs the DB]):::client --> Q{Free connection<br/>in the pool?}:::cache
  Q -->|"yes"| USE["Borrow it, run query<br/>under 1ms to start"]:::db
  Q -->|"no"| WAIT["Wait in line<br/>until one is returned"]:::queue
  WAIT --> USE
  USE --> RET["Return connection to pool<br/>stays open for the next request"]:::server`,text:`The expensive step — opening a connection — happens once at startup, not on every request.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "Thicker controllers are fine for small projects." Reality: Even for small projects, thin controllers are worth the discipline. Fat controllers are the #1 source of unmaintainable backend code.`,`Myth: "Services should directly query the database." Reality: Direct DB access in services tightly couples business logic to the data layer. Repository pattern allows mocking in tests and changing DB without rewriting logic.`,`Myth: "Node.js is slow because it is single-threaded." Reality: Node.js single thread handles I/O concurrently via the event loop. It is slow for CPU-intensive tasks (e.g., video encoding) but excellent for I/O-heavy APIs.`,`Myth: "Error handling is optional for prototypes." Reality: Without global error handling, any unhandled error crashes the process in production. Always add a global catch-all error handler.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Observability: Request logging with correlation IDs, structured logging (JSON), distributed tracing (OpenTelemetry) — all implemented as middleware.`,`Feature Flags: Middleware can check feature flags and modify behavior before the request reaches the controller.`,`Multi-tenancy: Middleware extracts the tenant ID from the JWT or subdomain and makes it available to all downstream handlers.`,`Circuit Breaker: Middleware or service layer wraps external calls in circuit breakers — stop calling a failing service and return a cached/fallback response.`,`CQRS: Separate command handlers (writes) from query handlers (reads). Each follows the same middleware → controller → service → repository pipeline but with optimized implementations.`]}]}]},{id:`how-databases-work`,title:`How Databases Work`,emoji:`🗄️`,icon:`ti-database`,color:`#0891b2`,bg:`#e0f2fe`,accentGlow:`rgba(8,145,178,0.15)`,difficulty:`Foundational`,tagline:`Queries, indexes, B-trees, ACID transactions, and connection pooling — the engine under every app.`,tags:[`B-Tree Index`,`Query Execution`,`ACID`,`Transactions`,`Connection Pooling`],estimatedTime:`50 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`A database is a system for storing, organizing, and retrieving data reliably. It is much more than a file on disk. It gives you: a query language (SQL) to ask questions about your data; ACID guarantees (explained below) so data stays correct; indexes for fast lookups; safe access by many users at the same time without corrupting data; and crash recovery so nothing committed is lost if the power goes out.`},{type:`callout`,variant:`info`,text:`In simple terms: a database is like a well-run library. You ask the librarian (the database engine) for a book instead of searching the shelves yourself. The librarian uses a catalogue (an index) to find it fast, keeps popular books on the front desk (memory cache), writes every loan in a logbook before handing anything out (the write-ahead log), and makes sure two people never walk off with the same copy (transactions and locking).`},{type:`flow`,title:`The big picture — from your app to the disk`,code:`flowchart LR
  APP([Your app]):::client -->|"SQL query"| POOL[Connection pool]:::network
  POOL --> ENG
  subgraph ENG["Database engine"]
    direction TB
    P[Parse + plan]:::server --> X[Execute]:::server
    X --> BP[Buffer pool<br/>pages in RAM]:::cache
  end
  BP <-->|"read or write pages"| DISK[(Data files<br/>on disk)]:::db
  X -->|"log every change first"| WAL[(Write-ahead log)]:::db
  ENG -->|"result rows"| APP`,text:`Your app sends a question in SQL. The engine works out the fastest way to answer it, reads from memory when it can and from disk when it must, and logs every change for safety.`},{type:`heading2`,text:`Relational vs. Non-Relational`},{type:`bullets`,items:[`Relational (SQL): PostgreSQL, MySQL, SQLite. Data in tables with rows and columns. Relationships via foreign keys. Strong consistency. ACID transactions. Best for structured, relational data.`,`Document (NoSQL): MongoDB, Firestore. Data as JSON documents. Flexible schema. Good for hierarchical data.`,`Key-Value: Redis, DynamoDB. Simple map of key → value. Extremely fast. No complex queries.`,`Column-Family: Cassandra, HBase. Good for time-series and analytics at massive scale.`,`Graph: Neo4j. Optimized for relationship-heavy data (social networks, fraud detection).`]}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Without databases, every application would need to manage its own files. It would have to stop two users from overwriting each other’s changes, recover cleanly after a crash, and search through gigabytes of data quickly. These are hard problems. Databases solve them once, so application developers can focus on business logic.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`How a Query is Executed`},{type:`numbered`,items:[`Parse: SQL string → parse tree (syntax check).`,`Analyze: Validate that tables, columns exist. Resolve types.`,`Plan: Query planner generates multiple possible execution plans. Chooses the cheapest plan based on statistics (table sizes, index selectivity).`,`Execute: Execute the chosen plan. May involve: sequential scan, index scan, hash join, sort, etc.`,`Return: Results sent back to the client.`]},{type:`flow`,title:`The life of a query`,code:`flowchart LR
  SQL["SELECT ... WHERE email = ..."]:::client --> PA[Parse<br/>is the syntax valid?]:::server
  PA --> AN[Analyze<br/>do the tables and columns exist?]:::server
  AN --> PL{Plan<br/>which way is cheapest?}:::highlight
  PL -->|"index scan"| EX[Execute]:::server
  PL -.->|"or sequential scan"| EX
  EX --> RES([Rows returned]):::client`,text:`The planner is the clever part: it estimates the cost of several strategies using table statistics and picks the cheapest one.`},{type:`heading2`,text:`Indexes — The Secret to Fast Queries`},{type:`paragraph`,text:`An index is a separate, sorted data structure (usually a B-Tree) that maps column values to where the matching rows live — like the index at the back of a book. Without an index, a query like SELECT * FROM users WHERE email = 'john@example.com' has to check every row one by one (a full table scan, O(N): twice the rows means twice the work). With an index on email, the lookup is O(log N): even with 100 million users, the database only needs a handful of steps to find the row.`},{type:`flow`,title:`With and without an index`,code:`flowchart TD
  Q["WHERE email = 'john@example.com'"]:::client --> D{Index on email?}:::highlight
  D -->|"no"| SEQ["Full table scan<br/>check all 100M rows"]:::db
  D -->|"yes"| IDX["Walk the B-Tree<br/>about 4 steps"]:::cache
  SEQ --> SLOW([Seconds]):::server
  IDX --> PTR["Follow pointer<br/>to the row"]:::db
  PTR --> FAST([Under 1 ms]):::server`},{type:`heading2`,text:`B-Tree Index Structure`},{type:`code`,lang:`text`,code:`B-Tree index on users.email:
                  [M]
                /     \\
          [D-H]         [S-Z]
         /  |  \\       /   \\
      [D] [E] [G-H] [S-T] [X-Z]
       \u2502
   Leaf: email \u2192 page/row pointer
   
Query: WHERE email = 'e@x.com'
1. Start at root [M] \u2192 'e' < 'M' \u2192 go left
2. [D-H] \u2192 'D' < 'e' < 'H' \u2192 middle
3. [E] \u2192 found 'e@x.com' \u2192 follow pointer to row
Result: O(log N), not O(N)`},{type:`flow`,title:`Walking the B-Tree to find e@x.com`,code:`flowchart TD
  ROOT["Root: M"]:::highlight -->|"e comes before M, go left"| L["D to H"]:::server
  ROOT -.-> R["S to Z"]
  L -.-> N1["D"]
  L -->|"e is between D and H"| N2["E"]:::server
  L -.-> N3["G to H"]
  N2 -->|"leaf holds row pointer"| ROW[(Row on page 42)]:::db`,text:`Each step discards most of the remaining data. Because each node has many children, even huge tables are only 3–4 levels deep.`},{type:`heading2`,text:`ACID Transactions`},{type:`bullets`,items:[`Atomicity: A transaction is all-or-nothing. If transferring $100 from Account A to Account B, both the debit and credit succeed or neither does. No partial execution.`,`Consistency: Database moves from one valid state to another. Constraints (foreign keys, CHECK) are enforced.`,`Isolation: Concurrent transactions do not interfere. Transaction A sees a consistent snapshot, unaffected by Transaction B running simultaneously.`,`Durability: Once committed, data is permanent. The database writes to a WAL (Write-Ahead Log) before confirming, so a power failure cannot lose committed data.`]}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`A Bank Transfer Transaction`},{type:`code`,lang:`sql`,code:`-- Transfer $100 from Alice (id=1) to Bob (id=2)

BEGIN TRANSACTION;

-- Check Alice has enough balance
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- Lock row

-- Alice: $500 balance \u2192 deduct $100
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- Bob: $200 balance \u2192 add $100
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- All good \u2192 commit (writes to WAL, then to data files)
COMMIT;

-- If anything fails between BEGIN and COMMIT:
ROLLBACK; -- Both changes are undone, as if it never happened`},{type:`flow`,title:`The transfer, step by step`,code:`sequenceDiagram
  participant App
  participant DB as Database
  participant WAL as Write-ahead log
  App->>DB: BEGIN
  App->>DB: SELECT balance FOR UPDATE (lock Alice row)
  DB-->>App: 500
  App->>DB: UPDATE Alice minus 100
  App->>DB: UPDATE Bob plus 100
  alt everything succeeded
    App->>DB: COMMIT
    DB->>WAL: append both changes and flush to disk
    DB-->>App: committed, locks released
  else any error
    App->>DB: ROLLBACK
    DB-->>App: both changes undone
  end`,text:`Atomicity in action: either both updates become permanent together, or neither does. COMMIT only returns after the log is safely on disk.`},{type:`heading2`,text:`What Happens if the Server Crashes Mid-Transaction?`},{type:`paragraph`,text:`The WAL (Write-Ahead Log) is an append-only diary of changes. Every change is written to it before the real data files are touched. On restart, PostgreSQL reads the WAL: transactions that had committed are re-applied, and transactions that never committed are thrown away (rolled back). So the data is always left in a correct state, even after a crash.`},{type:`flow`,title:`Crash recovery with the WAL`,code:`flowchart TD
  CR([Server restarts after crash]):::highlight --> RD[Read the write-ahead log]:::db
  RD --> D{Did this transaction<br/>reach COMMIT?}:::server
  D -->|"yes"| REDO["Re-apply its changes<br/>nothing committed is lost"]:::cache
  D -->|"no"| UNDO["Discard its changes<br/>as if it never happened"]:::security
  REDO --> OK([Database consistent and online]):::client
  UNDO --> OK`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Connection Pooling`},{type:`paragraph`,text:`Opening a database connection is expensive: roughly 50-200ms to set up, and about 5 MB of server memory for each one. Connection poolers (PgBouncer for PostgreSQL, HikariCP for Java) keep a small set of connections open and ready. The application borrows one for a query and hands it back as soon as it is done. Because each query is short, a pool of 20 connections can serve thousands of concurrent application threads.`},{type:`flow`,title:`Many app workers, few database connections`,code:`flowchart LR
  subgraph Apps["App servers - thousands of requests"]
    A1([Worker 1]):::client
    A2([Worker 2]):::client
    A3([Worker 1000]):::client
  end
  A1 --> P[Connection pool<br/>20 open connections]:::network
  A2 --> P
  A3 --> P
  P -->|"borrow, query, return"| DB[(PostgreSQL)]:::db`,text:`Workers queue briefly for a free connection instead of each opening its own, which would exhaust the database’s memory.`},{type:`heading2`,text:`Query Planner and EXPLAIN`},{type:`code`,lang:`sql`,code:`-- See how PostgreSQL will execute a query
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Output:
Index Scan using idx_orders_user_id on orders
  (cost=0.56..8.58 rows=3 width=96) (actual time=0.05..0.07 rows=3)
  Index Cond: (user_id = 123)
Planning time: 0.1 ms
Execution time: 0.1 ms  \u2190 Fast because of index

-- Without index:
Seq Scan on orders
  (cost=0.00..19432.00 rows=1000000 width=96) (actual time=0.05..312 ms)
Execution time: 312 ms  \u2190 Scanning all 1 million rows`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`The N+1 Query Problem`},{type:`paragraph`,text:`A very common performance issue that shows up when you understand how databases work:`},{type:`code`,lang:`typescript`,code:`// BAD: N+1 problem \u2014 1 query to get orders, N queries to get products
const orders = await db.query('SELECT * FROM orders LIMIT 100');  // 1 query
for (const order of orders) {
  order.product = await db.query(  // 100 additional queries!
    'SELECT * FROM products WHERE id = $1', [order.product_id]
  );
}
// Total: 101 database queries

// GOOD: JOIN to get everything in 1 query
const orders = await db.query(\`
  SELECT orders.*, products.name, products.price
  FROM orders
  JOIN products ON orders.product_id = products.id
  LIMIT 100
\`);
// Total: 1 database query, 100x faster`},{type:`flow`,title:`N+1 vs JOIN — count the round trips`,code:`sequenceDiagram
  participant App
  participant DB as Database
  Note over App,DB: N+1 - 101 round trips
  App->>DB: SELECT orders LIMIT 100
  DB-->>App: 100 orders
  loop for each of the 100 orders
    App->>DB: SELECT product WHERE id = ...
    DB-->>App: 1 product
  end
  Note over App,DB: JOIN - 1 round trip
  App->>DB: SELECT orders JOIN products LIMIT 100
  DB-->>App: 100 orders with product details`,text:`Every round trip pays network latency. 101 small queries are far slower than one well-written query.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — inside the database engine`,code:`flowchart TB
  C([App + connection pool]):::client -->|"1. SQL"| PR[Parser + analyzer]:::server
  PR -->|"2. parse tree"| OPT{Query optimizer<br/>index or full scan?}:::highlight
  OPT -->|"3. plan"| BP[Buffer pool<br/>8KB pages in RAM]:::cache
  BP -->|"4. page miss: load from disk"| BT[(B+ Tree index<br/>+ table data)]:::db
  BP -->|"5. writes logged first"| WAL[(Write-ahead log)]:::db
  BP -->|"rows"| C`,text:`Reads try RAM first and fall back to disk. Writes are recorded in the log before anything else so they survive a crash.`},{type:`diagram`,diagram:{id:`diagram-database-internals`,title:`Relational Database Engine Internal Query Execution Flow`,subtitle:`How an application query traverses Parser, Query Optimizer, Buffer Pool, B+ Tree Index, and WAL log`,nodes:[{id:`client-query-dispatch`,name:`Client Application & Connection Pool`,subtitle:`Pooled Socket Dispatch`,type:`client`,icon:`ti-app-window`,badge:`Client Query`,protocol:`SELECT * FROM users...`,details:[`Application borrows persistent TCP connection from connection pool`,`Sends SQL string with parameter bindings: SELECT * FROM users WHERE email = $1`]},{id:`sql-parser-lexer`,name:`SQL Lexer, Parser & Analyzer`,subtitle:`Syntax & Semantic Verification`,type:`gateway`,icon:`ti-terminal`,badge:`Parser (AST)`,protocol:`Abstract Syntax Tree`,details:[`Tokenizes SQL query into keywords, literals, and identifiers`,`Validates SQL grammar; generates Abstract Syntax Tree (AST)`,`Analyzer checks system catalog: verifies table "users" and column "email" actually exist and user has read permissions`]},{id:`query-optimizer`,name:`Cost-Based Query Optimizer & Planner`,subtitle:`Execution Plan Selection`,type:`server`,icon:`ti-cpu`,badge:`Query Planner`,protocol:`Cost Estimation`,details:[`Calculates mathematical cost estimates based on table statistics and column histograms`,`Compares Sequential Scan (reading all 10M rows) vs Index Scan (reading B+ Tree)`,`Selects cheapest execution plan (Index Scan cost: 4.2 vs Seq Scan cost: 84,200)`]},{id:`buffer-pool-manager`,name:`Buffer Pool (Shared Memory Cache)`,subtitle:`In-Memory RAM Page Cache`,type:`cache`,icon:`ti-server-2`,badge:`RAM Buffer`,protocol:`8KB Disk Pages in RAM`,details:[`Databases read and write data in fixed 8KB pages, never individual rows`,`Cache HIT: If required 8KB page is already in RAM, reads it in microseconds with ZERO disk I/O`,`Cache MISS: Reads 8KB page from disk SSD, loads into Buffer Pool, evicts old pages via LRU`]},{id:`btree-storage-engine`,name:`B+ Tree Index & Table Heap`,subtitle:`Logarithmic O(log N) Search`,type:`database`,icon:`ti-binary-tree-2`,badge:`Storage Engine`,protocol:`B+ Tree Index`,details:[`Traverses root node → branch node → leaf node in 3–4 memory comparisons for 10M rows`,`Leaf node holds exact physical pointer (file_id, block_id, offset) to row data in table heap`]},{id:`wal-durability`,name:`Write-Ahead Log (WAL) & Disk`,subtitle:`ACID Durability Guarantee`,type:`storage`,icon:`ti-device-floppy`,badge:`Durability (WAL)`,protocol:`Sequential Append`,details:[`For writes: Appends modification record sequentially to Write-Ahead Log on disk BEFORE writing data pages`,`If power fails mid-transaction, recovery engine replays WAL on reboot to guarantee zero data loss`]}],connections:[{from:`client-query-dispatch`,to:`sql-parser-lexer`,label:`1. Send SQL Query`,protocol:`TCP Socket`},{from:`sql-parser-lexer`,to:`query-optimizer`,label:`2. Parse Tree (AST)`,protocol:`Semantics OK`},{from:`query-optimizer`,to:`buffer-pool-manager`,label:`3. Execute Plan: Index Scan`,protocol:`Physical Plan`},{from:`buffer-pool-manager`,to:`btree-storage-engine`,label:`4. Read Page / Traverse B+ Tree`,protocol:`Page Fetch`},{from:`btree-storage-engine`,to:`wal-durability`,label:`5. Log to WAL for Writes`,protocol:`Sequential Flush`}],keyTakeaways:[`Why B+ Trees: Unlike balanced binary trees (BSTs), B+ Trees have high branching factor (fanout 100+). A tree with 10 million rows is only 3–4 levels deep, requiring at most 3–4 page reads.`,`Write-Ahead Logging (WAL): Random disk writes are slow; sequential disk appends are fast. Databases append writes to WAL sequentially first for durability, then flush dirty RAM pages to disk lazily in background.`,`Index Selectivity: An index is useless if it matches 50% of the table (e.g. status: active). The Query Optimizer will ignore the index and choose a Sequential Scan because random index lookups would be slower than sequential disk reads.`],rawSpec:`Query: SELECT * FROM users WHERE email = 'john@example.com'

Application \u2192 Connection Pool \u2192 PostgreSQL Process

PostgreSQL:
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 1. Parser: SQL \u2192 Parse Tree                 \u2502
\u2502 2. Analyzer: Validate tables/columns         \u2502
\u2502 3. Planner: Choose execution plan            \u2502
\u2502    Options: Seq Scan vs Index Scan           \u2502
\u2502    \u2192 Index Scan (cheaper) \u2713                 \u2502
\u2502 4. Executor:                                 \u2502
\u2502    \u2192 Lookup in B-Tree index on "email"       \u2502
\u2502    \u2192 Find page #42, offset #7               \u2502
\u2502    \u2192 Read page from Buffer Pool (RAM)        \u2502
\u2502    \u2192 Return row to client                    \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

B+ Tree index on "email":
               [M - P]
              /                [A - L]     [Q - Z]
         /          [A - D]   [E - H]  \u2190 leaf node has pointer to row on disk
               \u2514\u2500\u2500 "john@example.com" \u2192 Page #42, offset #7`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`MVCC — Multi-Version Concurrency Control`},{type:`paragraph`,text:`PostgreSQL does not overwrite a row in place. Every UPDATE writes a new version of the row and marks the old one as outdated. Each transaction sees a consistent snapshot — the versions that were current when it started. Old versions that nobody needs any more are cleaned up later by a background process called VACUUM. The result: readers never wait for writers and writers never wait for readers — a key reason PostgreSQL handles high concurrency well.`},{type:`flow`,title:`MVCC — readers and writers don’t block each other`,code:`sequenceDiagram
  participant R as Reader transaction
  participant DB as Row: balance
  participant W as Writer transaction
  R->>DB: start, snapshot taken
  DB-->>R: sees version 1 = 500
  W->>DB: UPDATE balance = 400
  Note over DB: version 2 = 400 created,<br/>version 1 kept for the reader
  W->>DB: COMMIT
  R->>DB: read again
  DB-->>R: still sees version 1 = 500
  Note over DB: VACUUM removes version 1<br/>once no one needs it`},{type:`heading2`,text:`The Buffer Pool / Shared Buffer Cache`},{type:`paragraph`,text:`Reading from disk is roughly 1,000× slower than reading from RAM. So PostgreSQL keeps a shared buffer pool — an area of memory (typically 25% of RAM) holding recently used data pages (fixed 8KB chunks of a table or index). When a query needs data, it checks the buffer pool first (a cache hit — fast). If the page is not there, it reads it from disk and keeps a copy in the pool (a cache miss — slow). Keeping the hit rate above 99% is critical for performance.`},{type:`flow`,title:`Buffer pool — hit or miss`,code:`flowchart TD
  Q([Query needs page 42]):::client --> D{Page 42 in<br/>buffer pool?}:::cache
  D -->|"hit"| RAM["Read from RAM<br/>microseconds"]:::highlight
  D -->|"miss"| DISK["Read 8KB page from disk<br/>much slower"]:::db
  DISK --> EV["Store in pool,<br/>evict least recently used page"]:::cache
  EV --> RAM`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "NoSQL is faster than SQL." Reality: It depends on the access pattern. For key-value lookups, DynamoDB is faster. For complex queries on relational data, PostgreSQL with indexes is hard to beat.`,`Myth: "Indexes always make queries faster." Reality: Indexes speed up reads but slow down writes (index must be updated on every INSERT/UPDATE). Do not index every column — only high-cardinality columns used in WHERE clauses.`,`Myth: "Transactions are expensive — avoid them." Reality: Short, fast transactions are cheap. Long-running transactions (minutes) lock rows and cause contention. Keep transactions short.`,`Myth: "The database handles everything — just write SQL." Reality: The application must manage connection pooling, N+1 problems, and query optimization. A bad ORM usage can generate terrible SQL.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Read replicas: Primary DB handles writes. Read replicas handle queries. Horizontal read scaling.`,`Database sharding: Partition data across multiple DB instances by user_id or geographic region.`,`Caching layer (Redis): Cache hot query results in Redis. Avoid hitting DB for every read.`,`CQRS: Separate write model (normalized relational DB) from read model (denormalized, optimized for queries).`,`Database migrations: Schema changes are versioned and deployed incrementally. Flyway, Liquibase, or Prisma Migrate manage this.`]},{type:`flow`,title:`Scaling a database — common building blocks`,code:`flowchart TB
  APP([App servers]):::client -->|"1. check cache"| RC[(Redis cache)]:::cache
  APP -->|"writes"| PRI[(Primary DB)]:::db
  APP -->|"reads on cache miss"| REP[(Read replicas)]:::db
  PRI -.->|"replication"| REP`,text:`Writes go to one primary, reads are spread over replicas, and hot results are served from a cache so most reads never reach the database at all.`},{type:`callout`,variant:`important`,text:`Database performance is the bottleneck in most backend systems. Understanding indexes (B-trees), EXPLAIN ANALYZE, connection pooling, and the N+1 problem will make you a dramatically better backend engineer and system designer.`}]}]},{id:`how-files-work`,title:`How Files are Uploaded and Downloaded`,emoji:`💾`,icon:`ti-upload`,color:`#7c3aed`,bg:`#ede9fe`,accentGlow:`rgba(124,58,237,0.15)`,difficulty:`Intermediate`,tagline:`Multipart uploads, presigned URLs, S3 object storage, streaming — the complete picture of file handling.`,tags:[`Multipart Upload`,`Presigned URLs`,`Object Storage`,`Streaming`,`Byte Ranges`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`File upload and download seems simple — send a file, receive a file. But with large files, slow or flaky connections, and storage spread across many machines, it becomes one of the trickiest parts of a web application. This concept covers: how browsers send files over HTTP, how servers receive and store them, how cloud object storage (like Amazon S3) works, and how to serve files back to users efficiently.`},{type:`callout`,variant:`info`,text:`In simple terms: think of shipping furniture to a warehouse. You would not carry a sofa through the front office. Instead, the front desk (your API server) checks your paperwork and hands you a temporary gate pass (a presigned URL). You then drive straight to the warehouse loading dock (object storage). Later, local pick-up points (a CDN) keep copies so customers can collect items close to home.`},{type:`flow`,title:`The big picture — the API handles permission, storage handles the bytes`,code:`flowchart LR
  U([Browser]):::client -->|"1. may I upload photo.jpg?"| API[API server]:::server
  API -->|"2. presigned URL"| U
  U ==>|"3. file bytes, direct"| S3[(Object storage<br/>S3)]:::db
  S3 -.->|"4. upload event"| W[Worker<br/>scan, thumbnail]:::queue
  W -->|"5. mark ready"| DB[(Metadata DB)]:::db
  S3 --> CDN[CDN edge]:::network
  CDN -->|"6. fast downloads"| V([Viewers]):::client`,text:`The heavy file bytes never pass through your API server. It only hands out permission slips and keeps track of metadata.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`File handling is everywhere: profile pictures, document uploads, video uploads, data exports, report downloads. Each use case needs a different approach. A profile picture is small (under 5 MB) and can be checked right away. A 4K video might be 10 GB, so it must be uploaded in chunks that can resume after a dropped connection. A nightly data export should be streamed — sent piece by piece — rather than loaded into memory all at once.`},{type:`flow`,title:`Picking the right approach`,code:`flowchart TD
  F([A file needs to move]):::client --> D{Upload or download?}:::highlight
  D -->|"upload"| SZ{Bigger than ~100 MB?}:::server
  SZ -->|"no"| SIMPLE["Single PUT to a presigned URL"]:::db
  SZ -->|"yes"| CHUNK["Chunked multipart upload<br/>resumable"]:::db
  D -->|"download"| POP{Popular or public?}:::server
  POP -->|"yes"| CDN["Serve from a CDN"]:::network
  POP -->|"no, large or private"| STREAM["Stream in chunks<br/>or a signed download URL"]:::cache`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`How Browsers Send Files: multipart/form-data`},{type:`paragraph`,text:`When a browser submits a form with a file input, it uses the multipart/form-data encoding. The request body is split into "parts" — one per form field — separated by a unique marker called the boundary string. Each part has its own small headers (Content-Disposition says which field it is and the file name; Content-Type says what kind of data it is), followed by the data itself: plain text for normal fields, raw binary bytes for the file.`},{type:`code`,lang:`http`,code:`POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----Boundary7MA4YWxkTrZu0gW

------Boundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

My holiday photo
------Boundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="photo"; filename="beach.jpg"
Content-Type: image/jpeg

[binary data of the JPEG file]
------Boundary7MA4YWxkTrZu0gW--`},{type:`heading2`,text:`Chunked / Multipart Upload for Large Files`},{type:`paragraph`,text:`For large files (videos, datasets), sending the whole file in one request is unreliable: if the network drops at 95%, you start over from zero. Chunked upload breaks the file into small pieces (e.g., 8 MB each) and uploads each one separately. A failed chunk is simply retried on its own. Resumable uploads also remember which chunks already arrived, so after a disconnection you continue where you left off.`},{type:`flow`,title:`Chunked upload with retries`,code:`flowchart TD
  F([Large file]):::client --> SPLIT["Split into 8 MB chunks"]:::server
  SPLIT --> NEXT["Upload next chunk"]:::network
  NEXT --> OK{Chunk accepted?}:::highlight
  OK -->|"no, network error"| RETRY["Retry only this chunk"]:::cache
  RETRY --> NEXT
  OK -->|"yes"| MORE{More chunks left?}
  MORE -->|"yes"| NEXT
  MORE -->|"no"| DONE["Complete: storage<br/>joins chunks into one file"]:::db`},{type:`heading2`,text:`Object Storage (S3-like)`},{type:`paragraph`,text:`A traditional file system — folders on a single hard drive — does not scale to petabytes spread over thousands of servers. Object storage takes a simpler approach. Each file is stored as an "object" under a unique key (a name like uploads/uuid-photo.jpg), copies are spread across many storage machines, and you access it with plain HTTP: PUT to upload, GET to download. Amazon S3, Google Cloud Storage and Azure Blob Storage are all object stores.`},{type:`flow`,title:`Object storage — a key in, bytes out`,code:`flowchart LR
  C([Client]):::client -->|"PUT or GET uploads/uuid-photo.jpg"| GW[S3 HTTP endpoint]:::network
  GW --> IDX[(Key index<br/>which nodes hold it?)]:::cache
  IDX --> N1[(Storage node A)]:::db
  IDX --> N2[(Storage node B)]:::db
  IDX --> N3[(Storage node C)]:::db`,text:`There are no real folders — just a key mapped to bytes, stored as several copies on different machines so a single failure loses nothing.`},{type:`heading2`,text:`Presigned URLs — Secure Direct Upload`},{type:`paragraph`,text:`The naive pattern is client → API server → S3. Here the API server has to receive the entire file first, which costs bandwidth, uses up memory, and adds delay. The better pattern uses a presigned URL: a normal S3 link with a cryptographic signature and an expiry time added to it, which grants permission to upload one specific file. The client asks the API server for one, the server signs it with its S3 credentials (without sharing them), and the client uploads directly to S3. The API server never touches the file bytes.`},{type:`flow`,title:`Naive proxy vs presigned URL`,code:`flowchart TB
  subgraph Naive["Naive: file goes through the API"]
    C1([Client]):::client ==>|"10 GB"| A1[API server<br/>busy and memory-hungry]:::highlight
    A1 ==>|"10 GB again"| S1[(S3)]:::db
  end
  subgraph Better["Presigned: file skips the API"]
    C2([Client]):::client -->|"tiny metadata request"| A2[API server]:::server
    A2 -->|"signed URL, 15 min"| C2
    C2 ==>|"10 GB, direct"| S2[(S3)]:::db
  end`},{type:`heading2`,text:`Streaming vs. Loading into Memory`},{type:`paragraph`,text:`When a user downloads a 1 GB file, you do NOT load the whole 1 GB into server memory before sending it. You stream it: read a chunk from storage, send it to the client, read the next chunk, and repeat. This way the server only ever holds about one chunk (~8 MB) in memory, no matter how big the file is. With many users downloading at once, this is the difference between a healthy server and one that runs out of memory.`},{type:`flow`,title:`Streaming — one chunk in memory at a time`,code:`flowchart LR
  ST[(Storage<br/>1 GB file)]:::db -->|"read 8 MB"| BUF["Server buffer<br/>about 8 MB"]:::server
  BUF -->|"send chunk"| CL([Client]):::client
  CL -.->|"ready for more"| BUF
  BUF -.->|"read next chunk"| ST`,text:`Memory use stays flat at the chunk size instead of growing with the file size.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`File Upload Flow (Presigned URL Pattern)`},{type:`numbered`,items:[`User selects a file in the browser. Client JS gets file metadata (name, size, type).`,`Client calls: POST /api/upload-url {filename: "photo.jpg", contentType: "image/jpeg", size: 2048576}`,`API Server validates: auth token, file type whitelist (image/jpeg only), size limit (< 10 MB).`,`API Server generates a presigned S3 PUT URL (valid for 15 minutes): https://my-bucket.s3.amazonaws.com/uploads/uuid-photo.jpg?X-Amz-Signature=...`,`API Server creates a pending record in the database: {fileId: "uuid", status: "pending", ownerId: 123}`,`API Server returns the presigned URL and fileId to the client.`,`Client uploads the file binary directly to the S3 presigned URL (PUT request).`,`S3 validates the signature and stores the file.`,`S3 triggers an event notification (to SQS/Lambda): "Object uuid-photo.jpg uploaded."`,`Backend Lambda/worker receives the event: validate file, generate thumbnail, virus scan.`,`Worker updates database record: {status: "ready", url: "https://cdn.myapp.com/uploads/uuid-photo.jpg"}`,`Client polls or receives webhook: file is ready, display to user.`]},{type:`flow`,title:`Presigned upload, end to end`,code:`sequenceDiagram
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
  API-->>B: ready, show the file`,text:`Notice the API server only exchanges small JSON messages. The file itself goes straight from the browser to S3.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`HTTP Range Requests — The Basis of Streaming`},{type:`code`,lang:`http`,code:`# Request a specific byte range of a file
GET /video/movie.mp4 HTTP/1.1
Range: bytes=10485760-20971519  (10 MB to 20 MB)

# Server responds with just that range
HTTP/1.1 206 Partial Content
Content-Range: bytes 10485760-20971519/104857600
Content-Length: 10485760
Content-Type: video/mp4

[10 MB of video data]

# This is how video players seek to a specific timestamp
# without downloading the entire file first.`},{type:`flow`,title:`Seeking in a video with range requests`,code:`sequenceDiagram
  participant P as Video player
  participant S as File server or CDN
  P->>S: GET movie.mp4, Range bytes 0 to 10 MB
  S-->>P: 206 Partial Content, first 10 MB
  Note over P: user drags to the middle
  P->>S: GET movie.mp4, Range bytes 50 MB to 60 MB
  S-->>P: 206 Partial Content, just that slice`,text:`The player asks only for the bytes it needs. A status of 206 (instead of 200) means "here is part of the file".`},{type:`heading2`,text:`CDN for File Serving`},{type:`paragraph`,text:`Never serve large files from your origin server (your own servers or S3 bucket) directly to every user. Use a CDN (Content Delivery Network) — a network of cache servers, called edge nodes, placed in cities around the world. The first time someone in a region asks for a file, the nearby edge fetches it from the origin and keeps a copy. Everyone after that in the same region downloads it from the edge — much faster, and with no extra load on your origin.`},{type:`flow`,title:`CDN — hit or miss`,code:`flowchart LR
  U([User in Paris]):::client --> E{Paris edge:<br/>file cached?}:::network
  E -->|"hit"| FAST["Served from Paris<br/>fast, origin untouched"]:::highlight
  E -->|"miss, first request"| O[(Origin<br/>S3 bucket)]:::db
  O -->|"copy cached at edge"| E`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`YouTube-style Video Upload`},{type:`numbered`,items:[`Creator selects a 4 GB video file.`,`Browser JS splits it into 500 chunks of 8 MB each.`,`Client initiates multipart upload: POST /initiate-upload → get uploadId.`,`For each chunk: PUT /upload-part?uploadId=X&partNumber=N with 8 MB of data.`,`If network drops, resume from the last successful part number.`,`After all 500 parts uploaded: POST /complete-upload → S3 assembles the file.`,`Transcoding pipeline begins: encode to 360p, 480p, 720p, 1080p in parallel.`,`Each quality is split into 6-second HLS segments and uploaded to S3/CDN.`,`Creator is notified: "Your video is ready."`,`Viewers stream using HLS — downloading only the segments they are watching, at the quality their bandwidth supports.`]},{type:`flow`,title:`YouTube-style pipeline`,code:`flowchart TB
  CR([Creator: 4 GB video]):::client -->|"500 parts of 8 MB<br/>resumable"| S3[(S3 raw upload)]:::db
  S3 -->|"upload complete event"| Q[[Transcode queue]]:::queue
  Q --> T1[Encode 360p]:::server
  Q --> T2[Encode 720p]:::server
  Q --> T3[Encode 1080p]:::server
  T1 --> SEG["Split into 6-second<br/>HLS segments"]:::server
  T2 --> SEG
  T3 --> SEG
  SEG --> CDN[CDN]:::network
  CDN -->|"only the segments being watched"| V([Viewers]):::client`,text:`HLS (HTTP Live Streaming) lets the player switch quality segment by segment as the viewer’s bandwidth changes.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — upload path and download path`,code:`flowchart LR
  subgraph Upload["Upload"]
    C([Client]):::client -->|"1. metadata only"| API[API server<br/>signs URL]:::security
    API -->|"2. presigned URL"| C
    C ==>|"3. direct PUT"| S3[(Object storage)]:::db
    S3 -.->|"4. event"| W[Worker]:::queue
  end
  subgraph Download["Download"]
    W -->|"5. ready"| CDN[CDN edge]:::network
    CDN -->|"range requests"| V([Viewers]):::client
  end`,text:`Uploads go straight to storage with a short-lived permission. Downloads come from the CDN closest to the viewer.`},{type:`diagram`,diagram:{id:`diagram-file-storage-flow`,title:`Direct-to-Storage Presigned Upload & Streaming Architecture`,subtitle:`Bypassing API server bandwidth bottlenecks with S3 Presigned URLs, multipart streaming, and edge delivery`,nodes:[{id:`uploader-client`,name:`Client Browser / Application`,subtitle:`User Selects 500MB File`,type:`client`,icon:`ti-file-upload`,badge:`Client File`,protocol:`Metadata Request`,details:[`Reads file metadata locally: name: "video.mp4", size: 524288000 bytes, type: "video/mp4"`,`Does NOT upload file bytes to API server; requests upload authorization first`]},{id:`api-authorization`,name:`API Server (Presigned URL Generator)`,subtitle:`Cryptographic URL Generator`,type:`gateway`,icon:`ti-key`,badge:`Auth Server`,protocol:`HMAC-SHA256 Sign`,details:[`Authenticates user permissions and validates file extension and size quota`,`Generates temporary AWS S3 Presigned URL signed with AWS Secret Key (valid 15 minutes)`,`Returns presigned URL and fileId to client in < 20ms with ZERO file bytes passing through API server`]},{id:`cloud-object-store`,name:`Cloud Object Storage (AWS S3 / GCS)`,subtitle:`Scalable Distributed Blob Store`,type:`storage`,icon:`ti-cloud-upload`,badge:`Object Store`,protocol:`Direct PUT Stream`,details:[`Client uploads file bytes directly to S3 via HTTP PUT with Content-Type: video/mp4`,`For files > 100MB: client splits file into 10MB chunks and uploads in parallel via S3 Multipart Upload`,`Stores object across multiple availability zones with 99.999999999% (11 9s) durability`]},{id:`s3-event-worker`,name:`Async Event Worker (Lambda / Queue)`,subtitle:`Post-Upload Background Processing`,type:`server`,icon:`ti-bolt`,badge:`Event Worker`,protocol:`s3:ObjectCreated`,details:[`S3 fires event notification webhook upon successful upload completion`,`Worker validates file magic numbers (prevents renamed malware), runs virus scan, and transcodes video`,`Updates metadata record in primary database: status = "READY"`]},{id:`cdn-download-edge`,name:`Global CDN & Download Delivery`,subtitle:`CloudFront Edge Distribution`,type:`database`,icon:`ti-cloud-download`,badge:`Download Edge`,protocol:`Range Requests / CDN`,details:[`Public downloads served from nearest CDN edge node; caches popular files globally`,`Private files protected by signed CloudFront cookies or signed download URLs`,`Supports HTTP Range requests (206 Partial Content) for seeking video playback`]}],connections:[{from:`uploader-client`,to:`api-authorization`,label:`1. POST /api/upload-url (Metadata only)`,protocol:`JSON REST`},{from:`api-authorization`,to:`uploader-client`,label:`2. Return Presigned S3 URL`,protocol:`200 OK`},{from:`uploader-client`,to:`cloud-object-store`,label:`3. Direct PUT Stream (Bypass API)`,protocol:`Binary Stream`},{from:`cloud-object-store`,to:`s3-event-worker`,label:`4. s3:ObjectCreated Event`,protocol:`Async Webhook`},{from:`s3-event-worker`,to:`cdn-download-edge`,label:`5. Ready for Global CDN Delivery`,protocol:`Edge Sync`}],keyTakeaways:[`Presigned URLs are Essential: Uploading files through your API server consumes server RAM, ties up worker threads, and racks up costly bandwidth. Presigned URLs offload 100% of binary file transfer to S3.`,`Multipart Upload: For files > 100MB, multipart uploads upload chunks concurrently (faster) and can retry individual failed chunks without restarting the entire 500MB upload from scratch.`,`Streaming vs Buffering: When reading or downloading files in backend code, always stream chunks using streams or pipes. Buffering an entire 1GB file into RAM will crash your Node.js or Python process with an out-of-memory error.`],rawSpec:`UPLOAD (Presigned URL pattern):
Browser \u2500\u2500POST /api/upload-url\u2500\u2500> API Server
                                      \u2502
                                      \u2502 Generate presigned URL
                                      \u2502
Browser <\u2500\u2500 {presignedUrl, fileId} \u2500\u2500\u2518
  \u2502
  \u2502  PUT <presigned S3 URL> (file bytes)
  \u25BC
S3 (validates signature, stores file)
  \u2502
  \u2502  Event notification
  \u25BC
Lambda/Worker (validate, thumbnail, virus scan)
  \u2502
  \u2502  Update DB: status = "ready"
  \u25BC
Database

DOWNLOAD (CDN pattern):
Browser \u2500\u2500GET /files/photo.jpg\u2500\u2500> CloudFront CDN
                                      \u2502
                                      \u2502 (Cache HIT)
                                      \u25BC
Browser <\u2500\u2500 200 OK (file bytes) \u2500\u2500\u2500\u2500\u2500\u2500\u2518`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Checksums for Data Integrity`},{type:`paragraph`,text:`File data can be corrupted in transit (network errors, partial writes). A checksum is a short "fingerprint" calculated from a file’s bytes (using an algorithm like MD5 or SHA-256) — change even one byte and the fingerprint changes. Compute it before upload and check it after. S3 supports this via the Content-MD5 header: if the bytes it received do not produce the same fingerprint, S3 rejects the upload. For large multipart uploads, each part has its own checksum and S3 verifies each one separately.`},{type:`heading2`,text:`Storage Tiers and Cost Optimization`},{type:`bullets`,items:[`S3 Standard: Frequently accessed files. Milliseconds retrieval. Expensive.`,`S3 Standard-IA (Infrequent Access): Lower cost for files accessed monthly. Small retrieval fee.`,`S3 Glacier: For archival. Retrievals take minutes to hours. Very cheap.`,`S3 Lifecycle policies: Automatically move objects: Standard → IA after 30 days → Glacier after 90 days → Delete after 7 years.`]},{type:`flow`,title:`A lifecycle policy moving files to cheaper storage`,code:`flowchart LR
  STD["S3 Standard<br/>hot, fast, pricey"]:::highlight -->|"after 30 days"| IA["Standard-IA<br/>cheaper, retrieval fee"]:::cache
  IA -->|"after 90 days"| GL["Glacier<br/>very cheap, slow to restore"]:::db
  GL -->|"after 7 years"| DEL["Deleted"]`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "Files should be stored in the database." Reality: Storing large files (BLOBs) in PostgreSQL bloats the database, slows backups, and is massively inefficient. Use object storage (S3) and store only the file URL in the database.`,`Myth: "My API server should handle file uploads." Reality: API servers are not designed for large file transfers. They tie up connections, consume memory, and create a bandwidth bottleneck. Use presigned URLs for direct client-to-storage uploads.`,`Myth: "Downloading a file loads it all into memory." Reality: Streaming reads and sends data in chunks. A 100 GB download uses only ~8 MB of server memory at any moment.`,`Myth: "File upload is complete when the browser says so." Reality: The upload to your API server is complete, but the file may still need processing (virus scan, format validation, transcoding). Always validate server-side before marking a file as "ready."`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`Designing a file storage system (Dropbox/S3): Chunked upload, metadata database separate from data, deduplication using content hash, CDN for serving.`,`Video processing pipeline: Upload → Kafka event → Transcoding workers (GPU) → Multiple quality levels → CDN.`,`Image processing: Upload → Lambda triggered by S3 event → Generate thumbnails (multiple sizes) → Store back in S3.`,`Cost optimization: Pre-signed uploads bypass API bandwidth cost. CDN caching reduces S3 GET request costs. Lifecycle policies reduce storage cost over time.`,`Security: Validate file type on server (never trust client-side validation). Virus scan uploaded files. Use private S3 buckets with presigned URLs for access-controlled files.`]},{type:`callout`,variant:`tip`,text:`In system design interviews, always suggest presigned URLs for file uploads. It shows you understand: security (no credential exposure), efficiency (bypass API layer), scalability (S3 scales infinitely), and cost (no API bandwidth for file data). This one pattern demonstrates all four system design priorities at once.`}]}]},{id:`how-caching-works`,title:`How Caching Works`,emoji:`🧊`,icon:`ti-bolt`,color:`#ef4444`,bg:`#fee2e2`,accentGlow:`rgba(239,68,68,0.15)`,difficulty:`Intermediate`,tagline:`Browser, CDN, Redis and buffer pool — how keeping copies close makes systems fast, and why invalidation is the hard part.`,tags:[`HTTP Caching`,`CDN`,`Redis`,`Cache-Aside`,`Eviction`,`Invalidation`],estimatedTime:`45 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`A cache is a small, fast store that keeps copies of data you are likely to need again, so you do not have to fetch or compute it from the slow, authoritative source (the "source of truth", usually a database or an origin server) every time. Reading a cached copy is a cache hit. Not finding it — and having to go to the source — is a cache miss.`},{type:`callout`,variant:`info`,text:`In simple terms: caching is like keeping a water bottle on your desk instead of walking to the kitchen every time you are thirsty. The kitchen (the database) always has water, but the walk is slow. The bottle (the cache) is small and right next to you. The catch: the bottle can run empty (a miss), and if someone changes what comes out of the tap, the water in your bottle is now stale.`},{type:`flow`,title:`The big picture — copies at every layer`,code:`flowchart LR
  U([User]):::client --> BR["Browser cache<br/>0 ms"]:::cache
  BR -->|"miss"| CDN["CDN edge<br/>~10-30 ms"]:::cache
  CDN -->|"miss"| RP["Reverse proxy cache"]:::network
  RP -->|"miss"| APP["App server<br/>in-process cache"]:::server
  APP -->|"miss"| R[("Redis<br/>~0.5-1 ms")]:::cache
  R -->|"miss"| DB[("Database<br/>buffer pool + disk")]:::db`,text:`A request walks inward only as far as it has to. Every layer that answers saves all the work behind it.`},{type:`heading2`,text:`Why Caches Work at All: Locality`},{type:`bullets`,items:[`Temporal locality: something used now is likely to be used again soon (today’s trending product, your own profile).`,`Skewed popularity: in most real systems a small fraction of items gets most of the traffic — often roughly 20% of keys serve 80% or more of reads. Caching just the hot set gives most of the benefit.`,`Expensive to produce, cheap to copy: a page that takes 200 ms to render from 15 queries can be stored as one 40 KB blob and served in a millisecond.`]}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Every layer of storage trades size for speed. Memory is tiny and fast, disks and networks are big and slow, and the gaps are enormous. Caching lets you serve most requests from the fast end while keeping the full data set on the slow end.`},{type:`heading2`,text:`Latency Numbers Worth Remembering (rough orders of magnitude)`},{type:`bullets`,items:[`L1 CPU cache reference: ~1 ns.`,`Main memory (RAM) reference: ~100 ns.`,`Lookup in an in-process hash map: well under 1 µs.`,`Redis GET inside the same data centre: roughly 0.2–1 ms (mostly network round trip).`,`Random read from an SSD: roughly 0.1 ms (100 µs).`,`Indexed database query over the network: roughly 1–10 ms; a heavy join or aggregate: 50 ms to seconds.`,`Round trip from a user to a nearby CDN edge: roughly 10–30 ms.`,`Round trip across an ocean to a far-away origin: roughly 100–250 ms.`]},{type:`heading2`,text:`Four Things a Cache Buys You`},{type:`numbered`,items:[`Lower latency: a 2 ms Redis hit instead of a 40 ms database query, or a 15 ms CDN hit instead of a 200 ms trip to the origin.`,`Higher throughput at lower cost: one Redis node can handle on the order of 100,000+ simple operations per second; the same reads on a relational database would need several replicas.`,`Protection for the backend: with a 95% hit ratio, the database sees only 1 in 20 reads. Traffic can grow 10x while the database barely notices.`,`Resilience: some caches can keep serving slightly stale content when the origin is down (stale-if-error), turning an outage into a minor degradation.`]},{type:`flow`,title:`What a 95% hit ratio does to the database`,code:`flowchart LR
  T(["10,000 reads/s"]):::client --> C{"Cache<br/>95% hit ratio"}:::cache
  C -->|"9,500 hits/s<br/>~1 ms each"| FAST([Fast responses]):::highlight
  C -->|"500 misses/s"| DB[("Database<br/>~20 ms each")]:::db
  DB -->|"fill cache"| C`,text:`The database only has to handle the 5% of reads that miss. Average latency ≈ 0.95 × 1 ms + 0.05 × 21 ms ≈ 2 ms.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Every Cache Answers the Same Four Questions`},{type:`numbered`,items:[`Key: how do I name an entry? (a URL plus some headers, "product:42", a SQL page number)`,`Fill: when does data get into the cache? (on a miss, on every write, or ahead of time)`,`Freshness: how long is a copy trusted? (a TTL — time to live — or an explicit invalidation)`,`Eviction: when the cache is full, what gets thrown out? (LRU, LFU, FIFO …)`]},{type:`heading2`,text:`HTTP Caching — Browser and CDN`},{type:`paragraph`,text:`Browsers, CDNs and reverse proxies all follow the same HTTP caching rules (RFC 9111). The server attaches headers to a response saying who may store it and for how long. Within that time the copy is "fresh" and can be reused without asking the server. After that it is "stale" and must be revalidated — the cache asks the server "has this changed?" and gets back either a tiny 304 Not Modified or the new content.`},{type:`bullets`,items:[`Cache-Control: max-age=3600 → any cache may reuse this for 3600 seconds (1 hour).`,`Cache-Control: s-maxage=600 → overrides max-age for shared caches only (CDNs, proxies). Lets the CDN keep it 10 minutes while browsers use max-age.`,`Cache-Control: no-cache → you MAY store it, but must revalidate with the server before every reuse. It does NOT mean "do not cache".`,`Cache-Control: no-store → do not store this anywhere, at all. Use for truly sensitive responses (bank statements, one-time tokens).`,`Cache-Control: private → only the user’s own browser may store it; CDNs and shared proxies must not. public → shared caches may store it, even for requests that normally would not be cacheable (for example ones with an Authorization header).`,`Cache-Control: immutable → this exact URL will never change, so do not even revalidate while fresh. Used with fingerprinted files like app.3f9a2c.js and max-age=31536000 (one year).`,`stale-while-revalidate=60 → after expiry, a cache may serve the stale copy for up to 60 more seconds while it refreshes in the background.`]},{type:`callout`,variant:`warning`,text:`The most common HTTP caching mistake in interviews and in production: saying no-cache when you mean no-store. no-cache = "store it, but check with me before using it". no-store = "never write it down".`},{type:`heading2`,text:`Validators: ETag and Last-Modified`},{type:`paragraph`,text:`A validator lets a cache cheaply check whether its stale copy is still good. The server sends ETag: "v42-abc" (an opaque version fingerprint) and/or Last-Modified: a date. When the copy goes stale, the cache sends If-None-Match: "v42-abc" (or If-Modified-Since: that date). If nothing changed the server answers 304 Not Modified with no body — a few hundred bytes instead of the whole resource — and the cache marks its copy fresh again.`},{type:`flow`,title:`Fresh, stale, and revalidation with ETag`,code:`sequenceDiagram
  participant B as Browser cache
  participant S as Server
  B->>S: GET /api/product/42
  S-->>B: 200 OK, Cache-Control max-age=60, ETag "v7", 40 KB body
  Note over B: For 60 s the copy is fresh, reused with no request at all
  Note over B: After 60 s the copy is stale
  B->>S: GET /api/product/42, If-None-Match "v7"
  alt unchanged
    S-->>B: 304 Not Modified, no body
    Note over B: Copy is fresh again for 60 s
  else changed
    S-->>B: 200 OK, ETag "v8", new body
  end`,text:`Revalidation still costs a round trip, but saves the bandwidth and the server work of producing the full response.`},{type:`heading2`,text:`Application Caching — Cache-Aside`},{type:`paragraph`,text:`Inside the backend, the most common pattern is cache-aside (also called lazy loading): the application checks the cache first; on a miss it reads the database, stores the result in the cache with a TTL, and returns it. On a write, it updates the database and then deletes the cache key so the next read reloads fresh data.`},{type:`code`,lang:`typescript`,code:`async function getProduct(id: string): Promise<Product> {
  const key = \`product:v3:\${id}\`;

  // 1. Try the cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached); // HIT (~1 ms)

  // 2. MISS \u2192 go to the source of truth
  const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);

  // 3. Fill the cache with a TTL (+ jitter so keys don't all expire together)
  const ttl = 300 + Math.floor(Math.random() * 60);
  await redis.set(key, JSON.stringify(product), 'EX', ttl);
  return product;
}

async function updatePrice(id: string, price: number) {
  await db.query('UPDATE products SET price = $1 WHERE id = $2', [price, id]);
  await redis.del(\`product:v3:\${id}\`); // invalidate \u2014 don't try to patch the cached copy
}`},{type:`flow`,title:`Cache-aside read and write paths`,code:`flowchart TD
  R([Read product 42]):::client --> G{"GET product:42<br/>in Redis?"}:::cache
  G -->|"hit"| RET([Return cached value]):::highlight
  G -->|"miss"| Q[("SELECT from database")]:::db
  Q --> SET["SET product:42 with TTL"]:::cache
  SET --> RET
  W([Update price]):::client --> U[("UPDATE database")]:::db
  U --> DEL["DEL product:42"]:::cache`,text:`Delete, don’t update: deleting the key after the database write is simpler and avoids writing a stale value back into the cache if two updates race.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`The Five Caching Patterns`},{type:`bullets`,items:[`Cache-aside (lazy loading): the app talks to both cache and database and fills the cache on a miss. Only requested data is cached; a cache outage just makes things slower. Downside: the first request for each key is slow, and there is a small window where cache and DB disagree.`,`Read-through: the app only talks to the cache; the cache library itself loads from the database on a miss (e.g. a Caffeine LoadingCache, or a CDN pulling from origin). Same behaviour as cache-aside, but the loading logic lives in one place.`,`Write-through: every write goes to the cache and the database in the same request. The cache is always warm and consistent for those keys, but writes are slower and you cache data nobody may ever read.`,`Write-behind (write-back): the write lands in the cache and is acknowledged immediately; the cache flushes to the database later, often in batches. Fastest writes, absorbs bursts — but if the cache node dies before flushing, those writes are lost. Used for counters, metrics, view counts; rarely for money.`,`Refresh-ahead: the cache reloads hot entries shortly before they expire (e.g. when 80% of the TTL has passed and the key is still being read), so popular keys never miss. Costs extra loads for keys that turn out not to be needed.`]},{type:`flow`,title:`Write-through vs write-behind`,code:`sequenceDiagram
  participant App
  participant C as Cache
  participant DB as Database
  Note over App,DB: Write-through
  App->>C: SET price = 19.99
  C->>DB: UPDATE price = 19.99
  DB-->>C: OK
  C-->>App: OK (after both writes)
  Note over App,DB: Write-behind
  App->>C: INCR views
  C-->>App: OK (immediately)
  Note over C: buffer many updates
  C->>DB: flush batch every few seconds`,text:`Write-through pays the database latency on every write. Write-behind hides it — at the price of a durability gap.`},{type:`flow`,title:`Refresh-ahead keeps hot keys from ever missing`,code:`flowchart LR
  REQ([Read hot key]):::client --> C{"Key age vs TTL"}:::cache
  C -->|"under 80% of TTL"| SERVE([Serve from cache]):::highlight
  C -->|"over 80% of TTL"| BOTH["Serve cached value<br/>and trigger async reload"]:::cache
  BOTH -.->|"background"| DB[("Database")]:::db
  DB -.->|"new value, new TTL"| C`},{type:`heading2`,text:`Eviction — What Gets Thrown Out When Memory Is Full`},{type:`bullets`,items:[`LRU (Least Recently Used): drop the entry not touched for the longest time. The default almost everywhere; implemented with a hash map plus a doubly linked list for O(1) get and put. Redis uses an approximated LRU (allkeys-lru) by sampling a few keys rather than keeping a perfect list.`,`LFU (Least Frequently Used): drop the entry with the fewest hits. Better when popularity is stable over long periods; resists one-off scans that would flush an LRU cache. Redis offers allkeys-lfu with decaying counters so old popularity fades.`,`FIFO: drop the oldest inserted entry regardless of use. Simple and cheap, usually a worse hit ratio.`,`TTL-based expiry: every entry has a deadline and is removed (or treated as stale) after it. Not really an eviction policy — it is about freshness — but in practice most caches combine a TTL with LRU or LFU.`,`Modern hybrids (W-TinyLFU in Caffeine, ARC, 2Q) mix recency and frequency and typically beat plain LRU on real workloads.`]},{type:`flow`,title:`LRU in action — capacity 3`,code:`flowchart LR
  S1["get A, B, C<br/>order: C B A"]:::cache --> S2["get A<br/>order: A C B"]:::cache
  S2 --> S3["put D, cache full<br/>evict B (least recent)"]:::highlight
  S3 --> S4["order: D A C"]:::cache`,text:`Reading A moved it to the front, so B — untouched the longest — is the one evicted when D arrives.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`The Cache Layers, Outside In`},{type:`bullets`,items:[`Browser HTTP cache: memory and disk cache inside each user’s browser, controlled by Cache-Control, ETag and Last-Modified. Private to one user. Fastest possible hit — no network at all.`,`Service worker cache: a script the site installs in the browser that intercepts requests and answers from the Cache Storage API. The app decides the strategy (cache-first, network-first, stale-while-revalidate). Powers offline support in PWAs.`,`CDN edge cache: hundreds of shared caches near users (Cloudflare, CloudFront, Fastly, Akamai). Honours s-maxage and public/private, and supports purging by URL or tag.`,`Reverse proxy cache: Nginx proxy_cache, Varnish, or the gateway in front of your app servers. A shared cache inside your own data centre, often for rendered HTML or API responses.`,`In-process (local) cache: a hash map with eviction inside each app server process (Caffeine, Guava, node-lru-cache). Nanoseconds to read, but each server has its own copy, so they can disagree and memory is duplicated.`,`Distributed cache: a separate cluster shared by all app servers — Redis (rich data types, persistence options, replication) or Memcached (simple, multi-threaded key-value). ~1 ms over the network, one shared copy.`,`Database caches: the buffer pool keeps hot 8 KB pages in RAM (see How Databases Work); the OS page cache sits below it. MySQL’s old query cache was removed in 8.0 because invalidating it on every write hurt more than it helped — a lesson in itself.`]},{type:`flow`,title:`Local cache vs distributed cache`,code:`flowchart TB
  subgraph LOCAL["In-process caches - one per server"]
    A1["App 1<br/>local map"]:::server
    A2["App 2<br/>local map"]:::server
    A3["App 3<br/>local map"]:::server
  end
  subgraph SHARED["Distributed cache - one shared copy"]
    R[("Redis cluster")]:::cache
  end
  A1 --> R
  A2 --> R
  A3 --> R
  R -->|"miss"| DB[("Database")]:::db`,text:`Many systems use both: a tiny local cache with a few seconds of TTL for the hottest keys (L1), backed by Redis (L2), backed by the database.`},{type:`heading2`,text:`Redis vs Memcached at a Glance`},{type:`bullets`,items:[`Data model: Redis — strings, hashes, lists, sets, sorted sets, streams. Memcached — strings only.`,`Threads: Redis executes commands on a single main thread (with I/O threads in newer versions). Memcached is multi-threaded and scales across cores on one box.`,`Durability: Redis can snapshot (RDB) or log (AOF) to disk and replicate. Memcached is purely in-memory.`,`Typical choice: Redis by default; Memcached when you need a dead-simple, very large, multi-threaded blob cache.`]},{type:`heading2`,text:`Cache Keys`},{type:`paragraph`,text:`The cache key decides what counts as "the same request". A CDN’s default key is usually host + path + query string. If a response differs by language or encoding, the server must say so with the Vary header (Vary: Accept-Encoding, Accept-Language) or the CDN may serve German HTML to a French user. Too many key variations (for example including a tracking query parameter like utm_source) fragments the cache and kills the hit ratio; good CDNs let you normalise or strip those.`},{type:`callout`,variant:`tip`,text:`Put a version in application cache keys — product:v3:42. When the cached shape changes in a deploy, bump to v4 and old entries simply age out instead of crashing the new code.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`An E-commerce Product Page, Layer by Layer`},{type:`paragraph`,text:`A shopper in Berlin opens shop.example.com/p/42 (a pair of running shoes). The origin runs in us-east. The page is built from: static JS/CSS/images, an HTML shell, a product JSON API (name, description, price, stock), and a personalised part (cart count, "recommended for you"). Each part gets a different caching policy.`},{type:`numbered`,items:[`Static assets (app.8d1f.js, shoe-42.webp): fingerprinted filenames, Cache-Control: public, max-age=31536000, immutable. On a repeat visit the browser uses its own copy — 0 ms, no request. On a first visit the Frankfurt CDN edge serves them in roughly 15–25 ms.`,`HTML shell: Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=60. Browsers always revalidate, the CDN keeps it 5 minutes. A CDN hit costs roughly 20 ms instead of a roughly 120 ms trip to us-east plus render time.`,`Product API GET /api/products/42: s-maxage=60 at the CDN. On a CDN miss the request crosses the Atlantic (~90–120 ms round trip) to the API.`,`The API checks Redis (key product:v3:42). A hit costs roughly 1 ms. A miss runs 3 SQL queries (product, variants, reviews summary) — roughly 25–40 ms — then stores the result with a 5-minute TTL.`,`Stock level is cached for only 10 seconds, because overselling is expensive. The final "add to cart" and checkout always read the database directly, inside a transaction.`,`Cart count and recommendations: Cache-Control: private, no-cache (or fetched client-side), never stored at the CDN. Recommendations are cached per user in Redis for a few minutes.`]},{type:`flow`,title:`Product page — where each part is served from`,code:`flowchart LR
  B([Browser in Berlin]):::client -->|"assets: 0 ms, own cache"| BC["Browser cache"]:::cache
  B -->|"HTML + product API"| E["CDN edge Frankfurt<br/>~20 ms"]:::cache
  E -->|"miss only, ~100 ms"| API["API in us-east"]:::server
  API -->|"~1 ms"| R[("Redis")]:::cache
  R -.->|"miss, ~30 ms"| DB[("PostgreSQL")]:::db
  B -->|"cart: private, never at CDN"| API`},{type:`heading2`,text:`What the Numbers Add Up To`},{type:`bullets`,items:[`Best case (everything hit at the edge, repeat visitor): roughly 20–40 ms for HTML and API, assets free.`,`CDN miss, Redis hit: roughly 20 ms + 100 ms trans-Atlantic + 1 ms Redis + a few ms app time ≈ 130 ms.`,`CDN miss, Redis miss: ≈ 160 ms+ and three database queries.`,`With a 90% CDN hit ratio and a 95% Redis hit ratio, only 0.1 × 0.05 = 0.5% of product reads ever reach PostgreSQL.`]},{type:`callout`,variant:`important`,text:`When the merchant changes the price, the system writes to PostgreSQL, deletes product:v3:42 in Redis, and sends a CDN purge for the tag product-42. Without that purge the CDN could show the old price for up to s-maxage (60 s) — so decide per field how much staleness the business can tolerate.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — a read falling through the cache layers`,code:`flowchart TB
  C([Client]):::client -->|"1. fresh copy?"| BC["Browser cache"]:::cache
  BC -->|"2. miss or stale"| CDN["CDN edge"]:::cache
  CDN -->|"3. miss"| APP["App server + local cache"]:::server
  APP -->|"4. miss"| RD[("Redis")]:::cache
  RD -->|"5. miss"| DB[("Database + buffer pool")]:::db
  DB -->|"6. fill every layer on the way back"| C`,text:`The step cards below describe what each layer stores, for how long, and how it is invalidated.`},{type:`diagram`,diagram:{id:`diagram-caching-layers`,title:`Multi-Layer Caching Architecture for a Product Page`,subtitle:`How a read traverses browser cache, CDN edge, application cache, Redis and the database — and how each layer is kept fresh`,nodes:[{id:`browser-cache`,name:`Browser HTTP Cache & Service Worker`,subtitle:`Private, Per-User Cache`,type:`client`,icon:`ti-browser`,badge:`L0: Browser`,protocol:`Cache-Control / ETag`,details:[`Fingerprinted assets cached for a year with immutable — zero requests on repeat visits`,`Stale entries revalidated with If-None-Match → 304 Not Modified (no body)`,`Holds private responses (cart, profile) that shared caches must never store`]},{id:`cdn-edge`,name:`CDN Edge Point of Presence`,subtitle:`Shared Cache Close to Users`,type:`network`,icon:`ti-cloud`,badge:`L1: Edge`,protocol:`s-maxage / purge`,details:[`Cache key = host + path + normalised query + Vary headers`,`Serves HTML shell and public API responses in roughly 10–30 ms`,`Invalidated by TTL expiry or an explicit purge by URL or surrogate tag`]},{id:`app-local-cache`,name:`Application Server In-Process Cache`,subtitle:`Per-Instance Memory Map`,type:`server`,icon:`ti-server`,badge:`L2: Local`,protocol:`Caffeine / LRU map`,details:[`Sub-microsecond reads for the very hottest keys (config, feature flags, top products)`,`Short TTL (a few seconds) because each instance can drift from the others`,`Request coalescing ensures one database load per key per instance`]},{id:`redis-cluster`,name:`Distributed Cache (Redis Cluster)`,subtitle:`Shared Across All App Servers`,type:`cache`,icon:`ti-bolt`,badge:`L3: Redis`,protocol:`GET / SET EX`,details:[`Cache-aside: GET, on miss load from DB, SET with jittered TTL`,`Writes delete the key after the database commit`,`allkeys-lru or allkeys-lfu eviction when maxmemory is reached`]},{id:`database-layer`,name:`Database with Buffer Pool`,subtitle:`Source of Truth`,type:`database`,icon:`ti-database`,badge:`Origin`,protocol:`SQL`,details:[`Only sees the small fraction of reads that missed every layer above`,`Its own buffer pool caches hot pages in RAM — the last cache before disk`,`All writes land here first; caches are copies, never the authority`]}],connections:[{from:`browser-cache`,to:`cdn-edge`,label:`1. Miss or Stale → Request`,protocol:`HTTPS`},{from:`cdn-edge`,to:`app-local-cache`,label:`2. Edge Miss → Origin Fetch`,protocol:`HTTPS`},{from:`app-local-cache`,to:`redis-cluster`,label:`3. Local Miss → Shared Cache`,protocol:`RESP over TCP`},{from:`redis-cluster`,to:`database-layer`,label:`4. Redis Miss → Query + Fill`,protocol:`SQL`}],keyTakeaways:[`Each layer trades freshness for speed differently: the closer to the user, the faster the hit but the harder it is to invalidate.`,`Hit ratios multiply: 90% at the CDN and 95% in Redis means only 0.5% of reads reach the database.`,`Writes always go to the source of truth first; caches are then invalidated (delete key, purge CDN), never treated as the authority.`],rawSpec:`GET /p/42 from Berlin

[Browser cache]  assets: immutable, 1 year   \u2192 hit: 0 ms
      \u2502 miss / stale
      \u25BC
[CDN edge FRA]   HTML s-maxage=300, API s-maxage=60 \u2192 hit: ~20 ms
      \u2502 miss (~100 ms trans-Atlantic)
      \u25BC
[App server]     local LRU, TTL 5 s           \u2192 hit: < 1 \xB5s
      \u2502 miss
      \u25BC
[Redis]          product:v3:42, TTL 300 \xB1 60 s \u2192 hit: ~1 ms
      \u2502 miss
      \u25BC
[PostgreSQL]     3 queries, buffer pool        \u2192 ~30 ms

Write path: UPDATE DB \u2192 DEL product:v3:42 \u2192 CDN purge tag product-42`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Why Invalidation Is Hard`},{type:`paragraph`,text:`"There are only two hard things in computer science: cache invalidation and naming things." A cache is a copy, and the moment the original changes, every copy is wrong until something fixes it. The difficulty comes from: copies in many places (thousands of browsers you cannot reach), derived data (one product change affects the product page, category listing and search results), and races between concurrent reads and writes.`},{type:`bullets`,items:[`TTL expiry: simplest. Accept up to TTL seconds of staleness. Pick the TTL per data type based on how wrong you can afford to be.`,`Explicit delete on write: after the database write, delete the cache key. Fast convergence for keys you can name.`,`Event-driven invalidation: the database change stream (CDC, e.g. Debezium reading the write-ahead log) publishes events and a consumer deletes affected keys. Catches writes from every service, not just one code path.`,`Versioned keys or URLs: never change data under an existing key — write to a new key (app.8d1f.js, product:v3:42@rev17). Old copies become unreachable rather than wrong.`,`Tag-based purge at the CDN: label responses with surrogate keys (product-42, category-shoes) and purge everything carrying a tag in one call.`]},{type:`flow`,title:`The race that leaves a stale value in cache-aside`,code:`sequenceDiagram
  participant R as Reader
  participant C as Redis
  participant DB as Database
  participant W as Writer
  R->>C: GET product:42
  C-->>R: miss
  R->>DB: SELECT price
  DB-->>R: 10 (old)
  W->>DB: UPDATE price = 12
  W->>C: DEL product:42
  R->>C: SET product:42 = 10
  Note over C: stale 10 stays until the TTL expires`,text:`The reader loaded the old value just before the write and stored it just after the delete. Short TTLs bound the damage; some teams delete twice (once more a moment later) or use versioned values to reject older writes.`},{type:`heading2`,text:`Cache Stampede (Thundering Herd)`},{type:`paragraph`,text:`A very hot key expires — say the homepage feed, read 20,000 times a second. In the next 50 ms, a thousand requests all miss at once and all run the same expensive query against the database, which can tip it over. Defences:`},{type:`bullets`,items:[`Request coalescing (single-flight): within a process, only the first miss for a key actually loads it; the others wait for and share that one result. CDNs do the same ("collapsed forwarding").`,`Distributed lock: SET lock:key NX EX 5 in Redis — whoever gets the lock rebuilds the value; everyone else briefly waits or serves the old value.`,`Stale-while-revalidate: keep serving the expired value while one background task refreshes it. Users see slightly stale data instead of a slow page.`,`Jittered TTLs: add randomness (300 s ± 60 s) so keys written together do not all expire together.`,`Probabilistic early refresh: each reader has a small, increasing chance of refreshing the key as it nears expiry, so one request refreshes it early.`]},{type:`flow`,title:`Stampede vs single-flight`,code:`flowchart LR
  subgraph NO["Without protection"]
    direction TB
    M1(["1,000 misses"]):::client --> D1[("1,000 identical queries")]:::db
  end
  subgraph YES["With single-flight"]
    direction TB
    M2(["1,000 misses"]):::client --> SF{"First caller loads,<br/>others wait"}:::highlight
    SF -->|"1 query"| D2[("Database")]:::db
    D2 --> SHARE(["Result shared with all 1,000"]):::cache
  end`},{type:`heading2`,text:`Hot Keys, Penetration, and Avalanche`},{type:`bullets`,items:[`Hot key: one key (a celebrity profile, a flash-sale item) gets so much traffic that the single Redis shard holding it saturates, even though the cluster is idle. Fixes: a short-TTL local cache in front of Redis, or replicate the key under several names (item:42#1 … item:42#8) and read a random copy.`,`Cache penetration: requests for keys that do not exist (id=-1, random IDs from a bot) always miss and always hit the database. Fixes: negative caching — store "not found" with a short TTL (e.g. 60 s) — and a Bloom filter of valid IDs that rejects impossible keys before any lookup.`,`Cache avalanche: a large fraction of the cache disappears at once — a Redis node restarts empty, or a bulk load set the same TTL on a million keys. The database receives the full read load it was never sized for. Fixes: jittered TTLs, replicas and persistence for the cache, warming the cache before taking traffic, and rate limiting or circuit breakers in front of the database.`]},{type:`flow`,title:`Stopping cache penetration`,code:`flowchart TD
  Q([GET product 99999999]):::client --> BF{"Bloom filter:<br/>could this ID exist?"}:::security
  BF -->|"definitely not"| NF([404 immediately, no DB]):::highlight
  BF -->|"maybe"| C{"In cache?"}:::cache
  C -->|"hit, incl. cached not-found"| RET([Return]):::client
  C -->|"miss"| DB[("Database")]:::db
  DB -->|"found: cache 5 min<br/>not found: cache 60 s"| C`,text:`A Bloom filter can say "definitely not" or "maybe", never a false "no", so it never wrongly blocks a real product.`},{type:`heading2`,text:`Hit Ratio and Sizing`},{type:`paragraph`,text:`Hit ratio = hits ÷ (hits + misses). Redis exposes keyspace_hits and keyspace_misses in INFO stats; CDNs report it per URL pattern. Track it alongside eviction rate and p99 latency. A falling hit ratio with rising evictions means the cache is too small for the working set (the data actually being read in a period). To size: estimate the hot set (e.g. 2 million active products × 4 KB ≈ 8 GB), add room for overhead and growth (×1.5–2), and confirm with real hit-ratio curves — going from 8 GB to 16 GB may only lift hit ratio from 94% to 96%.`},{type:`callout`,variant:`tip`,text:`Measure hit ratio by request volume, not by key count, and per key prefix. A 99% overall hit ratio can hide a 40% hit ratio on the one endpoint that is hammering the database.`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "Cache-Control: no-cache disables caching." Reality: no-cache allows storing but requires revalidation before every use. no-store is the one that forbids storing.`,`Myth: "Adding a cache always makes things faster." Reality: a cache with a low hit ratio adds a network hop to every request and makes misses slower. Caching data that is read once, or changes on every read, is pure overhead.`,`Myth: "The cache can be the source of truth." Reality: caches evict, restart and lose data. Unless it is designed as a durable store, always be able to rebuild every key from the database.`,`Myth: "Just update the cache on write." Reality: updating (rather than deleting) the cached copy invites races where an older write lands last. Deleting the key and letting the next read reload it is safer.`,`Myth: "Personalised pages can’t use a CDN." Reality: split the page — cache the shared shell and public data at the edge, and fetch the personalised fragment separately with Cache-Control: private.`,`Myth: "A longer TTL is always better." Reality: TTL is a business decision about how stale data may be. A year is perfect for a fingerprinted JS file and dangerous for a stock count.`]},{type:`callout`,variant:`warning`,text:`What not to cache in shared caches: anything personalised or sensitive — account pages, carts, auth tokens, responses that depend on cookies — unless marked private and kept in the user’s own browser. A misconfigured CDN serving one user’s account page to another is a real, recurring class of data leak. Mark such responses Cache-Control: private (or no-store for truly sensitive data).`}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`In interviews, place caches deliberately and name the pattern: "CDN for static assets and public HTML, Redis cache-aside in front of the product DB with a 5-minute jittered TTL, invalidate on write." Then state the staleness you are accepting.`,`Distributed Cache system design: covers how a Redis/Memcached-style cluster itself is built — consistent hashing, replication, quorum, gossip. This lesson is about using caches; that one is about building one.`,`News Feed system design: precomputed timelines stored in a cache (fan-out on write) are a cache of an expensive query; celebrity accounts are the classic hot-key problem.`,`URL Shortener system design: an extremely read-heavy key → URL lookup where a cache-aside layer with LRU absorbs nearly all redirects.`,`How Databases Work: the buffer pool is the database’s own cache, and read replicas are the other way to scale reads when caching is not enough.`,`How a Website is Served: shows where the CDN and reverse proxy sit in the serving path; this lesson explains what they keep and for how long.`]},{type:`flow`,title:`Choosing a caching strategy`,code:`flowchart TD
  Q1{"Same for every user?"} -->|"no, personalised"| P["Cache-Control private<br/>or per-user Redis key"]:::security
  Q1 -->|"yes"| Q2{"Does the content ever change<br/>at the same URL?"}
  Q2 -->|"never, fingerprinted"| IM["max-age 1 year + immutable<br/>browser + CDN"]:::highlight
  Q2 -->|"yes"| Q3{"How stale may it be?"}
  Q3 -->|"seconds to minutes"| CDN["CDN s-maxage + Redis TTL<br/>+ purge on write"]:::cache
  Q3 -->|"must be exact"| DB[("Read from the database<br/>e.g. checkout, balances")]:::db`},{type:`callout`,variant:`important`,text:`A strong interview answer on caching always covers four things: what is cached and where, how it gets filled, how it is invalidated (and the staleness you accept), and what happens on failure — stampedes, hot keys, and a cold or empty cache.`}]}]},{id:`how-scaling-works`,title:`How Scaling Works`,emoji:`📈`,icon:`ti-chart-arrows-vertical`,color:`#65a30d`,bg:`#ecfccb`,accentGlow:`rgba(101,163,13,0.15)`,difficulty:`Intermediate`,tagline:`Vertical vs horizontal, stateless services, replicas, sharding, and consistent hashing — how systems grow from one server to millions of users.`,tags:[`Horizontal Scaling`,`Stateless Services`,`Read Replicas`,`Sharding`,`Consistent Hashing`,`Quorums`],estimatedTime:`50 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`Scaling is the ability of a system to handle more work — more users, more requests per second, more data — by adding resources, without the experience getting slower or less reliable. A system that served 100 requests per second yesterday and must serve 10,000 tomorrow needs a plan for where that extra capacity comes from.`},{type:`paragraph`,text:`There are only two basic moves. Vertical scaling (scaling up) means giving one machine more CPU, RAM, or faster disks. Horizontal scaling (scaling out) means adding more machines and spreading the work across them. Almost everything else in this lesson — stateless services, load balancers, replicas, sharding, consistent hashing — exists to make scaling out possible.`},{type:`callout`,variant:`info`,text:`In simple terms: imagine a coffee shop with one barista. When the queue grows, you can hire a faster barista and buy a bigger espresso machine (vertical scaling) — but there is a limit to how fast one person can work. Or you can hire more baristas and open more counters (horizontal scaling) — which works almost without limit, as long as every barista can make every drink and nobody keeps the order book in their own pocket.`},{type:`flow`,title:`Scale up vs scale out`,code:`flowchart LR
  subgraph V["Vertical - scale up"]
    direction TB
    S1["Server<br/>4 CPU, 16 GB"]:::server -->|"upgrade"| S2["Bigger server<br/>64 CPU, 512 GB"]:::highlight
  end
  subgraph H["Horizontal - scale out"]
    direction TB
    LB["Load balancer"]:::network --> A["Server 1"]:::server
    LB --> B["Server 2"]:::server
    LB --> C["Server 3"]:::server
    LB --> D["Server N"]:::highlight
  end`,text:`Scaling up makes one box bigger. Scaling out adds more boxes behind a load balancer.`},{type:`heading2`,text:`Vertical vs Horizontal at a Glance`},{type:`bullets`,items:[`Vertical — simplicity: no code changes, no distributed-systems problems. One machine, one copy of the data.`,`Vertical — limits: the biggest cloud machines top out at a few hundred CPU cores and a few TB of RAM. Price grows faster than capacity near the top, and it is still a single point of failure.`,`Horizontal — limits: practically unlimited for stateless work. Cost grows roughly linearly with commodity machines, and losing one machine only removes a fraction of capacity.`,`Horizontal — cost: you now have a distributed system. You need load balancing, shared state, data partitioning, and you must handle partial failures and network delays.`]}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Every machine has a ceiling. A typical web server might handle roughly 1,000–5,000 simple requests per second; a single PostgreSQL primary might handle roughly 10,000–50,000 simple queries per second before CPU, disk, or locks become the limit. When traffic exceeds that ceiling, requests queue up, latency spikes, timeouts cascade, and eventually the service falls over.`},{type:`bullets`,items:[`Growth: user counts and data volumes keep increasing; what fits on one box today will not in a year.`,`Spikes: traffic is not flat. A product launch, a sale, or a viral post can bring 10–100× normal load within minutes.`,`Availability: one machine is one point of failure. Multiple machines let the system survive the loss of any single one.`,`Latency: users far away suffer. Scaling out across regions puts servers closer to users.`,`Cost: paying for peak capacity 24/7 is wasteful. Elastic scaling lets you pay for capacity roughly in proportion to demand.`]}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Step 1 — Make the App Tier Stateless`},{type:`paragraph`,text:`Horizontal scaling only works if any server can handle any request. That is only true when servers are stateless: they keep nothing about a user in their own memory or local disk between requests. If Server A stores your login session in memory, then the next request that lands on Server B does not know who you are.`},{type:`bullets`,items:[`Move sessions to a shared store: keep session data in Redis (or a database) keyed by a session id cookie. Every server reads the same store, typically in about 1 ms.`,`Or make sessions self-contained: a signed JWT carries the user id and expiry inside the token itself, so servers only need to verify the signature. The trade-off: a JWT cannot easily be revoked before it expires, so keep lifetimes short (e.g. 15 minutes) with refresh tokens.`,`Move uploaded files to object storage (S3) instead of the local disk.`,`Move background work to a queue (SQS, Kafka, RabbitMQ) so any worker can pick it up.`]},{type:`flow`,title:`Stateful vs stateless servers`,code:`flowchart TB
  subgraph BAD["Stateful - sessions in server memory"]
    direction LR
    U1([User]):::client --> LB1["Load balancer"]:::network
    LB1 -->|"request 1"| SA["Server A<br/>holds session"]:::server
    LB1 -.->|"request 2: who are you?"| SB["Server B<br/>no session"]:::external
  end
  subgraph GOOD["Stateless - shared session store"]
    direction LR
    U2([User]):::client --> LB2["Load balancer"]:::network
    LB2 --> SC["Server A"]:::server
    LB2 --> SD["Server B"]:::server
    SC --> R[("Redis sessions")]:::cache
    SD --> R
  end`,text:`Once state lives outside the servers, servers become interchangeable. You can add, remove, or replace them at any time.`},{type:`callout`,variant:`tip`,text:`Sticky sessions (always routing a user to the same server) are a workaround, not a fix. They create uneven load and lose the session when that server dies. Prefer stateless servers plus a shared store.`},{type:`heading2`,text:`Step 2 — Put a Load Balancer in Front`},{type:`paragraph`,text:`With stateless servers, a load balancer spreads traffic across them, health-checks them, and stops sending traffic to broken ones. Algorithms, L4 vs L7, and health checks are covered in depth in the How Load Balancers Work lesson — here, just remember that the load balancer is what turns "many servers" into "one service".`},{type:`heading2`,text:`Step 3 — Autoscale the Fleet`},{type:`paragraph`,text:`Autoscaling adds and removes servers automatically based on a metric. A typical rule: keep average CPU around 60%. If it rises above the target, add servers; if it falls well below, remove some.`},{type:`bullets`,items:[`Metrics: CPU is the most common. Requests per server, queue depth (for workers), or p99 latency are often better signals of real load.`,`Warm-up: a new instance takes time — roughly 1–5 minutes to boot, start the app, and warm caches. Scale before you are at 100%, not after.`,`Cooldown: after a scaling action, wait (e.g. 3–5 minutes) before acting again, so the new capacity can take effect. Without it the fleet oscillates up and down ("flapping").`,`Min and max: always set a minimum (for availability, e.g. 2+ instances across zones) and a maximum (to cap cost and protect the database behind you).`,`Scheduled scaling: if you know the 9 AM spike is coming, scale up at 8:45 instead of reacting at 9:02.`]},{type:`flow`,title:`The autoscaling control loop`,code:`flowchart TD
  M["Collect metric every 60s<br/>average CPU, req per server"]:::network --> D{"CPU vs target 60%?"}:::highlight
  D -->|"above 70%"| UP["Add instances"]:::server
  D -->|"below 40%"| DOWN["Remove instances<br/>drain connections first"]:::server
  D -->|"in range"| M
  UP --> W["Warm-up: boot, health check,<br/>slow-start traffic"]:::cache
  W --> CD["Cooldown 3-5 min"]:::queue
  DOWN --> CD
  CD --> M`,text:`Warm-up and cooldown keep the loop from overreacting to its own actions.`},{type:`callout`,variant:`warning`,text:`Autoscaling the app tier can move the bottleneck straight to the database. Going from 10 to 100 app servers, each with a pool of 20 connections, means 2,000 database connections — enough to exhaust many databases. Cap the maximum fleet size and use a connection pooler like PgBouncer.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`The Database Scaling Path — In the Order Teams Actually Take It`},{type:`paragraph`,text:`Stateless app servers are easy to scale out. The database is hard, because it holds the state. Teams climb this ladder one rung at a time, and only move up when the previous rung is exhausted — each rung adds complexity.`},{type:`flow`,title:`The database scaling ladder`,code:`flowchart TD
  A["1. Tune queries and add indexes<br/>cheapest, often a 10-100x win"]:::db -->|"still slow"| B["2. Add a cache - Redis"]:::cache
  B -->|"reads still too high"| C["3. Add read replicas"]:::db
  C -->|"primary saturated"| D["4. Scale the primary vertically"]:::server
  D -->|"writes or data outgrow one box"| E["5. Partition and shard<br/>most complex, last resort"]:::highlight`,text:`Climb only as far as you need. Many successful products never reach sharding.`},{type:`heading3`,text:`1. Query and index tuning`},{type:`paragraph`,text:`Before buying hardware, find slow queries (pg_stat_statements, the slow query log) and run EXPLAIN ANALYZE on them. A missing index can turn a 300 ms full table scan into a 1 ms index lookup — a bigger win than any server upgrade. Fix N+1 queries, add connection pooling, and select only the columns you need.`},{type:`heading3`,text:`2. Caching`},{type:`paragraph`,text:`Most apps are read-heavy — often 10–100 reads for every write. Putting Redis or Memcached in front of the database (cache-aside: check the cache, on a miss read the database and store the result with a TTL) can absorb roughly 80–95% of reads. The hard part is invalidation: deciding when cached data is stale.`},{type:`heading3`,text:`3. Read replicas`},{type:`paragraph`,text:`A replica is a copy of the primary database that continuously applies the primary’s write log. All writes go to the primary; reads are spread across replicas. Five replicas give roughly five times the read capacity — but write capacity does not change at all.`},{type:`bullets`,items:[`Asynchronous replication: the primary confirms the write immediately and ships the change to replicas afterwards. Fast, but replicas lag behind — usually milliseconds, sometimes seconds under load. If the primary dies, writes not yet shipped are lost when a replica is promoted.`,`Synchronous replication: the primary waits until at least one replica confirms before acknowledging the write. No data loss on failover, but every write pays an extra network round trip, and if the synchronous replica is down, writes stall.`,`Semi-synchronous (a common middle ground): wait for one replica, replicate to the rest asynchronously.`]},{type:`flow`,title:`Replication lag breaks read-your-writes`,code:`sequenceDiagram
  participant U as User
  participant App
  participant P as Primary
  participant R as Replica
  U->>App: Update my profile name to Sam
  App->>P: UPDATE users SET name = Sam
  P-->>App: OK, committed
  App-->>U: Saved
  U->>App: Reload profile page
  App->>R: SELECT name FROM users
  Note over R: change not applied yet, 200 ms lag
  R-->>App: old name Alex
  App-->>U: Shows Alex - user thinks the save failed
  P-->>R: replication catches up`,text:`The write succeeded, but the read went to a replica that had not caught up yet.`},{type:`callout`,variant:`tip`,text:`Read-your-writes fixes: (1) route a user’s reads to the primary for a few seconds after they write; (2) always read the user’s own data from the primary and everyone else’s from replicas; (3) track the write’s log position and only read from a replica that has reached it.`},{type:`heading3`,text:`4. Vertical scaling of the database`},{type:`paragraph`,text:`Before sharding, move the primary to a much bigger machine: more RAM so the whole working set fits in the buffer pool, faster NVMe disks, more cores. This is boring and expensive — and usually far cheaper than the engineering cost of sharding. A single large primary can often carry a product to tens of millions of users.`},{type:`heading3`,text:`5. Partitioning and sharding`},{type:`paragraph`,text:`When writes or total data size outgrow the biggest machine, split the data. This is the only rung that scales writes, and the most complex one. The next sections explain how.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Vertical vs Horizontal Partitioning`},{type:`bullets`,items:[`Vertical partitioning: split by columns or by feature. Move the large, rarely read bio and settings columns into a separate table, or move the whole payments domain into its own database. Each piece is smaller, but one table can still outgrow one machine.`,`Horizontal partitioning (sharding): split by rows. Users 1–1M live on shard 1, users 1M–2M on shard 2. Every shard has the same schema but holds a different subset of rows. This is what lets a single giant table scale across many machines.`]},{type:`flow`,title:`Splitting a users table two ways`,code:`flowchart TB
  T[("users table<br/>id, name, email, bio, settings")]:::db
  T -->|"vertical: split columns"| VA[("users_core<br/>id, name, email")]:::db
  T -->|"vertical: split columns"| VB[("users_profile<br/>id, bio, settings")]:::db
  T -->|"horizontal: split rows"| H1[("Shard 1<br/>ids 1 to 1M")]:::highlight
  T -->|"horizontal: split rows"| H2[("Shard 2<br/>ids 1M to 2M")]:::highlight
  T -->|"horizontal: split rows"| H3[("Shard 3<br/>ids 2M to 3M")]:::highlight`},{type:`heading2`,text:`Three Ways to Decide Which Shard Owns a Row`},{type:`bullets`,items:[`Range-based: each shard owns a range of the key (A–F, G–M, …, or dates by month). Range scans are efficient because neighbours live together. Risk: hot spots — if the key is a timestamp, every new write hits the newest shard.`,`Hash-based: shard = hash(key) mod N. Spreads keys evenly and avoids hot ranges. Cost: range queries must ask every shard, and changing N moves almost every key (fixed by consistent hashing, below).`,`Directory / lookup-based: a lookup table maps each key (or tenant) to a shard. Fully flexible — you can move one big customer to its own shard. Cost: the directory is an extra hop, must be cached, and must be highly available.`]},{type:`flow`,title:`Range vs hash vs directory routing`,code:`flowchart LR
  K(["user_id = 4821"]):::client --> RG{"Range<br/>which range contains 4821?"}:::network
  K --> HS{"Hash<br/>hash 4821 mod 4"}:::network
  K --> DR{"Directory<br/>look up 4821"}:::network
  RG --> S1[("Shard 1: ids 1 to 10,000")]:::db
  HS --> S3[("Shard 3")]:::db
  DR --> LK[("Lookup table<br/>4821 to Shard 2")]:::cache
  LK --> S2[("Shard 2")]:::db`},{type:`heading2`,text:`Choosing a Shard Key`},{type:`paragraph`,text:`The shard key is the most important and least reversible decision in sharding. A good key has high cardinality (many distinct values), spreads both data and traffic evenly, and matches the most common query — so most queries hit exactly one shard.`},{type:`bullets`,items:[`Good: user_id for a social app — almost every query is about one user, and users are numerous.`,`Good: tenant_id for a B2B SaaS app — each customer’s data stays together, so joins inside a tenant still work.`,`Bad: country — low cardinality, wildly uneven (one country may hold 40% of users).`,`Bad: created_at — every new write lands on the same latest shard.`]},{type:`callout`,variant:`warning`,text:`Hot partitions (the celebrity problem): even with a good key, one key can be far hotter than the rest. A celebrity with 100M followers makes their shard melt while others sit idle. Fixes: cache hot keys aggressively, split a hot key by adding a suffix (celeb_123#0 … celeb_123#9) and fan reads across the pieces, or give very large tenants a dedicated shard via the directory.`},{type:`heading2`,text:`Cross-Shard Queries and Joins`},{type:`paragraph`,text:`Once rows live on different machines, anything that spans shards gets expensive. "Top 10 posts across all users" must scatter the query to every shard and gather the results. A JOIN between users on shard 1 and orders on shard 4 cannot be done by the database — the application must fetch both and join them in code. Transactions across shards need two-phase commit or sagas, which are slower and more fragile.`},{type:`flow`,title:`Single-shard vs scatter-gather`,code:`flowchart LR
  subgraph ONE["Query includes shard key - fast"]
    Q1(["posts WHERE user_id = 42"]):::client --> R1["Router"]:::network --> SH2[("Shard 2 only")]:::db
  end
  subgraph ALL["Query lacks shard key - slow"]
    Q2(["top posts this hour"]):::client --> R2["Router"]:::network
    R2 --> A1[("Shard 1")]:::db
    R2 --> A2[("Shard 2")]:::db
    R2 --> A3[("Shard 3")]:::db
    A1 --> M["Merge and sort<br/>in the app"]:::server
    A2 --> M
    A3 --> M
  end`,text:`Design the schema so the hot paths always include the shard key. Precompute cross-shard views (counters, leaderboards) asynchronously.`},{type:`heading2`,text:`Resharding`},{type:`paragraph`,text:`Eventually a shard fills up and you must split it or add shards. With hash mod N, going from 4 to 5 shards changes the owner of roughly 80% of all keys — a massive, risky data migration. Common approaches: start with many logical shards (e.g. 1,024) mapped onto a few physical machines and move whole logical shards later; or use consistent hashing so only a small fraction of keys move. Migrations usually double-write to old and new locations, backfill, verify, then cut over.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Growing an App from 1,000 to 10 Million Users`},{type:`paragraph`,text:`Imagine a photo-sharing app. The numbers below are rough, but the order of changes is what real teams go through. Notice that each stage fixes the current bottleneck — nobody starts with sharding.`},{type:`numbered`,items:[`1,000 users (~1 request/sec at peak): one small VM runs the web app and PostgreSQL together. Cost: roughly $20–50/month. Anything more is premature.`,`10,000 users (~10–50 req/s): the database and app fight over CPU and RAM. Move the database to its own managed instance. Add daily backups. Put images in object storage (S3) behind a CDN.`,`100,000 users (~200–500 req/s): one app server is at 80% CPU and every deploy causes downtime. Make the app stateless (sessions to Redis), run 3+ app servers behind a load balancer across availability zones, add slow-query monitoring and missing indexes.`,`1 million users (~2,000–5,000 req/s): the database is the bottleneck — 90% of queries are reads (feeds, profiles). Add a Redis cache for hot reads (~90% hit rate) and 2–3 read replicas. Turn on autoscaling for app servers. Move thumbnail generation and email to a queue with workers.`,`10 million users (~20,000–50,000 req/s): the primary is on the biggest sensible instance and write volume (likes, comments) plus a multi-TB photos-metadata table are pushing it. Shard the hot tables by user_id, use consistent hashing for the cache cluster, add multiple regions behind GeoDNS, and split write-heavy features (notifications, chat) into their own services and data stores.`]},{type:`flow`,title:`The 10M-user architecture`,code:`flowchart TB
  U([Users worldwide]):::client --> DNS["GeoDNS + CDN"]:::network
  DNS --> LB["Regional load balancer"]:::network
  LB --> APP["Autoscaled stateless app fleet"]:::server
  APP --> C[("Redis cluster<br/>consistent hashing")]:::cache
  APP --> RT["Shard router"]:::network
  RT --> SA[("Shard A<br/>primary + replicas")]:::db
  RT --> SB[("Shard B<br/>primary + replicas")]:::db
  RT --> SC[("Shard C<br/>primary + replicas")]:::db
  APP --> Q[["Queue"]]:::queue
  Q --> W["Workers: thumbnails, email, fan-out"]:::server
  APP --> S3[("Object storage")]:::external`,text:`Every box here was added to remove a specific, measured bottleneck — not because it appears in architecture diagrams.`},{type:`callout`,variant:`important`,text:`The most expensive scaling mistake is scaling too early. Sharding at 10,000 users adds months of complexity for a problem you do not have. Measure first, then fix the bottleneck that actually exists.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — a request through a scaled system`,code:`flowchart LR
  C([Client]):::client -->|"1"| LB["Load balancer"]:::network
  LB -->|"2"| APP["Stateless app server"]:::server
  APP -->|"3. cache hit?"| CA[("Cache")]:::cache
  APP -->|"4. route by shard key"| RT["Shard router"]:::network
  RT -->|"5a. write"| P[("Shard primary")]:::db
  RT -->|"5b. read"| R[("Shard replica")]:::db
  P -.->|"replicate"| R`,text:`The step cards below expand each hop.`},{type:`diagram`,diagram:{id:`diagram-scaling-request-path`,title:`Horizontally Scaled Request Path`,subtitle:`How one request flows through a load balancer, a stateless autoscaled fleet, a cache, a shard router, and replicated shards`,nodes:[{id:`scaling-client`,name:`Client`,subtitle:`Browser or Mobile App`,type:`client`,icon:`ti-device-mobile`,badge:`Request`,protocol:`GET /users/4821/feed`,details:[`Sends an HTTPS request with a session cookie or JWT`,`Has no idea how many servers or shards exist behind the address`]},{id:`scaling-lb`,name:`Load Balancer`,subtitle:`Spreads Traffic Across Healthy Servers`,type:`network`,icon:`ti-arrows-split-2`,badge:`L7 Balancer`,protocol:`Least Connections`,details:[`Picks a healthy app server; no sticky sessions needed`,`Newly autoscaled servers join after passing health checks, with slow-start`]},{id:`scaling-app`,name:`Stateless App Server`,subtitle:`One of 2–200 Interchangeable Instances`,type:`server`,icon:`ti-server`,badge:`Autoscaled`,protocol:`Target CPU 60%`,details:[`Verifies the JWT signature or loads the session from Redis — nothing stored locally`,`Any instance can serve any request, so the fleet can grow or shrink freely`]},{id:`scaling-cache`,name:`Distributed Cache`,subtitle:`Redis Cluster on a Hash Ring`,type:`cache`,icon:`ti-bolt`,badge:`Cache-Aside`,protocol:`~1 ms lookup`,details:[`Key feed:4821 hashes to one cache node via consistent hashing`,`Roughly 90% of reads end here and never touch the database`]},{id:`scaling-router`,name:`Shard Router`,subtitle:`Maps Shard Key to a Database`,type:`gateway`,icon:`ti-route`,badge:`Routing`,protocol:`hash(user_id) on ring`,details:[`Computes the shard from user_id = 4821, or checks a cached directory`,`Sends writes to the shard primary and reads to its replicas`]},{id:`scaling-shard`,name:`Shard Primary + Replicas`,subtitle:`One Slice of the Data, Replicated`,type:`database`,icon:`ti-database`,badge:`Shard B`,protocol:`Async Replication`,details:[`Holds only the users whose key hashes to this shard`,`Replicas add read capacity and a failover target; async replicas may lag slightly`]}],connections:[{from:`scaling-client`,to:`scaling-lb`,label:`1. HTTPS request`,protocol:`TLS`},{from:`scaling-lb`,to:`scaling-app`,label:`2. Pick healthy server`,protocol:`HTTP`},{from:`scaling-app`,to:`scaling-cache`,label:`3. Check cache`,protocol:`RESP`},{from:`scaling-app`,to:`scaling-router`,label:`4. On miss, route by key`,protocol:`SQL`},{from:`scaling-router`,to:`scaling-shard`,label:`5. Query one shard`,protocol:`SQL`}],keyTakeaways:[`Statelessness is the foundation: once no server holds user state, the app tier scales by simply adding instances.`,`Caches and replicas scale reads; only sharding scales writes and total data size.`,`Every query that includes the shard key touches exactly one shard. Queries without it fan out to all shards and get slower as you add shards.`],rawSpec:`Client
  \u2502  GET /users/4821/feed
  \u25BC
Load Balancer \u2500\u2500\u25BA picks 1 of N healthy, stateless app servers
  \u2502
  \u25BC
App Server (autoscaled, CPU target 60%)
  \u2502 1. GET feed:4821 from Redis \u2500\u2500 hit (~90%) \u2500\u2500\u25BA return
  \u2502 2. miss \u2500\u2500\u25BA Shard Router
  \u25BC
Shard Router: hash(4821) \u2192 position on ring \u2192 Shard B
  \u2502
  \u251C\u2500\u2500 writes \u2500\u2500\u25BA Shard B primary
  \u2514\u2500\u2500 reads  \u2500\u2500\u25BA Shard B replica (may lag ~ms)`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Consistent Hashing — Why Only ~1/N of Keys Move`},{type:`paragraph`,text:`With simple hash(key) mod N, the shard depends on N. Change N from 4 to 5 and a key that was on shard hash mod 4 is now on shard hash mod 5 — different for roughly 80% of keys. For a cache that means a sudden flood of misses; for a database it means moving most of the data.`},{type:`paragraph`,text:`Consistent hashing removes N from the formula. Picture the hash space (say 0 to 2^32 − 1) bent into a ring. Each node is hashed to a position on the ring, and so is each key. A key belongs to the first node found walking clockwise from the key’s position. When a new node joins, it takes over only the keys in the arc between itself and the previous node — on average about 1/N of all keys. Every other key stays exactly where it was. Removing a node likewise only moves that node’s keys, to its clockwise neighbour.`},{type:`flow`,title:`The ring — adding Node D moves only one arc`,code:`flowchart LR
  subgraph BEFORE["Before: 3 nodes"]
    direction TB
    A1["Node A at 0"]:::server --> B1["Node B at 120"]:::server
    B1 --> C1["Node C at 240"]:::server
    C1 -->|"wraps around"| A1
    K1(["key at 150 goes to C"]):::client -.-> C1
    K2(["key at 200 goes to C"]):::client -.-> C1
  end
  subgraph AFTER["After: Node D added at 180"]
    direction TB
    A2["Node A at 0"]:::server --> B2["Node B at 120"]:::server
    B2 --> D2["Node D at 180"]:::highlight
    D2 --> C2["Node C at 240"]:::server
    C2 -->|"wraps around"| A2
    K3(["key at 150 now goes to D"]):::client -.-> D2
    K4(["key at 200 stays on C"]):::client -.-> C2
  end`,text:`Only keys between 120 and 180 change owner (from C to D). Keys owned by A and B never move.`},{type:`heading3`,text:`Virtual nodes`},{type:`paragraph`,text:`With only a few points on the ring, arcs are uneven — one node might own 50% of the ring by bad luck. And when a node leaves, all its keys land on a single neighbour. Virtual nodes fix both: each physical machine is placed at many positions (e.g. 100–200). Lots of small arcs average out to an even share, a departing node’s load spreads across many machines, and a bigger machine can simply get more virtual nodes. The Distributed Cache lesson walks through this in a full design.`},{type:`code`,lang:`typescript`,code:`// Minimal consistent hash ring with virtual nodes
class HashRing {
  private ring: { pos: number; node: string }[] = [];

  constructor(nodes: string[], private vnodes = 150) {
    nodes.forEach((n) => this.add(n));
  }

  add(node: string) {
    for (let i = 0; i < this.vnodes; i++) {
      this.ring.push({ pos: hash(\`\${node}#\${i}\`), node });
    }
    this.ring.sort((a, b) => a.pos - b.pos);
  }

  remove(node: string) {
    this.ring = this.ring.filter((p) => p.node !== node);
  }

  // First virtual node clockwise from the key (wraps to index 0)
  get(key: string): string {
    const h = hash(key);
    let lo = 0, hi = this.ring.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].pos < h) lo = mid + 1; else hi = mid;
    }
    return this.ring[lo % this.ring.length].node;
  }
}

declare function hash(s: string): number; // e.g. 32-bit murmur3`},{type:`heading2`,text:`Replication Topologies`},{type:`bullets`,items:[`Leader–follower (single leader): one node accepts writes and streams them to followers. Simple, no write conflicts. Used by PostgreSQL, MySQL, MongoDB replica sets. Write capacity is limited to one node per shard.`,`Multi-leader: several nodes (often one per region) accept writes and replicate to each other. Low write latency in every region and survives a region outage, but two leaders can change the same row concurrently, so you need conflict resolution (last-write-wins, merge rules, CRDTs).`,`Leaderless: any replica accepts reads and writes (Dynamo-style: Cassandra, Riak, DynamoDB internally). The client or a coordinator sends each write to N replicas and waits for W acknowledgements; reads ask R replicas and take the newest version.`]},{type:`flow`,title:`Three replication topologies`,code:`flowchart TB
  subgraph LF["Leader-follower"]
    direction LR
    L1[("Leader")]:::highlight --> F1[("Follower")]:::db
    L1 --> F2[("Follower")]:::db
  end
  subgraph ML["Multi-leader"]
    direction LR
    M1[("Leader US")]:::highlight <-->|"sync changes,<br/>resolve conflicts"| M2[("Leader EU")]:::highlight
  end
  subgraph LL["Leaderless"]
    direction LR
    CL(["Client"]):::client --> N1[("Replica 1")]:::db
    CL --> N2[("Replica 2")]:::db
    CL --> N3[("Replica 3")]:::db
  end`},{type:`heading3`,text:`Quorums: R + W > N`},{type:`paragraph`,text:`In a leaderless system with N replicas, if every write is acknowledged by W replicas and every read asks R replicas, then whenever R + W > N the read set and write set must overlap in at least one replica — so a read always sees the latest acknowledged write. A common choice is N = 3, W = 2, R = 2. Tuning shifts the trade-off: W = 1 gives fast writes but weaker guarantees; R = 1, W = N gives fast reads but writes fail if any replica is down.`},{type:`flow`,title:`Quorum overlap with N=3, W=2, R=2`,code:`flowchart LR
  W(["Write v2"]):::client -->|"ack"| R1[("Replica 1: v2")]:::highlight
  W -->|"ack"| R2[("Replica 2: v2")]:::highlight
  W -.->|"slow, still v1"| R3[("Replica 3: v1")]:::db
  RD(["Read"]):::client --> R2
  RD --> R3
  R2 -->|"newest version wins"| OUT(["Returns v2"]):::cache`,text:`Any 2 replicas read must include at least 1 of the 2 that were written, because 2 + 2 > 3.`},{type:`callout`,variant:`warning`,text:`Async replication and failover: if the leader acknowledges a write, then crashes before shipping it, the promoted follower never received it. That write is gone. If losing even one acknowledged write is unacceptable (payments), use synchronous or semi-synchronous replication to at least one replica, or a consensus-based database (Raft/Paxos).`},{type:`heading2`,text:`CAP and PACELC — The Trade-off Behind It All`},{type:`paragraph`,text:`Once data lives on several machines, the network between them can fail. CAP says that during a network partition (P) you must choose: keep answering and risk returning stale or conflicting data (Availability), or refuse some requests until the partition heals (Consistency). PACELC adds the everyday case: Else, when there is no partition, you still trade Latency against Consistency — waiting for more replicas is safer but slower.`},{type:`bullets`,items:[`CP-leaning: bank balances, inventory counts, leader election. Better to return an error than a wrong answer.`,`AP-leaning: social feeds, like counts, shopping carts, view counters. Slightly stale is fine; being down is not.`,`Most real systems choose per feature, not per company — the same app may use a strongly consistent database for orders and an eventually consistent store for the activity feed.`]}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "Horizontal scaling is always better than vertical." Reality: vertical scaling is simpler, avoids distributed-systems bugs, and modern machines are huge. Scale up first when you can; scale out when you hit the ceiling or need redundancy.`,`Myth: "Add more app servers and it will be faster." Reality: if the database is the bottleneck, more app servers just send it more concurrent queries and make things worse.`,`Myth: "Read replicas scale writes." Reality: every replica must apply every write. Replicas scale reads only; writes need sharding.`,`Myth: "Sharding is the first step to scale a database." Reality: it is the last. Indexes, caching, replicas, and a bigger primary are far cheaper and usually enough.`,`Myth: "Consistent hashing means no data moves when nodes change." Reality: roughly 1/N of keys still move — just far fewer than the ~(N−1)/N that move with mod N.`,`Myth: "Autoscaling handles any spike." Reality: new instances take minutes to become useful. A spike that arrives in seconds needs headroom, queues, or rate limiting, not just autoscaling.`]},{type:`heading2`,text:`The Bottleneck-Hunting Mindset`},{type:`paragraph`,text:`Scaling is not a single design; it is a loop. At any moment, one resource limits the whole system — CPU on the app tier, connections on the database, a single hot key, network bandwidth, a lock. Scaling anything else does nothing. Measure (latency percentiles, saturation, error rates), find the tightest constraint, relieve it, and repeat — the bottleneck will move somewhere new.`},{type:`flow`,title:`Find it, fix it, repeat`,code:`flowchart LR
  M["Measure<br/>p99 latency, CPU,<br/>DB connections, queue depth"]:::network --> F{"What is saturated?"}:::highlight
  F --> X["Scale or fix<br/>only that component"]:::server
  X --> V["Verify with load test<br/>and production metrics"]:::cache
  V -->|"bottleneck moved"| M`}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`How Load Balancers Work: the mechanics behind spreading traffic over the stateless fleet — algorithms, health checks, connection draining and slow-start for newly autoscaled servers.`,`How Databases Work: indexes, EXPLAIN ANALYZE and connection pooling are rung 1 of the database scaling ladder — always start there.`,`Distributed Cache: a full design of a sharded cache using consistent hashing with virtual nodes, replication, and eviction — the caching rung at scale.`,`Distributed Load Balancer: how the load balancer itself scales out and avoids being a single point of failure.`,`URL Shortener: an extremely read-heavy system — a textbook case for caching plus read replicas, with short codes as a natural hash-shard key.`,`News Feed: the celebrity problem in practice — fan-out on write for normal users, fan-out on read for celebrities to avoid hot partitions.`,`Chat System: sharding messages by conversation id, stateful WebSocket servers that still need shared presence and routing state outside the server.`]},{type:`callout`,variant:`tip`,text:`In interviews, start with estimates (users, requests per second, read/write ratio, data size), then scale in order: stateless app tier and load balancer → cache → read replicas → shard with an explicit shard key. Say out loud what each step costs (consistency, complexity) — that trade-off talk is what interviewers listen for.`},{type:`callout`,variant:`important`,text:`Scaling is the art of removing bottlenecks one at a time. Stateless services make compute easy to scale; caches and replicas scale reads; sharding scales writes; consistent hashing makes adding capacity cheap; and every step trades some simplicity or consistency for headroom.`}]}]},{id:`how-message-queues-work`,title:`How Message Queues Work`,emoji:`📬`,icon:`ti-mail-forward`,color:`#c026d3`,bg:`#fae8ff`,accentGlow:`rgba(192,38,211,0.15)`,difficulty:`Intermediate`,tagline:`Queues, pub/sub, Kafka logs, acks, retries, dead-letter queues and the outbox — how services talk without waiting on each other.`,tags:[`Async Processing`,`Pub/Sub`,`Kafka`,`Delivery Guarantees`,`Dead-Letter Queue`,`Outbox Pattern`],estimatedTime:`45 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`paragraph`,text:`A message queue is a piece of infrastructure (a "broker") that sits between the services that produce work and the services that do it. A producer writes a small message — "order 789 was placed", "resize image 42", "send welcome email to user 123" — and moves on immediately. The broker stores the message safely until a consumer picks it up, processes it and confirms it is done. The producer and consumer never talk to each other directly, and they do not even need to be running at the same time.`},{type:`callout`,variant:`info`,text:`In simple terms: a message queue is like the order rail in a busy restaurant kitchen. The waiter (producer) clips an order ticket to the rail and goes back to the customers — they do not stand at the stove waiting. Cooks (consumers) take tickets off the rail one at a time, at whatever pace they can manage. If ten tables order at once, the tickets just pile up on the rail instead of the waiter being stuck. If a cook goes on break, the tickets wait for the next cook.`},{type:`flow`,title:`The big picture — producers, broker, consumers`,code:`flowchart LR
  P1([Checkout API]):::client -->|"publish OrderPlaced"| B
  P2([Signup API]):::client -->|"publish UserSignedUp"| B
  subgraph B["Message broker"]
    direction TB
    Q1[[orders queue]]:::queue
    Q2[[emails queue]]:::queue
  end
  Q1 -->|"pull, process, ack"| C1[Payment worker]:::server
  Q2 -->|"pull, process, ack"| C2[Email worker]:::server
  C1 --> DB[(Database)]:::db
  C2 --> EXT[Email provider]:::external`,text:`Producers only know the broker. Consumers only know the broker. That single indirection is what makes the whole system loosely coupled.`},{type:`heading2`,text:`Three Families of Messaging Systems`},{type:`bullets`,items:[`Point-to-point work queues: each message is handled by exactly one consumer, then deleted. Examples: Amazon SQS, RabbitMQ queues, BullMQ (on Redis). Best for background jobs — "do this task once".`,`Publish/subscribe (pub/sub): one message is copied to every subscriber. Examples: Amazon SNS, Google Pub/Sub, RabbitMQ fanout exchanges, Redis Pub/Sub. Best for broadcasting "this happened" to many interested services.`,`Log-based streams: messages are appended to a durable, ordered log and kept for days. Consumers read at their own position and can rewind. Examples: Apache Kafka, Amazon Kinesis, Redpanda, Apache Pulsar. Best for high-volume event streams, analytics and replay.`]}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`paragraph`,text:`Imagine a checkout endpoint that, before responding, charges the card, reserves stock, sends a confirmation email, updates analytics and notifies the warehouse — all synchronously. Each call adds latency (say 100–800ms each), and if any one of them is down, the whole checkout fails. The customer does not care whether the analytics event was recorded before they saw "Order confirmed". A queue lets you do only the essential work on the request path and push everything else to the background.`},{type:`flow`,title:`Synchronous chain vs. publish-and-return`,code:`sequenceDiagram
  participant U as User
  participant API as Checkout API
  participant Q as Broker
  participant E as Email service
  participant A as Analytics
  Note over U,A: Synchronous - user waits for everything
  U->>API: POST /checkout
  API->>E: send email (600 ms)
  API->>A: record event (200 ms)
  API-->>U: 201 after about 1 second
  Note over U,A: Asynchronous - user waits only for the essentials
  U->>API: POST /checkout
  API->>Q: publish OrderPlaced (about 5 ms)
  API-->>U: 201 after about 60 ms
  Q-)E: deliver later
  Q-)A: deliver later`,text:`The asynchronous version responds roughly 15× faster, and a slow or broken email service no longer affects checkout at all.`},{type:`heading2`,text:`The Four Big Wins`},{type:`bullets`,items:[`Decoupling: the producer does not know who consumes its messages, how many consumers there are, or where they run. You can add a new consumer (say, a fraud detector) without changing the producer.`,`Buffering spikes (load levelling): a flash sale might produce 50,000 orders a minute while your workers handle 10,000. The queue absorbs the burst and the workers drain it over the next few minutes instead of falling over.`,`Reliable retries: if a consumer crashes or a downstream API times out, the message stays in the queue and is delivered again. Work is not lost just because one process died.`,`Slow work off the request path: video transcoding, PDF generation, sending emails, calling slow third-party APIs — anything that takes seconds should not keep an HTTP request open.`]},{type:`callout`,variant:`warning`,text:`Queues are not free. You trade immediate consistency for eventual consistency, you add a new piece of infrastructure to operate, and debugging becomes harder because one user action now spreads across several services and several seconds. Only go async for work that genuinely does not need to finish before you reply.`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`Point-to-Point: Competing Consumers`},{type:`paragraph`,text:`In a work queue, several identical workers pull from the same queue. Each message goes to only one of them — they "compete" for messages. To process faster, you simply add more workers. Once a worker confirms the message is done, the broker deletes it.`},{type:`flow`,title:`Competing consumers on one queue`,code:`flowchart LR
  P([Producer]):::client --> Q[[resize-images queue<br/>m1 m2 m3 m4 m5 m6]]:::queue
  Q -->|"m1, m4"| W1[Worker 1]:::server
  Q -->|"m2, m5"| W2[Worker 2]:::server
  Q -->|"m3, m6"| W3[Worker 3]:::server`,text:`Each message is processed once by one worker. Three workers means roughly three times the throughput.`},{type:`heading2`,text:`Pub/Sub: Fan-Out to Every Subscriber`},{type:`paragraph`,text:`In pub/sub, a producer publishes to a topic, and every subscription on that topic receives its own copy. A common pattern (for example SNS → SQS, or a RabbitMQ fanout exchange) is to give each subscribing service its own queue, so each service still gets competing consumers and retries internally, without affecting the others.`},{type:`flow`,title:`Fan-out — one event, one copy per subscriber`,code:`flowchart LR
  P([Order service]):::client -->|"OrderPlaced"| T{{orders topic}}:::network
  T --> QP[[payment queue]]:::queue --> SP[Payment service]:::server
  T --> QI[[inventory queue]]:::queue --> SI[Inventory service]:::server
  T --> QE[[email queue]]:::queue --> SE[Email service]:::server`},{type:`heading2`,text:`Log-Based Streams: Kafka`},{type:`paragraph`,text:`Kafka works differently. A topic is split into partitions, and each partition is an append-only log on disk. Every message gets an increasing number in its partition called an offset. Consumers do not delete messages — they just remember (commit) the offset they have read up to. Messages are kept for a configured retention period (7 days by default), so a new consumer can start from the beginning and replay history, and a buggy consumer can be rewound and re-run.`},{type:`bullets`,items:[`Partition key: when a producer sends a message with a key (e.g. orderId or userId), Kafka hashes the key to pick the partition. The same key always lands in the same partition.`,`Ordering: Kafka guarantees order only within a single partition. Messages in different partitions can be processed in any relative order.`,`Consumer group: a set of consumers sharing a group id. Each partition is assigned to exactly one consumer in the group, so the group splits the work. Different groups (e.g. "email" and "analytics") each read the full topic independently — that is how Kafka does pub/sub.`,`Parallelism limit: a group can have at most one active consumer per partition. A topic with 12 partitions can be processed by at most 12 consumers in one group; a 13th sits idle.`]},{type:`flow`,title:`Kafka — partitions, offsets and consumer groups`,code:`flowchart LR
  P([Producer<br/>key = orderId]):::client -->|"hash key"| T
  subgraph T["Topic: orders"]
    direction TB
    P0["Partition 0<br/>offsets 0..1041"]:::queue
    P1["Partition 1<br/>offsets 0..987"]:::queue
    P2["Partition 2<br/>offsets 0..1103"]:::queue
  end
  subgraph G1["Group: email-service"]
    E1[Consumer A]:::server
    E2[Consumer B]:::server
  end
  subgraph G2["Group: analytics"]
    A1[Consumer X]:::server
  end
  P0 --> E1
  P1 --> E1
  P2 --> E2
  P0 -.-> A1
  P1 -.-> A1
  P2 -.-> A1`,text:`Inside a group, partitions are shared out. Across groups, everyone sees everything — each group keeps its own committed offsets.`},{type:`callout`,variant:`tip`,text:`Choosing a partition key is a design decision. Key by orderId and all events for one order stay in sequence (Created → Paid → Shipped). Key by something with few values (like country) and one partition becomes a "hot" bottleneck while others sit idle. No key at all spreads load evenly but gives up ordering entirely.`},{type:`heading2`,text:`Acknowledgements and Visibility Timeouts`},{type:`paragraph`,text:`How does the broker know a message was actually processed, not just received? The consumer sends an acknowledgement (ack) after finishing. Until then, the message is "in flight". In SQS, a received message becomes invisible to other consumers for a visibility timeout (30 seconds by default). If the consumer deletes it in time, it is gone. If the consumer crashes or takes too long, the timeout expires and the message reappears for another consumer. RabbitMQ does the same thing based on the consumer’s connection: unacked messages are redelivered if the channel closes.`},{type:`flow`,title:`Receive, process, acknowledge — and what a crash looks like`,code:`sequenceDiagram
  participant Q as Queue (SQS)
  participant W1 as Worker 1
  participant W2 as Worker 2
  W1->>Q: ReceiveMessage
  Q-->>W1: msg 42, hidden for 30 s
  W1->>W1: process
  W1->>Q: DeleteMessage 42 (ack)
  Note over Q: msg 42 gone for good
  W1->>Q: ReceiveMessage
  Q-->>W1: msg 43, hidden for 30 s
  Note over W1: crashes mid-processing
  Note over Q: 30 s pass with no delete
  W2->>Q: ReceiveMessage
  Q-->>W2: msg 43 again
  W2->>Q: DeleteMessage 43 (ack)`,text:`Acknowledge after the work is done, never before. That is what turns a crash into a retry instead of lost work.`}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`The Life of One Message`},{type:`numbered`,items:[`Produce: the checkout service serializes {type: "OrderPlaced", orderId: 789, eventId: "evt_9f2"} to JSON and sends it to the broker.`,`Persist: the broker writes the message to disk (and, in a cluster, copies it to replicas) before confirming. Kafka with acks=all waits for all in-sync replicas.`,`Confirm to producer: the broker replies "stored". Only now is the producer allowed to assume the message is safe.`,`Deliver: a consumer pulls (SQS, Kafka) or is pushed (RabbitMQ) the message. It is marked in-flight.`,`Process: the consumer does the work — charge a card, write to a database, call an email API.`,`Acknowledge: on success the consumer acks (SQS DeleteMessage, RabbitMQ basic.ack, Kafka offset commit).`,`On failure: no ack. The message is redelivered after a delay, and the attempt counter goes up.`,`Give up: after N attempts (say 5), the broker moves the message to a dead-letter queue (DLQ) so it stops blocking healthy work and a human can inspect it.`]},{type:`heading2`,text:`Retries with Exponential Backoff`},{type:`paragraph`,text:`If a downstream service is struggling, retrying instantly just piles on more load. Exponential backoff waits longer after each failure — 1s, 2s, 4s, 8s, 16s — and jitter adds a little randomness so thousands of failed messages do not all retry in the same millisecond.`},{type:`code`,lang:`typescript`,code:`// BullMQ (Redis-backed job queue for Node.js)
import { Queue, Worker } from 'bullmq';

const connection = { host: 'localhost', port: 6379 };
const emailQueue = new Queue('emails', { connection });

// Producer: enqueue a job and return immediately
await emailQueue.add(
  'order-confirmation',
  { orderId: 789, to: 'alice@example.com' },
  {
    jobId: 'order-confirmation-789',              // de-duplicates repeat enqueues
    attempts: 5,                                  // try up to 5 times
    backoff: { type: 'exponential', delay: 1000 } // 1s, 2s, 4s, 8s...
  },
);

// Consumer: a worker process (can run many copies)
const worker = new Worker(
  'emails',
  async (job) => {
    await sendEmail(job.data.to, job.data.orderId); // throw = failed attempt
  },
  { connection, concurrency: 10 },
);

worker.on('failed', (job, err) => {
  console.error('email job failed', job?.id, err.message);
});`},{type:`heading2`,text:`Poison Messages and Dead-Letter Queues`},{type:`paragraph`,text:`A poison message is one that will never succeed no matter how often you retry — malformed JSON, a reference to a deleted user, a bug triggered by one specific input. Without a limit, it would be retried forever, burning capacity and (in an ordered queue) blocking everything behind it. A dead-letter queue is the quarantine area: after the maximum number of attempts, the message is moved aside, an alert fires, and engineers can fix the bug and "redrive" the messages back into the main queue.`},{type:`flow`,title:`Retry, back off, then dead-letter`,code:`flowchart TD
  M([Message delivered]):::queue --> P[Consumer processes]:::server
  P --> R{Result?}
  R -->|"success"| ACK([Ack - message removed]):::highlight
  R -->|"permanent error<br/>bad payload"| DLQ
  R -->|"temporary error<br/>timeout, 503"| N{Attempts under 5?}
  N -->|"yes"| WAIT["Wait 2^attempt s + jitter"]:::queue --> M
  N -->|"no"| DLQ[[Dead-letter queue<br/>alert + manual review]]:::security
  DLQ -.->|"after the fix: redrive"| M`,text:`Classify errors: retry the ones that might succeed later, dead-letter the ones that never will.`},{type:`callout`,variant:`warning`,text:`A DLQ nobody watches is just a slower way of losing data. Alert on DLQ depth > 0, and make redriving messages a routine, tested operation.`}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`bullets`,items:[`Producer: any service that publishes messages. Responsible for serializing, choosing a topic/queue and (for Kafka) a key.`,`Broker: the server cluster that stores and routes messages — Kafka brokers, a RabbitMQ node, or a managed service like SQS.`,`Queue / topic / partition: the named place messages live.`,`Consumer / worker: the process that reads and handles messages. Usually scaled horizontally.`,`Dead-letter queue: where messages go after too many failed attempts.`,`Schema / contract: the agreed shape of each message (JSON Schema, Avro, Protobuf, often in a schema registry). Producers and consumers evolve independently, so the contract must stay backward compatible.`]},{type:`heading2`,text:`RabbitMQ: Exchanges Route, Queues Store`},{type:`paragraph`,text:`In RabbitMQ, producers never publish directly to a queue. They publish to an exchange with a routing key, and bindings decide which queues get a copy. A direct exchange matches the key exactly, a topic exchange matches patterns like "order.*", and a fanout exchange copies to every bound queue. Consumers then read from queues and ack each message.`},{type:`flow`,title:`RabbitMQ topic exchange routing`,code:`flowchart LR
  P([Producer]):::client -->|"routing key order.placed"| X{{"Topic exchange: events"}}:::network
  X -->|"binding order.*"| Q1[[order-processing]]:::queue
  X -->|"binding #"| Q2[[audit-log]]:::queue
  X -.->|"binding user.* - no match"| Q3[[user-onboarding]]:::queue
  Q1 --> C1[Order worker]:::server
  Q2 --> C2[Audit worker]:::server`,text:`The exchange is the post office sorting room; queues are the mailboxes. The binding pattern "#" matches every key.`},{type:`heading2`,text:`Amazon SQS: Standard vs. FIFO`},{type:`bullets`,items:[`Standard queues: nearly unlimited throughput, at-least-once delivery (a message can occasionally arrive twice) and best-effort ordering (messages can arrive out of order).`,`FIFO queues: strict order within a message group (MessageGroupId, e.g. one group per customer) and deduplication of repeated sends within a 5-minute window. Throughput is lower — roughly hundreds to a few thousand messages per second, depending on batching and high-throughput mode.`,`Different message groups in a FIFO queue are processed in parallel, so the message group is the SQS equivalent of a Kafka partition key.`]},{type:`heading2`,text:`Kafka Producer and Consumer`},{type:`code`,lang:`typescript`,code:`// kafkajs
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'checkout', brokers: ['kafka-1:9092'] });

// Producer \u2014 key by orderId so all events for one order stay in order
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders',
  messages: [
    { key: '789', value: JSON.stringify({ type: 'OrderPlaced', orderId: 789, eventId: 'evt_9f2' }) },
  ],
});

// Consumer \u2014 every instance with groupId 'email-service' shares the partitions
const consumer = kafka.consumer({ groupId: 'email-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ partition, message }) => {
    const event = JSON.parse(message.value!.toString());
    await handleOrderEvent(event); // offset is committed after this resolves
  },
});`},{type:`callout`,variant:`info`,text:`Push vs. pull: RabbitMQ pushes messages to consumers, limited by a prefetch count (how many unacked messages a consumer may hold). SQS and Kafka consumers pull — they ask for the next batch when ready. Either way, the consumer controls its own pace, which is the basis of backpressure.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Checkout Publishes OrderPlaced`},{type:`paragraph`,text:`An online store’s checkout service saves the order and publishes one OrderPlaced event. Four independent services react to it: payment charges the card, inventory reserves stock, email sends a confirmation, and analytics updates dashboards. The checkout service does not know any of them exist.`},{type:`flow`,title:`One event, four independent reactions`,code:`flowchart LR
  U([Customer]):::client -->|"POST /checkout"| CO[Checkout service]:::server
  CO -->|"1. save order"| DB[(Orders DB)]:::db
  CO -->|"2. publish OrderPlaced"| T{{orders topic}}:::queue
  CO -->|"3. 201 Created"| U
  T --> PAY[Payment]:::security
  T --> INV[Inventory]:::server
  T --> EM[Email]:::server
  T --> AN[Analytics]:::server
  EM -.->|"calls"| SG[Email provider]:::external`},{type:`heading2`,text:`What Happens When the Email Service Is Down?`},{type:`numbered`,items:[`The email service crashes at 14:00. Checkout keeps working: it only needs the broker to accept the event.`,`Payment, inventory and analytics keep consuming normally — each has its own queue or consumer group.`,`OrderPlaced events for email pile up. Consumer lag for the email group grows: 0 → 4,000 → 12,000 messages.`,`A lag alert fires. On-call engineers fix and redeploy the email service at 14:25.`,`The email consumers resume from their last committed offset (or the messages still waiting in their queue) and work through the backlog in a few minutes.`,`Customers get their confirmation emails 25 minutes late — but no order failed and no email was lost.`]},{type:`flow`,title:`Email outage — everyone else carries on`,code:`sequenceDiagram
  participant CO as Checkout
  participant B as Broker
  participant P as Payment
  participant E as Email service
  CO->>B: OrderPlaced 789
  B-)P: deliver
  P->>B: ack
  B--xE: deliver fails, service is down
  Note over B: email backlog grows, others unaffected
  CO->>B: OrderPlaced 790, 791 ...
  B-)P: deliver
  Note over E: redeployed 25 min later
  E->>B: fetch from last committed position
  B-->>E: 789, 790, 791 ...
  E->>B: ack each after sending`,text:`The broker turns a hard dependency into a soft one: an outage becomes a delay rather than an error.`},{type:`callout`,variant:`tip`,text:`Notice that the email may now be sent twice — if the service crashed after calling the provider but before acking, that message is redelivered. The email consumer should record "confirmation sent for order 789" and skip it the second time. See idempotent consumers below.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — a message from producer to dead-letter queue`,code:`flowchart TB
  P([Producer]):::client -->|"1. publish"| B[Broker<br/>persist + replicate]:::queue
  B -->|"2. stored"| P
  B -->|"3. deliver"| C[Consumer group]:::server
  C -->|"4. idempotency check"| DS[(Processed-IDs table)]:::db
  C -->|"5. ack or commit offset"| B
  C -.->|"failure: no ack"| R[Retry with backoff]:::cache
  R -.-> B
  R -.->|"max attempts reached"| DLQ[[Dead-letter queue]]:::security`,text:`The happy path is publish → store → deliver → process → ack. Everything else in this lesson exists to handle the unhappy paths.`},{type:`diagram`,diagram:{id:`diagram-message-queue-lifecycle`,title:`Message Lifecycle Through a Broker`,subtitle:`Tracing one OrderPlaced event from the producer, through durable storage, to consumers, retries and the dead-letter queue`,nodes:[{id:`producer-publish`,name:`Producer (Checkout Service)`,subtitle:`Publish & Await Broker Confirmation`,type:`client`,icon:`ti-send`,badge:`Producer`,protocol:`key = orderId`,details:[`Serializes {type: "OrderPlaced", orderId: 789, eventId: "evt_9f2"} to JSON`,`Chooses the topic and partition key so all events for one order stay in order`,`Treats the message as safe only after the broker confirms it was stored`]},{id:`broker-persist`,name:`Broker Persistence & Replication`,subtitle:`Append to Log, Copy to Replicas`,type:`storage`,icon:`ti-stack-2`,badge:`Durable Storage`,protocol:`acks = all`,details:[`Appends the message to the partition log on disk and assigns offset 1042`,`Replicates to follower brokers (commonly a replication factor of 3) before acknowledging`,`Retains the message for the retention period (e.g. 7 days), whether or not it has been consumed`]},{id:`consumer-group`,name:`Consumer Group (Email Service)`,subtitle:`Partition Assignment & Pull`,type:`server`,icon:`ti-users-group`,badge:`Consumers`,protocol:`Poll batch`,details:[`Each partition is owned by one consumer in the group; adding consumers (up to the partition count) adds parallelism`,`Consumer polls a batch, processes messages in partition order`]},{id:`idempotent-handler`,name:`Idempotent Handler`,subtitle:`Deduplicate Before Side Effects`,type:`database`,icon:`ti-fingerprint`,badge:`Exactly-once effect`,protocol:`INSERT ... ON CONFLICT`,details:[`Records eventId in a processed_events table in the same transaction as the side effect`,`If eventId already exists, the duplicate delivery is skipped harmlessly`]},{id:`ack-commit`,name:`Acknowledge / Commit Offset`,subtitle:`Mark Progress Only After Success`,type:`network`,icon:`ti-circle-check`,badge:`Ack`,protocol:`commit offset 1043`,details:[`Kafka: commit the next offset to read; SQS: DeleteMessage; RabbitMQ: basic.ack`,`A crash before this step means redelivery — at-least-once by design`]},{id:`retry-dlq`,name:`Retry & Dead-Letter Queue`,subtitle:`Backoff, Then Quarantine`,type:`security`,icon:`ti-alert-octagon`,badge:`Failure Path`,protocol:`max 5 attempts`,details:[`Temporary failures are retried with exponential backoff plus jitter`,`After the maximum attempts, the message moves to a DLQ, an alert fires, and engineers redrive it after a fix`]}],connections:[{from:`producer-publish`,to:`broker-persist`,label:`1. Publish OrderPlaced`,protocol:`TCP / TLS`,type:`sync`},{from:`broker-persist`,to:`consumer-group`,label:`2. Deliver batch`,protocol:`Pull / Push`,type:`async`},{from:`consumer-group`,to:`idempotent-handler`,label:`3. Dedup + process`,protocol:`DB transaction`},{from:`idempotent-handler`,to:`ack-commit`,label:`4. Success → ack`,protocol:`Commit`},{from:`consumer-group`,to:`retry-dlq`,label:`Failure → retry or DLQ`,protocol:`Backoff`,type:`async`}],keyTakeaways:[`Durability first: a message is only safe once the broker has persisted (and ideally replicated) it and confirmed to the producer.`,`Ack last: acknowledging after processing gives at-least-once delivery. Duplicates are expected, so handlers must be idempotent.`,`Failure is a first-class path: backoff protects struggling dependencies, and the DLQ stops one poison message from blocking everything else.`],rawSpec:`Producer (Checkout)
   \u2502  publish {OrderPlaced, orderId 789, eventId evt_9f2}, key=789
   \u25BC
Broker \u2014 topic "orders", partition = hash(789) % 6 = 3
   \u2502  append at offset 1042, replicate to 2 followers, ack producer
   \u25BC
Consumer group "email-service" \u2014 consumer B owns partition 3
   \u2502  poll \u2192 [1040, 1041, 1042]
   \u25BC
Handler
   \u2502  BEGIN
   \u2502    INSERT INTO processed_events(event_id) VALUES ('evt_9f2')  \u2190 conflict? skip
   \u2502    INSERT INTO email_outbox(...)
   \u2502  COMMIT
   \u25BC
Commit offset 1043 for partition 3

Failure path:
   attempt 1 fails \u2192 wait ~1s \u2192 attempt 2 fails \u2192 wait ~2s \u2192 ...
   attempt 5 fails \u2192 move to orders.email.DLQ \u2192 alert`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Delivery Guarantees`},{type:`bullets`,items:[`At-most-once: ack (or commit) before processing. A crash loses the message, but it is never processed twice. Acceptable for metrics or log lines where a small loss is fine.`,`At-least-once: process, then ack. A crash after processing but before the ack causes redelivery, so duplicates happen. This is the default for SQS standard queues, RabbitMQ with manual acks, and typical Kafka consumers.`,`"Exactly-once": the broker cannot guarantee your side effects (an email sent, a card charged) happen exactly once — the network can always fail between doing the work and recording that it was done. Kafka offers exactly-once semantics for read-process-write pipelines that stay inside Kafka (idempotent producers + transactions), but once you touch an external system you are back to at-least-once.`]},{type:`callout`,variant:`important`,text:`The practical answer to "exactly-once" is: at-least-once delivery + idempotent consumers = exactly-once effect. Design every consumer so processing the same message twice gives the same result as processing it once.`},{type:`code`,lang:`typescript`,code:`// Idempotent consumer: dedupe on the event's unique id inside the same DB transaction
async function handleOrderPlaced(event: { eventId: string; orderId: number }) {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      'INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [event.eventId],
    );
    if (inserted.rowCount === 0) return; // already handled \u2014 duplicate delivery, skip

    await tx.query(
      'UPDATE inventory SET reserved = reserved + 1 WHERE order_id = $1',
      [event.orderId],
    );
  }); // both rows commit together, or neither does
}`},{type:`heading2`,text:`The Dual-Write Problem and the Transactional Outbox`},{type:`paragraph`,text:`Checkout must do two things: save the order in its database and publish OrderPlaced to the broker. These are two different systems, so there is no single transaction covering both. If the DB commit succeeds and the publish fails (broker unreachable, process killed), the order exists but nobody is ever told. If you publish first and the DB commit fails, consumers charge a card for an order that does not exist.`},{type:`paragraph`,text:`The transactional outbox fixes this. In the same database transaction that writes the order, you also insert the event into an outbox table. A separate relay process reads unpublished rows from the outbox and publishes them, marking each as sent. Either both the order and its event are committed, or neither is. The relay may publish an event twice (crash after publish, before marking), which is fine — consumers are idempotent.`},{type:`flow`,title:`Transactional outbox — one commit, then a relay`,code:`flowchart LR
  API[Checkout service]:::server -->|"single DB transaction"| TX
  subgraph TX["Orders database"]
    direction TB
    O[(orders row)]:::db
    OB[(outbox row<br/>OrderPlaced, sent = false)]:::db
  end
  RL[Outbox relay<br/>poller or CDC]:::cache -->|"1. read unsent rows"| OB
  RL -->|"2. publish"| BR[[Broker]]:::queue
  RL -->|"3. mark sent"| OB
  BR --> CS[Consumers]:::server`,text:`The relay can poll the table every few hundred milliseconds or use change data capture (CDC, e.g. Debezium reading the database’s write-ahead log).`},{type:`code`,lang:`sql`,code:`BEGIN;
INSERT INTO orders (id, user_id, total) VALUES (789, 123, 59.98);
INSERT INTO outbox (id, topic, key, payload, sent)
VALUES ('evt_9f2', 'orders', '789', '{"type":"OrderPlaced","orderId":789}', false);
COMMIT;

-- Relay (pseudo-code loop):
-- SELECT * FROM outbox WHERE sent = false ORDER BY created_at LIMIT 100;
-- publish each row to the broker, then
-- UPDATE outbox SET sent = true WHERE id = ANY(:publishedIds);`},{type:`heading2`,text:`Backpressure and Consumer Lag`},{type:`paragraph`,text:`Consumer lag is how far behind consumers are: in Kafka, the difference between the latest offset in a partition and the group’s committed offset; in SQS, the number of visible messages and the age of the oldest one. Lag is the single most important queue metric. Steady lag near zero is healthy; lag that only grows means consumers cannot keep up. Because consumers pull at their own pace (or set a prefetch limit), the queue naturally provides backpressure — overload becomes a growing backlog instead of crashed services.`},{type:`flow`,title:`Reacting to consumer lag`,code:`flowchart TD
  M[Monitor lag + oldest message age]:::cache --> D{Lag trend?}:::highlight
  D -->|"near zero, stable"| OK([Healthy]):::client
  D -->|"growing"| W{Why?}
  W -->|"more traffic"| SC["Scale out consumers<br/>up to the partition count"]:::server
  W -->|"slow dependency"| DEP["Fix or throttle the dependency<br/>check retries and DLQ"]:::external
  W -->|"one partition hot"| KEY["Rethink the partition key"]:::queue`},{type:`heading2`,text:`The Ordering vs. Parallelism Trade-off`},{type:`paragraph`,text:`Strict global ordering means one consumer handling one message at a time — no parallelism at all. Systems get throughput by relaxing ordering to "per key": Kafka orders within a partition, SQS FIFO within a message group. Pick the narrowest scope you actually need. Account balance updates must be ordered per account, not across all accounts. Retries also break ordering: if message 5 fails and is retried later while 6 and 7 succeed, they were applied out of order — so ordered consumers must either block the partition until 5 succeeds or be written to tolerate reordering (for example by ignoring updates with an older version number).`}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "Kafka keeps my topic in order." Reality: Only within each partition. Two events for the same order are ordered only if they share a key (and so a partition).`,`Myth: "Our broker has exactly-once delivery, so duplicates cannot happen." Reality: Retries, redeliveries, rebalances and outbox relays all produce duplicates. Make consumers idempotent regardless of what the broker advertises.`,`Myth: "Adding consumers always increases throughput." Reality: In Kafka, consumers beyond the partition count sit idle. In ordered queues, one slow key still limits its own stream.`,`Myth: "Once it is in the queue, it is safe forever." Reality: Kafka deletes data after the retention period; SQS deletes messages after its retention period (4 days by default, 14 at most). A consumer that is down longer than that loses messages.`,`Myth: "A queue makes the system faster." Reality: It makes the request faster. Total work is the same or more, and results become eventually consistent — the user may see "processing" for a while.`,`Myth: "Publishing after the DB commit is good enough." Reality: That is the dual-write problem. A crash between the two silently drops events. Use the outbox pattern when the event must not be lost.`]}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`paragraph`,text:`Message queues appear in almost every system design interview. Whenever you hear "send", "notify", "process later", "fan out" or "at scale", reach for one — and be ready to explain the delivery guarantee, the partition key and what happens on failure.`},{type:`bullets`,items:[`How Backend Works: the POST /api/orders walkthrough ends with "publish order_created to Kafka". This lesson is what happens after that line.`,`Notification System: a classic queue design — accept requests fast, fan out by channel (push, SMS, email), retry with backoff, dead-letter failures, and use idempotency keys so users are not notified twice.`,`Chat System: messages are partitioned by conversation id so each chat stays ordered while millions of chats are processed in parallel.`,`News Feed: fan-out-on-write publishes each new post to a queue that workers use to push it into followers’ feed caches.`,`Payment System: the outbox pattern and idempotency keys are essential — a charge must never be lost or doubled.`,`Video Streaming: an upload triggers a job queue of transcoding tasks (one per resolution) processed by a pool of workers.`]},{type:`heading2`,text:`Event-Driven Architecture: Choreography vs. Orchestration`},{type:`paragraph`,text:`When many services cooperate on one business flow, there are two styles. In choreography, each service listens for events and publishes its own — nobody is in charge, which keeps services decoupled but makes the overall flow hard to see. In orchestration, a central orchestrator (a saga coordinator or a workflow engine like Temporal or AWS Step Functions) sends commands to each service and tracks progress, which makes the flow explicit and easier to debug and compensate (undo), at the cost of a central component.`},{type:`flow`,title:`Choreography vs. orchestration`,code:`flowchart LR
  subgraph CH["Choreography - react to events"]
    direction TB
    O1[Order]:::server -->|"OrderPlaced"| P1[Payment]:::server
    P1 -->|"PaymentSucceeded"| I1[Inventory]:::server
    I1 -->|"StockReserved"| S1[Shipping]:::server
  end
  subgraph OR["Orchestration - a coordinator decides"]
    direction TB
    OC{{Order saga orchestrator}}:::highlight -->|"1. charge"| P2[Payment]:::server
    OC -->|"2. reserve"| I2[Inventory]:::server
    OC -->|"3. ship"| S2[Shipping]:::server
  end`,text:`Choreography suits simple, loosely related reactions (send an email, update analytics). Orchestration suits multi-step business transactions that need clear status and rollback.`},{type:`callout`,variant:`important`,text:`Interview checklist for any queue in your design: Which kind (work queue, pub/sub, log)? What is the partition key and why? What delivery guarantee, and how are consumers idempotent? What happens on repeated failure (backoff, DLQ)? How do you avoid the dual-write problem (outbox)? Which metric tells you it is falling behind (consumer lag)?`}]}]},{id:`back-of-the-envelope-estimation`,title:`Back-of-the-Envelope Estimation`,emoji:`🧮`,icon:`ti-calculator`,color:`#ca8a04`,bg:`#fef9c3`,accentGlow:`rgba(202,138,4,0.15)`,difficulty:`Intermediate`,tagline:`Turn "100 million users" into QPS, storage, bandwidth, cache size and server counts in five minutes — and let those numbers drive your design.`,tags:[`QPS`,`Storage Math`,`Latency Numbers`,`Availability Nines`,`Capacity Planning`],estimatedTime:`40 min`,sections:[{id:`what-is-it`,title:`What Is It?`,icon:`ti-question-mark`,blocks:[{type:`heading2`,text:`Quick Math That Is "Right Enough" to Decide`},{type:`paragraph`,text:`Back-of-the-envelope estimation is rough, fast arithmetic that tells you how big a system has to be. You start from a few stated assumptions (how many users, how often they act, how big each item is) and work out requests per second, storage, network bandwidth, cache memory and the number of servers. The goal is not a precise answer — it is the correct order of magnitude: is this 10 requests per second or 100,000? Gigabytes or petabytes?`},{type:`paragraph`,text:`The name comes from doing the sums on the back of an envelope: no spreadsheet, no benchmarks, just round numbers. Being within 2–3× of reality is good enough, because the design decisions you make (one database or a sharded cluster, a CDN or no CDN) only change when a number moves by 10× or more.`},{type:`callout`,variant:`info`,text:`In simple terms: before planning a wedding you do not count every guest’s exact meal — you ask "about 50 people or about 500?" That one rough number decides whether you book a restaurant or a stadium. Estimation does the same for software: one rough number decides whether you need one server or a fleet.`},{type:`flow`,title:`The big picture — assumptions in, decisions out`,code:`flowchart LR
  A["Assumptions<br/>users, actions, sizes"]:::client --> M["Quick math<br/>round aggressively"]:::server
  M --> Q["QPS<br/>average + peak"]:::highlight
  M --> S["Storage<br/>per day, per year"]:::db
  M --> B["Bandwidth<br/>in + out"]:::network
  M --> C["Cache memory<br/>hot set"]:::cache
  Q --> D["Design decisions<br/>servers, sharding, CDN, cache"]:::highlight
  S --> D
  B --> D
  C --> D`,text:`Every estimate exists to feed a decision. If a number does not change your design, you do not need to compute it.`}]},{id:`why-we-need-it`,title:`Why Do We Need It?`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Why Interviewers Ask for Estimates`},{type:`paragraph`,text:`In a system design interview, the estimate is not a maths test. The interviewer wants to see that your architecture is sized for the problem. A design for 50 requests per second and one for 500,000 requests per second look completely different, and you can only justify the difference with numbers.`},{type:`numbered`,items:[`Do we need sharding? If the data will reach 100+ TB, it will not fit on one database machine, so you must partition it. If it is 50 GB, a single primary with replicas is simpler and better.`,`Do we need a CDN? If outgoing traffic is tens of Gbps of images or video, serving it from your own servers is expensive and slow for far-away users. A CDN becomes mandatory.`,`How many servers? Peak QPS divided by what one server can handle gives the size of the application fleet — and tells you a load balancer is needed.`,`Do we need a cache, and how big? If reads outnumber writes 100:1 and the hot data is 100 GB, a few Redis nodes can absorb most of the read traffic.`,`Is the design even possible? Estimates catch impossible ideas early, e.g. "store every keystroke for 1 billion users forever" or "one database handling 1M writes per second".`]},{type:`flow`,title:`Each number drives a decision`,code:`flowchart TD
  Q{"Peak QPS above<br/>what one server handles?"} -->|"yes"| LB["Many app servers<br/>behind a load balancer"]:::server
  Q -->|"no"| ONE["A couple of servers<br/>for redundancy"]:::server
  S{"Data larger than<br/>one DB machine ~ few TB?"} -->|"yes"| SH["Shard or partition<br/>the database"]:::db
  S -->|"no"| REP["Single primary<br/>+ read replicas"]:::db
  B{"Egress in tens of Gbps<br/>of media?"} -->|"yes"| CDN["Put a CDN in front"]:::network
  R{"Reads far above writes?"} -->|"yes"| CA["Add a cache layer"]:::cache`,text:`Say the decision out loud right after each number: "~180K peak reads per second, so we need a cache and a fleet of stateless servers."`}]},{id:`how-it-works`,title:`How It Works`,icon:`ti-settings`,blocks:[{type:`heading2`,text:`From Users to Requests per Second`},{type:`paragraph`,text:`Almost every estimate starts with daily active users (DAU). Multiply DAU by how many times each user does something per day to get requests per day. Divide by the number of seconds in a day (86,400) to get the average requests per second (QPS — queries per second). Traffic is never flat, so multiply by a peak factor to get the number you actually design for.`},{type:`code`,lang:`text`,code:`requests/day = DAU \xD7 actions per user per day
average QPS  = requests/day \xF7 86,400        (\u2248 \xF7 100,000 for quick math)
peak QPS     = average QPS \xD7 peak factor    (usually \xD72 to \xD710)

Shortcuts worth memorising:
  1 million requests/day  \u2248 12 QPS          (1,000,000 \xF7 86,400 = 11.57)
  100 million / day       \u2248 1,160 QPS
  1 billion / day         \u2248 11,600 QPS      (\u2248 12K)
  10 billion / day        \u2248 116,000 QPS`},{type:`flow`,title:`The QPS funnel`,code:`flowchart LR
  DAU["DAU<br/>100M users"]:::client -->|"\xD7 10 actions each"| RPD["Requests per day<br/>1 billion"]:::server
  RPD -->|"\xF7 86,400 s"| AVG["Average QPS<br/>~11,600"]:::server
  AVG -->|"\xD7 3 peak factor"| PEAK["Peak QPS<br/>~35,000"]:::highlight`,text:`Design for the peak, not the average. The average tells you the daily cost; the peak tells you whether the system falls over.`},{type:`heading2`,text:`Choosing the Peak Factor`},{type:`bullets`,items:[`×2: Global, steady traffic spread across time zones (URL redirects, background APIs).`,`×3 to ×5: Consumer apps used mostly in the evening in a few time zones (social feeds, photo apps).`,`×10 or more: Spiky, event-driven traffic (ticket drops, flash sales, live sports, New Year’s Eve messages). Always justify the factor in one sentence.`]},{type:`heading2`,text:`From Items to Storage`},{type:`paragraph`,text:`Storage is items per day × size per item × days of retention, then × replication factor (usually 3 copies for durability). Separate small metadata (rows in a database) from large blobs (photos, videos in object storage) — they differ by 1,000× and end up in different systems.`},{type:`flow`,title:`The storage pipeline`,code:`flowchart LR
  N["New items per day"]:::client -->|"\xD7 bytes per item"| D["Bytes per day"]:::server
  D -->|"\xD7 365 \xD7 years kept"| T["Raw total"]:::db
  T -->|"\xD7 3 replicas"| R["Provisioned storage"]:::highlight
  R --> DEC{"Fits on one<br/>machine?"}
  DEC -->|"no"| SH["Shard / object storage"]:::db
  DEC -->|"yes"| ONE["Single primary + replicas"]:::db`},{type:`heading2`,text:`Bandwidth, Cache and Servers`},{type:`bullets`,items:[`Bandwidth = QPS × bytes per request (or response). Multiply bytes by 8 to get bits — network links are sold in Gbps, storage in GB.`,`Cache memory = hot items × bytes per item. The 80/20 rule: roughly 20% of the data receives 80% of the reads, so caching that 20% absorbs most of the traffic.`,`Servers = peak QPS ÷ QPS one server can handle, then add headroom (run servers at ~50–70% so a failure or a spike does not tip them over).`]}]},{id:`step-by-step`,title:`Step-by-Step Flow`,icon:`ti-list-numbers`,blocks:[{type:`heading2`,text:`The Estimation Method`},{type:`numbered`,items:[`State assumptions: write them on the board — DAU, actions per user per day, item sizes, retention, read/write ratio. Ask the interviewer to confirm or adjust them.`,`Requests per day: DAU × actions per user. Do it separately for writes (posts, uploads) and reads (views, redirects).`,`Average QPS: requests per day ÷ 86,400 (use ÷ 10^5 when speed matters, then remember it underestimates by ~14%).`,`Peak QPS: average × 2–10, with a one-line justification ("evening spike in one region, so ×3").`,`Read/write ratio: tells you whether to optimise reads (caches, replicas, CDN) or writes (queues, sharded write paths, append-only storage).`,`Storage: size per item × items per day × retention days, + replication factor. Separate metadata from blobs.`,`Bandwidth: ingress = write QPS × upload size; egress = read QPS × response size. Convert bytes/s to bits/s (× 8).`,`Cache memory: hot set (e.g. 20% of daily distinct items) × size per item.`,`Number of servers: peak QPS ÷ per-server capacity, rounded up, plus headroom and redundancy.`,`Sanity check and decide: compare against known systems, then say which design choice each number drives.`]},{type:`flow`,title:`The method as a pipeline`,code:`flowchart TD
  A["1. State assumptions"]:::client --> B["2. Requests per day"]:::server
  B --> C["3. Average QPS<br/>\xF7 86,400"]:::server
  C --> D["4. Peak QPS<br/>\xD7 2 to \xD7 10"]:::highlight
  D --> E["5. Read/write ratio"]:::server
  E --> F["6. Storage<br/>size \xD7 items \xD7 retention \xD7 replicas"]:::db
  F --> G["7. Bandwidth<br/>QPS \xD7 bytes \xD7 8"]:::network
  G --> H["8. Cache memory<br/>hot set \xD7 size"]:::cache
  H --> I["9. Servers<br/>peak \xF7 per-server capacity"]:::server
  I --> J{"10. Sanity check:<br/>plausible?"}
  J -->|"no - revisit an assumption"| A
  J -->|"yes"| K["Drive design decisions"]:::highlight`,text:`Keep the loop back to step 1: if a result looks absurd, an assumption is usually wrong, not the arithmetic.`},{type:`heading2`,text:`A Tiny Calculator`},{type:`code`,lang:`typescript`,code:`const SECONDS_PER_DAY = 86_400;

function estimate(dau: number, actionsPerUser: number, peakFactor: number, bytesPerItem: number) {
  const perDay = dau * actionsPerUser;
  const avgQps = perDay / SECONDS_PER_DAY;
  const peakQps = avgQps * peakFactor;
  const bytesPerDay = perDay * bytesPerItem;
  return { perDay, avgQps, peakQps, bytesPerDay };
}

// 100M DAU, 10 actions/day, \xD73 peak, 1 KB per item
estimate(100e6, 10, 3, 1_000);
// \u2192 perDay 1e9, avgQps \u2248 11,574, peakQps \u2248 34,722, bytesPerDay = 1 TB`},{type:`heading2`,text:`How to Present It in an Interview`},{type:`bullets`,items:[`Write the assumptions first, in a corner of the board, so the interviewer can challenge them early.`,`Round aggressively: 86,400 → 100,000; 365 → 400 if it helps; 2.5 MB → "a few MB". Say "≈" and move on.`,`Use powers of ten and units: "10^8 writes a day × 500 bytes = 5 × 10^10 bytes = 50 GB a day."`,`After each number, state the decision it drives: "50 GB/day × 5 years ≈ 90 TB raw — too big for one machine, so we shard."`,`Spend about 3–5 minutes. Estimation supports the design; it is not the design.`]}]},{id:`components`,title:`Components Involved`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Building Block 1 — Powers of Two and Data Sizes`},{type:`code`,lang:`text`,code:`Power   Exact value             \u2248 Decimal        Unit
2^10    1,024                   1 thousand        1 KB
2^20    1,048,576               1 million         1 MB
2^30    1,073,741,824           1 billion         1 GB
2^40    ~1.1 \xD7 10^12            1 trillion        1 TB
2^50    ~1.13 \xD7 10^15           1 quadrillion     1 PB

Typical object sizes (rough):
  ASCII character / small int     1 byte / 4 bytes
  64-bit ID or timestamp          8 bytes
  Tweet-sized text post           ~300 bytes text, ~1 KB with metadata
  Chat message                    ~100 bytes text, a few hundred with metadata
  Database row (user, URL)        ~0.5\u20131 KB including indexes
  Compressed photo (phone)        ~200 KB (feed size) to ~2\u20133 MB (original)
  1 minute of video               ~10 MB (480p) to ~40 MB (1080p) to 100+ MB (4K)`},{type:`callout`,variant:`tip`,text:`Treat 1 KB = 1,000 bytes in estimates. The 2.4% difference from 1,024 is far smaller than the error in your assumptions. Watch bits vs bytes instead: 1 Gbps link ≈ 125 MB/s.`},{type:`heading2`,text:`Building Block 2 — Time Conversions`},{type:`bullets`,items:[`Seconds per day: 24 × 60 × 60 = 86,400 ≈ 10^5.`,`Seconds per month (30 days): 2,592,000 ≈ 2.5 × 10^6.`,`Seconds per year: 31,536,000 ≈ 3 × 10^7 (a cute mnemonic: about π × 10^7).`,`So: X per day ÷ 10^5 ≈ X per second; X per second × 10^5 ≈ X per day.`]},{type:`heading2`,text:`Building Block 3 — Latency Numbers Every Engineer Should Know`},{type:`paragraph`,text:`These figures are approximate orders of magnitude, popularised by Jeff Dean and Peter Norvig and updated over the years. Exact values depend on hardware generation, so memorise the ladder (each rung is roughly 10–100× slower than the one before), not the decimals.`},{type:`code`,lang:`text`,code:`Operation                                   Approx. latency     Order
L1 cache reference                          ~1 ns               10^0 ns
L2 cache reference                          ~5 ns               10^1 ns
Main memory (RAM) reference                 ~100 ns             10^2 ns
Read 1 MB sequentially from RAM             ~10\u201350 \xB5s           10^4 ns
SSD random read (4 KB)                      ~100 \xB5s             10^5 ns
Round trip within the same datacenter       ~0.5 ms             10^5\u201310^6 ns
Read 1 MB sequentially from SSD             ~0.2\u20131 ms           10^6 ns
HDD disk seek                               ~10 ms              10^7 ns
Read 1 MB sequentially from HDD             ~5\u201320 ms            10^7 ns
Round trip cross-continent (US \u2194 Europe)    ~150 ms             10^8 ns`},{type:`flow`,title:`The latency ladder — each step is roughly 10–100× slower`,code:`flowchart LR
  L1["L1 cache<br/>~1 ns"]:::cache --> RAM["RAM<br/>~100 ns"]:::cache
  RAM --> SSD["SSD random read<br/>~100 \xB5s"]:::db
  SSD --> DC["Same-DC round trip<br/>~0.5 ms"]:::network
  DC --> HDD["HDD seek<br/>~10 ms"]:::db
  HDD --> WAN["Cross-continent round trip<br/>~150 ms"]:::external`,text:`Lessons: memory is ~1,000× faster than SSD random reads, a network hop inside a datacenter is cheap compared with a cross-continent one, and avoiding disk seeks and long-distance round trips is where most latency wins come from.`},{type:`heading2`,text:`Building Block 4 — Availability Nines`},{type:`paragraph`,text:`Availability is the fraction of time a service works. Allowed downtime = (1 − availability) × period. Using a 365-day year (525,600 minutes) and a 30-day month (43,200 minutes):`},{type:`code`,lang:`text`,code:`Availability   Downtime / year        Downtime / month (30d)   Downtime / day
99%            3.65 days (87.6 h)     7.2 hours                14.4 minutes
99.9%          8.76 hours             43.2 minutes             86.4 seconds
99.99%         52.56 minutes          4.32 minutes             8.64 seconds
99.999%        5.26 minutes (315 s)   25.9 seconds             0.86 seconds`},{type:`flow`,title:`Each extra nine cuts downtime by 10×`,code:`flowchart LR
  N2["99%<br/>3.65 days/yr"]:::external --> N3["99.9%<br/>8.76 h/yr"]:::server
  N3 --> N4["99.99%<br/>52.6 min/yr"]:::highlight
  N4 --> N5["99.999%<br/>5.26 min/yr"]:::security`,text:`Components in series multiply: two services at 99.9% that both must work give 99.9% × 99.9% ≈ 99.8%. Redundant copies in parallel push availability up.`}]},{id:`real-world-example`,title:`Real-World Example`,icon:`ti-device-laptop`,blocks:[{type:`heading2`,text:`Example 1 — URL Shortener (Read-Heavy, 5-Year Storage)`},{type:`paragraph`,text:`Same assumptions as the URL Shortener design lesson: 100 million new short URLs per day, a 100:1 read-to-write ratio (10 billion redirects per day), and records kept for 5 years. We assume ~500 bytes per stored record — the ~200-byte long URL plus short code, owner ID, timestamps, expiry and index overhead.`},{type:`code`,lang:`text`,code:`WRITES
  100M / day \xF7 86,400          \u2248 1,157 QPS        \u2192 ~1,160 avg, ~2,300 peak (\xD72, global traffic)
READS
  10B / day \xF7 86,400           \u2248 115,741 QPS      \u2192 ~116K avg, ~230K peak (\xD72)

STORAGE (5 years)
  URLs: 100M \xD7 365 \xD7 5         = 182.5 billion records   (1 year = 36.5 billion)
  Raw:  182.5B \xD7 500 bytes     = 91.25 TB
  \xD7 3 replicas                 \u2248 274 TB                  \u2192 must shard
  (URL bytes alone: 182.5B \xD7 200 B = 36.5 TB raw)

KEY SPACE
  62^6 \u2248 56.8 billion  < 182.5B  \u2192 6 characters are NOT enough
  62^7 \u2248 3.52 trillion > 182.5B  \u2192 7 characters, with ~19\xD7 room

BANDWIDTH
  Ingress: 1,157 \xD7 500 B       \u2248 0.58 MB/s       (tiny)
  Egress:  115,741 \xD7 500 B     \u2248 57.9 MB/s       \u2248 463 Mbps average

CACHE (80/20 rule)
  Assume ~1B distinct URLs are read per day; hot 20% = 200M
  200M \xD7 500 B                 = 100 GB          \u2192 a few Redis nodes
  (Naive "20% of all 10B daily reads \xD7 500 B" = 1 TB over-counts repeats)

SERVERS
  Assume ~10K redirects/s per server (cache hits, tiny responses)
  230K peak \xF7 10K              = 23  \u2192 ~30 servers with headroom`},{type:`flow`,title:`URL shortener — numbers and the decisions they drive`,code:`flowchart TB
  A["100M writes/day<br/>10B reads/day"]:::client --> W["~1,160 write QPS<br/>peak ~2,300"]:::server
  A --> R["~116K read QPS<br/>peak ~230K"]:::server
  R --> D1["Read-heavy:<br/>cache + ~30 stateless servers"]:::cache
  W --> S["182.5B records \xD7 500 B<br/>\u2248 91 TB raw, ~274 TB with 3 replicas"]:::db
  S --> D2["Shard the key-value store<br/>by short code"]:::db
  S --> D3["7-char Base62 codes<br/>62^7 \u2248 3.5 trillion"]:::highlight`},{type:`callout`,variant:`tip`,text:`Notice the asymmetry: writes are only ~1,160 per second (one well-indexed database could almost take them), but storage over 5 years and 230K peak reads are what force sharding and caching. The estimate tells you which problem is actually hard.`},{type:`divider`},{type:`heading2`,text:`Example 2 — Photo-Sharing App with a News Feed`},{type:`paragraph`,text:`Assumptions: 100M DAU. 10M photos uploaded per day (on average 1 in 10 users posts one). Each user views ~50 photos per day, in feed pages of 10 photos (5 feed requests per user). Originals average 2 MB; we also store resized versions totalling ~0.5 MB, so 2.5 MB per photo. A feed-size image served to viewers is ~200 KB. Metadata ~1 KB per photo. Evening peak ×3. Photos are kept forever.`},{type:`code`,lang:`text`,code:`TRAFFIC
  Uploads: 10M / 86,400              \u2248 116 QPS       \u2192 peak ~350
  Feed requests: 100M \xD7 5 = 500M/day \u2248 5,787 QPS     \u2192 peak ~17,400
  Image views: 100M \xD7 50 = 5B/day    \u2248 57,870 QPS    \u2192 peak ~174,000
  Read:write (views:uploads)         = 500 : 1

STORAGE
  Blobs/day: 10M \xD7 2.5 MB            = 25 TB per day
  Per year:  25 TB \xD7 365             = 9.125 PB
  \xD7 3 replicas                       \u2248 27.4 PB per year   (~137 PB over 5 years)
  Metadata: 10M \xD7 1 KB               = 10 GB per day (~3.65 TB per year)

BANDWIDTH
  Ingress: 10M \xD7 2 MB \xF7 86,400       \u2248 231 MB/s  \u2248 1.85 Gbps
  Egress:  5B \xD7 200 KB               = 1 PB per day
           \xF7 86,400                  \u2248 11.6 GB/s \u2248 92.6 Gbps average, ~278 Gbps peak

CACHE MEMORY
  Pre-built feeds: 100M users \xD7 200 post IDs \xD7 8 B  = 160 GB
  Hot metadata: last 30 days = 300M photos, hot 20% = 60M \xD7 1 KB = 60 GB
  Total \u2248 220 GB  \u2192 ~4 nodes of 64 GB, \xD72 for replicas \u2248 8 cache nodes

SERVERS
  Feed API at ~1,000 QPS per server: 17,400 \xF7 1,000 \u2248 18 \u2192 ~25 with headroom
  Image bytes are NOT served by these servers \u2014 they come from the CDN`},{type:`flow`,title:`Photo app — where each number lands`,code:`flowchart LR
  U(["100M DAU"]):::client -->|"10M uploads/day<br/>~1.85 Gbps in"| UP["Upload service"]:::server
  UP --> OBJ[("Object storage<br/>25 TB/day, ~27 PB/yr with replicas")]:::db
  UP --> META[("Metadata DB<br/>10 GB/day")]:::db
  U -->|"~17K peak feed QPS"| FEED["Feed API<br/>~25 servers"]:::server
  FEED --> RC[("Redis<br/>~220 GB feeds + metadata")]:::cache
  U -->|"~93 Gbps avg images"| CDN["CDN edge caches"]:::network
  CDN -.->|"cache miss"| OBJ`,text:`Egress of ~93 Gbps on average (and ~278 Gbps at peak) is the number that makes a CDN non-negotiable; 25 TB of new blobs per day is what pushes photos into object storage instead of a database.`}]},{id:`visual-flow`,title:`Visual Flow & Architecture Diagram`,icon:`ti-topology-star`,blocks:[{type:`flow`,title:`At a glance — from assumptions to architecture`,code:`flowchart LR
  A["1. Assumptions"]:::client --> T["2. Traffic<br/>avg + peak QPS"]:::server
  T --> S["3. Storage<br/>+ replication"]:::db
  S --> B["4. Bandwidth"]:::network
  B --> C["5. Cache memory"]:::cache
  C --> V["6. Servers +<br/>sanity check"]:::highlight`,text:`The step cards below walk through each stage with the formula and the decision it informs.`},{type:`diagram`,diagram:{id:`diagram-estimation-pipeline`,title:`Back-of-the-Envelope Estimation Pipeline`,subtitle:`How a handful of stated assumptions turn into QPS, storage, bandwidth, cache size and server counts`,nodes:[{id:`assumptions`,name:`State Assumptions`,subtitle:`DAU, Actions, Sizes, Retention`,type:`client`,icon:`ti-clipboard-list`,badge:`Inputs`,protocol:`Write them down first`,details:[`Daily active users and actions per user per day (split reads and writes)`,`Item sizes: ~1 KB metadata row, ~200 KB–2 MB photo, ~10–40 MB per video minute`,`Retention period and replication factor (usually 3)`]},{id:`traffic`,name:`Traffic Estimate`,subtitle:`Average and Peak QPS`,type:`server`,icon:`ti-activity`,badge:`QPS`,protocol:`÷ 86,400 then × peak`,details:[`1M requests/day ≈ 12 QPS; 1B/day ≈ 11,600 QPS`,`Peak factor ×2 (global, steady) to ×10+ (flash sales, live events)`,`Read/write ratio decides whether to optimise reads or writes`]},{id:`storage`,name:`Storage Estimate`,subtitle:`Items × Size × Retention × Replicas`,type:`database`,icon:`ti-database`,badge:`Storage`,protocol:`Bytes per day → per year`,details:[`Separate small metadata (database) from large blobs (object storage)`,`Multiply by 3 for replication; tens of TB or more means sharding`]},{id:`bandwidth`,name:`Bandwidth Estimate`,subtitle:`Ingress and Egress`,type:`network`,icon:`ti-arrows-exchange`,badge:`Network`,protocol:`QPS × bytes × 8`,details:[`Ingress = write QPS × upload size; egress = read QPS × response size`,`1 Gbps ≈ 125 MB/s; tens of Gbps of media egress means a CDN`]},{id:`cache`,name:`Cache Memory Estimate`,subtitle:`80/20 Hot Set`,type:`cache`,icon:`ti-bolt`,badge:`Memory`,protocol:`Hot items × size`,details:[`Cache ~20% of the distinct daily items to absorb ~80% of reads`,`Count distinct items, not raw requests, or you will over-provision`]},{id:`servers`,name:`Server Count & Sanity Check`,subtitle:`Peak ÷ Per-Server Capacity`,type:`gateway`,icon:`ti-server`,badge:`Fleet`,protocol:`Round up + headroom`,details:[`Run servers at ~50–70% utilisation so failures and spikes are absorbed`,`Compare with known systems: does the answer feel plausible?`]}],connections:[{from:`assumptions`,to:`traffic`,label:`1. Requests per day`,protocol:`DAU × actions`},{from:`traffic`,to:`storage`,label:`2. Writes per day`,protocol:`Items/day`},{from:`storage`,to:`bandwidth`,label:`3. Bytes per request`,protocol:`Item size`},{from:`bandwidth`,to:`cache`,label:`4. Hot read set`,protocol:`80/20 rule`},{from:`cache`,to:`servers`,label:`5. Remaining load`,protocol:`Peak QPS`}],keyTakeaways:[`Order of magnitude is the goal: being within 2–3× is fine because design decisions only change at ~10× boundaries.`,`Design for peak QPS, store with replication, and always separate metadata from blobs — they land in different systems.`,`Every number should end with a decision: shard or not, CDN or not, cache size, number of servers.`],rawSpec:`ASSUMPTIONS: 100M DAU, 10 actions/user/day, 1 KB/item, keep 5 years, \xD73 replicas
   \u2502
   \u25BC  requests/day = 100M \xD7 10 = 1B
[ TRAFFIC ]   avg = 1B \xF7 86,400 \u2248 11,600 QPS   peak (\xD73) \u2248 35,000 QPS
   \u2502
   \u25BC  writes/day \xD7 size
[ STORAGE ]   1B \xD7 1 KB = 1 TB/day \u2192 \xD7365\xD75 \u2248 1.8 PB \u2192 \xD73 \u2248 5.5 PB
   \u2502
   \u25BC  QPS \xD7 bytes \xD7 8
[ BANDWIDTH ] 11,600 \xD7 1 KB \u2248 11.6 MB/s \u2248 93 Mbps average
   \u2502
   \u25BC  hot 20% of distinct daily items
[ CACHE ]     e.g. 200M items \xD7 1 KB = 200 GB
   \u2502
   \u25BC  peak \xF7 per-server capacity
[ SERVERS ]   35,000 \xF7 2,000 \u2248 18 \u2192 ~25 with headroom`}}]},{id:`behind-the-scenes`,title:`Behind the Scenes`,icon:`ti-eye`,blocks:[{type:`heading2`,text:`Where the Numbers Come From`},{type:`bullets`,items:[`Latency numbers: measured on real hardware and published as a teaching list (Jeff Dean’s "numbers everyone should know"). CPU caches and RAM have changed little in a decade; SSDs and networks improved a lot, so treat older figures as upper bounds.`,`Object sizes: averages from real products — a compressed phone photo is a few MB at full size but ~100–300 KB at feed resolution; video size is bitrate × duration (5 Mbps × 60 s = 300 Mb ≈ 37.5 MB per minute at 1080p).`,`Per-server capacity: depends entirely on the work per request. A cache-hit redirect may do 10K+ QPS per server; a feed that fans out to several services may do a few hundred to ~1,000. A single Redis node handles ~100K simple operations per second.`,`Peak factors: come from traffic graphs — daily curves usually peak at 2–3× the average, while events like a product launch can hit 10–100× for minutes.`]},{type:`heading2`,text:`Why They Are Only Approximations`},{type:`paragraph`,text:`Every input is a guess, and errors multiply. If DAU is off by 2× and size per item is off by 2×, storage is off by 4×. That is acceptable because architecture choices are coarse: whether data is 70 TB or 280 TB, the answer is still "shard it". What is not acceptable is a 1,000× error from a unit slip (bits vs bytes, KB vs MB, per day vs per second).`},{type:`flow`,title:`Sanity-check loop`,code:`flowchart TD
  R["Result: e.g. 274 TB, 230K peak QPS"]:::server --> U{"Units consistent?<br/>bits vs bytes, day vs second"}
  U -->|"no"| FIX["Fix the unit slip"]:::external
  FIX --> R
  U -->|"yes"| K{"Plausible vs a known system?"}
  K -->|"no"| A["Revisit the assumption<br/>that dominates the product"]:::external
  A --> R
  K -->|"yes"| OK["Use it to make the decision"]:::highlight`,text:`Known anchors help: Twitter-scale systems see hundreds of thousands of reads per second; a single commodity server holds a few TB on SSD; a 10 Gbps NIC moves ~1.25 GB/s.`},{type:`heading2`,text:`Rounding Rules`},{type:`bullets`,items:[`Keep one or two significant figures: 115,741 → "~116K" or even "~100K".`,`Round in the direction that keeps you safe: round traffic and storage up, per-server capacity down.`,`Use powers of ten: 10^8 × 5 × 10^2 = 5 × 10^10 bytes = 50 GB. Adding exponents is faster than multiplying long numbers.`,`Don’t round twice in the same direction on every step, or a 10% tweak per step becomes a 2× drift by the end.`]}]},{id:`misconceptions`,title:`Common Misconceptions`,icon:`ti-alert-triangle`,blocks:[{type:`bullets`,items:[`Myth: "The interviewer wants the exact answer." Reality: they want reasonable assumptions, clean arithmetic and a decision. Saying "≈ 100K QPS, so we need a cache" beats computing 115,740.74 precisely.`,`Myth: "Average QPS is what you design for." Reality: systems fail at the peak. State a peak factor and size servers, databases and connection pools for it.`,`Myth: "Storage is just items × size." Reality: add retention, replication (×3), indexes and metadata overhead, and growth. Forgetting replication alone hides a 3× cost.`,`Myth: "Cache 20% of all requests." Reality: the 80/20 rule applies to distinct items. 10 billion reads of the same hot links do not need 10 billion cache entries.`,`Myth: "Latency numbers are fixed constants." Reality: they are hardware-dependent orders of magnitude. The ratios (RAM ≪ SSD ≪ cross-continent network) matter far more than the digits.`,`Myth: "More estimates are better." Reality: compute only the numbers that change a design decision, then move on — the interview clock is ticking.`]},{type:`callout`,variant:`warning`,text:`The most expensive estimation mistake is a unit slip: mixing bits and bytes (8×), KB and MB (1,000×), or per day and per second (86,400×). Write units next to every number.`}]},{id:`system-design-connection`,title:`System Design Connection`,icon:`ti-sitemap`,blocks:[{type:`bullets`,items:[`URL Shortener: 100M writes and 10B redirects per day → ~1,160 write QPS and ~116K read QPS; 5 years = 182.5B records, which is why 7-character Base62 codes and a sharded store with a cache in front are chosen.`,`News Feed: 300M DAU and reads ~100× writes → feed reads dominate, which justifies pre-computed feeds (fan-out on write) and a large feed cache.`,`Video Streaming: 5B views per day ≈ 58K views per second, and multi-PB of processed video → view counters batched in Redis, a CDN for delivery and object storage for segments.`,`Chat System: 500M DAU × 40 messages = 20B messages per day ≈ 230K writes per second, and ~50M concurrent connections ÷ ~50K per server ≈ 1,000 chat servers.`,`Rate Limiter: the number of checks per second (one per API request) decides whether a single Redis (~100K operations per second) is enough or Redis Cluster is needed.`]},{type:`flow`,title:`Where estimates shape the designs in this app`,code:`flowchart TB
  E["Back-of-the-envelope<br/>estimate"]:::highlight --> URL["URL Shortener<br/>~116K read QPS, 182.5B rows"]:::server
  E --> NF["News Feed<br/>reads ~100\xD7 writes"]:::server
  E --> VS["Video Streaming<br/>~58K views/s, PB storage"]:::server
  E --> CH["Chat System<br/>~230K msgs/s, ~1,000 servers"]:::server
  E --> RL["Rate Limiter<br/>checks/s vs ~100K ops per Redis"]:::server
  URL --> D1["Shard + cache"]:::db
  NF --> D2["Fan-out + feed cache"]:::cache
  VS --> D3["CDN + object storage"]:::network
  CH --> D4["WebSocket fleet"]:::network
  RL --> D5["Redis Cluster"]:::cache`},{type:`callout`,variant:`important`,text:`Interview recipe: spend ~3–5 minutes after clarifying requirements. Write assumptions, compute peak QPS, storage with replication, egress bandwidth and cache size, round aggressively, and finish every number with the design decision it drives.`}]}]}];export{K as t};