// System Design Learning Data — PrepHub
// 17 systems, ordered for progressive learning. Each system lives in ./data/<slug>.ts
import { ContentBlock, Difficulty } from '@shared/models/content-model';

export interface SystemSection {
  id: string;
  title: string;
  icon: string;
  blocks: ContentBlock[];
}

export interface SystemDesignSystem {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  accentGlow: string;
  difficulty: Difficulty;
  tagline: string;
  tags: string[];
  estimatedTime: string;
  sections: SystemSection[];
}

import { urlShortener } from './data/url-shortener';
import { rateLimiter } from './data/rate-limiter';
import { distributedLoadBalancer } from './data/distributed-load-balancer';
import { distributedCache } from './data/distributed-cache';
import { chatSystem } from './data/chat-system';
import { notificationSystem } from './data/notification-system';
import { fileStorage } from './data/file-storage';
import { newsFeed } from './data/news-feed';
import { videoStreaming } from './data/video-streaming';
import { rideSharing } from './data/ride-sharing';
import { paymentSystem } from './data/payment-system';
import { uniqueIdGenerator } from './data/unique-id-generator';
import { searchAutocomplete } from './data/search-autocomplete';
import { ticketBooking } from './data/ticket-booking';
import { aiChatAssistant } from './data/ai-chat-assistant';
import { ragKnowledgeBase } from './data/rag-knowledge-base';
import { aiAgentPlatform } from './data/ai-agent-platform';

export const SYSTEM_DESIGN_SYSTEMS: SystemDesignSystem[] = [
  urlShortener,
  rateLimiter,
  uniqueIdGenerator,
  distributedLoadBalancer,
  distributedCache,
  searchAutocomplete,
  chatSystem,
  notificationSystem,
  fileStorage,
  newsFeed,
  videoStreaming,
  rideSharing,
  ticketBooking,
  paymentSystem,
  aiChatAssistant,
  ragKnowledgeBase,
  aiAgentPlatform,
];
