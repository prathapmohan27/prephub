// Core Concepts Learning Data — PrepHub
// 23 foundational concepts ordered progressively:
// Internet → DNS → Browser → HTTP → HTTPS → Load Balancers → Web Serving → APIs → Backend → Databases → File Storage
// → Caching → Scaling → Message Queues → Back-of-the-Envelope Estimation
// → AI: LLMs → Prompt Engineering → Embeddings & Vector Databases → RAG → AI Agents & MCP
// → Agentic Workflows → AI Evals & Observability → AI Security & Guardrails
// Each concept lives in ./data/<slug>.ts
import { ContentBlock } from '@shared/models/content-model';

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

import { howInternetWorks } from './data/how-internet-works';
import { howDnsWorks } from './data/how-dns-works';
import { howBrowserWorks } from './data/how-browser-works';
import { howHttpWorks } from './data/how-http-works';
import { howHttpsWorks } from './data/how-https-works';
import { howLoadBalancersWork } from './data/how-load-balancers-work';
import { howWebsiteIsServed } from './data/how-website-is-served';
import { howApisWork } from './data/how-apis-work';
import { howBackendWorks } from './data/how-backend-works';
import { howDatabasesWork } from './data/how-databases-work';
import { howFilesWork } from './data/how-files-work';
import { howCachingWorks } from './data/how-caching-works';
import { howScalingWorks } from './data/how-scaling-works';
import { howMessageQueuesWork } from './data/how-message-queues-work';
import { backOfTheEnvelopeEstimation } from './data/back-of-the-envelope-estimation';
import { howLlmsWork } from './data/how-llms-work';
import { howPromptEngineeringWorks } from './data/how-prompt-engineering-works';
import { howVectorDatabasesWork } from './data/how-vector-databases-work';
import { howRagWorks } from './data/how-rag-works';
import { howAiAgentsAndMcpWork } from './data/how-ai-agents-and-mcp-work';
import { howAgenticWorkflowsWork } from './data/how-agentic-workflows-work';
import { howAiEvalsAndObservabilityWork } from './data/how-ai-evals-and-observability-work';
import { howAiSecurityAndGuardrailsWork } from './data/how-ai-security-and-guardrails-work';

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
  howLlmsWork,
  howPromptEngineeringWorks,
  howVectorDatabasesWork,
  howRagWorks,
  howAiAgentsAndMcpWork,
  howAgenticWorkflowsWork,
  howAiEvalsAndObservabilityWork,
  howAiSecurityAndGuardrailsWork,
];
