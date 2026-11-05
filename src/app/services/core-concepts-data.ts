// Core Concepts Learning Data — PrepHub
// 15 foundational concepts ordered progressively:
// Internet → DNS → Browser → HTTP → HTTPS → Load Balancers → Web Serving → APIs → Backend → Databases → File Storage
// → Caching → Scaling → Message Queues → Back-of-the-Envelope Estimation
// Each concept lives in ./core-concepts/<slug>.ts
import { ContentBlock } from './content-model';

export type CoreConceptDifficulty = 'Beginner' | 'Foundational' | 'Intermediate';

export interface ConceptSection {
  id: string;
  title: string;
  icon: string;
  blocks: ContentBlock[];
}

export interface CoreConcept {
  id: string;
  title: string;
  emoji: string;
  icon: string;
  color: string;
  bg: string;
  accentGlow: string;
  difficulty: CoreConceptDifficulty;
  tagline: string;
  tags: string[];
  estimatedTime: string;
  sections: ConceptSection[];
}

import { howInternetWorks } from './core-concepts/how-internet-works';
import { howDnsWorks } from './core-concepts/how-dns-works';
import { howBrowserWorks } from './core-concepts/how-browser-works';
import { howHttpWorks } from './core-concepts/how-http-works';
import { howHttpsWorks } from './core-concepts/how-https-works';
import { howLoadBalancersWork } from './core-concepts/how-load-balancers-work';
import { howWebsiteIsServed } from './core-concepts/how-website-is-served';
import { howApisWork } from './core-concepts/how-apis-work';
import { howBackendWorks } from './core-concepts/how-backend-works';
import { howDatabasesWork } from './core-concepts/how-databases-work';
import { howFilesWork } from './core-concepts/how-files-work';
import { howCachingWorks } from './core-concepts/how-caching-works';
import { howScalingWorks } from './core-concepts/how-scaling-works';
import { howMessageQueuesWork } from './core-concepts/how-message-queues-work';
import { backOfTheEnvelopeEstimation } from './core-concepts/back-of-the-envelope-estimation';

export const CORE_CONCEPTS: CoreConcept[] = [
  howInternetWorks,
  howDnsWorks,
  howBrowserWorks,
  howHttpWorks,
  howHttpsWorks,
  howLoadBalancersWork,
  howWebsiteIsServed,
  howApisWork,
  howBackendWorks,
  howDatabasesWork,
  howFilesWork,
  howCachingWorks,
  howScalingWorks,
  howMessageQueuesWork,
  backOfTheEnvelopeEstimation,
];
