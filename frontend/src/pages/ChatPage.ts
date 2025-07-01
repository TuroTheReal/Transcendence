export function createChatPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100";

	page.innerHTML = `
    <div class="card max-w-2xl w-full bg-white flex flex-col items-center">
      <header class="w-full flex items-center gap-4 mb-6">
        <button class="btn" data-route="/home">← Retour</button>
        <h2 class="text-2xl font-bold text-gray-900">Chat</h2>
      </header>
      <main class="w-full flex flex-col items-center">
        <div class="flex-1 p-4 overflow-y-auto w-full max-h-96 mb-4" id="chat-messages">
          <!-- Messages apparaîtront ici -->
        </div>
        <div class="bg-white border-t p-4 flex gap-2 w-full">
          <input type="text" placeholder="Tapez votre message..." id="message-input" class="input flex-1">
          <button id="send-message" class="btn">Envoyer</button>
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
