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

/** Short labels for the learning path, by system id (a missing one falls back to the title). */
export const SYSTEM_PATH_LABELS: Record<string, string> = {
  'url-shortener': 'Fundamentals',
  'rate-limiter': 'Rate Limiting',
  'unique-id-generator': 'Unique IDs',
  'load-balancer': 'Load Balancing',
  'distributed-cache': 'Caching',
  'search-autocomplete': 'Search',
  'chat-system': 'Real-time',
  'notification-system': 'Async',
  'file-storage': 'Storage',
  'news-feed': 'Social Scale',
  'video-streaming': 'Streaming',
  'ride-sharing': 'Distributed',
  'ticket-booking': 'Flash Sales',
  'payment-system': 'Production-Grade',
  'ai-chat-assistant': 'AI Chat',
  'rag-knowledge-base': 'RAG',
  'ai-agent-platform': 'AI Agents',
};
