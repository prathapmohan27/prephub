import {
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';

type Mermaid = typeof import('mermaid').default;

/**
 * Colour classes available to every flowchart, e.g. `A[Browser]:::client`.
 * Keeps all lesson diagrams visually consistent without repeating classDefs in the data.
 */
const FLOWCHART_CLASSES = `
classDef client fill:#172554,stroke:#60a5fa,color:#dbeafe
classDef server fill:#052e16,stroke:#34d399,color:#d1fae5
classDef db fill:#3b2306,stroke:#fbbf24,color:#fef3c7
classDef cache fill:#450a0a,stroke:#f87171,color:#fee2e2
classDef queue fill:#2e1065,stroke:#a78bfa,color:#ede9fe
classDef network fill:#083344,stroke:#22d3ee,color:#cffafe
classDef security fill:#500724,stroke:#f472b6,color:#fce7f3
classDef external fill:#27272a,stroke:#a1a1aa,color:#e4e4e7,stroke-dasharray:4 3
classDef highlight fill:#422006,stroke:#f59e0b,color:#fff7ed,stroke-width:2px
`;

let mermaidPromise: Promise<Mermaid> | null = null;
/** Mermaid is ~1 MB, so load it only when the first diagram is shown. */
function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#09090b',
        fontSize: '14px',
        primaryColor: '#27272a',
        primaryTextColor: '#f4f4f5',
        primaryBorderColor: '#52525b',
        secondaryColor: '#1e1b4b',
        tertiaryColor: '#18181b',
        lineColor: '#a1a1aa',
        textColor: '#e4e4e7',
        edgeLabelBackground: '#18181b',
        clusterBkg: 'rgba(39,39,42,0.35)',
        clusterBorder: '#3f3f46',
        // sequence diagrams
        actorBkg: '#1e1b4b',
        actorBorder: '#818cf8',
        actorTextColor: '#eef2ff',
        actorLineColor: '#52525b',
        signalColor: '#d4d4d8',
        signalTextColor: '#f4f4f5',
        labelBoxBkgColor: '#27272a',
        labelBoxBorderColor: '#52525b',
        labelTextColor: '#f4f4f5',
        loopTextColor: '#e4e4e7',
        noteBkgColor: '#422006',
        noteBorderColor: '#f59e0b',
        noteTextColor: '#fef3c7',
        activationBkgColor: '#312e81',
        activationBorderColor: '#818cf8',
        sequenceNumberColor: '#09090b',
      },
      flowchart: { curve: 'basis', padding: 12, useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true, mirrorActors: false, showSequenceNumbers: false },
    });
    return mermaid;
  });
  return mermaidPromise;
}

/** Mermaid's render() is not safe to run concurrently, so renders are queued. */
let renderQueue: Promise<unknown> = Promise.resolve();
let idCounter = 0;

function withClasses(code: string): string {
  return /^\s*(flowchart|graph)\b/.test(code) ? `${code}\n${FLOWCHART_CLASSES}` : code;
}

@Component({
  selector: 'app-flow-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="fd">
      <figcaption class="fd-head">
        <div class="fd-head-text">
          <span class="fd-tag"><i class="ti ti-chart-dots-3"></i> Flow diagram</span>
          @if (title()) {
            <h4 class="fd-title">{{ title() }}</h4>
          }
        </div>
        @if (state() === 'ready') {
          <button
            type="button"
            class="fd-btn"
            (click)="openFullscreen()"
            aria-label="Expand diagram"
          >
            <i class="ti ti-arrows-maximize"></i><span class="fd-btn-label">Expand</span>
          </button>
        }
      </figcaption>

      <div class="fd-canvas" [class.fd-canvas--loading]="state() === 'loading'">
        @if (state() === 'loading') {
          <div class="fd-skeleton"><i class="ti ti-loader-2 fd-spin"></i> Drawing diagram…</div>
        }
        @if (state() === 'error') {
          <pre class="fd-fallback"><code>{{ code() }}</code></pre>
        }
        <div #host class="fd-svg" [hidden]="state() !== 'ready'"></div>
      </div>

      @if (caption()) {
        <p class="fd-caption">{{ caption() }}</p>
      }
    </figure>

    <!-- Backdrop click is a pointer convenience; keyboard users close with Esc (native) or the close button -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog #dialog class="fd-dialog" (click)="onDialogClick($event)">
      <div class="fd-dialog-head">
        <span class="fd-title">{{ title() || 'Diagram' }}</span>
        <button type="button" class="fd-btn" (click)="dialog.close()" aria-label="Close">
          <i class="ti ti-x"></i>
        </button>
      </div>
      <div #dialogHost class="fd-dialog-body"></div>
    </dialog>
  `,
  styleUrl: './flow-diagram.css',
})
export class FlowDiagram {
  /** Mermaid source */
  readonly code = input.required<string>();
  readonly title = input<string>();
  readonly caption = input<string>();

  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly dialogHost = viewChild.required<ElementRef<HTMLElement>>('dialogHost');
  private svg = '';

  constructor() {
    effect(() => {
      const code = this.code();
      const host = this.host().nativeElement;
      this.state.set('loading');
      const id = `fd-${++idCounter}`;
      const job = renderQueue.then(async () => {
        try {
          const mermaid = await loadMermaid();
          const { svg } = await mermaid.render(id, withClasses(code.trim()));
          if (code !== this.code()) return; // input changed while rendering
          this.svg = svg;
          host.innerHTML = svg; // trusted: authored lesson content, rendered with securityLevel 'strict'
          this.state.set('ready');
        } catch (err) {
          console.error('[flow-diagram] failed to render', err);
          document.getElementById(id)?.remove(); // mermaid leaves an error svg behind
          this.state.set('error');
        }
      });
      renderQueue = job;
    });
  }

  protected openFullscreen() {
    this.dialogHost().nativeElement.innerHTML = this.svg;
    this.dialog().nativeElement.showModal();
  }

  /** Close when the backdrop (the dialog element itself) is clicked */
  protected onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
