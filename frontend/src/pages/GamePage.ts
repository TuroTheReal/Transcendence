export function createGamePage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100";

	page.innerHTML = `
    <div class="card max-w-2xl w-full bg-white flex flex-col items-center">
      <header class="w-full flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button class="btn" data-route="/home">← Retour</button>
          <h2 class="text-2xl font-bold text-gray-900">Pong Game</h2>
        </div>
        <div class="text-xl font-bold text-gray-900">
          <span id="player1-score">0</span> - <span id="player2-score">0</span>
        </div>
      </header>
      <main class="flex flex-col items-center w-full">
        <canvas id="pong-canvas" width="800" height="400" class="border border-gray-300 bg-white mb-4"></canvas>
        <div class="flex gap-4">
          <button id="start-game" class="btn">Démarrer</button>
          <button id="pause-game" class="btn bg-gray-500 hover:bg-gray-600">Pause</button>
        </div>
      </main>
    </div>
  `;

	page.addEventListener("click", (e) => {
		/*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
		const target = e.target as HTMLElement;
		const route = target.getAttribute("data-route");
		if (route) {
			import("../router/router.js").then(({ router }) => {
				router.navigate(route);
			});
		}
	});

	return page;
}
