export function createNotFoundPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300";

	page.innerHTML = `
    <div class="card max-w-md w-full bg-white flex flex-col items-center">
      <h1 class="text-6xl font-bold text-blue-500 mb-8">404</h1>
      <p class="text-gray-700 mb-8 text-center">Page not found</p>
      <button class="btn w-full" id="back-home">Back to Home</button>
    </div>
  `;

	const btn = page.querySelector("#back-home") as HTMLButtonElement;
	btn.addEventListener("click", () => {
		import("../router/router.js").then(({ router }) => {
			router.navigate("/");
		});
	});

	return page;
}
