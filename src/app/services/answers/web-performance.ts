import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What are Core Web Vitals (LCP, INP, CLS), what are the thresholds, and why do they matter?': {
    summary:
      'Core Web Vitals are three user-centred metrics from Google: **LCP** (loading: when the main content appears), **INP** (responsiveness: how fast the page reacts to clicks, taps and key presses) and **CLS** (visual stability: how much content jumps around). "Good" is LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1, measured at the **75th percentile** of real page loads, separately for mobile and desktop. They matter because they track what users actually feel, they are visible in Search Console and CrUX, and they feed Google Search page experience signals, although content relevance still dominates ranking.',
    details: [
      {
        type: 'paragraph',
        text: 'Each metric answers one question a user would ask: "Is it useful yet?" (LCP), "Does it respond when I touch it?" (INP), "Is it stable, or will I click the wrong thing?" (CLS). INP replaced **FID** (First Input Delay) as a Core Web Vital in **March 2024**. FID measured only the input delay of the first interaction, whereas INP looks at the full latency of all interactions across the visit.',
      },
      { type: 'heading3', text: 'Thresholds' },
      {
        type: 'bullets',
        items: [
          '**LCP** (Largest Contentful Paint): good ≤ 2.5 s, needs improvement 2.5–4 s, poor > 4 s. The render time of the largest image or text block in the viewport.',
          '**INP** (Interaction to Next Paint): good ≤ 200 ms, needs improvement 200–500 ms, poor > 500 ms. Roughly the worst interaction latency on the page, from input to the next frame painted.',
          '**CLS** (Cumulative Layout Shift): good ≤ 0.1, needs improvement 0.1–0.25, poor > 0.25. A unitless score for unexpected layout shifts (the largest burst of shifts during the page lifetime).',
        ],
      },
      {
        type: 'paragraph',
        text: 'A page or origin "passes" when **all three** are good at the **p75** of page loads. Using p75 means three out of four visits must meet the target, so a fast median with a slow tail still fails. Mobile and desktop are assessed separately because devices and networks differ so much.',
      },
      { type: 'heading3', text: 'Diagnostic metrics (not Core Web Vitals)' },
      {
        type: 'bullets',
        items: [
          '**TTFB** (Time to First Byte): server, CDN, redirects and connection setup. A slow TTFB caps how good LCP can be.',
          '**FCP** (First Contentful Paint): when anything renders. A big gap between FCP and LCP points at a late hero image or client-side rendering.',
          '**TBT** (Total Blocking Time): a lab metric for main-thread blocking during load, used as a proxy for INP in Lighthouse.',
        ],
      },
      { type: 'heading3', text: 'Where the numbers come from' },
      {
        type: 'paragraph',
        text: 'Field data comes from the **Chrome UX Report (CrUX)**: anonymised data from opted-in Chrome users, a rolling 28-day window, shown in PageSpeed Insights and Search Console. For your own detail (per route, per release, per user segment), collect them yourself with the `web-vitals` library (real-user monitoring).',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log); // { name: 'LCP', value: 1840, rating: 'good', ... }
onINP(console.log);
onCLS(console.log);`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Do not oversell SEO. Core Web Vitals are one of many page experience signals, and Google says relevance comes first. The stronger business case is conversion and bounce rate: slow, janky pages lose users regardless of ranking.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: quote the three thresholds, say "at p75, split by mobile and desktop", mention that INP replaced FID in 2024, and then say how you would track them over time with RUM rather than a single Lighthouse score.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why p75 and not the average?',
          'Why was FID replaced by INP?',
          'Your Lighthouse score is 95 but CrUX says LCP fails. Why?',
          'Which metric would you fix first, and how would you decide?',
        ],
      },
    ],
  },

  'How do you improve Largest Contentful Paint (LCP)?': {
    summary:
      'First find the LCP element (usually a hero image or a large heading), then split its time into four parts: **TTFB**, **resource load delay**, **resource load duration** and **element render delay**, and fix the biggest one. Typical fixes are a faster server and CDN cache, making the LCP image discoverable in the HTML with `fetchpriority="high"` (never lazy-loaded), smaller modern image formats, removing render-blocking CSS and JS, and server-rendering or prerendering the content instead of building it in the browser.',
    details: [
      {
        type: 'paragraph',
        text: 'Guessing wastes time, so I measure the breakdown first: the `web-vitals` attribution build, or the Performance panel, which shows the LCP element and its sub-parts. (The end-to-end "slow first load" debugging scenario, including bundle analysis, is covered in the Frontend Debugging topic; this answer focuses on the LCP mechanics.)',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { onLCP } from 'web-vitals/attribution';

onLCP(({ value, attribution: a }) => {
  console.table({
    total: value,
    ttfb: a.timeToFirstByte,
    loadDelay: a.resourceLoadDelay,       // discovered late?
    loadDuration: a.resourceLoadDuration, // too heavy?
    renderDelay: a.elementRenderDelay,    // blocked by CSS/JS?
  });
});`,
      },
      { type: 'heading3', text: 'Fixes per sub-part' },
      {
        type: 'numbered',
        items: [
          '**TTFB**: cache HTML at the CDN edge where possible, avoid redirect chains, make the server render fast (cache data, stream the response), use early hints or preconnect for third-party origins.',
          '**Resource load delay** (the gap between TTFB and the image request starting): the browser must discover the image early. Put a real `<img>` in the server HTML, not a CSS `background-image`, not injected by JavaScript, and **never** `loading="lazy"`. Add `fetchpriority="high"`. If it really must be discovered late (for example, chosen by CSS), use `<link rel="preload" as="image">`.',
          '**Resource load duration**: send fewer bytes. AVIF/WebP, correct dimensions via `srcset`/`sizes`, an image CDN, compression, and serving from the same origin or a preconnected one.',
          '**Element render delay**: the image arrived but could not paint. Causes are render-blocking stylesheets, synchronous scripts in `<head>`, web fonts hiding the text, or a client-rendered app that must download and run JavaScript before the element exists. Inline critical CSS, `defer` scripts, and use SSR or static prerendering.',
        ],
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- LCP hero: in the HTML, high priority, responsive, sized -->
<img src="/img/hero-800.avif"
     srcset="/img/hero-800.avif 800w, /img/hero-1600.avif 1600w"
     sizes="100vw" width="1600" height="900"
     fetchpriority="high" alt="Summer collection">

<!-- Only if the LCP image is discovered late (e.g. CSS background) -->
<link rel="preload" as="image" href="/img/hero-1600.avif"
      imagesrcset="/img/hero-800.avif 800w, /img/hero-1600.avif 1600w"
      imagesizes="100vw" fetchpriority="high">`,
      },
      {
        type: 'paragraph',
        text: 'Text can be the LCP element too. Then the usual blockers are fonts (use `font-display: swap` or `optional`) and CSS. In Angular, `NgOptimizedImage` with the `priority` attribute applies the image part of this for you.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A very common regression: a team adds `loading="lazy"` to every image "for performance", including the hero. Lazy images wait for layout before they start loading, which can add hundreds of milliseconds to LCP. Lazy-load only below-the-fold images.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say the four sub-parts by name and give one fix for each. It shows you diagnose before you optimise, which is what separates a senior answer from a list of tricks.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you find which element is the LCP element for most users?',
          'Why does a client-rendered SPA usually have a large element render delay?',
          'When is `preload` worse than `fetchpriority="high"`?',
          'How does a carousel or a cookie banner affect LCP?',
        ],
      },
    ],
  },

  'What is Interaction to Next Paint (INP), and how do you fix a slow interaction?': {
    summary:
      'INP measures how long it takes from a click, tap or key press until the browser paints the next frame, and reports roughly the worst interaction of the visit; good is ≤ 200 ms at p75. Each interaction has three phases: **input delay** (the main thread is busy), **processing time** (your event handlers) and **presentation delay** (style, layout and paint of the result). I find the slow interaction with `web-vitals` attribution and Long Animation Frames, then break up long tasks, yield to the main thread, do less work per interaction, and move heavy work off the main thread or defer it.',
    details: [
      {
        type: 'paragraph',
        text: 'Scrolling and hovering are not interactions for INP; clicks, taps and keyboard input are. On pages with many interactions, the browser ignores one outlier per 50 interactions, so INP is close to the worst case, not the average.',
      },
      { type: 'heading3', text: 'Measure: which interaction, which phase, which script' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { onINP } from 'web-vitals/attribution';

onINP(({ value, attribution: a }) => {
  sendToAnalytics({
    inp: value,
    target: a.interactionTarget,       // CSS selector of the element
    inputDelay: a.inputDelay,
    processing: a.processingDuration,
    presentation: a.presentationDelay,
    loaf: a.longAnimationFrameEntries, // scripts that blocked the frame
  });
});

// Long Animation Frames: frames > 50 ms, with script attribution
new PerformanceObserver((list) => {
  for (const frame of list.getEntries()) {
    for (const s of frame.scripts) console.log(s.sourceURL, s.invoker, s.duration);
  }
}).observe({ type: 'long-animation-frame', buffered: true });`,
      },
      { type: 'heading3', text: 'Fix by phase' },
      {
        type: 'bullets',
        items: [
          '**Input delay**: something else was running, a **long task** (> 50 ms) from hydration, a timer, analytics or a third-party tag. Break up startup work, load third-party scripts later or with lower priority, and avoid heavy work in timers.',
          '**Processing time**: your handler does too much. Do only the visible update first, then yield and do the rest (analytics, saving, recalculating other widgets). Debounce input-driven work such as filtering on every keystroke.',
          '**Presentation delay**: the DOM update is too big or forces expensive layout. Render less (virtualise long lists, `content-visibility: auto` for off-screen sections), avoid layout thrashing (reading `offsetHeight` after writing styles in a loop), and animate with `transform`/`opacity`.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `function yieldToMain() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0)); // fallback
}

button.addEventListener('click', async () => {
  showSpinnerAndSelectedState(); // the visual feedback, first
  await yieldToMain();           // let the browser paint the next frame
  recalculateTotals();           // heavier, non-urgent work afterwards
  await yieldToMain();
  sendAnalytics();
});`,
      },
      {
        type: 'paragraph',
        text: '`scheduler.yield()` continues your task with priority ahead of other queued tasks, so work resumes sooner than with `setTimeout`, which goes to the back of the queue. It is not in every browser yet, hence the fallback. For genuinely CPU-heavy work (parsing a big file, sorting 100k rows, image processing), move it to a **Web Worker** so the main thread stays free.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Lab tools under-report INP: a fast developer laptop with no extensions and no third-party tags hides the problem. Test with CPU throttling (4x to 6x) and confirm with field data from real low-end Android devices.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name the three phases and say that the fix depends on which one dominates. "Give visual feedback first, then yield, then do the rest" is the single most useful pattern to describe.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'What is a long task, and how is a long animation frame different?',
          'Why does `await` on a resolved promise not yield to the browser?',
          'How do third-party scripts affect INP, and how do you contain them?',
          'In a framework app, how does change detection or re-rendering show up in INP?',
        ],
      },
    ],
  },

  'What causes Cumulative Layout Shift (CLS), and how do you prevent it?': {
    summary:
      'CLS adds up unexpected movements of visible content, weighted by how much of the viewport moved and how far. The usual causes are images, videos, iframes and ads without reserved space, content injected above existing content (cookie banners, promos, late API results), web fonts swapping with different metrics, and animations that change layout properties. Prevention is mostly about **reserving space**: `width`/`height` or `aspect-ratio`, fixed slots for ads and banners, skeletons with the final size, matched fallback fonts, and `transform` animations.',
    details: [
      { type: 'heading3', text: 'How the score is calculated' },
      {
        type: 'bullets',
        items: [
          'Each shift scores **impact fraction × distance fraction** (how much of the viewport was affected, times how far it moved).',
          'Shifts are grouped into **session windows**: a burst of shifts less than 1 s apart, with a window lasting at most 5 s. CLS is the score of the **largest window**, not the sum over the whole visit, so long-lived SPAs are not punished for simply being open long.',
          'Shifts within **500 ms of a user input** (click, tap, key press) are excluded, because expected changes, such as opening an accordion, are not a problem. Scrolling does not count as input for this.',
          'Good is ≤ 0.1 at p75; poor is > 0.25.',
        ],
      },
      { type: 'heading3', text: 'Causes and fixes' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Images: width/height lets the browser compute the aspect ratio before load -->
<img src="/p/42.webp" width="640" height="480" alt="Blue sofa"
     style="width: 100%; height: auto">

<!-- Embeds and ad slots: reserve the space up front -->
<div class="ad-slot" style="min-height: 250px"></div>
<iframe src="https://www.youtube.com/embed/xyz" style="aspect-ratio: 16 / 9; width: 100%"></iframe>`,
      },
      {
        type: 'bullets',
        items: [
          '**Late-injected content**: cookie banners, "download our app" bars and notifications should overlay (fixed position) or have reserved space, never push content down. Data loaded after render should go into a skeleton of the same height.',
          '**Web fonts**: when a fallback font is swapped for the web font, text reflows. Use a fallback font tuned with `size-adjust` and `ascent-override`, or `font-display: optional`, and preload the critical font file.',
          '**Animations**: animating `top`, `left`, `height` or `margin` moves other content and counts as shifts. Animate `transform` and `opacity` instead; they run on the compositor and do not cause layout shifts.',
          '**Back/forward cache**: pages restored from bfcache avoid re-layout entirely; avoid `unload` handlers that block it.',
        ],
      },
      {
        type: 'code',
        lang: 'css',
        code: `/* Fallback font tuned to match the web font's metrics (values are per font) */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
}
body { font-family: 'Inter', 'Inter Fallback', sans-serif; }

/* Slide in a panel without shifting layout */
.panel { transform: translateY(100%); transition: transform 200ms; }
.panel.open { transform: translateY(0); }`,
      },
      {
        type: 'paragraph',
        text: 'To find the culprit, use the `web-vitals` attribution build for `onCLS` (it reports the element that shifted most and when), or the Performance panel, which highlights layout shifts. Remember that field CLS includes shifts that happen later in the visit, such as after scrolling into lazy content, which Lighthouse never sees.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Shifts that happen while the user scrolls are **not** excluded. Lazy-loaded images without dimensions further down the page can give a good Lighthouse CLS and a poor field CLS.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the session window and the 500 ms input exclusion. It shows you understand why an accordion opening is fine but a banner appearing two seconds after load is not.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why does setting `width` and `height` still work with responsive CSS?',
          'How do you handle ads whose size you do not know in advance?',
          'Lighthouse CLS is 0 but field CLS is 0.2. Where do you look?',
        ],
      },
    ],
  },

  'Lab data vs field data: how do you measure performance with Lighthouse, DevTools, CrUX and real-user monitoring?':
    {
      summary:
        '**Lab data** (Lighthouse, PageSpeed Insights lab section, DevTools) is one synthetic load on a fixed device and network: reproducible and great for debugging, but not what users experience. **Field data** (CrUX, and your own RUM with the `web-vitals` library) is what real users on real devices got, and it is what Core Web Vitals are judged on. I use field data to decide **what** to fix and lab tools to find **why** and verify the fix before release.',
      details: [
        { type: 'heading3', text: 'The tools' },
        {
          type: 'bullets',
          items: [
            '**Lighthouse**: simulated mid-range mobile with throttled CPU and network, cold cache, no interactions. Gives LCP, CLS, TBT and diagnostics. Run it in DevTools, the CLI or Lighthouse CI.',
            '**PageSpeed Insights**: CrUX field data for the URL and origin at the top, a Lighthouse lab run below. Many people only read the score and miss the field section.',
            '**CrUX**: p75 field data from opted-in Chrome users over 28 days. Available via PSI, Search Console, the CrUX API and BigQuery. Chrome only, and low-traffic pages may have no data.',
            '**DevTools Performance panel**: live LCP, CLS and INP as you use the page, with CPU and network throttling, a trace showing long tasks, layout and paint, and it can show your CrUX field data next to the local numbers.',
            '**RUM**: your own collection of web vitals from every visit, with route, release, device and country attached. This is the only source that covers all browsers your users have and gives per-route detail.',
          ],
        },
        { type: 'heading3', text: 'Why lab and field disagree' },
        {
          type: 'bullets',
          items: [
            '**Devices and networks**: real users have slow Android phones and flaky 4G, or fast desktops on fibre; the lab picks one profile.',
            '**Cache and state**: Lighthouse uses a cold cache and a logged-out session; real users have warm caches, cookies, A/B variants, consent banners and personalised content.',
            '**Interactions**: a Lighthouse navigation run does not click anything, so it **cannot measure INP**. Use **TBT** as the lab proxy, and DevTools live metrics or Lighthouse user flows to test interactions.',
            '**Lifetime**: field CLS and INP cover the whole visit, including scrolling and later interactions.',
          ],
        },
        { type: 'heading3', text: 'Real-user monitoring with `web-vitals`' },
        {
          type: 'code',
          lang: 'javascript',
          code: `import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,         // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,                 // dedupe: CLS/INP can report more than once
    route: location.pathname,
    release: window.APP_VERSION,
  });
  // sendBeacon survives page unload; fall back to keepalive fetch
  if (!navigator.sendBeacon?.('/rum', body)) {
    fetch('/rum', { method: 'POST', body, keepalive: true });
  }
}

onCLS(send); onINP(send); onLCP(send); onTTFB(send);`,
        },
        {
          type: 'paragraph',
          text: 'On the backend, aggregate to **p75 per route, device type and release**, and alert when a release moves p75 past a threshold. Commercial RUM products (Datadog, Sentry, New Relic and others) do this out of the box.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'The Lighthouse performance score is a weighted lab summary, not a Core Web Vitals result. Chasing 100 on a developer laptop can hide a failing field p75. Always check the field section first.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say "field tells me what, lab tells me why", give two reasons they disagree (device/network and missing interactions), and mention that Lighthouse uses TBT because it cannot measure INP.',
        },
        { type: 'heading3', text: 'Follow-ups they may ask' },
        {
          type: 'bullets',
          items: [
            'Your page has no CrUX data. What do you do?',
            'How do you attribute a regression to a specific release?',
            'Why use `sendBeacon` instead of a normal `fetch`?',
            'How would you sample RUM on a high-traffic site?',
          ],
        },
      ],
    },

  'How does the critical rendering path work, and what blocks rendering?': {
    summary:
      'The browser parses HTML into the **DOM** and CSS into the **CSSOM**, combines them into the **render tree**, computes **layout** (sizes and positions), **paints** pixels and **composites** layers to the screen. **CSS is render-blocking**: nothing is painted until the stylesheets in `<head>` are loaded. **Synchronous scripts are parser-blocking**: the parser stops to download and run them, and they also wait for pending CSS. So the fast path is small inlined critical CSS, `defer` or `type="module"` scripts, and HTML that lets the preload scanner find important resources early.',
    details: [
      { type: 'heading3', text: 'The steps' },
      {
        type: 'numbered',
        items: [
          '**HTML → DOM**: parsed incrementally as bytes arrive, which is why streaming the HTML helps.',
          '**CSS → CSSOM**: CSS cannot be applied partially (later rules can override earlier ones), so the browser waits for each blocking stylesheet completely.',
          '**Render tree**: visible nodes with computed styles (`display: none` nodes are left out).',
          '**Layout**: geometry of every box. Expensive on large DOMs and repeated when sizes change.',
          '**Paint**: draw text, colours, images, borders into layers.',
          '**Composite**: combine layers on the GPU. `transform` and `opacity` changes can skip layout and paint, which is why they animate smoothly.',
        ],
      },
      { type: 'heading3', text: 'What blocks' },
      {
        type: 'code',
        lang: 'html',
        code: `<head>
  <!-- Render-blocking: paint waits for this -->
  <link rel="stylesheet" href="/app.css">

  <!-- Not blocking for screen: media does not match, downloaded at low priority -->
  <link rel="stylesheet" href="/print.css" media="print">

  <!-- Parser-blocking: parsing stops, and it also waits for app.css -->
  <script src="/legacy.js"></script>

  <!-- Downloads in parallel, runs after parsing, in order, before DOMContentLoaded -->
  <script defer src="/main.js"></script>

  <!-- Downloads in parallel, runs as soon as it arrives, order not guaranteed -->
  <script async src="https://analytics.example.com/tag.js"></script>

  <!-- Module scripts are deferred by default -->
  <script type="module" src="/app.mjs"></script>
</head>`,
      },
      {
        type: 'bullets',
        items: [
          '`defer`: for app code that needs the DOM and depends on other scripts in order.',
          '`async`: for independent scripts such as analytics that nothing else depends on.',
          'Sync scripts in `<head>`: avoid, except for tiny inline snippets that must run first (for example, setting a theme class to avoid a flash).',
        ],
      },
      { type: 'heading3', text: 'The preload scanner' },
      {
        type: 'paragraph',
        text: 'While the main parser is blocked on a script, a secondary **preload scanner** reads ahead in the raw HTML and starts downloading `<img>`, `<link>` and `<script src>` resources it finds. It cannot see resources referenced only from CSS (backgrounds, fonts), created by JavaScript, or hidden in `data-src` attributes for lazy-loading libraries. That is the main reason client-rendered content and CSS background hero images load late.',
      },
      { type: 'heading3', text: 'Optimising it' },
      {
        type: 'bullets',
        items: [
          '**Inline critical CSS** (what the first viewport needs) in `<head>` and load the rest without blocking. Keep the inline part small, because it is not cached separately and is sent with every HTML response.',
          'Reduce CSS size: remove unused rules, split per route.',
          'Move scripts to `defer`/`module`; split bundles so less JavaScript is needed for first render.',
          'Server-render or prerender HTML so content does not wait for JavaScript at all.',
          'Avoid `@import` in CSS: it creates a request chain the preload scanner cannot see in advance.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Making all CSS non-blocking is not a free win: the page then paints unstyled and jumps when styles arrive (a flash of unstyled content and layout shifts). Only defer what is truly below the fold.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the classic follow-up is "`async` vs `defer`". Answer with execution timing and order, and give one example of when each is right.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why does a synchronous script wait for CSS that comes before it?',
          'What triggers layout vs paint vs only composite?',
          'How does streaming SSR change the critical path?',
        ],
      },
    ],
  },

  'How do you load images and fonts efficiently (modern formats, responsive images, lazy loading, `font-display`)?':
    {
      summary:
        'For images: serve **AVIF or WebP** with a fallback via `<picture>`, send the right size with `srcset`/`sizes`, always set `width`/`height`, lazy-load below-the-fold images with `loading="lazy"` but **never** the LCP image, and use an image CDN to automate formats and resizing. For fonts: use **WOFF2**, subset to the characters you need, self-host where possible, choose `font-display: swap` or `optional`, and preload only the one or two fonts used above the fold, with `crossorigin`.',
      details: [
        { type: 'heading3', text: 'Images' },
        {
          type: 'code',
          lang: 'html',
          code: `<picture>
  <source type="image/avif" srcset="/p/sofa-400.avif 400w, /p/sofa-800.avif 800w">
  <source type="image/webp" srcset="/p/sofa-400.webp 400w, /p/sofa-800.webp 800w">
  <img src="/p/sofa-800.jpg"
       srcset="/p/sofa-400.jpg 400w, /p/sofa-800.jpg 800w"
       sizes="(min-width: 1024px) 33vw, 100vw"
       width="800" height="600"
       loading="lazy" decoding="async"
       alt="Blue three-seater sofa">
</picture>`,
        },
        {
          type: 'bullets',
          items: [
            '**Formats**: AVIF usually compresses best, WebP is a safe second, JPEG/PNG the fallback. `<picture>` lets the browser pick the first type it supports. An image CDN can do this automatically based on the `Accept` header.',
            '**`srcset` + `sizes`**: `srcset` lists the available widths, `sizes` tells the browser how wide the image will be displayed, so it can choose before CSS loads. Without `sizes`, the browser assumes `100vw` and often downloads an image far too large.',
            '**`loading="lazy"`**: native lazy loading for images and iframes below the fold. Not on the LCP image or anything in the first viewport.',
            '**`decoding="async"`**: hints that decoding need not block other rendering; a small win for non-critical images.',
            '**Dimensions**: `width`/`height` attributes prevent layout shifts (CLS).',
            '**Icons and simple graphics**: SVG (inline or sprite) instead of icon fonts or PNGs.',
          ],
        },
        { type: 'heading3', text: 'Fonts' },
        {
          type: 'code',
          lang: 'html',
          code: `<!-- Preload only the critical font; crossorigin is required even for same-origin fonts -->
<link rel="preload" href="/fonts/inter-latin-600.woff2" as="font" type="font/woff2" crossorigin>

<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-latin-600.woff2') format('woff2');
    font-weight: 600;
    font-display: swap;                 /* show fallback text immediately */
    unicode-range: U+0000-00FF;          /* only download for Latin characters */
  }
</style>`,
        },
        {
          type: 'bullets',
          items: [
            '**`font-display: swap`**: text shows immediately in the fallback, then swaps (good for brand fonts, but can cause a layout shift). **`optional`**: uses the web font only if it is ready very quickly, otherwise keeps the fallback for that page view (no shift, best for CLS). Avoid the default `block` behaviour, which hides text.',
            '**Subsetting** and `unicode-range`: ship only the scripts and glyphs you use. Variable fonts can replace several weight files with one.',
            '**Self-hosting** vs a third-party font service: self-hosting avoids an extra connection to another origin and gives you control over caching and preloading. Browsers partition their cache per site, so a shared font CDN no longer gives a cross-site cache benefit.',
            '**Fallback metrics**: `size-adjust` and `ascent-override` on a local fallback font reduce the reflow when the web font arrives.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Preloading every font weight is a common mistake: the preloads compete with the LCP image and CSS for bandwidth. A font preload without `crossorigin` is also fetched twice, because the actual font request is made in CORS mode.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: show the full `<img>` with `srcset`, `sizes`, `width`/`height` and the right loading attribute, and explain the trade-off between `swap` (text visible, may shift) and `optional` (stable, may not show the brand font). In Angular, `NgOptimizedImage` enforces most of the image rules.',
        },
        { type: 'heading3', text: 'Follow-ups they may ask' },
        {
          type: 'bullets',
          items: [
            'How does the browser choose an image from `srcset` on a high-DPR screen?',
            'When would you use an image CDN instead of a build-time pipeline?',
            'Why is a CSS background image a bad choice for a hero?',
          ],
        },
      ],
    },

  'How do HTTP caching headers and a CDN work together for a web app (`Cache-Control`, `ETag`, immutable assets)?':
    {
      summary:
        'The pattern is: **hashed static assets** (`main.3f9a1c.js`) are cached for a year with `Cache-Control: public, max-age=31536000, immutable`, because a new build gets a new filename; **`index.html` is revalidated** on every load (`no-cache` plus an `ETag`), so users pick up new releases immediately. The CDN caches both at the edge, controlled by `s-maxage` and its cache key, and a deploy only needs to invalidate the HTML. Validators turn repeat downloads into cheap `304 Not Modified` responses.',
      details: [
        {
          type: 'paragraph',
          text: 'The concrete S3 and CloudFront setup (upload order, invalidation of `index.html`) is covered in the AWS topic, and the "users see a `ChunkLoadError` after a deploy" scenario in Frontend Debugging. Here are the underlying HTTP rules.',
        },
        { type: 'heading3', text: '`Cache-Control` directives' },
        {
          type: 'bullets',
          items: [
            '**`max-age=N`**: fresh for N seconds in any cache. **`s-maxage=N`**: overrides it for shared caches (CDNs, proxies) only.',
            '**`no-cache`**: may be stored, but must be **revalidated** with the server before each use. Not "do not cache".',
            '**`no-store`**: must not be stored at all. For sensitive responses (account pages, personal API data).',
            '**`private`**: only the browser may cache it, not the CDN. Use for per-user responses.',
            '**`immutable`**: the content will never change during its freshness, so the browser skips revalidation even when the user reloads.',
            '**`stale-while-revalidate=N`**: after expiry, serve the stale copy for up to N seconds while fetching a new one in the background. Great for API responses and HTML that can be a little stale.',
          ],
        },
        {
          type: 'code',
          lang: 'http',
          code: `# Hashed JS/CSS/fonts/images
Cache-Control: public, max-age=31536000, immutable

# index.html: always check, cheap 304 if unchanged; CDN may hold it briefly
Cache-Control: no-cache
ETag: "a1b2c3"

# Public API data that can be slightly stale
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600

# Revalidation round trip
GET /index.html
If-None-Match: "a1b2c3"
-> 304 Not Modified   (no body sent)`,
        },
        { type: 'heading3', text: 'Validators' },
        {
          type: 'paragraph',
          text: '`ETag` (a content fingerprint) and `Last-Modified` let the browser ask "has this changed?" with `If-None-Match` or `If-Modified-Since`. If not, the server answers `304` with no body. That still costs a round trip, which is why hashed assets use `immutable` instead and skip the check completely.',
        },
        { type: 'heading3', text: 'The CDN side' },
        {
          type: 'bullets',
          items: [
            '**Cache key**: by default host + path (+ query string, depending on config). Every extra header or cookie you add to the key lowers the hit ratio, so include only what changes the response.',
            '**`Vary`**: tells caches which request headers change the response, typically `Vary: Accept-Encoding`. `Vary: Cookie` or `User-Agent` effectively disables shared caching.',
            '**Invalidation**: with hashed filenames you only invalidate `index.html` (or nothing, if it is `no-cache`). Purging everything on each deploy throws away the edge cache.',
            '**Compression**: Brotli for text assets (better ratio than gzip for JS/CSS), gzip as fallback, negotiated via `Accept-Encoding`. Pre-compress static files at build time at maximum level.',
            '**Protocols**: HTTP/2 multiplexes many requests over one connection (so bundling everything into one file matters less); HTTP/3 runs over QUIC and handles lossy mobile networks better. Most CDNs enable both.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: "Never give `index.html` a long `max-age`. Users will keep loading an old HTML that points to old chunks, and if those were deleted on deploy, the app breaks. Also keep previous builds' assets available for a while after each deploy.",
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: explain `no-cache` vs `no-store` correctly (many candidates get it backwards) and describe the "hashed assets forever, HTML always revalidated" strategy in one sentence.',
        },
        { type: 'heading3', text: 'Follow-ups they may ask' },
        {
          type: 'bullets',
          items: [
            'How would you cache a personalised page or an authenticated API?',
            'What is the difference between a browser cache hit and a CDN hit?',
            'How does a service worker cache interact with HTTP caching?',
          ],
        },
      ],
    },

  'What are resource hints (`preload`, `preconnect`, `prefetch`, `fetchpriority`), and when do they backfire?':
    {
      summary:
        'Resource hints tell the browser about work it would otherwise discover late: `preconnect` opens a connection to an origin early, `dns-prefetch` only resolves DNS, `preload` fetches a resource needed for **this** page now, `modulepreload` does the same for ES modules, `prefetch` fetches something for a **likely next** navigation at low priority, and `fetchpriority` raises or lowers the priority of a specific request. They backfire when overused: every preload competes for bandwidth with the LCP image and CSS, unused preloads waste bytes, and too many preconnects waste connection setup.',
      details: [
        {
          type: 'code',
          lang: 'html',
          code: `<!-- Early connection to a critical third-party origin (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://cdn.example-images.com">
<link rel="dns-prefetch" href="https://cdn.example-images.com"> <!-- cheap fallback -->

<!-- Needed now, but discovered late (font referenced from CSS) -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- ES module fetched and parsed early -->
<link rel="modulepreload" href="/js/checkout.mjs">

<!-- Probably needed on the next page, low priority -->
<link rel="prefetch" href="/js/product-page.js">

<!-- Raise the hero, lower a below-the-fold carousel image -->
<img src="/hero.avif" fetchpriority="high" alt="..." width="1200" height="600">
<img src="/slide-2.avif" fetchpriority="low" alt="..." width="1200" height="600">`,
        },
        { type: 'heading3', text: 'When to use which' },
        {
          type: 'bullets',
          items: [
            '**`preconnect`**: for 1–3 origins you will definitely use early (image CDN, API, font host). Each preconnect costs CPU and sockets, and an unused one is closed after a few seconds.',
            '**`preload`**: only for late-discovered, critical resources on the current page (fonts in CSS, a CSS background LCP image, a script loaded by another script). The `as` attribute must be correct, or the browser downloads it twice and warns that the preload was unused.',
            '**`fetchpriority`**: prefer it over `preload` when the resource is already in the HTML. `high` on the LCP image, `low` on images that are in the markup but not visible yet. It also works on `fetch()` via the `priority` option.',
            '**`prefetch`**: for the next navigation (the next step of a checkout). Low priority, stored in the HTTP cache. Wasted if the user never goes there, and it costs mobile data.',
            '**Speculation Rules API**: a JSON `<script type="speculationrules">` block that prefetches or even fully **prerenders** likely next pages, making navigations near-instant. Chromium-only for now, so treat it as progressive enhancement.',
          ],
        },
        {
          type: 'code',
          lang: 'html',
          code: `<script type="speculationrules">
{
  "prerender": [
    { "where": { "href_matches": "/products/*" }, "eagerness": "moderate" }
  ]
}
</script>`,
        },
        { type: 'heading3', text: 'How they backfire' },
        {
          type: 'bullets',
          items: [
            '**Over-preloading**: ten preloads in `<head>` all start at high priority and delay the CSS and the LCP image. If everything is a priority, nothing is.',
            '**Wrong or missing `as`/`crossorigin`**: double downloads.',
            '**Preloading what the preload scanner already finds**: no benefit, just noise.',
            '**Stale hints**: a preload for a file that was renamed or no longer used keeps downloading bytes on every page view. Lighthouse and the DevTools console warn about unused preloads.',
            '**Prerendering pages with side effects**: analytics page views or state changes may fire for pages the user never sees, unless the code checks `document.prerendering`.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Always measure a hint before and after (network waterfall plus LCP in the field). Hints are easy to add and rarely removed, so they pile up and quietly make things slower.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: the senior signal is restraint. Say "preload is for late-discovered critical resources only, `fetchpriority` for things already in the HTML", and give one example of a preload that made LCP worse.',
        },
        { type: 'heading3', text: 'Follow-ups they may ask' },
        {
          type: 'bullets',
          items: [
            'What is the difference between `preload` and `prefetch` in priority and cache?',
            'How do 103 Early Hints relate to `preload` and `preconnect`?',
            'How would you decide which routes to prefetch or prerender?',
          ],
        },
      ],
    },

  'How do you set and enforce a performance budget in CI?': {
    summary:
      'A performance budget is a set of limits the team agrees on, for example "initial JavaScript ≤ 200 kB compressed", "LCP ≤ 2.5 s in the lab on mobile", "no more than N third-party requests". I enforce it at three levels: **build-time size limits** (bundler budgets, size-limit) that fail the PR, **Lighthouse CI** assertions on key pages, and **RUM alerts** on field p75 after release. Budgets come from field data and competitors, and I track trends per commit rather than trusting a single run.',
    details: [
      { type: 'heading3', text: 'Types of budget' },
      {
        type: 'bullets',
        items: [
          '**Quantity**: bytes of JS/CSS/images (compressed), number of requests, number of third-party origins. Stable and deterministic, so the best thing to fail a build on.',
          '**Metric thresholds**: LCP, CLS, TBT in the lab. Closer to user experience but noisy between runs.',
          '**Rule-based**: Lighthouse category score or specific audits (no render-blocking resources, images sized).',
        ],
      },
      {
        type: 'paragraph',
        text: "Set them from evidence: today's field p75, the Core Web Vitals thresholds, and what the slowest target device can handle. Start at the current value so it can only get better, then tighten.",
      },
      { type: 'heading3', text: '1. Bundle size in the build' },
      {
        type: 'paragraph',
        text: 'Angular has this built in: `budgets` in `angular.json` (for example `initial` and `anyComponentStyle`) warn or fail `ng build`. For any stack, **size-limit** (configured in `package.json`) checks compressed sizes and can report the diff on the PR.',
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "scripts": { "size": "size-limit" },
  "size-limit": [
    { "path": "dist/browser/main-*.js", "limit": "200 kB" },
    { "path": "dist/browser/*.css", "limit": "40 kB" }
  ]
}`,
      },
      { type: 'heading3', text: '2. Lighthouse CI on key pages' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run serve:prod',
      url: ['http://localhost:4000/', 'http://localhost:4000/products/42'],
      numberOfRuns: 3, // median of several runs reduces noise
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'unused-javascript': 'warn',
      },
    },
    upload: { target: 'temporary-public-storage' }, // or your own LHCI server for history
  },
};`,
      },
      {
        type: 'paragraph',
        text: 'Run it with `npx @lhci/cli autorun` in the pipeline against a production build. A self-hosted LHCI server stores results per commit so you can see trends and compare a PR against the main branch.',
      },
      { type: 'heading3', text: '3. Field regressions after release' },
      {
        type: 'bullets',
        items: [
          'RUM (the `web-vitals` library or a vendor) tagged with the release version.',
          'Dashboards of p75 LCP, INP and CLS per key route and device class.',
          'Alerts when p75 crosses a threshold or worsens by a set percentage compared with the previous release, linked to the deploy so the team can roll back or fix quickly.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Lab metrics on shared CI runners are noisy. Failing builds on a 50 ms LCP difference trains people to ignore or disable the check. Fail hard on deterministic size budgets; use median-of-N runs and wider margins (or warnings) for timing metrics.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: describe the three layers (size in the build, Lighthouse CI on PRs, RUM alerts in production) and who owns a budget breach. A budget nobody is allowed to exceed without a discussion is what actually stops regressions.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'A product team needs a heavy new library. How do you handle the budget conversation?',
          'How do you keep Lighthouse CI results stable?',
          'How do you budget third-party scripts that marketing adds via a tag manager?',
        ],
      },
    ],
  },
};
