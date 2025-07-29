import { router } from "./router/router";
import { createLoginPage } from "./pages/LoginPage";
import { createHomePage } from "./pages/HomePage";
import { createGamePage } from "./pages/GamePage";
import { createProfilePage } from "./pages/ProfilePage";
import { createChatPage } from "./pages/ChatPage";
import { createNotFoundPage } from "./pages/NotFoundPage";
import { createSignUpPage } from "./pages/SignUpPage";
import { createUserProfilePage } from "./pages/UserProfilePage";
import { createServerGamePage } from "./pages/ServerGamePage";
import { createServerGameSoloPage } from "./pages/ServerGameSoloPage";
import { createServerGameVersusPage } from "./pages/ServerGameVersusPage";
import { createServerGameMultiPage } from "./pages/ServerGameMultiPage";
import { createTwoFactorVerifyPage } from "./pages/TwoFactorVerifyPage";
import { i18n } from "./services/i18n";

// Initialize app
async function initApp() {
  // Initialize i18n before starting router
  await i18n.init();

  // Configuration des routes
  router
    .addRoute('/', createGamePage)           
    .addRoute('/login', createLoginPage)
    .addRoute('/signup', createSignUpPage)
    .addRoute('/home', createHomePage)
    .addRoute('/game', createGamePage)       
    .addRoute('/server-game', createServerGamePage)
    .addRoute('/server-game/solo', createServerGameSoloPage)
    .addRoute('/server-game/versus', createServerGameVersusPage)
    .addRoute('/server-game/multi', createServerGameMultiPage) 
    .addRoute('/profile', createProfilePage)
    .addRoute('/chat', createChatPage)
    .addRoute('/404', createNotFoundPage)
    .addRoute('/2fa-verify', createTwoFactorVerifyPage); // register the 2FA page

  // Route dynamique pour les profils utilisateur
  router.addDynamicRoute('/profile/:username', createUserProfilePage);
  
  const token = sessionStorage.getItem('authToken');
  const currentPath = window.location.pathname;

  if (currentPath === '/') {
    router.start();
  } else {
    router.start();
  }
}

initApp().catch(console.error);