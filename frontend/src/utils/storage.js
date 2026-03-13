export const USERS_KEY = "registered_users";
export const THEME_KEY = "darkMode";
export const CURRENT_USER_KEY = "currentUser";

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) === "true";
}

export function saveTheme(isDark) {
  localStorage.setItem(THEME_KEY, isDark ? "true" : "false");
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(CURRENT_USER_KEY);
}
