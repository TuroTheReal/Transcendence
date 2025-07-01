export function createLoginPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100";

	page.innerHTML = `
    <div class="card max-w-md w-full bg-white">
      <h1 class="text-6xl text-center text-blue-500 mb-8">Transcendence</h1>
      <form class="space-y-4">
        <input type="text" placeholder="Username" id="username" required class="input">
        <input type="password" placeholder="Password" id="password" required class="input">
        <button type="submit" id="login-btn" class="btn w-full">Log in</button>
      </form>
      <button type="button" id="register-btn" class="btn w-full mt-4 bg-gray-500 hover:bg-gray-600">Sign up</button>
    </div>
  `;
	console.log("DEBUGGING LOGIN");
	navigateToSignUp(page);
	const form = page.querySelector('.space-y-4') as HTMLFormElement;
	console.log("DEBUGGING 1");
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		console.log("DEBUGGING 2");
		sendLogInInfo(page);
	});
	return page;
}

function navigateToSignUp(page: HTMLDivElement){
  const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
  signupBtn.addEventListener("click", () => {
	import("../router/router.js").then(({ router }) => {
		router.navigate("/signup");
		});
  	});
}

async function sendLogInInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;

	console.log("DEBUGGING 3");
	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
	};
	console.log("DEBUGGING 5");
	const response = await fetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(UserInfo),
	});
	const data = await response.json();
	if (data.ok || data.success){
		localStorage.setItem("username", UserInfo.username);
		//localStorage.setItem("jwt", data.token);
		import("../router/router.js").then(({ router }) => {
			router.navigate('/home');
		});
	} else {
		alert("Issue while logging in");
	}
}
