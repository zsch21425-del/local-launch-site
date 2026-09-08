/**
 * Centralised, fail-closed resolver for the Supervisor relay + CRM base URLs.
 *
 * Contact data, draft pitch bodies and full work orders travel over these
 * links, so plaintext HTTP to a public host is refused: callers get `null` and
 * MUST skip the relay/CRM call (reporting `relayed:false` /
 * `relayError:"relay not configured (HTTPS required)"`) rather than send in the
 * clear. Allowed transports: `https://` to any host, or `http://` to an
 * explicit loopback host (127.0.0.1 / localhost / [::1]) for local dev.
 * Malformed URLs always resolve to `null`.
 */

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "127.0.0.1" || h === "localhost" || h === "[::1]" || h === "::1";
}

/** Returns the normalised URL string when safe for sensitive payloads, else null. */
function secureBase(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  const ok =
    u.protocol === "https:" ||
    (u.protocol === "http:" && isLoopbackHost(u.hostname));
  if (!ok) return null;
  return trimmed.replace(/\/+$/, "");
}

/** Supervisor relay base URL (no trailing slash), or null if unset/insecure. */
export function getRelayUrl(): string | null {
  return secureBase(process.env.SUPERVISOR_RELAY_URL || "");
}

/** CRM API base URL (no trailing slash), or null if unset/insecure. */
export function getCrmBaseUrl(): string | null {
  return secureBase(process.env.CRM_ENDPOINT || process.env.CRM_API_URL || "");
}

/** Shared inbound-auth token for the Supervisor relay (X-Relay-Token header). */
export function getRelayToken(): string {
  return process.env.RELAY_TOKEN || "";
}
