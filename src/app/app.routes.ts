import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { Questions } from '@components/questions';

const APP_NAME = 'PrepHub';

const loadSystemDesign = () =>
  import('./components/system-design/system-design').then((m) => m.SystemDesign);
const loadCoreConcepts = () =>
  import('./components/core-concepts/core-concepts').then((m) => m.CoreConcepts);

export const routes: Routes = [
  { path: '', component: Questions, title: `Interview Q&A · ${APP_NAME}` },
  {
    path: 'daily',
    title: `Daily Learning · ${APP_NAME}`,
    loadComponent: () =>
      import('./components/daily-learning/daily-learning').then((m) => m.DailyLearning),
  },
  {
    path: 'system-design',
    title: `System Design · ${APP_NAME}`,
    loadComponent: loadSystemDesign,
  },
  {
    path: 'system-design/:systemId',
    // Data is imported lazily so it stays out of the initial bundle
    title: async (route: ActivatedRouteSnapshot) => {
      const { SYSTEM_DESIGN_SYSTEMS } = await import('@services/system-design-data');
      const sys = SYSTEM_DESIGN_SYSTEMS.find((s) => s.id === route.paramMap.get('systemId'));
      return `${sys?.title ?? 'System Design'} · ${APP_NAME}`;
    },
    loadComponent: loadSystemDesign,
  },
  {
    path: 'core-concepts',
    title: `Core Concepts · ${APP_NAME}`,
    loadComponent: loadCoreConcepts,
  },
  {
    path: 'core-concepts/:conceptId',
    title: async (route: ActivatedRouteSnapshot) => {
      const { CORE_CONCEPTS } = await import('@services/core-concepts-data');
      const concept = CORE_CONCEPTS.find((c) => c.id === route.paramMap.get('conceptId'));
      return `${concept?.title ?? 'Core Concepts'} · ${APP_NAME}`;
    },
    loadComponent: loadCoreConcepts,
  },
  { path: '**', redirectTo: '' },
];
