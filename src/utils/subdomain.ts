/**
 * BillionBiz Subdomain Routing Utility
 *
 * Resolves portal context based on window.location.hostname and pathname.
 * Supports smooth, instant navigation on local/preview environments
 * while enforcing strict subdomain security on production:
 *
 * - chandraprakash.codes / www.chandraprakash.codes -> Root Marketing Website
 * - admin.chandraprakash.codes                      -> Merchant Admin Workspace & Admin Login
 * - accounts.chandraprakash.codes                   -> Redirects to admin.chandraprakash.codes/login
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
  isLocal: boolean;
}

/**
 * Checks whether the current runtime is local, an IP, preview, or tunnel
 */
export function isLocalOrPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.ngrok-free.app') ||
    hostname.endsWith('.ngrok.io')
  );
}

export function parseSubdomain(): SubdomainInfo {
  if (typeof window === 'undefined') {
    return { type: 'root', subdomain: null, isSubdomain: false, isLocal: false };
  }

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const isLocal = isLocalOrPreview();

  // 1. Explicit query parameter override (e.g. ?subdomain=admin)
  const params = new URLSearchParams(window.location.search);
  const override = params.get('subdomain')?.toLowerCase();
  if (override) {
    if (override === 'admin') return { type: 'admin', subdomain: 'admin', isSubdomain: true, isLocal };
    if (override === 'accounts') return { type: 'accounts', subdomain: 'accounts', isSubdomain: true, isLocal };
    if (override === 'pos') return { type: 'pos', subdomain: 'pos', isSubdomain: true, isLocal };
    if (override === 'staff') return { type: 'staff', subdomain: 'staff', isSubdomain: true, isLocal };
    if (override === 'ops') return { type: 'ops', subdomain: 'ops', isSubdomain: true, isLocal };
    if (override.startsWith('store:')) {
      const slug = override.replace('store:', '');
      return { type: 'store', subdomain: `${slug}.stores`, storeSlug: slug, isSubdomain: true, isLocal };
    }
  }

  // 2. Local / Single-Origin / Preview environment: route seamlessly by path with NO forced reloads!
  if (isLocal) {
    if (pathname.startsWith('/pos')) {
      return { type: 'pos', subdomain: 'pos', isSubdomain: false, isLocal: true };
    }
    if (pathname.startsWith('/staff')) {
      return { type: 'staff', subdomain: 'staff', isSubdomain: false, isLocal: true };
    }
    if (pathname.startsWith('/ops')) {
      return { type: 'ops', subdomain: 'ops', isSubdomain: false, isLocal: true };
    }
    if (pathname.startsWith('/store/')) {
      const slug = pathname.split('/')[2];
      return { type: 'store', subdomain: slug ? `${slug}.stores` : 'store', storeSlug: slug, isSubdomain: false, isLocal: true };
    }
    // Auth & Merchant Admin paths route directly to admin on localhost/preview
    const isAdminPath =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/verify-email' ||
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/appointments') ||
      pathname.startsWith('/people') ||
      pathname.startsWith('/pages') ||
      pathname.startsWith('/pos-counters') ||
      pathname.startsWith('/extensions') ||
      pathname.startsWith('/team') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/editor');

    if (isAdminPath) {
      return { type: 'admin', subdomain: 'admin', isSubdomain: false, isLocal: true };
    }

    // Default root path on local is marketing landing
    return { type: 'root', subdomain: null, isSubdomain: false, isLocal: true };
  }

  // 3. Dynamic merchant storefront: {slug}.stores.chandraprakash.codes
  const parts = hostname.split('.');
  if (parts.length >= 4 && parts[1] === 'stores') {
    return {
      type: 'store',
      subdomain: `${parts[0]}.stores`,
      storeSlug: parts[0],
      isSubdomain: true,
      isLocal: false
    };
  }

  // 4. Primary production subdomains on chandraprakash.codes
  if (parts.length >= 3) {
    const sub = parts[0];
    switch (sub) {
      case 'admin':
        return { type: 'admin', subdomain: 'admin', isSubdomain: true, isLocal: false };
      case 'accounts':
        return { type: 'accounts', subdomain: 'accounts', isSubdomain: true, isLocal: false };
      case 'pos':
        return { type: 'pos', subdomain: 'pos', isSubdomain: true, isLocal: false };
      case 'staff':
        return { type: 'staff', subdomain: 'staff', isSubdomain: true, isLocal: false };
      case 'ops':
        return { type: 'ops', subdomain: 'ops', isSubdomain: true, isLocal: false };
      case 'www':
        return { type: 'root', subdomain: null, isSubdomain: false, isLocal: false };
    }
  }

  // Default to root marketing website
  return { type: 'root', subdomain: null, isSubdomain: false, isLocal: false };
}

/**
 * Returns canonical destination URL for a given portal
 */
export function getPortalUrl(type: 'root' | 'admin' | 'accounts' | 'pos' | 'staff' | 'ops', path = ''): string {
  if (typeof window === 'undefined') return path;

  const baseDomain = import.meta.env.VITE_PUBLIC_DOMAIN || 'chandraprakash.codes';
  const protocol = window.location.protocol;
  const isLocal = isLocalOrPreview();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (isLocal) {
    // In local development or single-origin preview, keep routing clean without hard domain hops
    if (type === 'pos' && !cleanPath.startsWith('/pos')) return `/pos${cleanPath === '/' ? '' : cleanPath}`;
    if (type === 'staff' && !cleanPath.startsWith('/staff')) return `/staff${cleanPath === '/' ? '' : cleanPath}`;
    if (type === 'ops' && !cleanPath.startsWith('/ops')) return `/ops${cleanPath === '/' ? '' : cleanPath}`;
    return cleanPath;
  }

  if (type === 'root') {
    return `${protocol}//${baseDomain}${cleanPath}`;
  }

  return `${protocol}//${type}.${baseDomain}${cleanPath}`;
}
