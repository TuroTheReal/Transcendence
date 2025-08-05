
export async function get2FAStatus(
	userId: number
): Promise<{ enabled: boolean; type?: "email" | "totp" }> {
	try {
		const response = await fetch(`/api/user/${userId}/2fa/status`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to get 2FA status");
		}

		return await response.json();
	} catch (error) {
		console.error("Error getting 2FA status:", error);
		throw error;
	}
}


export async function setupTOTP(
	userId: number
): Promise<{ otpauth_url: string; secret: string }> {
	try {
		const response = await fetch("/api/2fa/totp/setup", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId }),
		});

		if (!response.ok) {
			throw new Error("Failed to setup TOTP");
		}

		return await response.json();
	} catch (error) {
		console.error("Error setting up TOTP:", error);
		throw error;
	}
}


export async function verifyTOTP(
	userId: number,
	code: string
): Promise<{ message: string }> {
	try {
		const response = await fetch("/api/2fa/totp/verify", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId, code }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to verify TOTP");
		}

		return await response.json();
	} catch (error) {
		console.error("Error verifying TOTP:", error);
		throw error;
	}
}


export async function send2FACode(
	userId: number
): Promise<{ message: string }> {
	try {
		const response = await fetch("/api/2fa/email/send", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to send 2FA code");
		}

		return await response.json();
	} catch (error) {
		console.error("Error sending 2FA code:", error);
		throw error;
	}
}

export async function verifyEmail2FA(
	userId: number,
	code: string
): Promise<{ message: string }> {
	try {
		const response = await fetch("/api/2fa/email/verify", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId, code }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to verify email 2FA");
		}

		return await response.json();
	} catch (error) {
		console.error("Error verifying email 2FA:", error);
		throw error;
	}
}


export async function disable2FA(
	userId: number,
	password: string
): Promise<{ message?: string; error?: string }> {
	try {
		const response = await fetch("/api/2fa/disable", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId, password }),
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || "Failed to disable 2FA" };
		}

		return result;
	} catch (error) {
		console.error("Error disabling 2FA:", error);
		return { error: "Network error occurred" };
	}
}


export async function verify2FALogin(
	username: string,
	code: string
): Promise<{ success: boolean; token?: string; message?: string }> {
	try {
		const response = await fetch("/api/2fa/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, code }),
		});

		return await response.json();
	} catch (error) {
		console.error("Error verifying 2FA login:", error);
		return {
			success: false,
			message: "Network error occurred",
		};
	}
}
