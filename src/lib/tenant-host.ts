export const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "support", "mail", "assets", "status"]);

export function tenantFromHost(host: string, rootDomain: string): string | null {
  const hostname = host.toLowerCase().split(":")[0].replace(/\.$/, "");
  const root = rootDomain.toLowerCase().split(":")[0].replace(/\.$/, "");
  if (!root || !hostname.endsWith(`.${root}`)) return null;
  const tenant = hostname.slice(0, -(root.length + 1));
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(tenant) || RESERVED_SUBDOMAINS.has(tenant)) return null;
  return tenant;
}
