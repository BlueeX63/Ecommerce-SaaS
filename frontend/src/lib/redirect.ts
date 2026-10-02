/** Only allow same-site relative redirects (prevents open redirects through ?next= / ?callbackUrl=). */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
