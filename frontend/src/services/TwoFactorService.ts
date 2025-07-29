/**
 * Frontend service for Two-Factor Authentication operations
 *
 * Provides methods to interact with the backend 2FA API endpoints
 * for both TOTP (authenticator app) and email-based 2FA.
 */

/**
 * Get the current 2FA status for a user
 *
 * @param userId - The ID of the user
 * @returns Promise containing the 2FA status
 */
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

/**
 * Setup TOTP (Time-based One-Time Password) for authenticator apps
 *
 * @param userId - The ID of the user
 * @returns Promise containing the QR code URL and secret
 *
 * @example
 * ```ts
 * const { otpauth_url, secret } = await setupTOTP(123);
 * // Show QR code to user using otpauth_url
 * ```
 */
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

/**
 * Verify TOTP code and enable TOTP 2FA
 *
 * @param userId - The ID of the user
 * @param code - The 6-digit TOTP code from authenticator app
 * @returns Promise containing the result
 */
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

/**
 * Send 2FA code via email
 *
 * @param userId - The ID of the user
 * @returns Promise containing the result
 */
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

/**
 * Verify email 2FA code and enable email 2FA
 *
 * @param userId - The ID of the user
 * @param code - The 6-digit code received via email
 * @returns Promise containing the result
 */
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

/**
 * Disable 2FA for a user
 *
 * @param userId - The ID of the user
 * @param password - The user's current password for verification
 * @returns Promise containing the result or error
 */
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

/**
 * Verify 2FA code during login process
 *
 * @param username - The username attempting to login
 * @param code - The 2FA code (email or TOTP)
 * @returns Promise containing the authentication result
 */
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
