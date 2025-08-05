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

  router
	  .addRoute('/', createLoginPage)
	  .addRoute('/login', createLoginPage)
	  .addRoute('/signup', createSignUpPage)
	  .addRoute('/home', createHomePage)
	  .addRoute('/game', createGamePage)
	  .addRoute('/profile', createProfilePage)
	  .addRoute('/chat', createChatPage)
	  .addRoute('/404', createNotFoundPage);

  // Route dynamique pour les profils utilisateur
  router.addDynamicRoute('/profile/:username', createUserProfilePage);
  const token = sessionStorage.getItem('authToken');
  const currentPath = window.location.pathname;

  if (currentPath === '/') {
	if (token) {
	  router.navigate('/home');
	} else {
	  router.navigate('/login');
	}
  } else {
	router.start();
  }
}

initApp().catch(console.error);