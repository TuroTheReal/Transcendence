
class Router {
    private routes: Map<string, () => HTMLElement> = new Map();
    private dynamicRoutes: Array<{pattern: string, handler: () => HTMLElement}> = [];
    private protectedRoutes: Set<string> = new Set();
    private currentRoute: string = '/';

    constructor() {
        //this.setupRoutes();
        this.setupProtectedRoutes();
        this.handlePopState();
    }

    private setupProtectedRoutes() {
        // Définir les routes qui nécessitent une authentification
        this.protectedRoutes.add('/home');
        this.protectedRoutes.add('/profile');
        //this.protectedRoutes.add('/game');
        this.protectedRoutes.add('/chat');
        this.protectedRoutes.add('/leaderboard');
    }

    private isProtectedRoute(route: string): boolean {
        // Check exact matches
        if (this.protectedRoutes.has(route)) {
            return true;
        }

        // Check pattern matches for dynamic routes like /profile/:username
        if (route.startsWith('/profile/') && route.length > '/profile/'.length) {
            return true;
        }

        return false;
    }

    addRoute(path: string, component: () => HTMLElement) {
      /*
      This function is called when the user adds a new route to the router.
      It adds the route to the routes map.
      */
      this.routes.set(path, component);
      return this;
    }

    addDynamicRoute(pattern: string, handler: () => HTMLElement) {
        this.dynamicRoutes.push({ pattern, handler });
        return this;
    }

    private handleRoute() {
      /*
      This function is called when the user navigates to a new page.
      It finds the component for the current path and renders it in the app.
      If the path is not found, it renders the 404 page.
      */
      const path = window.location.pathname;
      const component = this.routes.get(path) || this.routes.get('/404');

      if (component) {
        const app = document.querySelector('#app');
        if (app) {
          app.innerHTML = '';
          app.appendChild(component());
        }
      }
    }

    start() {
      /*
      This function is called when the app starts.
      It handles the initial route.
      */
      this.handleRoute();
    }

//   navigate(path: string) {
//     /*
//     This function is called when the user navigates to a new page.
//     It updates the current path and navigates to the new page.
//     */
//     if (this.currentPath !== path) {
//       this.currentPath = path;
//       window.history.pushState({}, '', path);
//       this.handleRoute();
//     }
//   }

    async navigate(route: string): Promise<void> {
        this.currentRoute = route;
        history.pushState({}, '', route);
        await this.renderRoute(route);
    }

    private async renderRoute(route: string): Promise<void> {
        // Check exact routes first
        let routeHandler = this.routes.get(route);
        let routeParams: any = {};

        // If no exact match, check dynamic routes
        if (!routeHandler) {
            for (const dynamicRoute of this.dynamicRoutes) {
                const params = this.extractParams(route, dynamicRoute.pattern);
                if (params) {
                    routeHandler = dynamicRoute.handler;
                    routeParams = params;
                    break;
                }
            }
        }

        if (!routeHandler) {
            this.navigate('/404');
            return;
        }

        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
            // Store route params globally so components can access them
            (window as any).routeParams = routeParams;
            app.appendChild(routeHandler());
        }
    }

    private matchesPattern(route: string, pattern: string): boolean {
        // Convert pattern like "/profile/:username" to regex
        const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(route);
    }

    private extractParams(route: string, pattern: string): any | null {
        // Extract parameters from route using pattern
        const patternParts = pattern.split('/');
        const routeParts = route.split('/');

        if (patternParts.length !== routeParts.length) {
            return null;
        }

        const params: any = {};
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const routePart = routeParts[i];

            if (patternPart.startsWith(':')) {
                const paramName = patternPart.substring(1);
                params[paramName] = routePart;
            } else if (patternPart !== routePart) {
                return null;
            }
        }

        return params;
    }

	private async navigateFromHistory(route: string): Promise<void> {
    	this.currentRoute = route;
    	await this.renderRoute(route);
	}

	private handlePopState(): void {
		window.addEventListener('popstate', async () => {
			await this.navigateFromHistory(window.location.pathname);
		});
	}
}

export const router = new Router();
