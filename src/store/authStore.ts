import { create } from 'zustand';
import { api, type UserProfile, type AuthResponse } from '../api/services';

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  role: string | null;
  permissions: string[];
  organizationId: string | null;
  organizationName: string | null;
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  organizations: any[];
  onboardingChecklist: any[];
  portalDestination: { portal: string; url: string; path: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; destination?: string; error?: string }>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    storeName: string;
    capabilityMode?: string;
  }) => Promise<{ success: boolean; destination?: string; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  switchStore: (storeId: string, orgId?: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('billionbiz_token'),
  user: null,
  role: null,
  permissions: [],
  organizationId: localStorage.getItem('billionbiz_org_id'),
  organizationName: null,
  storeId: localStorage.getItem('billionbiz_store_id'),
  storeName: null,
  storeSlug: null,
  organizations: [],
  onboardingChecklist: [],
  portalDestination: null,
  isAuthenticated: !!localStorage.getItem('billionbiz_token'),
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res: AuthResponse = await api.login({ email, password });
      const { token, user, organizations, portalDestination } = res;

      // Extract first org & store
      const primaryOrg = organizations && organizations.length > 0 ? organizations[0] : null;
      const orgId = primaryOrg?.organization_id || 'org-billionbiz-default';
      const storeId = primaryOrg?.store_id || 'store-shoum-default';
      const storeName = primaryOrg?.store_name || 'My Store';
      const storeSlug = primaryOrg?.store_slug || 'my-store';
      const role = primaryOrg?.role || 'OWNER';

      localStorage.setItem('billionbiz_token', token);
      localStorage.setItem('billionbiz_org_id', orgId);
      localStorage.setItem('billionbiz_store_id', storeId);

      set({
        token,
        user,
        role,
        organizationId: orgId,
        organizationName: primaryOrg?.organization_name || 'Default Organization',
        storeId,
        storeName,
        storeSlug,
        organizations: organizations || [],
        portalDestination: portalDestination || null,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, destination: portalDestination?.path || '/dashboard' };
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res: AuthResponse = await api.register(payload);
      const { token, user, organization, store, onboardingChecklist, portalDestination } = res;

      const orgId = organization?.id || 'org-billionbiz-default';
      const storeId = store?.id || 'store-shoum-default';
      const storeName = store?.name || payload.storeName;
      const storeSlug = store?.slug || payload.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      localStorage.setItem('billionbiz_token', token);
      localStorage.setItem('billionbiz_org_id', orgId);
      localStorage.setItem('billionbiz_store_id', storeId);

      set({
        token,
        user,
        role: 'OWNER',
        organizationId: orgId,
        organizationName: organization?.name || payload.storeName,
        storeId,
        storeName,
        storeSlug,
        organizations: [{ organization_id: orgId, organization_name: payload.storeName, store_id: storeId, store_name: storeName }],
        onboardingChecklist: onboardingChecklist || [],
        portalDestination: portalDestination || null,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true, destination: '/dashboard' };
    } catch (err: any) {
      const message = err.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('billionbiz_token');
    localStorage.removeItem('billionbiz_org_id');
    localStorage.removeItem('billionbiz_store_id');

    set({
      token: null,
      user: null,
      role: null,
      permissions: [],
      organizationId: null,
      organizationName: null,
      storeId: null,
      storeName: null,
      storeSlug: null,
      organizations: [],
      onboardingChecklist: [],
      portalDestination: null,
      isAuthenticated: false,
      error: null
    });

    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('billionbiz_token');
    if (!token) {
      set({ isAuthenticated: false, isCheckingAuth: false });
      return false;
    }

    try {
      const res = await api.getMe();
      set({
        user: res.user,
        role: res.role,
        storeId: res.storeId || localStorage.getItem('billionbiz_store_id'),
        organizationId: res.organizationId || localStorage.getItem('billionbiz_org_id'),
        onboardingChecklist: res.onboardingChecklist || [],
        portalDestination: res.portalDestination || null,
        permissions: res.permissions || [],
        isAuthenticated: true,
        isCheckingAuth: false
      });
      return true;
    } catch (err) {
      // Token expired or invalid
      localStorage.removeItem('billionbiz_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false
      });
      return false;
    }
  },

  switchStore: (newStoreId, newOrgId) => {
    localStorage.setItem('billionbiz_store_id', newStoreId);
    if (newOrgId) {
      localStorage.setItem('billionbiz_org_id', newOrgId);
      set({ organizationId: newOrgId, storeId: newStoreId });
    } else {
      set({ storeId: newStoreId });
    }
    window.location.reload();
  },

  clearError: () => set({ error: null })
}));
