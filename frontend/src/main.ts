import "./style.css";
import { router } from "./router/router";
import { createLoginPage } from "./pages/LoginPage";
import { createHomePage } from "./pages/HomePage";
import { createGamePage } from "./pages/GamePage";
import { createProfilePage } from "./pages/ProfilePage";
import { createChatPage } from "./pages/ChatPage";
import { createNotFoundPage } from "./pages/NotFoundPage";
import { createSignUpPage } from "./pages/SignUpPage";
import { createUserProfilePage } from "./pages/UserProfilePage";
import { i18n } from "./services/i18n";

// Initialize app
async function initApp() {
  // Initialize i18n before starting router
  await i18n.init();

  // Configuration des routes - CHANGEMENT MINIMAL : GamePage sur la route racine
  router
    .addRoute('/', createGamePage)           // SEUL CHANGEMENT : GamePage au lieu de createLoginPage
    .addRoute('/login', createLoginPage)
    .addRoute('/signup', createSignUpPage)
    .addRoute('/home', createHomePage)
    .addRoute('/game', createGamePage)       // Garde l'alias /game pour cohérence
    .addRoute('/profile', createProfilePage)
    .addRoute('/chat', createChatPage)
    .addRoute('/404', createNotFoundPage);

  // Route dynamique pour les profils utilisateur
  router.addDynamicRoute('/profile/:username', createUserProfilePage);
  
  // Récupération du token (logique existante conservée)
  const token = sessionStorage.getItem('authToken');
  const currentPath = window.location.pathname;

  // LOGIQUE SIMPLIFIEE : laissons le router faire son travail normal
  if (currentPath === '/') {
    // Pour la route racine, utiliser directement le router sans logique spéciale
    router.start();
  } else {
    // Pour toutes les autres routes, comportement normal
    router.start();
  }
}

initApp().catch(console.error);