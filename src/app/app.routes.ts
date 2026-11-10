import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { Home } from '@pages/home/home';

const APP_NAME = 'PrepHub';

const loadSystemDesign = () =>
  import('@pages/system-design/system-design').then((m) => m.SystemDesign);
const loadCoreConcepts = () =>
  import('@pages/core-concepts/core-concepts').then((m) => m.CoreConcepts);

export const routes: Routes = [
  { path: '', component: Home, title: APP_NAME },
  {
    path: 'questions',
    title: `Interview Q&A · ${APP_NAME}`,
    // Lazy like the other sections, so the Q&A page and Mock Me stay out of the first load
    loadComponent: () => import('@pages/questions/questions').then((m) => m.Questions),
  },
  {
    path: 'daily',
    title: `Daily Learning · ${APP_NAME}`,
    loadComponent: () =>
      import('@pages/daily-learning/daily-learning').then((m) => m.DailyLearning),
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
      const { SYSTEM_DESIGN_SYSTEMS } = await import('@features/system-design/system-design-data');
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
      const { CORE_CONCEPTS } = await import('@features/core-concepts/core-concepts-data');
      const concept = CORE_CONCEPTS.find((c) => c.id === route.paramMap.get('conceptId'));
      return `${concept?.title ?? 'Core Concepts'} · ${APP_NAME}`;
    },
    loadComponent: loadCoreConcepts,
  },
  { path: '**', redirectTo: '' },
];
