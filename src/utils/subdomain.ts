/**
 * BillionBiz Subdomain Routing Utility
 *
 * Resolves current portal context based on window.location.hostname
 * to support multi-subdomain routing on chandraprakash.codes:
 *
 * - chandraprakash.codes / www.chandraprakash.codes -> Root Marketing Website
 * - admin.chandraprakash.codes                      -> Merchant Admin Workspace
 * - accounts.chandraprakash.codes                   -> Centralized Authentication (Login / Register)
 * - pos.chandraprakash.codes                        -> Dedicated Cashier & Counter POS
 * - staff.chandraprakash.codes                      -> Staff Appointments & Shifts
 * - ops.chandraprakash.codes                        -> Platform Administration
 * - {slug}.stores.chandraprakash.codes              -> Customer Storefront
 */

export type SubdomainType = 'root' | 'admin' | 'accounts' | 'staff' | 'pos' | 'ops' | 'store';

export interface SubdomainInfo {
  type: SubdomainType;
  subdomain: string | null;
  storeSlug?: string;
  isSubdomain: boolean;
}

export function parseSubdomain(): SubdomainInfo {
  if (typeof window === 'undefined') {
    return { type: 'root', subdomain: null, isSubdomain: false };
  }

  const hostname = window.location.hostname.toLowerCase();

  // 1. Support local testing via query parameter: e.g. http://localhost:5173/?subdomain=admin
  const params = new URLSearchParams(window.location.search);
  const override = params.get('subdomain')?.toLowerCase();
  if (override) {
    if (override === 'admin') return { type: 'admin', subdomain: 'admin', isSubdomain: true };
    if (override === 'accounts') return { type: 'accounts', subdomain: 'accounts', isSubdomain: true };
    if (override === 'pos') return { type: 'pos', subdomain: 'pos', isSubdomain: true };
    if (override === 'staff') return { type: 'staff', subdomain: 'staff', isSubdomain: true };
    if (override === 'ops') return { type: 'ops', subdomain: 'ops', isSubdomain: true };
    if (override.startsWith('store:')) {
      const slug = override.replace('store:', '');
      return { type: 'store', subdomain: `${slug}.stores`, storeSlug: slug, isSubdomain: true };
    }
  }

  // 2. Direct localhost or IP address (without override) defaults to root
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    return { type: 'root', subdomain: null, isSubdomain: false };
  }

  const parts = hostname.split('.');

  // 3. Dynamic merchant storefront: {slug}.stores.chandraprakash.codes
  // parts: ['shoum', 'stores', 'chandraprakash', 'codes'] -> length 4
  if (parts.length >= 4 && parts[1] === 'stores') {
    return {
      type: 'store',
      subdomain: `${parts[0]}.stores`,
      storeSlug: parts[0],
      isSubdomain: true
    };
  }

  // 4. Primary architectural subdomains
  if (parts.length >= 3) {
    const sub = parts[0];
    switch (sub) {
      case 'admin':
        return { type: 'admin', subdomain: 'admin', isSubdomain: true };
      case 'accounts':
        return { type: 'accounts', subdomain: 'accounts', isSubdomain: true };
      case 'pos':
        return { type: 'pos', subdomain: 'pos', isSubdomain: true };
      case 'staff':
        return { type: 'staff', subdomain: 'staff', isSubdomain: true };
      case 'ops':
        return { type: 'ops', subdomain: 'ops', isSubdomain: true };
      case 'www':
        return { type: 'root', subdomain: null, isSubdomain: false };
    }
  }

  // Default to root marketing website
  return { type: 'root', subdomain: null, isSubdomain: false };
}

/**
 * Returns canonical destination URL for a given portal
 */
export function getPortalUrl(type: 'root' | 'admin' | 'accounts' | 'pos' | 'staff' | 'ops', path = ''): string {
  if (typeof window === 'undefined') return path;

  const baseDomain = import.meta.env.VITE_PUBLIC_DOMAIN || 'chandraprakash.codes';
  const protocol = window.location.protocol;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocal) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return type === 'root' ? cleanPath : `${cleanPath}?subdomain=${type}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (type === 'root') {
    return `${protocol}//${baseDomain}${normalizedPath}`;
  }

  return `${protocol}//${type}.${baseDomain}${normalizedPath}`;
}
