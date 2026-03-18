// Configured via VITE_MAIN_DOMAINS in .env (comma-separated)
// Example: VITE_MAIN_DOMAINS=localhost,bookvisit.com,reservemisha.com
const MAIN_DOMAINS: string[] = (import.meta.env.VITE_MAIN_DOMAINS || 'localhost')
  .split(',')
  .map((d: string) => d.trim().toLowerCase())
  .filter(Boolean);

export function getCurrentSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase();

  for (const main of MAIN_DOMAINS) {
    if (hostname === main || hostname === `www.${main}`) return null;
    if (hostname.endsWith('.' + main)) {
      const sub = hostname.slice(0, hostname.length - main.length - 1);
      if (sub && sub !== 'www') return sub;
    }
  }

  return null;
}

export function isOnSubdomain(): boolean {
  return getCurrentSubdomain() !== null;
}

export function getMainDomainUrl(): string {
  const proto = window.location.protocol;
  const port = window.location.port ? ':' + window.location.port : '';
  const hostname = window.location.hostname.toLowerCase();

  // Find which main domain we're on (or a subdomain of)
  for (const main of MAIN_DOMAINS) {
    if (hostname === main || hostname === `www.${main}` || hostname.endsWith('.' + main)) {
      return `${proto}//${main}${port}`;
    }
  }
  return `${proto}//${MAIN_DOMAINS[0]}${port}`;
}

export function getSubdomainUrl(slug: string): string {
  const proto = window.location.protocol;
  const port = window.location.port ? ':' + window.location.port : '';
  const hostname = window.location.hostname.toLowerCase();

  // Find which main domain we're on and build subdomain URL for it
  for (const main of MAIN_DOMAINS) {
    if (hostname === main || hostname === `www.${main}` || hostname.endsWith('.' + main)) {
      return `${proto}//${slug}.${main}${port}`;
    }
  }
  return `${proto}//${slug}.${MAIN_DOMAINS[0]}${port}`;
}
