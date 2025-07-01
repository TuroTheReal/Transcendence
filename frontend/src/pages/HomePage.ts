export function createHomePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100";

	page.innerHTML = `
    <div class="card max-w-2xl w-full bg-white flex flex-col items-center">
      <h1 class="text-5xl font-bold text-blue-500 mb-8 text-center">Transcendence</h1>
      <nav class="flex flex-wrap justify-center gap-4 mb-8">
        <button class="btn" data-route="/game">Jouer</button>
        <button class="btn" data-route="/profile">Profil</button>
        <button class="btn" data-route="/chat">Chat</button>
        <button class="btn" data-route="/leaderboard">Classement</button>
      </nav>
      <h2 class="text-2xl font-semibold text-gray-900 mb-4 text-center">Bienvenue sur Transcendence</h2>
      <p class="text-gray-600 mb-8 text-center">Le jeu de Pong ultime !</p>
      <button class="btn text-lg px-8 py-3 w-full max-w-xs" data-route="/game">Commencer une partie</button>
    </div>
  `;

	// Navigation
	page.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			// Find the targeted route and navigate to it
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}
