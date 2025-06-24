export class Router {
  // routes is a map of paths to components
  private routes: Map<string, () => HTMLElement> = new Map();
  private currentPath: string = '';
  
  constructor() {
    /*
    This function is called when the user navigates to a new page.
    It handles the initial route.
    */
    window.addEventListener('popstate', () => this.handleRoute());
  }
  
  addRoute(path: string, component: () => HTMLElement) {
    /*
    This function is called when the user adds a new route to the router.
    It adds the route to the routes map.
    */
    this.routes.set(path, component);
    return this;
  }
  
  navigate(path: string) {
    /*
    This function is called when the user navigates to a new page.
    It updates the current path and navigates to the new page.
    */
    if (this.currentPath !== path) {
      this.currentPath = path;
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
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
}

export const router = new Router();
