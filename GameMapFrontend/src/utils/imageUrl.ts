const API_URL = import.meta.env.VITE_API_URL;

export function getImageUrl(
  path: string | null | undefined,
): string {
  if (!path) return "";

  // Leave absolute URLs unchanged.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Prefix relative backend asset paths with the API URL.
  return `${API_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}