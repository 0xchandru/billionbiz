import { apiClient } from './client';

export interface DashboardMetricsResponse {
  metrics: {
    totalOrders: number;
    totalRevenueMinor: number;
    avgOrderValueMinor: number;
    totalCustomers: number;
    totalBookings: number;
    totalAppointmentValueMinor: number;
  };
  orderStatusDistribution: { status: string; count: string }[];
  recentOrders: {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total_minor: number;
    customer_name: string;
  }[];
  topProducts: {
    name: string;
    orders_count: string;
    revenue_minor: number;
  }[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin?: boolean;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  organization?: { id: string; name: string };
  store?: { id: string; name: string; slug: string; status: string };
  organizations?: any[];
  portalDestination?: { portal: string; url: string; path: string };
  onboardingChecklist?: any[];
}

export const api = {
  // Authentication & Identity (Streamlined & Multi-Factor)
  sendOtp: (data: { identifier: string; type?: 'REGISTER' | 'LOGIN' }) =>
    apiClient<{
      success: boolean;
      message: string;
      channel: 'EMAIL' | 'SMS';
      identifier: string;
      expiresInSeconds: number;
      devOtpPreview?: string;
    }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verifyOtp: (data: { identifier: string; code: string; type?: 'REGISTER' | 'LOGIN' }) =>
    apiClient<{
      success: boolean;
      verified?: boolean;
      token?: string;
      user?: UserProfile;
      organizations?: any[];
      portalDestination?: { portal: string; url: string; path: string };
      message: string;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  loginUnified: (data: { identifier: string; password?: string; otp?: string }) =>
    apiClient<AuthResponse>('/auth/login-unified', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  registerStreamlined: (data: {
    identifier: string;
    storeName: string;
    slug?: string;
    capabilityMode?: string;
    password?: string;
    fullName?: string;
  }) =>
    apiClient<AuthResponse>('/auth/register-streamlined', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (credentials: { email: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    storeName: string;
    capabilityMode?: string;
  }) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () =>
    apiClient<{
      user: UserProfile;
      role: string;
      storeId?: string;
      organizationId?: string;
      onboardingChecklist?: any[];
      portalDestination?: { portal: string; url: string; path: string };
      permissions?: string[];
    }>('/auth/me'),

  verifyEmail: (token: string) =>
    apiClient<{ message: string; emailVerified: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  forgotPassword: (email: string) =>
    apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { token: string; password: string }) =>
    apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  enrollMfa: () =>
    apiClient<{ secret: string; otpauthUrl: string }>('/auth/mfa/enroll', {
      method: 'POST'
    }),

  verifyMfa: (token: string) =>
    apiClient<{ message: string; mfaEnabled: boolean }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  getOnboardingChecklist: () =>
    apiClient<{ checklist: any[] }>('/auth/onboarding-checklist'),

  // Notifications
  getNotifications: () =>
    apiClient<{ notifications: any[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    apiClient<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    }),

  // Dashboard
  getDashboardMetrics: () => apiClient<DashboardMetricsResponse>('/dashboard/metrics'),

  // Catalog
  getProducts: (params?: { search?: string; status?: string; categoryId?: string }) =>
    apiClient<{ products: any[]; total: number }>('/catalog/products', { params }),
  createProduct: (product: any) =>
    apiClient<{ message: string; productId: string; variants?: any[] }>('/catalog/products', {
      method: 'POST',
      body: JSON.stringify(product)
    }),
  getCategories: () => apiClient<{ categories: any[] }>('/catalog/categories'),
  adjustInventory: (payload: { variantId: string; locationId: string; adjustmentQty: number; movementType?: string; note?: string }) =>
    apiClient('/catalog/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Orders & Customers (People)
  getCustomers: (params?: { search?: string }) =>
    apiClient<{ customers: any[]; total: number }>('/orders/customers', { params }),
  getOrders: (params?: { status?: string; search?: string }) =>
    apiClient<{ orders: any[]; total: number }>('/orders', { params }),
  getOrderById: (id: string) => apiClient<any>(`/orders/${id}`),
  createOrder: (order: any) =>
    apiClient<{ message: string; orderId: string; orderNumber: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    }),
  fulfillOrder: (id: string, fulfillment: { carrier?: string; trackingNumber?: string }) =>
    apiClient(`/orders/${id}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(fulfillment)
    }),

  // Appointments
  getOfferings: () => apiClient<{ offerings: any[] }>('/appointments/offerings'),
  getAvailability: (offeringId: string, date: string) =>
    apiClient<any>('/appointments/availability', { params: { offeringId, date } }),
  holdSlot: (payload: { offeringId: string; resourceId: string; startTime: string; endTime: string }) =>
    apiClient<{ holdToken: string; expiresAt: string }>('/appointments/holds', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createBooking: (payload: any) =>
    apiClient<{ message: string; bookingId: string; bookingNumber: string }>('/appointments/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getBookings: (params?: { from?: string; to?: string; status?: string }) =>
    apiClient<{ bookings: any[] }>('/appointments/bookings', { params }),

  // POS
  getCounters: () => apiClient<{ counters: any[] }>('/pos/counters'),
  openRegister: (counterId: string, openingFloatMinor: number) =>
    apiClient('/pos/register/open', {
      method: 'POST',
      body: JSON.stringify({ counterId, openingFloatMinor })
    }),
  getCurrentRegister: (counterId: string) =>
    apiClient<any>('/pos/register/current', { params: { counterId } }),
  closeRegister: (sessionId: string, closingCashMinor: number) =>
    apiClient<any>('/pos/register/close', {
      method: 'POST',
      body: JSON.stringify({ sessionId, closingCashMinor })
    }),
  posCheckout: (payload: any) =>
    apiClient<any>('/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Tenancy & Capabilities
  getStoreDetails: (storeId: string) => apiClient<any>(`/tenancy/stores/${storeId}`),
  updateCapabilities: (storeId: string, capabilities: { productCommerceEnabled: boolean; appointmentsEnabled: boolean; restaurantPosEnabled: boolean }) =>
    apiClient(`/tenancy/stores/${storeId}/capabilities`, {
      method: 'PATCH',
      body: JSON.stringify(capabilities)
    }),
  updateStorefrontMode: (storeId: string, payload: { mode: string; homePage?: string; navigationConfig?: any[] }) =>
    apiClient(`/tenancy/stores/${storeId}/storefront-mode`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  // Team
  getTeamMembers: () => apiClient<{ members: any[] }>('/team/members'),
  createTeamMember: (member: any) =>
    apiClient('/team/members', {
      method: 'POST',
      body: JSON.stringify(member)
    }),
  getRoles: () => apiClient<{ roles: any[] }>('/team/roles'),

  // Storefront & Publishing
  getPages: () => apiClient<{ pages: any[] }>('/storefront/pages'),
  savePageDraft: (pageId: string, sections: any[], pageProps?: any) =>
    apiClient(`/storefront/pages/${pageId}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ sections, pageProps })
    }),
  publishStore: (notes?: string) =>
    apiClient<{ message: string; releaseId: string; releaseNumber: number }>('/storefront/publish', {
      method: 'POST',
      body: JSON.stringify({ notes })
    }),
  getReleases: () => apiClient<{ releases: any[] }>('/storefront/releases'),
  restoreRelease: (releaseId: string) =>
    apiClient(`/storefront/releases/${releaseId}/restore`, {
      method: 'POST'
    }),

  // Extensions & Provider Connections (Tenant-Scoped Encrypted Records, REQ-INT-001)
  getIntegrationConnections: () => apiClient<{ connections: any[] }>('/extensions/connections'),
  saveIntegrationConnection: (payload: { providerKey: string; environment: 'TEST' | 'LIVE'; credentials: any; settings?: any }) =>
    apiClient<any>('/extensions/connections', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  testIntegrationConnection: (providerKey: string, payload: { environment?: 'TEST' | 'LIVE' } = {}) =>
    apiClient<any>(`/extensions/connections/${providerKey}/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  disconnectIntegrationConnection: (providerKey: string, payload: { environment?: 'TEST' | 'LIVE' } = {}) =>
    apiClient<any>(`/extensions/connections/${providerKey}/disconnect`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  toggleIntegrationConnection: (providerKey: string, enabled: boolean) =>
    apiClient<any>(`/extensions/connections/${providerKey}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    }),
  installExtension: (providerKey: string) =>
    apiClient<any>(`/extensions/connections/${providerKey}/install`, {
      method: 'POST'
    }),
  uninstallExtension: (providerKey: string) =>
    apiClient<any>(`/extensions/connections/${providerKey}/uninstall`, {
      method: 'POST'
    }),
  getExtensionsConfig: () => apiClient<{ extensions: any[] }>('/extensions/config'),
  createRazorpayOrder: (payload: { amountMinor: number; currency?: string; referenceId?: string; purpose?: string }) =>
    apiClient<any>('/extensions/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createShiprocketShipment: (payload: { orderId: string; weightGrams?: number }) =>
    apiClient<any>('/extensions/shiprocket/create-shipment', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
