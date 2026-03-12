export function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (err) {
    console.error("Invalid JSON:", value);
    return fallback;
  }
}
