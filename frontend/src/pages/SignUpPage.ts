// import { UserSignUpCheck } from '../../backend/src/signup/signUpCheck.ts';

export function createSignUpPage(): HTMLElement {
	const page = document.createElement("div");
	page.className =
		"min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100";

	page.innerHTML = `
		<div class="card max-w-md w-full bg-white flex flex-col items-center">
			<header class="w-full flex items-center gap-4 mb-6">
				<button class="btn" data-route="/login">← Return to login</button>
			</header>
			<h1 class="text-4xl font-bold text-center text-red-500 mb-8">Create your account</h1>
			<form class="space-y-4 w-full">
				<input type="text" placeholder="Username" id="username" required class="input">
				<input type="password" placeholder="Password" id="password" required class="input">
				<label for="avatar" class="block text-sm font-medium text-gray-700">Choose a profile picture:</label>
				<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" class="input" />
				<div class="flex justify-center">
					<img id="avatar-preview" width="200" class="border border-gray-300 rounded" />
				</div>
				<button type="submit" class="btn w-full">Sign up</button>
			</form>
		</div>
	`;

	page.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const route = target.getAttribute('data-route');
		if (route) {
			import('../router/router.js').then(({ router }) => {
				router.navigate(route);
		});
		}
	});

	console.log("LOADING SIGNUP PAGE");
	const form = page.querySelector(".space-y-4") as HTMLFormElement;
	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		console.log("SUBMIT SIGNUP FORM");
		sendSignUpInfo(page)
	});
	return page;
}

export async function sendSignUpInfo(page: HTMLDivElement): Promise<void> {
	const usernameInput = page.querySelector("#username") as HTMLInputElement;
	const passwordInput = page.querySelector("#password") as HTMLInputElement;
	const avatarInput = page.querySelector("#avatar") as HTMLInputElement;
	const avatar = avatarInput.files?.[0];

	const UserInfo = {
		username: usernameInput.value,
		password: passwordInput.value,
		avatar: avatar,
	};

	//if (UserSignUpCheck(UserInfo)){
		const user = UserInfo;
		const formData = new FormData();

		// PRINT DEBUG SIGNUP FORM
		console.log(`USERNAME: ${user.username}`);
		console.log(`PASSWORD: ${user.password}`);
		// END PRINT DEBUG SIGNUP FORM

		formData.append("username", user.username);
		formData.append("password", user.password);
		if (user.avatar) formData.append("avatar", user.avatar);

		for (const [key, value] of formData.entries()){
			console.log(key, value);
		}
		console.log("About to send response");
		const response = await fetch("/api/signup", {
			method: "POST",
			body: formData,
		});
		console.log(response);
		if (response.ok){
			import("../router/router.js").then(({ router }) => {
				router.navigate('/login');
			});
		} else {
			alert("Issue while registering");
		}
	// }
	// else {
	// 	alert("Wrong user input");
	// }
}
