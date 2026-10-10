import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  handlers: { [key: string]: DetachedRouteHandle } = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Log route data for better understanding
    console.log('shouldDetach', route.routeConfig?.path, route.data?.['shouldReuse']);

    // If route data has shouldReuse, use it; otherwise, fallback to false
    return route.data?.['shouldReuse'] || false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const path = route.routeConfig?.path;

    // If lazy-loaded, handle path more carefully
    if (path) {
      console.log(`Storing route: ${path}`);
      this.handlers[path] = handle;
    } else {
      console.log(`Lazy-loaded route, not storing by path. Route data:`, route);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    console.log(`Checking for attached route: ${path}`);

    // If no path, it might be a lazy-loaded module or an error
    if (!path) {
      console.warn('Lazy-loaded route, no path available');
    }

    return !!path && this.handlers[path] !== undefined;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = route.routeConfig?.path;
    console.log(`Retrieving route: ${path}`);

    // Return the cached route handle if available
    return this.handlers[path!] || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    const futurePath = future.routeConfig?.path;
    const currentPath = current.routeConfig?.path;

    console.log('Checking reuse:', futurePath, 'Current route:', currentPath);

    // If both paths match, reuse the route
    return futurePath === currentPath;
  }
}
