import { UserInfo } from "os";

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

function isPasswordLong(user : IUserInfo): boolean {
	return user.password.length >= 5;
};

function isAvatarDefined(user : IUserInfo): boolean {
	return user.avatar === undefined || user.avatar instanceof File;
};

function UserSignUpCheck(user : IUserInfo): boolean {
	if (!isUsernameString(user)) {
		alert("Username must be a string");
		return false;
	}
	if (!isPasswordString(user)) {
		alert("Password must be a string");
		return false;
	}
	if (!isPasswordLong(user)) {
		alert("Password must be at least 5 characters long");
		return false;
	}
	if (!isAvatarDefined(user)) {
		alert("Avatar must be a File ou undefined");
		return false;
	}
	return true;
}