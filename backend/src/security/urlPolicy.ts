import * as dns from "dns/promises";
import * as net from "net";

function ipv4ToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const value = ipv4ToNumber(ip);
  const ranges = [
    ["10.0.0.0", 8],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.168.0.0", 16]
  ] as const;

  return ranges.some(([base, bits]) => {
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToNumber(base) & mask);
  });
}

function isBlockedAddress(address: string): boolean {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) {
    return isPrivateIpv4(address);
  }

  const normalized = address.toLowerCase();
  const ipv4MappedPrefix = "::ffff:";
  if (normalized.startsWith(ipv4MappedPrefix)) {
    const mappedAddress = normalized.slice(ipv4MappedPrefix.length);
    if (net.isIP(mappedAddress) === 4) {
      return isPrivateIpv4(mappedAddress);
    }
  }

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function getAllowedHosts(): Set<string> {
  return new Set(
    (process.env.WEBHOOK_ALLOWED_HOSTS || "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Webhook URL is invalid.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Webhook URL must not include credentials.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHosts = getAllowedHosts();
  if (allowedHosts.size > 0 && !allowedHosts.has(hostname)) {
    throw new Error("Webhook URL host is not allowlisted.");
  }

  const resolvedAddresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (resolvedAddresses.length === 0 || resolvedAddresses.some((record) => isBlockedAddress(record.address))) {
    throw new Error("Webhook URL resolves to a private, loopback, or link-local address.");
  }
}
