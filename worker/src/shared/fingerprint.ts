export async function getFingerprint(request: Request): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "";
  const raw = `${ip}|${userAgent}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashBytes = Array.from(new Uint8Array(hashBuffer));

  return hashBytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
