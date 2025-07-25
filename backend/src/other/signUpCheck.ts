interface IUserInfo {
	username: String,
	password: String,
	avatar: File | undefined,
};

function isUsernameString(user : IUserInfo): boolean {
	return typeof user.username === "string";
};

function isPasswordString(user : IUserInfo): boolean {
	return typeof user.password === "string";
};

function isUsernameAllowed(user : IUserInfo): boolean {
	const username = user.username.toString();
	const forbiddenNames = ["admin", "root", "system", "null", "undefined"];
	return !forbiddenNames.includes(username.toLowerCase()) && username.length >= 2;
};

function isPasswordLong(user : IUserInfo): boolean {
	return user.password.length >= 8;
};

function isAvatarDefined(user : IUserInfo): boolean {
	return user.avatar === undefined || user.avatar instanceof File;
};

export function UserSignUpCheck(user : IUserInfo): true | string {
    if (!isUsernameString(user)) {
        return "Username must be a string";
    }
    if (!isPasswordString(user)) {
        return "Password must be a string";
    }
    if (!isUsernameAllowed(user)) {
        return "Username must not be admin";
    }
    if (!isPasswordLong(user)) {
        return "Password must be at least 5 characters long";
    }
    return true;
}