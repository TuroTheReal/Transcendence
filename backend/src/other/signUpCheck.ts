interface IUserInfo {
	username: String,
	password: String,
	avatar: File | undefined,
	email: string,
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

function isEmailString(user: IUserInfo): boolean {
  return typeof user.email === "string";
}

function isEmailFormatValid(user: IUserInfo): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(user.email.toString());
}

function isEmailLengthValid(user: IUserInfo): boolean {
	const email = user.email.toString();
	return email.length >= 5 && email.length <= 254;
}

export function UserSignUpCheck(user: IUserInfo): true | string {
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
    return "Password must be at least 8 characters long";
  }
  if (!isEmailString(user)){
	return "Email must be a string";
  }
  if (!isEmailFormatValid(user)) {
    return "Email format is invalid";
  }
  if (!isEmailLengthValid(user)) {
    return "Email length must be between 5 and 254 characters";
  }

  return true;
}