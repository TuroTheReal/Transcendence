type Language = 'fr' | 'en';

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  fr: {
	"common": {
	  "login": "Se connecter",
	  "logout": "Se déconnecter",
	  "register": "Créer un compte",
	  "cancel": "Annuler",
	  "save": "Sauvegarder",
	  "delete": "Supprimer",
	  "edit": "Modifier",
	  "loading": "Chargement...",
	  "error": "Erreur",
	  "success": "Succès"
	},
	"navigation": {
	  "home": "Accueil",
	  "game": "Jouer",
	  "profile": "Profil",
	  "chat": "Chat",
	  "leaderboard": "Classement"
	},
	"auth": {
	  "username": "Nom d'utilisateur",
	  "password": "Mot de passe",
	  "login_title": "Connexion",
	  "create_account": "Créer un compte",
	  "login_error": "Erreur lors de la connexion",
	  "invalid_credentials": "Identifiants incorrects"
	},
	"home": {
	  "welcome": "Bienvenue sur Transcendence",
	  "subtitle": "Le jeu de Pong ultime en temps réel",
	  "start_game": "Commencer une partie"
	},
	"profile": {
	  "title": "Profil",
	  "my_profile": "Mon profil",
	  "back": "← Retour",
	  "stats": "Statistiques",
	  "matches": "Matchs",
	  "wins": "Victoires",
	  "losses": "Défaites",
	  "edit_avatar": "Modifier l'avatar",
	  "edit_username": "Modifier le nom",
	  "edit_password": "Modifier le mot de passe",
	  "password_display": "Mot de passe: **********",
	  "match_history": "Historique des parties",
	  "games_played_stats": "Parties jouées: {{games}} | Victoires: {{wins}} | Défaites: {{losses}}",
	  "validate": "Valider",
	  "cancel": "Annuler",
	  "username_updated": "Nom d'utilisateur mis à jour avec succès!",
	  "username_error": "Erreur lors de la modification du nom d'utilisateur",
	  "password_updated": "Mot de passe mis à jour avec succès!",
	  "password_error": "Erreur lors de la modification du mot de passe",
	  "avatar_updated": "Avatar mis à jour!",
	  "avatar_error": "Erreur lors de la mise à jour de l'avatar",
	  "date": "Date",
	  "opponent": "Adversaire",
	  "result": "Résultat",
	  "victory": "Victoire",
	  "defeat": "Défaite",
	  "friends_list": "Liste d'amis",
	  "status": "Status",
	  "avatar": "Avatar",
	  "name": "Nom",
	  "Games_played": "Parties Jouées",
	  "dashboard": "Dashboard",
	  "game_types_distribution": "Répartition des types de jeux",
	  "winrate_by_type": "Taux de victoire par type",
	  "ia_games": "Parties IA",
	  "tournament_games": "Tournois",
	  "multiplayer_games": "Multijoueur"
	},
	"chat": {
	  "title": "Chat",
	  "send": "Envoyer",
	  "type_message": "Tapez votre message...",
	  "back": "← Retour",
	  "online_users": "Utilisateurs en ligne",
	  "connecting": "Connexion en cours...",
	  "conversations": "Conversations",
	  "select_conversation": "Sélectionnez une conversation",
	  "no_conversations": "Aucune conversation",
	  "no_messages": "Aucun message dans cette conversation",
	  "connection_lost": "Connexion perdue",
	  "reconnect": "Reconnecter",
	  "connection_error": "Erreur de connexion",
	  "no_users_online": "Aucun utilisateur en ligne",
	  "view_profile": "Voir profil",
	  "block_user": "Bloquer",
	  "user_blocked": "Utilisateur bloqué",
	  "user_blocked_you": "Cet utilisateur vous a bloqué",
	  "send_message": "💬 Envoyer un message",
	  "invite_game": "🎮 Inviter à jouer",
	  "login_required": "Vous devez être connecté pour accéder au chat.",
	  "login_link": "Se connecter",
	  "user_info_error": "Impossible de récupérer les informations utilisateur.",
	  "reconnect_link": "Se reconnecter"
	},
	"signup": {
	  "title": "Créer votre compte",
	  "back_to_login": "← Retour à la connexion",
	  "username": "Nom d'utilisateur",
	  "password": "Mot de passe",
	  "avatar_label": "Choisir une photo de profil:",
	  "create_account": "Créer le compte",
	  "signup_successful": "Inscription réussie",
	  "signup_error": "Erreur lors de l'inscription",
	  "wrong_input": "Saisie incorrecte"
	},
	"game": {
	  "title": "Pong Game",
	  "back": "← Retour",
	  "score": "Score",
	  "start": "Démarrer",
	  "pause": "Pause",
	  "game_mode": "Mode de jeu",
	  "local_mode": "🎮 JOUER EN LOCAL",
	  "line_mode": "🌐 JOUER EN LIGNE",
	  "mess_line_err": "Tu dois être connecté pour jouer en ligne",
	  "multi": "🎯 MULTIJOUEUR (2v2)",
	  "tournament": "🏆 TOURNOI",
	  "mode_local": "MODE LOCAL",
	  "mode_line": "MODE EN LIGNE",
	  "valid_name": "VALIDER LES NOMS",
	  "mess_valid_err": "⚠️ TOUS LES NOMS DOIVENT ÊTRE REMPLIS ET UNIQUES !",
	  "start_tournament": "🎯 COMMENCER TOURNOI",
	  "new_game": "NOUVELLE PARTIE",
	  "player_1": "JOUEUR 1 : 0",
	  "player_2": "JOUEUR 2 : 0",
	  "next_game": "MATCH SUIVANT",
	  "final": "FINAL",
	  "control": "🎮 CONTRÔLES",
	  "p1": "JOUEUR 1",
	  "p2": "JOUEUR 2",
	  "p3": "JOUEUR 3",
	  "p4": "JOUEUR 4",
	  "up_down": "ARROW UP / ARROW DOWN"


	},
	"not_found": {
	  "title": "404",
	  "message": "Page introuvable",
	  "back_home": "Retour à l'accueil"
	},
	"user_profile": {
	  "title": "Profil de",
	  "back_to_chat": "← Retour au chat",
	  "member_since": "Membre depuis:",
	  "games_played": "Parties jouées",
	  "wins": "Victoires",
	  "losses": "Défaites",
	  "match_history": "Historique des matches",
	  "loading": "Chargement...",
	  "no_matches": "Aucun match joué pour le moment",
	  "vs": "vs",
	  "error_title": "Erreur",
	  "username_missing": "Nom d'utilisateur manquant.",
	  "back_to_home": "Retour à l'accueil",
	  "profile_load_error": "Impossible de charger le profil de",
	  "history_load_error": "Erreur lors du chargement de l'historique",
	  "game_invite_todo": "Invitation de jeu pour {{username}} (à implémenter)"
	}
  },
  en: {
	"common": {
	  "login": "Login",
	  "logout": "Logout",
	  "register": "Create Account",
	  "cancel": "Cancel",
	  "save": "Save",
	  "delete": "Delete",
	  "edit": "Edit",
	  "loading": "Loading...",
	  "error": "Error",
	  "success": "Success"
	},
	"navigation": {
	  "home": "Home",
	  "game": "Play",
	  "profile": "Profile",
	  "chat": "Chat",
	  "leaderboard": "Leaderboard"
	},
	"auth": {
	  "username": "Username",
	  "password": "Password",
	  "login_title": "Connexion",
	  "create_account": "Create Account",
	  "login_error": "Login error",
	  "invalid_credentials": "Invalid credentials"
	},
	"home": {
	  "welcome": "Welcome to Transcendence",
	  "subtitle": "The ultimate real-time Pong game",
	  "start_game": "Start a game"
	},
	"profile": {
	  "title": "Profile",
	  "my_profile": "My profile",
	  "back": "← Back",
	  "stats": "Statistics",
	  "matches": "Matches",
	  "wins": "Wins",
	  "losses": "Losses",
	  "edit_avatar": "Edit avatar",
	  "edit_username": "Edit username",
	  "edit_password": "Edit password",
	  "password_display": "Password: **********",
	  "match_history": "Match history",
	  "games_played_stats": "Games played: {{games}} | Wins: {{wins}} | Losses: {{losses}}",
	  "validate": "Validate",
	  "cancel": "Cancel",
	  "username_updated": "Username updated successfully!",
	  "username_error": "Error updating username",
	  "password_updated": "Password updated successfully!",
	  "password_error": "Error updating password",
	  "avatar_updated": "Avatar updated!",
	  "avatar_error": "Error updating avatar",
	  "date": "Date",
	  "opponent": "Opponent",
	  "result": "Result",
	  "victory": "Victory",
	  "defeat": "Defeat",
		"friends_list": "Friends List",
		"status": "Status",
		"avatar": "Avatar",
		"name": "Username",
		"Games_played": "Games Played",
		"game_types_distribution": "Game types distribution",
		"winrate_by_type": "Winrate by type",
		"ia_games": "IA Games",
		"tournament_games": "Tournaments",
		"multiplayer_games": "Multiplayer"
	},
	"chat": {
	  "title": "Chat",
	  "send": "Send",
	  "type_message": "Type your message...",
	  "back": "← Back",
	  "online_users": "Online Users",
	  "connecting": "Connecting...",
	  "conversations": "Conversations",
	  "select_conversation": "Select a conversation",
	  "no_conversations": "No conversations",
	  "no_messages": "No messages in this conversation",
	  "connection_lost": "Connection lost",
	  "reconnect": "Reconnect",
	  "connection_error": "Connection error",
	  "no_users_online": "No users online",
	  "view_profile": "View profile",
	  "block_user": "Block",
	  "user_blocked": "User blocked",
	  "user_blocked_you": "This user blocked you",
	  "send_message": "💬 Send message",
	  "invite_game": "🎮 Invite to play",
	  "login_required": "You must be logged in to access chat.",
	  "login_link": "Login",
	  "user_info_error": "Unable to retrieve user information.",
	  "reconnect_link": "Reconnect"
	},
	"signup": {
	  "title": "Create your account",
	  "back_to_login": "← Back to login",
	  "username": "Username",
	  "password": "Password",
	  "avatar_label": "Choose a profile picture:",
	  "create_account": "Create account",
	  "signup_successful": "Registration successful",
	  "signup_error": "Registration error",
	  "wrong_input": "Invalid input"
	},
	"game": {
	  "title": "Pong Game",
	  "back": "← Back",
	  "score": "Score",
	  "start": "Start",
	  "pause": "Pause",
	  "game_mode": "Game mode",
	  "local_mode": "🎮 PLAY LOCALLY",
	  "line_mode": "🌐 PLAY ONLINE",
	  "mess_line_err": "You must been connected to play online",
	  "multi": "🎯 MULTIPLAYER (2v2)",
	  "tournament": "🏆 TOURNAMENT",
	  "mode_local": "LOCAL MODE",
	  "mode_line": "ONLINE MODE",
	  "valid_name": "VALIDATE THE NAMES",
	  "mess_valid_err": "⚠️ ALL NAMES MUST BE FILLED IN AND UNIQUE !",
	  "start_tournament": "🎯 START TOURNAMENT",
	  "new_game": "NEW GAME",
	  "player_1": "PLAYER 1 : 0",
	  "player_2": "PLAYER 2 : 0",
	  "next_game": "NEXT GAME",
	  "final": "FINAL",
	  "control": "🎮 CONTROLS",
	  "p1": "PLAYER 1",
	  "p2": "PLAYER 2",
	  "p3": "PLAYER 3",
	  "p4": "PLAYER 4",
	  "up_down": "ARROW UP / ARROW DOWN"







	},
	"not_found": {
	  "title": "404",
	  "message": "Page not found",
	  "back_home": "Back to Home"
	},
	"user_profile": {
	  "title": "Profile of",
	  "back_to_chat": "← Back to chat",
	  "member_since": "Member since:",
	  "games_played": "Games played",
	  "wins": "Wins",
	  "losses": "Losses",
	  "match_history": "Match history",
	  "loading": "Loading...",
	  "no_matches": "No matches played yet",
	  "vs": "vs",
	  "error_title": "Error",
	  "username_missing": "Username missing.",
	  "back_to_home": "Back to home",
	  "profile_load_error": "Unable to load profile of",
	  "history_load_error": "Error loading history",
	  "game_invite_todo": "Game invite for {{username}} (to be implemented)"
	}
  }
};

class I18nService {
  private currentLanguage: Language = 'fr';
  private translations = translations;
  private isLoaded = false;

  async init(): Promise<void> {
	if (this.isLoaded) return;

	const savedLang = localStorage.getItem('language') as Language;
	if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
	  this.currentLanguage = savedLang;
	}

	this.isLoaded = true;
  }

  getCurrentLanguage(): Language {
	return this.currentLanguage;
  }

  async setLanguage(language: Language): Promise<void> {
	this.currentLanguage = language;
	localStorage.setItem('language', language);

	// Trigger re-render of current page
	window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }

  t(key: string, params?: Record<string, string>): string {
	const keys = key.split('.');
	let value: any = this.translations[this.currentLanguage];

	for (const k of keys) {
	  if (value && typeof value === 'object' && k in value) {
		value = value[k];
	  } else {
		console.warn(`Translation key not found: ${key} for language ${this.currentLanguage}`);
		return key;
	  }
	}

	if (typeof value !== 'string') {
	  console.warn(`Translation value is not a string: ${key}`);
	  return key;
	}

	// Simple parameter replacement
	if (params) {
	  return Object.entries(params).reduce(
		(text, [param, replacement]) => text.replace(`{{${param}}}`, replacement),
		value
	  );
	}

	return value;
  }

  getAvailableLanguages(): { code: Language; name: string }[] {
	return [
	  { code: 'fr', name: 'Français' },
	  { code: 'en', name: 'English' }
	];
  }
}

export const i18n = new I18nService();
export type { Language };