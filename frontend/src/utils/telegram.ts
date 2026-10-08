export function getTelegramEnrollUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["t.me", "www.t.me", "telegram.me", "www.telegram.me"].includes(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
