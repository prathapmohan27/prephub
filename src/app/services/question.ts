/**
 * One interview question.
 * - `id` is stable forever: progress, ratings, answers, short titles and links are keyed by it,
 *   so the wording (`text`) can be improved at any time. Never change or reuse an id.
 * - `senior` marks questions that go beyond fundamentals: internals, trade-offs, design and
 *   architecture, production debugging and scenario questions. Everything else is "core".
 */
export interface QuestionModel {
  id: string;
  text: string;
  senior?: boolean;
}

export interface CategoryModel {
  id: string;
  icon: string;
  title: string;
  color: string;
  bg: string;
  questions: QuestionModel[];
}

/** The three Q&A tracks. Foundations is shared by both stacks (JavaScript, TypeScript, the web). */
export type Track = 'foundations' | 'angular' | 'nodejs';

export interface TrackInfo {
  id: Track;
  label: string;
  /** Short label for tight spaces (track switch, chips). */
  short: string;
  icon: string;
  /** Site searched by the "Docs" button, and the prefix for a general web search. */
  docsSite: string;
  docsLabel: string;
  searchPrefix: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    short: 'JS/TS',
    icon: 'ti-brand-javascript',
    docsSite: 'developer.mozilla.org',
    docsLabel: 'MDN Docs',
    searchPrefix: 'JavaScript',
  },
  {
    id: 'angular',
    label: 'Angular',
    short: 'Angular',
    icon: 'ti-brand-angular',
    docsSite: 'angular.dev',
    docsLabel: 'Angular Docs',
    searchPrefix: 'Angular',
  },
  {
    id: 'nodejs',
    label: 'Node.js',
    short: 'Node.js',
    icon: 'ti-brand-nodejs',
    docsSite: 'nodejs.org',
    docsLabel: 'Node.js Docs',
    searchPrefix: 'Node.js',
  },
];

/**
 * Topics shared by both stacks: language, web platform, problem solving and interview skills.
 * Ids are kept stable so links and saved progress keep working.
 */
const FOUNDATION_TOPICS = new Set([
  'javascript-fundamentals',
  'typescript',
  'js-output',
  'browser-dom-css',
  'web-accessibility',
  'web-performance',
  'dsa-patterns',
  // Interview rounds that are not specific to one framework
  'experience-behavioral',
  'coding-round',
  // End-to-end scenarios that span Angular, Node and the database
  'fullstack-scenarios',
  // Low-level design and OOP: asked in both Angular and Node interview loops
  'lld-design',
]);

export function trackOf(categoryId: string): Track {
  if (FOUNDATION_TOPICS.has(categoryId)) return 'foundations';
  return categoryId.startsWith('nodejs-') ? 'nodejs' : 'angular';
}

export function isTrack(value: unknown): value is Track {
  return value === 'foundations' || value === 'angular' || value === 'nodejs';
}

export function trackInfo(track: Track): TrackInfo {
  return TRACKS.find((t) => t.id === track)!;
}

export type Level = 'core' | 'senior';

export function levelOf(question: QuestionModel): Level {
  return question.senior ? 'senior' : 'core';
}

/** Sidebar sections per track. Every topic belongs to exactly one group, in topic order. */
export const TOPIC_GROUPS: { track: Track; title: string; topics: string[] }[] = [
  {
    track: 'foundations',
    title: 'Language',
    topics: ['javascript-fundamentals', 'typescript', 'js-output'],
  },
  {
    track: 'foundations',
    title: 'Web platform',
    topics: ['browser-dom-css', 'web-accessibility', 'web-performance'],
  },
  { track: 'foundations', title: 'Problem solving', topics: ['dsa-patterns', 'coding-round'] },
  { track: 'foundations', title: 'Software design', topics: ['lld-design'] },
  { track: 'foundations', title: 'Full stack', topics: ['fullstack-scenarios'] },
  { track: 'foundations', title: 'Interview skills', topics: ['experience-behavioral'] },
  {
    track: 'angular',
    title: 'Angular core',
    topics: [
      'angular-cli-build',
      'components',
      'templates-styling',
      'pipes',
      'directives',
      'dependency-injection',
      'change-detection',
    ],
  },
  { track: 'angular', title: 'Reactivity', topics: ['signals', 'modern-angular', 'rxjs'] },
  {
    track: 'angular',
    title: 'Data & state',
    topics: ['http-apis', 'routing', 'forms', 'component-communication', 'ngrx'],
  },
  {
    track: 'angular',
    title: 'Architecture & quality',
    topics: [
      'architecture',
      'frontend-system-design',
      'performance',
      'security-storage',
      'testing',
      'frontend-debugging',
    ],
  },
  {
    track: 'nodejs',
    title: 'Runtime',
    topics: ['nodejs-fundamentals', 'nodejs-error-handling', 'nodejs-streams', 'nodejs-memory'],
  },
  {
    track: 'nodejs',
    title: 'APIs & security',
    topics: [
      'nodejs-express-nestjs',
      'nodejs-api-design',
      'nodejs-networking',
      'nodejs-security',
      'nodejs-auth-advanced',
    ],
  },
  { track: 'nodejs', title: 'Data', topics: ['nodejs-sql', 'nodejs-nosql', 'nodejs-caching'] },
  {
    track: 'nodejs',
    title: 'Performance & scale',
    topics: ['nodejs-performance', 'nodejs-clustering'],
  },
  {
    track: 'nodejs',
    title: 'Cloud & delivery',
    topics: ['nodejs-testing', 'nodejs-devops', 'nodejs-aws-cloud'],
  },
  {
    track: 'nodejs',
    title: 'Architecture',
    topics: [
      'nodejs-design-patterns',
      'nodejs-microservices',
      'nodejs-distributed-systems',
      'nodejs-system-design',
    ],
  },
  {
    track: 'nodejs',
    title: 'Interview rounds',
    topics: ['nodejs-backend-operations', 'nodejs-coding-round'],
  },
];
