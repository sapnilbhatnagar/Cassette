const USER_KEY = "cassette-user";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  provider: "credentials" | "google";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(USER_KEY) !== null;
}

export function getCurrentUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "admin";
}
