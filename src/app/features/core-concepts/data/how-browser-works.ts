import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 3 — How a Browser Works
// ─────────────────────────────────────────────────────────────────────────────
export const howBrowserWorks: CoreConcept = {
  id: 'how-browser-works',
  title: 'How a Browser Works',
  emoji: '⚡',
  icon: 'ti-browser',
  color: '#f59e0b',
  bg: '#fef3c7',
  accentGlow: 'rgba(245,158,11,0.15)',
  difficulty: 'Beginner',
  tagline:
    'From a URL to pixels on screen — parsing HTML, building DOM, executing JavaScript, rendering.',
  tags: ['DOM', 'CSSOM', 'Render Tree', 'JavaScript Engine', 'Painting'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'What a Browser Actually Is' },
        {
          type: 'paragraph',
          text: "A browser (Chrome, Firefox, Safari, Edge) is a program that downloads files from the Internet and turns them into the pages you see and click. Under the hood it is three main parts working together: a network client (downloads HTML, CSS, JS, images), a rendering engine (turns HTML and CSS into pixels on screen), and a JavaScript engine (runs the page's JavaScript code).",
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: a browser is like a builder handed a set of blueprints. The HTML says what rooms exist, the CSS says how they look, and the JavaScript says how things move and react. The browser reads all three, works out where everything goes, and then paints the finished house on your screen.',
        },
        {
          type: 'flow',
          title: 'The big picture — from URL to pixels',
          code: `flowchart LR
  U(["You type a URL"]):::client --> N["Network<br/>DNS, TCP, TLS, HTTP"]:::network
  N --> F["HTML, CSS, JS,<br/>images arrive"]:::external
  F --> P["Parse into<br/>DOM + CSSOM"]:::server
  F --> JS["JavaScript engine<br/>runs scripts"]:::server
  JS -->|"can change"| P
  P --> R["Layout, paint,<br/>composite"]:::server
  R --> S(["Pixels on screen"]):::highlight`,
          text: 'Fetch the files, understand them, then draw them. JavaScript can step in at any point and change what gets drawn.',
        },
        { type: 'heading2', text: 'Key Browser Components' },
        {
          type: 'bullets',
          items: [
            'Browser UI: Address bar, tabs, back/forward buttons.',
            'Rendering Engine: Chrome/Edge use Blink. Firefox uses Gecko. Safari uses WebKit. Converts HTML + CSS → pixels.',
            'JavaScript Engine: Chrome uses V8. Firefox uses SpiderMonkey. Executes JavaScript code.',
            'Network Layer: Handles HTTP/HTTPS requests, caching, cookies.',
            'Storage: localStorage, sessionStorage, IndexedDB, cookies.',
          ],
        },
        {
          type: 'flow',
          title: 'How the browser parts fit together',
          code: `flowchart TB
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
  REN --> SCR(["Screen"]):::highlight`,
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
          text: 'Without a browser, web pages would be raw text files. The browser is what transforms an HTML document — a structured text file — into the interactive, visual experience you see on screen. It handles the enormous complexity of rendering, JavaScript execution, security sandboxing, and network communication so web developers do not have to build all of this themselves.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Phase 1: Navigation' },
        {
          type: 'numbered',
          items: [
            'You type a URL (e.g., https://github.com) and press Enter.',
            'Browser checks if the URL is a search query or an actual URL.',
            'Browser performs a DNS lookup to resolve github.com → IP address.',
            'Browser establishes a TCP connection to the server on port 443.',
            'TLS handshake occurs to establish encrypted HTTPS connection.',
            'Browser sends an HTTP GET request for the page.',
            'Server responds with HTML.',
          ],
        },
        {
          type: 'flow',
          title: 'Phase 1 — navigation, step by step',
          code: `sequenceDiagram
  participant B as Browser
  participant D as DNS Resolver
  participant S as github.com server
  B->>B: Is this a URL or a search?
  B->>D: IP for github.com?
  D-->>B: 140.82.114.4
  B->>S: TCP handshake (port 443)
  B->>S: TLS handshake - agree on encryption keys
  B->>S: GET / (encrypted)
  S-->>B: 200 OK + HTML`,
          text: 'Several round trips happen before the first byte of HTML arrives. This is why connection reuse and nearby servers (CDNs) matter so much.',
        },
        { type: 'heading2', text: 'Phase 2: Parsing HTML → DOM' },
        {
          type: 'paragraph',
          text: 'The browser receives the HTML as raw bytes and turns it into a tree of objects called the DOM (Document Object Model) — one object per element, nested the same way the tags are nested. The parser reads the tags from top to bottom. When it hits a <script> tag, it pauses, downloads and runs the script, then continues (unless the script is marked async or defer). When it hits a CSS <link>, it starts downloading the CSS file in the background and keeps parsing.',
        },
        {
          type: 'flow',
          title: 'What the HTML parser does with each tag',
          code: `flowchart TD
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
  A --> T`,
          text: 'A plain script tag is the only thing that stops the parser in its tracks — that is why scripts are usually placed at the end or marked defer.',
        },
        { type: 'heading2', text: 'Phase 3: Parsing CSS → CSSOM' },
        {
          type: 'paragraph',
          text: 'CSS is parsed into a tree called the CSSOM (CSS Object Model), which records the final styles for every element. CSS is render-blocking: the browser will not draw anything until the CSSOM is complete. Otherwise it might draw the page unstyled and then have to redraw it a moment later.',
        },
        { type: 'heading2', text: 'Phase 4: Building the Render Tree' },
        {
          type: 'paragraph',
          text: 'DOM + CSSOM are combined into a Render Tree — the list of things that will actually appear on screen. Only visible elements are included (elements with display:none are left out). Each node in the render tree carries its final, computed CSS styles.',
        },
        { type: 'heading2', text: 'Phase 5: Layout (Reflow)' },
        {
          type: 'paragraph',
          text: 'The browser calculates the exact position and size of every element on the screen based on the CSS rules (width, height, margin, padding, flexbox, etc.).',
        },
        { type: 'heading2', text: 'Phase 6: Paint' },
        {
          type: 'paragraph',
          text: 'The browser fills in the actual pixels for each element — colors, borders, shadows, text. This happens in layers (CSS z-index creates layers).',
        },
        { type: 'heading2', text: 'Phase 7: Compositing' },
        {
          type: 'paragraph',
          text: 'The painted layers are handed to the GPU (graphics chip), which stacks them together into the final image on screen — like stacking transparent sheets. Hardware-accelerated transforms and animations happen at this stage, which is why they are so smooth.',
        },
        {
          type: 'flow',
          title: 'Phases 2-7 — the rendering pipeline',
          code: `flowchart LR
  H["HTML"]:::external --> DOM["DOM tree"]:::server
  C["CSS"]:::external --> CSSOM["CSSOM tree"]:::server
  DOM --> RT["Render tree<br/>visible nodes + styles"]:::server
  CSSOM --> RT
  RT --> L["Layout<br/>position + size"]:::server
  L --> P["Paint<br/>fill pixels per layer"]:::server
  P --> CO["Composite<br/>GPU stacks layers"]:::highlight`,
          text: 'Two parallel trees merge into one, then each step adds detail: what to show, where it goes, what it looks like, and finally the image on screen.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'Complete Flow: URL to Pixels' },
        {
          type: 'code',
          lang: 'text',
          code: `User types: https://github.com/explore

1. URL Parse: scheme=https, host=github.com, path=/explore
2. DNS: github.com → 140.82.114.4
3. TCP Connect: SYN → SYN-ACK → ACK  (~50ms)
4. TLS Handshake: Client Hello → Server Hello → Keys (~50ms)
5. HTTP GET /explore → 200 OK + HTML
6. Parse HTML → DOM tree
   While parsing:
   → Encounter <link rel="stylesheet"> → fetch CSS (parallel)
   → Encounter <script> → pause parsing, execute JS (or defer)
   → Encounter <img> → fetch image (parallel)
7. Parse CSS → CSSOM
8. DOM + CSSOM → Render Tree
9. Layout: calculate positions and sizes
10. Paint: fill pixels per element
11. Composite: GPU combines layers → Display

Total time goal: < 1 second for initial paint (First Contentful Paint)`,
        },
        {
          type: 'flow',
          title: 'URL to pixels — network part, then rendering part',
          code: `flowchart TB
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
  E --> F`,
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'JavaScript Engine — V8 (Chrome)' },
        {
          type: 'bullets',
          items: [
            'Parses JavaScript source code into an Abstract Syntax Tree (AST).',
            'Compiles to bytecode (Ignition interpreter).',
            'Hot code paths are identified and compiled to optimized machine code (TurboFan JIT compiler).',
            'This is why JavaScript, once considered slow, now runs at near-native speed.',
          ],
        },
        {
          type: 'flow',
          title: 'How V8 runs your JavaScript',
          code: `flowchart LR
  SRC["JS source code"]:::client --> AST["Parser<br/>builds AST"]:::server
  AST --> BC["Ignition<br/>bytecode, runs right away"]:::server
  BC --> HOT{"Function run<br/>many times?"}
  HOT -->|"yes, hot"| TF["TurboFan<br/>optimized machine code"]:::highlight
  HOT -->|"no"| BC
  TF -.->|"assumptions broken,<br/>de-optimize"| BC`,
          text: 'Start quickly with bytecode, then spend extra effort compiling only the code that runs often. JIT means "just-in-time" — compiled while the program is running.',
        },
        { type: 'heading2', text: 'Event Loop — The Heart of JavaScript' },
        {
          type: 'paragraph',
          text: 'JavaScript is single-threaded: it can only do one thing at a time. Slow work like network requests and timers is handed off to the browser, so the main thread is not stuck waiting. When that work finishes, its callback (the function to run next) is put in a task queue. The Event Loop keeps checking: whenever the call stack (the code currently running) is empty, it takes the next callback from the queue and runs it.',
        },
        {
          type: 'flow',
          title: 'The event loop',
          code: `flowchart LR
  CS["Call stack<br/>code running now"]:::server -->|"fetch, setTimeout"| WA["Browser APIs<br/>network, timers"]:::external
  WA -->|"done, queue callback"| Q[["Task queue"]]:::queue
  Q --> EL{"Event loop:<br/>is the stack empty?"}
  EL -->|"yes"| CS
  EL -->|"no, wait"| EL`,
          text: 'Long-running code on the call stack blocks everything — clicks, rendering and callbacks all wait until it finishes.',
        },
        { type: 'heading2', text: 'Browser Caching' },
        {
          type: 'bullets',
          items: [
            'HTTP Cache: Stores server responses. Cache-Control headers determine how long to cache.',
            'Service Worker Cache: JavaScript-controlled offline cache.',
            'Memory Cache: Short-lived in-memory cache for the current page session.',
            'Disk Cache: Persistent cache stored on disk across sessions.',
          ],
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Performance Optimization in Practice' },
        {
          type: 'paragraph',
          text: 'Understanding how browsers work explains every web performance optimization technique:',
        },
        {
          type: 'bullets',
          items: [
            'Minification: Remove whitespace from CSS/JS → smaller files → faster download.',
            'Code splitting: Load only the JavaScript needed for the current page (not the whole app).',
            'Lazy loading images: Only load images when they scroll into the viewport.',
            'async/defer on scripts: Do not block HTML parsing while loading JS.',
            'Critical CSS: Inline the CSS needed for above-the-fold content to avoid render-blocking.',
            'HTTP/2: Multiple resources can be fetched in parallel over a single connection.',
            'Preloading: <link rel="preload"> tells the browser to fetch critical resources immediately.',
          ],
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
          title: 'Critical rendering path at a glance',
          code: `flowchart LR
  BY["Bytes from network"]:::network --> TOK["Tokenize"]
  TOK --> DOM["DOM"]:::server
  TOK --> CSSOM["CSSOM"]:::server
  DOM --> RT["Render tree"]:::server
  CSSOM --> RT
  RT --> L["Layout"]:::server
  L --> PC["Paint + composite"]:::highlight`,
          text: 'Every page goes through this pipeline. The cards below explain what happens inside each stage.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-browser-pipeline',
            title: 'Critical Rendering Path & Browser Engine Pipeline',
            subtitle:
              'How HTML/CSS/JS byte streams are transformed into 60fps GPU rasterized screen pixels',
            nodes: [
              {
                id: 'network-tokenizer',
                name: 'Bytes → Tokens → Nodes',
                subtitle: 'HTML/CSS Lexer & Tokenizer',
                type: 'network',
                icon: 'ti-binary',
                badge: 'Lexical Analysis',
                protocol: 'UTF-8 Stream',
                details: [
                  'Reads raw bytes from network socket; decodes character sets (UTF-8)',
                  'Emits StartTag, EndTag, and Character tokens using state machine',
                  'Spawns preload scanner in background to download external CSS and scripts',
                ],
              },
              {
                id: 'dom-tree-builder',
                name: 'DOM Tree Construction',
                subtitle: 'Document Object Model',
                type: 'client',
                icon: 'ti-binary-tree',
                badge: 'DOM Tree',
                protocol: 'Node Hierarchy',
                details: [
                  'Builds nested object tree representing all elements, attributes, and relationships',
                  'Executes HTML parser tolerance (auto-closes unclosed tags like <p>)',
                  'Synchronous <script> tags block DOM construction until downloaded & evaluated',
                ],
              },
              {
                id: 'cssom-engine',
                name: 'CSSOM Construction',
                subtitle: 'CSS Object Model',
                type: 'client',
                icon: 'ti-paint',
                badge: 'Style Resolution',
                protocol: 'Cascading Rules',
                details: [
                  'Parses stylesheets, inline styles, and browser user-agent defaults',
                  'Calculates specificity and cascading rules for every node',
                  'Render-blocking: browser refuses to paint until CSSOM is 100% complete',
                ],
              },
              {
                id: 'render-tree',
                name: 'Render Tree Synthesis',
                subtitle: 'Visible Nodes Pruning',
                type: 'gateway',
                icon: 'ti-layers-intersect',
                badge: 'Render Tree',
                protocol: 'DOM + CSSOM',
                details: [
                  'Combines DOM and CSSOM to represent everything visually painted on screen',
                  'Prunes non-visible nodes (<head>, <script>, <meta>, and elements with display:none)',
                  'Includes pseudo-elements like ::before and ::after',
                ],
              },
              {
                id: 'layout-reflow',
                name: 'Layout / Reflow Engine',
                subtitle: 'Box Model Geometry Calculation',
                type: 'server',
                icon: 'ti-dimensions',
                badge: 'Geometry (x, y, w, h)',
                protocol: 'Box Model',
                details: [
                  'Calculates exact viewport-relative coordinates and pixel dimensions for each box',
                  'Translates percentages and em/rem units into absolute device pixel values',
                  'Layout thrashing occurs when JavaScript repeatedly reads and writes geometry in loops',
                ],
              },
              {
                id: 'paint-compositor',
                name: 'Paint & GPU Compositing',
                subtitle: 'Rasterization & Layer Blending',
                type: 'database',
                icon: 'ti-device-desktop',
                badge: 'GPU Compositor',
                protocol: '60–120 FPS Output',
                details: [
                  'Rasterizes element boxes into pixel bitmaps across multiple GPU graphic layers',
                  'GPU Compositor merges layers on screen; handles CSS transforms & opacity without CPU reflow',
                ],
              },
            ],
            connections: [
              {
                from: 'network-tokenizer',
                to: 'dom-tree-builder',
                label: '1. Tokens to DOM Nodes',
                protocol: 'AST',
              },
              {
                from: 'network-tokenizer',
                to: 'cssom-engine',
                label: '2. CSS Bytes to Style Rules',
                protocol: 'CSSOM',
              },
              {
                from: 'dom-tree-builder',
                to: 'render-tree',
                label: '3. Merge Visible Nodes',
                protocol: 'DOM+CSSOM',
              },
              {
                from: 'render-tree',
                to: 'layout-reflow',
                label: '4. Compute Pixel Geometry',
                protocol: 'Box Model',
              },
              {
                from: 'layout-reflow',
                to: 'paint-compositor',
                label: '5. Rasterize & Composite Layers',
                protocol: 'GPU Draw',
              },
            ],
            keyTakeaways: [
              'Display: none vs Visibility: hidden: display:none is omitted from the Render Tree completely (no layout). visibility:hidden occupies space in Layout and only skips Paint.',
              'Composite-Only Properties: Animating transform and opacity executes exclusively on the GPU compositor thread, completely bypassing expensive Layout and Paint phases.',
              'Async vs Defer: <script async> executes immediately upon download (interrupts parsing). <script defer> downloads in parallel and executes strictly after DOM parsing finishes.',
            ],
            rawSpec: `HTML Bytes → Tokenize → DOM Tree
                             ↓
CSS Bytes  → Tokenize → CSSOM   ↓
                     ↓      ↓
                   Render Tree (DOM + CSSOM)
                             ↓
                        Layout/Reflow
                     (compute x, y, w, h of every element)
                             ↓
                          Paint
                    (fill pixels per element)
                             ↓
                        Composite
                    (GPU merges layers to screen)

JS modifications:
element.style.width = '200px'  → forces Layout → Paint → Composite
element.style.color = 'red'    → forces Paint → Composite (skips Layout)
element.style.transform = '...' → forces Composite only (runs on GPU)`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'The Critical Rendering Path' },
        {
          type: 'paragraph',
          text: 'The Critical Rendering Path is the sequence of steps the browser takes to convert HTML, CSS, and JS into pixels. Optimizing this path is the core of web performance engineering. The goal is to minimize the number of bytes needed for first render and the number of round-trips to the server.',
        },
        { type: 'heading2', text: 'Reflow and Repaint — The Expensive Operations' },
        {
          type: 'bullets',
          items: [
            'Reflow (Layout): When JavaScript changes the DOM in a way that affects element positions or sizes (e.g., adding a div, changing width), the browser must recalculate layout for the affected elements and their children. Expensive.',
            'Repaint: When only visual properties change (color, background) without affecting layout. Cheaper than reflow.',
            "Compositing: CSS transforms (transform, opacity) only trigger compositing — no reflow or repaint. Cheapest. That's why animations should use transform instead of changing left/top.",
          ],
        },
        {
          type: 'flow',
          title: 'Which work does a style change trigger?',
          code: `flowchart TD
  CH([JS or CSS changes a style]):::client --> Q1{"Changes size<br/>or position?"}
  Q1 -->|"yes: width, margin, left"| L["Layout"]:::security
  L --> P["Paint"]:::cache
  Q1 -->|"no"| Q2{"Changes how<br/>it looks?"}
  Q2 -->|"yes: color, background"| P
  Q2 -->|"no: transform, opacity"| C["Composite only<br/>runs on GPU"]:::highlight
  P --> C`,
          text: 'The higher up the pipeline a change starts, the more work the browser must redo. Smooth animations stick to transform and opacity.',
        },
        { type: 'heading2', text: 'Browser Security — The Same-Origin Policy' },
        {
          type: 'paragraph',
          text: 'JavaScript on a page from site-a.com is not allowed to read responses from site-b.com. This is the Same-Origin Policy — a critical security boundary. An "origin" is the combination of scheme, domain and port (e.g., https://site-a.com:443). CORS (Cross-Origin Resource Sharing) is how site-b.com can explicitly say "I trust site-a.com, let it read my responses."',
        },
        {
          type: 'flow',
          title: 'Same-origin policy and CORS',
          code: `sequenceDiagram
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
  end`,
          text: 'The browser, not the server, enforces the rule. The server only decides which origins it trusts by sending the CORS header.',
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
            'Myth: "JavaScript is slow." Reality: Modern V8/SpiderMonkey JIT compilers produce near-native speed code. Performance issues are usually algorithmic, not language-speed.',
            'Myth: "The browser downloads the whole page before showing anything." Reality: Browsers stream HTML and render incrementally as data arrives.',
            'Myth: "More JavaScript = slower page." Reality: It depends on when and how JS is loaded. async/defer loading can make JS have zero impact on initial render.',
            'Myth: "CSS is trivial, only JS matters for performance." Reality: CSS is render-blocking. A large unoptimized CSS file can delay first paint more than JavaScript.',
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
            'Server-Side Rendering (SSR): Render HTML on the server. Browser receives ready-to-display HTML → faster First Contentful Paint.',
            'Client-Side Rendering (CSR): Send minimal HTML + lots of JS. Browser builds DOM from JS. Slower initial load, but faster subsequent navigation.',
            'Static Site Generation (SSG): Pre-generate HTML at build time. Fastest possible delivery.',
            'CDN for static assets: JS/CSS/images served from CDN edge nodes. Reduces download latency by serving from nearest server.',
            'Web Vitals: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift) — measurable performance metrics derived directly from understanding the rendering pipeline.',
          ],
        },
      ],
    },
  ],
};
