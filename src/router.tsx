import { createRouter, RootRoute, Route } from '@tanstack/react-router';

// Import route components
import RootLayout from './routes/__root';
import Dashboard from './routes/index';
import NovaAuditoria from './routes/nova-auditoria';
import AuditoriaDetail from './routes/auditoria.$id';

// Root route
const rootRoute = new RootRoute({
  component: RootLayout,
});

// Dashboard route
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// Nova auditoria route
const novaAuditoriaRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/nova-auditoria',
  component: NovaAuditoria,
});

// Auditoria detail route (3 Ps view)
const auditoriaRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/auditoria/$id',
  component: AuditoriaDetail,
});

// Create route tree
const routeTree = rootRoute.addChildren([indexRoute, novaAuditoriaRoute, auditoriaRoute]);

// Create router instance
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
