// Shared content model for lesson pages (System Design + Core Concepts).

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type BlockType =
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'bullets'
  | 'numbered'
  | 'code'
  | 'callout'
  | 'divider'
  | 'diagram'
  | 'flow';
export type CalloutVariant = 'info' | 'tip' | 'warning' | 'important';

export interface DiagramNode {
  id: string;
  name: string;
  subtitle: string;
  type: 'client' | 'network' | 'gateway' | 'server' | 'database' | 'storage' | 'security' | 'cache';
  icon: string;
  badge?: string;
  protocol?: string;
  details?: string[];
}

export interface DiagramConnection {
  from: string;
  to: string;
  label: string;
  protocol?: string;
  type?: 'sync' | 'async' | 'bidirectional';
}

export interface ConceptDiagram {
  id: string;
  title: string;
  subtitle: string;
  nodes: DiagramNode[];
  connections?: DiagramConnection[];
  keyTakeaways?: string[];
  rawSpec?: string;
}

/**
 * Block shapes by `type`:
 * - paragraph / heading2 / heading3 → `text`
 * - bullets / numbered               → `items`
 * - code                             → `code`, `lang`
 * - callout                          → `text`, `variant`
 * - diagram  (step-by-step cards)    → `diagram`
 * - flow     (Mermaid diagram)       → `code` = Mermaid source, `title`, optional `text` caption.
 *   Validate with `node scripts/check-diagrams.mjs`.
 */
export interface ContentBlock {
  type: BlockType;
  title?: string;
  text?: string;
  items?: string[];
  code?: string;
  lang?: string;
  variant?: CalloutVariant;
  diagram?: ConceptDiagram;
}
