// System Design Learning Data — PrepHub
// 11 systems, ordered for progressive learning. Each system lives in ./system-design/<slug>.ts
import { ContentBlock, Difficulty } from './content-model';

// Re-exported so existing `@services/system-design-data` imports keep working
export * from './content-model';

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

import { urlShortener } from './system-design/url-shortener';
import { rateLimiter } from './system-design/rate-limiter';
import { distributedLoadBalancer } from './system-design/distributed-load-balancer';
import { distributedCache } from './system-design/distributed-cache';
import { chatSystem } from './system-design/chat-system';
import { notificationSystem } from './system-design/notification-system';
import { fileStorage } from './system-design/file-storage';
import { newsFeed } from './system-design/news-feed';
import { videoStreaming } from './system-design/video-streaming';
import { rideSharing } from './system-design/ride-sharing';
import { paymentSystem } from './system-design/payment-system';

export const SYSTEM_DESIGN_SYSTEMS: SystemDesignSystem[] = [
  urlShortener,
  rateLimiter,
  distributedLoadBalancer,
  distributedCache,
  chatSystem,
  notificationSystem,
  fileStorage,
  newsFeed,
  videoStreaming,
  rideSharing,
  paymentSystem,
];
