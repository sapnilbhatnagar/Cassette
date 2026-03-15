import crypto from "crypto";

const SALT = "cassette-demo-salt-2024";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  provider: "credentials" | "google";
  googleId?: string;
  createdAt: string;
}

export interface LoginRecord {
  userId: string;
  username: string;
  email: string;
  provider: "credentials" | "google";
  timestamp: string;
}

export type SafeUser = Omit<User, "passwordHash">;

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + SALT)
    .digest("hex");
}

// --------------- In-memory store (seeded with admin) ---------------

const users: User[] = [
  {
    id: "admin-001",
    username: "Admin",
    email: "admin@cassette.ai",
    passwordHash: hashPassword("Password"),
    role: "admin",
    provider: "credentials",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const loginHistory: LoginRecord[] = [];

// --------------- Queries ---------------

export function findUserByUsername(username: string): User | undefined {
  return users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByGoogleId(googleId: string): User | undefined {
  return users.find((u) => u.googleId === googleId);
}

// --------------- Auth ---------------

export function validateCredentials(
  username: string,
  password: string
): User | null {
  const user = findUserByUsername(username);
  if (!user || user.provider === "google") return null;
  return user.passwordHash === hashPassword(password) ? user : null;
}

export function createUser(
  username: string,
  email: string,
  password: string
): { user?: User; error?: string } {
  if (findUserByUsername(username)) {
    return { error: "Username already taken" };
  }
  if (findUserByEmail(email)) {
    return { error: "Email already registered" };
  }
  const user: User = {
    id: `user-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    username,
    email,
    passwordHash: hashPassword(password),
    role: "user",
    provider: "credentials",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return { user };
}

export function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string
): User {
  // Already linked
  const byGoogle = findUserByGoogleId(googleId);
  if (byGoogle) return byGoogle;

  // Same email — link Google account
  const byEmail = findUserByEmail(email);
  if (byEmail) {
    byEmail.googleId = googleId;
    return byEmail;
  }

  // Brand-new user
  const user: User = {
    id: `user-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    username: name || email.split("@")[0],
    email,
    passwordHash: "",
    role: "user",
    provider: "google",
    googleId,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: "User not found" };

  // Google-only user setting a password for the first time
  if (user.provider === "google" && !user.passwordHash) {
    user.passwordHash = hashPassword(newPassword);
    user.provider = "credentials"; // now has both
    return { success: true };
  }

  if (user.passwordHash !== hashPassword(oldPassword)) {
    return { success: false, error: "Current password is incorrect" };
  }
  user.passwordHash = hashPassword(newPassword);
  return { success: true };
}

// --------------- Login history ---------------

export function recordLogin(
  user: User,
  provider: "credentials" | "google"
): void {
  loginHistory.unshift({
    userId: user.id,
    username: user.username,
    email: user.email,
    provider,
    timestamp: new Date().toISOString(),
  });
  if (loginHistory.length > 200) loginHistory.length = 200;
}

export function getLoginHistory(): LoginRecord[] {
  return [...loginHistory];
}

export function getAllUsers(): SafeUser[] {
  return users.map(({ passwordHash: _, ...rest }) => rest);
}

// --------------- Helpers ---------------

export function stripPassword(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
